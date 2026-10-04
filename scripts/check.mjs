// Checks the built site in _site/. Exits non-zero on any problem.
//  1. HTML validity (html-validate, config in .htmlvalidate.json)
//  2. every internal link, image, script and #anchor resolves
//  3. app data is consistent: every live/soon app with a support family has
//     answers on the support page, and every policy it names exists
//  4. the URLs the Google Play listings point at still exist
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HtmlValidate, FileSystemConfigLoader, formatterFactory } from 'html-validate';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '_site');
const problems = [];
const bad = msg => problems.push(msg);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
if (!fs.existsSync(OUT)) { console.error('no _site/ — run npm run build first'); process.exit(1); }
const files = walk(OUT);
const htmlFiles = files.filter(f => f.endsWith('.html'));
const rel = f => '/' + path.relative(OUT, f).split(path.sep).join('/');

// ---- 1. HTML validity
const loader = new FileSystemConfigLoader();
const validator = new HtmlValidate(loader);
const results = [];
for (const f of htmlFiles) {
  const report = await validator.validateFile(f);
  if (!report.valid) results.push(...report.results);
}
if (results.length) {
  console.error(formatterFactory('stylish')(results));
  bad(`${results.reduce((n, r) => n + r.errorCount, 0)} HTML validation error(s)`);
}

// ---- 2. links and anchors
const ids = {};
const pages = {};
for (const f of htmlFiles) {
  const html = fs.readFileSync(f, 'utf8');
  pages[rel(f)] = html;
  ids[rel(f)] = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
}
function target(p) {
  const clean = decodeURIComponent(p.split('?')[0].split('#')[0]);
  for (const c of [clean, clean + '.html', clean.replace(/\/?$/, '/index.html')]) {
    const full = path.join(OUT, c);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) return '/' + path.relative(OUT, full).split(path.sep).join('/');
  }
  return null;
}
for (const [page, html] of Object.entries(pages)) {
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|tel:|data:)/.test(url)) continue;
    const abs = url.startsWith('#') ? page + url : url.startsWith('/') ? url : path.posix.join(path.posix.dirname(page), url);
    const t = target(abs);
    if (!t) { bad(`${page}: broken link ${url}`); continue; }
    const hash = abs.split('#')[1];
    if (hash && t.endsWith('.html') && !ids[t]?.has(hash)) bad(`${page}: missing anchor ${url}`);
  }
}

// ---- 3. app data consistency
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/apps.json'), 'utf8'));
const support = pages['/contact.html'] || '';
const families = new Set(data.faqFamilies.map(f => f.id));
const playApps = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/play.json'), 'utf8')).apps || {};
for (const a of data.apps) {
  if (a.faq && !families.has(a.faq)) bad(`app ${a.id}: unknown faq family ${a.faq}`);
  if (a.policy && !target('/' + a.policy)) bad(`app ${a.id}: policy ${a.policy} does not exist`);
  // on Google Play now, or listed as live before: either way it keeps a page
  if ((playApps[a.pkg] || a.status === 'live') && !target(`/apps/${a.id}.html`)) bad(`app ${a.id}: no app page`);
}
for (const pkg of Object.keys(playApps)) {
  if (!pages['/index.html'].includes(`https://play.google.com/store/apps/details?id=${pkg}"`)) bad(`${pkg} is on Google Play but not on the home page`);
}
const shownFamilies = [...support.matchAll(/<button type="button" data-app="([^"]+)"/g)].map(m => m[1]).filter(f => f !== 'all');
for (const f of shownFamilies) {
  if (!families.has(f)) bad(`support page offers an unknown app family ${f}`);
  const n = [...support.matchAll(/<details class="q"[^>]*data-app="([^"]*)"/g)].filter(m => m[1].split(/\s+/).includes(f)).length;
  if (!n) bad(`support page has no answers for app family ${f}`);
}
if ((support.match(/<details class="q"(?![^>]*data-app=)/g) || []).length) bad('support page has answers without data-app');

// ---- 3b. every Play listing's privacy-policy URL that points at this site must exist,
//          and every published app must have a privacy policy at all (Google Play requires one)
const play = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/play.json'), 'utf8')).apps || {};
for (const [pkg, p] of Object.entries(play)) {
  if (!p.privacyPolicy) { bad(`${pkg}: its Google Play listing has no privacy-policy URL`); continue; }
  const m = p.privacyPolicy.match(/^https?:\/\/(?:www\.)?mixapplications\.com(\/[^?#]*)?/i);
  if (m && !target(m[1] || '/')) bad(`${pkg}: its Google Play listing links ${p.privacyPolicy}, which this site does not have`);
}

// ---- 3c. every privacy policy keeps what Google Play's User Data policy, AdMob and
//          Google Checks look for; policies of ad-supported apps also need the ad disclosures
const POLICY_RULES = {
  'contact email': /mailto:[^"]+@/,
  'last-updated date': /Last updated: [A-Z][a-z]+ \d{1,2}, \d{4}/,
  'data types collected and shared': /Data Types Collected and Shared/i,
  'security practices': /<h[23][^>]*>[^<]*Security/i,
  'retention and deletion': /Retention/i,
  'children': /child/i,
  'international transfers': /International data transfers/i,
  'request response time': /within 30 days/i,
  'GDPR / CCPA rights': /GDPR[\s\S]*CCPA/,
};
const AD_RULES = {
  'Google partner-sites link': /policies\.google\.com\/technologies\/partner-sites/,
  'My Ad Center opt-out': /myadcenter\.google\.com/,
  'advertising ID and cookies disclosure': /advertising ID[\s\S]{0,200}cookies/i,
};
const AD_SUPPORTED = ['/privacy_policy.html', '/tumtum_privacy.html', '/mixdocs_privacy.html', '/chaome_privacy.html'];
for (const page of ['/privacy_policy.html', '/tumtum_privacy.html', '/mixdocs_privacy.html', '/cofferlock_privacy.html', '/chaome_privacy.html']) {
  const html = pages[page] || '';
  for (const [name, re] of Object.entries(POLICY_RULES)) if (!re.test(html)) bad(`${page}: privacy policy lacks ${name}`);
  if (AD_SUPPORTED.includes(page)) for (const [name, re] of Object.entries(AD_RULES)) if (!re.test(html)) bad(`${page}: ad-supported app policy lacks ${name}`);
}

// ---- 4. URLs that live outside this repo (Play listings, apps) must keep working
for (const u of ['/privacy_policy.html', '/privacy_policy', '/tumtum_privacy.html', '/mixdocs_privacy.html',
  '/cofferlock_privacy.html', '/chaome_privacy.html', '/contact.html', '/app-ads.txt', '/robots.txt', '/sitemap.xml', '/CNAME']) {
  if (!target(u)) bad(`required URL missing: ${u}`);
}

if (problems.length) {
  console.error('\nCHECK FAILED:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log(`check passed: ${htmlFiles.length} pages valid, all links and anchors resolve, app data consistent`);
