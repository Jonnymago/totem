const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const i18nPath = path.join(root, 'src/utils/i18n.ts');
let source = fs.readFileSync(i18nPath, 'utf8')
  .replace(/^import[^;]+;\s*$/gm, '')
  .replace(/const TRANSLATIONS\s*:[^=]+=/, 'const TRANSLATIONS = globalThis.__translations =')
  .replace(/const LITERAL_TRANSLATIONS\s*:[^=]+=/, 'const LITERAL_TRANSLATIONS = globalThis.__literalTranslations =');

const javascript = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const context = { exports: {}, console, globalThis: {} };
context.global = context.globalThis;
vm.runInNewContext(javascript, context, { filename: i18nPath });
const dictionaries = context.globalThis.__translations;
if (!dictionaries) throw new Error('Dizionario semantico non leggibile');

function collectFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

const keys = new Map();
for (const file of [...collectFiles(path.join(root, 'app')), ...collectFiles(path.join(root, 'src'))]) {
  const text = fs.readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  for (const match of text.matchAll(/\bt\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    const key = match[1];
    if (!keys.has(key)) keys.set(key, []);
    keys.get(key).push(path.relative(root, file));
  }
}

const languages = ['it', 'en', 'es', 'fr', 'de'];
const missing = [];
for (const [key, usedIn] of keys) {
  const absent = languages.filter((lang) => !Object.prototype.hasOwnProperty.call(dictionaries[lang] || {}, key));
  if (absent.length) missing.push({ key, absent, usedIn: [...new Set(usedIn)] });
}

if (missing.length) {
  for (const item of missing) {
    console.error(`${item.key}: manca in ${item.absent.join(', ')} (${item.usedIn.join(', ')})`);
  }
  process.exit(1);
}

console.log(`Copertura i18n semantica completa: ${keys.size} chiavi presenti in ${languages.length} lingue.`);
