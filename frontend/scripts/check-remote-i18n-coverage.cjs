const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const remotePath = path.resolve(__dirname, '../../backend/static/remote/index.html');
const html = fs.readFileSync(remotePath, 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/i);
if (!scriptMatch) throw new Error('Script remoto non trovato');
const script = ts.createSourceFile('remote.js', scriptMatch[1], ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const context = { console };
let dictionary = null;

for (const statement of script.statements) {
  if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === 'REMOTE_I18N' && declaration.initializer) {
        dictionary = vm.runInNewContext(`(${declaration.initializer.getText(script)})`, context);
      }
    }
  }
}
if (!dictionary) throw new Error('Dizionario REMOTE_I18N non leggibile');
for (const statement of script.statements) {
  if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) continue;
  const call = statement.expression;
  if (!ts.isPropertyAccessExpression(call.expression) || call.expression.expression.getText(script) !== 'Object' || call.expression.name.text !== 'assign') continue;
  if (call.arguments.length !== 2 || call.arguments[0].getText(script) !== 'REMOTE_I18N') continue;
  const extension = vm.runInNewContext(`(${call.arguments[1].getText(script)})`, context);
  Object.assign(dictionary, extension);
}

const staticHtml = html.slice(0, html.indexOf('<script>')).replace(/<style[\s\S]*?<\/style>/gi, '');
const entities = { '&apos;': "'", '&quot;': '"', '&amp;': '&', '&lt;': '<', '&gt;': '>' };
const decode = (text) => text.replace(/&(apos|quot|amp|lt|gt);/g, (entity) => entities[entity] || entity).replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
const textNodes = new Set();
const withoutTags = staticHtml.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '\n');
for (const raw of withoutTags.split('\n')) {
  const text = decode(raw).replace(/\s+/g, ' ').trim();
  if (text.length >= 2 && /[A-Za-zÀ-ÿ]/.test(text)) textNodes.add(text);
}
const langs = ['en', 'es', 'fr', 'de'];
const missing = [];
for (const text of textNodes) {
  const absent = langs.filter((lang) => !dictionary[text] || typeof dictionary[text][lang] !== 'string' || !dictionary[text][lang].trim());
  if (absent.length) missing.push({ text, absent });
}
if (missing.length) {
  missing.forEach(({ text, absent }) => console.error(`${JSON.stringify(text)}: manca in ${absent.join(', ')}`));
  process.exit(1);
}
console.log(`Copertura i18n remota completa: ${textNodes.size} testi statici renderizzabili presenti in tutte le lingue.`);
