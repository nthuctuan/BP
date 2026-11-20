// Pravidla kontroly přijaté faktury – bez AI a bez závislostí na Node.js.
// Stejný modul používá agent (src/agents/invoice.js) i živá ukázka na webu Legent AI
// (kopii do legent/assets/js/agents/ vytváří `npm run build` v kořeni repozitáře).
import { isValidIco, isValidCzDic, normalizeDic, isValidCzAccount, parseCzAccount, isValidIban, isPublishedAccount, CZ_VAT_RATES, round2 } from '../validators/cz.js';

export const TOLERANCE = 1; // Kč – zaokrouhlení
/** Limit pro ručení za DPH při platbě na nezveřejněný účet (§ 109 ZDPH). */
export const PUBLISHED_ACCOUNT_LIMIT = 540000;

/** Částka v českém formátu (mezera jako oddělovač tisíců, desetinná čárka), např. „12 400 Kč“. */
export function kc(n) {
  const [int, dec] = Math.abs(Number(n)).toFixed(2).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return (Number(n) < 0 ? '−' : '') + grouped + (dec === '00' ? '' : ',' + dec) + '\u00a0Kč';
}

/** Deterministické kontroly vytěžených údajů. Vrací seznam {id, level: ok|warn|error, message}. */
export function validateInvoice(inv) {
  const checks = [];
  const add = (id, level, message) => checks.push({ id, level, message });
  const s = inv.supplier ?? {};

  if (!s.ico) add('supplier.ico', 'warn', 'Chybí IČO dodavatele.');
  else if (!isValidIco(s.ico)) add('supplier.ico', 'error', `IČO dodavatele ${s.ico} nemá platnou kontrolní číslici.`);
  else add('supplier.ico', 'ok', `IČO ${s.ico} je formálně platné.`);

  const dic = normalizeDic(s.dic);
  if (dic) {
    if (!isValidCzDic(dic)) add('supplier.dic', 'warn', `DIČ ${dic} nemá český formát (CZ + 8–10 číslic).`);
    else if (s.ico && dic.length === 10 && dic.slice(2) !== String(s.ico)) add('supplier.dic', 'warn', 'DIČ právnické osoby obvykle odpovídá IČO – ověřte.');
    else add('supplier.dic', 'ok', `DIČ ${dic} má platný formát.`);
  }

  if (inv.currency && inv.currency.toUpperCase() !== 'CZK') add('currency', 'warn', `Faktura je v měně ${inv.currency} – vyžaduje ruční kontrolu kurzu.`);

  for (const v of inv.vatBreakdown ?? []) {
    if (!CZ_VAT_RATES.includes(v.rate)) add(`vat.rate.${v.rate}`, 'error', `Sazba DPH ${v.rate} % neodpovídá platným sazbám (0, 12, 21 %).`);
    const expected = round2((v.base * v.rate) / 100);
    if (Math.abs(expected - v.vat) > TOLERANCE) add(`vat.calc.${v.rate}`, 'error', `DPH ${v.rate} %: ${kc(v.vat)} neodpovídá základu ${kc(v.base)} (očekáváno ${kc(expected)}).`);
    else add(`vat.calc.${v.rate}`, 'ok', `DPH ${v.rate} % sedí na základ.`);
  }

  const sumBase = round2((inv.vatBreakdown ?? []).reduce((a, v) => a + v.base, 0));
  const sumVat = round2((inv.vatBreakdown ?? []).reduce((a, v) => a + v.vat, 0));
  if (inv.totalWithoutVat != null && Math.abs(sumBase - inv.totalWithoutVat) > TOLERANCE) add('total.base', 'error', `Součet základů ${kc(sumBase)} nesedí s celkem bez DPH ${kc(inv.totalWithoutVat)}.`);
  if (inv.totalVat != null && Math.abs(sumVat - inv.totalVat) > TOLERANCE) add('total.vat', 'error', `Součet DPH ${kc(sumVat)} nesedí s DPH celkem ${kc(inv.totalVat)}.`);
  if ((inv.vatBreakdown ?? []).length) {
    const expectedTotal = round2(sumBase + sumVat);
    if (Math.abs(expectedTotal - inv.totalWithVat) > TOLERANCE) add('total.sum', 'error', `Celkem k úhradě ${kc(inv.totalWithVat)} nesedí se základem + DPH (${kc(expectedTotal)}).`);
    else add('total.sum', 'ok', 'Celková částka sedí se základem a DPH.');
  }

  const d = (x) => (x && /^\d{4}-\d{2}-\d{2}$/.test(x) ? new Date(x + 'T00:00:00Z') : null);
  if (!d(inv.issueDate)) add('date.issue', 'warn', 'Chybí nebo je nečitelné datum vystavení.');
  if (sumVat > 0 && !d(inv.taxableSupplyDate)) add('date.duzp', 'warn', 'Daňový doklad bez DUZP.');
  if (d(inv.issueDate) && d(inv.dueDate) && d(inv.dueDate) < d(inv.issueDate)) add('date.due', 'warn', 'Splatnost je dříve než datum vystavení.');

  if (inv.bankAccount) {
    if (!parseCzAccount(inv.bankAccount)) add('bank.account', 'warn', `Číslo účtu ${inv.bankAccount} nemá český formát.`);
    else if (!isValidCzAccount(inv.bankAccount)) add('bank.account', 'error', `Číslo účtu ${inv.bankAccount} neprošlo kontrolou modulo 11.`);
    else add('bank.account', 'ok', 'Číslo účtu je formálně platné.');
  }
  if (inv.iban && !isValidIban(inv.iban)) add('bank.iban', 'error', `IBAN ${inv.iban} není platný.`);
  if (!inv.bankAccount && !inv.iban) add('bank.missing', 'warn', 'Na faktuře chybí bankovní spojení.');

  if (inv.confidence !== 'high') add('confidence', 'warn', `Jistota vytěžení: ${inv.confidence}.${inv.notes ? ' ' + inv.notes : ''}`);
  return checks;
}

/** Rozhodnutí: automatický export, nebo fronta ke schválení s důvody. */
export function decideInvoice(inv, checks, { config, knownSupplier, vat }) {
  const reasons = [];
  for (const c of checks) if (c.level !== 'ok') reasons.push(c.message);
  if (inv.totalWithVat > config.autoApproveMax) reasons.push(`Částka ${kc(inv.totalWithVat)} je nad limitem pro automatické schválení (${kc(config.autoApproveMax)}).`);
  if (config.reviewNewSuppliers && !knownSupplier) reasons.push('Nový dodavatel – první fakturu schvaluje člověk.');
  if (vat?.unreliable) reasons.push('Dodavatel je v registru veden jako NESPOLEHLIVÝ PLÁTCE DPH – hrozí ručení za DPH.');
  if (vat && inv.bankAccount && vat.publishedAccounts?.length && !isPublishedAccount(inv.bankAccount, vat.publishedAccounts) && inv.totalWithVat > PUBLISHED_ACCOUNT_LIMIT) {
    reasons.push(`Platba nad ${kc(PUBLISHED_ACCOUNT_LIMIT)} na účet, který není zveřejněný v registru plátců DPH – hrozí ručení za DPH.`);
  }
  return { status: reasons.length ? 'review' : 'auto', reasons };
}
