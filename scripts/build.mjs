// Builds the site from src/ into _site/. No dependencies; Node 20+.
//
//   node scripts/build.mjs          build, and refresh src/i18n/_source.en.json
//   node scripts/build.mjs --ci     build without touching src/ (warns if _source.en.json is stale)
//
// What it does:
//  - renders every page through one layout (src/templates), with app data from
//    src/data/apps.json and live Google Play data from src/data/play.json
//  - versions CSS/JS URLs by content hash, so browsers never keep a stale copy
//  - extracts every translatable string (data-i18n / -ph / -tpl) into
//    _source.en.json, and ships each translation only for keys whose English
//    still matches what was translated (src/i18n/_basis.en.json); a changed
//    English string falls back to English until it is translated again
//  - writes sitemap.xml
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { layout } from '../src/templates/layout.mjs';
import { ICON } from '../src/templates/layout.mjs';
import * as pages from '../src/templates/pages.mjs';
import { SITE } from '../src/templates/layout.mjs';
import { playText } from '../src/templates/util.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, '_site');
const CI = process.argv.includes('--ci');

const read = p => fs.readFileSync(path.join(SRC, p), 'utf8');
const readJson = p => JSON.parse(read(p));
const write = (rel, data) => {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, data);
};
function copyDir(from, to) {
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) { fs.mkdirSync(b, { recursive: true }); copyDir(a, b); }
    else fs.copyFileSync(a, b);
  }
}
const fail = msg => { console.error('BUILD FAILED: ' + msg); process.exit(1); };

// ---------------------------------------------------------------- data
const data = readJson('data/apps.json');
const playFile = readJson('data/play.json');
const play = playFile.apps || {};

// Google Play decides what is live: every published app is shown, whether or
// not apps.json mentions it; apps.json only adds what Play cannot know.
const PALETTE = ['blue', 'amber', 'green', 'violet', 'rose', 'teal', 'orange'];
const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const slug = pkg => pkg.split('.').pop().replace(/_/g, '-').replace(/[^a-z0-9-]/gi, '').toLowerCase();
function categoryFor(genreId) {
  const match = c => (c.genres || []).some(g => g === genreId || (g.endsWith('*') && g !== '*' && genreId.startsWith(g.slice(0, -1))));
  return (data.categories.find(match) || data.categories.find(c => (c.genres || []).includes('*'))).id;
}
function policyFor(p) {
  // a Play privacy URL on our own site becomes a site link; anything else stays external
  const u = (p.privacyPolicy || '').replace(/^https?:\/\/(www\.)?mixapplications\.com\//i, '');
  if (!u || /^https?:/i.test(u)) return { policyUrl: p.privacyPolicy || '' };
  return { policy: u.endsWith('.html') ? u : u + '.html' };
}
const apps = [];
const curatedPkgs = new Set();
for (const a of data.apps) {
  if (a.pkg) curatedPkgs.add(a.pkg);
  const onPlay = a.pkg && play[a.pkg];
  if (onPlay) apps.push({ ...(a.policy ? {} : policyFor(onPlay)), ...a, status: 'live', category: a.category || categoryFor(onPlay.genreId) });
  else if (a.status === 'live') apps.push({ ...a, status: 'retired', unpublished: true });
  else apps.push(a);
}
for (const [pkg, p] of Object.entries(play)) {
  if (curatedPkgs.has(pkg)) continue;
  apps.push({
    id: slug(pkg), name: p.title, pkg, status: 'live', auto: true,
    category: categoryFor(p.genreId || ''), color: PALETTE[hash(pkg) % PALETTE.length],
    ...policyFor(p),
  });
}
const ids = new Set();
for (const a of apps) {
  if (ids.has(a.id)) fail(`two apps share the id ${a.id}`);
  ids.add(a.id);
  if (!a.auto && (!a.descKey || !a.desc)) fail(`app ${a.id} needs descKey and desc in apps.json`);
}
// Play's own listing translations, shipped with the site translations
const playI18n = {};
for (const a of apps.filter(x => x.status === 'live')) {
  for (const [lang, t] of Object.entries(play[a.pkg].i18n || {})) {
    playI18n[lang] ??= {};
    if (t.summary) playI18n[lang][`play.${a.id}.summary`] = playText(t.summary);
    if (t.description) playI18n[lang][`play.${a.id}.description`] = playText(t.description.trim());
  }
}
// An app that is not released yet ("unlisted", or simply not on Google Play)
// must not be visible anywhere: its policy page stays reachable by its URL
// (the app and its Play listing point there) but is unlinked and noindex, and
// its support answers stay out of the page until the app goes live.
const isLive = id => apps.some(a => a.id === id && a.status === 'live');
const allPolicies = [
  { file: 'privacy_policy.html', label: 'USB apps' },
  { file: 'tumtum_privacy.html', label: 'TumTum', app: 'tumtum' },
  { file: 'chaome_privacy.html', label: 'ChaoMe', app: 'chaome' },
  { file: 'usb_file_manager_privacy.html', label: 'USB File Manager', app: 'usb-file-manager' },
  { file: 'mixdocs_privacy.html', label: 'MixDocs', app: 'mixdocs' },
  { file: 'cofferlock_privacy.html', label: 'Cofferlock', app: 'cofferlock' },
];
for (const p of allPolicies) p.listed = !p.app || isLive(p.app);
const policies = allPolicies.filter(p => p.listed);
const families = data.faqFamilies.filter(f => apps.some(a => a.faq === f.id && a.status === 'live'));
const hiddenFamilies = data.faqFamilies.filter(f => !families.includes(f)).map(f => f.id);

// ---------------------------------------------------------------- output dir
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
copyDir(path.join(SRC, 'static'), OUT);

const versions = {};
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
for (const name of fs.readdirSync(path.join(SRC, 'assets'))) {
  const buf = fs.readFileSync(path.join(SRC, 'assets', name));
  versions[name] = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10);
  fs.writeFileSync(path.join(OUT, 'assets', name), buf);
}
const asset = name => {
  if (!versions[name]) fail('unknown asset ' + name);
  return `/assets/${name}?v=${versions[name]}`;
};
const ctx = { apps, play, data: { ...data, faqFamilies: families }, policies, asset };

