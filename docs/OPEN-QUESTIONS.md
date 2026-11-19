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
| 8 | **Zdroje statistik** (38 % ČSÚ 2024, 72 % AMSP 2024, +20–40 % Pepperdine 2022) – máte konkrétní odkazy/studie? | `index.html` | Ověřuji, ale neověřitelné údaje je lepší zmírnit |
| 9 | Chcete **analytiku bez cookies** (Plausible ~9 €/měs. nebo Umami zdarma self-host)? | `assets/js/config.js` | Měření konverzí formulářů a testů |
| 10 | Odkaz na **rezervaci schůzky** (Cal.com / Calendly / Google Calendar booking)? | `kontakt.html` | Rychlejší domluva úvodního rozhovoru |
| 11 | Mají **Univerze** a **Viets** vlastní weby / stav vývoje? | `venture-studio.html` | Teď prezentováno jako „ve vývoji" |
