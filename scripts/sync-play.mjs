// Syncs live Google Play data (icons, screenshots, ratings, descriptions)
// into play/data.json. Run by GitHub Actions on a schedule.
import gplay from 'google-play-scraper';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const PACKAGES = [
  'com.mixapplications.ultimateusb',
  'com.mixapplications.rufus',
  'com.mixapplications.ventoy_app',
  'com.mixapplications.usbtools',
  'com.mixapplications.miuithemeeditor',
];

// Start from the previous file so a temporary Play failure for one app
// never wipes its data.
let out = { updated: null, apps: {} };
if (existsSync('play/data.json')) {
  try { out = JSON.parse(readFileSync('play/data.json', 'utf8')); } catch {}
}

let ok = 0;
for (const appId of PACKAGES) {
  try {
    const a = await gplay.default.app({ appId });
    out.apps[appId] = {
      title: a.title,
      icon: a.icon,
      screenshots: (a.screenshots || []).slice(0, 4),
      score: a.score ? Math.round(a.score * 10) / 10 : null,
      ratings: a.ratings || null,
      installs: a.installs || null,
      summary: a.summary || '',
      description: a.description || '',
      url: a.url,
    };
    ok++;
    console.log(`OK  ${appId}  ${a.score?.toFixed(2)}  ${a.installs}`);
  } catch (e) {
    console.error(`FAIL ${appId}: ${e.message} (keeping previous data)`);
  }
}

if (ok === 0) {
  console.error('No app synced — leaving play/data.json untouched.');
  process.exit(1);
}

out.updated = new Date().toISOString();
mkdirSync('play', { recursive: true });
writeFileSync('play/data.json', JSON.stringify(out, null, 1));
console.log(`Wrote play/data.json (${ok}/${PACKAGES.length} apps).`);
