// Fills the {{fact}} tokens that site text (English and every translation) uses for counts that grow, so each
// daily build shows current numbers with no text edits. The values come from scripts/build.mjs (Play / Play Console
// data of that build and today's date):
//   {{year}}                    the current year, never digit-grouped
//   {{usbYears}} {{apps}}       small counts
//   {{dl:total}} {{dl:<id>,...}} download counts (the build rounds them down to whole millions)
//   {{plural:<fact>|one=..|few=..|many=..|other=..}}  the word form that number needs in that language
//                               (Intl.PluralRules categories; a missing category uses "other")
// Numbers use the language's own grouping with Latin digits (de 19.000.000, fr 19 000 000, hi 1,90,00,000).
//
//   node scripts/facts.mjs --self-test
export function fillFacts(text, lang, value) {
  if (!text.includes('{{')) return text;
  const num = new Intl.NumberFormat(`${lang}-u-nu-latn`);
  return text
    .replace(/\{\{plural:(\w+)\|([^}]*)\}\}/g, (_, name, forms) => {
      const f = Object.fromEntries(forms.split('|').map(s => s.split('=')));
      const form = f[new Intl.PluralRules(lang).select(value(name))] ?? f.other;
      if (form == null) throw new Error(`{{plural:${name}}} in ${lang} has no "other" form`);
      return form;
    })
    .replace(/\{\{(\w+)(?::([\w,-]+))?\}\}/g, (_, name, arg) => name === 'year' ? String(value(name)) : num.format(value(name, arg)));
}

// whole years from a YYYY-MM-DD day to now (UTC): a year counts from its anniversary day on
export function fullYears(since, now) {
  const s = new Date(since + 'T00:00:00Z');
  if (Number.isNaN(+s)) throw new Error('not a YYYY-MM-DD day: ' + since);
  const before = now.getUTCMonth() < s.getUTCMonth() || (now.getUTCMonth() === s.getUTCMonth() && now.getUTCDate() < s.getUTCDate());
  return now.getUTCFullYear() - s.getUTCFullYear() - (before ? 1 : 0);
}

if (process.argv.includes('--self-test')) {
  const v = facts => (name, arg) => { const k = arg ? `${name}:${arg}` : name; if (!(k in facts)) throw new Error('unknown ' + k); return facts[k]; };
  const ru = n => fillFacts('{{plural:usbYears|one=года|other=лет}} / {{plural:usbYears|one=год|few=года|other=лет}}', 'ru', v({ usbYears: n }));
  const cases = [
    [fillFacts('© {{year}}', 'de', v({ year: 2027 })), '© 2027'],
    [fillFacts('{{dl:total}}', 'en', v({ 'dl:total': 19e6 })), '19,000,000'],
    [fillFacts('{{dl:total}}', 'de', v({ 'dl:total': 19e6 })), '19.000.000'],
    [fillFacts('{{dl:total}}', 'fr', v({ 'dl:total': 19e6 })), '19 000 000'],
    [fillFacts('{{dl:total}}', 'hi', v({ 'dl:total': 19e6 })), '1,90,00,000'],
    [fillFacts('{{dl:a,b}}', 'ar', v({ 'dl:a,b': 2e6 })), '2,000,000'],
    [fillFacts('{{usbYears}} {{plural:usbYears|few=سنوات|other=سنة}}', 'ar', v({ usbYears: 10 })), '10 سنوات'],
    [fillFacts('{{usbYears}} {{plural:usbYears|few=سنوات|other=سنة}}', 'ar', v({ usbYears: 11 })), '11 سنة'],
    [ru(9), 'лет / лет'], [ru(21), 'года / год'], [ru(22), 'лет / года'],
    [fillFacts('{{plural:usbYears|one=rok|few=lata|other=lat}}', 'pl', v({ usbYears: 21 })), 'lat'],
    [fillFacts('{{plural:usbYears|one=rok|few=lata|other=lat}}', 'pl', v({ usbYears: 22 })), 'lata'],
    [fillFacts('no tokens', 'en', v({})), 'no tokens'],
    [fullYears('2017-10-23', new Date('2026-11-19T12:00:00Z')), 9],
    [fullYears('2017-10-23', new Date('2027-10-22T23:59:59Z')), 9],
    [fullYears('2017-10-23', new Date('2027-10-23T00:00:00Z')), 10],
    [fullYears('2017-10-23', new Date('2028-01-01T00:00:00Z')), 10],
  ];
  const wrong = cases.filter(([got, want]) => got !== want);
  let threw = false; try { fillFacts('{{nope}}', 'en', v({})); } catch { threw = true; }
  if (wrong.length || !threw) { console.error('facts self-test failed:', JSON.stringify(wrong), threw ? '' : '(unknown fact did not fail)'); process.exit(1); }
  console.log(`facts self-test ok (${cases.length + 1} cases)`);
}
