// Registr plátců DPH (MF ČR) – status nespolehlivého plátce a zveřejněné bankovní účty.
// Webová služba SOAP „rozhraniCRPDPH“. Před ostrým nasazením ověřte strukturu proti aktuální
// dokumentaci MF ČR (https://adisspr.mfcr.cz) – parser je pokrytý testy na vzorové odpovědi.
const DPH_URL = 'https://adisrws.mfcr.cz/adistc/axis2/services/rozhraniCRPDPH.rozhraniCRPDPHSOAP';

export function buildStatusRequest(dicDigits) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:roz="http://adis.mfcr.cz/rozhraniCRPDPH/">
  <soapenv:Body>
    <roz:StatusNespolehlivyPlatceRequest><roz:dic>${dicDigits}</roz:dic></roz:StatusNespolehlivyPlatceRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
}

/** Vytáhne status a zveřejněné účty z odpovědi (tolerantně vůči prefixům jmenných prostorů). */
export function parseStatusResponse(xml) {
  const status = xml.match(/nespolehlivyPlatce="(ANO|NE|NENALEZEN)"/)?.[1] ?? null;
  const accounts = [];
  for (const m of xml.matchAll(/<(?:\w+:)?standardniUcet\b([^>]*)\/?>/g)) {
    const attr = (n) => m[1].match(new RegExp(`${n}="([^"]*)"`))?.[1];
    const number = attr('cislo'), bank = attr('kodBanky'), prefix = attr('predcisli');
    if (number && bank) accounts.push(`${prefix ? prefix + '-' : ''}${number}/${bank}`);
  }
  for (const m of xml.matchAll(/<(?:\w+:)?nestandardniUcet\b[^>]*cislo="([^"]+)"/g)) accounts.push(m[1]);
  return { status, unreliable: status === 'ANO', notFound: status === 'NENALEZEN', publishedAccounts: accounts };
}

export async function checkVatPayer(dic, { fetchImpl = fetch, timeoutMs = 8000 } = {}) {
  const digits = String(dic).replace(/^CZ/i, '');
  const res = await fetchImpl(DPH_URL, {
    method: 'POST',
    headers: { 'content-type': 'text/xml; charset=utf-8', soapaction: 'getStatusNespolehlivyPlatce' },
    body: buildStatusRequest(digits),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Registr plátců DPH odpověděl ${res.status}`);
  return parseStatusResponse(await res.text());
}

/** Je účet mezi zveřejněnými? (porovnání bez úvodních nul a mezer) */
export { isPublishedAccount } from '../validators/cz.js';
