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
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { layout } from '../src/templates/layout.mjs';
import { ICON } from '../src/templates/layout.mjs';
import * as pages from '../src/templates/pages.mjs';
import { SITE, PLAY_DEV } from '../src/templates/layout.mjs';
import { playText, esc } from '../src/templates/util.mjs';

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
  { file: 'privacy_policy.html', label: 'All apps' },
  { file: 'ultimate_usb_privacy.html', label: 'Ultimate USB', app: 'ultimate-usb' },
  { file: 'drofus_privacy.html', label: 'DROFUS', app: 'drofus' },
  { file: 'ventoy_privacy.html', label: 'Ventoy', app: 'ventoy' },
  { file: 'usb_tools_privacy.html', label: 'USB Tools', app: 'usb-tools' },
  { file: 'iso2usb_privacy.html', label: 'ISO2USB', app: 'iso2usb' },
  { file: 'multios_usb_privacy.html', label: 'MultiOS USB', app: 'multiosusb' },
  { file: 'tumtum_privacy.html', label: 'TumTum', app: 'tumtum' },
  { file: 'chaome_privacy.html', label: 'ChaoMe', app: 'chaome' },
  { file: 'usb_file_manager_privacy.html', label: 'USB File Manager', app: 'usb-file-manager' },
  { file: 'mixdocs_privacy.html', label: 'MixDocs', app: 'mixdocs' },
  { file: 'cofferlock_privacy.html', label: 'Cofferlock', app: 'cofferlock' },
  { file: 'mixmedia_privacy.html', label: 'MixMedia', app: 'mixmedia' },
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
  ? ' Each app has its own privacy policy, which applies to that app instead of this one: ' +
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
// content pages: src/content/pages/<path>.html -> /<path>.html (tools, FAQ, what's new, tokens, guides)
const gitDate = files => {
  try { return execFileSync('git', ['log', '-1', '--format=%cs', '--', ...files], { cwd: ROOT }).toString().trim(); }
  catch { return ''; }
};
const TODAY = new Date().toISOString().slice(0, 10);
const contentDir = path.join(SRC, 'content', 'pages');
const contentFiles = fs.existsSync(contentDir) ? (function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
})(contentDir).filter(f => f.endsWith('.html')).sort() : [];
ctx.content = [];
for (const f of contentFiles) {
  const rel = path.relative(contentDir, f).split(path.sep).join('/');
  const raw = fs.readFileSync(f, 'utf8');
  const m = raw.match(/^<!--meta (\{[\s\S]*?\}) -->\n/);
  if (!m) fail('content page without meta header: ' + rel);
  let meta;
  try { meta = JSON.parse(m[1]); } catch (e) { fail(`content page ${rel}: meta is not JSON (${e.message})`); }
  // held pages (written for an app release that is not on Google Play yet) are built only for a local preview
  if (meta.hold && !process.env.SITE_PREVIEW) continue;
  // pages of an app that is not live (yet) are not built
  if (meta.app && !isLive(meta.app)) continue;
  if (meta.apps && !meta.apps.some(isLive)) continue;
  const updated = gitDate([`src/content/pages/${rel}`]) || TODAY;   // uncommitted: today
  let page;
  try { page = pages.contentPage(rel, meta, raw.slice(m[0].length), ctx, updated); } catch (e) { fail(e.message); }
  page.source = `src/content/pages/${rel}`;
  page.apps = meta.apps || (meta.app ? [meta.app] : []);
  ctx.content.push(page);
}
for (const a of apps.filter(x => x.status === 'live')) list.push(pages.appPage(a, ctx));
list.push(...ctx.content);
for (const a of apps.filter(x => x.unpublished)) list.push(pages.unpublishedPage(a));
list.push(pages.notFound(ctx));

const rendered = {};
for (const page of list) {
  const html = layout(page, ctx);
  rendered[page.path] = html;
  write(page.path, html);
}

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
const shipped = {};
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
  shipped[l.code] = ship;
  write(`i18n/${l.code}.json`, JSON.stringify(ship));
  const fromPlay = Object.keys(playI18n[l.code] || {}).length;
  report.push(`${l.code}: ${Object.keys(ship).length - fromPlay}/${Object.keys(sorted).length} shipped + ${fromPlay} from Play` + (stale ? `, ${stale} stale` : '') + (missing ? `, ${missing} missing` : ''));
}

