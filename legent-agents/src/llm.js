// Vrstva pro jazykový model. Agenti nevolají SDK přímo, ale přes rozhraní { structured, text }:
//  - createClaudeLLM(): ostrý provoz přes Claude API (strukturované výstupy + server-side fallback)
//  - createOfflineLLM(): zjednodušený pravidlový „model“ bez AI pro testy a demo bez API klíče
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

export class LLMRefusalError extends Error {
  constructor(details) {
    super(`Model požadavek odmítl (${details?.category ?? 'bez kategorie'}).`);
    this.details = details;
  }
}

/**
 * @param {{ model: string, effort: string, fallbacks: boolean, client?: Anthropic }} opts
 */
export function createClaudeLLM({ model, effort, fallbacks, client } = {}) {
  const anthropic = client ?? new Anthropic(); // klíč z ANTHROPIC_API_KEY nebo profilu `ant auth login`

  function baseParams({ system, content, maxTokens, effortOverride }) {
    const params = {
      model,
      max_tokens: maxTokens ?? 16000,
      system,
      messages: [{ role: 'user', content }],
      output_config: { effort: effortOverride ?? effort },
    };
    if (fallbacks) {
      // Při odmítnutí (stop_reason "refusal") API samo zopakuje požadavek na vhodném záložním modelu.
      params.betas = ['server-side-fallback-2026-07-01'];
      params.fallbacks = 'default';
    }
    return params;
  }

  function checkStop(res) {
    if (res.stop_reason === 'refusal') throw new LLMRefusalError(res.stop_details);
    if (res.stop_reason === 'max_tokens') throw new Error('Odpověď modelu byla useknuta (max_tokens) – zvyšte limit.');
  }

  return {
    name: 'claude',
    /** Strukturovaný výstup validovaný proti Zod schématu. */
    async structured({ system, content, schema, maxTokens, effort: effortOverride }) {
      const params = baseParams({ system, content, maxTokens, effortOverride });
      params.output_config.format = betaZodOutputFormat(schema);
      const res = await anthropic.beta.messages.parse(params);
      checkStop(res);
      if (!res.parsed_output) throw new Error('Výstup modelu neodpovídá schématu.');
      return { data: res.parsed_output, usage: res.usage, model: res.model };
    },
    /** Volný text (např. komentář k reportu). */
    async text({ system, content, maxTokens, effort: effortOverride }) {
      const res = await anthropic.beta.messages.create(baseParams({ system, content, maxTokens, effortOverride }));
      checkStop(res);
      const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
      return { text, usage: res.usage, model: res.model };
    },
  };
}

/**
 * Offline „model“: deterministické funkce místo AI. Slouží k testům a ukázce celé pipeline
 * bez API klíče. Každý agent dodá vlastní pravidlový handler (viz agents/*.js → offline*).
 */
export function createOfflineLLM(handlers) {
  return {
    name: 'offline',
    async structured({ schema, offlineTask, offlineInput }) {
      const fn = handlers[offlineTask];
      if (!fn) throw new Error(`Offline režim nemá handler pro úlohu „${offlineTask}“.`);
      return { data: schema.parse(fn(offlineInput)), usage: { input_tokens: 0, output_tokens: 0 }, model: 'offline' };
    },
    async text({ offlineTask, offlineInput }) {
      const fn = handlers[offlineTask];
      if (!fn) throw new Error(`Offline režim nemá handler pro úlohu „${offlineTask}“.`);
      return { text: fn(offlineInput), usage: { input_tokens: 0, output_tokens: 0 }, model: 'offline' };
    },
  };
}

/** Sestaví obsah zprávy z dokumentu: PDF a obrázky jako bloky, text jako text. */
export function documentContent({ buffer, filename, mediaType, text }, instruction) {
  const blocks = [];
  if (mediaType === 'application/pdf') {
    blocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buffer.toString('base64') } });
  } else if (mediaType?.startsWith('image/')) {
    blocks.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: buffer.toString('base64') } });
  } else {
    blocks.push({ type: 'text', text: `<dokument nazev="${filename ?? 'dokument'}">\n${text ?? buffer.toString('utf8')}\n</dokument>` });
  }
  blocks.push({ type: 'text', text: instruction });
  return blocks;
}
