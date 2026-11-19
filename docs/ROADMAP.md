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
- [x] `exit-test.html` — interaktivní Exit Readiness test (skóre, doporučení, lead)
- [x] `kalkulacka.html` — orientační kalkulačka hodnoty firmy a efektu přípravy
- [x] `insights/` — rozcestník + 3 články (oceňování, checklist prodeje, nástupnictví) s Article/HowTo JSON-LD a prolinkováním
- [x] Právní: `ochrana-osobnich-udaju.html` (GDPR), `cookies.html`, `eticky-kodex.html`
- [x] `404.html`, `robots.txt`, `sitemap.xml` (generátor `tools/seo.mjs`), `llms.txt`, `site.webmanifest`, favicon, OG obrázky
- [ ] JSON-LD (Organization, ProfessionalService, FAQPage, Person, Article, Breadcrumb)
- [x] Ověření statistik a zdrojů – neověřitelné údaje z v2 nahrazeny zdrojovanými (AMSP ČR, Helas & Talers 2026, BusinessInfo.cz, Eurostat 2025 pro Legent)

## Legent AI (`/legent/`)

- [x] Design systém `legent/assets/css/legent.css` (tmavý, Geist + Instrument Serif)
- [x] `legent/index.html` — hero s animovanou konzolí agentů, Eurostat 2025 data, bento služeb, proces, obory, nástroje, bezpečnost, FAQ + JSON-LD
- [x] `legent/sluzby.html` — 4 služby (výstupy, délka, cena), harmonogram Sprintu, srovnávací tabulka
- [x] `legent/reseni.html` — 6 oborů × 3 typičtí agenti, předvyplnění oboru v kontaktu
- [x] `legent/ai-audit.html` — AI readiness audit (obor + 10 otázek, 5 oblastí, doporučení podle oboru, tisk, odeslání)
- [x] `legent/roi.html` — ROI kalkulačka (hodiny, hodnota, návratnost, ROI 12 měs., čistý přínos)
- [x] `legent/o-nas.html` — význam jména, tým, 6 principů (AI Act, GDPR, lock-in)
- [x] `legent/kontakt.html` — formulář (obor, velikost firmy), průběh konzultace
- [x] `legent/ochrana-osobnich-udaju.html` (vč. role zpracovatele, čl. 28), `legent/404.html`, sitemap/robots/llms.txt, OG, favicon

## SEO a GEO (vyhledávače + AI asistenti)

- [ ] Klíčová slova CZ (prodej firmy, ocenění firmy, nástupnictví, příprava na prodej, M&A pro MSP, AI pro firmy…) → mapování na stránky, titulky, H1, meta popisky
- [x] `sitemap.xml`, `robots.txt`, `llms.txt` (oba weby), canonical, OG/Twitter u všech stránek
- [x] Strukturovaná data (Organization, Service, FAQPage, Article, HowTo, WebApplication, Breadcrumb) – validní JSON
- [x] Interní prolinkování, žádné osiřelé stránky (`tests/seo.mjs`)
- [x] Výkon: Lighthouse mobil – všech 23 indexovaných stránek: výkon 96–100, a11y/best practices/SEO 100 (`docs/QA-REPORT.md`)
- [ ] SEO audit agentem/skillem a oprava nálezů
- [x] Návod Google Search Console + Bing Webmaster (v `docs/DEPLOY.md`)

## Přílohy (ke stažení / pro obchod)

- [x] PDF „Checklist: příprava firmy na prodej“ (2 strany A4) – prolinkováno z úvodu, článku, Exit Readiness, patičky
- [x] PDF one-pager Legacy Enterprises
- [x] PDF přehled služeb Legent AI
- [x] Logo kit `assets/brand/` + `legent/assets/brand/` (PNG světlé/tmavé, SVG symbol) – sekce „Ke stažení“ na O nás
- [x] Tisknutelný výsledek Exit testu a AI auditu (print CSS)

## Kvalita a ověření

- [x] `tests/run.mjs` — Playwright: načtení stránek, chyby v konzoli, interní odkazy a kotvy, přetečení na mobilu, meta tagy, axe-core (light+dark), externí požadavky
- [x] axe-core přístupnost (0 vážných chyb, light+dark), html-validate bez chyb (25 stránek)
- [x] Funkční testy: přepínač tématu, mobilní menu, formuláře (oba weby), předvyplnění tématu, Exit test, AI audit, kalkulačka, ROI
- [x] Vizuální kontrola screenshotů (desktop 1440, tablet 834, mobil 390; light + dark)
- [x] GitHub Actions CI (`npm test`) + workflow nasazení na GitHub Pages
- [x] `docs/DEPLOY.md` (GitHub Pages / Netlify / Cloudflare / Vercel, samostatná doména Legent, formuláře, analytika, Search Console) + `_headers` (CSP, HSTS, cache)
- [x] Zpětná kontrola: nezávislá korektura češtiny (40 nálezů zapracováno – gramatika, kalky, sjednocení pravidel střetu zájmů, zmírnění absolutních slibů, „hodna“), konzistence cen a kontaktů ověřena, odkazy OK
- [ ] Finální QA průchod obou webů

