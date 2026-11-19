/* ================================================================
   KONFIGURACE WEBU — jediné místo, které je potřeba upravit
   ================================================================
   forms.provider:
     'mailto'  – výchozí; formulář otevře e-mail s předvyplněnou zprávou (funguje vždy, bez serveru)
     'json'    – POST JSON na forms.endpoint (Formspree: https://formspree.io/f/XXXX,
                 Web3Forms: https://api.web3forms.com/submit + extra.access_key, vlastní API…)
     'netlify' – Netlify Forms (při hostování na Netlify, endpoint se nevyplňuje)
   analytics: volitelná analytika bez cookies (nevyžaduje cookie lištu)
     { provider: 'plausible', domain: 'legacyenterprises.cz' }
     { provider: 'umami', src: 'https://…/script.js', websiteId: '…' }
   ================================================================ */
window.SITE_CONFIG = {
  email: 'contact@legacyenterprises.cz',
  forms: {
    provider: 'mailto',
    endpoint: '',
    extra: {}
  },
  analytics: null
};
