// Page bodies. Each returns { path, title, description, nav, main, ... } for layout().
import { ICON, PLAY_DEV, SITE, EMAIL, WHATSAPP } from './layout.mjs';
import { esc, playText, playImg, installsNumber, compact, MIN_RATING } from './util.mjs';

const playUrl = pkg => `https://play.google.com/store/apps/details?id=${pkg}`;
const style = a => `--c:var(--${a.color});--csoft:var(--${a.color}-soft)`;
const reviews = n => (n >= 1e3 ? (Math.floor(n / 100) / 10).toFixed(1).replace(/\.0$/, '') + 'K' : String(n));

function badges(p) {
  const out = [];
  if (typeof p.score === 'number' && p.score >= MIN_RATING) {
    out.push(`<span class="badge rate"><span class="star" aria-hidden="true">★</span>${p.score.toFixed(1)} · ${reviews(p.ratings || 0)} <span data-i18n="home.rv">reviews</span></span>`);
  }
  if (installsNumber(p.installs) > 0) {
    out.push(`<span class="badge">${esc(p.installs)} <span data-i18n="home.dl">downloads</span></span>`);
  }
  return out.length ? `<div class="badges">${out.join('')}</div>` : '';
}

function appIcon(a, p, size) {
  if (p && p.icon) {
    return `<div class="appicon"><img src="${playImg(p.icon, 's' + size * 2)}" alt="${esc(a.short || a.name)} icon" width="${size}" height="${size}"${size < 100 ? ' loading="lazy"' : ''}></div>`;
  }
  return `<div class="appicon gen" aria-hidden="true">${ICON[a.icon] || ICON.doc}</div>`;
}