## Otevřené otázky pro majitele → `docs/OPEN-QUESTIONS.md`

## Log iterací

- **#1 (čt 19. 11.)** — architektura, tooling, self-hosted fonty (Cormorant → EB Garamond kvůli vadné sazbě háčků), design systém v3 (kontrast WCAG AA, mobilní menu, formuláře, FAQ, marquee), partials, nová úvodní stránka (FAQ + JSON-LD, nástroje, waiting list), favicon + OG obrázky, testovací runner (axe, odkazy, mobil, funkce). Úvodní stránka: 0 chyb kromě odkazů na dosud nevytvořené stránky.
- **#2 (čt 19. 11.)** — podstránky Exit Readiness (6 modulů, ceník, průběh, FAQ + JSON-LD), Pro kupce (4 typy kupců, proces akvizice, vzdělávání, registrační formulář), Venture Studio (Univerze, Viets), O nás (příběh, AI vs. lidé, tým, principy), Kontakt (formulář s předvýběrem tématu z URL, waiting list). Testy: 0 chyb kromě odkazů na stránky z dalších iterací. Pozn.: u týmu vynechán údaj „Podíl 50 %“ (vlastnické podíly se na webech běžně neuvádějí – lze vrátit). Push byl blokován (403) → uživatel povolil přístup, oba commity nahrány. Časovač smyčky zanikl s restartem kontejneru → nahrazen odolnou plánovanou zprávou (send_later, každých 30 min do 22. 11.).
- **#3 (čt 19. 11.)** — GitHub přístup povolen, vše nahráno. Odolná smyčka (send_later). Exit Readiness test (1+12 otázek, 6 oblastí, skóre, doporučení, časový tlak, tisk/PDF, odeslání výsledku) a kalkulačka hodnoty (8 oborů, 5 faktorů, normalizace EBITDA, čistý dluh, scénář po přípravě, graf). Funkční testy obou nástrojů zelené. Roadmapa rozšířena o SEO/GEO, přílohy a zpětnou kontrolu.
- **#3b** — GDPR zásady (tabulka účelů a právních základů, doby uložení, příjemci, AI, práva, ÚOOÚ), cookies (bez cookie lišty – jen localStorage tématu), etický kodex (7 oblastí), 404, sitemap/robots generátor (povoleni AI crawleři pro GEO), llms.txt; identifikace firmy z `site.config.json` (partial `company`). Opraveno přetečení tabulek na mobilu.
- **#3c** — ověření statistik (WebSearch): údaje v2 neověřitelné → nahrazeny zdrojovanými s odkazy. Insights: rozcestník + 3 SEO články, související články, odběr. Web Legacy kompletní (16 stránek), testy zelené kromě odkazu na Legent AI.
- **#3d** — Legent AI: design systém (tmavý, glass, gradient, bento), partials, favicon + OG, sdílený site.js (kopie přes build), úvodní stránka s ilustrativní konzolí agentů (3 scénáře, respektuje reduced motion).
- **#3e** — Legent: Služby a ceník, Řešení (6 oborů), AI readiness audit, ROI kalkulačka; funkční testy auditu a ROI zelené. Zbývá: O nás, Kontakt, GDPR, 404, llms.txt.
- **#3f** — Legent: O nás, Kontakt, GDPR+cookies, 404, llms.txt. **Oba weby kompletní: 25 stránek, `npm test` zcela zelený** (jen varování o placeholderech IČO/sídla). Další: SEO audit, Lighthouse, přílohy (PDF), CI, DEPLOY.md, zpětná kontrola.
- **#4 (čt 19. 11.)** — Lighthouse (mobil) 96–100 ve všech kategoriích, oprava LCP; PDF přílohy (checklist, 2× one-pager), logo kit, odkazy ke stažení; Netlify Forms atributy; CI + Pages workflow; `_headers`; DEPLOY.md; statická SEO kontrola v `npm test` (unikátní titulky, canonical, sitemap, sirotci).
- **#4b** — Lighthouse všech 23 stránek (96–100 / 100 / 100 / 100) → `docs/QA-REPORT.md`; CI na GitHubu zelené; korektura textů zapracována (střet zájmů sjednocen s etickým kodexem, „data primárně v EU“, bez nepodložených srovnání s konkurencí, opravy gramatiky).
