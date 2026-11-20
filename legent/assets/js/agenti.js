// Živá ukázka kontroly přijaté faktury (stránka agenti.html).
// Používá stejná pravidla jako agent v legent-agents/ – kopie modulů vytváří `npm run build`.
// Vše běží v prohlížeči, nic se neodesílá.
import { validateInvoice, decideInvoice } from './agents/rules/invoice-rules.js';

const OK = { ico: '12345679', dic: 'CZ12345679', account: '2001234561/2010', issue: '2026-11-14', duzp: '2026-11-14', due: '2026-11-28', base: '12 400', rate: '21', vat: '2 604', total: '15 004', registry: 'ok', known: true };
const SAMPLES = {
  ok: OK,
  vat: { ...OK, vat: '2 480', total: '14 880' },
  new: { ...OK, ico: '55500013', dic: 'CZ55500013', account: '19-2000145399/0800', base: '52 000', vat: '10 920', total: '62 920', known: false },
  account: { ...OK, account: '1234567890/0100' },
  big: { ...OK, base: '480 000', vat: '100 800', total: '580 800', registry: 'unpublished' },
};
// Účet, který „registr“ v ukázce vrací jako zveřejněný, když účet na faktuře zveřejněný není
const OTHER_PUBLISHED = '670100-2201234566/6210';
const CONFIG = { autoApproveMax: 50000, reviewNewSuppliers: true };

function num(v) {
  const s = String(v ?? '').replace(/[\s ]/g, '').replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
const fmt = (n) => n.toLocaleString('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function init(form) {
  const f = form.elements;
  const checksEl = form.querySelector('[data-checks]');
  const summaryEl = form.querySelector('[data-summary]');
  const decisionEl = form.querySelector('[data-decision]');
  const titleEl = form.querySelector('[data-decision-title]');
  const reasonsEl = form.querySelector('[data-reasons]');
  const sampleBtns = form.querySelectorAll('[data-sample]');

  function load(name) {
    const s = SAMPLES[name];
    for (const k of ['ico', 'dic', 'account', 'issue', 'duzp', 'due', 'base', 'rate', 'vat', 'total', 'registry']) f[k].value = s[k];
    f.known.checked = s.known;
    sampleBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sample === name)));
    run();
  }

  function line(level, text) {
    const div = document.createElement('div');
    const cls = { ok: 'ok', warn: 'warn', error: 'err', info: 'run' }[level];
    div.className = 'console-line ' + cls;
    const ic = document.createElement('span');
    ic.className = 'ic';
    ic.setAttribute('aria-hidden', 'true');
    ic.textContent = { ok: '✓', warn: '!', error: '✕', info: '›' }[level];
    const msg = document.createElement('span');
    const label = { ok: 'V pořádku: ', warn: 'Upozornění: ', error: 'Chyba: ', info: '' }[level];
    if (label) { const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = label; msg.append(sr); }
    msg.append(text);
    div.append(ic, msg);
    return div;
  }

  function run() {
    const base = num(f.base.value), vat = num(f.vat.value), total = num(f.total.value), rate = Number(f.rate.value);
    const account = f.account.value.trim();
    const inv = {
      supplier: { name: null, ico: f.ico.value.trim() || null, dic: f.dic.value.trim() || null },
      currency: 'CZK',
      vatBreakdown: base != null && vat != null && !Number.isNaN(base) && !Number.isNaN(vat) ? [{ rate, base, vat }] : [],
      totalWithoutVat: Number.isNaN(base) ? null : base,
      totalVat: Number.isNaN(vat) ? null : vat,
      totalWithVat: Number.isNaN(total) || total == null ? 0 : total,
      issueDate: f.issue.value || null,
      taxableSupplyDate: f.duzp.value || null,
      dueDate: f.due.value || null,
      bankAccount: account || null,
      iban: null,
      confidence: 'high',
    };
    const checks = validateInvoice(inv);
    if ([base, vat, total].some((n) => Number.isNaN(n))) checks.push({ level: 'error', message: 'Některá částka není číslo.' });
    if (total == null) checks.push({ level: 'warn', message: 'Chybí celková částka k úhradě.' });

    // Stav v registru plátců DPH (v ukázce simulovaný) – jen informace v konzoli; o předání člověku rozhodují pravidla
    const reg = f.registry.value;
    let vatInfo = null;
    const notes = [];
    if (reg === 'ok') { vatInfo = { unreliable: false, publishedAccounts: [account || OTHER_PUBLISHED] }; notes.push({ level: 'ok', message: 'Registr plátců DPH: spolehlivý plátce, účet je zveřejněný.' }); }
    else if (reg === 'unpublished') { vatInfo = { unreliable: false, publishedAccounts: [OTHER_PUBLISHED] }; notes.push({ level: 'warn', message: 'Registr plátců DPH: účet na faktuře mezi zveřejněnými není (rozhoduje u plateb nad 540 000 Kč).' }); }
    else if (reg === 'unreliable') { vatInfo = { unreliable: true, publishedAccounts: [] }; notes.push({ level: 'error', message: 'Registr plátců DPH: dodavatel je veden jako nespolehlivý plátce.' }); }
    else notes.push({ level: 'info', message: 'Registr plátců DPH: neověřeno (offline režim).' });

    const decision = decideInvoice(inv, checks, { config: CONFIG, knownSupplier: f.known.checked, vat: vatInfo });
    const shown = [...checks, ...notes];

    checksEl.replaceChildren(...shown.map((c) => line(c.level, c.message)));
    const n = (lvl) => shown.filter((c) => c.level === lvl).length;
    summaryEl.textContent = `v pořádku ${n('ok')} · upozornění ${n('warn')} · chyby ${n('error')}`;

    decisionEl.classList.toggle('auto', decision.status === 'auto');
    decisionEl.classList.toggle('review', decision.status !== 'auto');
    titleEl.textContent = decision.status === 'auto' ? 'Automaticky připraveno k zaúčtování' : 'Ke schválení člověkem';
    const items = decision.status === 'auto'
      ? ['Export do účetnictví a zápis do audit logu – bez zásahu člověka.']
      : decision.reasons;
    reasonsEl.replaceChildren(...items.map((r) => { const li = document.createElement('li'); li.textContent = r; return li; }));
  }

  form.querySelector('[data-recalc]').addEventListener('click', () => {
    const base = num(f.base.value);
    if (base == null || Number.isNaN(base)) { f.base.focus(); return; }
    const vat = Math.round(base * Number(f.rate.value)) / 100;
    f.vat.value = fmt(vat);
    f.total.value = fmt(Math.round((base + vat) * 100) / 100);
    run();
  });
  sampleBtns.forEach((b) => b.addEventListener('click', () => load(b.dataset.sample)));
  form.addEventListener('input', () => { sampleBtns.forEach((b) => b.setAttribute('aria-pressed', 'false')); run(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run();
    // Na mobilu je výsledek pod formulářem – posunout k němu
    const aside = form.querySelector('.tool-side');
    if (aside.getBoundingClientRect().top > window.innerHeight) aside.scrollIntoView({ block: 'start' });
  });
  load('ok');
}

const demoForm = document.querySelector('[data-invoice-demo]');
if (demoForm) init(demoForm);
