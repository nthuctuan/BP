// Jednoduché append-only úložiště v souborech JSONL: fronta ke schválení, audit log, exporty.
// Pro pilotní nasazení stačí; v produkci lze nahradit databází se stejným rozhraním.
import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';

export function createStore(dataDir) {
  mkdirSync(dataDir, { recursive: true });
  const file = (name) => join(dataDir, name);
  const append = (name, obj) => appendFileSync(file(name), JSON.stringify(obj) + '\n');
  const readAll = (name) => (existsSync(file(name)) ? readFileSync(file(name), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);

  return {
    dataDir,
    /** Audit log: kdo (agent/člověk), co, kdy. Neukládá obsah dokumentů, jen otisk. */
    audit(event) {
      append('audit.jsonl', { ts: new Date().toISOString(), ...event });
    },
    auditLog: () => readAll('audit.jsonl'),

    /** Fronta ke schválení (human-in-the-loop). */
    enqueue({ agent, title, payload, reasons }) {
      const item = { id: randomUUID().slice(0, 8), ts: new Date().toISOString(), agent, title, payload, reasons, status: 'pending' };
      append('queue.jsonl', { type: 'created', ...item });
      return item;
    },
    decide(id, { status, by, note }) {
      if (!['approved', 'rejected'].includes(status)) throw new Error('Stav musí být approved nebo rejected.');
      const item = this.queue().find((q) => q.id === id);
      if (!item) throw new Error(`Položka ${id} ve frontě neexistuje.`);
      if (item.status !== 'pending') throw new Error(`Položka ${id} už byla vyřízena (${item.status}).`);
      append('queue.jsonl', { type: 'decision', id, status, by, note, ts: new Date().toISOString() });
      this.audit({ actor: by, action: `queue.${status}`, id, note });
      return { ...item, status };
    },
    /** Aktuální stav fronty (poslední rozhodnutí vyhrává). */
    queue() {
      const items = new Map();
      for (const e of readAll('queue.jsonl')) {
        if (e.type === 'created') items.set(e.id, { ...e });
        else if (e.type === 'decision' && items.has(e.id)) Object.assign(items.get(e.id), { status: e.status, decidedBy: e.by, note: e.note });
      }
      return [...items.values()];
    },

    /** Export schválených dat (pro import do účetnictví / CRM). */
    exportRecord(kind, record) {
      append(`export-${kind}.jsonl`, { ts: new Date().toISOString(), ...record });
    },
    exported: (kind) => readAll(`export-${kind}.jsonl`),
  };
}

/** Otisk dokumentu pro audit (bez ukládání obsahu). */
export const fingerprint = (bufOrText) => createHash('sha256').update(bufOrText).digest('hex').slice(0, 16);

/** Maskování osobních údajů v textech určených do logů. */
export function redact(text) {
  return String(text ?? '')
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[e-mail]')
    .replace(/(\+420\s?)?\d{3}\s?\d{3}\s?\d{3}/g, '[telefon]')
    .replace(/\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}\b/g, '[IBAN]');
}
