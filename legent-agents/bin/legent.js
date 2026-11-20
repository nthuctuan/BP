#!/usr/bin/env node
// Legent AI – příkazová řádka pro agenty.
//   legent invoice <soubor.pdf|.png|.jpg|.txt> [--offline]
//   legent enquiry <soubor.txt> [--offline]
//   legent report <faktury.csv> [--as-of YYYY-MM-DD] [--offline]
//   legent queue                       – položky čekající na schválení
//   legent approve <id> [--by jméno]   – schválit (faktury se exportují)
//   legent reject <id> --note "důvod"  – zamítnout
//   legent demo --offline              – projde všechny agenty na vzorových datech
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../src/config.js';
import { createClaudeLLM, createOfflineLLM, LLMRefusalError } from '../src/llm.js';
import { createStore } from '../src/core/store.js';
import { runInvoiceAgent, offlineInvoice, onInvoiceApproved } from '../src/agents/invoice.js';
import { runEnquiryAgent, offlineEnquiry } from '../src/agents/enquiry.js';
import { runReportAgent, offlineReport } from '../src/agents/report.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SAMPLES = join(ROOT, 'samples');
const MEDIA = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const VALUE_FLAGS = ['--as-of', '--by', '--note', '--profile', '--slots', '--data'];
const positional = args.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.includes(args[i - 1]));
const [cmd, target] = positional;

const config = loadConfig();
if (flag('data')) config.dataDir = opt('data');
const store = createStore(config.dataDir);
const llm = flag('offline')
  ? createOfflineLLM({ invoice: offlineInvoice, enquiry: offlineEnquiry, report: offlineReport })
  : createClaudeLLM(config);

const icon = { ok: '✓', warn: '!', error: '✗' };
const readDoc = (path) => {
  const mediaType = MEDIA[extname(path).toLowerCase()] ?? 'text/plain';
  const buffer = readFileSync(path);
  return { buffer, filename: basename(path), mediaType, text: mediaType === 'text/plain' ? buffer.toString('utf8') : undefined };
};

function printInvoice(r) {
  const i = r.invoice;
  console.log(`\nFaktura ${i.invoiceNumber ?? '?'} · ${i.supplier.name ?? '?'} (IČO ${i.supplier.ico ?? '?'}) · ${i.totalWithVat} ${i.currency} · splatnost ${i.dueDate ?? '?'}`);
  for (const c of r.checks) console.log(`  ${icon[c.level]} ${c.message}`);
  if (r.decision.status === 'auto') console.log('  → Připraveno k zaúčtování automaticky (všechny kontroly prošly).');
  else console.log(`  → Ke schválení člověkem [${r.queueItem.id}]:\n     - ${r.decision.reasons.join('\n     - ')}`);
}

async function invoice(path) { printInvoice(await runInvoiceAgent({ doc: readDoc(path), llm, store, config })); }

async function enquiry(path) {
  const profile = JSON.parse(readFileSync(opt('profile') ?? join(SAMPLES, 'firma.json'), 'utf8'));
  const slots = JSON.parse(readFileSync(opt('slots') ?? join(SAMPLES, 'volne-terminy.json'), 'utf8'));
  const r = await runEnquiryAgent({ text: readFileSync(path, 'utf8'), profile, slots, llm, store });
  console.log(`\nPoptávka: ${r.enquiry.category} · naléhavost ${r.enquiry.urgency} · ${r.enquiry.summary}`);
  if (!r.queueItem) { console.log('  → Archivováno jako spam.'); return; }
  for (const i of r.issues) console.log(`  ! ${i}`);
  console.log(`  → Návrh odpovědi čeká na schválení [${r.queueItem.id}]:\n\n${r.enquiry.replyDraft.replace(/^/gm, '     ')}`);
}

async function report(path) {
  const asOf = opt('as-of') ?? new Date().toISOString().slice(0, 10);
  const r = await runReportAgent({ csvText: readFileSync(path, 'utf8'), asOf, llm, store });
  console.log(`\nKPI za týden od ${r.kpis.week}:`, JSON.stringify(r.kpis, null, 2));
  console.log(`\nShrnutí${r.grounded.ok ? '' : ' (šablona – text modelu obsahoval čísla mimo data: ' + r.grounded.unknown.join(', ') + ')'}:\n${r.summary}`);
}

function queue() {
  const pending = store.queue().filter((q) => q.status === 'pending');
  if (!pending.length) return console.log('Fronta je prázdná.');
  for (const q of pending) console.log(`[${q.id}] ${q.agent.padEnd(8)} ${q.title}\n           ${q.reasons.join(' | ')}`);
}

function decide(status) {
  const item = store.decide(target, { status, by: opt('by') ?? process.env.USER ?? 'člověk', note: opt('note') });
  if (status === 'approved' && item.agent === 'invoice') onInvoiceApproved(store, { ...item, decidedBy: opt('by') });
  console.log(`${status === 'approved' ? 'Schváleno' : 'Zamítnuto'}: ${item.title}`);
}

async function demo() {
  console.log('=== Legent AI – demo na smyšlených vzorových datech' + (flag('offline') ? ' (offline režim bez AI)' : '') + ' ===');
  console.log('\n1) Agent pro přijaté faktury');
  await invoice(join(SAMPLES, 'faktura-teplo-servis-1.txt'));
  const first = store.queue().filter((q) => q.status === 'pending' && q.agent === 'invoice').at(-1);
  if (first) {
    store.decide(first.id, { status: 'approved', by: 'demo: účetní' });
    onInvoiceApproved(store, { ...first, decidedBy: 'demo: účetní' });
    console.log(`  ✓ Účetní schválila [${first.id}] → dodavatel je teď známý.`);
  }
  await invoice(join(SAMPLES, 'faktura-teplo-servis-2.txt'));
  await invoice(join(SAMPLES, 'faktura-chyba-dph.txt'));
  await invoice(join(SAMPLES, 'faktura-velka.txt'));
  console.log('\n2) Agent pro poptávky');
  await enquiry(join(SAMPLES, 'poptavka-kotel.txt'));
  await enquiry(join(SAMPLES, 'poptavka-spam.txt'));
  console.log('\n3) Agent pro týdenní KPI report');
  args.push('--as-of', '2026-11-15'); // poslední celý týden vzorových dat
  await report(join(SAMPLES, 'faktury-vydane.csv'));
  console.log(`\nData (fronta, audit log, exporty): ${config.dataDir}`);
}

const commands = {
  invoice: () => invoice(target), enquiry: () => enquiry(target), report: () => report(target),
  queue, approve: () => decide('approved'), reject: () => decide('rejected'), demo,
};

try {
  if (!commands[cmd]) {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 10).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
    process.exit(cmd ? 1 : 0);
  }
  await commands[cmd]();
} catch (e) {
  if (e instanceof LLMRefusalError) console.error(`Model odmítl požadavek: ${e.message}`);
  else if (e instanceof Anthropic.AuthenticationError) console.error('Chybí nebo je neplatný API klíč – nastavte ANTHROPIC_API_KEY, nebo spusťte s --offline.');
  else if (e instanceof Anthropic.RateLimitError) console.error('Limit API překročen – zkuste to za chvíli.');
  else if (e instanceof Anthropic.APIError) console.error(`Chyba API ${e.status}: ${e.message}`);
  else console.error(e.message);
  process.exit(1);
}
