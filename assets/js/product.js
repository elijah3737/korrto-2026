/* KORRTO 2026 — карточка товара: ?role=<роль>&id=<ID>. Данные — assets/data/<роль>.json и details.json (снимок korrto.ru). */
(function () {
  'use strict';
  var K = window.KORRTO, S = window.KORRTO_STOCK;
  var fmt = K.fmt, plural = K.plural, esc = K.esc;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var params = new URLSearchParams(location.search);
  var roleId = params.get('role') || 'chef';
  var role = S.roles.filter(function (r) { return r.id === roleId; })[0] || S.roles[0];
  var id = +params.get('id');

  var p, items, st = { color: 0, size: null, qty: 1, img: 0, fav: false };
  var sum = function (o) { return Object.keys(o).reduce(function (a, k) { return a + o[k]; }, 0); };

  Promise.all([
    fetch('assets/data/' + role.id + '.json').then(function (r) { return r.json(); }),
    fetch('assets/data/details.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
  ]).then(function (res) {
    items = res[0].items;
    p = items.filter(function (it) { return it.id === id; })[0] || items[0];
    // По умолчанию — цвет с самым большим остатком, чтобы сразу было из чего выбрать
    var best = 0;
    p.colors.forEach(function (c, i) { if (sum(c.sizes) > sum(p.colors[best].sizes)) best = i; });
    st.color = best;
    var c0 = params.get('color');
    if (c0) p.colors.forEach(function (c, i) { if (c.name === c0) st.color = i; });
    var only = K.sizeList(p);
    if (only.length === 1) st.size = only[0];
    st.fav = K.fav.has(p.art);
    $('[data-pfav]').setAttribute('aria-pressed', st.fav); $('[data-pfav]').classList.toggle('is-on', st.fav);
    renderStatic(res[1][p.id] || {});
    render();
    renderRails();
  });

  /* ---------- Неизменная часть: крошки, заголовок, описание ---------- */
  var renderStatic = function (d) {
    document.title = p.name + ' — KORRTO';
    var rl = $('[data-crumb-role]'); rl.textContent = role.name; rl.href = 'catalog.html?role=' + role.id;
    $('[data-crumb-name]').textContent = p.name;
    $('[data-name]').textContent = p.name;
    $('[data-meta]').textContent = 'Арт. ' + p.art + (d.attrs && d.attrs['Коллекция'] ? ' · коллекция ' + d.attrs['Коллекция'] : '');

    var descr = d.descr || 'Описание модели появится после загрузки из 1С.';
    $('[data-descr]').innerHTML = esc(descr).replace(/\n+/g, '<br>');
    var rows = [];
    var a = d.attrs || {};
    if (a['Вид изделия']) rows.push(['Вид изделия', a['Вид изделия']]);
    if (a['Бренд']) rows.push(['Бренд', a['Бренд']]);
    if (a['Коллекция']) rows.push(['Коллекция', a['Коллекция']]);
    rows.push(['Ткань', p.colors.map(function (c) { return c.sostav; }).filter(function (v, i, arr) { return v && arr.indexOf(v) === i; }).join('; ')]);
    var plots = p.colors.map(function (c) { return c.plot; }).filter(function (v, i, arr) { return v && arr.indexOf(v) === i; });
    if (plots.length) rows.push(['Плотность', plots.join(', ')]);
    if (d.std && d.std.length) rows.push(['Соответствие стандартам', d.std.join('; ')]);
    if (d.protect && d.protect.length) rows.push(['Защитные свойства', d.protect.join('; ')]);
    if (d.tech && d.tech.length) rows.push(['Технологии', d.tech.join('; ')]);
    $('[data-attrs]').innerHTML = rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('');
  };

  /* ---------- Цвет, размер, цена, галерея ---------- */
  var render = function () {
    var c = p.colors[st.color];
    var total = sum(c.sizes);
    $('[data-stock]').innerHTML = '<span class="dot" aria-hidden="true"></span>В наличии ' + fmt(total) + ' шт в этом цвете · отгружаем со склада с 9:00';
    $('[data-price]').innerHTML = c.price >= 100 ? fmt(c.price) + ' ₽' : '<small>Цена по запросу</small>';
    $('[data-color-name]').textContent = c.name;
    $('[data-colors]').innerHTML = p.colors.map(function (cc, j) {
      return '<button class="swatch' + (j === st.color ? ' is-on' : '') + '" type="button" data-pcolor="' + j + '" style="background:' + cc.hex + '" aria-label="Цвет: ' + esc(cc.name) + '" aria-pressed="' + (j === st.color) + '" title="' + esc(cc.name) + '"></button>';
    }).join('');
    $('[data-fabric]').innerHTML = c.sostav ? '<span>Ткань</span>' + esc(c.sostav) + (c.plot ? ' · ' + esc(c.plot) : '') : '';

    var list = K.sizeList(p);
    $('[data-sizes]').innerHTML = list.map(function (k) {
      var q = c.sizes[k] || 0;
      if (!q) return '<button class="psize" type="button" disabled title="Нет на складе в этом цвете"><b>' + k + '</b><span>нет</span></button>';
      return '<button class="psize' + (st.size === k ? ' is-on' : '') + '" type="button" data-psize="' + k + '" aria-pressed="' + (st.size === k) + '"><b>' + k + '</b><span>' + (q < 10 ? 'осталось ' + q : q + ' шт') + '</span></button>';
    }).join('');
    if (st.size && !(c.sizes[st.size] > 0)) st.size = null;
    $('[data-size-name]').textContent = st.size || 'не выбран';
    var hint = '';
    if (st.size) {
      var q = c.sizes[st.size];
      hint = 'На складе ' + q + ' шт размера ' + st.size + '. Нужно больше — <a href="index.html#contacts">отошьём под заказ</a>.';
      if (st.qty > q) st.qty = q;
    } else if (list.some(function (k) { return !c.sizes[k]; })) {
      hint = 'Зачёркнутых размеров нет на складе в этом цвете. Их можно <a href="index.html#contacts">отшить под заказ</a>.';
    }
    $('[data-size-hint]').innerHTML = hint;
    $('[data-qinput]').value = st.qty;

    renderGallery(c);
    K.icons();
  };

  var renderGallery = function (c) {
    var imgs = c.imgs && c.imgs.length ? c.imgs : (c.img ? [c.img] : []);
    if (st.img >= imgs.length) st.img = 0;
    var track = $('[data-track]');
    if (!imgs.length) {
      track.innerHTML = '<div class="gallery__empty"><span class="card__nophoto-dot" style="--c:' + c.hex + '"></span>Фото в цвете «' + esc(c.name) + '» скоро добавим</div>';
      $('[data-thumbs]').innerHTML = ''; $('[data-gcount]').textContent = '';
      $$('[data-gprev], [data-gnext]').forEach(function (b) { b.hidden = true; });
      return;
    }
    track.innerHTML = imgs.map(function (src, i) {
      return '<figure class="gallery__slide" data-slide="' + i + '"><img src="' + src + '" alt="' + esc(p.name + ', цвет ' + c.name + ', фото ' + (i + 1)) + '"' + (i ? ' loading="lazy"' : '') + '></figure>';
    }).join('');
    $('[data-thumbs]').innerHTML = imgs.length > 1 ? imgs.map(function (src, i) {
      return '<button type="button" role="tab" data-thumb="' + i + '" aria-selected="' + (i === st.img) + '" aria-label="Фото ' + (i + 1) + '"><img src="' + src + '" alt="" loading="lazy"></button>';
    }).join('') : '';
    $$('[data-gprev], [data-gnext]').forEach(function (b) { b.hidden = imgs.length < 2; });
    goTo(st.img, true);
  };

  var goTo = function (i, instant) {
    var slides = $$('[data-slide]'); if (!slides.length) return;
    st.img = (i + slides.length) % slides.length;
    var track = $('[data-track]');
    track.scrollTo({ left: slides[st.img].offsetLeft, behavior: instant ? 'auto' : 'smooth' });
    $$('[data-thumb]').forEach(function (t) { t.setAttribute('aria-selected', +t.getAttribute('data-thumb') === st.img); });
    $('[data-gcount]').textContent = slides.length > 1 ? (st.img + 1) + ' / ' + slides.length : '';
  };
  // Свайп на телефоне: следим, какой кадр в центре
  $('[data-track]').addEventListener('scroll', function () {
    var t = this, w = t.clientWidth; if (!w) return;
    var i = Math.round(t.scrollLeft / w);
    if (i !== st.img) { st.img = i; $$('[data-thumb]').forEach(function (b) { b.setAttribute('aria-selected', +b.getAttribute('data-thumb') === i); }); $('[data-gcount]').textContent = (i + 1) + ' / ' + $$('[data-slide]').length; }
  }, { passive: true });

  /* ---------- Подборки ниже: «с этой моделью берут» и «похожие» ---------- */
  var toCard = function (it) {
    return { art: it.art, name: it.name, href: 'product.html?role=' + role.id + '&id=' + it.id, colors: it.colors, price: it.colors[0].price };
  };
  var renderRails = function () {
    var others = items.filter(function (it) { return it.id !== p.id && !/малыш|детск/i.test(it.name); });
    var similar = others.filter(function (it) { return it.type === p.type; }).slice(0, 8);
    var seenType = {}; seenType[p.type] = 1;
    var related = [];
    others.forEach(function (it) { if (!seenType[it.type] && related.length < 8) { seenType[it.type] = 1; related.push(it); } });
    others.forEach(function (it) { if (related.length < 6 && it.type !== p.type && related.indexOf(it) < 0) related.push(it); });
    if (related.length) { $('[data-related-wrap]').hidden = false; K.mountCards($('[data-related]'), related.map(toCard)); }
    if (similar.length) {
      $('[data-similar-wrap]').hidden = false;
      $('[data-similar-all]').href = 'catalog.html?role=' + role.id + '&type=' + encodeURIComponent(p.type);
      K.mountCards($('[data-similar]'), similar.map(toCard));
    }
    var rel = $('[data-related]');
    var step = function () { var c = rel.querySelector('.card'); return c ? (c.getBoundingClientRect().width + 20) * 2 : 600; };
    $('[data-rel-prev]').addEventListener('click', function () { rel.scrollBy({ left: -step(), behavior: 'smooth' }); });
    $('[data-rel-next]').addEventListener('click', function () { rel.scrollBy({ left: step(), behavior: 'smooth' }); });
  };

  /* ---------- События ---------- */
  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-pcolor]'))) { st.color = +t.getAttribute('data-pcolor'); st.img = 0; $('[data-perr]').textContent = ''; render(); return; }
    if ((t = e.target.closest('[data-psize]'))) { st.size = t.getAttribute('data-psize'); st.qty = Math.max(1, st.qty); $('[data-perr]').textContent = ''; render(); return; }
    if ((t = e.target.closest('[data-thumb]'))) { goTo(+t.getAttribute('data-thumb')); return; }
    if (e.target.closest('[data-gprev]')) { goTo(st.img - 1); return; }
    if (e.target.closest('[data-gnext]')) { goTo(st.img + 1); return; }
    if (e.target.closest('[data-qminus]')) { st.qty = Math.max(1, st.qty - 1); $('[data-qinput]').value = st.qty; return; }
    if (e.target.closest('[data-qplus]')) {
      var max = st.size ? p.colors[st.color].sizes[st.size] : 99;
      st.qty = Math.min(max, st.qty + 1); $('[data-qinput]').value = st.qty; return;
    }
    if ((t = e.target.closest('[data-pfav]'))) {
      var c1 = p.colors[st.color];
      st.fav = K.fav.toggle(K.favSnap({ art: p.art, name: p.name, href: 'product.html?role=' + role.id + '&id=' + p.id, colors: p.colors, price: c1.price }, c1));
      t.setAttribute('aria-pressed', st.fav); t.classList.toggle('is-on', st.fav); K.syncFav(true);
      if (st.fav) K.toast('В избранном: ' + p.name.split(',')[0]);
      return;
    }
    if ((t = e.target.closest('[data-tab]'))) {
      var name = t.getAttribute('data-tab');
      $$('[data-tab]').forEach(function (b) { b.setAttribute('aria-selected', b === t); });
      $$('[data-panel]').forEach(function (pn) { pn.hidden = pn.getAttribute('data-panel') !== name; });
      return;
    }
    if ((t = e.target.closest('[data-padd]'))) {
      if (!st.size) {
        $('[data-perr]').textContent = 'Выберите размер';
        $('[data-sizes]').classList.remove('shake'); void $('[data-sizes]').offsetWidth; $('[data-sizes]').classList.add('shake');
        return;
      }
      var c = p.colors[st.color];
      var price = (c.price || p.price) >= 100 ? (c.price || p.price) : 0;
      K.addToCart($('[data-slide="' + st.img + '"] img') || null, st.qty, t, p.name.split(',')[0] + ', ' + c.name + ', ' + st.size + (st.qty > 1 ? ', ' + st.qty + ' шт' : ''), {
        art: p.art, name: p.name, color: c.name, hex: c.hex, size: st.size, price: price, img: c.img || '',
        href: 'product.html?role=' + role.id + '&id=' + p.id + '&color=' + encodeURIComponent(c.name), max: c.sizes[st.size] || 1
      });
    }
  });
  $('[data-qinput]').addEventListener('change', function (e) {
    var v = parseInt(e.target.value.replace(/\D/g, ''), 10) || 1;
    var max = st.size ? p.colors[st.color].sizes[st.size] : 99;
    st.qty = Math.min(Math.max(1, v), max); e.target.value = st.qty;
  });
  document.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('input, select, textarea')) return;
    if (e.key === 'ArrowLeft') goTo(st.img - 1);
    if (e.key === 'ArrowRight') goTo(st.img + 1);
  });
})();
