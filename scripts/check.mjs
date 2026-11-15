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
const USB_POLICIES = ['/ultimate_usb_privacy.html', '/drofus_privacy.html', '/ventoy_privacy.html', '/usb_tools_privacy.html',
  '/iso2usb_privacy.html', '/multios_usb_privacy.html'];
const AD_SUPPORTED = ['/privacy_policy.html', '/tumtum_privacy.html', '/mixdocs_privacy.html', '/chaome_privacy.html', '/usb_file_manager_privacy.html', ...USB_POLICIES];
for (const page of ['/privacy_policy.html', '/tumtum_privacy.html', '/mixdocs_privacy.html', '/cofferlock_privacy.html', '/chaome_privacy.html', '/usb_file_manager_privacy.html', ...USB_POLICIES]) {
  const html = pages[page] || '';
  for (const [name, re] of Object.entries(POLICY_RULES)) if (!re.test(html)) bad(`${page}: privacy policy lacks ${name}`);
  if (AD_SUPPORTED.includes(page)) for (const [name, re] of Object.entries(AD_RULES)) if (!re.test(html)) bad(`${page}: ad-supported app policy lacks ${name}`);
}

// ---- 4. URLs that live outside this repo (Play listings, apps) must keep working
for (const u of ['/privacy_policy.html', '/privacy_policy', '/tumtum_privacy.html', '/mixdocs_privacy.html',
  '/cofferlock_privacy.html', '/chaome_privacy.html', '/usb_file_manager_privacy.html', ...USB_POLICIES, '/contact.html', '/app-ads.txt', '/robots.txt', '/sitemap.xml', '/CNAME']) {
  if (!target(u)) bad(`required URL missing: ${u}`);
}

// ---- 5. search-engine signals: self canonical, reciprocal hreflang, sitemap coverage, valid JSON-LD
const SITE = 'https://www.mixapplications.com';
const sitemap = fs.readFileSync(path.join(OUT, 'sitemap.xml'), 'utf8');
const inSitemap = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]));
const urlFor = f => SITE + rel(f).replace(/(^|\/)index\.html$/, '$1');
const alternatesOf = html => new Map([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map(m => [m[1], m[2]]));
let ldBlocks = 0;
for (const f of htmlFiles) {
  const html = fs.readFileSync(f, 'utf8');
  const url = urlFor(f);
  const head = html.match(/<head>[\s\S]*<\/head>/);
  if (!head) {   // not a page (e.g. the Search Console verification file)
    if (inSitemap.has(url)) bad(`${rel(f)}: file without <head> is in the sitemap`);
    continue;
  }
  if (/<meta name="robots"[^>]*noindex/.test(html)) {
    if (inSitemap.has(url)) bad(`${rel(f)}: noindex page is in the sitemap`);
    continue;
  }
  const canon = html.match(/<link rel="canonical" href="([^"]+)">/);
  if (!canon || canon[1] !== url) bad(`${rel(f)}: canonical ${canon ? canon[1] : '(none)'} is not the page itself`);
  if (!inSitemap.has(url)) bad(`${rel(f)}: indexable page missing from sitemap.xml`);
  if (/nosnippet|max-snippet|nofollow/.test(head[0])) bad(`${rel(f)}: snippet/follow restriction in <head>`);
  const alts = alternatesOf(html);
  if (alts.size) {
    if (![...alts.values()].includes(url)) bad(`${rel(f)}: hreflang set does not include the page itself`);
    if (alts.get('x-default') !== alts.get('en')) bad(`${rel(f)}: x-default is not the English page`);
    for (const [lang, href] of alts) {
      const target = path.join(OUT, href.slice(SITE.length).replace(/\/$/, '/index.html'));
      if (!fs.existsSync(target)) { bad(`${rel(f)}: hreflang ${lang} -> missing ${href}`); continue; }
      const back = alternatesOf(fs.readFileSync(target, 'utf8'));
      if ([...alts].some(([l, h]) => back.get(l) !== h)) bad(`${rel(f)}: hreflang ${lang} -> ${href} does not link back with the same set`);
      const lm = fs.readFileSync(target, 'utf8').match(/<html lang="([^"]+)"/);
      if (lang !== 'x-default' && (!lm || lm[1] !== lang)) bad(`${href}: <html lang> is ${lm && lm[1]}, hreflang says ${lang}`);
    }
  }
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    ldBlocks++;
    try {
      const ld = JSON.parse(m[1]);
      if (ld['@context'] !== 'https://schema.org' || !ld['@type']) bad(`${rel(f)}: JSON-LD without schema.org @context/@type`);
      if (ld.aggregateRating) bad(`${rel(f)}: aggregateRating (ratings from Google Play may not be marked up)`);
    } catch (e) { bad(`${rel(f)}: JSON-LD does not parse: ${e.message}`); }
  }
}
for (const loc of inSitemap) {
  const p = loc.slice(SITE.length);
  if (!fs.existsSync(path.join(OUT, p.endsWith('/') ? p + 'index.html' : p))) bad(`sitemap lists a missing page: ${loc}`);
}
for (const f of ['robots.txt', 'llms.txt']) if (!fs.existsSync(path.join(OUT, f))) bad(`missing /${f}`);
if (!/^Sitemap: https:\/\/www\.mixapplications\.com\/sitemap\.xml$/m.test(fs.readFileSync(path.join(OUT, 'robots.txt'), 'utf8'))) bad('robots.txt has no Sitemap line');
if (/^Disallow:\s*\/\S*/m.test(fs.readFileSync(path.join(OUT, 'robots.txt'), 'utf8'))) bad('robots.txt disallows a path');

if (problems.length) {
  console.error('\nCHECK FAILED:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log(`check passed: ${htmlFiles.length} pages valid, all links and anchors resolve, app data consistent, ${inSitemap.size} sitemap URLs, canonicals + hreflang reciprocal, ${ldBlocks} JSON-LD blocks parse`);
