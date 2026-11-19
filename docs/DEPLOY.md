# Nasazení webů Legacy Enterprises a Legent AI

Oba weby jsou čistě statické (HTML, CSS, JS, fonty, obrázky). Nepotřebují server, databázi
ani build při nasazení — stačí nahrát soubory. Níže jsou tři doporučené varianty.

---

## 0. Před spuštěním (checklist)

- [ ] `site.config.json` → doplnit **IČO, adresu sídla, spisovou značku** → `npm run build`
- [ ] Ověřit, že funguje **contact@legacyenterprises.cz** (nebo změnit e-mail v `site.config.json`
      a v `assets/js/config.js` + `legent/assets/js/config.js`)
- [ ] Nastavit **backend formulářů** (kap. 4) — jinak formuláře otevírají předvyplněný e-mail
- [ ] Doplnit fotky zakladatelů (volitelné, `o-nas.html`)
- [ ] `npm test` → musí skončit „✓ Všechny kontroly prošly“

---

## 1. Varianta A — GitHub Pages (nejjednodušší, zdarma)

Legacy Enterprises poběží na kořeni, Legent AI na `/legent/`.

1. Sloučit větev do `main`.
2. GitHub → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Workflow `.github/workflows/pages.yml` se spustí při každém pushi do `main`
   (nebo ručně v záložce *Actions*). Publikuje jen veřejné soubory (bez `tools/`, `tests/`, `docs/`).
4. **Vlastní doména:** Settings → Pages → Custom domain → `legacyenterprises.cz`.
   U registrátora domény nastavte:
   - `A` záznamy na `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` pro `www` → `<uživatel>.github.io`
   - Zapnout **Enforce HTTPS**.

> Bez vlastní domény poběží web na `https://<uživatel>.github.io/BP/`. Stránky fungují,
> jen stránka 404 používá absolutní cesty a bude bez stylů — po nastavení domény je vše v pořádku.

## 2. Varianta B — Netlify nebo Cloudflare Pages (doporučeno pro ostrý provoz)

Výhody: bezpečnostní hlavičky ze souboru `_headers`, Netlify Forms bez dalšího účtu, rychlé CDN.

**Legacy Enterprises**
- New site → Import from Git → repozitář `BP`, větev `main`
- Build command: *(prázdné)* · Publish directory: `/`
- Doména: `legacyenterprises.cz`

**Legent AI jako samostatný web** (vlastní doména `legent.ai`)
- Druhý site ze stejného repozitáře · Base/Publish directory: `legent`
- Doména: `legent.ai`
- Pak v `site.config.json` nastavte:
  ```json
  "legacy": { "legentUrl": "https://legent.ai/" },
  "legent": { "legacyUrl": "https://legacyenterprises.cz/" }
  ```
  a spusťte `npm run build` (odkazy mezi weby se přepnou na absolutní URL).
- V `legent/404.html` změňte `root="/legent/"` na `root="/"` a odkazy `/legent/…` na `/…`, pak `npm run build`.

## 3. Varianta C — Vercel

Stejně jako Netlify: *Framework preset: Other*, *Output directory* `.` (resp. `legent`).
Hlavičky z `_headers` Vercel nečte — při potřebě je přepište do `vercel.json`.

---

## 4. Formuláře (kontakt, waiting list, registrace kupce, výsledky testů)

Nastavení v `assets/js/config.js` (Legacy) a `legent/assets/js/config.js` (Legent):

| Služba | Cena | Nastavení |
|--------|------|-----------|
| **Netlify Forms** | zdarma do 100 odeslání/měs. | `provider: 'netlify'` (jen při hostování na Netlify; formuláře mají atribut `name`) |
| **Formspree** | zdarma do 50/měs. | založit formulář → `provider: 'json', endpoint: 'https://formspree.io/f/XXXX'` |
| **Web3Forms** | zdarma do 250/měs. | `provider: 'json', endpoint: 'https://api.web3forms.com/submit', extra: { access_key: '…' }` |
| Vlastní API / Make / n8n webhook | — | `provider: 'json', endpoint: 'https://…'` (POST JSON) |

Bez nastavení (`provider: 'mailto'`) formulář otevře e-mailový program s předvyplněnou zprávou.

**GDPR:** zvolenou službu doplňte do `ochrana-osobnich-udaju.html` (kap. 4 — příjemci) a uzavřete s ní
smlouvu o zpracování (u Formspree/Web3Forms je součástí podmínek).
Každý formulář má ochranu proti spamu (skryté pole „honeypot“) a povinný souhlas.

## 5. Měření návštěvnosti (volitelné, bez cookies)

V `config.js` nastavte např.:
```js
analytics: { provider: 'plausible', domain: 'legacyenterprises.cz' }
```
Plausible ani Umami nepoužívají cookies → **není potřeba cookie lišta**. Formuláře a dokončení
testů se automaticky posílají jako události (cíle). Po zapnutí aktualizujte `cookies.html`.

## 6. Vyhledávače a AI asistenti

1. **Google Search Console** → přidat doménu (ověření DNS TXT záznamem) → *Sitemaps* →
   `https://legacyenterprises.cz/sitemap.xml` (a `https://legent.ai/sitemap.xml`).
2. **Bing Webmaster Tools** → import z Search Console (Bing napájí i Copilot a ChatGPT search).
3. `robots.txt` povoluje vyhledávače i AI crawlery (GPTBot, ClaudeBot, PerplexityBot, Google-Extended).
4. `llms.txt` (kořen i `/legent/`) — stručný popis firmy pro AI asistenty.
5. **Google Business Profile** pro Legacy Enterprises (Praha) — zvyšuje důvěryhodnost a lokální dohledatelnost.
6. Sitemap se generuje automaticky (`npm run build` → `tools/seo.mjs`).

## 7. Úpravy obsahu po spuštění

- Text stránek: přímo v `*.html` (lze i v GitHubu přes ikonu tužky).
- Hlavička/patička: `tools/partials/legacy|legent/*.html` → `npm run build`.
- PDF přílohy: šablony `tools/pdf/*.html` → `node tools/pdf.mjs`.
- OG obrázky, ikony, loga: `node tools/images.mjs`.
- Nový článek do Insights: zkopírovat existující článek v `insights/`, upravit, přidat kartu do
  `insights/index.html` a odkaz do `llms.txt`, pak `npm run build` (aktualizuje sitemapu).
- Po každé změně: `npm test`.
