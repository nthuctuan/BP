// Konfigurace agentů – vše přes proměnné prostředí, rozumné výchozí hodnoty.
export function loadConfig(env = process.env) {
  return {
    // Model: výchozí Claude Opus 5.5. Lze přepnout např. LEGENT_MODEL=claude-sonnet-5-5.
    model: env.LEGENT_MODEL || 'claude-opus-5-5',
    // Effort (hloubka uvažování): low | medium | high | xhigh | max. Opus 5.5 má výchozí medium.
    effort: env.LEGENT_EFFORT || 'medium',
    // Server-side fallback při odmítnutí požadavku bezpečnostním klasifikátorem (doporučeno).
    fallbacks: env.LEGENT_FALLBACKS !== 'off',
    // Online kontroly (ARES, registr plátců DPH). Vypnuto = pouze lokální validace.
    online: env.LEGENT_ONLINE === '1',
    // Kam se ukládá fronta ke schválení, audit log a exporty.
    dataDir: env.LEGENT_DATA || new URL('../data/', import.meta.url).pathname,
    // Faktury nad tuto částku (Kč s DPH) jdou vždy ke schválení člověkem.
    autoApproveMax: Number(env.LEGENT_AUTO_APPROVE_MAX || 50000),
    // Nový (dosud neviděný) dodavatel jde ke schválení.
    reviewNewSuppliers: env.LEGENT_REVIEW_NEW_SUPPLIERS !== 'off',
  };
}
