/* KORRTO 2026 — страницы для покупателей: подбор размера, вопрос с контактов, избранное.
 * Таблицы размеров — с korrto.ru/measurments (сдвоенные размеры). */
(function () {
  'use strict';
  var K = window.KORRTO, esc = K.esc, fmt = K.fmt, plural = K.plural;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Размеры ---------- */
  // [размер, российский, грудь, талия, бёдра]; верхняя граница последнего размера — «свыше»
  var SZ = {
    w: [['XS', '40–42', [79, 86], [59, 67], [87, 94]], ['S', '44–46', [87, 94], [68, 77], [95, 102]], ['M', '48–50', [95, 102], [78, 87], [103, 110]],
      ['L', '52–54', [103, 109], [88, 97], [111, 118]], ['XL', '56–58', [110, 117], [98, 108], [119, 126]], ['2XL', '60–62', [118, 125], [109, 113], [127, 134]],
      ['3XL', '64–66', [125, 0], [113, 0], [134, 0]]],
    m: [['S', '44–46', [87, 94], [76, 83], [93, 99]], ['M', '48–50', [95, 102], [84, 91], [100, 105]], ['L', '52–54', [103, 109], [92, 99], [106, 111]],
      ['XL', '56–58', [110, 117], [100, 107], [112, 116]], ['2XL', '60–62', [118, 125], [108, 116], [117, 122]], ['3XL', '64–66', [125, 0], [116, 0], [123, 0]]]
  };
  var range = function (r) { return r[1] ? r[0] + '–' + r[1] : 'от ' + (r[0] + 1); };
  var table = $('[data-sz-table]');
  var renderTable = function (g, hit) {
    table.innerHTML = '<thead><tr><th>Размер</th><th>Российский</th><th>Грудь, см</th><th>Талия, см</th><th>Бёдра, см</th></tr></thead><tbody>' +
      SZ[g].map(function (r, i) {
        return '<tr' + (i === hit ? ' class="is-hit"' : '') + '><td><b>' + r[0] + '</b></td><td>' + r[1] + '</td><td>' + range(r[2]) + '</td><td>' + range(r[3]) + '</td><td>' + range(r[4]) + '</td></tr>';
      }).join('') + '</tbody>';
    $$('[data-sz]').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-sz') === g); });
  };
  if (table) {
    var tabG = 'w', hitIdx = -1;
    renderTable('w', -1);
    $('[data-sz-tabs]').addEventListener('click', function (e) {
      var b = e.target.closest('[data-sz]'); if (!b) return;
      tabG = b.getAttribute('data-sz'); renderTable(tabG, tabG === calcG() ? hitIdx : -1);
    });

    var calc = $('[data-calc]');
    var calcG = function () { return ($('[name="g"]:checked', calc) || {}).value || 'w'; };
    // Индекс размера по одной мерке: первый, у которого верхняя граница не меньше значения
    var idxFor = function (rows, k, v) {
      for (var i = 0; i < rows.length; i++) { var r = rows[i][k]; if (!r[1] || v <= r[1]) return i; }
      return rows.length - 1;
    };
    var names = { 2: 'груди', 3: 'талии', 4: 'бёдрам' };
    var runCalc = function () {
      var g = calcG(), rows = SZ[g], out = $('[data-calc-out]');
      var vals = { 2: +calc.chest.value.replace(/\D/g, ''), 3: +calc.waist.value.replace(/\D/g, ''), 4: +calc.hips.value.replace(/\D/g, '') };
      var got = Object.keys(vals).filter(function (k) { return vals[k] >= 40 && vals[k] <= 200; });
      if (!got.length) {
        out.classList.remove('is-on'); hitIdx = -1;
        $('[data-calc-size]').textContent = '—';
        $('[data-calc-text]').textContent = 'Введите хотя бы обхват груди — подскажем размер.';
        renderTable(tabG, -1); return;
      }
      var per = got.map(function (k) { return { k: k, i: idxFor(rows, +k, vals[k]) }; });
      var top = Math.max.apply(null, per.map(function (x) { return x.i; }));
      var small = got.some(function (k) { return vals[k] < rows[0][+k][0]; });
      hitIdx = top;
      out.classList.add('is-on');
      $('[data-calc-size]').innerHTML = rows[top][0] + '<small>' + rows[top][1] + '</small>';
      var same = per.every(function (x) { return x.i === top; });
      var txt = same ? (got.length > 1 ? 'Все мерки попадают в этот размер.' : 'По обхвату ' + names[got[0]] + '.')
        : per.map(function (x) { return 'по ' + names[x.k] + ' — ' + rows[x.i][0]; }).join(', ') + '. Мерки в разных размерах — берите больший, чтобы форма не стесняла в смене.';
      if (small) txt += ' Мерки меньше таблицы — менеджер подскажет модель с меньшей посадкой.';
      if (top === rows.length - 1) txt += ' Для 4XL и 5XL уточните наличие у менеджера.';
      $('[data-calc-text]').innerHTML = esc(txt.charAt(0).toUpperCase() + txt.slice(1)) + ' <a href="catalog.html">Подобрать в каталоге</a>';
      tabG = g; renderTable(g, top);
    };
    calc.addEventListener('input', runCalc);
    calc.addEventListener('change', runCalc);
    calc.addEventListener('submit', function (e) { e.preventDefault(); });
  }

  /* ---------- Вопрос на странице контактов ---------- */
  var ask = $('[data-ask]');
  if (ask) {
    var setErr = function (name, msg) {
      if (name === 'consent') { $('[data-consent-err]', ask).textContent = msg || ''; return; }
      var f = $('[data-f="' + name + '"]', ask);
      f.classList.toggle('has-err', !!msg); $('.err', f).textContent = msg || '';
    };
    ask.addEventListener('input', function (e) { var f = e.target.closest('[data-f]'); if (f) setErr(f.getAttribute('data-f'), ''); if (e.target.name === 'consent') setErr('consent', ''); });
    ask.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, contact = ask.phone.value.trim();
      if (ask.fio.value.trim().length < 2) { setErr('fio', 'Как к вам обращаться?'); ok = false; }
      if (!(contact.replace(/\D/g, '').length >= 10 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact))) { setErr('phone', 'Телефон или почта, чтобы ответить'); ok = false; }
      if (ask.q.value.trim().length < 5) { setErr('q', 'Напишите вопрос'); ok = false; }
      if (!ask.consent.checked) { setErr('consent', 'Без согласия мы не можем принять вопрос'); ok = false; }
      if (!ok) return;
      $('.brief__body', ask).hidden = true; $('[data-ask-done]', ask).hidden = false; K.icons();
    });
    $('[data-ask-reset]', ask).addEventListener('click', function () {
      ask.reset(); $('.brief__body', ask).hidden = false; $('[data-ask-done]', ask).hidden = true;
    });
  }

  /* ---------- Избранное ---------- */
  var fg = $('[data-fv-grid]');
  if (fg) {
    var renderFav = function () {
      var list = K.fav.list(), n = list.length;
      $('[data-fv-meta]').textContent = n ? n + ' ' + plural(n, 'модель', 'модели', 'моделей') + ' · сохраняются в этом браузере' : '';
      $('[data-fv-empty]').hidden = n > 0;
      $('[data-fv-help]').hidden = n === 0;
      fg.innerHTML = list.map(function (f) {
        var href = f.href || 'catalog.html';
        var media = f.img ? '<img src="' + esc(f.img) + '" alt="' + esc(f.name + ', цвет ' + f.color) + '" loading="lazy">'
          : '<span class="card__nophoto" style="--c:' + esc(f.hex) + '"><span class="card__nophoto-dot"></span>Фото скоро добавим</span>';
        return '<article class="fcard" data-art="' + esc(f.art) + '">' +
          '<a class="fcard__media" href="' + esc(href) + '">' + media + '</a>' +
          '<button class="fcard__del" type="button" data-unfav aria-label="Убрать из избранного"><i data-lucide="heart"></i></button>' +
          '<p class="fcard__meta mono"><i style="background:' + esc(f.hex) + '"></i>' + esc(f.color) + (f.colors > 1 ? ' · ещё ' + (f.colors - 1) + ' ' + plural(f.colors - 1, 'цвет', 'цвета', 'цветов') : '') + '</p>' +
          '<h3 class="fcard__name"><a href="' + esc(href) + '">' + esc(f.name) + '</a></h3>' +
          (f.units ? '<p class="fcard__stock mono"><span class="dot" aria-hidden="true"></span>на складе ' + fmt(f.units) + ' шт</p>' : '') +
          '<div class="fcard__foot"><span class="price">' + (f.price ? fmt(f.price) + ' ₽' : '<small>Цена по запросу</small>') + '</span>' +
          '<a class="btn btn--sm" href="' + esc(href) + '">Выбрать размер</a></div></article>';
      }).join('');
      K.icons();
    };
    fg.addEventListener('click', function (e) {
      var b = e.target.closest('[data-unfav]'); if (!b) return;
      var card = b.closest('[data-art]');
      card.classList.add('is-out');
      setTimeout(function () { K.fav.remove(card.getAttribute('data-art')); K.syncFav(true); renderFav(); }, 220);
    });
    renderFav();
  }
  K.icons();
})();
