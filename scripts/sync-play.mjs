// Finds every app the developer account has on Google Play and writes its live
// data into src/data/play.json: title, icon, screenshots, rating, installs,
// genre, privacy-policy URL, and the summary + description in every site
// language the Play listing is translated into. The build turns every app in
// that file into a live app on the site, so publishing an app on Google Play is
// all it takes for it to appear.
//
// Safety: an app is dropped only when Google Play answers "not found" in two
// countries; any other error keeps its previous data; and a run that would drop
// more than half the known apps is refused as a likely scraper failure.
//
//   node scripts/sync-play.mjs [--report <file>]
//   --report writes a Markdown note of apps that appeared or disappeared
import gplayModule from 'google-play-scraper';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// v9 and earlier were CommonJS, so the functions sat on .default when
// imported from ESM. v10 is real ESM and puts them on the module itself.
const gplay = gplayModule.default ?? gplayModule;

const APPS = 'src/data/apps.json';
const LANGS = 'src/i18n/languages.json';
const OUT = 'src/data/play.json';
const COUNTRIES = ['us', 'eg'];
const argReport = process.argv.indexOf('--report');
const REPORT = argReport > 0 ? process.argv[argReport + 1] : null;

const data = JSON.parse(readFileSync(APPS, 'utf8'));
const DEV = data.developer;
if (!DEV) { console.error(`${APPS} needs "developer" (the Google Play developer name)`); process.exit(1); }
const siteLangs = JSON.parse(readFileSync(LANGS, 'utf8')).languages.map(l => l.code).filter(c => c !== 'en');

let prev = { apps: {} };
if (existsSync(OUT)) { try { prev = JSON.parse(readFileSync(OUT, 'utf8')); } catch {} }
const prevIds = Object.keys(prev.apps || {});

const notFound = e => /404|not found/i.test(String(e && e.message));
async function details(appId, lang = 'en') {
  let last;
  for (const country of COUNTRIES) {
    try { return await gplay.app({ appId, lang, country }); } catch (e) { last = e; if (!notFound(e)) throw e; }
  }
  throw last;
}

// 1. what is published: the developer page, plus every app we already know of,
//    so a listing hiccup can never drop an app on its own
let listed = [];
try {
  listed = (await gplay.developer({ devId: DEV, num: 200 })).map(a => a.appId);
  console.log(`developer page: ${listed.length} app(s)`);
} catch (e) {
  console.error(`developer page failed: ${e.message} (checking known apps only)`);
}
const curated = data.apps.filter(a => a.pkg).map(a => a.pkg);
const candidates = [...new Set([...listed, ...prevIds, ...curated])];

// 2. details per app
const out = { updated: null, developer: DEV, apps: {} };
let ok = 0, kept = 0;
for (const appId of candidates) {
  try {
    const a = await details(appId);
    if (a.developer && a.developer !== DEV) { console.log(`skip ${appId}: published by ${a.developer}`); continue; }
    const entry = {
      title: a.title,
      icon: a.icon,
      screenshots: [...new Set(a.screenshots || [])].slice(0, 8),
      score: a.score ? Math.round(a.score * 10) / 10 : null,
      ratings: a.ratings || null,
      installs: a.installs || null,
      summary: a.summary || '',
      description: a.description || '',
      genre: a.genre || '',
      genreId: a.genreId || '',
      privacyPolicy: a.privacyPolicy || '',
      url: a.url,
      i18n: {},
    };
    // the listing's own translations; a language Play has no translation for
    // comes back in English and is left out
    for (const lang of siteLangs) {
      try {
        const t = await details(appId, lang);
        const tr = {};
        if (t.summary && t.summary !== entry.summary) tr.summary = t.summary;
        if (t.description && t.description !== entry.description) tr.description = t.description;
        if (Object.keys(tr).length) entry.i18n[lang] = tr;
      } catch (e) {
        if (prev.apps?.[appId]?.i18n?.[lang]) entry.i18n[lang] = prev.apps[appId].i18n[lang];
      }
    }
    out.apps[appId] = entry;
    ok++;
    console.log(`OK   ${appId}  ${a.score?.toFixed(2) ?? '-'}  ${a.installs}  langs: ${Object.keys(entry.i18n).join(',') || '-'}`);
  } catch (e) {
    if (notFound(e)) { if (prev.apps?.[appId]) console.log(`GONE ${appId}: not on Google Play`); continue; }
    if (prev.apps?.[appId]) { out.apps[appId] = prev.apps[appId]; kept++; }
    console.error(`FAIL ${appId}: ${e.message}${prev.apps?.[appId] ? ' (keeping previous data)' : ''}`);
  }
}

const now = Object.keys(out.apps);
const added = now.filter(id => !prevIds.includes(id));
const removed = prevIds.filter(id => !now.includes(id));
if (ok === 0) { console.error('No app synced — leaving play data untouched.'); process.exit(1); }
if (prevIds.length >= 2 && removed.length > prevIds.length / 2) {
  console.error(`Refusing: ${removed.length} of ${prevIds.length} known apps would disappear. Likely a scraper failure; play data left untouched.`);
  process.exit(1);
}

out.updated = new Date().toISOString();
writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${OUT}: ${now.length} published app(s)${kept ? `, ${kept} kept from the last sync` : ''}.`);

if (REPORT) {
  const known = new Set(curated);
  const lines = [];
  for (const id of added) {
    const a = out.apps[id];
    lines.push(`- **New on Google Play: ${a.title}** (\`${id}\`) is now on the site with its Play texts.` +
      (known.has(id) ? ' It was listed as coming soon and is now live.' :
        ' Optional follow-up in `src/data/apps.json`: a hand-written description and chips, its support answers, and its own privacy policy if the general one does not cover it.') +
      (a.privacyPolicy ? ` Play lists its privacy policy as ${a.privacyPolicy}.` : ' **Its Play listing has no privacy-policy URL.**'));
  }
  for (const id of removed) lines.push(`- **No longer on Google Play:** \`${id}\` is now shown as unpublished.`);
  writeFileSync(REPORT, lines.join('\n') + (lines.length ? '\n' : ''));
}
