/* Legacy Enterprises — sdílené chování webu (bez závislostí) */
(function () {
  'use strict';
  var doc = document.documentElement;
  var CFG = window.SITE_CONFIG || { email: 'contact@legacyenterprises.cz', forms: { provider: 'mailto' } };
  var STORE = 'le-theme';

  /* ---------- Téma (počáteční stav nastavuje inline skript v <head>) ---------- */
  function storedTheme() { try { return localStorage.getItem(STORE); } catch (e) { return null; } }
  function setTheme(t, persist) {
    doc.setAttribute('data-theme', t);
    if (persist) { try { localStorage.setItem(STORE, t); } catch (e) { /* privátní režim */ } }
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', t === 'dark' ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim');
      b.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
    });
  }
  setTheme(doc.getAttribute('data-theme') || 'light', false);
  document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      setTheme(doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    });
  });
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (e) { if (!storedTheme()) setTheme(e.matches ? 'dark' : 'light', false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
  }

  /* ---------- Navigace: stín po scrollu + mobilní menu ---------- */
  var nav = document.querySelector('nav.topnav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 12); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  var menuBtn = document.querySelector('.menu-btn');
  var menu = document.getElementById('mobile-menu');
  if (menuBtn && menu) {
    var setMenu = function (open) {
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
      menu.hidden = !open;
    };
    menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1140 && !menu.hidden) setMenu(false); });
  }

  /* ---------- Reveal animace ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Kopírování odkazu na výpočet ---------- */
  document.querySelectorAll('[data-copy-link]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var st = btn.parentNode.querySelector('[data-copy-status]');
      var done = function (ok) { if (st) st.textContent = ok ? 'Odkaz zkopírován do schránky.' : 'Zkopírujte adresu z řádku prohlížeče.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(function () { done(true); }, function () { done(false); });
      else done(false);
    });
  });

  /* ---------- Rok v patičce ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Formuláře ---------- */
  var MSG = {
    valueMissing: 'Toto pole je povinné.',
    typeMismatch: 'Zadejte platnou e-mailovou adresu.',
    patternMismatch: 'Zkontrolujte formát.',
    tooShort: 'Text je příliš krátký.',
    consent: 'Bez souhlasu se zpracováním vám nemůžeme odpovědět.'
  };

  function fieldError(el) {
    if (el.validity.valid) return '';
    if (el.type === 'checkbox') return MSG.consent;
    if (el.validity.valueMissing) return MSG.valueMissing;
    if (el.validity.typeMismatch) return MSG.typeMismatch;
    if (el.validity.tooShort) return MSG.tooShort;
    if (el.validity.patternMismatch) return el.getAttribute('data-pattern-msg') || MSG.patternMismatch;
    return el.validationMessage;
  }

  function showError(el, msg) {
    var id = el.id ? el.id + '-err' : null;
    var box = id && document.getElementById(id);
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (box) box.textContent = msg;
  }

  function collect(form) {
    var data = {};
    new FormData(form).forEach(function (v, k) {
      if (k === '_gotcha') return;
      data[k] = data[k] ? data[k] + ', ' + v : v;
    });
    return data;
  }

  function mailtoBody(data) {
    return Object.keys(data).filter(function (k) { return k.charAt(0) !== '_' && data[k]; })
      .map(function (k) { return (labelFor(k) || k) + ': ' + data[k]; }).join('\n');
  }
  var LABELS = {
    name: 'Jméno', email: 'E-mail', phone: 'Telefon', company: 'Firma', role: 'Jsem', revenue: 'Obrat',
    horizon: 'Horizont', message: 'Zpráva', topic: 'Téma', budget: 'Rozpočet', industry: 'Obor',
    result: 'Výsledek', consent: 'Souhlas', interest: 'Zájem'
  };
  function labelFor(k) { return LABELS[k]; }

  function setStatus(form, type, html) {
    var st = form.querySelector('.form-status') || form.parentNode.querySelector('.form-status');
    if (!st) return;
    st.className = 'form-status ' + type;
    st.innerHTML = html;
    st.setAttribute('tabindex', '-1');
    st.focus({ preventScroll: false });
  }

  function submitForm(form, data) {
    var provider = (CFG.forms && CFG.forms.provider) || 'mailto';
    var subject = form.getAttribute('data-subject') || 'Zpráva z webu';
    if (provider === 'netlify') {
      var body = new URLSearchParams(Object.assign({ 'form-name': form.getAttribute('name') || 'contact' }, data));
      return fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return 'sent'; });
    }
    if (provider === 'json' && CFG.forms.endpoint) {
      var payload = Object.assign({ _subject: subject, subject: subject }, CFG.forms.extra || {}, data);
      return fetch(CFG.forms.endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { if (!r.ok) throw new Error(r.status); return 'sent'; });
    }
    // Fallback: e-mailový klient s předvyplněnou zprávou
    var href = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(mailtoBody(data));
    window.location.href = href;
    return Promise.resolve('mailto');
  }

  /* Předvyplnění tématu z URL (?topic=…) */
  var TOPICS = { univerze: 'Univerze', viets: 'Viets', studio: 'Venture Studio', legent: 'Legent AI', buy: 'Koupě firmy', sell: 'Prodej firmy', exit: 'Příprava firmy na prodej', family: 'Nástupnictví v rodině',
    servis: 'Servis a instalace', ucetni: 'Účetní kancelář', gastro: 'Gastronomie', autoservis: 'Autoservis', eshop: 'E-commerce', vyroba: 'Výroba', audit: 'AI Readiness Assessment', sprint: 'Implementation Sprint' };
  try {
    var qp = new URLSearchParams(location.search).get('topic');
    var topicSel = document.querySelector('select[name="topic"]');
    if (qp && topicSel && TOPICS[qp]) topicSel.value = TOPICS[qp];
  } catch (e) { /* starý prohlížeč */ }

  document.querySelectorAll('form[data-form]').forEach(function (form) {
    form.setAttribute('novalidate', '');
    var fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(function (el) {
      if (el.type === 'hidden' || el.classList.contains('hp-input')) return;
      el.addEventListener('blur', function () { if (el.value || el.getAttribute('aria-invalid') === 'true') showError(el, fieldError(el)); });
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') showError(el, fieldError(el)); });
      el.addEventListener('change', function () { if (el.getAttribute('aria-invalid') === 'true') showError(el, fieldError(el)); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (el) {
        if (el.type === 'hidden' || el.classList.contains('hp-input') || !el.willValidate) return;
        var msg = fieldError(el);
        showError(el, msg);
        if (msg && !firstBad) firstBad = el;
      });
      if (firstBad) {
        setStatus(form, 'error', 'Prosím zkontrolujte zvýrazněná pole.');
        firstBad.focus();
        return;
      }
      var hp = form.querySelector('.hp-input');
      var okMsg = form.getAttribute('data-ok') || 'Děkujeme, zpráva odešla. Ozveme se do 48 hodin.';
      if (hp && hp.value) { form.reset(); setStatus(form, 'ok', okMsg); return; } // bot
      var data = collect(form);
      data._page = location.pathname;
      var btn = form.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;
      submitForm(form, data).then(function (how) {
        if (how === 'mailto') {
          setStatus(form, 'info', 'Otevřeli jsme váš e-mailový program s předvyplněnou zprávou — stačí ji odeslat. ' +
            'Pokud se neotevřel, napište nám přímo na <a href="mailto:' + CFG.email + '">' + CFG.email + '</a>.');
        } else {
          form.reset();
          setStatus(form, 'ok', okMsg);
        }
        form.dispatchEvent(new CustomEvent('form:sent', { detail: { how: how, data: data } }));
        if (window.plausible) window.plausible('Form: ' + form.getAttribute('data-form'));
      }).catch(function () {
        setStatus(form, 'error', 'Odeslání se nepodařilo. Zkuste to prosím znovu nebo napište na <a href="mailto:' + CFG.email + '">' + CFG.email + '</a>.');
      }).then(function () { if (btn) btn.disabled = false; });
    });
  });

  /* ---------- Volitelná analytika bez cookies ---------- */
  var A = CFG.analytics;
  if (A && A.provider) {
    var s = document.createElement('script');
    s.defer = true;
    if (A.provider === 'plausible') { s.src = A.src || 'https://plausible.io/js/script.js'; s.setAttribute('data-domain', A.domain); }
    if (A.provider === 'umami') { s.src = A.src; s.setAttribute('data-website-id', A.websiteId); }
    if (s.src) document.head.appendChild(s);
  }
})();
