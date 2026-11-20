// Agent pro týdenní KPI report.
// Čísla počítá kód (deterministicky). Model píše jen komentář a smí použít výhradně předaná čísla;
// kontrola „čísla v textu ⊆ čísla z dat“ zabrání vymyšleným hodnotám (jinak se použije šablona).
import { round2 } from '../validators/cz.js';

export function parseCsv(text, sep = ';') {
  const [head, ...rows] = text.trim().split(/\r?\n/);
  const cols = head.split(sep).map((c) => c.trim());
  return rows.filter(Boolean).map((r) => Object.fromEntries(r.split(sep).map((v, i) => [cols[i], v.trim()])));
}

const isoWeekStart = (d) => { const x = new Date(d + 'T00:00:00Z'); const day = (x.getUTCDay() + 6) % 7; x.setUTCDate(x.getUTCDate() - day); return x.toISOString().slice(0, 10); };

/** Spočítá KPI pro týden obsahující `asOf` a srovnání s předchozím týdnem. */
export function computeKpis(rows, asOf) {
  const thisWeek = isoWeekStart(asOf);
  const prev = new Date(thisWeek + 'T00:00:00Z'); prev.setUTCDate(prev.getUTCDate() - 7);
  const prevWeek = prev.toISOString().slice(0, 10);
  const inWeek = (w) => rows.filter((r) => isoWeekStart(r.datum) === w);
  const sum = (rs, k) => round2(rs.reduce((a, r) => a + Number(r[k] || 0), 0));
  const cur = inWeek(thisWeek), old = inWeek(prevWeek);
  const revenue = sum(cur, 'trzba_bez_dph'), costs = sum(cur, 'naklady');
  const prevRevenue = sum(old, 'trzba_bez_dph');
  const overdue = rows.filter((r) => r.uhrazeno !== 'ano' && r.splatnost < asOf);
  const byCustomer = {};
  for (const r of overdue) byCustomer[r.zakaznik] = round2((byCustomer[r.zakaznik] ?? 0) + Number(r.trzba_bez_dph));
  return {
    week: thisWeek,
    revenue,
    prevRevenue,
    revenueChangePct: prevRevenue ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null,
    grossMarginPct: revenue ? Math.round(((revenue - costs) / revenue) * 100) : null,
    invoices: cur.length,
    overdueCount: overdue.length,
    overdueTotal: sum(overdue, 'trzba_bez_dph'),
    topDebtors: Object.entries(byCustomer).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, amount]) => ({ name, amount })),
  };
}

const fmt = (n) => Math.round(n).toLocaleString('cs-CZ').replace(/ /g, ' ');
/** Český plurál: 1 faktura, 2–4 faktury, 0 a 5+ faktur. */
export const faktur = (n) => (n === 1 ? '1 faktura' : n >= 2 && n <= 4 ? `${n} faktury` : `${n} faktur`);

export function templateSummary(k) {
  const change = k.revenueChangePct == null ? '' : ` (${k.revenueChangePct >= 0 ? '+' : ''}${k.revenueChangePct} % proti minulému týdnu)`;
  return `Týden od ${k.week}: tržby ${fmt(k.revenue)} Kč bez DPH${change}, hrubá marže ${k.grossMarginPct == null ? '–' : k.grossMarginPct + ' %'}, vystaveno: ${faktur(k.invoices)}. ` +
    `Po splatnosti: ${faktur(k.overdueCount)} za ${fmt(k.overdueTotal)} Kč` +
    (k.topDebtors.length ? `; nejvíce dluží ${k.topDebtors.map((d) => `${d.name} (${fmt(d.amount)} Kč)`).join(', ')}.` : '.');
}

/** Všechna čísla v textu musí pocházet z KPI (tolerance formátování). */
export function numbersGrounded(text, k) {
  const allowed = new Set();
  const addNum = (n) => { if (n == null) return; allowed.add(String(Math.round(Math.abs(n)))); };
  [k.revenue, k.prevRevenue, k.revenueChangePct, k.grossMarginPct, k.invoices, k.overdueCount, k.overdueTotal, ...k.topDebtors.map((d) => d.amount)].forEach(addNum);
  k.week.split('-').forEach((p) => allowed.add(String(Number(p))));
  const found = [...text.replace(/(\d)[\s ](?=\d{3}\b)/g, '$1').matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => String(Math.round(Number(m[0].replace(',', '.')))));
  const unknown = found.filter((n) => !allowed.has(n));
  return { ok: unknown.length === 0, unknown };
}

export async function runReportAgent({ csvText, asOf, llm, store }) {
  const kpis = computeKpis(parseCsv(csvText), asOf);
  const { text, model } = await llm.text({
    system: 'Jsi finanční asistent majitele malé firmy. Píšeš stručné týdenní shrnutí česky (4–6 vět): co se povedlo, na co si dát pozor, jeden konkrétní doporučený krok. Používej výhradně čísla z předaných dat, žádná jiná čísla nepiš a nic nedopočítávej.',
    content: [{ type: 'text', text: `KPI za týden (JSON):\n${JSON.stringify(kpis, null, 2)}` }],
    maxTokens: 2000,
    offlineTask: 'report', offlineInput: kpis,
  });
  const grounded = numbersGrounded(text, kpis);
  const summary = grounded.ok ? text : templateSummary(kpis);
  store.audit({ actor: 'agent:report', action: 'report-generated', model, week: kpis.week, grounded: grounded.ok });
  return { kpis, summary, grounded };
}

export const offlineReport = (k) => templateSummary(k);
