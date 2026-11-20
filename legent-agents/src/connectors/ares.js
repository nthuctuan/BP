// ARES – Administrativní registr ekonomických subjektů (veřejné REST API Ministerstva financí).
// https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/{ico}
const ARES_URL = 'https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/';

export function parseAres(json) {
  if (!json || !json.ico) return null;
  return {
    ico: json.ico,
    name: json.obchodniJmeno ?? null,
    dic: json.dic ?? null,
    address: json.sidlo?.textovaAdresa ?? null,
  };
}

export async function lookupAres(ico, { fetchImpl = fetch, timeoutMs = 8000 } = {}) {
  const res = await fetchImpl(ARES_URL + encodeURIComponent(ico), {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (res.status === 404) return { found: false };
  if (!res.ok) throw new Error(`ARES odpověděl ${res.status}`);
  return { found: true, ...parseAres(await res.json()) };
}

/** Hrubé porovnání názvů (ignoruje velikost písmen, diakritiku, právní formu). */
export function namesMatch(a, b) {
  const norm = (s) => String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/\b(s\.?\s?r\.?\s?o\.?|a\.?\s?s\.?|spol\.?|v\.?\s?o\.?\s?s\.?)\b/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 1);
  const A = new Set(norm(a)), B = new Set(norm(b));
  if (!A.size || !B.size) return false;
  const common = [...A].filter((w) => B.has(w)).length;
  return common / Math.min(A.size, B.size) >= 0.6;
}
