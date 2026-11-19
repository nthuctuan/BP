// Načte Playwright: lokální instalaci (CI: npm i -D playwright) nebo globální předinstalovanou.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = await import('playwright'); }
export const chromium = pw.chromium;
export const devices = pw.devices;
