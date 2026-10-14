/* KORRTO 2026 — портфолио (portfolio.html) и страница проекта (case.html?id=…). Данные — cases-data.js. */
(function () {
  'use strict';
  var K = window.KORRTO, D = window.KORRTO_CASES, S = window.KORRTO_STOCK;
  var esc = K.esc, plural = K.plural;
  var $ = function (s) { return document.querySelector(s); };
  var typeName = {}; D.types.forEach(function (t) { typeName[t.id] = t.name; });

  var cardHTML = function (c, wide) {
    var n = c.photos.length;
    return '<a class="pcard' + (wide ? ' pcard--wide' : '') + '" href="case.html?id=' + c.id + '">' +
      '<span class="pcard__media"><img src="' + c.photos[0][0] + '" alt="' + esc(c.photos[0][1]) + '" loading="lazy">' +
        '<span class="pcard__logo"><img src="' + c.logo + '" alt="" loading="lazy"></span>' +
        (n > 1 ? '<span class="pcard__count mono"><i data-lucide="images"></i>' + n + ' ' + plural(n, 'фото', 'фото', 'фото') + '</span>' : '') + '</span>' +
      '<span class="pcard__kind mono">' + esc(c.kind) + '</span>' +
      '<h3 class="pcard__name">' + esc(c.name) + '</h3>' +
      '<p class="pcard__lead">' + esc(c.lead) + '</p></a>';
  };

  /* ---------- Список проектов ---------- */
  var grid = $('[data-pf-grid]');
  if (grid) {
    var params = new URLSearchParams(location.search);
    var cur = params.get('type') || 'all';
    var renderFilters = function () {
      var all = [{ id: 'all', name: 'Все проекты', n: D.items.length }].concat(D.types.map(function (t) {
        return { id: t.id, name: t.name, n: D.items.filter(function (c) { return c.type === t.id; }).length };
      }).filter(function (t) { return t.n; }));
      $('[data-pf-filters]').innerHTML = all.map(function (t) {
        return '<button type="button" data-type="' + t.id + '" aria-pressed="' + (t.id === cur) + '">' + esc(t.name) + ' <span>' + t.n + '</span></button>';
      }).join('');
    };
    var renderGrid = function () {
      var list = D.items.filter(function (c) { return cur === 'all' || c.type === cur; });
      grid.innerHTML = list.map(function (c, i) { return cardHTML(c, cur === 'all' && i === 0); }).join('');
      K.icons();
    };
    $('[data-pf-filters]').addEventListener('click', function (e) {
      var b = e.target.closest('[data-type]'); if (!b) return;
      cur = b.getAttribute('data-type');
      var u = new URL(location.href);
      if (cur === 'all') u.searchParams.delete('type'); else u.searchParams.set('type', cur);
      history.replaceState(null, '', u);
      renderFilters(); renderGrid();
    });
    renderFilters(); renderGrid();
    return;
  }

  /* ---------- Страница проекта ---------- */
  var id = new URLSearchParams(location.search).get('id');
  var idx = 0;
  D.items.forEach(function (c, i) { if (c.id === id) idx = i; });
  var c = D.items[idx];

  document.title = c.name.replace(/[«»]/g, '') + ' — форма KORRTO';
  $('[data-cs-crumb]').textContent = c.name;
  $('[data-cs-logo]').src = c.logo; $('[data-cs-logo]').alt = 'Логотип ' + c.name.replace(/[«»]/g, '');
  $('[data-cs-kind]').textContent = typeName[c.type] + ' · ' + c.kind;
  $('[data-cs-name]').textContent = c.name;
  $('[data-cs-lead]').textContent = c.lead;
  $('[data-cs-made]').innerHTML = c.made.map(function (m, i) { return '<li><span>' + String(i + 1).padStart(2, '0') + '</span>' + esc(m) + '</li>'; }).join('');
  $('[data-cs-roles]').innerHTML = c.roles.map(function (r) { return '<span>' + esc(r) + '</span>'; }).join('');
  $('[data-cs-cat]').innerHTML = c.cat.map(function (rid) {
    var r = S.roles.filter(function (x) { return x.id === rid; })[0]; if (!r) return '';
    return '<a href="catalog.html?role=' + r.id + '">' + esc(r.name) + '<span class="mono">' + (r.inStock ? r.inStock + ' в наличии' : 'под заказ') + '</span><i data-lucide="arrow-up-right"></i></a>';
  }).join('');

  // Галерея: раскладка зависит от числа фото и ориентации
  var gal = $('[data-cs-gallery]');
  gal.setAttribute('data-n', Math.min(c.photos.length, 4));
  gal.innerHTML = c.photos.map(function (p, i) {
    return '<button type="button" data-ph="' + i + '" aria-label="Открыть фото ' + (i + 1) + ' из ' + c.photos.length + '"><img src="' + p[0] + '" alt="' + esc(p[1]) + '"' + (i ? ' loading="lazy"' : ' fetchpriority="high"') + '></button>';
  }).join('');
  Array.prototype.forEach.call(gal.querySelectorAll('img'), function (img) {
    var mark = function () { if (img.naturalHeight > img.naturalWidth) img.parentNode.classList.add('is-v'); };
    if (img.complete) mark(); else img.addEventListener('load', mark);
  });

  // Другие проекты: сначала того же типа
  var others = D.items.filter(function (x) { return x.id !== c.id; });
  others.sort(function (a, b) { return (b.type === c.type) - (a.type === c.type); });
  $('[data-cs-more]').innerHTML = others.slice(0, 3).map(function (x) { return cardHTML(x, false); }).join('');

  var prev = D.items[(idx - 1 + D.items.length) % D.items.length], next = D.items[(idx + 1) % D.items.length];
  $('[data-cs-pager]').innerHTML =
    '<a href="case.html?id=' + prev.id + '"><span class="mono"><i data-lucide="arrow-left"></i>Предыдущий</span><b>' + esc(prev.name) + '</b></a>' +
    '<a href="case.html?id=' + next.id + '"><span class="mono">Следующий<i data-lucide="arrow-right"></i></span><b>' + esc(next.name) + '</b></a>';

  /* ---------- Просмотр фото ---------- */
  var lb = $('[data-lb]'), cur2 = 0, opener = null;
  var show = function (i) {
    cur2 = (i + c.photos.length) % c.photos.length;
    $('[data-lb-img]').src = c.photos[cur2][0];
    $('[data-lb-img]').alt = c.photos[cur2][1];
    $('[data-lb-cap]').textContent = c.photos[cur2][1] + ' · ' + (cur2 + 1) + ' / ' + c.photos.length;
    $('[data-lb-prev]').disabled = $('[data-lb-next]').disabled = c.photos.length < 2;
  };
  var open = function (i, from) { opener = from; show(i); lb.hidden = false; document.body.classList.add('lb-open'); $('[data-lb-close]').focus(); };
  var close = function () { lb.hidden = true; document.body.classList.remove('lb-open'); if (opener) opener.focus(); };
  gal.addEventListener('click', function (e) { var b = e.target.closest('[data-ph]'); if (b) open(+b.getAttribute('data-ph'), b); });
  $('[data-lb-close]').addEventListener('click', close);
  $('[data-lb-prev]').addEventListener('click', function () { show(cur2 - 1); });
  $('[data-lb-next]').addEventListener('click', function () { show(cur2 + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb__fig')) close(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(cur2 - 1);
    if (e.key === 'ArrowRight') show(cur2 + 1);
  });
  var x0 = null;
  lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) show(cur2 + (dx < 0 ? 1 : -1));
  });
  K.icons();
})();
