# Otevřené otázky pro majitele (nic z toho neblokuje práci)

Web je postavený tak, aby fungoval i bez těchto údajů. Před ostrým spuštěním je ale doplňte –
většina se mění na jednom místě (`site.config.json` → `npm run build`, nebo `assets/js/config.js`).

| # | Otázka | Kde se mění | Proč |
|---|--------|-------------|------|
| 1 | **IČO, spisová značka OR, adresa sídla** Legacy Enterprises s.r.o. | `site.config.json` | Povinné údaje podnikatele na webu (§ 435 občanského zákoníku) a v zásadách GDPR |
| 2 | Funguje schránka **contact@legacyenterprises.cz**? Má mít Legent AI vlastní (např. hello@legent.ai)? | `site.config.json`, `assets/js/config.js`, `legent/assets/js/config.js` | Na ni míří formuláře i odkazy |
| 3 | Vlastníte domény **legacyenterprises.cz** a **legent.ai**? | `site.config.json` (`url`, `legentUrl`) | Canonical URL, sitemap, OG náhledy |
| 4 | **Backend formulářů**: Formspree / Web3Forms / Netlify Forms / vlastní? | `assets/js/config.js` | Bez něj formulář otevře předvyplněný e-mail (funguje, ale méně pohodlné) |
| 5 | **Hosting**: GitHub Pages, Netlify, Vercel, Cloudflare Pages? | viz `docs/DEPLOY.md` | Netlify umí formuláře bez dalšího účtu |
| 6 | **Fotky zakladatelů** (min. 800×800 px) a odkazy na LinkedIn | `o-nas.html`, `index.html` | Důvěra – u M&A poradenství zásadní |
| 7 | Potvrzení **ceníku** (retainer 15–35 tis., success fee 3–5 % min. 300 tis., Legent balíčky) | stránky služeb | Ceny jsou převzaté z verze v2 |
| 8 | ~~Zdroje statistik~~ **vyřešeno:** údaje z v2 (38 % ČSÚ, 72 % AMSP, +20–40 % Pepperdine) se nepodařilo dohledat, nahrazeny ověřitelnými: ~40 tis. rodinných firem s majitelem 55+ (odhad AMSP ČR), 58 % bez vybraného nástupce (Helas & Talers 2026), ~30 % firem změní majitele nebo zanikne (BusinessInfo.cz). Máte-li původní studie, rád je vrátím. | `index.html` | Neověřitelná čísla poškozují důvěru |
| 9 | Chcete **analytiku bez cookies** (Plausible ~9 €/měs. nebo Umami zdarma self-host)? | `assets/js/config.js` | Měření konverzí formulářů a testů |
| 10 | Odkaz na **rezervaci schůzky** (Cal.com / Calendly / Google Calendar booking)? | `kontakt.html` | Rychlejší domluva úvodního rozhovoru |
| 11 | Mají **Univerze** a **Viets** vlastní weby / stav vývoje? | `venture-studio.html` | Teď prezentováno jako „ve vývoji" |
| 12 | **Revize vietnamské stránky** `vi/index.html` rodilým mluvčím (např. Thuc Tuan Nguyen) — text je napsaný jednoduše a srozumitelně, ale před spuštěním by ho měl zkontrolovat rodilý mluvčí | `vi/index.html`, hlášky formuláře v `assets/js/site.js` (větev VI) | Důvěra komunity stojí na jazyce |
| 13 | **Pilotní nasazení agentů Legent AI**: podmínky pro první 3 firmy (cena, délka, reference), vzor pilotní dohody a smlouvy o zpracování osobních údajů (DPA) | `legent/agenti.html` (CTA), `legent-agents/docs/KONCEPT.md` | Web zatím jen zve k zájmu, bez konkrétní nabídky |
| 14 | **API klíč Anthropic** pro ostré testy agentů (účet organizace, limit útraty) a povolení síťového přístupu k ARES a registru plátců DPH (MF ČR) v provozním prostředí | proměnná `ANTHROPIC_API_KEY`, `LEGENT_ONLINE=1` | Bez klíče běží agenti jen v offline režimu (pravidla bez AI); parser registru DPH je ověřen jen na vzorové odpovědi |
| 15 | Má mít sada agentů **vlastní repozitář** (např. `legent-agents`)? | postup v `legent-agents/README.md` (git subtree split) | Teď je ve složce repozitáře webů, CI ji testuje samostatně |
