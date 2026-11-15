// Tells IndexNow (Bing, Yandex, Seznam, Naver; shared between them) which pages changed in a deploy.
//
//   node scripts/indexnow.mjs changed _site/sitemap.xml   print URLs that are new or have a new lastmod,
//                                                          compared with the live sitemap (before deploy)
//   node scripts/indexnow.mjs submit <file with URLs>      POST them to api.indexnow.org; exits 1 on non-2xx
//   node scripts/indexnow.mjs --self-test
//
// The key is public by design: IndexNow proves site ownership by fetching /<key>.txt from the site.
import fs from 'node:fs';

const SITE = 'https://www.mixapplications.com';
const KEY = 'ca79d455770ea7d125b0a57e69729587';

export function entries(xml) {
  const out = new Map();
  for (const m of xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)) out.set(m[1], m[2] || '');
  return out;
}
export function changed(built, live) {
  return [...built].filter(([loc, mod]) => !live.has(loc) || live.get(loc) !== mod).map(([loc]) => loc);
}

const die = msg => { console.error('IndexNow: ' + msg); process.exit(1); };
const [mode, arg] = process.argv.slice(2);

if (mode === '--self-test') {
  const a = entries('<url><loc>https://x/a</loc><lastmod>2026-01-01</lastmod></url>\n<url><loc>https://x/b</loc></url>');
  const b = entries('<url><loc>https://x/a</loc><lastmod>2026-01-02</lastmod></url>\n<url><loc>https://x/b</loc></url>\n<url><loc>https://x/c</loc><lastmod>2026-01-02</lastmod></url>');
  const got = changed(b, a).join(',');
  if (a.size !== 2 || got !== 'https://x/a,https://x/c') die(`self-test failed: ${a.size} entries, changed=${got}`);
  console.log('self-test ok');
} else if (mode === 'changed') {
  const built = entries(fs.readFileSync(arg, 'utf8'));
  if (!built.size) die(`no <url> entries in ${arg}`);
  const r = await fetch(SITE + '/sitemap.xml', { headers: { 'cache-control': 'no-cache' } });
  if (!r.ok) die(`live sitemap returned HTTP ${r.status}`);
  const live = entries(await r.text());
  if (!live.size) die('live sitemap has no <url> entries');
  for (const u of changed(built, live)) console.log(u);
} else if (mode === 'submit') {
  const urlList = fs.readFileSync(arg, 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
  if (!urlList.length) { console.log('nothing changed: no URLs submitted'); process.exit(0); }
  if (urlList.some(u => !u.startsWith(SITE + '/'))) die('a URL outside the site was given');
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
  });
  const body = (await r.text()).slice(0, 300);
  console.log(`IndexNow HTTP ${r.status} for ${urlList.length} URL(s)${body ? ': ' + body : ''}`);
  if (r.status < 200 || r.status > 299) die(`submission refused (HTTP ${r.status})`);
} else {
  die('usage: indexnow.mjs changed <sitemap.xml> | submit <urls.txt> | --self-test');
}
