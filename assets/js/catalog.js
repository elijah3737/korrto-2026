/* KORRTO 2026 — каталог: все разделы сразу или выбранные (?role=chef,waiter), фильтры по виду, размеру, цвету и цене, сортировка, «Показать ещё».
 * Данные — assets/data/<роль>.json (снимок korrto.ru). На боевом сайте их отдаст обмен с 1С. */
(function () {
  'use strict';
  var K = window.KORRTO, S = window.KORRTO_STOCK;
  var fmt = K.fmt, plural = K.plural, esc = K.esc;
  var PAGE = 12;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var params = new URLSearchParams(location.search);
  var roleById = {}; S.roles.forEach(function (r) { roleById[r.id] = r; });
  // Выбранные разделы; пусто — весь каталог
  var sel = {};
  (params.get('role') || '').split(',').forEach(function (id) { if (roleById[id]) sel[id] = 1; });
  // Распродажа: на korrto.ru в разделе /catalog/sales/ две модели. На боевом сайте признак придёт из 1С.
  var SALE = { '03.206А': 1, '06.055': 1 };
  var sale = params.get('sale') === '1';
  // Поиск из шапки: ?q=китель или артикул
  var q = (params.get('q') || '').trim();
  var norm = function (s) { return String(s || '').toLowerCase().replace(/ё/g, 'е'); };
  var hit = function (p) {
    var hay = norm(p.name + ' ' + p.type + ' ' + p.art + ' ' + p.art.replace(/\D/g, ''));
    return norm(q).split(/\s+/).filter(Boolean).every(function (w) { return hay.indexOf(w) > -1 || (w.replace(/\D/g, '') && hay.indexOf(w.replace(/\D/g, '')) > -1); });
  };
  var selIds = function () { return S.roles.map(function (r) { return r.id; }).filter(function (id) { return sel[id]; }); };

  var f = { type: params.get('type') || '', sizes: {}, colors: {}, min: null, max: null, sort: 'pop' };
  var everything = [], orderAllRoles = [], all = [], order = [], shown = PAGE, orderAll = false;

  /* ---------- Шапка страницы и разделы ---------- */
  var renderHead = function () {
    var ids = selIds();
    var title = q ? 'Поиск: «' + q + '»' : sale ? 'Распродажа' : !ids.length ? 'Каталог униформы' : ids.length === 1 ? roleById[ids[0]].name : ids.map(function (id) { return roleById[id].name; }).join(' · ');
    document.title = q ? 'Поиск «' + q + '» — KORRTO' : sale ? 'Распродажа униформы — KORRTO' : (ids.length === 1 ? title : 'Каталог униформы') + ' — в наличии и под заказ — KORRTO';
    $('[data-role-title]').textContent = ids.length > 1 ? 'Каталог униформы' : title;
    $('[data-crumb]').textContent = q ? 'Поиск' : sale ? 'Распродажа' : ids.length === 1 ? title : ids.length ? ids.length + ' ' + plural(ids.length, 'раздел', 'раздела', 'разделов') : 'Все разделы';
    $('[data-role-tabs]').innerHTML = '<button type="button" data-role="" aria-pressed="' + (!ids.length && !sale && !q) + '">Все разделы</button>' +
      '<button type="button" class="role-tabs__sale" data-sale aria-pressed="' + sale + '">' + (sale ? '<i data-lucide="check"></i>' : '') + 'Распродажа<span class="mono">' + Object.keys(SALE).length + '</span></button>' +
      S.roles.map(function (r) {
        return '<button type="button" data-role="' + r.id + '" aria-pressed="' + !!sel[r.id] + '">' + (sel[r.id] ? '<i data-lucide="check"></i>' : '') + esc(r.name) +
          '<span class="mono">' + (r.inStock || 'заказ') + '</span></button>';
      }).join('');
  };
  renderHead();

  /* ---------- Данные ---------- */
  var toProduct = function (it, roleId) {
    return {
      id: it.id, roles: [roleId],
      art: it.art, name: it.name, type: it.type, href: 'product.html?role=' + roleId + '&id=' + it.id,
      colors: it.colors.map(function (c) { return { name: c.name, hex: c.hex, group: c.group, ghex: c.ghex, img: c.img, sostav: c.sostav, price: c.price, sizes: c.sizes }; }),
      // цена ниже 100 ₽ — ошибка в 1С (у блузки 02.325 стоит 1 ₽), в фильтрах и сортировке её не учитываем
      price: Math.min.apply(null, it.colors.map(function (c) { return c.price >= 100 ? c.price : Infinity; })),
      units: it.colors.reduce(function (a, c) { return a + Object.keys(c.sizes).reduce(function (b, k) { return b + c.sizes[k]; }, 0); }, 0),
      pop: 0
    };
  };

  // Грузим все разделы сразу: модель может быть в нескольких разделах — склеиваем по ID
  Promise.all(S.roles.map(function (r) {
    return fetch('assets/data/' + r.id + '.json').then(function (x) { return x.json(); }).then(function (d) { return { id: r.id, d: d }; });
  })).then(function (res) {
    var byId = {}, ordById = {};
    res.forEach(function (x, ri) {
      x.d.items.forEach(function (it, i) {
        if (byId[it.id]) { byId[it.id].roles.push(x.id); return; }
        var p = toProduct(it, x.id);
        p.pop = i * 10 + ri + (/малыш|детск/i.test(p.name) ? 1e5 : 0); // чередуем разделы; детские модели — в конец
        byId[it.id] = p; everything.push(p);
      });
      (x.d.order || []).forEach(function (o) {
        var k = o.id || o.art || o.name;
        if (ordById[k]) { ordById[k].roles.push(x.id); return; }
        ordById[k] = Object.assign({ roles: [x.id] }, o); orderAllRoles.push(ordById[k]);
      });
    });
    applyRoles();
  }).catch(function () {
    $('[data-role-count]').textContent = 'Не удалось загрузить остатки. Откройте страницу через локальный сервер.';
  });

  /* Набор моделей под выбранные разделы; пересобирает фильтры */
  var applyRoles = function () {
    var ids = selIds();
    var inSel = function (p) { return !ids.length || p.roles.some(function (r) { return sel[r]; }); };
    all = sale ? everything.filter(function (p) { return SALE[p.art]; }) : everything.filter(inSel);
    order = sale ? [] : orderAllRoles.filter(inSel);
    if (q) { all = all.filter(hit); order = order.filter(function (o) { return hit({ name: o.name || '', type: o.type || '', art: o.art || '' }); }); }
    var units = all.reduce(function (a, p) { return a + p.units; }, 0);
    document.body.classList.toggle('cat--order', !all.length);
    $('[data-role-count]').textContent = q && !all.length && !order.length ? 'Ничего не нашли — сошьём под заказ, позвоните 8 800 775-91-96'
      : sale && all.length
      ? all.length + ' ' + plural(all.length, 'модель', 'модели', 'моделей') + ' на распродаже · ' + fmt(units) + ' ' + plural(units, 'изделие', 'изделия', 'изделий') + ' на складе, остатки ограничены'
      : all.length
      ? all.length + ' ' + plural(all.length, 'модель', 'модели', 'моделей') + ' в наличии · ' + fmt(units) + ' ' + plural(units, 'изделие', 'изделия', 'изделий') + ' на складе' +
        (order.length ? ' · ' + order.length + ' под заказ' : '')
      : (function (n) { return n + ' ' + plural(n, 'модель', 'модели', 'моделей') + ' · шьём под заказ'; })(order.length || ids.reduce(function (a, id) { return a + (roleById[id].all || 0); }, 0));
    var keepSizes = f.sizes, keepColors = f.colors;
    buildFilters();
    // Снимаем выбранные размеры и цвета, которых в новом наборе нет
    f.sizes = {}; f.colors = {};
    Object.keys(keepSizes).forEach(function (k) { if (document.querySelector('[data-f-size="' + k + '"]')) f.sizes[k] = 1; });
    Object.keys(keepColors).forEach(function (k) { if ($$('[data-f-color]').some(function (b) { return b.getAttribute('data-f-color') === k; })) f.colors[k] = 1; });
    shown = PAGE; orderAll = false;
    render();
  };

  /* ---------- Фильтры ---------- */
  var colorKey = function (c) { return c.group || c.name; };
  var priceSteps = [];

  var buildFilters = function () {
    // Вид изделия — чипы с количеством
    var types = {};
    all.forEach(function (p) { types[p.type] = (types[p.type] || 0) + 1; });
    var allN = all.length;
    var tnames = Object.keys(types).sort(function (a, b) { return types[b] - types[a]; });
    if (f.type && !types[f.type]) f.type = '';
    $('[data-types]').innerHTML = all.length ? ['<button type="button" data-type="" aria-pressed="' + !f.type + '">Все<span class="mono">' + all.length + '</span></button>']
      .concat(tnames.map(function (t) {
        return '<button type="button" data-type="' + esc(t) + '" aria-pressed="' + (f.type === t) + '">' + esc(t) + '<span class="mono">' + types[t] + '</span></button>';
      })).join('') : '';

    // Размеры
    var sz = {};
    all.forEach(function (p) { p.colors.forEach(function (c) { Object.keys(c.sizes).forEach(function (k) { sz[k] = 1; }); }); });
    $('[data-f-sizes]').innerHTML = K.SIZE_ORDER.filter(function (k) { return sz[k]; }).map(function (k) {
      return '<button type="button" class="size" data-f-size="' + k + '" aria-pressed="false">' + k + '</button>';
    }).join('');

    // Цвета — по группе цвета из 1С
    var cols = {};
    all.forEach(function (p) { p.colors.forEach(function (c) { var k = colorKey(c); cols[k] = cols[k] || { hex: c.ghex || c.hex, n: 0 }; cols[k].n++; }); });
    $('[data-f-colors]').innerHTML = Object.keys(cols).sort(function (a, b) { return cols[b].n - cols[a].n; }).map(function (k) {
      return '<button type="button" class="fcolor" data-f-color="' + esc(k) + '" aria-pressed="false"><span class="swatch" style="background:' + cols[k].hex + '"></span>' + esc(k) + '</button>';
    }).join('') + (Object.keys(cols).length > 8 ? '<button type="button" class="fcolors__more" data-colors-all>Все цвета (' + Object.keys(cols).length + ')</button>' : '');

    // Цена — быстрые диапазоны по реальным ценам роли
    var prices = all.map(function (p) { return p.price; }).filter(isFinite).sort(function (a, b) { return a - b; });
    if (prices.length) {
      var lo = prices[0], hi = prices[prices.length - 1];
      $('[data-f-min]').placeholder = fmt(lo); $('[data-f-max]').placeholder = fmt(hi);
      var r = function (n) { return Math.round(n / 500) * 500; };
      var a = r(prices[Math.floor(prices.length / 3)]), b = r(prices[Math.floor(prices.length * 2 / 3)]);
      priceSteps = a < b && a > lo ? [[null, a], [a, b], [b, null]] : [];
      $('[data-f-quick]').innerHTML = priceSteps.map(function (s, i) {
        var label = s[0] == null ? 'до ' + fmt(s[1]) : s[1] == null ? 'от ' + fmt(s[0]) : fmt(s[0]) + '–' + fmt(s[1]);
        return '<button type="button" data-f-quick-i="' + i + '" aria-pressed="false">' + label + '</button>';
      }).join('');
    }
  };

  /* Подходит ли цвет под фильтры размера и цвета */
  var colorOk = function (c) {
    var sizes = Object.keys(f.sizes), colors = Object.keys(f.colors);
    if (colors.length && !f.colors[colorKey(c)]) return false;
    if (sizes.length && !sizes.some(function (k) { return c.sizes[k] > 0; })) return false;
    if ((f.min != null || f.max != null) && !(c.price >= 100)) return false;
    if (f.min != null && c.price < f.min) return false;
    if (f.max != null && c.price > f.max) return false;
    return true;
  };

  var filtered = function () {
    var list = [];
    all.forEach(function (p) {
      if (f.type && p.type !== f.type) return;
      var cs = p.colors.filter(colorOk);
      if (!cs.length) return;
      // Показываем в карточке только подходящие цвета, чтобы фото совпадало с фильтром
      list.push(cs.length === p.colors.length ? p : Object.assign({}, p, { colors: cs, art: p.art + '|' + cs.map(function (c) { return c.name; }).join(',') }));
    });
    var by = {
      pop: function (a, b) { return a.pop - b.pop; },
      cheap: function (a, b) { return a.price - b.price; },
      exp: function (a, b) { return (isFinite(b.price) ? b.price : -1) - (isFinite(a.price) ? a.price : -1); },
      stock: function (a, b) { return b.units - a.units; }
    }[f.sort];
    return list.sort(by);
  };

  /* Модели под заказ — без остатков, фильтруются только по виду изделия */
  var renderOrder = function () {
    var list = order.filter(function (o) { return !f.type || o.type === f.type; });
    var box = $('[data-order]');
    box.hidden = !list.length;
    if (!list.length) return;
    var lim = orderAll ? list.length : 8;
    $('[data-order-n]').textContent = list.length;
    $('[data-order-grid]').innerHTML = list.slice(0, lim).map(function (o) {
      return '<a class="ocard" href="brand.html#brief"><span class="ocard__media"><img src="' + o.img + '" alt="' + esc(o.name) + '" loading="lazy"><span class="ocard__tag mono">под заказ</span></span>' +
        '<span class="ocard__name">' + esc(o.name) + '</span>' + (o.art ? '<span class="ocard__art mono">Арт. ' + esc(o.art) + '</span>' : '') +
        '<span class="ocard__cta">Запросить пошив <i data-lucide="arrow-right"></i></span></a>';
    }).join('');
    var more = $('[data-order-more]');
    more.hidden = list.length <= lim;
    more.textContent = 'Показать все ' + list.length;
  };

  var activeCount = function () {
    return Object.keys(f.sizes).length + Object.keys(f.colors).length + (f.min != null || f.max != null ? 1 : 0);
  };

  /* ---------- Отрисовка ---------- */
  var grid = $('[data-grid]');
  $('[data-empty]')._txt = [$('[data-empty] .display').textContent, $('[data-empty] p').textContent];
  var render = function () {
    var list = filtered();
    var page = list.slice(0, list.length > 6 ? shown - 1 : shown); // место под плитку «под ваш бренд»
    // После 6-й карточки — плитка «под ваш бренд»
    K.mountCards(grid, page);
    if (page.length > 6) {
      var promo = document.createElement('a');
      promo.className = 'cat-promo'; promo.href = 'brand.html';
      promo.innerHTML = '<span class="mono">Под ваш бренд</span><span class="display">Эта модель с вашим логотипом</span>' +
        '<span class="cat-promo__text">Вышьём или напечатаем логотип на нашем производстве. Можно отшить модель в цветах заведения.</span>' +
        '<span class="btn btn--red btn--sm">Обсудить проект <i data-lucide="arrow-right"></i></span>';
      grid.insertBefore(promo, grid.children[6]);
      K.icons();
    }

    $('[data-empty]').hidden = list.length > 0;
    if (all.length && $('[data-empty]')._txt) {
      $('[data-empty] .display').textContent = $('[data-empty]')._txt[0];
      $('[data-empty] p').textContent = $('[data-empty]')._txt[1];
      $('[data-empty] [data-reset]').hidden = false;
    }
    if (!all.length) {
      $('[data-empty]').hidden = false;
      $('[data-empty] .display').textContent = 'Сейчас шьём под заказ';
      $('[data-empty] p').textContent = 'Готовых изделий в выбранных разделах на складе нет. Отошьём в цветах вашего заведения: пришлите задачу, менеджер посчитает сроки и стоимость.';
      $('[data-empty] [data-reset]').hidden = true;
    }

    var more = $('[data-more]');
    more.hidden = !list.length;
    $('[data-found]').textContent = 'Найдено ' + list.length + ' ' + plural(list.length, 'модель', 'модели', 'моделей');
    $('[data-more-text]').textContent = 'Показано ' + page.length + ' из ' + list.length;
    $('[data-more-bar]').style.width = (list.length ? page.length / list.length * 100 : 0) + '%';
    $('[data-more-btn]').hidden = page.length >= list.length;
    $('[data-filters-apply]').textContent = 'Показать ' + list.length + ' ' + plural(list.length, 'модель', 'модели', 'моделей');

    // Активные фильтры — снимаемые чипы
    var chips = [];
    Object.keys(f.sizes).forEach(function (k) { chips.push(['size', k, 'Размер ' + k]); });
    Object.keys(f.colors).forEach(function (k) { chips.push(['color', k, k]); });
    if (f.min != null || f.max != null) chips.push(['price', '', (f.min != null ? 'от ' + fmt(f.min) + ' ' : '') + (f.max != null ? 'до ' + fmt(f.max) : '') + ' ₽']);
    $('[data-active]').innerHTML = chips.map(function (c) {
      return '<button type="button" data-unset="' + c[0] + '" data-v="' + esc(c[1]) + '">' + esc(c[2]) + '<i data-lucide="x"></i></button>';
    }).join('') + (chips.length > 1 ? '<button type="button" class="cat-active__reset" data-reset>Сбросить всё</button>' : '');
    var n = activeCount();
    $('[data-filters-n]').textContent = n ? n : '';

    // Состояние кнопок фильтров
    $$('[data-type]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-type') === f.type); });
    $$('[data-f-size]').forEach(function (b) { b.setAttribute('aria-pressed', !!f.sizes[b.getAttribute('data-f-size')]); b.classList.toggle('is-on', !!f.sizes[b.getAttribute('data-f-size')]); });
    $$('[data-f-color]').forEach(function (b) { b.setAttribute('aria-pressed', !!f.colors[b.getAttribute('data-f-color')]); });
    $$('[data-f-quick-i]').forEach(function (b) {
      var s = priceSteps[+b.getAttribute('data-f-quick-i')];
      b.setAttribute('aria-pressed', s[0] === f.min && s[1] === f.max);
    });
    $('[data-f-min]').value = f.min != null ? f.min : '';
    $('[data-f-max]').value = f.max != null ? f.max : '';
    renderOrder();
    K.icons();
  };

  var update = function () { shown = PAGE; render(); };
  var reset = function () { f.sizes = {}; f.colors = {}; f.min = f.max = null; update(); };

  /* ---------- События ---------- */
  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-role]'))) {
      var rid = t.getAttribute('data-role');
      if (!rid) { sel = {}; q = ''; } else if (sel[rid]) delete sel[rid]; else sel[rid] = 1;
      sale = false;
      var u0 = new URL(location.href), ids = selIds();
      u0.searchParams.delete('sale'); if (!q) u0.searchParams.delete('q');
      if (ids.length) u0.searchParams.set('role', ids.join(',')); else u0.searchParams.delete('role');
      history.replaceState(null, '', u0);
      renderHead(); applyRoles(); return;
    }
    if ((t = e.target.closest('[data-sale]'))) {
      sale = !sale; sel = {};
      var us = new URL(location.href); us.searchParams.delete('role');
      if (sale) us.searchParams.set('sale', '1'); else us.searchParams.delete('sale');
      history.replaceState(null, '', us);
      renderHead(); applyRoles(); return;
    }
    if ((t = e.target.closest('[data-type]'))) {
      f.type = t.getAttribute('data-type');
      var u = new URL(location.href); if (f.type) u.searchParams.set('type', f.type); else u.searchParams.delete('type');
      history.replaceState(null, '', u); update(); return;
    }
    if ((t = e.target.closest('[data-f-size]'))) { var k = t.getAttribute('data-f-size'); if (f.sizes[k]) delete f.sizes[k]; else f.sizes[k] = 1; update(); return; }
    if ((t = e.target.closest('[data-f-color]'))) { var c = t.getAttribute('data-f-color'); if (f.colors[c]) delete f.colors[c]; else f.colors[c] = 1; update(); return; }
    if ((t = e.target.closest('[data-f-quick-i]'))) {
      var s = priceSteps[+t.getAttribute('data-f-quick-i')];
      if (f.min === s[0] && f.max === s[1]) { f.min = f.max = null; } else { f.min = s[0]; f.max = s[1]; }
      update(); return;
    }
    if ((t = e.target.closest('[data-unset]'))) {
      var kind = t.getAttribute('data-unset'), v = t.getAttribute('data-v');
      if (kind === 'size') delete f.sizes[v]; else if (kind === 'color') delete f.colors[v]; else f.min = f.max = null;
      update(); return;
    }
    if (e.target.closest('[data-colors-all]')) { $('[data-f-colors]').classList.add('is-all'); return; }
    if (e.target.closest('[data-reset]')) { reset(); return; }
    if (e.target.closest('[data-more-btn]')) { shown += PAGE; render(); return; }
    if (e.target.closest('[data-order-more]')) { orderAll = true; renderOrder(); K.icons(); return; }
    if (e.target.closest('[data-filters-open]')) { setDrawer(true); return; }
    if (e.target.closest('[data-filters-close], [data-filters-apply], [data-filters-scrim]')) { setDrawer(false); return; }
  });
  var priceInput = function () {
    var a = parseInt($('[data-f-min]').value, 10), b = parseInt($('[data-f-max]').value, 10);
    f.min = isNaN(a) ? null : a; f.max = isNaN(b) ? null : b; update();
  };
  $('[data-f-min]').addEventListener('change', priceInput);
  $('[data-f-max]').addEventListener('change', priceInput);
  $('[data-sort]').addEventListener('change', function (e) { f.sort = e.target.value; update(); });

  /* Фильтры на телефоне — выезжающая панель */
  var setDrawer = function (open) {
    document.body.classList.toggle('filters-open', open);
    if (open) $('[data-filters-close]').focus();
  };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });
})();