// ---------------------------------------------------------------- home
export function home(ctx) {
  const { apps, play, data } = ctx;
  const live = apps.filter(a => a.status === 'live');
  const totalInstalls = live.reduce((s, a) => s + installsNumber(play[a.pkg]?.installs), 0);
  const totalReviews = live.reduce((s, a) => s + (play[a.pkg]?.ratings || 0), 0);

  const card = a => {
    const p = play[a.pkg] || {};
    return `      <article class="tile appcard reveal" style="${style(a)}">
        <div class="head">
          ${appIcon(a, p, 64)}
          <div>
            <h3><a href="/apps/${a.id}.html">${a.name}</a></h3>
            <p class="summary" data-i18n="play.${a.id}.summary">${playText(p.summary || '')}</p>
          </div>
        </div>
        ${badges(p)}
${a.chips && a.chips.length ? `        <div class="chips">${a.chips.slice(0, 4).map(c => `<span class="chip">${c}</span>`).join('')}</div>
` : ''}
        <div class="actions">
          <a class="btn btn--ghost btn--sm" href="/apps/${a.id}.html"><span data-i18n="home.details">Details</span></a>
          <a class="btn btn--sm" href="${playUrl(a.pkg)}">${ICON.play}<span data-i18n="home.get">Google Play</span></a>
        </div>
      </article>`;
  };
  const retiredItem = a => {
    const note = a.mergedInto
      ? `<span class="note merged" data-i18n="home.merged">Merged into <a href="/apps/${a.mergedInto}.html">DROFUS</a></span>`
      : `<span class="note" data-i18n="home.offline">Currently unpublished from Google Play</span>`;
    const desc = a.descKey ? `<p data-i18n="${a.descKey}">${a.desc}</p>` : '';
    return `      <div class="tile item" style="${style(a)}">
        ${appIcon(a, null, 46)}
        <div><h3>${a.short || a.name}</h3>${desc}${note}</div>
      </div>`;
  };

  const shelves = data.categories.map(c => {
    const list = live.filter(a => a.category === c.id);
    if (!list.length) return '';
    return `    <div class="shelf" id="${c.id}"><h2 data-i18n="${c.key}">${c.name}</h2></div>
    <div class="grid">
${list.map(card).join('\n')}
    </div>`;
  }).join('\n\n');

  const upcoming = apps.some(a => a.status === 'unlisted' || a.status === 'soon');
  const retired = apps.filter(a => a.status === 'retired');

  const main = `<main id="main">
  <div class="wrap">
    <section class="hero">
      <div>
        <p class="eyebrow" data-i18n="home.eyebrow">Android apps by MixApplications</p>
        <h1 data-i18n="home.1">Android apps that do the real work on <em>your phone</em>.</h1>
        <p class="sub" data-i18n="home.2">MixApplications builds Android utilities and games: bootable USB drives, drive repair and USB file management over a plain OTG connection, MIUI and HyperOS theme building, and calm puzzle games. <strong>Your files are processed on your device and never uploaded. No PC, and no root needed for USB drives.</strong></p>
        <div class="ctas">
          <a class="btn" href="#apps"><span data-i18n="home.cta.apps">Browse the apps</span></a>
          <a class="btn btn--ghost" href="/contact.html"><span data-i18n="home.cta.help">Get support</span></a>
        </div>
      </div>
      <aside class="stats" aria-label="At a glance">
        <div class="iconrow">
${live.map(a => `          <a href="/apps/${a.id}.html" title="${esc(a.short || a.name)}"><img src="${playImg(play[a.pkg]?.icon, 's96')}" alt="${esc(a.short || a.name)}" width="48" height="48"></a>`).join('\n')}
        </div>
        <div class="statgrid">
          <div class="stat"><b>${compact(totalInstalls)}+</b><span data-i18n="home.st.dl">downloads on Google Play</span></div>
          <div class="stat"><b>${compact(totalReviews)}+</b><span data-i18n="home.st.rv">reviews from users</span></div>
          <div class="stat"><b>${live.length}</b><span data-i18n="home.st.apps">apps on Google Play</span></div>
        </div>
      </aside>
    </section>

    <section id="apps">
${shelves}

${upcoming ? `    <div class="tile upcoming reveal">
      <b data-i18n="home.up.t">More apps are on the way</b>
      <span data-i18n="home.up.s">New apps appear here the day they are released on Google Play.</span>
    </div>

` : ''}    <div class="shelf" id="retired"><h2 data-i18n="home.shelf.retired">Retired</h2></div>
    <div class="retired">
${retired.map(retiredItem).join('\n')}
    </div>
    </section>

    <section>
      <div class="shelf"><h2 data-i18n="home.29">How every app here is built</h2></div>
      <div class="principles">
        <div class="tile reveal" style="--c:var(--blue)"><b data-i18n="home.pr.1">On-device processing</b><span data-i18n="home.prd.1">Your files, drives and documents are processed on your phone and never uploaded to us.</span></div>
        <div class="tile reveal" style="--c:var(--green)"><b data-i18n="home.pr.2">No root for USB drives</b><span data-i18n="home.prd.2">Everything works over USB-OTG on a stock phone. Root is only ever needed for internal SD cards.</span></div>
        <div class="tile reveal" style="--c:var(--violet)"><b data-i18n="home.pr.3">Native low-level engine</b><span data-i18n="home.prd.3">File systems and partition tables are handled by native C/C++ code written for Android.</span></div>
        <div class="tile reveal" style="--c:var(--amber)"><b data-i18n="home.pr.4">Free first</b><span data-i18n="home.prd.4">Every app is free to use, supported by ads. Where an app has a paid upgrade, it is a one-time purchase — never a subscription.</span></div>
      </div>
    </section>
  </div>
</main>`;

  const ld = {
    '@context': 'https://schema.org', '@type': 'Organization', name: 'MixApplications', url: SITE + '/',
    logo: SITE + '/assets/logo.png', email: EMAIL, sameAs: [PLAY_DEV],
  };
  return {
    path: '/index.html', nav: 'apps',
    title: 'MixApplications — USB Tools, Theme Editor and Games for Android', titleKey: 'home.title',
    description: 'Android apps by MixApplications: create bootable USB drives without a PC, multi-boot with Ventoy, format and repair drives, manage USB files on NTFS/exFAT/ext4, build MIUI and HyperOS themes, and play the TumTum puzzle game. Everything is processed on your device.',
    head: `<script type="application/ld+json">${JSON.stringify(ld)}</script>\n`,
    main,
  };
}

