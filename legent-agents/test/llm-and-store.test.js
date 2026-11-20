import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import { createClaudeLLM, LLMRefusalError, documentContent } from '../src/llm.js';
import { createStore, redact } from '../src/core/store.js';
import { parseStatusResponse, buildStatusRequest, isPublishedAccount } from '../src/connectors/dph.js';
import { parseAres, namesMatch } from '../src/connectors/ares.js';

const fixture = (f) => readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8');

// Testovací klient napodobující tvar odpovědi SDK – ověřuje, co posíláme do API.
function fakeClient(response) {
  const calls = [];
  return { calls, beta: { messages: {
    parse: async (p) => { calls.push(p); return response; },
    create: async (p) => { calls.push(p); return response; },
  } } };
}

test('Claude LLM: model, effort, strukturovaný výstup a server-side fallback', async () => {
  const client = fakeClient({ stop_reason: 'end_turn', parsed_output: { a: 1 }, usage: {}, model: 'claude-opus-5-5' });
  const llm = createClaudeLLM({ model: 'claude-opus-5-5', effort: 'medium', fallbacks: true, client });
  const out = await llm.structured({ system: 's', content: [{ type: 'text', text: 'x' }], schema: z.object({ a: z.number() }) });
  assert.deepEqual(out.data, { a: 1 });
  const p = client.calls[0];
  assert.equal(p.model, 'claude-opus-5-5');
  assert.equal(p.output_config.effort, 'medium');
  assert.ok(p.output_config.format, 'chybí output_config.format');
  assert.deepEqual(p.betas, ['server-side-fallback-2026-07-01']);
  assert.equal(p.fallbacks, 'default');
  assert.equal('thinking' in p, false); // Opus 5.5: thinking nevypínáme, řídí se effortem
});

test('Claude LLM: odmítnutí vyhodí LLMRefusalError', async () => {
  const llm = createClaudeLLM({ model: 'm', effort: 'low', fallbacks: false, client: fakeClient({ stop_reason: 'refusal', stop_details: { category: 'cyber' } }) });
  await assert.rejects(() => llm.text({ system: 's', content: 'x' }), LLMRefusalError);
});

test('PDF a obrázky jdou jako bloky dokumentu', () => {
  const pdf = documentContent({ buffer: Buffer.from('%PDF'), mediaType: 'application/pdf' }, 'instrukce');
  assert.equal(pdf[0].type, 'document');
  assert.equal(pdf[0].source.media_type, 'application/pdf');
  assert.equal(pdf.at(-1).text, 'instrukce');
  const img = documentContent({ buffer: Buffer.from('x'), mediaType: 'image/png' }, 'i');
  assert.equal(img[0].type, 'image');
});

test('fronta ke schválení a audit log', () => {
  const store = createStore(mkdtempSync(join(tmpdir(), 'legent-')));
  const item = store.enqueue({ agent: 'invoice', title: 't', payload: {}, reasons: ['r'] });
  assert.equal(store.queue()[0].status, 'pending');
  store.decide(item.id, { status: 'approved', by: 'Jana' });
  assert.equal(store.queue()[0].status, 'approved');
  assert.throws(() => store.decide(item.id, { status: 'rejected', by: 'Jana' }), /už byla vyřízena/);
  assert.ok(store.auditLog().some((e) => e.action === 'queue.approved' && e.actor === 'Jana'));
});

test('maskování osobních údajů v logu', () => {
  assert.equal(redact('Pište na jan@firma.cz nebo 777 123 456'), 'Pište na [e-mail] nebo [telefon]');
});

test('registr plátců DPH: parser odpovědi', () => {
  const r = parseStatusResponse(fixture('dph-spolehlivy.xml'));
  assert.equal(r.status, 'NE');
  assert.equal(r.unreliable, false);
  assert.ok(isPublishedAccount('2001234561/2010', r.publishedAccounts));
  assert.equal(isPublishedAccount('1234567899/0800', r.publishedAccounts), false);
  assert.match(buildStatusRequest('12345679'), /<roz:dic>12345679<\/roz:dic>/);
});

test('ARES: parser a porovnání názvů', () => {
  const a = parseAres(JSON.parse(fixture('ares-12345679.json')));
  assert.equal(a.name, 'Teplo Servis s.r.o.');
  assert.equal(namesMatch('TEPLO SERVIS, s. r. o.', 'Teplo Servis s.r.o.'), true);
  assert.equal(namesMatch('Kotle Plus s.r.o.', 'Teplo Servis s.r.o.'), false);
});
