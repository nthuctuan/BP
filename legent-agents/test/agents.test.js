import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createOfflineLLM } from '../src/llm.js';
import { createStore } from '../src/core/store.js';
import { loadConfig } from '../src/config.js';
import { runInvoiceAgent, offlineInvoice, onInvoiceApproved, validateInvoice } from '../src/agents/invoice.js';
import { runEnquiryAgent, offlineEnquiry, checkEnquiry } from '../src/agents/enquiry.js';
import { runReportAgent, computeKpis, parseCsv, numbersGrounded, offlineReport, faktur } from '../src/agents/report.js';

const S = new URL('../samples/', import.meta.url).pathname;
const read = (f) => readFileSync(join(S, f), 'utf8');
const llm = createOfflineLLM({ invoice: offlineInvoice, enquiry: offlineEnquiry, report: offlineReport });
const fresh = () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'legent-'));
  return { store: createStore(dataDir), config: { ...loadConfig({}), dataDir } };
};
const doc = (f) => ({ text: read(f), filename: f, mediaType: 'text/plain' });

test('faktura: nový dodavatel jde ke schválení, po schválení další faktura projde automaticky', async () => {
  const { store, config } = fresh();
  const r1 = await runInvoiceAgent({ doc: doc('faktura-teplo-servis-1.txt'), llm, store, config });
  assert.equal(r1.decision.status, 'review');
  assert.match(r1.decision.reasons.join(' '), /Nový dodavatel/);
  const item = store.decide(r1.queueItem.id, { status: 'approved', by: 'test' });
  onInvoiceApproved(store, { ...item, decidedBy: 'test' });
  const r2 = await runInvoiceAgent({ doc: doc('faktura-teplo-servis-2.txt'), llm, store, config });
  assert.equal(r2.decision.status, 'auto');
  assert.equal(store.exported('invoices').length, 2);
});

test('faktura: chybně spočítané DPH je zachyceno', async () => {
  const { store, config } = fresh();
  const r = await runInvoiceAgent({ doc: doc('faktura-chyba-dph.txt'), llm, store, config });
  assert.equal(r.decision.status, 'review');
  assert.ok(r.checks.some((c) => c.level === 'error' && /očekáváno 8400/.test(c.message)));
});

test('faktura: částka nad limitem jde ke schválení', async () => {
  const { store, config } = fresh();
  const r = await runInvoiceAgent({ doc: doc('faktura-velka.txt'), llm, store, config });
  assert.match(r.decision.reasons.join(' '), /nad limitem/);
});

test('faktura: duplicita je zachycena', async () => {
  const { store, config } = fresh();
  config.reviewNewSuppliers = false;
  await runInvoiceAgent({ doc: doc('faktura-teplo-servis-2.txt'), llm, store, config });
  const again = await runInvoiceAgent({ doc: doc('faktura-teplo-servis-2.txt'), llm, store, config });
  assert.ok(again.checks.some((c) => c.id === 'duplicate'));
  assert.equal(again.decision.status, 'review');
});

test('faktura: online kontroly (ARES + registr DPH) přes testovací fetch', async () => {
  const { store, config } = fresh();
  config.online = true;
  config.reviewNewSuppliers = false;
  const fetchImpl = async (url) => {
    if (String(url).includes('ares.gov.cz')) return new Response(read('../test/fixtures/ares-12345679.json'), { status: 200 });
    return new Response(read('../test/fixtures/dph-nespolehlivy.xml'), { status: 200 });
  };
  const r = await runInvoiceAgent({ doc: doc('faktura-teplo-servis-2.txt'), llm, store, config, fetchImpl });
  assert.ok(r.checks.some((c) => c.id === 'ares' && c.level === 'ok'));
  assert.equal(r.vat.unreliable, true);
  assert.equal(r.decision.status, 'review');
  assert.match(r.decision.reasons.join(' '), /NESPOLEHLIVÝ PLÁTCE/);
});

test('validace: jiná sazba DPH než 0/12/21 % je chyba', () => {
  const inv = offlineInvoice(read('faktura-teplo-servis-1.txt'));
  inv.vatBreakdown = [{ rate: 15, base: 100, vat: 15 }];
  assert.ok(validateInvoice(inv).some((c) => c.id === 'vat.rate.15' && c.level === 'error'));
});

test('poptávka: návrh odpovědi jde vždy ke schválení, termíny jen z kalendáře', async () => {
  const { store } = fresh();
  const profile = JSON.parse(read('firma.json'));
  const slots = JSON.parse(read('volne-terminy.json'));
  const r = await runEnquiryAgent({ text: read('poptavka-kotel.txt'), profile, slots, llm, store });
  assert.equal(r.enquiry.category, 'nova_zakazka');
  assert.ok(r.queueItem);
  assert.ok(r.enquiry.suggestedSlots.every((s) => slots.includes(s)));
});

test('poptávka: spam se archivuje bez fronty', async () => {
  const { store } = fresh();
  const r = await runEnquiryAgent({ text: read('poptavka-spam.txt'), profile: JSON.parse(read('firma.json')), slots: [], llm, store });
  assert.equal(r.enquiry.category, 'spam');
  assert.equal(r.queueItem, null);
});

test('poptávka: termín mimo kalendář a cena mimo ceník jsou zachyceny', () => {
  const profile = JSON.parse(read('firma.json'));
  const result = offlineEnquiry({ text: read('poptavka-kotel.txt'), profile, slots: ['2026-11-24T09:00'] });
  result.suggestedSlots.push('2026-12-24T09:00');
  result.replyDraft += '\nCena bude 42 000 Kč.';
  const issues = checkEnquiry(result, { slots: ['2026-11-24T09:00'], profile });
  assert.ok(issues.some((i) => /mimo kalendář/.test(i)));
  assert.ok(issues.some((i) => /42 000 Kč/.test(i)));
  assert.deepEqual(result.suggestedSlots, ['2026-11-24T09:00']);
});

test('report: KPI se počítají deterministicky', () => {
  const k = computeKpis(parseCsv(read('faktury-vydane.csv')), '2026-11-15');
  assert.equal(k.week, '2026-11-09');
  assert.equal(k.revenue, 164400);
  assert.equal(k.prevRevenue, 131400);
  assert.equal(k.invoices, 4);
  assert.equal(k.overdueCount, 2);
  assert.equal(k.overdueTotal, 28400);
});

test('report: čísla v textu musí pocházet z dat', async () => {
  const k = computeKpis(parseCsv(read('faktury-vydane.csv')), '2026-11-15');
  assert.equal(numbersGrounded(offlineReport(k), k).ok, true);
  assert.equal(numbersGrounded('Tržby vzrostly na 999 999 Kč.', k).ok, false);
  const { store } = fresh();
  const lying = createOfflineLLM({ report: () => 'Tržby byly 1 000 000 Kč.' });
  const r = await runReportAgent({ csvText: read('faktury-vydane.csv'), asOf: '2026-11-15', llm: lying, store });
  assert.equal(r.grounded.ok, false);
  assert.match(r.summary, /164 400/); // použita šablona s reálnými čísly
});

test('report: český plurál', () => {
  assert.deepEqual([0, 1, 2, 4, 5].map(faktur), ['0 faktur', '1 faktura', '2 faktury', '4 faktury', '5 faktur']);
});
