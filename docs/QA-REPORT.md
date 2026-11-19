# QA report — Legacy Enterprises & Legent AI

Stav k 19. 11. 2026. Ověřováno automaticky (`npm test`, CI na GitHubu) i ručně (screenshoty).

## Shrnutí

| Oblast | Výsledek |
|---|---|
| Stránek celkem | 25 (Legacy 16, Legent 9) |
| HTML validace (`html-validate`) | 0 chyb |
| Přístupnost (axe-core, světlý i tmavý režim) | 0 kritických a vážných nálezů |
| Rozbité interní odkazy a kotvy | 0 |
| JS chyby v konzoli | 0 |
| Vodorovné přetečení na mobilu (390 px) | 0 |
| Externí požadavky (fonty, trackery) | 0 — vše self-hosted, bez cookies |
| SEO kontrola (titulky, popisky, canonical, sitemap, sirotci) | prochází |
| Funkční testy | téma, mobilní menu, 4 formuláře, předvyplnění tématu, Exit test, AI audit, kalkulačka, ROI |
| Lighthouse (mobil, simulované 4G) | výkon 96–100, ostatní kategorie 100 |
| CI (GitHub Actions) | zelené |

## Lighthouse — všechny indexované stránky (mobil)

| Stránka | Výkon | Přístupnost | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `cookies.html` | 100 | 100 | 100 | 100 | 1.2 s | 0 | 0 ms |
| `eticky-kodex.html` | 100 | 100 | 100 | 100 | 1.2 s | 0 | 0 ms |
| `exit-readiness.html` | 99 | 100 | 100 | 100 | 1.4 s | 0 | 100 ms |
| `exit-test.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 0 ms |
| `index.html` | 96 | 100 | 100 | 100 | 1.4 s | 0 | 230 ms |
| `insights/checklist-prodej-firmy.html` | 99 | 100 | 100 | 100 | 1.4 s | 0 | 90 ms |
| `insights/index.html` | 100 | 100 | 100 | 100 | 1.2 s | 0 | 40 ms |
| `insights/jak-se-ocenuje-mala-firma.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 70 ms |
| `insights/nastupnictvi-v-rodinne-firme.html` | 99 | 100 | 100 | 100 | 1.4 s | 0 | 90 ms |
| `kalkulacka.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 10 ms |
| `kontakt.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 90 ms |
| `kupci.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 0 ms |
| `legent/ai-audit.html` | 99 | 100 | 100 | 100 | 2.3 s | 0 | 0 ms |
| `legent/index.html` | 99 | 100 | 100 | 100 | 1.4 s | 0 | 120 ms |
| `legent/kontakt.html` | 100 | 100 | 100 | 100 | 1.1 s | 0 | 40 ms |
| `legent/o-nas.html` | 99 | 100 | 100 | 100 | 2.1 s | 0 | 0 ms |
| `legent/ochrana-osobnich-udaju.html` | 99 | 100 | 100 | 100 | 2.1 s | 0 | 0 ms |
| `legent/reseni.html` | 98 | 100 | 100 | 100 | 2.3 s | 0 | 0 ms |
| `legent/roi.html` | 99 | 100 | 100 | 100 | 2.3 s | 0 | 0 ms |
| `legent/sluzby.html` | 98 | 100 | 100 | 100 | 2.3 s | 0 | 60 ms |
| `o-nas.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 0 ms |
| `ochrana-osobnich-udaju.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 0 ms |
| `venture-studio.html` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 40 ms |

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
