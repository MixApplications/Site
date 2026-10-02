// Shared page frame: <head>, header, footer. Every page goes through layout().
import { esc } from './util.mjs';

export const SITE = 'https://www.mixapplications.com';
export const EMAIL = 'islam.saad2005@gmail.com';
export const WHATSAPP = 'https://wa.me/201111707320';
export const PLAY_DEV = 'https://play.google.com/store/apps/developer?id=MixApplications';

const FONTS = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@500&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap';

export const ICON = {
  globe: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3.2 9h17.6M3.2 15h17.6"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z"/></svg>',
  play: '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 3.5v17l11-8.5z"/><path d="M16.5 9.7 19.8 12l-3.3 2.3L13 12z" opacity=".7"/></svg>',
  arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
  help: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8"/><path d="M12 17.2v.01"/></svg>',
  shield: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/></svg>',
  mail: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/></svg>',
  whatsapp: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.02 2C6.58 2 2.16 6.42 2.16 11.86c0 1.74.46 3.44 1.32 4.94L2 22l5.34-1.4a9.82 9.82 0 0 0 4.68 1.19h.01c5.43 0 9.85-4.42 9.85-9.86C21.88 6.42 17.46 2 12.02 2Zm5.77 14.1c-.24.68-1.41 1.3-1.96 1.35-.5.05-.98.23-3.3-.69-2.78-1.1-4.55-3.94-4.69-4.13-.14-.19-1.12-1.49-1.12-2.85 0-1.35.71-2.02.96-2.29.25-.28.55-.35.73-.35h.52c.17 0 .4-.06.62.48.24.57.8 1.96.87 2.1.07.14.12.31.02.5-.09.19-.14.31-.28.47l-.42.49c-.14.14-.28.29-.12.57.16.28.72 1.18 1.54 1.92 1.06.94 1.95 1.23 2.23 1.37.28.14.44.12.6-.07.17-.19.7-.81.88-1.09.19-.28.37-.23.62-.14.25.09 1.64.77 1.92.91.28.14.47.21.54.33.07.11.07.66-.16 1.34Z"/></svg>',
  search: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>',
  chat: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5h16v11H8.5L4 20.2z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/></svg>',
  all: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg>',
  // generic app glyphs for apps without a Play icon
  doc: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2.8h8l4 4v14.4H6z"/><path d="M14 2.8v4h4"/><path d="M9 12h6M9 15.5h6M9 19h3.5"/></svg>',
  lock: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 14.6v2.4"/></svg>',
  disc: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4.6"/><circle cx="12" cy="8" r="1.2"/><path d="M8.6 11.6 6.4 20.5h11.2l-2.2-8.9"/></svg>',
  rings: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="9"/></svg>',
};

/**
 * page: { path, title, titleKey, description, nav, main, ltrOnly, noindex, scripts[], ogImage }
 * ctx:  { asset(name) -> versioned URL, apps, policies }
 */
export function layout(page, ctx) {
  const canonical = SITE + (page.path === '/index.html' ? '/' : page.path);
  const navLink = (href, key, label, id) =>
    `<a href="${href}"${page.nav === id ? ' aria-current="page"' : ''} data-i18n="${key}">${label}</a>`;
  const live = ctx.apps.filter(a => a.status === 'live');
  const scripts = (page.scripts || []).map(s => `<script src="${ctx.asset(s)}" defer></script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en"${page.ltrOnly ? ' data-ltr-only' : ''}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script>document.documentElement.classList.add('js')</script>
<title${page.titleKey ? ` data-i18n="${page.titleKey}"` : ''}>${page.title}</title>
<meta name="description" content="${esc(page.description)}">
${page.noindex ? '<meta name="robots" content="noindex">\n' : `<link rel="canonical" href="${canonical}">\n`}<meta property="og:title" content="${page.title}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${page.ogImage || SITE + '/assets/logo.png'}">
<meta name="theme-color" content="#F3F6FA" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0C1520" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="/site.webmanifest">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://play-lh.googleusercontent.com" crossorigin>
<link href="${FONTS}" rel="stylesheet">
<link rel="stylesheet" href="${ctx.asset('site.css')}">
${page.head || ''}</head>
<body>
<a class="skip" href="#main" data-i18n="nav.skip">Skip to content</a>

<header class="site">
  <div class="wrap topbar">
    <a class="brand" href="/"><img src="/assets/mark.png" alt="" width="47" height="30"><span>MixApplications</span></a>
    <nav class="top" aria-label="Main">
      ${navLink('/', 'nav.apps', 'Apps', 'apps')}
      ${navLink('/contact.html', 'nav.support', 'Support', 'support')}
      ${navLink('/privacy_policy.html', 'nav.privacy', 'Privacy', 'privacy')}
    </nav>
    <div class="lang" id="langpicker" hidden>
      <button type="button" class="lang-btn" aria-haspopup="menu" aria-expanded="false" aria-label="Language">${ICON.globe}<span class="lang-current">EN</span></button>
      <div class="lang-menu" role="menu"></div>
    </div>
  </div>
</header>

${page.main}

<footer class="site">
  <div class="wrap">
    <div class="fgrid">
      <div class="fbrand">
        <img src="/assets/logo-white.png" alt="MixApplications" width="74" height="50">
        <p data-i18n="foot.blurb">Android utilities and games, built to do the work on your phone. Developed in Egypt.</p>
      </div>
      <div class="fcol">
        <h2 data-i18n="nav.apps">Apps</h2>
        <ul>
${live.map(a => `          <li><a href="/apps/${a.id}.html">${a.short || a.name}</a></li>`).join('\n')}
        </ul>
      </div>
      <div class="fcol">
        <h2 data-i18n="foot.help">Help</h2>
        <ul>
          <li><a href="/contact.html" data-i18n="foot.faq">Support &amp; answers</a></li>
          <li><a href="mailto:${EMAIL}" data-i18n="sup.9">Email</a></li>
          <li><a href="${WHATSAPP}" rel="noopener" data-i18n="sup.11">WhatsApp</a></li>
          <li><a href="${PLAY_DEV}" data-i18n="nav.play">Google Play</a></li>
        </ul>
      </div>
      <div class="fcol">
        <h2 data-i18n="foot.legal">Privacy</h2>
        <ul>
${ctx.policies.map(p => `          <li><a href="/${p.file}">${p.label}</a></li>`).join('\n')}
        </ul>
      </div>
    </div>
    <p class="fnote" data-i18n="foot.note">&copy; 2026 MixApplications. Ratings, icons and screenshots come from the apps' Google Play listings.</p>
  </div>
</footer>

<script src="${ctx.asset('site.js')}" defer></script>
${scripts}
</body>
</html>
`;
}
