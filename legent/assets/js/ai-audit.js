/* Legent AI — AI readiness audit: obor + 10 otázek v 5 oblastech, vyhodnocení jen v prohlížeči. */
(function () {
  'use strict';
  var root = document.querySelector('[data-quiz]');
  if (!root) return;

  var DIMS = {
    data: { name: 'Data a systémy', module: 'AI Readiness Assessment', rec: 'Začněte tím, že hlavní data (zakázky, faktury, zákazníci) budou v digitální podobě na jednom či dvou místech. Agenti potřebují data, ke kterým se dostanou.' },
    proc: { name: 'Procesy a pravidla', module: 'AI Readiness Assessment', rec: 'Sepište 2–3 nejčastější opakované úkoly krok za krokem. Co má jasná pravidla, umí agent převzít nejrychleji.' },
    team: { name: 'Tým a kompetence', module: 'AI Enablement', rec: 'Určete jednoho „AI championa“ a dejte týmu bezpečný prostor AI vyzkoušet. Krátký workshop zrychlí přijetí víc než nový software.' },
    sec: { name: 'Bezpečnost a GDPR', module: 'AI Readiness Assessment', rec: 'Zaveďte správce hesel a dvoufázové ověření a sepište jednoduchá pravidla, jaká data se smí do AI nástrojů vkládat.' },
    strat: { name: 'Cíle a rozpočet', module: 'Konzultace zdarma', rec: 'Vyberte jeden konkrétní problém s měřitelným dopadem (např. doba odpovědi na poptávku) a vyčleňte na něj malý pilotní rozpočet.' }
  };

  var Q = [
    { d: 'data', t: 'Kde máte hlavní firemní data?', o: ['Hlavně na papíře a v hlavách lidí', 'V Excelu a v e-mailech', 'V několika systémech (účetnictví, CRM, e-shop)', 'V propojených systémech s exporty nebo API'] },
    { d: 'data', t: 'Jak rychle dáte dohromady přehled tržeb, zakázek a nákladů za minulý týden?', o: ['Trvá to dny, nebo to vůbec nejde', 'Někdo to ručně poskládá', 'Máme reporty, ale aktualizujeme je ručně', 'Automaticky, máme dashboard'] },
    { d: 'proc', t: 'Jsou vaše hlavní procesy popsané (kdo, co, kdy, v jakém nástroji)?', o: ['Ne', 'Částečně a neaktuálně', 'Hlavní procesy ano', 'Ano a tým se jimi řídí'] },
    { d: 'proc', t: 'Řídí se opakované úkoly jasnými pravidly?', o: ['Každý případ je jiný', 'Spíše ne', 'Většinou ano', 'Ano, máme šablony a pravidla'] },
    { d: 'team', t: 'Používá váš tým už nějaké AI nástroje (ChatGPT, Copilot, Gemini…)?', o: ['Ne a není zájem', 'Ne, ale zájem je', 'Někteří ano, spíš neoficiálně', 'Ano, běžně a podle pravidel'] },
    { d: 'team', t: 'Kdo by měl zavádění AI ve firmě na starosti?', o: ['Nikdo nemá kapacitu', 'Majitel, až bude čas', 'Konkrétní člověk částečně', 'Máme jasně určeného člověka'] },
    { d: 'sec', t: 'Máte pravidla pro práci s osobními a citlivými daty?', o: ['Ne', 'Jen formálně na papíře', 'Ano, základní', 'Ano, aktuální a tým je zná'] },
    { d: 'sec', t: 'Jak řešíte přístupy a hesla k firemním systémům?', o: ['Sdílená hesla', 'Každý své, bez přehledu', 'Správce hesel u části týmu', 'Správce hesel a dvoufázové ověření všude'] },
    { d: 'strat', t: 'Víte, co by vám AI měla přinést?', o: ['Ne, jen cítíme, že bychom měli', 'Obecně ušetřit čas', 'Máme 1–2 konkrétní problémy', 'Máme cíle a víme, jak je změřit'] },
    { d: 'strat', t: 'Jaký rozpočet si umíte představit na první AI projekt?', o: ['Zatím žádný', 'Do 20 tis. Kč', '20–100 tis. Kč', 'Více než 100 tis. Kč'] }
  ];

  var HORIZON = { t: 'V jakém oboru podnikáte?', o: ['Servis a instalace', 'Účetní kancelář', 'Gastronomie', 'Autoservis', 'E-commerce', 'Výroba', 'Jiný obor'] };
  var USE = [
    ['Agent pro poptávky s odpovědí do pár minut', 'Plánování výjezdů techniků', 'Servisní protokoly z diktátu'],
    ['Vytěžování dokladů z e-mailu', 'Párování plateb s doklady', 'Automatické upomínky klientům'],
    ['Sjednocení rezervací z více kanálů', 'Návrh nákupu surovin podle prodejů', 'Odpovědi na recenze ke schválení'],
    ['Online objednávky do dílny', 'Informace o stavu zakázky', 'Připomínky STK a servisu'],
    ['Zákaznická podpora k objednávkám', 'Vratky a reklamace', 'Popisky produktů a překlady'],
    ['Kalkulace z poptávek', 'Znalostní asistent nad dokumentací', 'Výrobní reporting'],
    ['Třídění a odpovědi na e-maily', 'Vytěžování dokladů', 'Týdenní report pro vedení']
  ];

  var state = { step: -1, answers: [], horizon: null };
  var panel = root.querySelector('[data-quiz-panel]');
  var resultBox = root.querySelector('[data-quiz-result]');
  var intro = root.querySelector('[data-quiz-intro]');

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }

  function total() { return Q.length + 1; }

  function render() {
    var isHorizon = state.step === 0;
    var q = isHorizon ? HORIZON : Q[state.step - 1];
    var chosen = isHorizon ? state.horizon : state.answers[state.step - 1];
    var n = state.step + 1;
    panel.innerHTML = '';
    var meta = el('div', { 'class': 'q-meta' }, '<span>Otázka ' + n + ' / ' + total() + '</span><span>' + (isHorizon ? 'Váš obor' : DIMS[q.d].name) + '</span>');
    var prog = el('div', { 'class': 'q-progress', 'role': 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(total()), 'aria-valuenow': String(state.step), 'aria-label': 'Průběh testu' }, '<span></span>');
    var fs = el('fieldset', { 'class': 'q-options' });
    var lg = el('legend', { 'class': 'q-title', 'tabindex': '-1' }, q.t);
    fs.appendChild(lg);
    q.o.forEach(function (txt, i) {
      var id = 'q' + state.step + '-' + i;
      var lab = el('label', { 'class': 'q-opt', 'for': id });
      var inp = el('input', { type: 'radio', name: 'q' + state.step, id: id, value: String(i) });
      if (chosen === i) inp.checked = true;
      lab.appendChild(inp);
      lab.appendChild(el('span', {}, txt));
      fs.appendChild(lab);
    });
    var err = el('p', { 'class': 'field err', 'aria-live': 'polite' }, '');
    var nav = el('div', { 'class': 'q-nav' });
    var back = el('button', { type: 'button', 'class': 'btn btn-ghost' }, '← Zpět');
    back.disabled = state.step === 0;
    var next = el('button', { type: 'button', 'class': 'btn btn-primary', 'data-quiz-next': '' }, (state.step === Q.length ? 'Zobrazit výsledek' : 'Další') + ' <span class="arrow">→</span>');
    nav.appendChild(back); nav.appendChild(next);
    panel.appendChild(meta); panel.appendChild(prog); panel.appendChild(fs); panel.appendChild(err); panel.appendChild(nav);
    requestAnimationFrame(function () { prog.firstChild.style.width = (state.step / total() * 100) + '%'; });

    fs.addEventListener('change', function (e) {
      var v = Number(e.target.value);
      if (isHorizon) state.horizon = v; else state.answers[state.step - 1] = v;
      err.textContent = '';
    });
    back.addEventListener('click', function () { state.step--; render(); focusTitle(); });
    next.addEventListener('click', function () {
      var val = isHorizon ? state.horizon : state.answers[state.step - 1];
      if (val == null) { err.textContent = 'Vyberte prosím jednu z možností.'; return; }
      if (state.step === Q.length) { showResult(); return; }
      state.step++; render(); focusTitle();
    });
  }

  function focusTitle() {
    var t = panel.querySelector('.q-title');
    if (t) t.focus({ preventScroll: true });
    var top = panel.getBoundingClientRect().top;
    if (top < 90 || top > window.innerHeight * 0.6) window.scrollTo({ top: window.scrollY + top - 96, behavior: 'smooth' });
  }

  function compute() {
    var dims = {};
    Object.keys(DIMS).forEach(function (k) { dims[k] = { sum: 0, max: 0 }; });
    var sum = 0;
    Q.forEach(function (q, i) { var a = state.answers[i] || 0; sum += a; dims[q.d].sum += a; dims[q.d].max += 3; });
    var score = Math.round(sum / (Q.length * 3) * 100);
    var list = Object.keys(DIMS).map(function (k) { return { key: k, pct: Math.round(dims[k].sum / dims[k].max * 100) }; });
    return { score: score, dims: list };
  }

  function verdict(s) {
    if (s >= 85) return { t: 'Pokročilí — škálujte', d: 'Máte data, procesy i lidi. Dává smysl nasadit více agentů najednou a měřit dopad na marži.', months: 'Implementation Sprint + Retainer' };
    if (s >= 65) return { t: 'Připraveni na první agenty', d: 'Základy jsou silné. První agenti mohou běžet do měsíce — začněte úkolem s nejvíce hodinami.', months: 'Implementation Sprint' };
    if (s >= 40) return { t: 'Průzkumníci', d: 'Potenciál je velký, ale některé základy chybí. Assessment ukáže, co jde automatizovat hned a co připravit.', months: 'AI Readiness Assessment' };
    return { t: 'Na začátku — a to je v pořádku', d: 'Největší přínos teď přinese pořádek v datech a jednoduchá pravidla. AI pak přidáte rychleji a levněji.', months: 'AI Enablement + Assessment' };
  }

  function showResult() {
    var r = compute();
    var v = verdict(r.score);
    var sorted = r.dims.slice().sort(function (a, b) { return a.pct - b.pct; });
    var weak = sorted.slice(0, 3);
    var horizonTxt = HORIZON.o[state.horizon] || '';
    var urgent = false;

    resultBox.querySelector('[data-score]').textContent = r.score;
    var ring = resultBox.querySelector('.score-ring .fg');
    var C = 2 * Math.PI * 72;
    ring.setAttribute('stroke-dasharray', C.toFixed(1));
    ring.setAttribute('stroke-dashoffset', C.toFixed(1));
    resultBox.querySelector('[data-verdict]').textContent = v.t;
    resultBox.querySelector('[data-verdict-desc]').textContent = v.d;
    resultBox.querySelector('[data-months]').textContent = v.months;
    resultBox.querySelector('[data-horizon]').textContent = horizonTxt;

    var dimsBox = resultBox.querySelector('[data-dims]');
    dimsBox.innerHTML = '';
    r.dims.forEach(function (d) {
      var cls = d.pct < 40 ? 'low' : (d.pct < 70 ? 'mid' : 'high');
      var row = el('div', { 'class': 'dim ' + cls }, '<div class="dh"><span>' + DIMS[d.key].name + '</span><span>' + d.pct + ' %</span></div><div class="bar"><span></span></div>');
      dimsBox.appendChild(row);
      requestAnimationFrame(function () { row.querySelector('.bar span').style.width = Math.max(d.pct, 3) + '%'; });
    });

    var recs = resultBox.querySelector('[data-recs]');
    recs.innerHTML = '';
    if (urgent) recs.appendChild(el('li', {}, '<span><strong>Časový tlak:</strong> chcete prodávat do 12 měsíců, ale připravenost je zatím nižší. Zvažte, zda prodej o 12–18 měsíců neodložit — nebo se zaměřte jen na kroky s nejvyšším dopadem na cenu.</span>'));
    (USE[state.horizon] || USE[6]).forEach(function (u, k) {
      if (k < 2) recs.appendChild(el('li', {}, '<span><strong>Doporučená automatizace:</strong> ' + u + '.</span>'));
    });
    weak.slice(0, 2).forEach(function (d) {
      recs.appendChild(el('li', {}, '<span><strong>' + DIMS[d.key].name + ' (' + d.pct + ' %):</strong> ' + DIMS[d.key].rec + ' <em>Služba: ' + DIMS[d.key].module + '.</em></span>'));
    });

    var summary = 'AI skóre ' + r.score + '/100 – ' + v.t + '. Obor: ' + horizonTxt + '. ' +
      r.dims.map(function (d) { return DIMS[d.key].name + ' ' + d.pct + ' %'; }).join(', ');
    var hidden = resultBox.querySelector('input[name="result"]');
    if (hidden) hidden.value = summary;

    try { localStorage.setItem('legent-audit-last', JSON.stringify({ score: r.score, verdict: v.t, date: new Date().toISOString().slice(0, 10) })); } catch (e) { /* soukromý režim */ }
    panel.hidden = true;
    if (intro) intro.hidden = true;
    resultBox.hidden = false;
    requestAnimationFrame(function () { ring.setAttribute('stroke-dashoffset', (C * (1 - r.score / 100)).toFixed(1)); });
    var h = resultBox.querySelector('h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    window.scrollTo({ top: window.scrollY + resultBox.getBoundingClientRect().top - 96, behavior: 'smooth' });
    if (window.plausible) window.plausible('AI audit dokončen', { props: { score: String(Math.round(r.score / 10) * 10) } });
  }

  // Poslední výsledek (jen v tomto prohlížeči)
  try {
    var last = JSON.parse(localStorage.getItem('legent-audit-last') || 'null');
    var lastBox = root.querySelector('[data-quiz-last]');
    if (last && lastBox) {
      var d = last.date.split('-');
      lastBox.textContent = 'Naposledy jste test dokončili ' + (+d[2]) + '. ' + (+d[1]) + '. ' + d[0] + ' se skóre ' + last.score + '/100 (' + last.verdict + ').';
      lastBox.hidden = false;
    }
  } catch (e) { /* soukromý režim */ }

  root.querySelector('[data-quiz-start]').addEventListener('click', function () {
    state.step = 0;
    if (intro) intro.hidden = true;
    panel.hidden = false;
    render();
    focusTitle();
  });
  root.querySelectorAll('[data-quiz-restart]').forEach(function (b) {
    b.addEventListener('click', function () {
      state = { step: 0, answers: [], horizon: null };
      resultBox.hidden = true; panel.hidden = false; render(); focusTitle();
    });
  });
  root.querySelectorAll('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });
})();
