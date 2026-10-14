/* KORRTO 2026 — поведение главной: каталог по ролям и карточки из снимка склада, меню, корзина, форма. */
(function () {
  'use strict';
  var S = window.KORRTO_STOCK;
  var SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'ONE SIZE'];
  var fmt = function (n) { return n.toLocaleString('ru-RU').replace(/ /g, ' '); };
  var plural = function (n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var icons = function () { if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.6 } }); };

  /* ---------- Итоги склада ---------- */
  document.querySelectorAll('[data-total-instock]').forEach(function (el) { el.textContent = S.totals.inStock; });
  document.querySelectorAll('[data-total-units]').forEach(function (el) { el.textContent = fmt(S.totals.units); });
  document.querySelectorAll('[data-total-models]').forEach(function (el) { el.textContent = S.totals.models; });
  document.querySelectorAll('[data-snapshot]').forEach(function (el) { el.textContent = S.snapshot; });

  var countLine = function (r) {
    if (!r.inStock) return r.all + ' ' + plural(r.all, 'модель', 'модели', 'моделей') + ' · под заказ';
    return r.all + ' ' + plural(r.all, 'модель', 'модели', 'моделей') + ' · ' + r.inStock + ' в наличии';
  };

  /* ---------- 03 Роли ---------- */
  var rolesEl = document.querySelector('[data-roles]');
  if (rolesEl) {
    var layout = { chef: 'role--xl', waiter: 'role--wide' };
    rolesEl.innerHTML = S.roles.map(function (r) {
      var cls = 'role rv ' + (layout[r.id] || '') + (r.id === 'textile' ? ' role--textile' : '');
      var media = r.img ? '<img src="' + r.img + '" alt="" loading="lazy" style="object-position:' + (r.pos || '50% 30%') + '">' : '';
      var note = r.id === 'textile' ? '<p class="role__note">Скатерти, салфетки, напероны, фуршетные юбки и чехлы. Шьём в цветах заведения.</p>' : '';
      return '<a class="' + cls + '" href="catalog.html?role=' + r.id + '">' + media + note +
        '<span class="role__body"><span><span class="display role__name">' + esc(r.name) + '</span>' +
        '<span class="role__count mono">' + (r.inStock ? '<span class="dot" aria-hidden="true"></span>' : '') + countLine(r) + '</span></span>' +
        '<span class="role__arrow" aria-hidden="true"><i data-lucide="arrow-up-right"></i></span></span></a>';
    }).join('');
  }

  /* Мега-меню и подвал: роли со счётчиками */
  var megaRoles = document.querySelector('[data-mega-roles]');
  if (megaRoles) megaRoles.innerHTML = S.roles.map(function (r) {
    return '<a href="catalog.html?role=' + r.id + '"><span>' + esc(r.name) + '</span><span class="mono">' + (r.inStock ? r.inStock + ' в наличии' : 'под заказ') + '</span></a>';
  }).join('');
  var footRoles = document.querySelector('[data-foot-roles]');
  if (footRoles) footRoles.innerHTML = S.roles.slice(0, 7).map(function (r) { return '<li><a href="catalog.html?role=' + r.id + '">' + esc(r.name) + '</a></li>'; }).join('');

  /* ---------- Корзина: строки «модель + цвет + размер» в браузере посетителя ---------- */
  var Cart = (function () {
    var KEY = 'korrto-cart', lines = [];
    try { lines = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { lines = []; }
    var save = function () { try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) { /* приватный режим — корзина живёт до перезагрузки */ } };
    var keyOf = function (l) { return l.art + '|' + l.color + '|' + l.size; };
    return {
      lines: function () { return lines; },
      count: function () { return lines.reduce(function (a, l) { return a + l.qty; }, 0); },
      sum: function () { return lines.reduce(function (a, l) { return a + l.qty * (l.price || 0); }, 0); },
      put: function (line, qty) {
        var k = keyOf(line), have = lines.filter(function (l) { return l.key === k; })[0];
        if (have) have.qty = Math.min(have.qty + qty, have.max || 999);
        else { line.key = k; line.qty = Math.min(qty, line.max || 999); lines.push(line); }
        save();
      },
      setQty: function (k, qty) { lines.forEach(function (l) { if (l.key === k) l.qty = Math.max(1, Math.min(qty, l.max || 999)); }); save(); },
      remove: function (k) { lines = lines.filter(function (l) { return l.key !== k; }); save(); },
      restore: function (line, at) { lines.splice(Math.min(at, lines.length), 0, line); save(); },
      clear: function () { lines = []; save(); }
    };
  })();

  /* ---------- Карточки товаров: общие для главной и каталога ---------- */
  var railEl = document.querySelector('[data-rail]');
  var states = {};
  /* Избранное: снимок карточки по артикулу, хранится в браузере посетителя */
  var Fav = (function () {
    var KEY = 'korrto-fav', map = {};
    try { map = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { map = {}; }
    var save = function () { try { localStorage.setItem(KEY, JSON.stringify(map)); } catch (e) { /* приватный режим */ } };
    return {
      has: function (art) { return !!map[art]; },
      list: function () { return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.t - a.t; }); },
      count: function () { return Object.keys(map).length; },
      toggle: function (snap) { if (map[snap.art]) delete map[snap.art]; else { snap.t = Date.now(); map[snap.art] = snap; } save(); return !!map[snap.art]; },
      remove: function (art) { delete map[art]; save(); }
    };
  })();
  var baseArt = function (p) { return String(p.art).split('|')[0]; };
  var favSnap = function (p, c) {
    return { art: baseArt(p), name: p.name, href: p.href || '', img: c.img || '', hex: c.hex, color: c.name, price: (c.price || p.price) >= 100 ? (c.price || p.price) : 0,
      colors: p.colors.length, units: Object.keys(c.sizes).reduce(function (a, k) { return a + c.sizes[k]; }, 0) };
  };
  var sizeList = function (p) {
    var set = {};
    p.colors.forEach(function (c) { Object.keys(c.sizes).forEach(function (k) { set[k] = 1; }); });
    return SIZE_ORDER.filter(function (k) { return set[k]; });
  };
  var stateOf = function (p) {
    if (!states[p.art]) {
      var only = sizeList(p);
      states[p.art] = { color: 0, size: only.length === 1 && only[0] === 'ONE SIZE' ? 'ONE SIZE' : null };
    }
    return states[p.art];
  };
  var cardHTML = function (p) {
    var st = stateOf(p);
    var c = p.colors[st.color];
    var total = Object.keys(c.sizes).reduce(function (a, k) { return a + c.sizes[k]; }, 0);
    var sizes = sizeList(p).map(function (k) {
      var q = c.sizes[k] || 0;
      var on = st.size === k ? ' is-on' : '';
      return q > 0
        ? '<button class="size' + on + '" type="button" data-size="' + k + '" title="На складе: ' + q + ' шт" aria-pressed="' + (on ? 'true' : 'false') + '">' + k + '</button>'
        : '<button class="size" type="button" disabled title="Нет на складе, можно отшить под заказ">' + k + '</button>';
    }).join('');
    var sw = p.colors.length > 1 ? '<div class="swatches" role="group" aria-label="Цвет">' + p.colors.map(function (cc, j) {
      return '<button class="swatch' + (j === st.color ? ' is-on' : '') + '" type="button" data-color="' + j + '" style="background:' + cc.hex + '" aria-label="Цвет: ' + cc.name + '" title="' + cc.name + '"></button>';
    }).join('') + '</div>' : '<div class="swatches"><span class="swatch is-on" style="background:' + c.hex + '" title="' + c.name + '"></span></div>';
    return '<div class="card__media">' +
      (c.img ? (p.href ? '<a href="' + p.href + '" tabindex="-1" aria-hidden="true">' : '') + '<img src="' + c.img + '" alt="' + esc(p.name + ', цвет ' + c.name) + '" loading="lazy">' + (p.href ? '</a>' : '')
        : '<span class="card__nophoto" style="--c:' + c.hex + '"><span class="card__nophoto-dot"></span>Фото в цвете «' + esc(c.name) + '» скоро добавим</span>') +
      '<button class="card__fav' + (Fav.has(baseArt(p)) ? ' is-on' : '') + '" type="button" data-fav aria-pressed="' + Fav.has(baseArt(p)) + '" aria-label="В избранное"><i data-lucide="heart"></i></button>' +
      '<span class="card__stock mono"><span class="dot" aria-hidden="true"></span>на складе ' + fmt(total) + ' шт</span>' +
      '</div><div class="card__body">' + sw +
      '<h3 class="card__name">' + (p.href ? '<a href="' + p.href + '">' + esc(p.name) + '</a>' : esc(p.name)) + '</h3>' +
      '<div class="card__meta mono">Арт. ' + esc(p.art) + ' · ' + esc([].concat(c.sostav || []).join(', ')) + '</div>' +
      '<div class="sizes" role="group" aria-label="Размер">' + sizes + '</div>' +
      '<div class="card__foot"><span class="price">' + ((c.price || p.price) >= 100 ? fmt(c.price || p.price) + ' ₽' : '<small>Цена по запросу</small>') + '</span>' +
      '<button class="btn btn--sm" type="button" data-add>В корзину</button></div>' +
      '<div class="card__err" aria-live="polite"></div></div>';
  };
  var mountCards = function (el, products) {
    el._products = products;
    el.innerHTML = products.map(function (p, i) { return '<article class="card" data-i="' + i + '">' + cardHTML(p) + '</article>'; }).join('');
    icons();
    if (el._mounted) return;
    el._mounted = true;
    var renderCard = function (card, p) { card.innerHTML = cardHTML(p); icons(); };
    el.addEventListener('click', function (e) {
      var card = e.target.closest('.card'); if (!card) return;
      var p = el._products[+card.getAttribute('data-i')], st = stateOf(p);
      var sw = e.target.closest('[data-color]');
      if (sw) {
        st.color = +sw.getAttribute('data-color');
        var c = p.colors[st.color];
        if (st.size && !(c.sizes[st.size] > 0)) st.size = null;
        renderCard(card, p); return;
      }
      var sz = e.target.closest('[data-size]');
      if (sz) { st.size = sz.getAttribute('data-size'); renderCard(card, p); return; }
      if (e.target.closest('[data-fav]')) {
        var on = Fav.toggle(favSnap(p, p.colors[st.color]));
        renderCard(card, p); updateFav(true); if (on) toast('В избранном: ' + p.name.split(',')[0]); return;
      }
      if (e.target.closest('[data-add]')) {
        var err = card.querySelector('.card__err');
        if (!st.size) { err.textContent = 'Выберите размер'; return; }
        err.textContent = '';
        var c = p.colors[st.color];
        addToCart(card.querySelector('.card__media img'), 1, e.target.closest('[data-add]'), p.name.split(',')[0] + ', ' + c.name + ', ' + st.size, {
          art: p.art, name: p.name, color: c.name, hex: c.hex, size: st.size, price: (c.price || p.price) >= 100 ? (c.price || p.price) : 0,
          img: c.img || '', href: p.href ? p.href + '&color=' + encodeURIComponent(c.name) : '', max: c.sizes[st.size] || 1
        });
      }
    });
  };
  /* Добавление в корзину: фото летит в шапку, кнопка подтверждает, внизу тост */
  var addToCart = function (img, qty, btn, label, line) {
    if (line) Cart.put(line, qty);
    flyToCart(img, function () { setBadge('[data-cart-count]', Cart.count()); });
    if (btn) {
      if (!btn._label) btn._label = btn.textContent;
      btn.classList.add('is-added'); btn.innerHTML = '<i data-lucide="check"></i>Добавлено'; icons();
      clearTimeout(btn._t); btn._t = setTimeout(function () { btn.classList.remove('is-added'); btn.textContent = btn._label; }, 1800);
    }
    toast('В корзине: ' + label);
  };
  window.KORRTO = { addToCart: addToCart, cart: Cart, fav: Fav, favSnap: favSnap, mountCards: mountCards, sizeList: sizeList, fmt: fmt, plural: plural, esc: esc, icons: icons, SIZE_ORDER: SIZE_ORDER };

  if (railEl) {
    mountCards(railEl, S.products);

    var prev = document.querySelector('[data-rail-prev]'), next = document.querySelector('[data-rail-next]');
    var step = function () { var c = railEl.querySelector('.card'); return c ? c.getBoundingClientRect().width + 20 : 300; };
    var sync = function () {
      var max = railEl.scrollWidth - railEl.clientWidth - 2;
      prev.disabled = railEl.scrollLeft <= 2; next.disabled = railEl.scrollLeft >= max;
    };
    prev.addEventListener('click', function () { railEl.scrollBy({ left: -step() * 2, behavior: 'smooth' }); });
    next.addEventListener('click', function () { railEl.scrollBy({ left: step() * 2, behavior: 'smooth' }); });
    railEl.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  /* ---------- Корзина, избранное, тост ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Фото товара «улетает» в корзину в шапке, затем иконка подпрыгивает */
  var flyToCart = function (img, done) {
    var target = document.querySelector('[data-cart-btn]');
    var to = target && target.getBoundingClientRect();
    if (reduce || !img || !to || !to.width) { done(); return; }
    var from = img.getBoundingClientRect();
    var size = Math.min(from.width, 120);
    var ghost = img.cloneNode(); ghost.removeAttribute('loading'); ghost.className = 'fly'; ghost.alt = '';
    ghost.style.cssText = 'left:' + (from.left + from.width / 2 - size / 2) + 'px;top:' + (from.top + from.height / 2 - size / 2) + 'px;width:' + size + 'px;height:' + size + 'px';
    document.body.appendChild(ghost);
    var dx = to.left + to.width / 2 - (from.left + from.width / 2), dy = to.top + to.height / 2 - (from.top + from.height / 2);
    var anim = ghost.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(' + dx * .45 + 'px,' + (dy * .45 - 60) + 'px) scale(.6)', opacity: 1, offset: .55 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.12)', opacity: .4 }
    ], { duration: 750, easing: 'cubic-bezier(.5,0,.3,1)' });
    var landed = false;
    var land = function () {
      if (landed) return; landed = true;
      ghost.remove(); done();
      target.classList.remove('is-hit'); void target.offsetWidth; target.classList.add('is-hit');
    };
    anim.onfinish = land;
    setTimeout(land, 900); // если вкладка не рисует кадры, счётчик всё равно обновится
  };
  var setBadge = function (sel, n) {
    var b = document.querySelector(sel); if (!b) return;
    b.textContent = n; b.classList.toggle('is-on', n > 0);
    b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
  };
  window.KORRTO.syncCart = function () { var n = Cart.count(), b = document.querySelector('[data-cart-count]'); if (b) { b.textContent = n; b.classList.toggle('is-on', n > 0); } };
  window.KORRTO.syncCart();
  window.KORRTO.toast = function (m) { toast(m); };
  var updateFav = function (bump) {
    var n = Fav.count(), b = document.querySelector('[data-fav-count]'); if (!b) return;
    if (bump) setBadge('[data-fav-count]', n); else { b.textContent = n; b.classList.toggle('is-on', n > 0); }
  };
  window.KORRTO.syncFav = updateFav;
  updateFav();
  var toastEl = document.querySelector('[data-toast]'), toastT;
  var toast = function (msg) {
    toastEl.querySelector('span').textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2600);
  };

  /* ---------- Мега-меню ---------- */
  var catBtn = document.querySelector('.nav__cat'), mega = document.getElementById('mega');
  var setMega = function (open) { mega.classList.toggle('is-open', open); catBtn.setAttribute('aria-expanded', open); };
  catBtn.addEventListener('click', function () { setMega(!mega.classList.contains('is-open')); });
  document.querySelector('.burger').addEventListener('click', function () { setMega(!mega.classList.contains('is-open')); });
  document.addEventListener('click', function (e) { if (!e.target.closest('.head')) setMega(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMega(false); });
  mega.addEventListener('click', function (e) { if (e.target.closest('a')) setMega(false); });

  /* ---------- Бегущая строка клиентов: дублируем для бесшовной петли ---------- */
  var track = document.querySelector('[data-marquee]');
  if (track) Array.prototype.slice.call(track.children).forEach(function (img) {
    var c = img.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.alt = ''; track.appendChild(c);
  });

  /* ---------- Появление при прокрутке ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = document.querySelectorAll('.rv, [data-process]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        if (el.classList.contains('rv')) el.style.transitionDelay = Math.min(sib, 6) * 60 + 'ms';
        el.classList.add('is-in'); io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('is-in'); });
  }

  /* ---------- Форма заявки ---------- */
  var form = document.querySelector('[data-form]');
  if (form) {
    var setErr = function (name, msg) {
      var f = form.querySelector('[data-f="' + name + '"]');
      f.classList.toggle('has-err', !!msg);
      f.querySelector('.err').textContent = msg || '';
    };
    form.addEventListener('input', function (e) {
      var f = e.target.closest('[data-f]'); if (f) setErr(f.getAttribute('data-f'), '');
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      if (!form.company.value.trim()) { setErr('company', 'Напишите название заведения или компании'); ok = false; }
      var digits = form.phone.value.replace(/\D/g, '');
      if (digits.length < 10) { setErr('phone', 'Укажите телефон, минимум 10 цифр'); ok = false; }
      if (!form.consent.checked) { setErr('consent', 'Без согласия мы не можем принять заявку'); ok = false; }
      if (!ok) { var first = form.querySelector('.has-err input'); if (first) first.focus({ preventScroll: false }); return; }
      form.classList.add('is-done');
    });
    form.querySelector('[data-form-reset]').addEventListener('click', function () { form.reset(); form.classList.remove('is-done'); });
  }

  /* ---------- Поиск по каталогу (шапка) ----------
   * Ищет по названию, артикулу и виду изделия во всех разделах. Данные грузятся при первом открытии. */
  var srchBtn = document.querySelector('.icon-btn--search');
  if (srchBtn) {
    var norm = function (s) { return String(s || '').toLowerCase().replace(/ё/g, 'е'); };
    var SUGGEST = ['Китель', 'Фартук', 'Брюки', 'Поло', 'Рубашка', 'Колпак', 'Сабо', 'Жилет'];
    var sEl = document.createElement('div');
    sEl.className = 'srch'; sEl.hidden = true;
    sEl.setAttribute('role', 'dialog'); sEl.setAttribute('aria-modal', 'true'); sEl.setAttribute('aria-label', 'Поиск по каталогу');
    sEl.innerHTML = '<div class="srch__panel"><div class="wrap"><form class="srch__bar" action="catalog.html" role="search">' +
      '<i data-lucide="search"></i><input name="q" type="search" autocomplete="off" placeholder="Китель, фартук или артикул, например 04.274" aria-label="Что ищем"' +
      ' role="combobox" aria-expanded="false" aria-controls="srch-list" aria-autocomplete="list">' +
      '<button type="button" class="srch__close" data-srch-close aria-label="Закрыть поиск"><i data-lucide="x"></i></button></form>' +
      '<div class="srch__body" data-srch-body></div></div></div>';
    document.body.appendChild(sEl);
    var sIn = sEl.querySelector('input'), sBody = sEl.querySelector('[data-srch-body]');
    var idx = null, loading = null, cur = -1, sOpener = null;
    var load = function () {
      if (loading) return loading;
      loading = Promise.all(S.roles.map(function (r) {
        return fetch('assets/data/' + r.id + '.json').then(function (x) { return x.json(); }).then(function (d) { return { id: r.id, d: d }; });
      })).then(function (res) {
        var seen = {}; idx = [];
        res.forEach(function (x) {
          x.d.items.forEach(function (it) {
            if (seen[it.id]) return; seen[it.id] = 1;
            var c = it.colors[0] || {};
            var prices = it.colors.map(function (k) { return k.price; }).filter(function (v) { return v >= 100; });
            var units = it.colors.reduce(function (a, k) { return a + Object.keys(k.sizes).reduce(function (b, z) { return b + k.sizes[z]; }, 0); }, 0);
            idx.push({ name: it.name, art: it.art, type: it.type, img: c.img, hex: c.hex, units: units,
              price: prices.length ? Math.min.apply(null, prices) : 0, href: 'product.html?role=' + x.id + '&id=' + it.id,
              hay: norm(it.name + ' ' + it.type + ' ' + it.art + ' ' + it.art.replace(/\D/g, '')) });
          });
        });
      }).catch(function () { idx = []; });
      return loading;
    };
    var find = function (q) {
      var words = norm(q).split(/\s+/).filter(Boolean);
      return idx.filter(function (p) { return words.every(function (w) { return p.hay.indexOf(w) > -1 || p.hay.indexOf(w.replace(/\D/g, '') || '\u0000') > -1; }); })
        .sort(function (a, b) { return b.units - a.units; });
    };
    var sugHTML = function () {
      return '<p class="srch__label mono">Часто ищут</p><div class="srch__sug">' +
        SUGGEST.map(function (s) { return '<button type="button" data-srch-q="' + s + '">' + s + '</button>'; }).join('') + '</div>';
    };
    var renderS = function () {
      var q = sIn.value.trim(); cur = -1;
      if (q.length < 2) { sBody.innerHTML = sugHTML(); sIn.setAttribute('aria-expanded', 'false'); return; }
      if (!idx) { sBody.innerHTML = '<p class="srch__empty">Ищем…</p>'; load().then(renderS); return; }
      var hits = find(q), top = hits.slice(0, 6);
      sIn.setAttribute('aria-expanded', top.length > 0);
      if (!top.length) {
        sBody.innerHTML = '<p class="srch__empty">По запросу «' + esc(q) + '» ничего нет в наличии. Сошьём под заказ — <a href="brand.html#brief">оставьте заявку</a> или позвоните 8 800 775-91-96.</p>' + sugHTML();
        return;
      }
      sBody.innerHTML = '<ul class="srch__list" id="srch-list" role="listbox">' + top.map(function (p, i) {
        var media = p.img ? '<img src="' + esc(p.img) + '" alt="" loading="lazy">' : '<span style="background:' + esc(p.hex || '#ddd') + '"></span>';
        return '<li role="option" id="srch-o' + i + '"><a href="' + esc(p.href) + '"><span class="srch__img">' + media + '</span>' +
          '<span class="srch__txt"><b>' + esc(p.name) + '</b><span class="mono">Арт. ' + esc(p.art) + ' · ' + esc(p.type) + '</span></span>' +
          '<span class="srch__meta">' + (p.price ? '<b>от ' + fmt(p.price) + ' ₽</b>' : '<b>по запросу</b>') + '<span class="mono">' + fmt(p.units) + ' шт</span></span></a></li>';
      }).join('') + '</ul>' +
        '<a class="srch__all link-arrow" href="catalog.html?q=' + encodeURIComponent(q) + '">' + (hits.length > top.length ? 'Все ' + hits.length + ' ' + plural(hits.length, 'модель', 'модели', 'моделей') + ' в каталоге' : 'Открыть в каталоге') + ' <i data-lucide="arrow-right"></i></a>';
      icons();
    };
    var openS = function () {
      sOpener = document.activeElement; sEl.hidden = false; document.body.classList.add('srch-open');
      renderS(); icons(); load(); setTimeout(function () { sIn.focus(); }, 30);
    };
    var closeS = function () { sEl.hidden = true; document.body.classList.remove('srch-open'); if (sOpener && sOpener.focus) sOpener.focus({ preventScroll: true }); };
    srchBtn.addEventListener('click', openS);
    sIn.addEventListener('input', renderS);
    sEl.addEventListener('click', function (e) {
      var t = e.target.closest('[data-srch-q]');
      if (t) { sIn.value = t.getAttribute('data-srch-q'); renderS(); sIn.focus(); return; }
      if (e.target.closest('[data-srch-close]') || e.target === sEl) closeS();
    });
    sEl.querySelector('form').addEventListener('submit', function (e) { if (sIn.value.trim().length < 2) e.preventDefault(); });
    sIn.addEventListener('keydown', function (e) {
      var opts = sBody.querySelectorAll('[role="option"]');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!opts.length) return; e.preventDefault();
        cur = (cur + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
        Array.prototype.forEach.call(opts, function (o, i) { o.setAttribute('aria-selected', i === cur); });
        sIn.setAttribute('aria-activedescendant', opts[cur].id);
      } else if (e.key === 'Enter' && cur > -1) { e.preventDefault(); location.href = opts[cur].querySelector('a').href; }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !sEl.hidden) closeS();
      if (e.key === '/' && sEl.hidden && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); openS(); }
    });
  }

  /* ---------- Плашка прототипа ---------- */
  var proto = document.querySelector('[data-proto]');
  if (proto) proto.querySelector('button').addEventListener('click', function () { proto.remove(); });

  icons();
})();
