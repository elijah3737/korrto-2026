/* KORRTO 2026 — оформление заказа: «для себя» и «для компании», способ получения, оплата, логотип. Заказ никуда не отправляется — место под обмен с 1С. */
(function () {
  'use strict';
  var K = window.KORRTO, C = K.cart;
  var fmt = K.fmt, plural = K.plural, esc = K.esc;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var form = $('[data-ck]');

  if (!C.count()) { $('[data-co-empty]').hidden = false; K.icons(); return; }
  $('[data-co-body]').hidden = false;

  var PAY = {
    me: [['card', 'Картой на сайте', 'Оплатите после того, как менеджер подтвердит наличие'], ['link', 'По ссылке', 'Пришлём ссылку на оплату в мессенджер или на почту']],
    co: [['invoice', 'Счёт на юрлицо', 'Счёт, накладная и чек, отгрузка после оплаты'], ['corp', 'Корпоративной картой', 'Пришлём ссылку на оплату, чек — на почту']]
  };
  var SHIP = {
    courier: { price: 'от 1 000 ₽', addr: 'Адрес доставки', ph: 'Улица, дом, офис', done: 'Курьер по Москве привезёт за 1–2 дня.' },
    pickup: { price: 'бесплатно', done: 'Заберёте в шоуруме: БП «Румянцево», корпус Д, подъезд 20, 3 этаж.' },
    cdek: { price: 'по тарифу СДЭК', addr: 'Пункт выдачи или адрес', ph: 'Адрес пункта СДЭК или до двери', done: 'Отправим СДЭКом, трек-номер пришлём на почту.' },
    dl: { price: 'по тарифу', addr: 'Терминал или склад', ph: 'Адрес терминала «Деловых линий» или склада', done: 'Отправим «Деловыми линиями», документы приложим к грузу.' }
  };
  var val = function (name) { var el = form.querySelector('[name="' + name + '"]:checked'); return el ? el.value : ''; };

  /* ---------- Сводка справа ---------- */
  var renderSummary = function () {
    var lines = C.lines(), n = C.count(), goods = C.sum();
    $('[data-ck-lines]').innerHTML = lines.map(function (l) {
      var img = l.img ? '<img src="' + esc(l.img) + '" alt="">' : '<span></span>';
      return '<li><span class="line__img' + (l.img ? '' : ' line__img--none') + '" style="--c:' + esc(l.hex) + '">' + img + '<em>' + l.qty + '</em></span>' +
        '<div><b>' + esc(l.name.split(',')[0]) + '</b><span>' + (l.kind === 'cert' ? 'электронный сертификат' : esc(l.color) + ' · ' + esc(l.size)) + '</span></div>' +
        '<span class="price">' + (l.price ? fmt(l.price * l.qty) + ' ₽' : '<small>по запросу</small>') + '</span></li>';
    }).join('');
    var ship = val('ship');
    $('[data-sum-label]').textContent = 'Товары, ' + n + ' шт';
    $('[data-sum-goods]').textContent = fmt(goods) + ' ₽';
    $('[data-sum-ship]').textContent = SHIP[ship].price;
    $('[data-sum-ship]').classList.toggle('sum__muted', ship !== 'pickup');
    $('[data-total-label]').textContent = ship === 'pickup' ? 'Итого' : 'Итого без доставки';
    $('[data-sum-total]').textContent = fmt(goods) + ' ₽';
    $('[data-sum-logo-row]').hidden = !form.logo.checked;
    var ask = lines.some(function (l) { return !l.price; });
    $('[data-sum-note]').hidden = !ask;
    $('[data-sum-note]').textContent = ask ? 'Цену моделей «по запросу» менеджер назовёт при подтверждении.' : '';
  };

  /* ---------- Переключатели формы ---------- */
  var renderWho = function () {
    var who = val('who');
    $$('[data-only="co"]').forEach(function (el) { el.hidden = who !== 'co'; });
    if (who === 'me' && val('ship') === 'dl') form.querySelector('[name="ship"][value="courier"]').checked = true;
    $('[data-email-hint]').textContent = who === 'co' ? 'для счёта и документов' : 'для чека';
    var cur = val('pay');
    $('[data-pay]').innerHTML = PAY[who].map(function (o, i) {
      var on = cur ? cur === o[0] : i === 0;
      return '<label class="optc"><input type="radio" name="pay" value="' + o[0] + '"' + (on ? ' checked' : '') + '>' +
        '<span class="optc__body"><b>' + o[1] + '</b><span>' + o[2] + '</span></span></label>';
    }).join('');
    if (!val('pay')) form.querySelector('[name="pay"]').checked = true;
    $('[data-submit-label]').textContent = who === 'co' ? 'Получить счёт' : 'Подтвердить заказ';
    renderShip();
  };
  var renderShip = function () {
    var ship = val('ship'), s = SHIP[ship];
    $$('[data-addr]').forEach(function (el) { el.hidden = el.getAttribute('data-addr').split(' ').indexOf(ship) < 0; });
    if (s.addr) { $('[data-addr-label]').textContent = s.addr; form.addr.placeholder = s.ph; }
    $('[data-f="addr"]').classList.toggle('lf--wide', ship === 'courier');
    renderPayNote();
    renderSummary();
  };
  var renderPayNote = function () {
    var p = val('pay');
    $('[data-submit-note]').textContent = p === 'invoice' ? 'счёт на почту' : 'ссылку на оплату';
  };

  form.addEventListener('change', function (e) {
    var n = e.target.name;
    if (n === 'who') renderWho();
    else if (n === 'ship') renderShip();
    else if (n === 'pay') renderPayNote();
    else if (n === 'logo') { $('[data-logo-box]').hidden = !e.target.checked; renderSummary(); }
    else if (n === 'logoFile') showFile(e.target.files[0]);
    else if (n === 'consent') setErr('consent', '');
  });

  /* ---------- Логотип: файл кликом или перетаскиванием ---------- */
  var drop = $('[data-drop]');
  var showFile = function (f) {
    drop.classList.toggle('has-file', !!f);
    $('[data-file-name]').innerHTML = f ? '<b>' + esc(f.name) + '</b> · ' + Math.max(1, Math.round(f.size / 1024)) + ' КБ — нажмите, чтобы заменить' : '<b>Прикрепите логотип</b> — PNG, PDF, SVG, AI или CDR';
  };
  ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.remove('is-over'); }); });
  drop.addEventListener('drop', function (e) {
    e.preventDefault();
    var f = e.dataTransfer.files[0]; if (!f) return;
    try { var dt = new DataTransfer(); dt.items.add(f); form.logoFile.files = dt.files; } catch (err) { /* старый браузер — покажем имя без файла в поле */ }
    showFile(f);
  });

  /* ---------- Телефон: маска +7 (___) ___-__-__ ---------- */
  form.phone.addEventListener('input', function (e) {
    var d = e.target.value.replace(/\D/g, '');
    if (!d) { e.target.value = ''; return; }
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ')';
    if (d.length > 4) out += ' ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    e.target.value = out;
  });
  form.inn.addEventListener('input', function (e) { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 12); });

  /* ---------- Проверка и отправка ---------- */
  var setErr = function (name, msg) {
    if (name === 'consent') { $('[data-consent-err]').textContent = msg || ''; return; }
    var f = $('[data-f="' + name + '"]'); if (!f) return;
    f.classList.toggle('has-err', !!msg);
    $('.err', f).textContent = msg || '';
  };
  form.addEventListener('input', function (e) { var f = e.target.closest('[data-f]'); if (f) setErr(f.getAttribute('data-f'), ''); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var who = val('who'), ship = val('ship'), errs = [];
    var need = function (name, ok, msg) { if (!ok) { setErr(name, msg); errs.push(name); } else setErr(name, ''); };
    need('name', form.elements.fio.value.trim().length > 1, 'Как к вам обращаться?');
    need('phone', form.phone.value.replace(/\D/g, '').length === 11, 'Нужен телефон, 10 цифр после +7');
    need('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim()), who === 'co' ? 'На эту почту придёт счёт' : 'На эту почту придёт чек');
    if (who === 'co') {
      var inn = form.inn.value;
      need('inn', inn.length === 10 || inn.length === 12, 'ИНН — 10 цифр у компании или 12 у ИП');
      need('company', form.company.value.trim().length > 1, 'Название компании для счёта');
    }
    if (ship === 'cdek' || ship === 'dl') need('city', form.city.value.trim().length > 1, 'Город доставки');
    if (ship !== 'pickup') need('addr', form.addr.value.trim().length > 3, ship === 'courier' ? 'Куда привезти заказ' : 'Куда отправить заказ');
    need('consent', form.consent.checked, 'Без согласия мы не можем принять заказ');
    if (errs.length) {
      var first = errs[0] === 'consent' ? form.consent : $('[data-f="' + errs[0] + '"] input');
      first.focus({ preventScroll: true });
      first.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    var btn = $('.ck-submit__btn'); btn.classList.add('is-busy');
    setTimeout(function () { done(who, ship); }, 600);
  });

  var done = function (who, ship) {
    var d = new Date();
    var num = 'К-' + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' + String(d.getHours() * 60 + d.getMinutes()).padStart(4, '0');
    var n = C.count();
    $('[data-done-num]').textContent = 'Заказ № ' + num + ' · ' + n + ' ' + plural(n, 'товар', 'товара', 'товаров') + (C.sum() ? ' на ' + fmt(C.sum()) + ' ₽' : '');
    $('[data-done-text]').textContent = form.elements.fio.value.trim().split(' ')[0] + ', спасибо! Копия заказа ушла на ' + form.email.value.trim() + '. Менеджер позвонит в рабочее время.';
    var inv = val('pay') === 'invoice';
    $('[data-done-pay]').textContent = inv ? 'Выставим счёт' : 'Пришлём ссылку на оплату';
    $('[data-done-pay-text]').textContent = inv ? 'Счёт на ' + form.company.value.trim() + ' придёт на почту в течение рабочего дня.' : 'Оплатить можно картой, чек придёт на почту.';
    $('[data-done-ship-text]').textContent = SHIP[ship].done;
    C.clear(); K.syncCart();
    $('[data-co-body]').hidden = true;
    $('.co-head').hidden = true;
    $('[data-co-done]').hidden = false;
    K.icons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  renderWho();
  K.icons();
})();
