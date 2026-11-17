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
        'No. WhatsApp: ' + val('phone'),
        'Hewan: ' + pet + ' — ' + val('petname'),
        'Masuk: ' + formatDate(val('checkin')),
        'Keluar: ' + formatDate(val('checkout')) + ' (' + n + ' malam)',
        'Kamar: ' + val('room')
      ];
      if (val('note')) lines.push('Catatan: ' + val('note'));
      lines.push('', 'Mohon konfirmasi ketersediaan kamar. Terima kasih!');

      window.open(waLink(lines.join('\n')), '_blank', 'noopener');
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

  function init() {
    var root = document.getElementById('pawstay');
    if (!root || root.dataset.ready) return;
    root.dataset.ready = '1';
    initTheme();
    initWhatsAppLinks();
    initForm();
    initYear();
  }

  window.PawstayInit = init;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
