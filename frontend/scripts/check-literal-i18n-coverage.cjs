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
const dictionaries = context.globalThis.__literalTranslations;
if (!dictionaries) throw new Error('Dizionario letterale non leggibile');

function collectFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}
function tagName(node) {
  if (ts.isIdentifier(node)) return node.text;
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  return '';
}
function normalise(value) {
  return value.replace(/\s+/g, ' ').trim();
}
function addText(found, value, file) {
  const text = normalise(value);
  if (text.length < 3 || !/[A-Za-zÀ-ÿ]/.test(text)) return;
  if (!found.has(text)) found.set(text, new Set());
  found.get(text).add(file);
}

const found = new Map();
for (const file of [...collectFiles(path.join(root, 'app')), ...collectFiles(path.join(root, 'src'))]) {
  const text = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const walk = (node) => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const name = tagName(opening.tagName);
      if (name === 'Text' && ts.isJsxElement(node)) {
        for (const child of node.children) {
          if (ts.isJsxText(child)) addText(found, child.text, path.relative(root, file));
          if (ts.isJsxExpression(child) && child.expression && ts.isStringLiteral(child.expression)) addText(found, child.expression.text, path.relative(root, file));
        }
      }
      if (name === 'TextInput') {
        for (const property of opening.attributes.properties) {
          if (ts.isJsxAttribute(property) && property.name.text === 'placeholder' && property.initializer) {
            if (ts.isStringLiteral(property.initializer)) addText(found, property.initializer.text, path.relative(root, file));
            if (ts.isJsxExpression(property.initializer) && property.initializer.expression && ts.isStringLiteral(property.initializer.expression)) addText(found, property.initializer.expression.text, path.relative(root, file));
          }
        }
      }
    }
    ts.forEachChild(node, walk);
  };
  walk(ast);
}

const languages = ['en', 'es', 'fr', 'de'];
const missing = [];
for (const [text, usedIn] of found) {
  const absent = languages.filter((lang) => !Object.prototype.hasOwnProperty.call(dictionaries[lang] || {}, text));
  if (absent.length) missing.push({ text, absent, usedIn: [...usedIn] });
}

if (missing.length) {
  for (const item of missing) console.error(`${JSON.stringify(item.text)}: manca in ${item.absent.join(', ')} (${item.usedIn.join(', ')})`);
  process.exit(1);
}
console.log(`Copertura i18n letterale completa: ${found.size} testi UI diretti presenti in tutte le lingue.`);
