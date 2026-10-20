/* KORRTO 2026 — личный кабинет клиента, кликабельный прототип этапа 2.
 * Сценарии — по спеке docs/specs/lk-klienta/user-spec.md: вход, привязка компании по ИНН, заказы из 1С со статусами,
 * согласование КП, повтор заказа, персонал и «Одеть смену», компания и роли, профиль.
 * Компании, люди и заказы вымышленные; товары, артикулы, фото, цены и размеры в наличии — из каталога korrto.ru (снимок 19.10.2026).
 * Состояние демо (роль, решения по КП, персонал) — в localStorage, «Сбросить» в пульте возвращает исходное.
 */
(function () {
  'use strict';
  var K = window.KORRTO;
  var esc = K.esc, fmt = K.fmt, plural = K.plural;
  var root = document.querySelector('[data-lk]');
  var modal = document.querySelector('[data-modal]'), modalBody = modal.querySelector('[data-modal-body]');
  var IMG = 'https://korrto.ru/upload/aoptima_imagick_resizes/toBestFit_Y/w_440_h_660/blur_1/';

  /* ---------- Каталог: реальные модели ---------- */
  var P = {
    k274: { id: 7280, role: 'chef', art: '04.274', name: 'Китель поварской мужской с длинным рукавом, супатная застёжка', short: 'Китель мужской 04.274', color: 'белый', hex: '#FFFFFF', price: 3650, kind: 'cl', sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'], img: 'a2bdf0da4fef963bd8ab3d4e8e245c00/30f0a198-9078-11ef-907f-fa163edd4472_627a5bda-be41-11f0-9a1d-fa163edd4472.jpg' },
    k336: { id: 7281, role: 'chef', art: '04.336', name: 'Китель поварской женский с длинным рукавом, потайная застёжка', short: 'Китель женский 04.336', color: 'белый', hex: '#FFFFFF', price: 3530, kind: 'cl', sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'], img: '85b44839514a06f1618b14578bd8290f/614f212e-b314-11f0-8168-fa163edd4472_8c328434-c9ea-11f0-90c8-fa163edd4472.jpg' },
    br206: { id: 7563, role: 'chef', art: '03.206В', name: 'Брюки профессиональные «унисекс», пояс на резинке и шнурке', short: 'Брюки 03.206В', color: 'черный', hex: '#000000', price: 2650, kind: 'cl', sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'], img: '0ecb1d374cecf0b47e8194dd44a02540/d0aa37f8-3186-11f0-947a-fa163edd4472_8fb5b8f0-bf9b-11f0-9a1d-fa163edd4472.jpg' },
    ap160: { id: 7356, role: 'chef', art: '06.160', name: 'Фартук шеф-повара с грудкой, шлицей и кольцом для ручника', short: 'Фартук шефа 06.160', color: 'белый', hex: '#FFFFFF', price: 2490, kind: 'one', sizes: ['ONE SIZE'], img: '7edc198460cc0aa6feb19b90cb6c60dd/4e9a7b4c-a80d-11e7-9486-7446a0fe3135_717a4c8a-2c19-11f1-91dc-fa163edd4472.jpg' },
    po030: { id: 7340, role: 'waiter', art: '13.030', name: 'Поло с V-образным вырезом с коротким рукавом «унисекс»', short: 'Поло 13.030', color: 'белый', hex: '#FFFFFF', price: 1600, kind: 'cl', sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'], img: '88e043c568b91c0cd864e74a500556a9/66cb42be-bfa2-11f0-9a1d-fa163edd4472_66d8d9f6-bfa2-11f0-9a1d-fa163edd4472.jpg' },
    ap082: { id: 7320, role: 'waiter', art: '06.082', name: 'Фартук с грудкой, одним накладным карманом и разрезом спереди', short: 'Фартук официанта 06.082', color: 'черный', hex: '#000000', price: 1800, kind: 'one', sizes: ['ONE SIZE'], img: 'b43c91b585ff50006a87a78dff636561/72186c16-fff2-11ef-9d41-fa163edd4472_13e8c116-c051-11f0-9a1d-fa163edd4472.jpg' },
    sb700: { id: 7264, role: 'chef', art: 'MED700MB', name: 'Мужские сабо «LEON», черные', short: 'Сабо мужские LEON', color: 'черный', hex: '#000000', price: 5258, kind: 'sh', sizes: ['43', '44', '46'], img: 'c3924dd825d966c29e6fa279d301231c/537464b4-9778-11ef-91ba-fa163edd4472_fa289cea-cb8d-11f0-90c8-fa163edd4472.png' },
    sb950: { id: 7303, role: 'chef', art: 'MED950B', name: 'Женские сабо «LEON», черные', short: 'Сабо женские LEON', color: 'черный', hex: '#000000', price: 4840, kind: 'sh', sizes: ['36', '37', '38', '39', '40'], img: '5a3e47ea620f2571b4f7523b1d2f42f3/657fa1be-c37e-11ef-85c2-fa163edd4472_0cbafacc-c6e0-11f0-90c8-fa163edd4472.jpg' },
    cap049: { id: 7441, role: 'chef', art: '11.049', name: 'Бейсболка канвас с сеткой', short: 'Бейсболка 11.049', color: 'черный', hex: '#000000', price: 1500, kind: 'one', sizes: ['ONE SIZE'], img: '7435edacac262a094f0d38625c8f9518/95a326a8-b57d-11f0-8168-fa163edd4472_5485fd22-0a4a-11f1-87d4-fa163edd4472.jpg' },
    pil036: { id: 7254, role: 'chef', art: '11.036А', name: 'Пилотка поварская с круглым дном из сетки', short: 'Пилотка 11.036А', color: 'белый', hex: '#FFFFFF', price: 750, kind: 'one', sizes: ['ONE SIZE'], img: '030c17fd4ea96c87db5d13e4a82bdc82/77859c1a-b590-11f0-8168-fa163edd4472_1627e9c4-d65f-11f0-9042-fa163edd4472.jpg' },
    off: { id: 0, art: '06.101', name: 'Фартук поясной, снятая с продажи модель', short: 'Фартук поясной 06.101', color: 'бежевый', hex: '#D8C8AE', price: 1200, kind: 'one', sizes: [], off: true, img: '' }
  };
  Object.keys(P).forEach(function (k) {
    var p = P[k]; p.key = k;
    p.src = p.img ? IMG + p.img : '';
    p.href = p.id ? 'product.html?role=' + p.role + '&id=' + p.id : '';
  });
  /* Образы — как элементы ИБ 72 «Образы» (блок «С чем носить») */
  var LOOKS = [
    { id: 'kitchen', name: 'Повар: смена кухни', items: ['k274', 'br206', 'ap160', 'pil036', 'sb700'] },
    { id: 'kitchenF', name: 'Повар: женская смена', items: ['k336', 'br206', 'ap160', 'pil036', 'sb950'] },
    { id: 'hall', name: 'Официант: зал', items: ['po030', 'ap082', 'br206'] }
  ];
  var CL_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
  var HEIGHTS = ['158', '164', '170', '176', '182', '188', '194'];
  var SHOES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

  /* ---------- Демо-данные кабинета (вымышленные) ---------- */
  var L = function (p, size, qty) { return { p: p, size: size, qty: qty }; };
  var SEED = {
    companies: [
      { id: 'c1', name: 'ООО «Северный двор»', short: 'СД', role: 'owner', inn: '7709123453', kpp: '770901001', legal: 'Москва, ул. Покровка, д. 12, пом. 3', contr: 'Северный двор ООО', synced: '20.10.2026 13:31' },
      { id: 'c2', name: 'ООО «Северный двор Кейтеринг»', short: 'СК', role: 'buyer', inn: '7704553212', kpp: '770401001', legal: 'Москва, Ленинградский пр-т, д. 39, стр. 1', contr: 'Северный двор Кейтеринг ООО', synced: '20.10.2026 13:31' }
    ],
    orders: {
      c1: [
        { no: 412, date: '14.10.2026', src: '1С', st: 'work', pay: 'part', paid: 30000, ship: 'no', title: 'Форма кухни для нового филиала', lines: [L('k274', 'S', 2), L('k274', 'M', 4), L('k274', 'L', 4), L('k274', 'XL', 2), L('br206', 'M', 6), L('br206', 'L', 6)],
          log: [['14.10.2026', 'Заказ принят', 'Создан менеджером в 1С'], ['15.10.2026', 'Запущен в производство', ''], ['16.10.2026', 'Оплата 30 000 ₽', 'По счёту № 412']] },
        { no: 405, date: '09.10.2026', src: 'Сайт', st: 'ready', pay: 'paid', ship: 'no', title: 'Поло и фартуки для зала', lines: [L('po030', 'M', 4), L('po030', 'L', 2), L('ap082', 'ONE SIZE', 6)],
          log: [['09.10.2026', 'Заказ принят', 'Оформлен на сайте'], ['10.10.2026', 'Оплачен картой', ''], ['17.10.2026', 'Собран на складе', 'Ждёт отгрузки']] },
        { no: 398, date: '06.10.2026', src: '1С', st: 'kp', pay: 'no', ship: 'no', title: 'КП: форма зала, 10 человек', lines: [L('po030', 'S', 3), L('po030', 'M', 4), L('po030', 'L', 3), L('ap082', 'ONE SIZE', 10), L('br206', 'S', 3), L('br206', 'M', 4), L('br206', 'L', 3)],
          log: [['06.10.2026', 'Менеджер подготовил КП', 'Форма зала для открытия филиала']] },
        { no: 391, date: '30.09.2026', src: '1С', st: 'kp', pay: 'no', ship: 'no', title: 'КП: сабо и пилотки', lines: [L('sb700', '44', 2), L('sb700', '43', 1), L('pil036', 'ONE SIZE', 10)],
          log: [['30.09.2026', 'Менеджер подготовил КП', '']] },
        { no: 371, date: '18.09.2026', src: '1С', st: 'done', pay: 'paid', ship: 'yes', title: 'Форма кухни', lines: [L('k274', 'L', 3), L('k274', '4XL', 1), L('ap160', 'ONE SIZE', 6), L('pil036', 'ONE SIZE', 6), L('sb700', '44', 2)],
          log: [['18.09.2026', 'Заказ принят', ''], ['19.09.2026', 'Оплачен', ''], ['24.09.2026', 'Отгружен', 'Курьер, ул. Покровка, 12']] },
        { no: 352, date: '29.08.2026', src: 'Сайт', st: 'done', pay: 'paid', ship: 'yes', title: 'Поло для зала', lines: [L('po030', 'M', 6), L('po030', 'L', 4)] },
        { no: 333, date: '11.08.2026', src: 'Сайт', st: 'cancel', pay: 'no', ship: 'no', title: 'Бейсболки', lines: [L('cap049', 'ONE SIZE', 8)] },
        { no: 298, date: '03.06.2026', src: '1С', st: 'done', pay: 'paid', ship: 'yes', title: 'Женская форма кухни', lines: [L('k336', 'S', 2), L('k336', 'M', 2), L('sb950', '38', 2)] },
        { no: 241, date: '17.02.2026', src: '1С', st: 'done', pay: 'paid', ship: 'part', title: 'Фартуки', lines: [L('ap160', 'ONE SIZE', 8), L('off', 'ONE SIZE', 6)] },
        { no: 187, date: '21.11.2025', src: '1С', st: 'done', pay: 'paid', ship: 'yes', title: 'Форма к открытию', lines: [L('k274', 'M', 5), L('k274', 'L', 5), L('br206', 'M', 10), L('ap160', 'ONE SIZE', 10)] }
      ],
      c2: [
        { no: 377, date: '22.09.2026', src: '1С', st: 'done', pay: 'paid', ship: 'yes', title: 'Форма выездной команды', lines: [L('po030', 'M', 8), L('ap082', 'ONE SIZE', 8)] },
        { no: 316, date: '01.07.2026', src: 'Сайт', st: 'done', pay: 'paid', ship: 'yes', title: 'Брюки', lines: [L('br206', 'L', 6)] }
      ]
    },
    kp: { 391: { type: 'ok', date: '01.10.2026', who: 'Олег Смирнов' } },
    staff: {
      c1: [
        { id: 1, name: 'Иван Петров', pos: 'Шеф-повар', size: '2XL', h: '182', shoe: '44' },
        { id: 2, name: 'Повар 1', pos: 'Повар горячего цеха', size: 'L', h: '176', shoe: '43' },
        { id: 3, name: 'Повар 2', pos: 'Повар горячего цеха', size: 'XL', h: '182', shoe: '45' },
        { id: 4, name: 'Повар 3', pos: 'Повар холодного цеха', size: 'M', h: '170', shoe: '42' },
        { id: 5, name: 'Марина Ким', pos: 'Кондитер', size: 'S', h: '164', shoe: '38' },
        { id: 6, name: 'Официант 1', pos: 'Официант', size: 'M', h: '176', shoe: '43' },
        { id: 7, name: 'Официант 2', pos: 'Официант', size: 'S', h: '164', shoe: '38' },
        { id: 8, name: 'Официант 3', pos: 'Официант', size: 'L', h: '176', shoe: '44' },
        { id: 9, name: 'Официант 4', pos: 'Официант', size: '5XL', h: '188', shoe: '46' },
        { id: 10, name: 'Хостес', pos: 'Хостес', size: 'XS', h: '170', shoe: '37' }
      ],
      c2: [
        { id: 1, name: 'Повар выезда 1', pos: 'Повар', size: 'L', h: '176', shoe: '44' },
        { id: 2, name: 'Официант выезда 1', pos: 'Официант', size: 'M', h: '170', shoe: '39' }
      ]
    },
    people: {
      c1: [
        { name: 'Анна Лаврова', mail: 'a.lavrova@sever-dvor.example', role: 'owner', me: true },
        { name: 'Олег Смирнов', mail: 'chef@sever-dvor.example', role: 'buyer' },
        { name: 'Елена Иванова', mail: 'buh@sever-dvor.example', role: 'acc' }
      ],
      c2: [
        { name: 'Сергей Волков', mail: 's.volkov@sd-catering.example', role: 'owner' },
        { name: 'Анна Лаврова', mail: 'a.lavrova@sever-dvor.example', role: 'buyer', me: true }
      ]
    },
    reqs: { c1: [{ name: 'Дмитрий Орлов', mail: 'd.orlov@sever-dvor.example', note: 'Управляющий филиалом', date: '19.10.2026' }], c2: [] },
    addr: {
      c1: [{ t: 'Москва, ул. Покровка, д. 12', n: 'Ресторан. Приём 10:00–16:00, служебный вход со двора', main: true }, { t: 'Москва, Ленинградский пр-т, д. 39', n: 'Филиал, открытие в ноябре' }],
      c2: [{ t: 'Москва, Ленинградский пр-т, д. 39, стр. 1', n: 'Склад кейтеринга', main: true }]
    }
  };
  var ROLES = { owner: 'Владелец', buyer: 'Заказчик', acc: 'Бухгалтер' };
  var CAN = {
    order: { owner: 1, buyer: 1 }, kp: { owner: 1, buyer: 1 }, staff: { owner: 1, buyer: 1 },
    addr: { owner: 1, buyer: 1 }, team: { owner: 1 }
  };
  var ST = {
    new: ['Принят', 'st--ready'], kp: ['Ждёт вашего согласования', 'st--act'], work: ['В производстве', 'st--work'],
    ready: ['Готов, ждёт отгрузки', 'st--ready'], done: ['Выполнен', 'st--done'], cancel: ['Отменён', 'st--off']
  };
  var PAY = { paid: ['Оплачен', 'flag--ok', 'circle-check'], part: ['Оплачен частично', 'flag--part', 'circle-dot'], no: ['Не оплачен', 'flag--no', 'circle'] };
  var SHIP = { yes: ['Отгружен', 'flag--ok', 'truck'], part: ['Отгружен частично', 'flag--part', 'truck'], no: ['Не отгружен', 'flag--no', 'package'] };

  /* ---------- Состояние ---------- */
  var KEY = 'korrto-lk-demo';
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var D;
  try { D = JSON.parse(localStorage.getItem(KEY)); } catch (e) { D = null; }
  if (!D || D.v !== 3) D = { v: 3, auth: true, co: 'c1', role: null, data: clone(SEED) };
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { /* приватный режим — демо живёт до перезагрузки */ } };
  var data = function () { return D.data; };
  var co = function () { return data().companies.filter(function (c) { return c.id === D.co; })[0] || data().companies[0]; };
  var role = function () { return D.role || co().role; };
  var can = function (what) { return !!CAN[what][role()]; };

  /* ---------- Помощники ---------- */
  var sumOf = function (o) { return o.lines.reduce(function (a, l) { return a + P[l.p].price * l.qty; }, 0); };
  var qtyOf = function (o) { return o.lines.reduce(function (a, l) { return a + l.qty; }, 0); };
  var rub = function (n) { return fmt(n) + ' ₽'; };
  var ico = function (n) { return '<i data-lucide="' + n + '"></i>'; };
  var orders = function () { return data().orders[co().id] || []; };
  var findOrder = function (no) { return orders().filter(function (o) { return o.no === +no; })[0]; };
  var initials = function (s) { return s.replace(/[«»"]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); };
  var today = function () { var d = new Date(); return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear(); };
  var me = function () { return (data().people.c1.filter(function (p) { return p.me; })[0] || {}).name || 'Анна Лаврова'; };

  var status = function (o) {
    if (o.st === 'kp') {
      var d = data().kp[o.no];
      if (d && d.type === 'ok') return '<span class="st st--wait">Согласовано ' + (d.who === me() ? 'вами' : '') + ' ' + esc(d.date.slice(0, 5)) + ', ждёт менеджера</span>';
      if (d && d.type === 'fix') return '<span class="st st--wait">Правки запрошены ' + esc(d.date.slice(0, 5)) + '</span>';
    }
    var s = ST[o.st]; return '<span class="st ' + s[1] + '">' + s[0] + '</span>';
  };
  var flag = function (map, k) { var f = map[k]; return '<span class="flag ' + f[1] + '">' + ico(f[2]) + f[0] + '</span>'; };
  var stepIdx = { new: 0, kp: 0, work: 1, ready: 2, done: 3 };
  var steps = function (o) {
    var i = stepIdx[o.st]; if (i == null) return '';
    return '<div class="steps" aria-hidden="true">' + ['Принят', 'В работе', 'Готов', 'Выполнен'].map(function (t, n) {
      return '<span class="' + (n < i ? 'is-done' : n === i ? 'is-now' : '') + '">' + t + '</span>';
    }).join('') + '</div>';
  };
  var thumbs = function (o) {
    var seen = {}, out = [];
    o.lines.forEach(function (l) { if (!seen[l.p] && P[l.p].src) { seen[l.p] = 1; out.push('<img src="' + P[l.p].src + '" alt="" loading="lazy">'); } });
    return '<span class="lk-order__thumbs">' + out.slice(0, 5).join('') + '</span>';
  };
  var orderRow = function (o, home) {
    return '<div class="lk-order' + (home ? ' lk-order__home' : '') + '" data-go="#order/' + o.no + '" role="link" tabindex="0">' +
      '<span class="lk-order__no"><b>№ ' + o.no + '</b><span>' + o.date + ' · ' + o.src + '</span></span>' +
      '<span class="lk-order__what"><b>' + esc(o.title) + '</b><span>' + qtyOf(o) + ' шт.</span>' + (home ? steps(o) : thumbs(o)) + '</span>' +
      (home ? '' : '<span>' + status(o) + '</span>') +
      (home ? '<span>' + status(o) + '</span>' : '<span class="lk-order__flags">' + flag(PAY, o.pay) + flag(SHIP, o.ship) + '</span>') +
      '<span class="lk-order__sum">' + rub(sumOf(o)) + '</span>' + ico('chevron-right') + '</div>';
  };
  var lineRow = function (l) {
    var p = P[l.p];
    var img = p.src ? '<img src="' + p.src + '" alt="" loading="lazy">' : '<img alt="" style="background:' + p.hex + '">';
    var name = '<b>' + esc(p.name) + '</b><span>' + esc(p.art) + ' · ' + esc(p.color) + ' · ' + (l.size === 'ONE SIZE' ? 'единый размер' : 'размер ' + esc(l.size)) + (p.off ? ' · снят с продажи' : '') + '</span>';
    return '<div class="lk-line">' + (p.href ? '<a href="' + p.href + '" tabindex="-1">' + img + '</a>' : img) +
      '<div>' + (p.href ? '<a href="' + p.href + '">' + name + '</a>' : name) + '</div>' +
      '<span class="lk-line__q mono">' + l.qty + ' × ' + rub(p.price) + '</span><span class="mono">' + rub(p.price * l.qty) + '</span></div>';
  };
  var lockNote = function (t) { return '<div class="lk-note">' + ico('lock') + '<span>' + t + '</span></div>'; };

  /* ---------- Каркас: меню слева ---------- */
  var NAV = [
    ['home', 'Главная', 'layout-grid'], ['orders', 'Заказы', 'package'], ['kp', 'КП на согласование', 'file-check'],
    ['staff', 'Персонал', 'users'], ['company', 'Компания', 'building-2'], ['profile', 'Профиль', 'user']
  ];
  var kpWaiting = function () { return orders().filter(function (o) { return o.st === 'kp' && !data().kp[o.no]; }).length; };
  var side = function (cur) {
    var c = co();
    var list = data().companies.map(function (x) {
      return '<button type="button" data-co="' + x.id + '"><span class="lk-co__ava">' + esc(x.short) + '</span><span>' + esc(x.name) + '<span class="lk-co__role">' + ROLES[x.role] + '</span></span>' + (x.id === c.id ? ico('check') : '') + '</button>';
    }).join('');
    var nav = NAV.filter(function (n) { return n[0] !== 'staff' || can('staff'); }).map(function (n) {
      var badge = n[0] === 'kp' && kpWaiting() ? '<span class="lk-nav__n">' + kpWaiting() + '</span>' : '';
      return '<a href="#' + n[0] + '"' + (cur === n[0] ? ' aria-current="page"' : '') + '>' + ico(n[2]) + n[1] + badge + '</a>';
    }).join('');
    return '<aside class="lk-side">' +
      '<div class="lk-co"><button class="lk-co__btn" type="button" aria-expanded="false" data-co-open><span class="lk-co__ava">' + esc(c.short) + '</span>' +
      '<span><span class="lk-co__name">' + esc(c.name) + '</span><span class="lk-co__role">' + ROLES[role()] + ' · ИНН ' + c.inn + '</span></span>' + ico('chevrons-up-down') + '</button>' +
      '<div class="lk-co__menu" data-co-menu hidden>' + list + '<button type="button" class="lk-co__add" data-bind><span class="lk-co__ava">' + ico('plus') + '</span><span>Добавить компанию по ИНН</span></button></div></div>' +
      '<nav class="lk-nav" aria-label="Разделы кабинета">' + nav + '</nav>' +
      '<div class="lk-side__mgr"><span class="mono">Ваш менеджер</span><b>Отдел продаж KORRTO</b><a class="mono" href="tel:+74951251003">+7 495 125-10-03</a><a href="mailto:info@korrto.ru">info@korrto.ru</a></div>' +
      '</aside>';
  };
  var head = function (title, lead, tools) {
    return '<header class="lk-head"><div><h1 class="display lk-head__title">' + title + '</h1>' + (lead ? '<p class="lk-head__lead">' + lead + '</p>' : '') + '</div>' + (tools ? '<div class="lk-head__tools">' + tools + '</div>' : '') + '</header>';
  };

  /* ---------- Экраны ---------- */
  var V = {};

  V.home = function () {
    var os = orders(), c = co();
    var active = os.filter(function (o) { return o.st === 'new' || o.st === 'work' || o.st === 'ready'; });
    var kpw = kpWaiting();
    var year = os.filter(function (o) { return /2026$/.test(o.date) && o.st !== 'cancel'; });
    var tiles = '<div class="lk-tiles">' +
      '<a class="lk-tile" href="#orders"><span class="lk-tile__n">' + active.length + '</span><span class="lk-tile__l">' + plural(active.length, 'заказ', 'заказа', 'заказов') + ' в работе</span><span class="lk-tile__a">Все заказы ' + ico('arrow-right') + '</span></a>' +
      '<a class="lk-tile' + (kpw ? ' lk-tile--red' : '') + '" href="#kp"><span class="lk-tile__n">' + kpw + '</span><span class="lk-tile__l">КП ждут вашего решения</span><span class="lk-tile__a">Открыть ' + ico('arrow-right') + '</span></a>' +
      (can('staff') ? '<a class="lk-tile" href="#staff"><span class="lk-tile__n">' + (data().staff[c.id] || []).length + '</span><span class="lk-tile__l">сотрудников с размерами</span><span class="lk-tile__a">Персонал ' + ico('arrow-right') + '</span></a>'
        : '<div class="lk-tile"><span class="lk-tile__n">' + os.filter(function (o) { return o.pay !== 'paid' && o.st !== 'cancel' && o.st !== 'kp'; }).length + '</span><span class="lk-tile__l">заказа ждут оплаты</span><span class="lk-tile__a">по данным 1С</span></div>') +
      '<div class="lk-tile"><span class="lk-tile__n">' + year.length + '</span><span class="lk-tile__l">заказов в 2026 году на ' + rub(year.reduce(function (a, o) { return a + sumOf(o); }, 0)) + '</span><span class="lk-tile__a">из 1С и с сайта</span></div></div>';
    var kpo = os.filter(function (o) { return o.st === 'kp' && !data().kp[o.no]; })[0];
    var banner = kpo ? '<div class="lk-kp-banner"><div><span class="st st--act">Ждёт вашего согласования</span><h3>КП № ' + kpo.no + ' · ' + esc(kpo.title.replace(/^КП: /, '')) + '</h3><p>' + qtyOf(kpo) + ' шт. на ' + rub(sumOf(kpo)) + '. Менеджер подготовил ' + kpo.date + '.</p></div>' +
      '<a class="btn btn--red" href="#kp/' + kpo.no + '">Посмотреть КП ' + ico('arrow-right') + '</a></div>' : '';
    var acts = can('order') ? '<section class="lk-sec"><div class="lk-sec__row"><h2 class="display lk-sec__title">Быстрые действия</h2></div><div class="lk-actions">' +
      '<a class="lk-action" href="#staff"><span class="lk-action__ic">' + ico('shirt') + '</span><span><b>Одеть смену</b><p>Выберите сотрудников и образ — размеры подберём сами</p></span></a>' +
      '<button class="lk-action" type="button" data-repeat="' + (os.filter(function (o) { return o.st === 'done'; })[0] || {}).no + '"><span class="lk-action__ic">' + ico('repeat') + '</span><span><b>Повторить прошлый заказ</b><p>№ ' + (os.filter(function (o) { return o.st === 'done'; })[0] || {}).no + ' по текущим ценам сайта</p></span></button>' +
      '<a class="lk-action" href="catalog.html"><span class="lk-action__ic">' + ico('layout-grid') + '</span><span><b>Новый заказ из каталога</b><p>Цены и остатки обновляются из 1С каждые 10 минут</p></span></a></div></section>' : '';
    return head('Добрый день, ' + esc(me().split(' ')[0]), esc(c.name) + ' · ' + ROLES[role()] + '. Заказы и статусы — из 1С KORRTO, обновлено ' + c.synced + '.') + tiles + banner +
      '<section class="lk-sec"><div class="lk-sec__row"><h2 class="display lk-sec__title">Заказы в работе</h2><a class="link-arrow" href="#orders">Вся история ' + ico('arrow-right') + '</a></div>' +
      (active.length ? '<div class="lk-orders">' + active.map(function (o) { return orderRow(o, true); }).join('') + '</div>' : '<p class="lk-empty">Сейчас заказов в работе нет.</p>') + '</section>' + acts;
  };

  var ordFilter = 'all', ordQuery = '';
  V.orders = function () {
    var os = orders();
    var groups = { all: function () { return true; }, act: function (o) { return /new|kp|work|ready/.test(o.st); }, done: function (o) { return o.st === 'done'; }, cancel: function (o) { return o.st === 'cancel'; } };
    var names = { all: 'Все', act: 'В работе', done: 'Выполнены', cancel: 'Отменены' };
    var chips = Object.keys(names).map(function (k) { return '<button class="chip" type="button" data-of="' + k + '" aria-pressed="' + (ordFilter === k) + '">' + names[k] + ' <span class="mono">' + os.filter(groups[k]).length + '</span></button>'; }).join('');
    var q = ordQuery.trim().toLowerCase();
    var list = os.filter(groups[ordFilter]).filter(function (o) {
      return !q || String(o.no).indexOf(q) > -1 || o.title.toLowerCase().indexOf(q) > -1 || o.lines.some(function (l) { return P[l.p].name.toLowerCase().indexOf(q) > -1 || P[l.p].art.toLowerCase().indexOf(q) > -1; });
    });
    return head('Заказы', 'История компании за 2 года: заказы с сайта и из 1С. Статус, оплата и отгрузка — по данным 1С.') +
      '<div class="lk-filter">' + chips + '<label class="lk-search">' + ico('search') + '<span class="sr-only">Поиск по заказам</span><input type="search" placeholder="Номер, модель или артикул" value="' + esc(ordQuery) + '" data-oq></label></div>' +
      (list.length ? '<div class="lk-orders">' + list.map(function (o) { return orderRow(o); }).join('') + '</div>' : '<p class="lk-empty">Ничего не нашлось.</p>');
  };

  V.order = function (no) {
    var o = findOrder(no); if (!o) return V.orders();
    var sum = sumOf(o), paid = o.pay === 'paid' ? sum : o.pay === 'part' ? o.paid : 0;
    var log = (o.log || [[o.date, 'Заказ принят', '']]).slice();
    var d = data().kp[o.no];
    if (d) log.push([d.date, d.type === 'ok' ? 'КП согласовано' : 'Запрошены правки', d.who + (d.comment ? ' — «' + d.comment + '»' : '')]);
    var isKp = o.st === 'kp';
    var tools = (isKp && can('kp')) ? '<a class="btn btn--red" href="#kp/' + o.no + '">Перейти к согласованию ' + ico('arrow-right') + '</a>'
      : (can('order') && o.st !== 'kp' ? '<button class="btn" type="button" data-repeat="' + o.no + '">' + ico('repeat') + 'Повторить заказ</button>' : '');
    return '<a class="lk-back" href="#orders">' + ico('arrow-left') + 'Все заказы</a>' +
      head((isKp ? 'КП' : 'Заказ') + ' № ' + o.no, esc(o.title) + ' · от ' + o.date + ' · источник: ' + o.src, tools) +
      '<div class="lk-card"><div><div class="lk-lines">' + o.lines.map(lineRow).join('') + '</div>' +
      '<div class="lk-total"><span>' + qtyOf(o) + ' шт.</span><span>Итого <b>' + rub(sum) + '</b></span></div></div>' +
      '<div><div class="lk-box"><h3>Статус</h3>' + status(o) + steps(o) +
      '<ul class="lk-time">' + log.map(function (e, i) { return '<li' + (i === log.length - 1 ? ' class="is-red"' : '') + '><b>' + esc(e[1]) + '</b><span>' + e[0] + (e[2] ? ' · ' + esc(e[2]) : '') + '</span></li>'; }).join('') + '</ul></div>' +
      '<div class="lk-box"><h3>Оплата и отгрузка</h3><dl class="lk-kv"><dt>Оплачено</dt><dd class="mono">' + rub(paid) + ' из ' + rub(sum) + '</dd></dl><div class="lk-bar"><i style="width:' + Math.round(paid / sum * 100) + '%"></i></div>' +
      '<dl class="lk-kv"><dt>Оплата</dt><dd>' + flag(PAY, o.pay) + '</dd><dt>Отгрузка</dt><dd>' + flag(SHIP, o.ship) + '</dd><dt>Доставка</dt><dd>' + esc((data().addr[co().id][0] || {}).t || '—') + '</dd></dl></div></div></div>';
  };

  V.kp = function (no) {
    if (no) return V.kpOne(no);
    var list = orders().filter(function (o) { return o.st === 'kp'; });
    return head('КП на согласование', 'Коммерческие предложения менеджера. Согласуйте или попросите правки — менеджер увидит ваше решение и переведёт заказ в работу в 1С.') +
      (list.length ? '<div class="lk-kps">' + list.map(function (o) {
        var dec = data().kp[o.no];
        return '<div class="lk-kp' + (dec ? '' : ' is-act') + '" data-go="#kp/' + o.no + '" role="link" tabindex="0"><div>' + status(o) + '<h3>КП № ' + o.no + ' · ' + esc(o.title.replace(/^КП: /, '')) + '</h3><p>Подготовлено ' + o.date + ' · ' + qtyOf(o) + ' шт. · ' + o.lines.length + ' ' + plural(o.lines.length, 'позиция', 'позиции', 'позиций') + '</p></div>' +
          '<div class="lk-kp__sum"><b>' + rub(sumOf(o)) + '</b><span class="link-arrow">' + (dec || !can('kp') ? 'Открыть' : 'Посмотреть и решить') + ' ' + ico('arrow-right') + '</span></div></div>';
      }).join('') + '</div>' : '<p class="lk-empty">КП на согласовании нет.</p>');
  };
  V.kpOne = function (no) {
    var o = findOrder(no); if (!o || o.st !== 'kp') return V.kp();
    var d = data().kp[o.no];
    var decide = d ? '<div class="lk-decision"><b>' + (d.type === 'ok' ? 'Согласовано' : 'Правки запрошены') + ' ' + d.date + '</b>' + esc(d.who) + (d.type === 'ok' ? '. Менеджер переведёт заказ в работу и выставит счёт.' : '. Менеджер пришлёт исправленное КП — кнопки вернутся, когда изменятся позиции или сумма.') + (d.comment ? '<q>' + esc(d.comment) + '</q>' : '') + '</div>'
      : can('kp') ? '<button class="btn btn--red" type="button" data-kp-ok="' + o.no + '">' + ico('check') + 'Согласовать</button><button class="btn btn--ghost" type="button" data-kp-fix="' + o.no + '">' + ico('message-square') + 'Нужны правки</button>'
        : lockNote('Согласовывать КП могут владелец и заказчик. Ваша роль — бухгалтер.');
    return '<a class="lk-back" href="#kp">' + ico('arrow-left') + 'Все КП</a>' +
      head('КП № ' + o.no, esc(o.title.replace(/^КП: /, '')) + ' · подготовлено ' + o.date + '. Цены — по прайсу KORRTO, вышивка и сроки — в письме менеджера.') +
      '<div class="lk-card"><div><div class="lk-lines">' + o.lines.map(lineRow).join('') + '</div><div class="lk-total"><span>' + qtyOf(o) + ' шт.</span><span>Итого <b>' + rub(sumOf(o)) + '</b></span></div></div>' +
      '<div><div class="lk-box"><h3>Ваше решение</h3>' + status(o) + decide + '</div>' +
      '<div class="lk-box"><h3>Как это работает</h3><p class="lk-muted" style="margin:0;font-size:14px">Решение сохраняется в кабинете и в журнале для менеджера. Статус в 1С менеджер меняет сам, после этого заказ появится в «Заказах» со статусом «В производстве».</p></div></div></div>';
  };

  var sel = {};
  V.staff = function () {
    if (!can('staff')) return head('Персонал') + lockNote('Персонал с размерами видят и ведут владелец и заказчик. Ваша роль — бухгалтер.');
    var list = data().staff[co().id] || [];
    var n = list.filter(function (s) { return sel[s.id]; }).length;
    var opt = function (arr, v) { return arr.map(function (x) { return '<option' + (x === v ? ' selected' : '') + '>' + x + '</option>'; }).join(''); };
    var rows = list.map(function (s) {
      return '<tr' + (sel[s.id] ? ' class="is-sel"' : '') + '><td><input type="checkbox" data-sel="' + s.id + '"' + (sel[s.id] ? ' checked' : '') + ' aria-label="Выбрать: ' + esc(s.name) + '"></td>' +
        '<td><b>' + esc(s.name) + '</b><span class="lk-muted">' + esc(s.pos) + '</span></td>' +
        '<td><select class="lk-sel" data-f="size" data-id="' + s.id + '" aria-label="Размер одежды">' + opt(CL_SIZES, s.size) + '</select></td>' +
        '<td><select class="lk-sel" data-f="h" data-id="' + s.id + '" aria-label="Рост">' + opt(HEIGHTS, s.h) + '</select></td>' +
        '<td><select class="lk-sel" data-f="shoe" data-id="' + s.id + '" aria-label="Размер обуви">' + opt(SHOES, s.shoe) + '</select></td>' +
        '<td><button class="lk-del" type="button" data-del="' + s.id + '" aria-label="Удалить ' + esc(s.name) + '">' + ico('trash-2') + '</button></td></tr>';
    }).join('');
    var all = list.length && n === list.length;
    return head('Персонал', 'Сотрудники с размерами. Имя можно заменить меткой — «Официант 3». Размеры — из тех же списков, что в каталоге, поэтому «Одеть смену» подбирает точно.',
      '<button class="btn btn--ghost" type="button" data-add-staff>' + ico('user-plus') + 'Добавить сотрудника</button><button class="btn btn--red" type="button" data-dress>' + ico('shirt') + 'Одеть смену</button>') +
      '<div class="lk-staff-bar" data-bar' + (n ? '' : ' hidden') + '><span><b>' + n + '</b> ' + plural(n, 'сотрудник выбран', 'сотрудника выбрано', 'сотрудников выбрано') + '</span><button class="btn btn--ghost-inv btn--sm" type="button" data-unsel>Снять выбор</button><button class="btn btn--red btn--sm" type="button" data-dress>' + ico('shirt') + 'Одеть смену</button></div>' +
      '<div class="lk-table-wrap"><table class="lk-table"><thead><tr><th><input type="checkbox" data-sel-all' + (all ? ' checked' : '') + ' aria-label="Выбрать всех"></th><th>Сотрудник</th><th>Размер одежды</th><th>Рост</th><th>Размер обуви</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  };

  V.company = function () {
    var c = co(), id = c.id, people = data().people[id], reqs = data().reqs[id] || [], addr = data().addr[id];
    var team = can('team');
    var roleSel = function (r, i) { return '<select class="lk-sel" data-prole="' + i + '"' + (team && r !== 'owner' ? '' : ' disabled') + ' aria-label="Роль">' + ['owner', 'buyer', 'acc'].map(function (x) { return '<option value="' + x + '"' + (x === r ? ' selected' : '') + (x === 'owner' && r !== 'owner' ? ' disabled' : '') + '>' + ROLES[x] + '</option>'; }).join('') + '</select>'; };
    var ppl = people.map(function (p, i) {
      return '<div class="lk-person"><span class="lk-person__ava">' + initials(p.name) + '</span><span><b>' + esc(p.name) + (p.me ? ' <span class="lk-muted">(вы)</span>' : '') + '</b><span>' + esc(p.mail) + '</span></span>' + roleSel(p.role, i) +
        (team && !p.me ? '<button class="lk-del" type="button" data-unlink="' + i + '" aria-label="Исключить ' + esc(p.name) + '">' + ico('user-minus') + '</button>' : '<span></span>') + '</div>';
    }).join('');
    var rq = team ? reqs.map(function (r, i) {
      return '<div class="lk-req"><span class="lk-person__ava">' + initials(r.name) + '</span><span><b>' + esc(r.name) + '</b><span class="lk-muted" style="display:block;font-size:13px">' + esc(r.mail) + ' · ' + esc(r.note) + ' · ввёл ИНН ' + r.date + '</span></span>' +
        '<div class="lk-req__tools"><select class="lk-sel" data-rq-role="' + i + '" aria-label="Роль для нового участника"><option value="buyer">Заказчик</option><option value="acc">Бухгалтер</option></select><button class="btn btn--red btn--sm" type="button" data-rq-ok="' + i + '">Принять</button><button class="btn btn--ghost btn--sm" type="button" data-rq-no="' + i + '">Отклонить</button></div></div>';
    }).join('') : '';
    var ad = addr.map(function (a, i) {
      return '<div class="lk-addr">' + ico('map-pin') + '<div>' + esc(a.t) + (a.main ? ' <span class="st st--done" style="display:inline-flex;height:22px;font-size:12px">основной</span>' : '') + '<span>' + esc(a.n) + '</span></div>' +
        (can('addr') ? '<button class="lk-del" type="button" data-addr-del="' + i + '" aria-label="Удалить адрес">' + ico('trash-2') + '</button>' : '<span></span>') + '</div>';
    }).join('');
    return head('Компания', esc(c.name) + ' привязана к контрагенту 1С «' + esc(c.contr) + '» по ИНН. Реквизиты приходят из 1С — исправить их можно через менеджера.') +
      (rq ? '<section><div class="lk-sec__row"><h2 class="display lk-sec__title">Запросы на вступление</h2></div>' + rq + '</section>' : '') +
      '<div class="lk-two lk-sec" style="margin-top:' + (rq ? '' : '0') + '"><section><div class="lk-sec__row"><h2 class="display lk-sec__title">Реквизиты</h2><span class="mono lk-muted" style="font-size:12.5px">из 1С · ' + c.synced + '</span></div>' +
      '<div class="lk-box"><dl class="lk-kv"><dt>Название</dt><dd>' + esc(c.name) + '</dd><dt>ИНН</dt><dd class="mono">' + c.inn + '</dd><dt>КПП</dt><dd class="mono">' + c.kpp + '</dd><dt>Юр. адрес</dt><dd>' + esc(c.legal) + '</dd></dl></div></section>' +
      '<section><div class="lk-sec__row"><h2 class="display lk-sec__title">Адреса доставки</h2>' + (can('addr') ? '<button class="btn btn--ghost btn--sm" type="button" data-addr-add>' + ico('plus') + 'Добавить</button>' : '') + '</div><div class="lk-people">' + ad + '</div></section></div>' +
      '<section class="lk-sec"><div class="lk-sec__row"><h2 class="display lk-sec__title">Сотрудники кабинета</h2>' + (team ? '<span class="lk-muted" style="font-size:14px">Новые участники приходят по запросу: вводят ИНН компании, вы одобряете.</span>' : '') + '</div>' +
      '<div class="lk-people">' + ppl + '</div>' + (team ? '' : '<div style="margin-top:14px">' + lockNote('Участниками и ролями управляет владелец компании.') + '</div>') +
      '<div class="lk-sec"><div class="lk-sec__row"><h2 class="display lk-sec__title">Что может каждая роль</h2></div><div class="lk-table-wrap"><table class="lk-table" style="min-width:560px"><thead><tr><th style="width:auto;padding-left:0">Действие</th><th>Владелец</th><th>Заказчик</th><th>Бухгалтер</th></tr></thead><tbody>' +
      [['Заказы, статусы, оплаты и отгрузки', 1, 1, 1], ['Оформлять и повторять заказы, «Одеть смену»', 1, 1, 0], ['Согласовывать КП', 1, 1, 0], ['Вести персонал с размерами', 1, 1, 0], ['Менять адреса доставки', 1, 1, 0], ['Управлять участниками и ролями', 1, 0, 0]].map(function (r) {
        return '<tr><td style="width:auto;padding-left:0">' + r[0] + '</td>' + r.slice(1).map(function (v) { return '<td>' + (v ? ico('check') : '<span class="lk-muted">—</span>') + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div></div></section>';
  };

  V.profile = function () {
    var p = data().people.c1.filter(function (x) { return x.me; })[0];
    return head('Профиль') + '<div class="lk-two"><section class="lk-box"><h3>Данные</h3><div class="lk-form"><label class="lk-fld">Имя<input value="' + esc(p.name) + '"></label><label class="lk-fld">Почта — логин<input type="email" value="' + esc(p.mail) + '"></label><label class="lk-fld">Телефон<input type="tel" placeholder="+7"></label><button class="btn" type="button" data-toast="Данные профиля сохранены">Сохранить</button></div></section>' +
      '<section class="lk-box"><h3>Пароль</h3><div class="lk-form"><label class="lk-fld">Текущий пароль<input type="password" autocomplete="current-password"></label><label class="lk-fld">Новый пароль<input type="password" autocomplete="new-password"></label><button class="btn" type="button" data-toast="Пароль изменён">Сменить пароль</button></div>' +
      '<h3 style="margin-top:12px">Компании</h3><p class="lk-muted" style="margin:0;font-size:14px">Вы состоите в ' + data().companies.length + ' ' + plural(data().companies.length, 'компании', 'компаниях', 'компаниях') + '. Переключаются в меню слева.</p>' +
      '<button class="btn btn--ghost" type="button" data-logout>' + ico('log-out') + 'Выйти из кабинета</button></section></div>';
  };

  var authTab = 'in';
  V.login = function () {
    var form = authTab === 'in'
      ? '<div class="lk-form"><label class="lk-fld">Почта<input type="email" value="a.lavrova@sever-dvor.example" autocomplete="username"></label><label class="lk-fld">Пароль<input type="password" value="demo-demo" autocomplete="current-password"></label>' +
        '<button class="btn btn--red" type="button" data-login>Войти ' + ico('arrow-right') + '</button><div class="lk-auth__alt"><button type="button" data-forgot>Забыли пароль?</button><span class="lk-muted">Пароль от сайта korrto.ru подходит</span></div></div>'
      : '<div class="lk-form"><label class="lk-fld">Имя<input autocomplete="name" placeholder="Как к вам обращаться"></label><label class="lk-fld">Почта<input type="email" autocomplete="email" placeholder="name@company.ru"></label><label class="lk-fld">Пароль<input type="password" autocomplete="new-password" placeholder="Не короче 8 символов"></label>' +
        '<label class="check"><input type="checkbox" data-pd><span>Согласен на обработку персональных данных по <a href="privacy.html">политике конфиденциальности</a></span></label><p class="lk-fld"><span class="lk-err" data-reg-err></span></p>' +
        '<button class="btn btn--red" type="button" data-register>Создать кабинет ' + ico('arrow-right') + '</button></div>';
    return '<div class="lk-auth"><div class="lk-auth__pitch"><p class="lk-eyebrow mono">Личный кабинет KORRTO</p><h1 class="display">Форма для команды без звонков менеджеру</h1>' +
      '<ul class="lk-auth__list"><li>' + ico('package') + 'Все заказы компании за 2 года — с сайта и из 1С, со статусом, оплатой и отгрузкой</li>' +
      '<li>' + ico('file-check') + 'КП от менеджера согласуете в один клик или попросите правки</li>' +
      '<li>' + ico('repeat') + 'Повтор прошлого заказа по текущим ценам — одной кнопкой</li>' +
      '<li>' + ico('shirt') + '«Одеть смену»: выберите новых сотрудников — размеры подберутся сами</li>' +
      '<li>' + ico('users') + 'Коллеги по ролям: владелец, заказчик, бухгалтер</li></ul></div>' +
      '<div class="lk-auth__card"><div class="lk-tabs" role="tablist"><button type="button" role="tab" data-tab="in" aria-selected="' + (authTab === 'in') + '">Вход</button><button type="button" role="tab" data-tab="up" aria-selected="' + (authTab === 'up') + '">Регистрация</button></div>' + form + '</div></div>';
  };

  /* ---------- Роутер ---------- */
  var render = function () {
    var h = (location.hash || '#home').slice(1).split('/');
    var page = h[0], arg = h[1];
    if (!D.auth && page !== 'login') { location.replace('#login'); return; }
    if (page === 'login') { root.innerHTML = V.login(); }
    else {
      if (!V[page]) page = 'home';
      var cur = page === 'order' ? 'orders' : page;
      root.innerHTML = '<div class="lk-layout">' + side(cur) + '<div class="lk-main">' + V[page](arg) + '</div></div>';
    }
    syncProto();
    K.icons();
  };
  var rerender = function () { var y = window.scrollY; render(); window.scrollTo(0, y); };
  window.addEventListener('hashchange', function () { render(); window.scrollTo(0, 0); });

  /* ---------- Окна ---------- */
  var openModal = function (html, wide) {
    /* новый узел на каждое окно — обработчики прошлого окна не копятся */
    var nb = modalBody.cloneNode(false); modalBody.parentNode.replaceChild(nb, modalBody); modalBody = nb;
    modalBody.innerHTML = html; modal.querySelector('.lk-modal__box').classList.toggle('lk-modal__box--wide', !!wide);
    modal.classList.add('is-open'); document.body.style.overflow = 'hidden'; K.icons();
    var f = modalBody.querySelector('input, textarea, button'); if (f) f.focus({ preventScroll: true });
  };
  var closeModal = function () { modal.classList.remove('is-open'); document.body.style.overflow = ''; };
  modal.addEventListener('click', function (e) { if (e.target === modal || e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });

  var toCart = function (lines) {
    lines.forEach(function (x) {
      var p = P[x.p];
      K.cart.put({ art: p.art, name: p.name, color: p.color, hex: p.hex, size: x.size, price: p.price, img: p.src, href: p.href ? p.href + '&color=' + encodeURIComponent(p.color) : '', max: 999 }, x.qty);
    });
    K.syncCart();
  };
  var resultModal = function (title, lead, ok, miss, note) {
    var sum = ok.reduce(function (a, x) { return a + P[x.p].price * x.qty; }, 0), qty = ok.reduce(function (a, x) { return a + x.qty; }, 0);
    var html = '<h2 class="display">' + title + '</h2><p class="lk-modal__lead">' + lead + '</p>' +
      (ok.length ? '<p class="lk-res-h mono">Положим в корзину</p><ul class="lk-res">' + ok.map(function (x) {
        var p = P[x.p]; return '<li class="is-ok">' + ico('check') + '<div>' + esc(p.short) + '<span>' + (x.size === 'ONE SIZE' ? 'единый размер' : 'размер ' + esc(x.size)) + (x.who ? ' · ' + esc(x.who) : '') + '</span></div><span class="mono">' + x.qty + ' × ' + rub(p.price) + '</span></li>';
      }).join('') + '</ul>' : '') +
      (miss.length ? '<p class="lk-res-h mono">Не добавим</p><ul class="lk-res">' + miss.map(function (m) { return '<li class="is-no">' + ico('circle-alert') + '<div>' + m[0] + '<span>' + m[1] + '</span></div><span></span></li>'; }).join('') + '</ul>' : '') +
      (note ? '<div class="lk-note" style="margin-top:16px">' + ico('info') + '<span>' + note + '</span></div>' : '') +
      '<div class="lk-modal__foot"><button class="btn btn--ghost" type="button" data-close>Отмена</button>' +
      (ok.length ? '<button class="btn btn--red" type="button" data-put>В корзину · ' + qty + ' шт. · ' + rub(sum) + '</button>' : '') + '</div>';
    openModal(html, true);
    var b = modalBody.querySelector('[data-put]');
    if (b) b.addEventListener('click', function () {
      toCart(ok); closeModal(); K.toast('В корзине ' + qty + ' шт. на ' + rub(sum));
      setTimeout(function () { location.href = 'cart.html'; }, 900);
    });
  };

  var repeat = function (no) {
    var o = findOrder(no); if (!o) return;
    var ok = [], miss = [];
    o.lines.forEach(function (l) {
      var p = P[l.p];
      if (p.off) miss.push([esc(p.short) + ' × ' + l.qty, 'Модель снята с продажи — пропускаем']);
      else if (p.sizes.indexOf(l.size) < 0) miss.push([esc(p.short) + ', размер ' + esc(l.size) + ' × ' + l.qty, p.kind === 'sh' ? 'Этого размера нет в наличии' : 'Нет в наличии — можно <a href="' + p.href + '" style="text-decoration:underline">запросить пошив</a>']);
      else ok.push({ p: l.p, size: l.size, qty: l.qty });
    });
    resultModal('Повтор заказа № ' + o.no, 'Позиции по текущим ценам сайта и остаткам из 1С. В корзине можно поменять количество.', ok, miss);
  };

  /* «Одеть смену»: точное совпадение размера сотрудника с размером торгового предложения */
  var dress = function () {
    var list = (data().staff[co().id] || []).filter(function (s) { return sel[s.id]; });
    if (!list.length) { K.toast('Отметьте сотрудников галочками'); return; }
    var pickHtml = function (cur) {
      return '<p class="lk-res-h mono">Образы — как в блоке «С чем носить»</p><div class="lk-pick">' + LOOKS.map(function (lk) {
        return '<button type="button" data-pick="look:' + lk.id + '" aria-pressed="' + (cur === 'look:' + lk.id) + '"><span class="lk-pick__imgs">' + lk.items.slice(0, 3).map(function (k) { return '<img src="' + P[k].src + '" alt="">'; }).join('') + '</span><b>' + esc(lk.name) + '</b><span>' + lk.items.length + ' ' + plural(lk.items.length, 'предмет', 'предмета', 'предметов') + '</span></button>';
      }).join('') + '</div><p class="lk-res-h mono">Или одна модель</p><div class="lk-pick">' + ['k274', 'k336', 'po030', 'br206', 'ap082', 'sb700'].map(function (k) {
        return '<button type="button" data-pick="p:' + k + '" aria-pressed="' + (cur === 'p:' + k) + '"><span class="lk-pick__imgs"><img src="' + P[k].src + '" alt=""></span><b>' + esc(P[k].short) + '</b><span class="mono">' + rub(P[k].price) + '</span></button>';
      }).join('') + '</div>';
    };
    var who = list.map(function (s) { return esc(s.name); }).join(', ');
    openModal('<h2 class="display">Одеть смену</h2><p class="lk-modal__lead">' + list.length + ' ' + plural(list.length, 'сотрудник', 'сотрудника', 'сотрудников') + ': ' + who + '. Выберите образ или модель — подберём размер каждому.</p><div data-picks>' + pickHtml('') + '</div>' +
      '<div class="lk-modal__foot"><button class="btn btn--ghost" type="button" data-close>Отмена</button><button class="btn btn--red" type="button" data-match disabled style="opacity:.5">Подобрать размеры ' + ico('arrow-right') + '</button></div>', true);
    var cur = '';
    modalBody.addEventListener('click', function onPick(e) {
      var b = e.target.closest('[data-pick]');
      if (b) { cur = b.getAttribute('data-pick'); modalBody.querySelector('[data-picks]').innerHTML = pickHtml(cur); var m = modalBody.querySelector('[data-match]'); m.disabled = false; m.style.opacity = ''; K.icons(); return; }
      if (e.target.closest('[data-match]') && cur) {
        modalBody.removeEventListener('click', onPick);
        var items = cur.indexOf('look:') === 0 ? LOOKS.filter(function (l) { return 'look:' + l.id === cur; })[0].items : [cur.slice(2)];
        var ok = [], miss = [], agg = {};
        list.forEach(function (s) {
          items.forEach(function (k) {
            var p = P[k], need = p.kind === 'sh' ? s.shoe : p.kind === 'cl' ? s.size : 'ONE SIZE';
            if (p.sizes.indexOf(need) < 0) { miss.push([esc(s.name) + ' — ' + esc(p.short), (p.kind === 'sh' ? 'размера обуви ' : 'размера ') + esc(need) + ' нет в наличии · есть ' + p.sizes.join(', ')]); return; }
            var key = k + '|' + need;
            if (!agg[key]) { agg[key] = { p: k, size: need, qty: 0, names: [] }; ok.push(agg[key]); }
            agg[key].qty++; agg[key].names.push(s.name);
          });
        });
        var ord = CL_SIZES.concat(SHOES, ['ONE SIZE']);
        ok.sort(function (a, b) { return items.indexOf(a.p) - items.indexOf(b.p) || ord.indexOf(a.size) - ord.indexOf(b.size); });
        ok.forEach(function (x) { x.who = x.names.length > 3 ? x.names.slice(0, 3).join(', ') + ' и ещё ' + (x.names.length - 3) : x.names.join(', '); });
        var title = cur.indexOf('look:') === 0 ? LOOKS.filter(function (l) { return 'look:' + l.id === cur; })[0].name : P[cur.slice(2)].short;
        resultModal('Одеть смену', esc(title) + ' для ' + list.length + ' ' + plural(list.length, 'сотрудника', 'сотрудников', 'сотрудников') + '. Размер подбирается по точному совпадению со справочником каталога.', ok, miss,
          miss.length ? 'Для неподобранных можно выбрать другую модель или запросить пошив у менеджера. Заказ уйдёт в 1С с пометкой «Одеть смену».' : 'Заказ уйдёт в 1С с пометкой «Одеть смену».');
      }
    });
  };

  /* Привязка компании по ИНН: 10 цифр — юрлицо, 12 — ИП, с контрольной суммой */
  var innOk = function (s) {
    var d = s.split('').map(Number), chk = function (w) { return w.reduce(function (a, x, i) { return a + x * d[i]; }, 0) % 11 % 10; };
    if (/^\d{10}$/.test(s)) return chk([2, 4, 10, 3, 5, 9, 4, 6, 8]) === d[9];
    if (/^\d{12}$/.test(s)) return chk([7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === d[10] && chk([3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === d[11];
    return false;
  };
  var innOf = function (b) { var w = [2, 4, 10, 3, 5, 9, 4, 6, 8]; return b + (b.split('').reduce(function (a, x, i) { return a + x * w[i]; }, 0) % 11 % 10); };
  var DEMO_INN = { found: innOf('502771234'), taken: innOf('773012345'), none: innOf('771298765') };
  var bind = function () {
    openModal('<h2 class="display">Добавить компанию</h2><p class="lk-modal__lead">Введите ИНН. Если компания уже заказывала в KORRTO, история заказов из 1С откроется сразу.</p>' +
      '<div class="lk-form"><label class="lk-fld" data-inn-f>ИНН компании или ИП<input inputmode="numeric" maxlength="12" placeholder="10 или 12 цифр" data-inn><span class="lk-err" data-inn-err></span></label>' +
      '<div><span class="lk-muted" style="font-size:12.5px">Демо-ИНН:</span><div class="lk-inn-demo"><button type="button" data-inn-demo="' + DEMO_INN.found + '">есть в 1С, два КПП</button><button type="button" data-inn-demo="' + DEMO_INN.taken + '">уже есть владелец</button><button type="button" data-inn-demo="' + DEMO_INN.none + '">новый клиент</button></div></div>' +
      '<div data-inn-res></div></div><div class="lk-modal__foot"><button class="btn btn--ghost" type="button" data-close>Отмена</button><button class="btn btn--red" type="button" data-inn-go>Найти</button></div>');
    var inp = modalBody.querySelector('[data-inn]'), res = modalBody.querySelector('[data-inn-res]'), go = modalBody.querySelector('[data-inn-go]'), err = modalBody.querySelector('[data-inn-err]');
    var stage = 'find';
    var addCompany = function (c, ords) {
      data().companies.push(c); data().orders[c.id] = ords; data().staff[c.id] = []; data().reqs[c.id] = [];
      data().people[c.id] = [{ name: me(), mail: 'a.lavrova@sever-dvor.example', role: 'owner', me: true }];
      data().addr[c.id] = [{ t: c.legal, n: 'Юридический адрес из 1С', main: true }];
      D.co = c.id; D.role = null; save();
    };
    modalBody.addEventListener('click', function (e) {
      var d = e.target.closest('[data-inn-demo]'); if (d) { inp.value = d.getAttribute('data-inn-demo'); stage = 'find'; res.innerHTML = ''; go.textContent = 'Найти'; return; }
      if (!e.target.closest('[data-inn-go]')) return;
      var v = inp.value.replace(/\D/g, '');
      if (stage === 'find') {
        err.textContent = '';
        if (!innOk(v)) { err.textContent = v.length === 10 || v.length === 12 ? 'ИНН не прошёл проверку контрольной суммы' : 'В ИНН 10 цифр у компании и 12 у ИП'; return; }
        if (v === DEMO_INN.found) {
          res.innerHTML = '<div class="lk-found"><b>В 1С два контрагента с этим ИНН — выберите свой</b><label><input type="radio" name="kpp" checked> ООО «Ладога Фуд», КПП 502701001 · Мытищи</label><label><input type="radio" name="kpp"> ООО «Ладога Фуд» (филиал), КПП 771401001 · Москва</label></div>';
          stage = 'pick'; go.textContent = 'Привязать';
        } else if (v === DEMO_INN.taken) {
          res.innerHTML = '<div class="lk-note">' + ico('clock') + '<span>Компания уже в кабинете, у неё есть владелец. Отправили ему запрос — когда он одобрит и назначит роль, компания появится у вас в меню.</span></div>';
          stage = 'done'; go.textContent = 'Понятно'; K.icons();
        } else {
          res.innerHTML = '<div class="lk-note">' + ico('info') + '<span>В 1С KORRTO такого ИНН пока нет. Создадим компанию без истории — после первого заказа контрагент появится в 1С, и история подтянется сама.</span></div>';
          stage = 'new'; go.textContent = 'Создать компанию'; K.icons();
        }
      } else if (stage === 'pick') {
        addCompany({ id: 'c' + Date.now(), name: 'ООО «Ладога Фуд»', short: 'ЛФ', role: 'owner', inn: v, kpp: '502701001', legal: 'Московская обл., Мытищи, ул. Колпакова, д. 2', contr: 'Ладога Фуд ООО', synced: '20.10.2026 13:31' },
          [{ no: 356, date: '02.09.2026', src: '1С', st: 'done', pay: 'paid', ship: 'yes', title: 'Форма кухни', lines: [L('k274', 'M', 3), L('br206', 'M', 3)] },
            { no: 274, date: '14.04.2026', src: '1С', st: 'done', pay: 'paid', ship: 'yes', title: 'Фартуки', lines: [L('ap160', 'ONE SIZE', 6)] }]);
        closeModal(); location.hash = '#orders'; render(); K.toast('Компания привязана, вы — владелец. История: 2 заказа');
      } else if (stage === 'new') {
        addCompany({ id: 'c' + Date.now(), name: 'Новая компания', short: 'НК', role: 'owner', inn: v, kpp: '—', legal: 'Заполните при первом заказе', contr: 'появится после первого заказа', synced: '—' }, []);
        closeModal(); location.hash = '#home'; render(); K.toast('Компания создана, вы — владелец');
      } else closeModal();
    });
  };

  var addStaff = function () {
    var opt = function (arr, v) { return arr.map(function (x) { return '<option' + (x === v ? ' selected' : '') + '>' + x + '</option>'; }).join(''); };
    openModal('<h2 class="display">Новый сотрудник</h2><p class="lk-modal__lead">Имя необязательно — подойдёт метка вроде «Официант 5».</p><div class="lk-form lk-form--2">' +
      '<label class="lk-fld">Имя или метка<input data-n placeholder="Официант 5"></label><label class="lk-fld">Должность<input data-pos placeholder="Официант"></label>' +
      '<label class="lk-fld">Размер одежды<select data-s>' + opt(CL_SIZES, 'M') + '</select></label><label class="lk-fld">Рост<select data-h>' + opt(HEIGHTS, '176') + '</select></label>' +
      '<label class="lk-fld">Размер обуви<select data-sh>' + opt(SHOES, '42') + '</select></label></div>' +
      '<div class="lk-modal__foot"><button class="btn btn--ghost" type="button" data-close>Отмена</button><button class="btn btn--red" type="button" data-ok>Добавить</button></div>');
    modalBody.querySelector('[data-ok]').addEventListener('click', function () {
      var list = data().staff[co().id], q = function (s) { return modalBody.querySelector(s).value.trim(); };
      var id = list.reduce(function (a, s) { return Math.max(a, s.id); }, 0) + 1;
      list.push({ id: id, name: q('[data-n]') || 'Сотрудник ' + id, pos: q('[data-pos]') || '—', size: q('[data-s]'), h: q('[data-h]'), shoe: q('[data-sh]') });
      sel[id] = true; save(); closeModal(); rerender(); K.toast('Сотрудник добавлен и отмечен');
    });
  };

  var kpFix = function (no) {
    openModal('<h2 class="display">Нужны правки</h2><p class="lk-modal__lead">Напишите, что поменять в КП № ' + no + ' — менеджер увидит комментарий и пришлёт новую версию.</p>' +
      '<label class="lk-fld" data-fix-f>Комментарий<textarea data-fix placeholder="Например: поло нужно бордовое, а фартуки — на 2 шт. больше"></textarea><span class="lk-err" data-fix-err></span></label>' +
      '<div class="lk-modal__foot"><button class="btn btn--ghost" type="button" data-close>Отмена</button><button class="btn btn--red" type="button" data-fix-go>Отправить менеджеру</button></div>');
    modalBody.querySelector('[data-fix-go]').addEventListener('click', function () {
      var t = modalBody.querySelector('[data-fix]').value.trim();
      if (!t) { modalBody.querySelector('[data-fix-err]').textContent = 'Без комментария менеджер не поймёт, что поправить'; modalBody.querySelector('[data-fix-f]').classList.add('is-bad'); return; }
      data().kp[no] = { type: 'fix', date: today(), who: me(), comment: t }; save(); closeModal(); rerender(); K.toast('Правки отправлены менеджеру');
    });
  };

  /* ---------- Клики ---------- */
  root.addEventListener('click', function (e) {
    var t = e.target, x;
    if ((x = t.closest('[data-co-open]'))) { var m = root.querySelector('[data-co-menu]'); m.hidden = !m.hidden; x.setAttribute('aria-expanded', !m.hidden); return; }
    if ((x = t.closest('[data-co]'))) { D.co = x.getAttribute('data-co'); D.role = null; sel = {}; save(); if (/^#(order|kp)\//.test(location.hash)) location.hash = '#home'; render(); K.toast('Компания: ' + co().name); return; }
    if (t.closest('[data-bind]')) { bind(); return; }
    if ((x = t.closest('[data-go]')) && !t.closest('a, button')) { location.hash = x.getAttribute('data-go'); return; }
    if ((x = t.closest('[data-repeat]'))) { repeat(x.getAttribute('data-repeat')); return; }
    if ((x = t.closest('[data-of]'))) { ordFilter = x.getAttribute('data-of'); rerender(); return; }
    if ((x = t.closest('[data-kp-ok]'))) { var no = x.getAttribute('data-kp-ok'); data().kp[no] = { type: 'ok', date: today(), who: me() }; save(); rerender(); K.toast('КП № ' + no + ' согласовано — менеджер увидит решение'); return; }
    if ((x = t.closest('[data-kp-fix]'))) { kpFix(x.getAttribute('data-kp-fix')); return; }
    if (t.closest('[data-dress]')) { dress(); return; }
    if (t.closest('[data-add-staff]')) { addStaff(); return; }
    if (t.closest('[data-unsel]')) { sel = {}; rerender(); return; }
    if ((x = t.closest('[data-del]'))) { var id = +x.getAttribute('data-del'); data().staff[co().id] = data().staff[co().id].filter(function (s) { return s.id !== id; }); delete sel[id]; save(); rerender(); K.toast('Сотрудник удалён из списка'); return; }
    if ((x = t.closest('[data-rq-ok]'))) { var i = +x.getAttribute('data-rq-ok'), r = data().reqs[co().id][i], rl = root.querySelector('[data-rq-role="' + i + '"]').value; data().people[co().id].push({ name: r.name, mail: r.mail, role: rl }); data().reqs[co().id].splice(i, 1); save(); rerender(); K.toast(r.name + ' в компании — ' + ROLES[rl].toLowerCase()); return; }
    if ((x = t.closest('[data-rq-no]'))) { var j = +x.getAttribute('data-rq-no'), rr = data().reqs[co().id].splice(j, 1)[0]; save(); rerender(); K.toast('Запрос ' + rr.name + ' отклонён'); return; }
    if ((x = t.closest('[data-unlink]'))) { var u = data().people[co().id].splice(+x.getAttribute('data-unlink'), 1)[0]; save(); rerender(); K.toast(u.name + ' больше не в компании'); return; }
    if ((x = t.closest('[data-addr-del]'))) { data().addr[co().id].splice(+x.getAttribute('data-addr-del'), 1); save(); rerender(); return; }
    if (t.closest('[data-addr-add]')) {
      openModal('<h2 class="display">Адрес доставки</h2><div class="lk-form"><label class="lk-fld">Адрес<input data-a placeholder="Город, улица, дом"></label><label class="lk-fld">Комментарий для курьера<input data-an placeholder="Часы приёма, вход"></label></div><div class="lk-modal__foot"><button class="btn btn--ghost" type="button" data-close>Отмена</button><button class="btn btn--red" type="button" data-a-ok>Сохранить</button></div>');
      modalBody.querySelector('[data-a-ok]').addEventListener('click', function () { var a = modalBody.querySelector('[data-a]').value.trim(); if (!a) return; data().addr[co().id].push({ t: a, n: modalBody.querySelector('[data-an]').value.trim() || '—' }); save(); closeModal(); rerender(); });
      return;
    }
    if ((x = t.closest('[data-toast]'))) { K.toast(x.getAttribute('data-toast')); return; }
    if (t.closest('[data-logout]')) { D.auth = false; save(); location.hash = '#login'; return; }
    if ((x = t.closest('[data-tab]'))) { authTab = x.getAttribute('data-tab'); render(); return; }
    if (t.closest('[data-forgot]')) { K.toast('Отправили ссылку для нового пароля на почту'); return; }
    if (t.closest('[data-login]')) { D.auth = true; save(); location.hash = '#home'; return; }
    if (t.closest('[data-register]')) {
      if (!root.querySelector('[data-pd]').checked) { root.querySelector('[data-reg-err]').textContent = 'Нужно согласие на обработку персональных данных'; return; }
      D.auth = true; save(); location.hash = '#home'; setTimeout(bind, 50); return;
    }
  });
  root.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('[data-sel]')) { sel[+t.getAttribute('data-sel')] = t.checked; rerender(); }
    else if (t.matches('[data-sel-all]')) { (data().staff[co().id] || []).forEach(function (s) { sel[s.id] = t.checked; }); rerender(); }
    else if (t.matches('[data-f]')) { var s = data().staff[co().id].filter(function (x) { return x.id === +t.getAttribute('data-id'); })[0]; s[t.getAttribute('data-f')] = t.value; save(); K.toast(s.name + ': сохранено'); }
    else if (t.matches('[data-prole]')) { var p = data().people[co().id][+t.getAttribute('data-prole')]; p.role = t.value; save(); K.toast(p.name + ' — ' + ROLES[t.value].toLowerCase()); }
  });
  root.addEventListener('input', function (e) { if (e.target.matches('[data-oq]')) { ordQuery = e.target.value; var pos = e.target.selectionStart; rerender(); var i = root.querySelector('[data-oq]'); i.focus({ preventScroll: true }); i.setSelectionRange(pos, pos); } });
  root.addEventListener('keydown', function (e) { var x = e.target.closest && e.target.closest('[data-go]'); if (x && e.key === 'Enter') location.hash = x.getAttribute('data-go'); });
  document.addEventListener('click', function (e) { var m = root.querySelector('[data-co-menu]'); if (m && !m.hidden && !e.target.closest('.lk-co')) { m.hidden = true; } });

  /* ---------- Пульт прототипа: роль и сброс ---------- */
  var proto = document.querySelector('[data-lk-proto]');
  var syncProto = function () {
    proto.querySelectorAll('[data-role]').forEach(function (b) { b.setAttribute('aria-pressed', D.auth && location.hash !== '#login' && role() === b.getAttribute('data-role')); });
    proto.querySelector('[data-p-login]').setAttribute('aria-pressed', !D.auth || location.hash === '#login');
  };
  proto.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-role')) { D.role = b.getAttribute('data-role'); D.auth = true; save(); if (location.hash === '#login') location.hash = '#home'; else rerender(); K.toast('Смотрим кабинет как: ' + ROLES[D.role].toLowerCase()); }
    else if (b.hasAttribute('data-p-login')) { D.auth = false; save(); location.hash = '#login'; render(); }
    else if (b.hasAttribute('data-p-reset')) { D = { v: 3, auth: true, co: 'c1', role: null, data: clone(SEED) }; sel = {}; save(); location.hash = '#home'; render(); K.toast('Демо сброшено'); }
  });

  render();
})();
