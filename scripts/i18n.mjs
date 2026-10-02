// Translation workflow helpers.
//
//   node scripts/i18n.mjs todo     write src/i18n/_todo.json: every string that is
//                                  new, or whose English changed since it was translated
//   node scripts/i18n.mjs accept   after translating the _todo.json keys into every
//                                  language file, record their current English as the
//                                  translation basis, then delete _todo.json
//
// The build ships a translated string only while its English still matches
// _basis.en.json, so an outdated translation falls back to English, never to
// the wrong meaning.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'i18n');
const read = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const ENT = { ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', mdash: '—', ndash: '–', rarr: '→', larr: '←', middot: '·', copy: '©', hellip: '…' };
const norm = s => String(s ?? '').replace(/&([a-z]+);/g, (m, n) => ENT[n] || m);

const source = read('_source.en.json');
const basis = read('_basis.en.json');
const codes = read('languages.json').languages.map(l => l.code).filter(c => c !== 'en');
const cmd = process.argv[2];

if (cmd === 'todo') {
  const todo = {};
  for (const [k, en] of Object.entries(source)) {
    const missing = codes.filter(c => { const v = read(c + '.json')[k]; return typeof v !== 'string' || !v; });
    const changed = k in basis && norm(basis[k]) !== en;
    if (missing.length || changed || !(k in basis)) {
      todo[k] = { en, ...(changed ? { previous_en: basis[k] } : {}), ...(missing.length && missing.length < codes.length ? { missing_in: missing } : {}) };
    }
  }
  fs.writeFileSync(path.join(DIR, '_todo.json'), JSON.stringify(todo, null, 1) + '\n');
  console.log(`${Object.keys(todo).length} string(s) to translate -> src/i18n/_todo.json`);
} else if (cmd === 'accept') {
  const todoPath = path.join(DIR, '_todo.json');
  if (!fs.existsSync(todoPath)) { console.error('no src/i18n/_todo.json — run "npm run i18n:todo" first'); process.exit(1); }
  const todo = JSON.parse(fs.readFileSync(todoPath, 'utf8'));
  const dicts = Object.fromEntries(codes.map(c => [c, read(c + '.json')]));
  const notDone = Object.keys(todo).filter(k => codes.some(c => typeof dicts[c][k] !== 'string' || !dicts[c][k]));
  if (notDone.length) { console.error(`not translated in every language yet: ${notDone.join(', ')}`); process.exit(1); }
  for (const k of Object.keys(todo)) basis[k] = source[k];
  // keys not on any page right now (e.g. a category heading with no app yet) keep their
  // basis, so their translations are ready the moment the text appears
  fs.writeFileSync(path.join(DIR, '_basis.en.json'), JSON.stringify(basis, null, 1) + '\n');
  fs.rmSync(todoPath);
  console.log(`accepted ${Object.keys(todo).length} translation(s); _todo.json removed`);
} else {
  console.error('usage: node scripts/i18n.mjs todo|accept');
  process.exit(1);
}
