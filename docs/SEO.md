# SEO & GEO — mapa klíčových slov a stav

Každá stránka cílí na jedno hlavní téma (bez kanibalizace). Klíčové slovo je v `<title>`, `<h1>`
nebo prvním odstavci, v meta popisku a v URL.

## Legacy Enterprises (legacyenterprises.cz)

| Hlavní klíčové slovo / záměr | Stránka | Doplňková slova |
|---|---|---|
| příprava firmy na prodej | `exit-readiness.html` | exit readiness, pre-exit poradenství, Quality of Earnings, ceník |
| prodej firmy (postup) | `insights/checklist-prodej-firmy.html` | checklist prodeje firmy, jak prodat firmu, due diligence |
| ocenění firmy / hodnota firmy | `insights/jak-se-ocenuje-mala-firma.html` | násobek EBITDA, normalizovaná EBITDA, čistý dluh |
| kalkulačka hodnoty firmy | `kalkulacka.html` | kolik je firma hodna, orientační ocenění |
| test připravenosti na prodej | `exit-test.html` | exit readiness test, je firma připravená na prodej |
| nástupnictví v rodinné firmě | `insights/nastupnictvi-v-rodinne-firme.html` | generační výměna, předání firmy dětem, management buy-out |
| koupě firmy | `kupci.html` | koupit firmu, ETA, search fond, akvizice malé firmy |
| M&A poradenství pro MSP (brand) | `index.html` | Legacy Enterprises, prodej firem MSP, Praha |
| Univerze, Viets (brand) | `venture-studio.html` | komunitní platforma, vietnamská komunita podnikání |

## Legent AI (legent.ai)

| Hlavní klíčové slovo / záměr | Stránka | Doplňková slova |
|---|---|---|
| AI agenti pro firmy (brand) | `legent/index.html` | AI automatizace, AI pro malé firmy, Legent AI |
| implementace AI / cena | `legent/sluzby.html` | AI audit, AI implementace, správa AI, školení AI |
| AI podle oboru | `legent/reseni.html` | AI pro účetní kanceláře, servis, gastronomii, autoservis, e-shop, výrobu |
| AI readiness / připravenost na AI | `legent/ai-audit.html` | AI audit zdarma, digitalizace firmy |
| návratnost AI / ROI automatizace | `legent/roi.html` | úspora času AI, kalkulačka ROI |

## Technické SEO (ověřováno `npm test` + Lighthouse)

- Unikátní `title` (≤ 65 znaků) a `meta description` (110–165 znaků) na každé stránce
- `canonical` = `og:url` = adresa v `sitemap.xml`; `robots.txt` odkazuje na sitemapu
- Jeden `<h1>`, nadpisy bez přeskakování úrovní, žádné osiřelé stránky
- JSON-LD: Organization, ProfessionalService/Service + ceny, FAQPage, Article, HowTo, WebApplication, Person, BreadcrumbList
- OG obrázky 1200×630 pro sdílení (úvod, nástroje, insights, Legent)
- Rychlost: Lighthouse mobil 96–100, CLS 0, žádné externí požadavky
- GEO (AI vyhledávače): `llms.txt`, povolené AI crawlery, FAQ bloky s přímými odpověďmi, zdrojovaná čísla

## Obsahový plán (další články — doporučení)

1. Earn-out, zádržné a vendor financing: jak se platí za firmu (kupci + prodávající)
2. Quality of Earnings v praxi: 10 nejčastějších úprav EBITDA
3. ETA v Česku: jak koupit první firmu (financování, hledání, chyby)
4. Prodej podílu vs. prodej obchodního závodu — daňové a právní rozdíly (se spolupracujícím daňovým poradcem)
5. Legent: AI pro účetní kanceláře — případová studie po prvním nasazení (s reálnými čísly)
6. Legent: AI Act pro malé firmy — co se vás týká a co ne (s právníkem)

Každý nový článek: kopie existujícího v `insights/`, karta v `insights/index.html`, odkaz v `llms.txt`,
`npm run build` (aktualizuje sitemapu), `npm test`.
