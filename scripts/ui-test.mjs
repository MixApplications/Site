// Drives the built site in a real headless Chrome, the way a visitor does,
// and checks the results against the input data (apps.json, play.json,
// languages.json), never against the site's own output.
//
//   npm run build && node scripts/ui-test.mjs [--shots <dir>]
//   CHROME=<path to chrome> overrides the browser location.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shotsArg = process.argv.indexOf('--shots');
const SHOTS = shotsArg > 0 ? process.argv[shotsArg + 1] : null;
const CHROME = process.env.CHROME || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => fs.existsSync(p));
if (!CHROME) { console.error('Chrome not found; set CHROME'); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

// ---- expectations from the inputs
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/apps.json'), 'utf8'));
const play = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/play.json'), 'utf8')).apps;
const langs = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/languages.json'), 'utf8')).languages;
const PLAY_PKGS = Object.keys(play).sort();

// ---- local server + browser
const PORT = 8790 + Math.floor(Math.random() * 100);
const server = spawn(process.execPath, [path.join(ROOT, 'scripts/serve.mjs')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-test-'));
const DBG = PORT + 1000;
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-sandbox', '--hide-scrollbars',
  `--remote-debugging-port=${DBG}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
function stopAll() {
  try { server.kill(); } catch {}
  if (process.platform === 'win32') spawnSync('taskkill', ['/T', '/F', '/PID', String(chrome.pid)]);
  else try { chrome.kill('SIGKILL'); } catch {}
  // Chrome can hold its profile files for a moment after it is killed
  fs.rmSync(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
}

let target;
for (let i = 0; i < 75 && !target; i++) {
  await sleep(200);
  try { target = (await (await fetch(`http://127.0.0.1:${DBG}/json`)).json()).find(t => t.type === 'page'); } catch {}
}
if (!target) { stopAll(); console.error('Chrome did not start'); process.exit(1); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let seq = 0; const pending = {}; const errors = []; const paused = [];
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; }
  if (m.method === 'Fetch.requestPaused') paused.push(m.params.requestId);
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' '));
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/fonts\.g|play-lh|favicon/.test(m.params.entry.url || '')) errors.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
});
const send = (method, params = {}) => new Promise((res, rej) => {
  const id = ++seq; pending[id] = m => (m.error ? rej(new Error(m.error.message)) : res(m.result));
  ws.send(JSON.stringify({ id, method, params }));
});
const js = async expr => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
  return r.result.value;
};
async function open(url, width = 1280) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${url}` });
  for (let i = 0; i < 50; i++) { await sleep(100); if (await js('document.readyState') === 'complete') break; }
  await sleep(600);
}
async function shot(name) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  // reveal everything and capture an explicit page region (resizing the viewport
  // would move a right-to-left page's scroll origin and crop it)
  await js(`document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'))`);
  await sleep(700);
  const [w, h] = await js('[document.documentElement.clientWidth, document.documentElement.scrollHeight]');
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: Math.min(h, 10000), scale: 1 } });
  fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(r.data, 'base64'));
}
// a real tap: mouse press + release at the element's centre
async function tap(selector) {
  const box = await js(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null;
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }); return true; })()`);
  if (!box) throw new Error('no element ' + selector);
  await sleep(120);   // let layout settle (the site uses smooth scrolling and menu transitions)
  const pt = await js(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: pt[0], y: pt[1], button: 'left', clickCount: 1 });
}

try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');

  // 1. home shows exactly the apps that are on Google Play
  await open('/');
  const onHome = await js(`[...new Set([...document.querySelectorAll('.appcard a[href^="https://play.google.com/store/apps/details?id="]')].map(a => new URL(a.href).searchParams.get('id')))].sort()`);
  check('home lists every Google Play app, and only those', JSON.stringify(onHome) === JSON.stringify(PLAY_PKGS), `${onHome.length} on page, ${PLAY_PKGS.length} on Play`);
  const soon = data.apps.filter(a => a.status === 'soon' && !play[a.pkg]).map(a => a.name);
  const soonShown = await js(`[...document.querySelectorAll('#soon + .grid h3')].map(h => h.textContent.trim())`);
  check('coming-soon apps are the ones not yet on Play', JSON.stringify(soonShown.sort()) === JSON.stringify(soon.sort()), soonShown.join(', '));
  await shot('home');

  // 2. support: choosing an app shows only that app's answers, and the count says so
  const fam = data.faqFamilies.find(f => f.id === 'tumtum') || data.faqFamilies[0];
  await open(`/contact.html?app=${fam.id}`);
  const st = await js(`(() => { const v = [...document.querySelectorAll('details.q')].filter(d => d.offsetParent !== null);
    return { visible: v.length, wrong: v.filter(d => !d.dataset.app.split(/\\s+/).includes(${JSON.stringify(fam.id)})).length,
             count: document.getElementById('kbcount').textContent, pressed: document.querySelector('#kbapps [aria-pressed=true]').dataset.app }; })()`);
  check(`support ?app=${fam.id} shows only its answers`, st.visible > 0 && st.wrong === 0 && st.pressed === fam.id, `${st.visible} shown, ${st.wrong} from other apps`);
  check('support answer count matches what is shown', st.count.includes(String(st.visible)), st.count);

  // 3. double tap on an app chip: one state change, same result as a single tap
  const other = data.faqFamilies.find(f => f.id !== fam.id).id;
  await tap(`#kbapps button[data-app="${other}"]`);
  await tap(`#kbapps button[data-app="${other}"]`);
  await sleep(200);
  const dbl = await js(`({ pressed: [...document.querySelectorAll('#kbapps [aria-pressed=true]')].map(b => b.dataset.app),
    wrong: [...document.querySelectorAll('details.q')].filter(d => d.offsetParent !== null && !d.dataset.app.split(/\\s+/).includes(${JSON.stringify(other)})).length,
    url: location.search })`);
  check('double tap on an app chip selects it once', dbl.pressed.length === 1 && dbl.pressed[0] === other && dbl.wrong === 0 && dbl.url === `?app=${other}`, JSON.stringify(dbl));
  // search narrows within the chosen app
  await js(`(() => { const i = document.getElementById('kbsearch'); i.value = 'zzzz-no-such-answer'; i.dispatchEvent(new Event('input')); })()`);
  check('a search with no match shows the empty state', await js(`!document.getElementById('noresult').classList.contains('hidden')`));
  await shot('support');

  // 4. language: a translated language turns the page around; a legal page stays tagged English
  const rtl = langs.find(l => l.rtl);
  const ltr = langs.find(l => l.code !== 'en' && !l.rtl);
  if (rtl) {
    await open('/');
    await js(`localStorage.setItem('mixapp.lang', ${JSON.stringify(rtl.code)})`);
    await open('/');
    const r = await js(`({ lang: document.documentElement.lang, dir: document.documentElement.dir, nav: document.querySelector('nav.top a').textContent.trim() })`);
    check(`choosing ${rtl.name} switches the page to ${rtl.code}, right-to-left`, r.lang === rtl.code && r.dir === 'rtl' && r.nav !== 'Apps', JSON.stringify(r));
    for (const [pg, w] of [['/', 1280], ['/', 390], ['/contact.html', 390], ['/apps/tumtum.html', 390]]) {
      await open(pg, w);
      const o = await js(`({ sw: document.documentElement.scrollWidth, iw: innerWidth, dir: document.documentElement.dir,
        wide: [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1) && getComputedStyle(e).position !== 'fixed'; })
          .slice(0, 5).map(e => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().left) + '..' + Math.round(e.getBoundingClientRect().right)) })`);
      check(`${rtl.code} ${pg} at ${w}px: right-to-left with no sideways overflow`, o.dir === 'rtl' && o.sw <= o.iw, o.sw > o.iw ? JSON.stringify(o.wide) : `${o.sw}px`);
    }
    await open('/');
    await shot('home-' + rtl.code);
    await open('/apps/' + (data.apps.find(x => x.status === 'live') || {}).id + '.html');
    await shot('app-' + rtl.code);
    await open('/privacy_policy.html');
    const p = await js(`({ lang: document.documentElement.lang, dir: document.documentElement.dir, navLang: document.querySelector('nav.top a').lang })`);
    check('policy pages keep the legal text tagged English', p.lang === 'en' && p.dir !== 'rtl' && p.navLang === rtl.code, JSON.stringify(p));
    await js(`localStorage.removeItem('mixapp.lang')`);
  }

  // 5. rapid taps on two languages: the last one wins, even when the first
  //    language's file arrives last (it is held back until the second is applied)
  if (rtl && ltr) {
    await open('/');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Fetch.enable', { patterns: [{ urlPattern: `*/i18n/${rtl.code}.json*` }] });
    await tap('.lang-btn');
    await tap(`.lang-menu [data-lang="${rtl.code}"]`);
    await tap('.lang-btn');
    await tap(`.lang-menu [data-lang="${ltr.code}"]`);
    await sleep(1200);
    const held = paused.length;
    for (const id of paused.splice(0)) await send('Fetch.continueRequest', { requestId: id });
    await send('Fetch.disable');
    await send('Network.setCacheDisabled', { cacheDisabled: false });
    await sleep(1200);
    check('the first language file was really held back', held === 1, `${held} request(s) held`);
    const l = await js(`({ lang: document.documentElement.lang, label: document.querySelector('.lang-current').textContent, stored: localStorage.getItem('mixapp.lang') })`);
    check('rapid language taps end on the last language picked', l.lang === ltr.code && l.label === ltr.code.toUpperCase() && l.stored === ltr.code, JSON.stringify(l));
    await js(`localStorage.removeItem('mixapp.lang')`);
  }

  // 6. every page loads without script errors, and nothing overflows a phone screen
  const pages = ['/', '/contact.html', '/privacy_policy.html', '/tumtum_privacy.html', '/mixdocs_privacy.html', '/cofferlock_privacy.html', '/404.html', ...Object.keys(play).map(pkg => {
    const a = data.apps.find(x => x.pkg === pkg); return `/apps/${a ? a.id : pkg.split('.').pop().replace(/_/g, '-')}.html`; })];
  for (const p of pages) {
    errors.length = 0;
    await open(p, 390);
    check(`${p}: no script errors`, errors.length === 0, errors.join(' | '));
  }

  // 7. every page adapts to every common screen: small phones to large desktops.
  //    Nothing may scroll sideways or stick out of the screen at any width.
  const WIDTHS = [320, 360, 390, 414, 600, 768, 1024, 1280, 1440, 1920];
  for (const w of WIDTHS) {
    const bad = [];
    for (const p of pages) {
      await open(p, w);
      const o = await js(`(() => { const iw = document.documentElement.clientWidth;
        const out = [...document.querySelectorAll('main *, header.site *, footer.site *')].filter(e => {
          if (e.closest('.shots, .table-container, .lang-menu')) return false;   // these scroll on purpose
          const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > iw + 1 || r.left < -1);
        }).slice(0, 3).map(e => (e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().right));
        return { sw: document.documentElement.scrollWidth, iw, out }; })()`);
      if (o.sw > o.iw || o.out.length) bad.push(`${p} (${o.sw}px${o.out.length ? '; ' + o.out.join(', ') : ''})`);
    }
    check(`all ${pages.length} pages fit a ${w}px screen with nothing cut off`, bad.length === 0, bad.join(' | '));
    if (SHOTS && [320, 768, 1920].includes(w)) { await open('/', w); await shot(`home-${w}`); await open('/contact.html', w); await shot(`support-${w}`); await open(pages.find(x => x.startsWith('/apps/')), w); await shot(`app-${w}`); }
  }
} catch (e) {
  check('test run', false, e.message);
} finally {
  // ask the browser to quit itself: on Windows the launched chrome.exe hands off to
  // another process, so killing the spawned PID would leave the real browser running
  try {
    const { webSocketDebuggerUrl } = await (await fetch(`http://127.0.0.1:${DBG}/json/version`)).json();
    const bws = new WebSocket(webSocketDebuggerUrl);
    await new Promise((res, rej) => { bws.addEventListener('open', res); bws.addEventListener('error', rej); });
    bws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
    // wait until the debugging port stops answering, i.e. the browser has exited
    for (let i = 0; i < 40; i++) { await sleep(150); try { await fetch(`http://127.0.0.1:${DBG}/json/version`); } catch { break; } }
  } catch {}
  await sleep(500);
  ws.close();
  try { stopAll(); } catch (e) { console.error('cleanup: ' + e.message); }
}

const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} UI checks passed`);
process.exit(failed ? 1 : 0);
