/* KORRTO 2026 — «Под ваш бренд»: способы нанесения, примерка именной вышивки, бриф. Тексты о технологиях — со страницы korrto.ru/branding. */
(function () {
  'use strict';
  var K = window.KORRTO, esc = K.esc;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Способы нанесения ---------- */
  var ok = '<i data-lucide="check"></i>', no = '<i data-lucide="minus"></i>';
  var whenHTML = function (yes, cons) {
    return '<div class="when"><h4>Когда выбирать</h4><ul>' + yes.map(function (t) { return '<li>' + ok + esc(t) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="when"><h4>Ограничения</h4><ul>' + cons.map(function (t) { return '<li>' + no + esc(t) + '</li>'; }).join('') + '</ul></div>';
  };
  var M = {
    emb: {
      title: 'Вышивка',
      text: 'Самый стойкий способ: цвет и чёткость рисунка сохраняются после многократных стирок и глажки. Программу вышивки готовим по вашему эскизу, она остаётся у нас для следующих заказов.',
      facts: [['Подходит', 'Кители, фартуки, поло, рубашки, головные уборы'], ['Стойкость', 'Не выцветает и не портится при частой стирке'], ['Цена зависит', 'От числа стежков, площади, количества цветов и сложности рисунка']],
      side: '<table class="prices"><caption>Цена вышивки за изделие</caption><thead><tr><th>Размер</th><th>Цена</th><th>Где</th></tr></thead><tbody>' +
        '<tr><td>до 11 см</td><td>300–350 ₽</td><td>грудь, рукав</td></tr><tr><td>12–16 см</td><td>400–450 ₽</td><td>спина</td></tr>' +
        '<tr><td>17–24 см</td><td>450–550 ₽</td><td>спина и другие места</td></tr><tr><td>от 25 см</td><td>по макету</td><td>по макету</td></tr></tbody></table>' +
        '<ul class="prices__notes"><li><b>1 500 ₽</b><span>программа вышивки логотипа, один раз на все заказы</span></li><li><b>750 ₽</b><span>именная вышивка, программа включена</span></li><li><b>450 ₽</b><span>повторная именная вышивка</span></li></ul>'
    },
    silk: {
      title: 'Шелкография',
      text: 'Печать через трафаретную сетку: каждый цвет наносится своим трафаретом. Краска ложится плотно, даёт насыщенный цвет и печатается даже на тёмной ткани.',
      facts: [['Подходит', 'Любые ткани и готовые изделия'], ['Тираж', 'Большой и малый'], ['Стойкость', 'Не выцветает, не линяет, держит стирку']],
      side: whenHTML(['Много изделий с одним логотипом', 'Тёмные ткани и яркие цвета', 'Футболки, поло, промо-одежда'], ['Для каждого цвета нужен свой трафарет', 'Фотоизображения передаёт хуже цифровой печати'])
    },
    film: {
      title: 'Термоперенос',
      text: 'Рисунок переносится на ткань прессом под высокой температурой. Плёнки режутся на плоттере — подходит для небольших тиражей и необычных эффектов: фольга, светоотражающая или бархатистая плёнка. Полноцветный трансфер печатается на бумаге и подходит для единичных изделий, в том числе бейсболок.',
      facts: [['Тираж', 'Небольшой: от 1 до 30 изделий'], ['Эффекты', 'Золото, серебро, светоотражающая, люминесцентная, бархатистая плёнка'], ['Уход', 'Стирка до +40 °C, гладить с изнанки, без химчистки']],
      side: whenHTML(['Нужно быстро и мало', 'Именные надписи и номера', 'Светоотражающие элементы'], ['Плёнка — один цвет, без фотоизображения', 'Менее стойкий рисунок, бережный уход'])
    },
    subl: {
      title: 'Сублимация',
      text: 'Чернила при нагреве окрашивают сами волокна ткани, поэтому рисунок не линяет, не осыпается и выдерживает стирку. Можно печатать полноцветные изображения даже в единственном экземпляре.',
      facts: [['Ткань', 'Только белая, синтетики не меньше 50%'], ['Тираж', 'От одного изделия'], ['Чаще всего', 'Флаги, платки, шарфы']],
      side: whenHTML(['Полноцветный рисунок или фото', 'Единичные изделия', 'Платки и шарфы в фирменных цветах'], ['Не подходит для тёмных тканей', 'Не подходит для хлопка'])
    }
  };
  var panel = $('[data-method-panel]');
  var showMethod = function (key) {
    var m = M[key];
    $$('[data-method]').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-method') === key); });
    $('[data-m-title]').textContent = m.title;
    $('[data-m-text]', panel).textContent = m.text;
    $('[data-m-facts]').innerHTML = m.facts.map(function (f) { return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('');
    $('[data-m-side]').innerHTML = m.side;
    panel.classList.add('is-swap'); void panel.offsetWidth; panel.classList.remove('is-swap');
    K.icons();
  };
  $('[data-methods]').addEventListener('click', function (e) {
    var b = e.target.closest('[data-method]'); if (b) showMethod(b.getAttribute('data-method'));
  });
  showMethod('emb');

  /* ---------- Примерка именной вышивки ---------- */
  var emb = $('[data-emb]'), fabric = $('[data-fabric]');
  var syncName = function () {
    $('[data-emb-role]').textContent = $('[data-nm-role]').value.trim() || ' ';
    $('[data-emb-name]').textContent = $('[data-nm-name]').value.trim() || ' ';
    emb.setAttribute('data-font', ($('[name="nmf"]:checked') || {}).value || 'script');
    emb.style.setProperty('--thread', ($('[name="nmt"]:checked') || {}).value || '#B22D39');
  };
  $('[data-namer]').addEventListener('input', syncName);
  $('[data-namer]').addEventListener('change', syncName);
  // На тёмной ткани чёрная нить пропадает — меняем её на белую, и наоборот
  var light = function (hex) { var n = parseInt(hex.slice(1), 16); return ((n >> 16) * .3 + ((n >> 8) & 255) * .59 + (n & 255) * .11) > 140; };
  $('[data-fabs]').addEventListener('click', function (e) {
    var b = e.target.closest('[data-fab]'); if (!b) return;
    var c = b.getAttribute('data-fab');
    $$('[data-fab]').forEach(function (x) { x.classList.toggle('is-on', x === b); });
    fabric.style.setProperty('--fab', c);
    fabric.classList.toggle('is-dark', !light(c));
    var t = $('[name="nmt"]:checked');
    if (t && !light(c) && t.value === '#1C1C1C') $('[name="nmt"][value="#FFFFFF"]').checked = true;
    if (t && light(c) && t.value === '#FFFFFF') $('[name="nmt"][value="#1C1C1C"]').checked = true;
    syncName();
  });
  syncName();

  /* ---------- Бриф ---------- */
  var form = $('[data-brief]');
  var setErr = function (name, msg) {
    if (name === 'consent') { $('[data-consent-err]', form).textContent = msg || ''; return; }
    var f = $('[data-f="' + name + '"]', form); if (!f) return;
    f.classList.toggle('has-err', !!msg);
    $('.err', f).textContent = msg || '';
  };
  form.addEventListener('input', function (e) { var f = e.target.closest('[data-f]'); if (f) setErr(f.getAttribute('data-f'), ''); });
  form.addEventListener('change', function (e) {
    var f = e.target.closest('[data-f]'); if (f) setErr(f.getAttribute('data-f'), '');
    if (e.target.name === 'files') showFiles(e.target.files);
  });
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

  var drop = $('[data-drop]', form);
  var showFiles = function (files) {
    var n = files ? files.length : 0;
    drop.classList.toggle('has-file', n > 0);
    $('[data-file-name]', form).innerHTML = n ? '<b>' + (n === 1 ? esc(files[0].name) : n + ' ' + K.plural(n, 'файл', 'файла', 'файлов')) + '</b> — нажмите, чтобы заменить' : '<b>Логотип, брендбук или фото текущей формы</b> — если есть';
  };
  ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.remove('is-over'); }); });
  drop.addEventListener('drop', function (e) {
    e.preventDefault();
    try { form.files.files = e.dataTransfer.files; } catch (err) { /* старый браузер */ }
    showFiles(e.dataTransfer.files);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var errs = [];
    var need = function (name, ok, msg) { if (!ok) { setErr(name, msg); errs.push(name); } else setErr(name, ''); };
    need('roles', $$('[name="roles"]:checked', form).length > 0, 'Отметьте хотя бы одну роль');
    need('company', form.company.value.trim().length > 1, 'Чтобы менеджер подготовился к звонку');
    need('fio', form.fio.value.trim().length > 1, 'Как к вам обращаться?');
    need('phone', form.phone.value.replace(/\D/g, '').length === 11, 'Нужен телефон, 10 цифр после +7');
    need('consent', form.consent.checked, 'Без согласия мы не можем принять бриф');
    if (errs.length) {
      var el = $('[data-f="' + errs[0] + '"]', form) || form.consent;
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      var inp = $('input', el) || el; if (inp.focus) inp.focus({ preventScroll: true });
      return;
    }
    var roles = $$('[name="roles"]:checked', form).map(function (i) { return i.value.toLowerCase(); });
    $('[data-brief-done-text]', form).textContent = form.fio.value.trim().split(' ')[0] + ', спасибо! Форма для ролей «' + roles.join(', ') + '», ' +
      ($('[name="size"]:checked', form) || {}).value + ' человек. Менеджер позвонит в рабочее время и пригласит в шоурум.';
    $('.brief__body', form).hidden = true;
    $('[data-brief-done]', form).hidden = false;
    K.icons();
    form.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });
  $('[data-brief-reset]', form).addEventListener('click', function () {
    form.reset(); showFiles(null);
    $('.brief__body', form).hidden = false;
    $('[data-brief-done]', form).hidden = true;
  });
})();
