# Translations

The site is written in English directly in the HTML. That is what search
engines index and what visitors see if JavaScript is unavailable — so the
site is never blank or broken, whatever happens here.

Other languages are layered on top at runtime from JSON files in this folder.

## Files

    _source.en.json    every translatable string on the site, keyed.
                       This is the file you hand to a translator.
    languages.json     which languages appear in the header picker.
    <code>.json        one file per language, e.g. ar.json, pt.json.

## Adding a language

1. Copy `_source.en.json` and translate the **values**. Leave the keys alone.
2. Save it here as `<code>.json` using the two-letter code (`ar`, `pt`, `es`…).
3. Add an entry to `languages.json`:

       { "code": "ar", "name": "Arabic", "native": "العربية", "rtl": true }

   `native` is what the picker shows. Add `"rtl": true` only for
   right-to-left languages — Arabic, Hebrew, Persian, Urdu.

No code changes. The picker appears on its own as soon as `languages.json`
lists more than one language.

## Partial translations are safe

Any key you leave out falls back to the English already on the page. You can
ship a file with ten strings translated and add the rest later; visitors see
a mix, never a gap.

## Keeping the markup intact

Some strings contain HTML tags:

    "sup.5": "Your <strong>phone model</strong> and the <strong>app name and version</strong>"

Keep the tags where they belong in the translated sentence. `<strong>`, `<em>`
and `<code>` are emphasis; `<a href="…">` is a link — translate the text
inside it, never the `href`. `&nbsp;` is a non-breaking space and `&mdash;`
is an em dash; both can stay as they are.

`{n}` in `sup.count` is replaced with a number at runtime. Keep it.

## What is deliberately not translatable

App names (Ultimate USB, DROFUS, Ventoy, USB Tools, ChaoMe), the app
taglines and full descriptions on the home page — those come live from
Google Play, so they follow whatever is in the Play Console listing — and
the privacy policy, which stays in English as a legal document.
