/* Legent AI — ROI kalkulačka automatizace (orientační výpočet v prohlížeči). */
(function () {
  'use strict';
  var form = document.querySelector('[data-roi]');
  if (!form) return;
  var $ = function (id) { return document.getElementById(id); };
  var out = function (k) { return form.querySelector('[data-out="' + k + '"]'); };
  var kc = function (v) { return Math.round(v).toLocaleString('cs-CZ') + ' Kč'; };
  var num = function (v, d) { return v.toLocaleString('cs-CZ', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); };

  function calc() {
    var people = +$('r-people').value, hours = +$('r-hours').value, rate = +$('r-rate').value;
    var share = +$('r-share').value / 100, impl = +$('r-impl').value, monthly = +$('r-monthly').value;
    var savedH = people * hours * share * 52 / 12;
    var value = savedH * rate;
    var net = value - monthly;
    var yearCost = impl + 12 * monthly;
    var roi = yearCost > 0 ? (12 * value - yearCost) / yearCost * 100 : 0;
    var payback = net > 0 ? impl / net : Infinity;

    out('people').textContent = people + (people === 1 ? ' člověk' : people < 5 ? ' lidé' : ' lidí');
    out('hoursIn').textContent = hours + ' h / týden';
    out('rate').textContent = kc(rate) + ' / h';
    out('share').textContent = Math.round(share * 100) + ' %';
    out('impl').textContent = kc(impl);
    out('monthly').textContent = kc(monthly) + ' / měs.';

    out('hours').textContent = num(savedH) + ' h';
    out('fte').textContent = '≈ ' + num(savedH / 160, 1) + ' úvazku měsíčně';
    out('value').textContent = kc(value);
    out('net').textContent = (net >= 0 ? '+' : '') + kc(net) + ' čistého / měs.';
    out('payback').textContent = isFinite(payback) ? (payback < 1 ? 'do 1 měsíce' : num(payback, 1) + ' měsíce') : 'nevyplatí se';
    out('roi').textContent = (roi >= 0 ? '+' : '') + Math.round(roi) + ' % ROI za 12 měsíců';
    out('year').textContent = kc(12 * value - yearCost);
  }
  form.addEventListener('input', calc);
  form.addEventListener('submit', function (e) { e.preventDefault(); calc(); });
  calc();
})();
