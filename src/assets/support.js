/* Support page: pick an app, pick a topic, or search. Without JavaScript every
   answer is already on the page and openable; this only narrows the list.
   Every control sets state, so a repeated or late tap just re-applies the same
   state and can never do work twice. */
(function () {
  'use strict';
  var input = document.getElementById('kbsearch');
  var apps = document.getElementById('kbapps');
  var filters = document.getElementById('kbfilters');
  var count = document.getElementById('kbcount');
  var none = document.getElementById('noresult');
  if (!input || !apps || !filters) return;

  var items = [].slice.call(document.querySelectorAll('details.q'));
  var groups = [].slice.call(document.querySelectorAll('.group'));
  var appButtons = [].slice.call(apps.querySelectorAll('button[data-app]'));
  var catButtons = [].slice.call(filters.querySelectorAll('button[data-cat]'));
  var known = appButtons.map(function (b) { return b.dataset.app; });
  var state = { app: 'all', cat: 'all' };

  function appsOf(d) { return (d.dataset.app || '').split(/\s+/); }
  function index() {
    items.forEach(function (d) { d.dataset.text = d.textContent.toLowerCase().replace(/\s+/g, ' '); });
  }

  function fromUrl() {
    var m = /[?&]app=([a-z0-9-]+)/.exec(location.search);
    return m && known.indexOf(m[1]) !== -1 ? m[1] : 'all';
  }

  function render() {
    var q = input.value.trim().toLowerCase();
    var shown = 0;
    var catsForApp = {};

    items.forEach(function (d) {
      var okApp = state.app === 'all' || appsOf(d).indexOf(state.app) !== -1;
      if (okApp) catsForApp[d.dataset.cat] = true;
    });
    // a topic with no answers for this app is hidden, and cannot stay selected
    if (state.cat !== 'all' && !catsForApp[state.cat]) state.cat = 'all';
    catButtons.forEach(function (b) {
      var c = b.dataset.cat;
      b.hidden = c !== 'all' && !catsForApp[c];
      b.setAttribute('aria-pressed', String(c === state.cat));
    });
    appButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.app === state.app)); });

    items.forEach(function (d) {
      var show = (state.app === 'all' || appsOf(d).indexOf(state.app) !== -1) &&
                 (state.cat === 'all' || d.dataset.cat === state.cat) &&
                 (!q || d.dataset.text.indexOf(q) !== -1);
      d.classList.toggle('hidden', !show);
      if (!show) d.open = false;
      if (show) shown++;
    });
    groups.forEach(function (g) { g.classList.toggle('hidden', !g.querySelector('details.q:not(.hidden)')); });
    none.classList.toggle('hidden', shown !== 0);
    var tpl = count.dataset.tpl || '{n} answers';
    count.textContent = tpl.replace('{n}', String(shown));
  }

  function setApp(app, push) {
    if (known.indexOf(app) === -1) app = 'all';
    if (app === state.app) { render(); return; }
    state.app = app;
    if (push !== false && window.history && history.replaceState) {
      var url = location.pathname + (app === 'all' ? '' : '?app=' + app) + location.hash;
      try { history.replaceState(null, '', url); } catch (e) {}
    }
    render();
  }

  apps.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-app]');
    if (b) setApp(b.dataset.app);
  });
  filters.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-cat]');
    if (!b) return;
    state.cat = b.dataset.cat;
    render();
  });
  input.addEventListener('input', render);
  document.addEventListener('i18n:applied', function () { index(); render(); });

  index();
  state.app = fromUrl();
  render();

  // keep the chosen app's chip in view on narrow screens
  var active = apps.querySelector('button[aria-pressed=true]');
  if (active && active.scrollIntoView && state.app !== 'all') {
    try { active.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {}
  }
})();
