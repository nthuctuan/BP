# ROADMAP — weby Legacy Enterprises & Legent AI

Deadline: **neděle 22. 11. 2026**. Práce běží v iteracích (~30 min). Každá iterace:
vezme další nehotové úkoly → implementuje → ověří (`npm test`, screenshoty) → commit + push
na `claude/legacy-enterprises-website-nqfhe6` → aktualizuje tento soubor.

Legenda: `[x]` hotovo a ověřeno · `[~]` rozpracováno · `[ ]` čeká

## Architektura (rozhodnuto)

- **Čistě statické HTML/CSS/JS**, žádný framework ani build krok za běhu → web jde otevřít
  dvojklikem, hostovat kdekoli (GitHub Pages, Netlify, Vercel, Cloudflare Pages) a editovat
  přímo v GitHubu.
- `/` = **Legacy Enterprises** (CZ), `/legent/` = **Legent AI** (samostatný web, vlastní
  design systém, nasaditelný zvlášť na vlastní doménu).
- Sdílená hlavička/patička se generuje z `tools/partials/**` skriptem `npm run build`
  (vkládá se mezi značky `<!-- @partial … -->` / `<!-- @end … -->`). Výstup se commituje.
- Fonty self-hostované (`npm run fonts`) → žádné volání Google (GDPR) a rychlejší načtení.
- Formuláře: konfigurovatelný endpoint v `assets/js/config.js` (Formspree / Web3Forms /
  Netlify / vlastní API). Bez endpointu poctivý fallback na předvyplněný e-mail (mailto).
- Bez cookies a bez trackingu ve výchozím stavu → není potřeba cookie lišta. Volitelně
  cookieless analytika (Plausible/Umami) přes config.

## Legacy Enterprises (kořen)

- [x] Tooling: package.json, self-hosted fonty, build partials, statický server
- [x] Design systém `assets/css/site.css` (převzatý z v2 + přístupnost, kontrast, mobilní menu, formuláře, FAQ, kvíz, kalkulačka, prose)
- [x] Sdílený JS `assets/js/site.js` (téma bez probliknutí, mobilní menu, reveal animace, formuláře)
- [x] Úvodní stránka `index.html` (přestavba v2, aktualizované datumy, CTA na nástroje)
- [x] `exit-readiness.html` — Exit Readiness Program (6 modulů, ceník, průběh, FAQ)
- [x] `kupci.html` — Pro kupce (ETA, search fondy, matchmaking, mentoring)
- [x] `venture-studio.html` — Univerze, Viets, teze studia
- [x] `o-nas.html` — teze, AI operační model, tým, hodnoty
- [x] `kontakt.html` — kontaktní formulář + waiting list + průběh spolupráce
- [ ] `exit-test.html` — interaktivní Exit Readiness test (skóre, doporučení, lead)
- [ ] `kalkulacka.html` — orientační kalkulačka hodnoty firmy a efektu přípravy
- [ ] `insights/` — rozcestník + 3 vzdělávací články
- [ ] Právní: `ochrana-osobnich-udaju.html` (GDPR), `cookies.html`, `eticky-kodex.html`
- [ ] `404.html`, `robots.txt`, `sitemap.xml`, `llms.txt`, `site.webmanifest`, favicon, OG obrázek
- [ ] JSON-LD (Organization, ProfessionalService, FAQPage, Person, Article, Breadcrumb)
- [ ] Ověření statistik a zdrojů (ČSÚ, AMSP, Pepperdine…) – co nejde ověřit, zmírnit/označit

## Legent AI (`/legent/`)

- [ ] Design systém `legent/assets/css/legent.css` (tmavý, Geist + Instrument Serif)
- [ ] `legent/index.html` — hero, problém, balíčky, proces, ukázka agenta, bezpečnost, FAQ
- [ ] `legent/sluzby.html` — 4 balíčky s ceníkem a obsahem
- [ ] `legent/reseni.html` — use-cases po oborech (servis, gastro, autoservis, účetní, e-shop, výroba)
- [ ] `legent/ai-audit.html` — interaktivní AI readiness test
- [ ] `legent/roi.html` — ROI kalkulačka automatizace
- [ ] `legent/o-nas.html` — kdo stojí za Legent AI, principy, AI Act & GDPR
- [ ] `legent/kontakt.html` — formulář
- [ ] `legent/ochrana-osobnich-udaju.html`, `legent/404.html`, SEO soubory, OG, favicon

## Kvalita a ověření

- [x] `tests/run.mjs` — Playwright: načtení stránek, chyby v konzoli, interní odkazy a kotvy, přetečení na mobilu, meta tagy, axe-core (light+dark), externí požadavky
- [ ] axe-core přístupnost (0 vážných chyb), html-validate bez chyb
- [ ] Funkční testy: přepínač tématu, mobilní menu, formuláře, kvízy, kalkulačky
- [ ] Vizuální kontrola screenshotů (desktop 1440, tablet 834, mobil 390; light + dark)
- [ ] GitHub Actions CI (`npm test`)
- [ ] `docs/DEPLOY.md` (GitHub Pages / Netlify / Vercel, domény, formuláře)
- [ ] Finální QA průchod obou webů

## Otevřené otázky pro majitele → `docs/OPEN-QUESTIONS.md`

## Log iterací

- **#1 (čt 19. 11.)** — architektura, tooling, self-hosted fonty (Cormorant → EB Garamond kvůli vadné sazbě háčků), design systém v3 (kontrast WCAG AA, mobilní menu, formuláře, FAQ, marquee), partials, nová úvodní stránka (FAQ + JSON-LD, nástroje, waiting list), favicon + OG obrázky, testovací runner (axe, odkazy, mobil, funkce). Úvodní stránka: 0 chyb kromě odkazů na dosud nevytvořené stránky.
- **#2 (čt 19. 11.)** — podstránky Exit Readiness (6 modulů, ceník, průběh, FAQ + JSON-LD), Pro kupce (4 typy kupců, proces akvizice, vzdělávání, registrační formulář), Venture Studio (Univerze, Viets), O nás (příběh, AI vs. lidé, tým, principy), Kontakt (formulář s předvýběrem tématu z URL, waiting list). Testy: 0 chyb kromě odkazů na stránky z dalších iterací. Pozn.: u týmu vynechán údaj „Podíl 50 %“ (vlastnické podíly se na webech běžně neuvádějí – lze vrátit). Push stále blokován (403).
