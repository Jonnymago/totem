const fs = require('fs');
const path = require('path');

const bundlePath = path.resolve(__dirname, '../src/utils/web_build.json');
const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
const asset = bundle['/remote/index.html'];
if (!asset) throw new Error('Asset /remote/index.html assente dal bundle');
const html = asset.type === 'base64'
  ? Buffer.from(asset.data, 'base64').toString('utf8')
  : String(asset.data || '');
const expected = [
  'moveProductOrder',
  '/admin/products/${id}/move',
  'id="tab-license"',
  'Modalità Totem Protetta (Kiosk + Schermo Intero)',
  'retainRemoteImages',
  'remoteImageMarkup',
  'moveGroupOrder',
  'REMOTE_SETTINGS_KIOSK_MIGRATION',
  'loadKioskSettings',
  'autoReturnHomeOnInactivity',
  'Ingredienti',
  'sessionStorage.setItem(\'totem_sess\'',
];
const missing = expected.filter((value) => !html.includes(value));
if (missing.length) throw new Error(`Bundle remoto incompleto: ${missing.join(', ')}`);
const forbidden = [
  ['tab Kiosk', /id="tab-kiosk"/],
  ['navigazione Kiosk', /switchTab\('kiosk'\)/],
  ['renderer tab Kiosk', /function renderKioskTab\s*\(/],
  ['azioni hardware Kiosk', /onclick="triggerKioskRemoteAction\(/],
  ['card azioni/test hardware', /<div class="card-title">[^<]*Azioni & Test Hardware/],
  ['credenziali amministratore predefinite', /admin123/],
  ['token remoto in localStorage', /localStorage\.(?:setItem|getItem|removeItem)\(\'totem_sess\'/],
  ['campi segreti nelle impostazioni remote', /id="set-(?:pin|admin-user|admin-pass)"/],
  ['credenziali in query string', /[?&](?:password|pin)=/],
];
const present = forbidden.filter(([, pattern]) => pattern.test(html)).map(([label]) => label);
if (present.length) throw new Error(`Bundle remoto contiene elementi Kiosk obsoleti: ${present.join(', ')}`);
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .filter((source) => source.trim());
if (!inlineScripts.length) throw new Error('Nessuno script inline presente nel pannello remoto');
inlineScripts.forEach((source, index) => {
  try {
    new Function(source);
  } catch (error) {
    throw new Error(`Errore sintassi script remoto #${index + 1}: ${error.message}`);
  }
});
console.log('Bundle remoto verificato:', expected.join(', '), `(${inlineScripts.length} script inline validati)`);
