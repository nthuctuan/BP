/* Exit Readiness test — 12 otázek v 6 oblastech, vyhodnocení probíhá jen v prohlížeči. */
(function () {
  'use strict';
  var root = document.querySelector('[data-quiz]');
  if (!root) return;

  var DIMS = {
    fin: { name: 'Finance a čísla', module: 'Quality of Earnings', rec: 'Oddělte soukromé výdaje od firemních a zaveďte měsíční výsledovku. Normalizovaná EBITDA (Quality of Earnings) je první věc, kterou kupec chce vidět.' },
    own: { name: 'Nezávislost na majiteli', module: 'SOP Package', rec: 'Předejte klíčová rozhodnutí a vztahy týmu. Kupec platí za firmu, která běží bez vás — závislost na majiteli je nejčastější důvod nižší ceny nebo earn-outu.' },
    ops: { name: 'Procesy a tým', module: 'SOP Package', rec: 'Sepište hlavní procesy a zajistěte klíčové lidi (smlouvy, motivace). Sepsaný provoz výrazně zkracuje due diligence.' },
    cus: { name: 'Zákazníci a tržby', module: 'Risk Mitigation', rec: 'Snižte závislost na největších zákaznících a převeďte co nejvíc tržeb na opakované (smlouvy, servis, předplatné). Opakované tržby zvyšují násobek.' },
    leg: { name: 'Právo a rizika', module: 'Risk Mitigation', rec: 'Nechte projít smlouvy advokátem a uzavřete otevřené spory či daňové nejasnosti. Co najde kupec v due diligence, stojí víc, než co opravíte sami.' },
    per: { name: 'Osobní připravenost', module: 'Exit Readiness Assessment', rec: 'Ujasněte si cílovou cenu, roli po prodeji a plán na další život. Bez toho se i dobrá nabídka snadno rozpadne na emocích.' }
  };

  var Q = [
    { d: 'fin', t: 'Jak vypadá vaše účetnictví z pohledu kupce?', o: ['Řeší hlavně daně, soukromé a firemní výdaje se místy míchají', 'Standardní účetnictví, ale bez pravidelného reportingu', 'Měsíční výsledovka a přehled o marži', 'Měsíční reporting, rozpočet a známe normalizovanou EBITDA'] },
    { d: 'fin', t: 'Jak se vyvíjel zisk za poslední tři roky?', o: ['Klesá nebo výrazně kolísá', 'Stagnuje', 'Mírně roste', 'Stabilně roste, každý rok jsme v zisku'] },
    { d: 'own', t: 'Co by se stalo, kdybyste odjeli na dva měsíce bez telefonu?', o: ['Firma by se prakticky zastavila', 'Fungovala by, ale důležitá rozhodnutí by čekala na mě', 'Běžela by, tým rozhoduje ve většině věcí', 'Běžela by beze změny, máme druhou linii vedení'] },
    { d: 'own', t: 'Kolik klíčových vztahů se zákazníky a dodavateli držíte osobně?', o: ['Prakticky všechny', 'Většinu', 'Jen několik nejdůležitějších', 'Žádné výhradně — vztahy má tým'] },
    { d: 'ops', t: 'Máte sepsané klíčové procesy?', o: ['Ne, všechno je v hlavách lidí', 'Částečně, ale neaktuálně', 'Hlavní procesy ano', 'Ano, aktuální a tým je skutečně používá'] },
    { d: 'ops', t: 'Jak stabilní je váš tým?', o: ['Vysoká fluktuace, klíčoví lidé bez pevných smluv', 'Stabilní, ale firma stojí na jednom či dvou lidech', 'Stabilní tým s jasnými rolemi', 'Stabilní tým a klíčoví lidé mají motivaci zůstat i po prodeji'] },
    { d: 'cus', t: 'Jaký podíl tržeb tvoří váš největší zákazník?', o: ['Více než 40 %', '20–40 %', '10–20 %', 'Méně než 10 %'] },
    { d: 'cus', t: 'Jak velká část tržeb se pravidelně opakuje (smlouvy, servis, stálí zákazníci)?', o: ['Méně než 20 %', '20–40 %', '40–60 %', 'Více než 60 %'] },
    { d: 'leg', t: 'Jsou smlouvy se zákazníky, dodavateli a zaměstnanci v pořádku?', o: ['Hodně věcí je domluvených ústně', 'Základní smlouvy máme, ale dlouho jsme je neaktualizovali', 'Většina je písemně a aktuální', 'Vše písemně, převoditelné a zkontrolované advokátem'] },
    { d: 'leg', t: 'Máte otevřené spory, kontroly nebo nejasnosti s úřady?', o: ['Ano, několik', 'Jeden větší', 'Jen drobnosti', 'Žádné'] },
    { d: 'per', t: 'Víte, kolik za firmu chcete a proč?', o: ['Ne', 'Mám představu, ale bez podkladů', 'Mám odhad od účetní nebo známého', 'Mám aktuální ocenění od profesionála'] },
    { d: 'per', t: 'Máte jasno, co budete dělat po prodeji a jakou roli chcete mít v přechodném období?', o: ['Vůbec ne', 'Trochu', 'Docela ano', 'Ano, mám plán i pro přechodné období'] }
  ];

  var HORIZON = { t: 'Kdy byste chtěli firmu prodat nebo předat?', o: ['Do 12 měsíců', 'Za 1–3 roky', 'Za více než 3 roky', 'Zatím nevím'] };

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
    var meta = el('div', { 'class': 'q-meta' }, '<span>Otázka ' + n + ' / ' + total() + '</span><span>' + (isHorizon ? 'Úvod' : DIMS[q.d].name) + '</span>');
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
    if (s >= 85) return { t: 'Výborná připravenost', d: 'Firma je na prodej připravená. Dává smysl ověřit hodnotu, připravit CIM a začít s výběrem kupců.', months: '3–6 měsíců' };
    if (s >= 65) return { t: 'Firma je blízko připravenosti', d: 'Základ je silný. Pár cílených kroků může výrazně posunout cenu i jistotu transakce.', months: '6–12 měsíců' };
    if (s >= 40) return { t: 'Dobrý základ, ale kupec najde slabá místa', d: 'Kupec by dnes slabiny promítl do ceny nebo podmínek (earn-out, zádržné). Je čas na strukturovanou přípravu.', months: '12–24 měsíců' };
    return { t: 'Firma zatím není připravená na prodej', d: 'Při prodeji dnes počítejte s výraznou slevou nebo náročnými podmínkami. Dobrá zpráva: právě teď má příprava největší efekt.', months: '24–36 měsíců' };
  }

  function showResult() {
    var r = compute();
    var v = verdict(r.score);
    var sorted = r.dims.slice().sort(function (a, b) { return a.pct - b.pct; });
    var weak = sorted.slice(0, 3);
    var horizonTxt = (HORIZON.o[state.horizon] || '').replace(/^./, function (c) { return c.toLowerCase(); });
    var urgent = state.horizon === 0 && r.score < 65;

    resultBox.querySelector('[data-score]').textContent = r.score;
    var ring = resultBox.querySelector('.score-ring .fg');
    var C = 2 * Math.PI * 76;
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
    (urgent ? weak.slice(0, 2) : weak).forEach(function (d) {
      recs.appendChild(el('li', {}, '<span><strong>' + DIMS[d.key].name + ' (' + d.pct + ' %):</strong> ' + DIMS[d.key].rec + ' <em>Modul: ' + DIMS[d.key].module + '.</em></span>'));
    });

    var summary = 'Skóre ' + r.score + '/100 – ' + v.t + '. Horizont: ' + horizonTxt + '. ' +
      r.dims.map(function (d) { return DIMS[d.key].name + ' ' + d.pct + ' %'; }).join(', ');
    var hidden = resultBox.querySelector('input[name="result"]');
    if (hidden) hidden.value = summary;

    try { localStorage.setItem('le-exit-last', JSON.stringify({ score: r.score, verdict: v.t, date: new Date().toISOString().slice(0, 10) })); } catch (e) { /* soukromý režim */ }
    panel.hidden = true;
    if (intro) intro.hidden = true;
    resultBox.hidden = false;
    requestAnimationFrame(function () { ring.setAttribute('stroke-dashoffset', (C * (1 - r.score / 100)).toFixed(1)); });
    var h = resultBox.querySelector('h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    window.scrollTo({ top: window.scrollY + resultBox.getBoundingClientRect().top - 96, behavior: 'smooth' });
    if (window.plausible) window.plausible('Exit test dokončen', { props: { score: String(Math.round(r.score / 10) * 10) } });
  }

  // Poslední výsledek (jen v tomto prohlížeči)
  try {
    var last = JSON.parse(localStorage.getItem('le-exit-last') || 'null');
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
