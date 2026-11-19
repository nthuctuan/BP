/* Legent AI — ukázková konzole agentů (ilustrativní scénáře, žádná reálná data). */
(function () {
  'use strict';
  var box = document.querySelector('[data-console]');
  if (!box) return;
  var SCEN = [
    { id: 'faktury', title: 'legent-agent · přijaté faktury', foot: 'Ušetřeno dnes: 3 h 10 min', lines: [
      ['run', 'Čtu schránku faktury@… — <b>38 nových dokladů</b>'],
      ['ok', '<b>Vytěženo 38/38:</b> dodavatel, IČO, částka, DPH, splatnost'],
      ['run', 'Páruji s objednávkami a bankovními pohyby…'],
      ['warn', '<b>2 nesoulady v částce</b> → odesláno ke schválení'],
      ['ok', '<b>36 dokladů</b> připraveno k zaúčtování v účetním systému'] ] },
    { id: 'poptavky', title: 'legent-agent · poptávky z webu', foot: 'Odezva: 3 min místo 1 dne', lines: [
      ['run', 'Nová poptávka: <b>výměna kotle, Brno</b>'],
      ['ok', '<b>Kvalifikováno:</b> rodinný dům, termín do 14 dní, rozpočet odpovídá'],
      ['run', 'Kontroluji volné termíny techniků…'],
      ['ok', '<b>Odeslána odpověď</b> se 2 termíny a orientační cenou'],
      ['ok', 'Zapsáno do CRM + úkol pro obchodníka'] ] },
    { id: 'reporting', title: 'legent-agent · týdenní report', foot: 'Každé pondělí v 7:00, bez Excelu', lines: [
      ['run', 'Stahuji data: účetnictví, e-shop, docházka…'],
      ['ok', '<b>KPI týdne:</b> tržby +6 %, hrubá marže 31 %'],
      ['warn', '<b>Pohledávky po splatnosti +18 %</b> → seznam dlužníků'],
      ['ok', 'Shrnutí odesláno majiteli a vedoucím'] ] }
  ];
  var ICON = { run: '▸', ok: '✓', warn: '!' };
  var body = box.querySelector('[data-console-body]');
  var title = box.querySelector('[data-console-title]');
  var foot = box.querySelector('[data-console-foot]');
  var tabs = box.querySelectorAll('[data-scenario]');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = 0, timers = [], paused = false, visible = true;

  function clear() { timers.forEach(clearTimeout); timers = []; }
  function show(i, animate) {
    clear();
    cur = i;
    var s = SCEN[i];
    title.textContent = s.title;
    foot.textContent = s.foot;
    tabs.forEach(function (t, k) { t.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    body.innerHTML = '';
    s.lines.forEach(function (l, k) {
      var row = document.createElement('div');
      row.className = 'console-line ' + l[0] + (animate ? ' pending' : '');
      row.innerHTML = '<span class="ic" aria-hidden="true">' + ICON[l[0]] + '</span><span>' + l[1] + '</span>';
      body.appendChild(row);
      if (animate) timers.push(setTimeout(function () { row.classList.remove('pending'); }, 500 + k * 750));
    });
    var caret = document.createElement('div');
    caret.className = 'console-line';
    caret.innerHTML = '<span class="ic" aria-hidden="true"></span><span><span class="caret" aria-hidden="true"></span></span>';
    body.appendChild(caret);
    if (animate) timers.push(setTimeout(next, 500 + s.lines.length * 750 + 3800));
  }
  function next() { if (paused || !visible) { timers.push(setTimeout(next, 1200)); return; } show((cur + 1) % SCEN.length, true); }

  tabs.forEach(function (t, k) { t.addEventListener('click', function () { show(k, !reduce); }); });
  box.addEventListener('mouseenter', function () { paused = true; });
  box.addEventListener('mouseleave', function () { paused = false; });
  box.addEventListener('focusin', function () { paused = true; });
  box.addEventListener('focusout', function () { paused = false; });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(box);
  }
  show(0, !reduce);
})();
