/* KORRTO 2026 — корзина: строки из KORRTO.cart (localStorage), количество в пределах остатка, удаление с возвратом. */
(function () {
  'use strict';
  var K = window.KORRTO, S = window.KORRTO_STOCK, C = K.cart;
  var fmt = K.fmt, plural = K.plural, esc = K.esc;
  var $ = function (s) { return document.querySelector(s); };
  var gone = null, goneT;

  var imgHTML = function (l) {
    var inner = l.img ? '<img src="' + esc(l.img) + '" alt="" loading="lazy">' : '';
    var cls = 'line__img' + (l.img ? '' : ' line__img--none');
    var style = l.img ? '' : ' style="--c:' + esc(l.hex) + '"';
    if (!l.img) inner = '<span></span>';
    return l.href ? '<a class="' + cls + '" href="' + esc(l.href) + '"' + style + ' tabindex="-1" aria-hidden="true">' + inner + '</a>'
      : '<span class="' + cls + '"' + style + '>' + inner + '</span>';
  };

  var lineHTML = function (l) {
    var name = l.href ? '<a class="line__name" href="' + esc(l.href) + '">' + esc(l.name) + '</a>' : '<span class="line__name">' + esc(l.name) + '</span>';
    var atMax = l.qty >= l.max;
    return '<li class="line" data-key="' + esc(l.key) + '">' +
      '<div class="line__prod">' + imgHTML(l) + '<div>' + name +
        '<div class="line__art mono">Арт. ' + esc(l.art) + '</div>' +
        (l.kind === 'cert' ? '<div class="line__opts"><span>Электронный, придёт на почту</span><span>Действует 6 месяцев</span></div>'
          : '<div class="line__opts"><span><i style="background:' + esc(l.hex) + '"></i>' + esc(l.color) + '</span><span>Размер <b>' + esc(l.size) + '</b></span></div>') +
        (atMax ? '<div class="line__left">Это весь остаток на складе' + (l.max > 1 ? ' — ' + l.max + ' шт' : '') + '. Больше отошьём под заказ.</div>' : '') +
      '</div></div>' +
      '<div class="qty" role="group" aria-label="Количество"><button type="button" data-dec aria-label="Меньше"' + (l.qty <= 1 ? ' disabled' : '') + '><i data-lucide="minus"></i></button>' +
        '<input type="text" inputmode="numeric" value="' + l.qty + '" aria-label="Количество, шт" data-q>' +
        '<button type="button" data-inc aria-label="Больше"' + (atMax ? ' disabled' : '') + '><i data-lucide="plus"></i></button></div>' +
      '<div class="line__sum">' + (l.price ? '<span class="price">' + fmt(l.price * l.qty) + ' ₽</span>' + (l.qty > 1 ? '<small>' + fmt(l.price) + ' ₽ × ' + l.qty + '</small>' : '')
        : '<span class="price"><small>Цена по запросу</small></span>') + '</div>' +
      '<button class="line__del" type="button" data-del aria-label="Удалить из корзины"><i data-lucide="trash-2"></i></button>' +
    '</li>';
  };

  var render = function () {
    var lines = C.lines();
    var n = C.count(), models = lines.length;
    var empty = !models && !gone;
    $('[data-cart-full]').hidden = empty;
    $('[data-cart-empty]').hidden = !empty;
    $('[data-cart-meta]').textContent = models ? n + ' ' + plural(n, 'товар', 'товара', 'товаров') + ' · ' + models + ' ' + plural(models, 'позиция', 'позиции', 'позиций') : '';

    var html = lines.map(lineHTML);
    if (gone) html.splice(Math.min(gone.at, html.length), 0,
      '<li class="line line--gone"><span>Удалено: ' + esc(gone.line.name.split(',')[0]) + (gone.line.size ? ', ' + esc(gone.line.size) : '') + '</span><button type="button" data-undo>Вернуть</button></li>');
    $('[data-lines]').innerHTML = html.join('');

    var goods = C.sum(), ask = lines.some(function (l) { return !l.price; });
    $('[data-sum-label]').textContent = 'Товары, ' + n + ' шт';
    $('[data-sum-goods]').textContent = fmt(goods) + ' ₽';
    $('[data-sum-total]').textContent = fmt(goods) + ' ₽';
    var note = $('[data-sum-note]');
    note.hidden = !ask;
    note.textContent = ask ? 'Цену моделей «по запросу» менеджер назовёт при подтверждении, в итог она пока не входит.' : '';
    $('[data-bar-n]').textContent = n + ' ' + plural(n, 'товар', 'товара', 'товаров');
    $('[data-bar-sum]').textContent = fmt(goods) + ' ₽';
    if (!n) $('[data-co-bar]').classList.remove('is-on');
    K.icons(); K.syncCart();
  };

  /* Липкий итог: виден, пока кнопка «Оформить заказ» не на экране */
  var bar = $('[data-co-bar]');
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) {
    bar.classList.toggle('is-on', !en[0].isIntersecting && en[0].boundingClientRect.top > 0 && C.count() > 0);
  }).observe($('.sum__go'));

  var emptyRoles = function () {
    $('[data-empty-roles]').innerHTML = S.roles.filter(function (r) { return r.inStock; }).map(function (r) {
      return '<a href="catalog.html?role=' + r.id + '">' + esc(r.name) + ' <span class="mono">' + r.inStock + '</span></a>';
    }).join('');
  };

  var keyOf = function (el) { var li = el.closest('[data-key]'); return li && li.getAttribute('data-key'); };
  var lineOf = function (k) { return C.lines().filter(function (l) { return l.key === k; })[0]; };

  $('[data-lines]').addEventListener('click', function (e) {
    var t, k;
    if ((t = e.target.closest('[data-undo]'))) {
      clearTimeout(goneT); C.restore(gone.line, gone.at); gone = null; render(); return;
    }
    k = keyOf(e.target); if (!k) return;
    var l = lineOf(k);
    if (e.target.closest('[data-dec]')) { C.setQty(k, l.qty - 1); render(); return; }
    if (e.target.closest('[data-inc]')) { C.setQty(k, l.qty + 1); render(); return; }
    if (e.target.closest('[data-del]')) {
      clearTimeout(goneT);
      gone = { line: l, at: C.lines().indexOf(l) };
      C.remove(k); render();
      goneT = setTimeout(function () { gone = null; render(); }, 6000);
    }
  });
  $('[data-lines]').addEventListener('change', function (e) {
    if (!e.target.matches('[data-q]')) return;
    var k = keyOf(e.target), v = parseInt(e.target.value.replace(/\D/g, ''), 10) || 1;
    C.setQty(k, v); render();
  });
  $('[data-lines]').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.matches('[data-q]')) e.target.blur();
  });
  $('[data-clear]').addEventListener('click', function () {
    if (!window.confirm('Убрать из корзины все товары?')) return;
    clearTimeout(goneT); gone = null; C.clear(); render();
  });

  emptyRoles();
  render();
})();