// ---------------------------------------------------------------- pages
const list = [];
list.push(pages.home(ctx));
const icons = { '{mail}': ICON.mail, '{whatsapp}': ICON.whatsapp, '{search}': ICON.search,
  '{mail_s}': ICON.mail.replace(/width="22" height="22"/, 'width="18" height="18"'),
  '{whatsapp_s}': ICON.whatsapp.replace(/width="22" height="22"/, 'width="18" height="18"') };
let supportHtml = read('content/support.html');
// drop the groups of unreleased apps, and their tags on shared answers
supportHtml = supportHtml.split(/(?=    <!-- ---------- )/).map(part => {
  const g = part.match(/<div class="group" data-group="([^"]+)"/);
  if (!g || !hiddenFamilies.includes(g[1])) return part;
  const CLOSE = '\n    </div>\n';   // the group's own closing tag (4-space indent)
  const end = part.indexOf(CLOSE, g.index);
  if (end < 0) fail('cannot find the end of support group ' + g[1]);
  return part.slice(end + CLOSE.length).replace(/^\n+/, '');
}).join('');
supportHtml = supportHtml.replace(/data-app="([^"]*)"/g, (m, list) =>
  `data-app="${list.split(/\s+/).filter(x => !hiddenFamilies.includes(x)).join(' ')}"`);
supportHtml = supportHtml.replace(/\s*<details class="q" data-app=""[\s\S]*?<\/details>/g, '');
for (const [k, v] of Object.entries(icons)) supportHtml = supportHtml.split(k).join(v);
list.push(pages.support(ctx, supportHtml));
const ownPolicies = policies.filter(p => p.app);
const policyList = ownPolicies.length
  ? ' Some of our apps have their own policy, which applies to that app instead of this one: ' +
    ownPolicies.map(p => `<a href="${p.file}">${p.label}</a>`).join(', ') + '.'
  : '';
for (const p of allPolicies) {
  const raw = read('content/policies/' + p.file).replace('<!--app-policies-->', policyList);
  const m = raw.match(/^<!--meta (\{.*\}) -->\n/);
  if (!m) fail('policy without meta header: ' + p.file);
  const page = pages.policy(p.file, JSON.parse(m[1]), raw.slice(m[0].length), ctx);
  if (!p.listed) page.noindex = true;   // reachable by URL only
  list.push(page);
}
for (const a of apps.filter(x => x.status === 'live')) list.push(pages.appPage(a, ctx));
for (const a of apps.filter(x => x.unpublished)) list.push(pages.unpublishedPage(a));
list.push(pages.notFound(ctx));