// ---------------------------------------------------------------- app page
function proof(p) {
  const items = [];
  if (installsNumber(p.installs) > 0) items.push(`<div><b>${compact(installsNumber(p.installs))}+</b><span data-i18n="home.dl">downloads</span></div>`);
  if (typeof p.score === 'number' && p.score >= MIN_RATING) items.push(`<div><b>${p.score.toFixed(1)} ★</b><span data-i18n="app.rating">average rating</span></div>`);
  if (p.ratings && typeof p.score === 'number' && p.score >= MIN_RATING) items.push(`<div><b>${reviews(p.ratings)}</b><span data-i18n="home.rv">reviews</span></div>`);
  return items.length ? `        <div class="proof">${items.join('')}</div>
` : '';
}
export function appPage(a, ctx) {
  const { apps, play } = ctx;
  const p = play[a.pkg] || {};
  const others = apps.filter(o => o.status === 'live' && o.id !== a.id);
  const shots = (p.screenshots || []).slice(0, 8);
  const helpUrl = a.faq ? `/contact.html?app=${a.faq}#faq` : '/contact.html';
  const policyUrl = a.policy ? '/' + a.policy : (a.policyUrl || '');
  const main = `<main id="main" class="wrap" style="${style(a)}">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/" data-i18n="nav.apps">Apps</a> / ${esc(a.short || a.name)}</nav>
  <header class="apphead">
    ${appIcon(a, p, 112)}
    <div>
      <h1>${a.name}</h1>
      <p class="summary" data-i18n="play.${a.id}.summary">${playText(p.summary || '')}</p>
      ${badges(p)}
    </div>
    <div class="cta">
      <a class="btn" href="${playUrl(a.pkg)}">${ICON.play}<span data-i18n="home.get">Google Play</span></a>
      <a class="btn btn--ghost" href="${helpUrl}"><span data-i18n="app.help">Help &amp; answers</span></a>
    </div>
  </header>
  <div class="applayout">
    <div class="appmain">
${a.desc || a.headline ? `      <section class="panel about">
        <h2 data-i18n="app.about">About the app</h2>
${a.headline ? `        <p class="headline" data-i18n="app.${a.id}.h">${a.headline}</p>
` : ''}${a.desc ? `        <p class="lead" data-i18n="${a.descKey}">${a.desc}</p>
` : ''}${proof(p)}${(a.features || []).length ? `        <div class="features">
${a.features.map((f, i) => `          <div class="feature"><h3 data-i18n="app.${a.id}.f${i + 1}">${f.title}</h3><p data-i18n="app.${a.id}.f${i + 1}d">${f.text}</p></div>`).join('\n')}
        </div>
` : ''}${a.chips && a.chips.length ? `        <div class="chips">${a.chips.map(c => `<span class="chip">${c}</span>`).join('')}</div>
` : ''}      </section>
` : ''}${shots.length ? `      <section class="panel">
        <h2 data-i18n="app.shots">Screenshots</h2>
        <div class="shots">
${shots.map((u, i) => `          <img src="${playImg(u, 'h600')}" alt="${esc(a.short || a.name)} screenshot ${i + 1}" height="300" loading="lazy">`).join('\n')}
        </div>
      </section>` : ''}
${p.description ? `      <details class="full"${a.desc ? '' : ' open'}>
        <summary data-i18n="home.full">Full description from Google Play</summary>
        <div class="fulldesc" data-i18n="play.${a.id}.description">${playText(p.description.trim())}</div>
      </details>` : ''}
    </div>
    <aside class="aside">
      <div class="panel">
        <h2 data-i18n="app.links">Help and privacy</h2>
        <ul>
          <li><a href="${helpUrl}">${ICON.help}<span data-i18n="${a.faq ? 'app.faq' : 'foot.faq'}">${a.faq ? 'Answers for this app' : 'Support &amp; answers'}</span></a></li>
${policyUrl ? `          <li><a href="${policyUrl}">${ICON.shield}<span data-i18n="app.policy">Privacy policy</span></a></li>
` : ''}
          <li><a href="${playUrl(a.pkg)}">${ICON.play}<span data-i18n="home.view">View on Google Play</span></a></li>
        </ul>
        <p class="meta">${a.pkg}</p>
      </div>
      <div class="panel">
        <h2 data-i18n="app.more">More apps</h2>
        <div class="others">
${others.map(o => `          <a href="/apps/${o.id}.html"><img src="${playImg(play[o.pkg]?.icon, 's68')}" alt="" width="34" height="34" loading="lazy">${o.short || o.name}</a>`).join('\n')}
        </div>
      </div>
    </aside>
  </div>
</main>`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: a.short || a.name,
    operatingSystem: 'Android', applicationCategory: a.category === 'games' ? 'GameApplication' : 'UtilitiesApplication',
    url: SITE + `/apps/${a.id}.html`, image: playImg(p.icon, 's512'), installUrl: playUrl(a.pkg),
    publisher: { '@type': 'Organization', name: 'MixApplications' },
    description: [a.headline, a.desc].filter(Boolean).map(t => t.replace(/<[^>]+>/g, '')).join(' '),
    ...(a.features ? { featureList: a.features.map(f => `${f.title}: ${f.text}`) } : {}),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
  if (typeof p.score === 'number' && p.ratings) {
    ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: p.score.toFixed(1), ratingCount: p.ratings };
  }
  return {
    path: `/apps/${a.id}.html`, nav: 'apps',
    title: `${a.short || a.name} for Android — MixApplications`,
    description: (a.headline || playText(p.summary || '') || (a.desc || '')).replace(/<[^>]+>/g, ''),
    ogImage: playImg(p.icon, 's512'),
    head: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>\n`,
    main,
  };
}

// ---------------------------------------------------------------- app that left Google Play
// Keeps its URL alive (bookmarks, links in old reviews) with an honest note.
export function unpublishedPage(a) {
  const main = `<main id="main" class="wrap" style="${style(a)}">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/" data-i18n="nav.apps">Apps</a> / ${esc(a.short || a.name)}</nav>
  <header class="apphead">
    ${appIcon(a, null, 112)}
    <div>
      <h1>${a.name}</h1>
      <p class="summary" data-i18n="home.offline">Currently unpublished from Google Play</p>
    </div>
    <div class="cta">
      <a class="btn" href="/"><span data-i18n="nf.b">Back to the apps</span></a>
      <a class="btn btn--ghost" href="/contact.html${a.faq ? `?app=${a.faq}#faq` : ''}"><span data-i18n="app.help">Help &amp; answers</span></a>
    </div>
  </header>
${a.desc ? `  <section class="panel"><p class="lead" data-i18n="${a.descKey}">${a.desc}</p></section>
` : ''}</main>`;
  return { path: `/apps/${a.id}.html`, nav: 'apps', title: `${a.short || a.name} — MixApplications`,
    description: `${a.short || a.name} is currently unpublished from Google Play.`, noindex: true, main };
}

// ---------------------------------------------------------------- support
export function support(ctx, fragment) {
  const { apps, play, data } = ctx;
  const iconFor = fam => {
    const a = apps.find(x => x.faq === fam.id && x.status === 'live') || apps.find(x => x.faq === fam.id);
    const p = a && play[a.pkg];
    return p && p.icon
      ? `<img src="${playImg(p.icon, 's52')}" alt="" width="26" height="26">`
      : `<span class="dot" style="${a ? style(a) : ''}">${a ? (ICON[a.icon] || ICON.doc).replace(/width="\d+" height="\d+"/, 'width="16" height="16"') : ''}</span>`;
  };
  const applist = `<div class="applist" id="kbapps" role="group" aria-label="Choose your app">
          <button type="button" data-app="all" aria-pressed="true"><span class="dot">${ICON.all}</span><span data-i18n="sup.app.all">All apps</span></button>
${data.faqFamilies.map(f => `          <button type="button" data-app="${f.id}" aria-pressed="false">${iconFor(f)}<span data-i18n="${f.key}">${f.name}</span></button>`).join('\n')}
        </div>`;
  const count = (fragment.match(/<details class="q"/g) || []).length;
  const main = `<main id="main" class="wrap narrow">
${fragment.replace('<!--applist-->', applist).replace(/\{count\}/g, String(count))}
</main>`;
  return {
    path: '/contact.html', nav: 'support',
    title: 'Support &amp; Contact — MixApplications', titleKey: 'sup.title',
    description: (() => {
      const names = apps.filter(a => a.status === 'live').map(a => a.short || a.name);
      return `Answers to the most common questions about ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}, and how to contact MixApplications by email or WhatsApp.`;
    })(),
    scripts: ['support.js'],
    main,
  };
}

// ---------------------------------------------------------------- policy
export function policy(file, meta, fragment, ctx) {
  const pick = re => { const m = fragment.match(re); return m ? m[0] : ''; };
  const head = pick(/<section class="pagehead[\s\S]*?<\/section>/);
  const hi = pick(/<div class="highlight[\s\S]*?<\/div>/);
  const toc = pick(/<nav class="toc[\s\S]*?<\/nav>/);
  const art = pick(/<article class="panel[\s\S]*?<\/article>/);
  if (!head || !toc || !art) throw new Error('policy fragment missing a part: ' + file);
  const clean = s => s.replace(/ reveal( in| d\d)?/g, '');
  const links = `<nav class="policy-links" aria-label="Privacy policies">
${ctx.policies.map(p => `      <a href="/${p.file}"${p.file === file ? ' aria-current="page"' : ''}>${p.label}</a>`).join('\n')}
    </nav>`;
  const main = `<main id="main" class="wrap">
  ${clean(head).replace('</section>', `  ${links}\n  </section>`)}
  <div class="policy">
    ${clean(toc).replace('class="toc', 'class="tile toc')}
    <div class="policy-body">
      ${clean(hi).replace('class="highlight', 'class="tile highlight')}
      ${clean(art)}
    </div>
  </div>
</main>`;
  return {
    path: '/' + file, nav: 'privacy', ltrOnly: true,
    title: meta.title, description: meta.description, main,
  };
}

// ---------------------------------------------------------------- 404
export function notFound() {
  return {
    path: '/404.html', nav: '', noindex: true,
    title: 'Page not found — MixApplications', description: 'This page does not exist.',
    main: `<main id="main" class="wrap nf">
  <span class="code">404 — unallocated</span>
  <h1 data-i18n="nf.t">This page isn't here</h1>
  <p data-i18n="nf.s">The link may be outdated, or the page has moved.</p>
  <a class="btn" href="/"><span data-i18n="nf.b">Back to the apps</span></a>
</main>`,
  };
}
