/* KORRTO 2026 — текстовые страницы: поиск по вопросам, покупка сертификата, фильтр отзывов, отклик на вакансию. */
(function () {
  'use strict';
  var K = window.KORRTO, fmt = K.fmt, plural = K.plural, esc = K.esc;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Вопрос-ответ: поиск по вопросам и ответам ---------- */
  var find = $('[data-faq-find]');
  if (find) {
    var items = $$('.qa');
    items.forEach(function (d) { d._text = d.textContent.toLowerCase().replace(/ё/g, 'е'); });
    var none = $('[data-faq-none]');
    find.addEventListener('input', function () {
      var q = find.value.trim().toLowerCase().replace(/ё/g, 'е'), hits = 0;
      items.forEach(function (d) {
        var ok = !q || d._text.indexOf(q) > -1;
        d.hidden = !ok; if (ok) hits++;
        d.open = !!q && ok;
      });
      $$('.ip-sec[data-faq-group]').forEach(function (s) { s.hidden = !$$('.qa:not([hidden])', s).length; });
      none.hidden = hits > 0;
    });
    if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t && t.tagName === 'DETAILS') t.open = true; }
  }

  /* ---------- Подарочный сертификат ---------- */
  var gc = $('[data-gc]');
  if (gc) {
    var nominal = function () { return +($('[name="nom"]:checked', gc) || {}).value || 0; };
    var qtyEl = $('[data-gc-qty]', gc);
    var qty = function () { return Math.max(1, Math.min(20, parseInt(qtyEl.value, 10) || 1)); };
    var sync = function () {
      var n = nominal(), q = qty();
      qtyEl.value = q;
      $('[data-gc-total]', gc).textContent = fmt(n * q) + ' ₽';
      $('[data-gc-dec]', gc).disabled = q <= 1;
      $('[data-gc-inc]', gc).disabled = q >= 20;
    };
    gc.addEventListener('change', sync);
    qtyEl.addEventListener('input', sync);
    $('[data-gc-dec]', gc).addEventListener('click', function () { qtyEl.value = qty() - 1; sync(); });
    $('[data-gc-inc]', gc).addEventListener('click', function () { qtyEl.value = qty() + 1; sync(); });
    gc.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = nominal(), q = qty(), img = $('.gc__media img');
      var name = 'Подарочный сертификат на ' + fmt(n) + ' ₽';
      K.addToCart(img, q, $('[data-gc-add]', gc), name + (q > 1 ? ' × ' + q : ''), {
        art: 'СЕРТ-' + n, name: name, kind: 'cert', color: '', hex: '#141414', size: '', price: n,
        img: 'assets/img/promo-cert.jpg', href: 'certificates.html', max: 20
      });
    });
    sync();
  }

  /* ---------- Отзывы: компании / покупатели ---------- */
  var rv = $('[data-rv-chips]');
  if (rv) {
    rv.addEventListener('click', function (e) {
      var b = e.target.closest('[data-rv]'); if (!b) return;
      var k = b.getAttribute('data-rv');
      $$('[data-rv]', rv).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      $$('.rv').forEach(function (r) { r.hidden = k !== 'all' && r.getAttribute('data-kind') !== k; });
    });
  }

  /* ---------- Карьера: отклик ---------- */
  var job = $('[data-job]');
  if (job) {
    $$('[data-apply]').forEach(function (b) {
      b.addEventListener('click', function () {
        job.vac.value = b.getAttribute('data-apply');
        document.getElementById('apply').scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(function () { job.fio.focus({ preventScroll: true }); }, 500);
      });
    });
    var drop = $('[data-drop]', job), file = $('[name="cv"]', job);
    var showFile = function () {
      var f = file.files[0];
      drop.classList.toggle('has-file', !!f);
      $('[data-file-name]', job).innerHTML = f ? '<b>' + esc(f.name) + '</b> · ' + Math.max(1, Math.round(f.size / 1024)) + ' КБ — нажмите, чтобы заменить'
        : '<b>Прикрепите резюме</b> — PDF, DOC или фото, необязательно';
    };
    file.addEventListener('change', showFile);
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
    drop.addEventListener('drop', function (e) { if (e.dataTransfer.files.length) { file.files = e.dataTransfer.files; showFile(); } });

    var setErr = function (name, msg) {
      if (name === 'consent') { $('[data-consent-err]', job).textContent = msg || ''; return; }
      var f = $('[data-f="' + name + '"]', job);
      f.classList.toggle('has-err', !!msg); $('.err', f).textContent = msg || '';
    };
    job.addEventListener('input', function (e) { var f = e.target.closest('[data-f]'); if (f) setErr(f.getAttribute('data-f'), ''); if (e.target.name === 'consent') setErr('consent', ''); });
    job.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      if (job.fio.value.trim().length < 2) { setErr('fio', 'Как к вам обращаться?'); ok = false; }
      if (job.phone.value.replace(/\D/g, '').length < 10) { setErr('phone', 'Телефон, чтобы перезвонить'); ok = false; }
      if (!job.consent.checked) { setErr('consent', 'Без согласия мы не можем принять отклик'); ok = false; }
      if (!ok) return;
      $('[data-job-vac]', job).textContent = job.vac.value === 'Другое' ? 'Посмотрим, где вы будете полезны, и перезвоним.' : 'Вакансия «' + job.vac.value + '». Перезвоним в рабочее время.';
      $('.brief__body', job).hidden = true; $('[data-job-done]', job).hidden = false; K.icons();
    });
    $('[data-job-reset]', job).addEventListener('click', function () {
      job.reset(); showFile(); $('.brief__body', job).hidden = false; $('[data-job-done]', job).hidden = true;
    });
  }
  K.icons();
})();