const rendered = {};
for (const page of list) {
  const html = layout(page, ctx);
  rendered[page.path] = html;
  write(page.path, html);
}

// ---------------------------------------------------------------- sitemap
const urls = list.filter(p => !p.noindex).map(p => SITE + (p.path === '/index.html' ? '/' : p.path));
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`);

// ---------------------------------------------------------------- i18n
const ENT = { ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', mdash: '—', ndash: '–', rarr: '→', larr: '←',
  middot: '·', copy: '©', hellip: '…', ccedil: 'ç', atilde: 'ã', quot: '"' };
// what the browser hands back: innerHTML keeps &amp; &lt; &gt; &nbsp; and turns other entities into characters
const asInnerHtml = s => s.replace(/&([a-z]+);/g, (m, n) => (ENT[n] && n !== 'quot' ? ENT[n] : m));
const asText = s => asInnerHtml(s).replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function innerOf(html, start, tag) {
  // start = index just after the opening tag; returns the inner HTML up to the matching close
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  re.lastIndex = start;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(start, m.index);
  }
  throw new Error('unclosed <' + tag + '>');
}

const source = {};
const put = (key, value, where) => {
  if (key.startsWith('play.')) return;   // Play listing text: translated by the listing itself
  if (key in source && source[key] !== value) fail(`i18n key ${key} has two different English texts (${where})`);
  source[key] = value;
};
for (const [file, html] of Object.entries(rendered)) {
  const open = /<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  let m;
  while ((m = open.exec(html))) {
    const [whole, tag, attrs] = m;
    const k = attrs.match(/\sdata-i18n="([^"]+)"/);
    if (k) {
      const inner = innerOf(html, m.index + whole.length, tag);
      put(k[1], tag.toLowerCase() === 'title' ? asText(inner) : asInnerHtml(inner), file);
    }
    const ph = attrs.match(/\sdata-i18n-ph="([^"]+)"/);
    if (ph) put(ph[1], asText(attrs.match(/\splaceholder="([^"]*)"/)[1]), file);
    const tp = attrs.match(/\sdata-i18n-tpl="([^"]+)"/);
    if (tp) put(tp[1], asText(attrs.match(/\sdata-tpl="([^"]*)"/)[1]), file);
  }
}
const sorted = Object.fromEntries(Object.keys(source).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })).map(k => [k, source[k]]));
const sourceJson = JSON.stringify(sorted, null, 1) + '\n';
const sourcePath = path.join(SRC, 'i18n', '_source.en.json');
const committed = fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf8') : '';
if (committed !== sourceJson) {
  if (CI) {
    // never block a deploy over this: new strings simply show in English until translated
    console.log('::warning::src/i18n/_source.en.json is out of date (new or changed text). Run "npm run build" and "npm run i18n:todo" locally to translate it.');
  } else {
    fs.writeFileSync(sourcePath, sourceJson);
    console.log('updated src/i18n/_source.en.json');
  }
}

const basis = readJson('i18n/_basis.en.json');
const langs = readJson('i18n/languages.json');
write('i18n/languages.json', JSON.stringify({ languages: langs.languages }));
const report = [];
for (const l of langs.languages) {
  if (l.code === 'en') continue;
  const dict = readJson(`i18n/${l.code}.json`);
  const ship = {};
  let stale = 0, missing = 0;
  for (const key of Object.keys(sorted)) {
    if (typeof dict[key] !== 'string' || !dict[key]) { missing++; continue; }
    // compare as the browser sees it, so &ldquo; and “ count as the same text
    if (asInnerHtml(basis[key] ?? '') !== sorted[key]) { stale++; continue; }
    ship[key] = dict[key];
  }
  Object.assign(ship, playI18n[l.code] || {});
  write(`i18n/${l.code}.json`, JSON.stringify(ship));
  const fromPlay = Object.keys(playI18n[l.code] || {}).length;
  report.push(`${l.code}: ${Object.keys(ship).length - fromPlay}/${Object.keys(sorted).length} shipped + ${fromPlay} from Play` + (stale ? `, ${stale} stale` : '') + (missing ? `, ${missing} missing` : ''));
}

console.log(`built ${list.length} pages into _site/ (${Object.keys(sorted).length} translatable strings)`);
console.log('translations: ' + report.join(' | '));
