// Overlays Play Console numbers on src/data/play.json, from the Google Play
// bulk reports (Cloud Storage), which CI downloads with keyless Workload
// Identity Federation before this runs.
//
//   installs  sum of "Daily Device Installs" over every monthly installs
//             overview file (the reports' own "Total User Installs" column is
//             always 0); shown rounded DOWN to 2 significant digits,
//             e.g. 1,667,700 -> "1,600,000+"
//   score     the "Google Play rating" Play Console shows is weighted toward
//             recent ratings and is in no report. It is rebuilt from the
//             reviews reports (every rating, with or without text): the
//             average star rating with a 22-day half-life, fitted to the
//             Console's own figures (DROFUS 4.778 -> 4.777, Ultimate USB
//             4.643 -> 4.644). Used only for apps with at least 300 ratings in
//             the last 30 days, and only within 0.3 of the Play page rating;
//             apps with few recent ratings keep the Play page rating, where
//             Google blends in older ratings in a way the reports can't rebuild.
//             (The stats reports' "Total Average Rating" is just the daily
//             average since 2026-10-12, so it is not used.)
//   ratings   count of ratings: stays as sync-play read it from the Play page
//
// Anything wrong for one app and one field (missing or empty file, unexpected
// header, wrong encoding, a gap in the months, NaN, 0, a total below the Play
// page's own floor) keeps the Play page value and logs "FALLBACK <pkg> <field>".
// It always exits 0: the site must build and deploy without Console data.
//
//   node scripts/sync-console.mjs <folder with installs_<pkg>_<YYYYMM>_overview.csv
//                                  and reviews_<pkg>_<YYYYMM>.csv files>
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { installsNumber } from '../src/templates/util.mjs';

const APPS = 'src/data/apps.json';
const OUT = 'src/data/play.json';
const HALF_LIFE_DAYS = 22;
const MIN_RECENT = 300;        // ratings in the last 30 days
const MAX_DRIFT = 0.3;         // from the Play page rating
const DAY = 864e5;

/** UTF-16LE/BE or UTF-8, by BOM; without one, NUL bytes mean UTF-16LE */
function decode(buf) {
  if (buf[0] === 0xff && buf[1] === 0xfe) return new TextDecoder('utf-16le', { fatal: true }).decode(buf.subarray(2));
  if (buf[0] === 0xfe && buf[1] === 0xff) return new TextDecoder('utf-16be', { fatal: true }).decode(buf.subarray(2));
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return new TextDecoder('utf-8', { fatal: true }).decode(buf.subarray(3));
  return new TextDecoder(buf.includes(0) ? 'utf-16le' : 'utf-8', { fatal: true }).decode(buf);
}

/** RFC 4180 records: quoted fields may hold commas, quotes ("") and line breaks */
function records(text) {
  const out = [];
  let rec = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') q = false;
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { rec.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      rec.push(field); field = '';
      if (rec.some(f => f.trim())) out.push(rec);
      rec = [];
    } else field += ch;
  }
  if (q) throw new Error('unterminated quoted field');
  rec.push(field);
  if (rec.some(f => f.trim())) out.push(rec);
  return out;
}

/** CSV text -> array of { column: value } for the columns asked for; throws on a missing column */
function parse(text, need) {
  const [head, ...rows] = records(text);
  if (!rows.length) throw new Error('no data rows');
  const lower = head.map(h => h.trim().toLowerCase());
  const idx = need.map(n => lower.indexOf(n.toLowerCase()));
  const miss = need.filter((n, i) => idx[i] < 0);
  if (miss.length) throw new Error(`unexpected header, missing ${miss.join(', ')}`);
  return rows.map(c => Object.fromEntries(need.map((n, i) => [n, (c[idx[i]] ?? '').trim()])));
}

/** report files of one package, oldest month first */
function files(dir, re) {
  return readdirSync(dir).map(f => [f, f.match(re)]).filter(([, m]) => m).map(([f, m]) => ({ file: path.join(dir, f), month: m[1] })).sort((a, b) => a.month.localeCompare(b.month));
}
const esc = pkg => pkg.replace(/\./g, '\\.');

function nextMonth(m) {
  const y = +m.slice(0, 4), mo = +m.slice(4);
  return mo === 12 ? `${y + 1}01` : `${y}${String(mo + 1).padStart(2, '0')}`;
}

/** 1667700 -> 1600000 ; under 100 stays exact */
function floor2(n) {
  if (n < 100) return n;
  const p = 10 ** (String(n).length - 2);
  return Math.floor(n / p) * p;
}

