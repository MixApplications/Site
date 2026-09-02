/* ============================================================================
   MixApplications — shared behaviour
   1. header state on scroll
   2. scroll reveal
   3. language switching (i18n)
   Every part degrades to a fully working English page without JavaScript.
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. header ------------------------------------------------------- */
  var header = document.querySelector('header.site');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---- 2. reveal ------------------------------------------------------- */
  function revealAll() {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }
  var items = document.querySelectorAll('.reveal');
  if (items.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      revealAll();
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          io.unobserve(e.target);
        });
      // threshold must stay 0: it is a fraction of the ELEMENT's own area,
      // so any higher value makes tall blocks reveal later than short ones
      // (.kb on the support page is ~4500px, and 0.05 delayed it by ~250px).
      // rootMargin alone decides the trigger line, independent of height.
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
      items.forEach(function (el) { io.observe(el); });
      window.addEventListener('load', function () {
        setTimeout(function () {
          document.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
            if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in');
          });
        }, 400);
      });
    }
  }

  /* ---- 3. i18n --------------------------------------------------------- */
  /* English lives in the HTML: it is what search engines index and what shows
     with JavaScript off. Other languages are layered on at runtime from
     i18n/<code>.json, listed in i18n/languages.json. Any key a locale file
     omits falls back to the English already on the page, so a partial
     translation is always safe. The picker stays hidden until more than one
     language is listed — see i18n/README.md. */

  var STORE = 'mixapp.lang';
  var picker = document.getElementById('langpicker');
  var english = null;
  var cache = {};
  var LANGS = [{ code: 'en', name: 'English', native: 'English' }];

  function snapshot() {
    if (english) return;
    english = {};
    document.querySelectorAll('[data-i18n]:not(title)').forEach(function (el) {
      english[el.getAttribute('data-i18n')] = el.innerHTML;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.dataset.phEn = el.getAttribute('placeholder') || '';
    });
    document.querySelectorAll('[data-i18n-tpl]').forEach(function (el) {
      el.dataset.tplEn = el.dataset.tpl || '';
    });
  }

  function known(code) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return LANGS[i];
    return null;
  }

  function preferred() {
    var saved = null;
    try { saved = localStorage.getItem(STORE); } catch (e) {}
    if (saved && known(saved)) return saved;
    var navLangs = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < navLangs.length; i++) {
      var base = String(navLangs[i]).toLowerCase().split('-')[0];
      if (known(base)) return base;
    }
    return 'en';
  }

  function pick(dict, key, fallback) {
    var v = dict && dict[key];
    return (typeof v === 'string' && v !== '') ? v : fallback;
  }

  function apply(dict, meta) {
    snapshot();
    document.querySelectorAll('[data-i18n]:not(title)').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      el.innerHTML = pick(dict, k, english[k]);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.setAttribute('placeholder', pick(dict, el.getAttribute('data-i18n-ph'), el.dataset.phEn));
    });
    document.querySelectorAll('[data-i18n-tpl]').forEach(function (el) {
      el.dataset.tpl = pick(dict, el.getAttribute('data-i18n-tpl'), el.dataset.tplEn);
    });
    var t = document.querySelector('title[data-i18n]');
    if (t) {
      var tk = t.getAttribute('data-i18n');
      if (!t.dataset.en) t.dataset.en = t.textContent;
      t.textContent = pick(dict, tk, t.dataset.en);
    }
    document.documentElement.lang = meta.code;
    if (!document.documentElement.hasAttribute('data-ltr-only')) {
      document.documentElement.dir = meta.rtl ? 'rtl' : 'ltr';
    }
    document.dispatchEvent(new CustomEvent('i18n:applied', { detail: { lang: meta.code } }));
  }

  function setLang(code, remember) {
    var meta = known(code) || LANGS[0];
    if (remember !== false) { try { localStorage.setItem(STORE, meta.code); } catch (e) {} }
    if (meta.code === 'en') { apply(null, meta); paint(meta); return; }
    if (cache[meta.code]) { apply(cache[meta.code], meta); paint(meta); return; }
    fetch('i18n/' + meta.code + '.json', { cache: 'default' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { cache[meta.code] = d || {}; apply(cache[meta.code], meta); paint(meta); })
      .catch(function () { apply(null, meta); paint(meta); });
  }

  function paint(meta) {
    if (!picker) return;
    var label = picker.querySelector('.lang-current');
    if (label) label.textContent = meta.code.toUpperCase();
    picker.querySelectorAll('[data-lang]').forEach(function (b) {
      b.setAttribute('aria-current', String(b.getAttribute('data-lang') === meta.code));
    });
    var btn = picker.querySelector('.lang-btn');
    if (btn) btn.setAttribute('aria-label', 'Language: ' + meta.native);
  }

  function buildPicker() {
    if (!picker) return;
    if (LANGS.length < 2) { picker.hidden = true; return; }   // English only — nothing to choose
    picker.hidden = false;
    var menu = picker.querySelector('.lang-menu');
    menu.innerHTML = LANGS.map(function (l) {
      return '<button type="button" role="menuitem" data-lang="' + l.code + '">' +
             '<span class="lang-native">' + l.native + '</span>' +
             '<span class="lang-en">' + (l.name || l.code.toUpperCase()) + '</span></button>';
    }).join('');

    var toggle = function (open) {
      picker.classList.toggle('open', open);
      picker.querySelector('.lang-btn').setAttribute('aria-expanded', String(open));
    };
    picker.querySelector('.lang-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      toggle(!picker.classList.contains('open'));
    });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lang]');
      if (!b) return;
      setLang(b.getAttribute('data-lang'));
      toggle(false);
    });
    document.addEventListener('click', function () { toggle(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
  }

  snapshot();
  if (picker) picker.hidden = true;      // stays hidden unless the manifest offers a choice

  fetch('i18n/languages.json', { cache: 'default' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (d && Array.isArray(d.languages) && d.languages.length) LANGS = d.languages;
      buildPicker();
      setLang(preferred(), false);
    })
    .catch(function () { buildPicker(); });

})();
