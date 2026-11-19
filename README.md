# Legacy Enterprises & Legent AI — weby

Dva statické weby v jednom repozitáři:

| Web | Složka | Doména (plán) |
|-----|--------|---------------|
| **Legacy Enterprises** – pre-exit příprava a prodej MSP | `/` (kořen) | legacyenterprises.cz |
| **Legent AI** – AI agenti a automatizace pro MSP | `/legent/` | legent.ai |

Čisté HTML + CSS + JavaScript bez frameworku: stránky jdou otevřít přímo v prohlížeči,
hostovat kdekoli a upravovat i přímo na GitHubu.

## Úpravy obsahu

- **Text stránek** – přímo v `*.html` (komentáře v kódu označují sekce).
- **Hlavička a patička** se needitují ve stránkách, ale v `tools/partials/legacy|legent/*.html`;
  pak `npm run build` je propíše do všech stránek.
- **Firemní údaje** (IČO, e-mail, domény) – `site.config.json` → `npm run build`.
- **Formuláře a analytika** – `assets/js/config.js` (Legent: `legent/assets/js/config.js`).
- **Barvy a typografie** – proměnné na začátku `assets/css/site.css` / `legent/assets/css/legent.css`.

## Příkazy

```bash
npm install          # jednorázově (fonty, validátor, axe-core)
npm run serve        # náhled na http://localhost:8080 (Legent AI: /legent/)
npm run build        # propsání sdílených partials do stránek
npm test             # build check + HTML validace + Playwright testy (odkazy, a11y, mobil, funkce)
npm run fonts        # přegenerování self-hosted fontů
node tools/images.mjs  # přegenerování ikon a OG obrázků
```

Plán a stav prací: [`docs/ROADMAP.md`](docs/ROADMAP.md) · Otevřené otázky: [`docs/OPEN-QUESTIONS.md`](docs/OPEN-QUESTIONS.md)
