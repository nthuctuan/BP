// Funkční testy interaktivních prvků. Každý test se spustí jen pokud daná stránka existuje.
export default async function functional({ browser, base, fail, pages }) {
  const has = (p) => pages.includes(p);
  const run = async (name, page, fn, opts = {}) => {
    if (!has(page)) return;
    const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', (e) => errs.push(e.message));
    try {
      await pg.goto(base + page, { waitUntil: 'load' });
      await fn(pg);
    } catch (e) {
      fail(page, `funkční test „${name}": ${e.message.split('\n')[0]}`);
    }
    errs.forEach((e) => fail(page, `funkční test „${name}" JS chyba: ${e}`));
    await ctx.close();
  };
  const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

  // Přepínač tématu + uložení preference
  await run('přepínač tématu', 'index.html', async (pg) => {
    const before = await pg.getAttribute('html', 'data-theme');
    await pg.click('[data-theme-toggle]');
    const after = await pg.getAttribute('html', 'data-theme');
    expect(before !== after, 'téma se nepřeplo');
    await pg.reload();
    expect((await pg.getAttribute('html', 'data-theme')) === after, 'preference se neuložila');
  });

  // Mobilní menu
  await run('mobilní menu', 'index.html', async (pg) => {
    const btn = pg.locator('.menu-btn');
    expect(await btn.isVisible(), 'tlačítko menu není vidět');
    await btn.click();
    expect(await pg.locator('#mobile-menu').isVisible(), 'menu se neotevřelo');
    expect((await btn.getAttribute('aria-expanded')) === 'true', 'aria-expanded není true');
    await pg.keyboard.press('Escape');
    expect(!(await pg.locator('#mobile-menu').isVisible()), 'Escape menu nezavřel');
  }, { viewport: { width: 390, height: 844 } });

  // Validace formuláře waiting listu + mailto fallback
  await run('waiting list formulář', 'index.html', async (pg) => {
    await pg.click('#waitlist button[type="submit"]');
    expect((await pg.getAttribute('#wl-email', 'aria-invalid')) === 'true', 'prázdný e-mail neoznačen jako chybný');
    await pg.fill('#wl-email', 'test@example.com');
    await pg.check('#wl-consent');
    let mailto = null;
    pg.on('request', (r) => { if (r.url().startsWith('mailto:')) mailto = r.url(); });
    await pg.evaluate(() => { window.__nav = null; });
    await pg.click('#waitlist button[type="submit"]');
    await pg.waitForTimeout(200);
    const status = await pg.locator('#waitlist .form-status').innerText();
    expect(/e-mailový program|Zápis přijat/.test(status), `nečekaný stav: ${status}`);
  });

  // Kontaktní formulář
  await run('kontaktní formulář', 'kontakt.html', async (pg) => {
    await pg.click('#contact-form button[type="submit"]');
    const invalid = await pg.locator('#contact-form [aria-invalid="true"]').count();
    expect(invalid >= 3, `očekávány chyby validace, nalezeno ${invalid}`);
    await pg.fill('#cf-name', 'Jan Test');
    await pg.fill('#cf-email', 'jan@example.com');
    await pg.fill('#cf-message', 'Dobrý den, zajímá mě příprava firmy na prodej.');
    await pg.check('#cf-consent');
    await pg.click('#contact-form button[type="submit"]');
    await pg.waitForTimeout(200);
    const status = await pg.locator('#contact-form .form-status').innerText();
    expect(/e-mailový program|Děkujeme/.test(status), `nečekaný stav: ${status}`);
  });

  // Exit test
  await run('exit test', 'exit-test.html', async (pg) => {
    await pg.click('[data-quiz-start]');
    for (let i = 0; i < 40; i++) {
      if (await pg.locator('[data-quiz-result]').isVisible()) break;
      await pg.locator('.q-opt').nth(2).click();
      await pg.click('[data-quiz-next]');
    }
    expect(await pg.locator('[data-quiz-result]').isVisible(), 'výsledek se nezobrazil');
    const score = Number(await pg.locator('[data-score]').first().textContent());
    expect(score >= 0 && score <= 100, `skóre mimo rozsah: ${score}`);
  });

  // Legent: AI audit
  await run('AI audit', 'legent/ai-audit.html', async (pg) => {
    await pg.click('[data-quiz-start]');
    for (let i = 0; i < 30; i++) {
      if (await pg.locator('[data-quiz-result]').isVisible()) break;
      await pg.locator('.q-opt').nth(1).click();
      await pg.click('[data-quiz-next]');
    }
    expect(await pg.locator('[data-quiz-result]').isVisible(), 'výsledek se nezobrazil');
    const score = Number(await pg.locator('[data-score]').first().textContent());
    expect(score >= 0 && score <= 100, `skóre mimo rozsah: ${score}`);
    expect((await pg.locator('[data-recs] li').count()) >= 3, 'chybí doporučení');
  });

  // Kalkulačka
  await run('kalkulačka', 'kalkulacka.html', async (pg) => {
    const v1 = await pg.locator('[data-out="mid"]').innerText();
    await pg.locator('#c-ebitda').fill('9000000');
    await pg.locator('#c-ebitda').dispatchEvent('input');
    const v2 = await pg.locator('[data-out="mid"]').innerText();
    expect(v1 !== v2, 'výsledek se nezměnil po změně EBITDA');
    expect(/Kč/.test(v2), `výstup bez měny: ${v2}`);
  });
}