function consoleInstalls(dir, pkg, playFloor) {
  const fs = files(dir, new RegExp(`^installs_${esc(pkg)}_(\\d{6})_overview\\.csv$`));
  if (!fs.length) throw new Error('no installs overview CSV');
  for (let i = 1; i < fs.length; i++) {
    if (fs[i].month !== nextMonth(fs[i - 1].month)) throw new Error(`months missing between ${fs[i - 1].month} and ${fs[i].month}`);
  }
  let total = 0, last = '';
  for (const f of fs) {
    for (const r of parse(decode(readFileSync(f.file)), ['Date', 'Daily Device Installs'])) {
      const v = r['Daily Device Installs'] === '' ? 0 : Number(r['Daily Device Installs']);
      if (!Number.isFinite(v) || v < 0) throw new Error(`bad value "${r['Daily Device Installs']}" on ${r.Date} in ${path.basename(f.file)}`);
      total += v;
      if (r.Date > last) last = r.Date;
    }
  }
  if (!total) throw new Error('total is 0');
  if (total < playFloor) throw new Error(`total ${total} is below the Play page's ${playFloor}+ (history incomplete)`);
  return { total, through: last, text: floor2(total).toLocaleString('en-US') + '+' };
}

function consoleScore(dir, pkg, playScore) {
  if (typeof playScore !== 'number') throw new Error('the Play page shows no rating yet');
  const fs = files(dir, new RegExp(`^reviews_${esc(pkg)}_(\\d{6})\\.csv$`));
  if (!fs.length) throw new Error('no reviews CSV');
  for (let i = 1; i < fs.length; i++) {
    if (fs[i].month !== nextMonth(fs[i - 1].month)) throw new Error(`months missing between ${fs[i - 1].month} and ${fs[i].month}`);
  }
  // one rating per review; an edited rating shows up again in a later month and wins
  const byReview = new Map();
  for (const f of fs) {
    for (const r of parse(decode(readFileSync(f.file)), ['Star Rating', 'Review Submit Millis Since Epoch', 'Review Link', 'Device'])) {
      const star = Number(r['Star Rating']), at = Number(r['Review Submit Millis Since Epoch']);
      if (!Number.isInteger(star) || star < 1 || star > 5 || !Number.isFinite(at) || at <= 0) throw new Error(`bad row (star "${r['Star Rating']}", time "${r['Review Submit Millis Since Epoch']}") in ${path.basename(f.file)}`);
      byReview.set(r['Review Link'] || `${at}|${r.Device}`, { star, at });
    }
  }
  const all = [...byReview.values()];
  const end = Math.max(...all.map(r => r.at));
  const recent = all.filter(r => end - r.at <= 30 * DAY).length;
  if (recent < MIN_RECENT) throw new Error(`only ${recent} ratings in the last 30 days (needs ${MIN_RECENT})`);
  let sw = 0, sv = 0;
  for (const r of all) { const w = 0.5 ** ((end - r.at) / DAY / HALF_LIFE_DAYS); sw += w; sv += w * r.star; }
  const value = sv / sw;
  if (!(value >= 1 && value <= 5)) throw new Error(`result ${value} out of range`);
  if (Math.abs(value - playScore) > MAX_DRIFT) throw new Error(`result ${value.toFixed(3)} is more than ${MAX_DRIFT} from the Play page's ${playScore}`);
  return { value, recent, through: new Date(end).toISOString().slice(0, 10), score: Math.round(value * 10) / 10 };
}

try {
  const dir = process.argv[2];
  if (!dir || !existsSync(dir)) throw new Error(`CSV folder "${dir ?? ''}" not found`);
  const play = JSON.parse(readFileSync(OUT, 'utf8'));
  const pkgs = JSON.parse(readFileSync(APPS, 'utf8')).apps.map(a => a.pkg).filter(Boolean);
  const rows = [];
  let changed = 0;
  for (const pkg of pkgs) {
    const p = play.apps?.[pkg];
    if (!p) { console.log(`skip ${pkg}: not in ${OUT}`); continue; }
    const before = { installs: p.installs, score: p.score };
    const info = {};
    try {
      const c = consoleInstalls(dir, pkg, installsNumber(p.installs));
      p.installs = c.text;
      Object.assign(info, { installs: c.total, installsThrough: c.through });
    } catch (e) { console.log(`FALLBACK ${pkg} installs: ${e.message}`); }
    try {
      const c = consoleScore(dir, pkg, p.score);
      p.score = c.score;
      Object.assign(info, { score: Math.round(c.value * 1000) / 1000, scoreRecentRatings: c.recent, scoreThrough: c.through });
    } catch (e) { console.log(`FALLBACK ${pkg} score: ${e.message}`); }
    if (Object.keys(info).length) { p.console = info; changed++; }
    rows.push([pkg, String(before.installs), String(p.installs), info.installs?.toLocaleString('en-US') ?? '-',
      String(before.score), String(p.score), info.score?.toFixed(3) ?? '-', info.installsThrough ?? '-']);
  }
  const head = ['package', 'installs before', 'installs after', 'console total', 'score before', 'score after', 'console score', 'through'];
  const w = head.map((h, i) => Math.max(h.length, ...rows.map(r => r[i].length)));
  for (const r of [head, ...rows]) console.log(r.map((c, i) => c.padEnd(w[i])).join('  '));
  if (changed) {
    writeFileSync(OUT, JSON.stringify(play, null, 1) + '\n');
    console.log(`Wrote ${OUT}: Console data for ${changed} app(s).`);
  } else console.log(`No Console data applied; ${OUT} unchanged.`);
} catch (e) {
  console.log(`FALLBACK all: ${e.message} (${OUT} unchanged)`);
}
process.exit(0);
