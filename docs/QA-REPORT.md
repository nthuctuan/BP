# QA report — Legacy Enterprises & Legent AI

Stav k 19. 11. 2026 (fáze 2 a 3: 36 stránek včetně anglických a vietnamské verze). Ověřováno automaticky (`npm test`, CI na GitHubu) i ručně (screenshoty).

## Shrnutí

| Oblast | Výsledek |
|---|---|
| Stránek celkem | 37 (Legacy 23 vč. EN a VI, Legent 14 vč. EN) |
| HTML validace (`html-validate`) | 0 chyb |
| Přístupnost (axe-core, světlý i tmavý režim) | 0 kritických a vážných nálezů |
| Rozbité interní odkazy a kotvy | 0 |
| JS chyby v konzoli | 0 |
| Vodorovné přetečení na mobilu (390 px) | 0 |
| Korektura textů | 2 nezávislá kola (CZ + EN), 70 nálezů zapracováno |
| Externí požadavky (fonty, trackery) | 0 — vše self-hosted, bez cookies |
| SEO kontrola (titulky, popisky, canonical, sitemap, sirotci) | prochází |
| Funkční testy | téma, mobilní menu, formuláře (CZ i EN hlášky), předvyplnění tématu, Exit test (+ zapamatování), AI audit, kalkulačka (+ stav v URL), ROI, živá ukázka kontroly faktury (Legent Agenti) |
| Lighthouse (mobil, simulované 4G) | výkon 98–100, přístupnost/best practices/SEO 100 |
| Sada agentů `legent-agents/` | 23/23 testů (`node --test`), offline demo celé pipeline, samostatný CI job |
| CI (GitHub Actions) | zelené |

## Lighthouse — všechny indexované stránky (mobil, 35 stránek)

| Stránka | Výkon | Přístupnost | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `broker-vs-priprava.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 40 ms |
| `cookies.html` | 100 | 100 | 100 | 100 | 1.2 s | 0 | 10 ms |
| `en/index.html` | 99 | 100 | 100 | 100 | 1.4 s | 0 | 100 ms |
| `eticky-kodex.html` | 100 | 100 | 100 | 100 | 1.2 s | 0 | 0 ms |
| `exit-readiness.html` | 99 | 100 | 100 | 100 | 1.4 s | 0 | 100 ms |
| `exit-test.html` | 99 | 100 | 100 | 100 | 1.7 s | 0 | 30 ms |
| `index.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 50 ms |
| `insights/checklist-prodej-firmy.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 50 ms |
| `insights/earn-out-zadrzne-vendor-financing.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 80 ms |
| `insights/eta-jak-koupit-firmu.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 0 ms |
| `insights/index.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 10 ms |
| `insights/jak-se-ocenuje-mala-firma.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 0 ms |
| `insights/nastupnictvi-v-rodinne-firme.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 50 ms |
| `kalkulacka.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 50 ms |
| `kontakt.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 70 ms |
| `kupci.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 30 ms |
| `legent/agenti.html` | 98 | 100 | 100 | 100 | 2.4 s | 0 | 0 ms |
| `legent/ai-audit.html` | 100 | 100 | 100 | 100 | 1.2 s | 0 | 10 ms |
| `legent/en/index.html` | 100 | 100 | 100 | 100 | 1.2 s | 0 | 60 ms |
| `legent/index.html` | 100 | 100 | 100 | 100 | 1.2 s | 0 | 30 ms |
| `legent/insights/ai-agent-pro-prijate-faktury.html` | 98 | 100 | 100 | 100 | 2.3 s | 0 | 30 ms |
| `legent/insights/index.html` | 99 | 100 | 100 | 100 | 2.1 s | 0 | 10 ms |
| `legent/insights/jak-bezpecne-zacit-s-ai.html` | 100 | 100 | 100 | 100 | 1.2 s | 0 | 20 ms |
| `legent/kontakt.html` | 100 | 100 | 100 | 100 | 1.1 s | 0 | 20 ms |
| `legent/o-nas.html` | 99 | 100 | 100 | 100 | 2.2 s | 0 | 50 ms |
| `legent/ochrana-osobnich-udaju.html` | 100 | 100 | 100 | 100 | 1.1 s | 0 | 0 ms |
| `legent/reseni.html` | 98 | 100 | 100 | 100 | 2.3 s | 0 | 30 ms |
| `legent/roi.html` | 100 | 100 | 100 | 100 | 1.1 s | 0 | 30 ms |
| `legent/sluzby.html` | 98 | 100 | 100 | 100 | 2.4 s | 0 | 50 ms |
| `o-nas.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 30 ms |
| `ochrana-osobnich-udaju.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 0 ms |
| `slovnik.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 50 ms |
| `venture-studio.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 40 ms |
| `partneri.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 0 ms |
| `vi/index.html` | 99 | 100 | 100 | 100 | 1.7 s | 0 | 50 ms |

Měřeno Lighthouse 13.6 (mobilní profil, simulované zpomalení sítě a CPU) proti lokálnímu statickému serveru.
Na produkčním hostingu s CDN a kompresí budou časy podobné nebo lepší.

## Jak testy spustit

```bash
npm install
npm test          # build check + HTML validace + SEO + Playwright (odkazy, a11y, mobil, funkce)
npm run serve     # ruční náhled na http://localhost:8080
```

## Známá omezení

- Údaje o firmě (IČO, sídlo, spisová značka) jsou placeholdery — viz `docs/OPEN-QUESTIONS.md`.
- Formuláře bez nastaveného backendu otevírají předvyplněný e-mail — viz `docs/DEPLOY.md`, kap. 4.
- Kalkulačka hodnoty a ROI kalkulačka jsou orientační (uvedeno přímo na stránkách).
- Vietnamská stránka čeká na revizi rodilým mluvčím (OPEN-QUESTIONS #12).
