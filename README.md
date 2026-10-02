# www.mixapplications.com

The MixApplications website: app pages, support answers and privacy policies.
It is built from `src/` by a small dependency-free Node script and deployed to
GitHub Pages by `.github/workflows/site.yml`.

## Layout

    src/data/apps.json       every app: status (live / soon / retired), category,
                             colour, description, chips, support family, policy
    src/data/play.json       live Google Play data (icon, screenshots, rating,
                             installs, texts); refreshed weekly by the workflow
    src/templates/           page frame (layout.mjs) and page bodies (pages.mjs)
    src/content/support.html support answers; each answer names its apps in data-app
    src/content/policies/    the privacy policies (URLs are fixed: Play listings link them)
    src/assets/              site.css, site.js, support.js (versioned by content hash)
    src/static/              copied as-is: icons, logos, CNAME, app-ads.txt, robots.txt
    src/i18n/                translations; see src/i18n/README.md
    scripts/                 build, check, sync-play, i18n, serve

## Everyday work

    npm ci                 install (once)
    npm run build          build into _site/
    npm run check          validate HTML, links, anchors and app data
    npm run serve          preview _site/ at http://127.0.0.1:8765
    npm run sync           refresh src/data/play.json from Google Play

Add an app: add it to `src/data/apps.json` (status `soon` until it is on
Google Play, then `live` with its `pkg`), run `npm run sync` and
`npm run build`. Home page, app page, footer, sitemap and the Play sync all
follow from that one entry.

Pushing to `main` builds, checks and deploys. A failing check stops the deploy.
