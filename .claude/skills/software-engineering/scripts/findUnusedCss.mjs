#!/usr/bin/env node
// Phase 2/4: CSS classes and custom properties (tokens) that are defined but never referenced.
// Usage: node findUnusedCss.mjs <repoDir> [--json]
// Evidence only - string-built class names and classes stored in DB/CMS are reported as "maybe dynamic", never as safe.
import { extname } from 'node:path';
import { listFiles, readText, toRelative, parseArguments, CODE_EXTENSIONS, STYLE_EXTENSIONS, MARKUP_EXTENSIONS } from './walkSourceFiles.mjs';

const { positional, options } = parseArguments(process.argv.slice(2));
const repositoryRoot = positional[0] || '.';

const allFiles = listFiles(repositoryRoot);
const styleFiles = allFiles.filter((f) => STYLE_EXTENSIONS.has(extname(f)));
const usageFiles = allFiles.filter((f) => CODE_EXTENSIONS.has(extname(f)) || MARKUP_EXTENSIONS.has(extname(f)) || STYLE_EXTENSIONS.has(extname(f)));

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const classDefinitions = new Map();     // className -> Set(files)
const propertyDefinitions = new Map();  // --token -> Set(files)

for (const styleFile of styleFiles) {
  const css = stripComments(readText(styleFile));
  const relativePath = toRelative(repositoryRoot, styleFile);
  // Selectors only: text before "{" blocks, skipping @-rule params.
  for (const selectorMatch of css.matchAll(/([^{}]+)\{/g)) {
    const selector = selectorMatch[1];
    if (selector.trim().startsWith('@')) continue;
    for (const classMatch of selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
      const className = classMatch[1];
      if (/^\d/.test(className)) continue;
      if (!classDefinitions.has(className)) classDefinitions.set(className, new Set());
      classDefinitions.get(className).add(relativePath);
    }
  }
  for (const propertyMatch of css.matchAll(/(--[\w-]+)\s*:/g)) {
    const propertyName = propertyMatch[1];
    if (!propertyDefinitions.has(propertyName)) propertyDefinitions.set(propertyName, new Set());
    propertyDefinitions.get(propertyName).add(relativePath);
  }
}

// Build usage corpora.
let codeCorpus = '';
let styleCorpusWithoutDefinitions = '';
const dynamicClassPrefixes = new Set();
for (const usageFile of usageFiles) {
  const text = readText(usageFile);
  if (STYLE_EXTENSIONS.has(extname(usageFile))) {
    styleCorpusWithoutDefinitions += '\n' + stripComments(text).replace(/(--[\w-]+)\s*:/g, ':');
  } else {
    codeCorpus += '\n' + text;
    // `prefix-${x}` / 'prefix-' + x  -> any class starting with prefix- may be built at runtime
    for (const m of text.matchAll(/[`'"]([a-zA-Z][\w-]*-)\$\{/g)) dynamicClassPrefixes.add(m[1]);
    for (const m of text.matchAll(/[`'"]([a-zA-Z][\w-]*-)[`'"]\s*\+/g)) dynamicClassPrefixes.add(m[1]);
  }
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isWordUsed = (word, corpus) => new RegExp(`(^|[^\\w-])${escapeRegExp(word)}([^\\w-]|$)`).test(corpus);

const unusedClasses = [], maybeDynamicClasses = [];
for (const [className, definedIn] of classDefinitions) {
  if (isWordUsed(className, codeCorpus)) continue;
  // Used by another selector composition such as @apply or :is(.x) in CSS counts as CSS-internal only.
  const prefix = [...dynamicClassPrefixes].find((p) => className.startsWith(p));
  const row = { name: `.${className}`, definedIn: [...definedIn].join(', ') };
  if (prefix) maybeDynamicClasses.push({ ...row, matchesDynamicPrefix: prefix });
  else unusedClasses.push(row);
}

const unusedProperties = [], cssOnlyProperties = [];
for (const [propertyName, definedIn] of propertyDefinitions) {
  const usedInStyles = styleCorpusWithoutDefinitions.includes(`var(${propertyName}`);
  const usedInCode = codeCorpus.includes(propertyName);
  if (!usedInStyles && !usedInCode) unusedProperties.push({ name: propertyName, definedIn: [...definedIn].join(', ') });
  else if (!usedInCode && usedInStyles) cssOnlyProperties.push(propertyName);
}

const report = {
  stats: { styleFiles: styleFiles.length, classesDefined: classDefinitions.size, customPropertiesDefined: propertyDefinitions.size },
  unusedClasses, maybeDynamicClasses, unusedCustomProperties: unusedProperties,
  dynamicClassPrefixesSeen: [...dynamicClassPrefixes],
  caveats: [
    'Classes may also come from DB/CMS content, emails, third-party widgets or markdown - grep those before removing.',
    'Tailwind utility classes are generated, not defined here; use the Tailwind content config instead.',
    'Unused custom properties may be read by JS via getComputedStyle or set inline - check before removing.',
  ],
};

if (options.json) { console.log(JSON.stringify(report, null, 2)); process.exit(0); }
console.log(`# Unused CSS in ${repositoryRoot}`);
console.log(`style files ${report.stats.styleFiles}, classes ${report.stats.classesDefined}, custom properties ${report.stats.customPropertiesDefined}`);
const list = (title, rows, extra = '') => {
  console.log(`\n## ${title} (${rows.length})`);
  for (const row of rows) console.log(`- ${row.name}  <- ${row.definedIn}${row[extra] ? `  [prefix ${row[extra]}]` : ''}`);
};
list('Unused classes (no reference in code/markup)', unusedClasses);
list('Maybe dynamic (matches a string-built prefix) - do NOT remove without checking', maybeDynamicClasses, 'matchesDynamicPrefix');
list('Unused custom properties / tokens', unusedProperties);
console.log('\n## Caveats'); for (const caveat of report.caveats) console.log(`- ${caveat}`);
