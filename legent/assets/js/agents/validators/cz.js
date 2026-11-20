/* KOPIE z legent-agents/src/validators/cz.js — needitovat zde, spusťte npm run build */
// Deterministické kontroly českých údajů. Žádná AI – stejná pravidla dává i účetní.

/** IČO: 8 číslic, kontrolní číslice dle váženého součtu modulo 11. */
export function isValidIco(value) {
  const ico = String(value ?? '').replace(/\s/g, '');
  if (!/^\d{8}$/.test(ico)) return false;
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += Number(ico[i]) * (8 - i);
  const check = (11 - (sum % 11)) % 10;
  return check === Number(ico[7]);
}

/** DIČ (CZ): „CZ“ + 8 až 10 číslic. */
export function isValidCzDic(value) {
  return /^CZ\d{8,10}$/.test(String(value ?? '').replace(/\s/g, '').toUpperCase());
}

export function normalizeDic(value) {
  return value ? String(value).replace(/\s/g, '').toUpperCase() : null;
}

/** Český formát účtu [předčíslí-]číslo/kód banky s kontrolou modulo 11. */
export function parseCzAccount(value) {
  const m = String(value ?? '').replace(/\s/g, '').match(/^(?:(\d{1,6})-)?(\d{2,10})\/(\d{4})$/);
  if (!m) return null;
  return { prefix: m[1] ?? '', number: m[2], bankCode: m[3] };
}

function mod11(digits, weights) {
  const padded = digits.padStart(weights.length, '0');
  let sum = 0;
  for (let i = 0; i < weights.length; i++) sum += Number(padded[i]) * weights[i];
  return sum % 11 === 0;
}

export function isValidCzAccount(value) {
  const acc = parseCzAccount(value);
  if (!acc) return false;
  const prefixOk = acc.prefix === '' || mod11(acc.prefix, [10, 5, 8, 4, 2, 1]);
  const numberOk = mod11(acc.number, [6, 3, 7, 9, 10, 5, 8, 4, 2, 1]);
  return prefixOk && numberOk;
}

/** IBAN: kontrola modulo 97. */
export function isValidIban(value) {
  const iban = String(value ?? '').replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rem = 0;
  for (const ch of numeric) rem = (rem * 10 + Number(ch)) % 97;
  return rem === 1;
}

/** Sazby DPH platné v ČR od 1. 1. 2024. */
export const CZ_VAT_RATES = [0, 12, 21];

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Je účet mezi zveřejněnými účty plátce DPH? (porovnání bez úvodních nul a mezer) */
export function isPublishedAccount(account, published) {
  const norm = (a) => String(a).replace(/\s/g, '').replace(/^0+-?/, '').replace(/-0+/, '-').toUpperCase();
  return published.some((p) => norm(p) === norm(account));
}
