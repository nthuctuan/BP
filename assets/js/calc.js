/* Orientační kalkulačka hodnoty firmy (EV = EBITDA × násobek; equity = EV − čistý dluh). */
(function () {
  'use strict';
  var form = document.querySelector('[data-calc]');
  if (!form) return;

  // Ilustrativní rozpětí násobků EV/EBITDA pro malé soukromé firmy (transakce do ~50 mil. Kč).
  var SECTORS = {
    services: [3.0, 5.0], manufacturing: [3.5, 5.5], wholesale: [3.0, 4.5], retail: [2.0, 3.5],
    it: [4.5, 7.0], construction: [2.5, 4.0], ecommerce: [3.0, 5.0], health: [4.0, 6.0]
  };
  // Každý faktor posouvá pozici v rozpětí (0 = spodní hranice, 1 = horní).
  var FACTORS = ['f-owner', 'f-recurring', 'f-concentration', 'f-growth', 'f-books'];

  var $ = function (id) { return document.getElementById(id); };
  var out = function (k) { return form.querySelector('[data-out="' + k + '"]'); };
  var fmtM = function (v) {
    var m = v / 1e6;
    return (Math.abs(m) >= 100 ? Math.round(m) : m.toLocaleString('cs-CZ', { maximumFractionDigits: 1, minimumFractionDigits: 1 })) + ' mil. Kč';
  };
  var fmtKc = function (v) { return Math.round(v).toLocaleString('cs-CZ') + ' Kč'; };

  function position(levels) {
    // levels: hodnoty 0..2 pro každý faktor → průměr / 2
    var s = 0; levels.forEach(function (l) { s += l; });
    return s / (levels.length * 2);
  }

  function calc() {
    var ebitda = Math.max(0, Number(String($('c-ebitda').value).replace(/\s/g, '')) || 0);
    var debt = Number(String($('c-debt').value).replace(/\s/g, '')) || 0;
    var range = SECTORS[$('c-sector').value] || SECTORS.services;
    var now = FACTORS.map(function (id) { return Number($(id).value); });
    var after = now.map(function (l) { return Math.min(2, l + 1); }); // příprava zlepší každý faktor o jeden stupeň
    var addback = Number($('c-addback').value) / 100; // normalizace EBITDA (QoE)

    var pNow = position(now), pAfter = position(after);
    var span = range[1] - range[0];
    var mNow = range[0] + span * pNow;
    var mAfter = range[0] + span * pAfter;
    var ebitdaAfter = ebitda * (1 + addback);

    // rozpětí ±0,5× kolem odhadovaného násobku, oříznuto do rozpětí oboru
    function band(m) { return [Math.max(range[0] - 0.5, m - 0.5), Math.min(range[1] + 0.5, m + 0.5)]; }
    var bNow = band(mNow), bAfter = band(mAfter);
    var evNow = ebitda * mNow, evAfter = ebitdaAfter * mAfter;
    var eqNow = evNow - debt, eqAfter = evAfter - debt;
    var diff = eqAfter - eqNow;
    var pct = eqNow > 0 ? diff / eqNow * 100 : 0;

    out('mid').textContent = fmtM(eqNow);
    out('range').textContent = fmtM(ebitda * bNow[0] - debt) + ' – ' + fmtM(ebitda * bNow[1] - debt);
    out('multiple').textContent = mNow.toLocaleString('cs-CZ', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + '× EBITDA';
    out('after').textContent = fmtM(eqAfter);
    out('after-range').textContent = fmtM(ebitdaAfter * bAfter[0] - debt) + ' – ' + fmtM(ebitdaAfter * bAfter[1] - debt);
    out('after-multiple').textContent = mAfter.toLocaleString('cs-CZ', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + '× normalizované EBITDA';
    out('diff').textContent = (diff >= 0 ? '+' : '') + fmtM(diff);
    out('diff-pct').textContent = eqNow > 0 ? (pct >= 0 ? '+' : '') + Math.round(pct) + ' % oproti dnešku' : 'zadejte kladnou EBITDA';
    out('ebitda-fmt').textContent = fmtKc(ebitda);
    out('debt-fmt').textContent = fmtKc(debt);
    out('addback-fmt').textContent = '+' + Math.round(addback * 100) + ' %';

    // sloupcové srovnání
    var maxV = Math.max(ebitdaAfter * bAfter[1] - debt, ebitda * bNow[1] - debt, 1);
    function bar(sel, mid, hi) {
      var f = form.querySelector(sel);
      if (!f) return;
      var m = Math.max(0, mid) / maxV * 100, h = Math.max(0, hi) / maxV * 100;
      f.style.left = '0'; f.style.width = Math.max(1.5, m) + '%';
      f.style.setProperty('--hi', Math.max(0, h - m) / Math.max(m, 1) * 100 + '%');
    }
    bar('.fill.now', eqNow, ebitda * bNow[1] - debt);
    bar('.fill.prep', eqAfter, ebitdaAfter * bAfter[1] - debt);
  }

  form.addEventListener('input', calc);
  form.addEventListener('change', calc);
  form.addEventListener('submit', function (e) { e.preventDefault(); calc(); });
  calc();
})();