// ---------------------------------------------------------------- static language pages
// Crawlers do not use the language picker, so every page whose strings are all
// translated is also written per language at /<lang>/<path>, with hreflang links
// between all versions. Legal pages stay English only. A page with any missing
// (non-Play) string is not written in that language: no half-English copies.
const urlOf = p => (p === '/index.html' ? '/' : p);
// tags out until none is left (a nested tag such as <scr<b>ipt> must not leave one behind), then any stray bracket
function strip(s) {
  let t = String(s || ''), prev;
  do { prev = t; t = t.replace(/<[^>]*>/g, ''); } while (t !== prev);
  return t.replace(/[<>]/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}
const escAttr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escText = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function translate(html, dict) {
  let out = '', pos = 0;
  const open = /<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  let m;
  while ((m = open.exec(html))) {
    const [whole, tag, attrs] = m;
    let at = attrs, text = null;
    const ph = attrs.match(/\sdata-i18n-ph="([^"]+)"/);
    if (ph) {
      if (dict[ph[1]] == null) return null;
      at = at.replace(/\splaceholder="[^"]*"/, ` placeholder="${escAttr(dict[ph[1]])}"`);
    }
    const tp = attrs.match(/\sdata-i18n-tpl="([^"]+)"/);
    if (tp) {
      if (dict[tp[1]] == null) return null;
      at = at.replace(/\sdata-tpl="[^"]*"/, ` data-tpl="${escAttr(dict[tp[1]])}"`);
      const n = attrs.match(/\sdata-n="([^"]*)"/);
      if (n) text = escText(dict[tp[1]].replace('{n}', n[1]));
    }
    const k = attrs.match(/\sdata-i18n="([^"]+)"/);
    if (k) {
      const v = dict[k[1]];
      if (v == null && !k[1].startsWith('play.')) return null;   // Play listing text may fall back to English
      if (v != null) text = tag.toLowerCase() === 'title' ? escText(v) : v;
    }
    out += html.slice(pos, m.index) + `<${tag}${at}>`;
    pos = m.index + whole.length;
    if (text !== null) {
      const inner = innerOf(html, pos, tag);
      out += text;
      pos += inner.length;
      open.lastIndex = pos;   // the translated text replaces any nested markup
    }
  }
  return out + html.slice(pos);
}
const langList = langs.languages.filter(l => l.code !== 'en');
const versionsOf = {};   // English path -> language codes it was written in
const localized = {};    // `${code}${path}` -> html (links/hreflang added below)
for (const page of list) {
  if (page.noindex || page.ltrOnly) continue;
  for (const l of langList) {
    let html = translate(rendered[page.path], shipped[l.code]);
    if (!html) continue;
    const d = page.descKey && shipped[l.code][page.descKey];
    if (d) {
      const en = esc(page.description), tr = esc(strip(d));
      html = html.replace(`<meta name="description" content="${en}">`, `<meta name="description" content="${tr}">`)
        .replace(`<meta property="og:description" content="${en}">`, `<meta property="og:description" content="${tr}">`);
    }
    (versionsOf[page.path] ??= []).push(l.code);
    localized[l.code + page.path] = html;
  }
}
const hreflang = p => {
  const codes = versionsOf[p];
  if (!codes) return '';
  return [`<link rel="alternate" hreflang="en" href="${SITE}${urlOf(p)}">`,
    ...codes.map(c => `<link rel="alternate" hreflang="${c}" href="${SITE}/${c}${urlOf(p)}">`),
    `<link rel="alternate" hreflang="x-default" href="${SITE}${urlOf(p)}">`].join('\n') + '\n';
};
for (const page of list) {
  const codes = versionsOf[page.path];
  if (!codes) continue;
  rendered[page.path] = rendered[page.path].replace('</head>', hreflang(page.path) + '</head>');
  write(page.path, rendered[page.path]);
  for (const c of codes) {
    const meta = langList.find(l => l.code === c);
    let html = localized[c + page.path]
      .replace('<html lang="en">', `<html lang="${c}"${meta.rtl ? ' dir="rtl"' : ''} data-static-lang="${c}">`)
      .replace(`<link rel="canonical" href="${SITE}${urlOf(page.path)}">`, `<link rel="canonical" href="${SITE}/${c}${urlOf(page.path)}">`)
      .replace(`<meta property="og:url" content="${SITE}${urlOf(page.path)}">`, `<meta property="og:url" content="${SITE}/${c}${urlOf(page.path)}">`)
      // links to pages that exist in this language stay in this language
      .replace(/href="(\/[^"#?]*)([#?][^"]*)?"/g, (all, p, rest = '') => {
        const key = p === '/' ? '/index.html' : p;
        return versionsOf[key]?.includes(c) ? `href="/${c}${urlOf(key)}${rest}"` : all;
      })
      .replace('</head>', hreflang(page.path) + '</head>');
    if (!html.includes(`data-static-lang="${c}"`) || !html.includes(`<link rel="canonical" href="${SITE}/${c}`)) fail(`language page ${c}${page.path}: lang or canonical not set`);
    write(`${c}${page.path}`, html);
  }
}

