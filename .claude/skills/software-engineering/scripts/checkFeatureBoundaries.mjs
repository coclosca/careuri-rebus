#!/usr/bin/env node
// Phase 3: fails when one feature/domain imports another feature's internal files instead of its index.
// Usage: node checkFeatureBoundaries.mjs <repoDir> --roots src/features,src/domains [--alias @/=src/] [--allow shared]
// Exit code 1 if violations are found, so it can run as a test or in CI.
import { dirname, resolve, relative, sep, extname } from 'node:path';
import { listFiles, readText, parseArguments, CODE_EXTENSIONS } from './walkSourceFiles.mjs';

const { positional, options } = parseArguments(process.argv.slice(2));
const repositoryRoot = resolve(positional[0] || '.');
const featureRoots = String(options.roots || 'src/features').split(',').map((root) => resolve(repositoryRoot, root.trim()));
const aliasPairs = String(options.alias || '@/=src/').split(',').filter(Boolean).map((pair) => {
  const [prefix, target] = pair.split('=');
  return { prefix, target: resolve(repositoryRoot, target || '') };
});
const allowedFeatureNames = new Set(String(options.allow || 'shared').split(',').map((name) => name.trim()));
const INDEX_FILE_PATTERN = /^index\.(ts|tsx|js|jsx|mjs)$/;

const IMPORT_PATTERN = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)/g;

function featureOf(absolutePath) {
  for (const root of featureRoots) {
    const relativeToRoot = relative(root, absolutePath);
    if (!relativeToRoot.startsWith('..') && relativeToRoot !== '') {
      const [featureName, ...rest] = relativeToRoot.split(sep);
      return { root, featureName, insidePath: rest.join('/') };
    }
  }
  return null;
}

function resolveSpecifier(specifier, importingFile) {
  if (specifier.startsWith('.')) return resolve(dirname(importingFile), specifier);
  for (const { prefix, target } of aliasPairs) if (specifier.startsWith(prefix)) return resolve(target, specifier.slice(prefix.length));
  return null; // package import
}

const violations = [];
for (const filePath of listFiles(repositoryRoot, { extensions: CODE_EXTENSIONS })) {
  const importer = featureOf(filePath);
  const text = readText(filePath);
  for (const match of text.matchAll(IMPORT_PATTERN)) {
    const specifier = match[1] || match[2] || match[3];
    const targetPath = resolveSpecifier(specifier, filePath);
    if (!targetPath) continue;
    const target = featureOf(targetPath);
    if (!target || allowedFeatureNames.has(target.featureName)) continue;
    if (importer && importer.featureName === target.featureName && importer.root === target.root) continue;
    const insideWithoutExtension = target.insidePath.replace(/\.(ts|tsx|js|jsx|mjs)$/, '');
    const goesThroughFrontDoor = insideWithoutExtension === '' || insideWithoutExtension === 'index' || INDEX_FILE_PATTERN.test(target.insidePath);
    if (!goesThroughFrontDoor) {
      violations.push({
        importingFile: relative(repositoryRoot, filePath),
        importedSpecifier: specifier,
        targetFeature: target.featureName,
      });
    }
  }
}

if (options.json) console.log(JSON.stringify({ featureRoots: featureRoots.map((r) => relative(repositoryRoot, r)), violations }, null, 2));
else if (violations.length === 0) console.log(`OK - no deep cross-feature imports under ${featureRoots.map((r) => relative(repositoryRoot, r)).join(', ')}`);
else {
  console.log(`${violations.length} boundary violation(s): import the feature's index instead`);
  for (const v of violations) console.log(`- ${v.importingFile} -> ${v.importedSpecifier}  (into feature "${v.targetFeature}")`);
}
process.exit(violations.length ? 1 : 0);
