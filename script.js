/* PAWSTAY — JavaScript biasa, tanpa framework */
(function () {
  var WA_NUMBER = '6282336528651';
  var PRICES = {
    Kucing: { Standar: 45000, Suite: 70000 },
    'Anjing kecil': { Standar: 60000, Suite: 90000 },
    'Anjing besar': { Standar: 85000, Suite: 120000 }
  };

  function waLink(text) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
  }

  function rupiah(n) {
    return 'Rp' + n.toLocaleString('id-ID');
  }

  function formatDate(value) {
    if (!value) return '-';
    var d = new Date(value + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function nights(a, b) {
    if (!a || !b) return 0;
    var diff = (new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000;
    return Math.round(diff);
  }

  function initTheme() {
    var root = document.documentElement;
    if (!root.getAttribute('data-theme')) {
      var saved = null;
      try { saved = localStorage.getItem('pawstay-theme'); } catch (e) {}
      var prefersDark = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));
    }
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('pawstay-theme', next); } catch (e) {}
    });
  }

  function initWhatsAppLinks() {
    var greeting = 'Halo PAWSTAY, saya ingin bertanya soal penitipan hewan.';
    document.querySelectorAll('.js-wa').forEach(function (a) {
      a.setAttribute('href', waLink(greeting));
    });
  }

  function initForm() {
    var form = document.getElementById('bookingForm');
    if (!form) return;
    var body = form.querySelector('.ps-form__body');
    var done = document.getElementById('formDone');
    var sizeField = document.getElementById('sizeField');
    var inEl = document.getElementById('f-in');
    var outEl = document.getElementById('f-out');
    var estimate = document.getElementById('estimate');
    var phoneEl = document.getElementById('f-phone');

    /* Nomor WhatsApp Indonesia: 08xx / +628xx / 628xx, total 10-13 digit */
    function normPhone(v) {
      var d = (v || '').replace(/[\s\-().]/g, '');
      if (!/^\+?\d+$/.test(d)) return null;
      d = d.replace(/^\+/, '');
      if (d.indexOf('62') === 0) d = '0' + d.slice(2);
      if (!/^08[1-9]\d{7,10}$/.test(d)) return null;
      if (/^(\d)\1+$/.test(d.slice(2))) return null;
      return '62' + d.slice(1);
    }
    function checkPhone(show) {
      var v = phoneEl.value.trim(), msg = '';
      if (!v) msg = 'Isi nomor WhatsApp Anda.';
      else if (!normPhone(v)) msg = 'Nomor tidak valid. Pakai nomor WhatsApp Indonesia, contoh 0812-3456-7890.';
      phoneEl.setCustomValidity(msg);
      var err = phoneEl.closest('.field').querySelector('.field__err');
      if (err) err.textContent = msg;
      if (show) setInvalid(phoneEl, !!msg);
      return !msg;
    }
    phoneEl.addEventListener('input', function () {
      var s = phoneEl.value.replace(/[^0-9+\-\s]/g, '');
      if (s !== phoneEl.value) phoneEl.value = s;
      checkPhone(phoneEl.closest('.field').classList.contains('is-invalid'));
    });
    phoneEl.addEventListener('blur', function () { if (phoneEl.value.trim()) checkPhone(true); });

    var today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    var todayStr = today.toISOString().slice(0, 10);
    inEl.min = todayStr;
    outEl.min = todayStr;

    function val(name) {
      var el = form.elements[name];
      if (!el) return '';
      if (el.length && !el.tagName) {
        for (var i = 0; i < el.length; i++) if (el[i].checked) return el[i].value;
        return '';
      }
      return (el.value || '').trim();
    }

    function priceKey() {
      if (val('pet') === 'Kucing') return 'Kucing';
      return val('size') === '10 kg ke atas' ? 'Anjing besar' : 'Anjing kecil';
    }

    function updateEstimate() {
      var n = nights(val('checkin'), val('checkout'));
      if (n < 1) {
        estimate.classList.remove('is-on');
        estimate.innerHTML = '';
        return;
      }
      var per = PRICES[priceKey()][val('room')];
      var total = per * n;
      var discount = n >= 7 ? Math.round(total * 0.1) : 0;
      estimate.innerHTML =
        '<span>Perkiraan ' + n + ' malam' +
        '<small>' + (discount ? 'Sudah termasuk diskon 10%' : rupiah(per) + ' × ' + n + ' malam') + '</small></span>' +
        '<strong>' + rupiah(total - discount) + '</strong>';
      estimate.classList.add('is-on');
      estimate.classList.remove('is-pop');
      void estimate.offsetWidth;
      estimate.classList.add('is-pop');
    }

    function togglePet() {
      sizeField.hidden = val('pet') !== 'Anjing';
      updateEstimate();
    }

    function setInvalid(input, bad) {
      var field = input.closest('.field');
      if (field) field.classList.toggle('is-invalid', bad);
      input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    }

    function validate() {
      var ok = true;
      checkPhone(false);
      ['f-owner', 'f-phone', 'f-petname', 'f-in'].forEach(function (id) {
        var el = document.getElementById(id);
        var bad = !el.checkValidity() || !el.value.trim();
        setInvalid(el, bad);
        if (bad) ok = false;
      });
      var outBad = !outEl.value || nights(inEl.value, outEl.value) < 1;
      setInvalid(outEl, outBad);
      if (outBad) ok = false;
      return ok;
    }

    form.addEventListener('change', function (e) {
      if (e.target.name === 'pet') togglePet();
      if (e.target === inEl && inEl.value) {
        outEl.min = inEl.value;
        if (outEl.value && nights(inEl.value, outEl.value) < 1) outEl.value = '';
      }
      updateEstimate();
    });

    form.addEventListener('input', function (e) {
      var field = e.target.closest && e.target.closest('.field');
      if (field && field.classList.contains('is-invalid') && e.target.checkValidity()) {
        setInvalid(e.target, false);
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        var first = form.querySelector('.is-invalid input');
        if (first) first.focus();
        return;
      }
      var n = nights(val('checkin'), val('checkout'));
      var pet = val('pet') === 'Anjing' ? 'Anjing (' + val('size') + ')' : 'Kucing';
      var lines = [
        'Halo PAWSTAY, saya ingin menitipkan hewan.',
        '',
        'Nama pemilik: ' + val('owner'),
        'No. WhatsApp: +' + normPhone(val('phone')),
        'Hewan: ' + pet + ' — ' + val('petname'),
        'Masuk: ' + formatDate(val('checkin')),
        'Keluar: ' + formatDate(val('checkout')) + ' (' + n + ' malam)',
        'Kamar: ' + val('room')
      ];
      if (val('note')) lines.push('Catatan: ' + val('note'));
      lines.push('', 'Mohon konfirmasi ketersediaan kamar. Terima kasih!');

      window.open(waLink(lines.join('\n')), '_blank', 'noopener');
      burst(form.querySelector('button[type="submit"]'));
      body.hidden = true;
      done.hidden = false;
    });

    document.getElementById('formReset').addEventListener('click', function () {
      form.reset();
      form.querySelectorAll('.is-invalid').forEach(function (f) { f.classList.remove('is-invalid'); });
      togglePet();
      done.hidden = true;
      body.hidden = false;
      document.getElementById('f-owner').focus();
    });

    togglePet();
  }

  function initYear() {
    var y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function burst(btn) {
    if (!btn || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var r = btn.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var cols = ['var(--teal)', 'var(--butter)', 'var(--coral)'];
    for (var i = 0; i < 14; i++) {
      var a = (Math.PI * 2 * i / 14) + Math.random() * 0.4, d = 70 + Math.random() * 80;
      var s = document.createElement('span');
      s.className = 'ps-burst';
      s.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;color:' + cols[i % 3] +
        ';--dx:' + Math.cos(a) * d + 'px;--dy:' + Math.sin(a) * d + 'px;--r:' + (Math.random() * 120 - 60) + 'deg';
      s.innerHTML = '<svg class="ico"><use href="#i-paw"/></svg>';
      document.getElementById('pawstay').appendChild(s);
      s.addEventListener('animationend', (function (n) { return function () { n.remove(); }; })(s));
    }
  }

  function countUp(el) {
    var m = el.textContent.trim().match(/^([\d.,]+)(.*)$/);
    if (!m) return;
    var dec = /[,.]\d/.test(m[1]) ? 1 : 0, target = parseFloat(m[1].replace(',', '.')), suf = m[2], t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 1100, 1), v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = v.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initMotion() {
    var root = document.getElementById('pawstay');
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
    var hasIO = 'IntersectionObserver' in window;

    /* Bar progres scroll + bayangan header */
    var header = document.querySelector('.ps-header');
    var bar = document.createElement('div');
    bar.className = 'ps-progress';
    header.appendChild(bar);
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
        bar.style.setProperty('--p', max > 0 ? (h.scrollTop / max).toFixed(4) : 0);
        header.classList.toggle('is-stuck', h.scrollTop > 8);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Menu aktif mengikuti bagian yang sedang dilihat */
    if (hasIO) {
      var links = {};
      document.querySelectorAll('.ps-nav a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
      var spy = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          Object.keys(links).forEach(function (k) { links[k].classList.toggle('is-active', k === e.target.id); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
    }

    if (reduce) return;

    /* Riak air pada tombol */
    root.addEventListener('pointerdown', function (e) {
      var b = e.target.closest && e.target.closest('.btn');
      if (!b) return;
      var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
      var s = document.createElement('span');
      s.className = 'ps-ripple';
      s.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px';
      b.appendChild(s);
      s.addEventListener('animationend', function () { s.remove(); });
    });

    /* Miring 3D mengikuti kursor (tombol + kartu) */
    if (fine) {
      document.querySelectorAll('.ps-fac__list li, .ps-price__promo, .ps-price__addons').forEach(function (el) { el.setAttribute('data-tilt', '6'); });
      var hm = document.querySelector('.ps-hero__media');
      if (hm) hm.setAttribute('data-tilt', '7');
      var sel = '.btn, [data-tilt]', cur = null;
      var resetEl = function (el) {
        if (!el) return;
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
        el.classList.remove('is-tilting');
      };
      root.addEventListener('pointermove', function (e) {
        var el = e.target.closest ? e.target.closest(sel) : null;
        if (el !== cur) { resetEl(cur); cur = el; if (el) el.classList.add('is-tilting'); }
        if (!el) return;
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        var max = parseFloat(el.getAttribute('data-tilt')) || 10;
        el.style.setProperty('--ry', ((x - 0.5) * 2 * max).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - y) * 2 * max).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      root.addEventListener('pointerleave', function () { resetEl(cur); cur = null; });
    }

    /* Jejak kaki melayang di beranda */
    var hero = document.querySelector('.ps-hero');
    if (hero) {
      [[6, 12, 38, 9], [44, 3, 26, 7], [88, 9, 44, 11], [3, 62, 30, 8], [94, 56, 34, 10], [50, 90, 28, 9], [72, 84, 40, 12]].forEach(function (c, i) {
        var s = document.createElement('span');
        s.className = 'ps-float';
        s.setAttribute('aria-hidden', 'true');
        s.style.cssText = 'left:' + c[0] + '%;top:' + c[1] + '%;--s:' + c[2] + 'px;--t:' + c[3] + 's;--k:' + ((i % 3) + 1) * 8 + ';animation-delay:-' + (i * 1.3) + 's';
        s.innerHTML = '<svg><use href="#i-paw"/></svg>';
        hero.appendChild(s);
      });
      if (fine) hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        hero.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
    }

    if (!hasIO) return;

    /* Muncul bertahap saat di-scroll */
    var rvIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        rvIO.unobserve(el);
        setTimeout(function () { el.classList.add('is-in'); }, el._d || 0);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.ps-head, .ps-about__text > *, .ps-rate, .ps-team li, .ps-fac__intro > *, .ps-fac__list li, .ps-price__table, .ps-price__legend, .ps-price__promo, .ps-price__addons, .ps-steps li, .ps-contact li, .ps-book__side > h2, .ps-book__side > .lead, .ps-form, .ps-faq details, .ps-footer__grid > div').forEach(function (el) {
      var p = el.parentElement;
      p._rvc = (p._rvc || 0) + 1;
      el._d = Math.min((p._rvc - 1) * 90, 450);
      el.classList.add('rv');
      rvIO.observe(el);
    });

    /* Angka berhitung naik */
    var numIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        numIO.unobserve(e.target);
        setTimeout(function () { countUp(e.target); }, 500);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('.ps-hero__badge-num, .ps-price__promo-num, .ps-about__num').forEach(function (el) { numIO.observe(el); });
  }

  function initMenu() {
    var btn = document.getElementById('menuToggle'), nav = document.getElementById('psNav');
    if (!btn || !nav) return;
    function set(open) {
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); set(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { set(false); btn.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 960) set(false); });
  }

  function initRating() {
    var box = document.getElementById('rating');
    if (!box) return;
    var labels = [].slice.call(box.querySelectorAll('.ps-rate__stars label'));
    var stars = box.querySelector('.ps-rate__stars');
    var text = document.getElementById('rateText');
    var send = document.getElementById('rateSend');
    var reset = document.getElementById('rateReset');
    var names = ['', 'Kurang puas', 'Cukup', 'Baik', 'Sangat baik', 'Luar biasa'];
    function current() { var c = box.querySelector('input:checked'); return c ? +c.value : 0; }
    function paint(n) { labels.forEach(function (l, i) { l.classList.toggle('is-on', i < n); }); }
    function show() {
      var n = current();
      paint(n);
      text.textContent = n ? 'Anda memberi ' + n + ' dari 5 bintang: ' + names[n] + '.' : 'Pilih bintang untuk menilai.';
      send.hidden = reset.hidden = !n;
      if (n) send.href = waLink('Halo PAWSTAY, saya memberi penilaian ' + n + ' dari 5 bintang (' + names[n] + ').');
    }
    labels.forEach(function (l, i) {
      l.addEventListener('mouseenter', function () { paint(i + 1); text.textContent = names[i + 1]; });
    });
    stars.addEventListener('mouseleave', show);
    box.addEventListener('change', function () {
      try { localStorage.setItem('pawstay-rating', String(current())); } catch (e) {}
      show();
    });
    reset.addEventListener('click', function () {
      var c = box.querySelector('input:checked');
      if (c) c.checked = false;
      try { localStorage.removeItem('pawstay-rating'); } catch (e) {}
      show();
      labels[0].querySelector('input').focus();
    });
    try {
      var saved = +localStorage.getItem('pawstay-rating');
      if (saved >= 1 && saved <= 5) labels[saved - 1].querySelector('input').checked = true;
    } catch (e) {}
    show();
  }

  function init() {
    var root = document.getElementById('pawstay');
    if (!root || root.dataset.ready) return;
    root.dataset.ready = '1';
    initTheme();
    initWhatsAppLinks();
    initForm();
    initYear();
    initRating();
    initMenu();
    initMotion();
  }

  window.PawstayInit = init;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();