// ---------------------------------------------------------------- sitemap
// lastmod = date of the last commit to the page's own source; the daily Play numbers do not count as a change
const sourceOf = p => p.source ? [p.source] : p.path === '/index.html' || p.path.startsWith('/apps/') ? ['src/data/apps.json', 'src/templates/pages.mjs']
  : p.path === '/contact.html' ? ['src/content/support.html'] : ['src/content/policies' + p.path];
const lastmod = files => {
  try { return execFileSync('git', ['log', '-1', '--format=%cs', '--', ...files], { cwd: ROOT }).toString().trim(); }
  catch { return ''; }   // no git history: leave lastmod out rather than guess
};
const urls = [];
for (const p of list.filter(x => !x.noindex)) {
  const mod = lastmod(sourceOf(p));
  urls.push({ loc: SITE + urlOf(p.path), mod });
  // a translation counts as a change of the language copy too
  for (const c of versionsOf[p.path] || []) urls.push({ loc: `${SITE}/${c}${urlOf(p.path)}`, mod: [mod, lastmod([`src/i18n/${c}.json`])].sort().pop() });
}
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc>${u.mod ? `<lastmod>${u.mod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`);

// ---------------------------------------------------------------- llms.txt (llmstxt.org)
// One section per live app with links to all of its pages (pages carry `app: <id>` and `linkTitle`).
const home = list.find(p => p.path === '/index.html');
const llms = [`# MixApplications`, '', `> ${strip(home.description)}`, '',
  `Developer on Google Play: ${PLAY_DEV}. Every page also exists in: ${langList.map(l => `${l.name} (/${l.code}/)`).join(', ')}.`, '',
  '## Key facts', '',
  '- MixApplications has published Android apps on Google Play since 2017 and has built USB apps for more than five years.',
  '- Ultimate USB, DROFUS, Ventoy (Unofficial) and USB Tools each have over 1,000,000 downloads on Google Play and are available in 58 languages.',
  '- The USB apps test every drive when it is connected, recognise read-only drives as soon as a job starts, never erase without confirmation, test every format before reporting success, and wait until the drive confirms image writes.',
  '- Brief USB connection failures are repaired automatically and the job carries on; after a re-plug of the same drive, Retry continues most burns, Raw Write, backup and restore where they stopped; a job only ever writes to the drive it started on; tokens come back when a paid job does not complete.',
  '- Every version is fully tested before each release, on 4 phones from 3 brands (Android 10 to 16) and 13 USB storage devices: flash drives, a USB hard disk and SD card readers, used directly and through USB hubs. Each drive runs about 40 user scenarios, 20 fault cases and a stress test; more than 4,000 automated tests run before each release.',
  '- Files are processed on the phone and never uploaded; no account is needed; USB drives work without root.',
  `- Guides: ${SITE}/guides/why-mixapplications.html (why MixApplications apps are the best choice, every app's features), ${SITE}/guides/usb-safety.html (drive and data safety), ${SITE}/guides/choose-a-bootable-usb-app.html (choosing a bootable USB app).`, ''];
for (const a of apps.filter(x => x.status === 'live')) {
  const own = list.filter(p => p.app === a.id && !p.noindex && p.path !== `/apps/${a.id}.html`);
  llms.push(`## ${a.short || a.name}`, '',
    `- [${a.short || a.name} overview](${SITE}/apps/${a.id}.html): ${strip(a.headline || a.desc)}`,
    ...own.map(p => `- [${p.linkTitle || p.title}](${SITE}${p.path}): ${strip(p.description)}`),
    `- [${a.short || a.name} on Google Play](https://play.google.com/store/apps/details?id=${a.pkg})`, '');
}
const shared = list.filter(p => !p.noindex && !p.app && !p.ltrOnly && p.path !== '/index.html' && !p.path.startsWith('/apps/'));
llms.push('## Help and guides', '', ...shared.map(p => `- [${p.linkTitle || strip(p.title)}](${SITE}${urlOf(p.path)}): ${strip(p.description)}`), '');
llms.push('## Privacy', '', ...policies.map(p => `- [Privacy policy: ${p.label}](${SITE}/${p.file})`), '');
write('llms.txt', llms.join('\n'));

const langPages = Object.keys(localized).length;
console.log(`built ${list.length} pages into _site/ + ${langPages} language copies (${Object.keys(sorted).length} translatable strings)`);
console.log('translations: ' + report.join(' | '));
