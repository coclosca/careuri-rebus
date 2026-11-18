#!/usr/bin/env node
// Phase 1 audit: a factual map of the repo to base the Preservation List and Problem Areas on.
// Usage: node inventory.mjs <repoDir> [--top 25] [--json]
import { extname, basename, dirname, sep } from 'node:path';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { listFiles, readText, toRelative, parseArguments, CODE_EXTENSIONS, STYLE_EXTENSIONS } from './walkSourceFiles.mjs';

const { positional, options } = parseArguments(process.argv.slice(2));
const repositoryRoot = positional[0] || '.';
const topCount = Number(options.top || 25);

const VAGUE_NAME_PATTERN = /(^|[\/._-])(utils?|helpers?|common|misc|stuff|manager|handlers?|data|lib2|temp|tmp|old|new|final|copy|backup)([\/._-]|$)/i;
const TYPE_FOLDER_NAMES = new Set(['utils', 'util', 'helpers', 'helper', 'common', 'misc', 'components', 'hooks', 'services', 'types', 'lib', 'shared']);
const RAW_COLOR_PATTERN = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;
const INLINE_STYLE_PATTERN = /style=\{\{/g;
const MAGIC_PIXEL_PATTERN = /\b\d{2,4}px\b/g;
const COMMENTED_CODE_PATTERN = /^\s*(\/\/|#)\s*(const|let|var|function|return|import|export|if|for|await|def|class)\b/;

const allFiles = listFiles(repositoryRoot);
const codeFiles = allFiles.filter((file) => CODE_EXTENSIONS.has(extname(file)));
const styleFiles = allFiles.filter((file) => STYLE_EXTENSIONS.has(extname(file)));

const fileMetrics = [];
const vagueNames = [];
const directoryFileCounts = new Map();
let rawColorTotal = 0, inlineStyleTotal = 0, magicPixelTotal = 0, commentedCodeTotal = 0;
const commentedCodeByFile = [];

for (const filePath of [...codeFiles, ...styleFiles]) {
  const relativePath = toRelative(repositoryRoot, filePath);
  const text = readText(filePath);
  const lines = text.split('\n');
  const exportCount = (text.match(/^export\s/gm) || []).length;
  const rawColors = (text.match(RAW_COLOR_PATTERN) || []).length;
  const inlineStyles = (text.match(INLINE_STYLE_PATTERN) || []).length;
  const magicPixels = (text.match(MAGIC_PIXEL_PATTERN) || []).length;
  let commentedCodeLines = 0;
  for (const line of lines) if (COMMENTED_CODE_PATTERN.test(line)) commentedCodeLines++;
  rawColorTotal += rawColors; inlineStyleTotal += inlineStyles; magicPixelTotal += magicPixels; commentedCodeTotal += commentedCodeLines;
  if (commentedCodeLines >= 5) commentedCodeByFile.push({ relativePath, commentedCodeLines });
  fileMetrics.push({ relativePath, lineCount: lines.length, exportCount, rawColors, inlineStyles, magicPixels });
  if (VAGUE_NAME_PATTERN.test(relativePath)) vagueNames.push(relativePath);
  const directory = dirname(relativePath);
  directoryFileCounts.set(directory, (directoryFileCounts.get(directory) || 0) + 1);
}

const typeFolders = [...directoryFileCounts.entries()]
  .filter(([directory]) => TYPE_FOLDER_NAMES.has(basename(directory).toLowerCase()))
  .sort((first, second) => second[1] - first[1]);

const detectedStack = [];
const has = (name) => existsSync(join(repositoryRoot, name));
if (has('package.json')) {
  const packageJson = JSON.parse(readText(join(repositoryRoot, 'package.json')) || '{}');
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  for (const name of ['next', 'react', 'vite', 'vue', 'svelte', 'astro', 'express', 'fastify', 'hono', 'tailwindcss', 'drizzle-orm', 'prisma', 'vitest', 'jest', 'eslint', 'typescript'])
    if (dependencies?.[name]) detectedStack.push(`${name}@${dependencies[name]}`);
  detectedStack.push(`scripts: ${Object.keys(packageJson.scripts || {}).join(', ') || '(none)'}`);
  if (packageJson.workspaces) detectedStack.push(`workspaces: ${JSON.stringify(packageJson.workspaces)}`);
}
for (const marker of ['pnpm-workspace.yaml', 'turbo.json', 'tsconfig.json', 'pyproject.toml', 'requirements.txt', 'Dockerfile', 'docker-compose.yml', 'Caddyfile', 'ecosystem.config.js', 'app', 'pages', 'src/app', 'src/pages', 'middleware.ts', 'src/middleware.ts'])
  if (has(marker)) detectedStack.push(`has ${marker}`);

const report = {
  repositoryRoot,
  totals: {
    codeFiles: codeFiles.length,
    styleFiles: styleFiles.length,
    codeLines: fileMetrics.filter((m) => CODE_EXTENSIONS.has(extname(m.relativePath))).reduce((sum, m) => sum + m.lineCount, 0),
    styleLines: fileMetrics.filter((m) => STYLE_EXTENSIONS.has(extname(m.relativePath))).reduce((sum, m) => sum + m.lineCount, 0),
    rawColorValues: rawColorTotal,
    inlineStyleObjects: inlineStyleTotal,
    magicPixelValues: magicPixelTotal,
    commentedCodeLines: commentedCodeTotal,
  },
  detectedStack,
  largestFiles: [...fileMetrics].sort((a, b) => b.lineCount - a.lineCount).slice(0, topCount),
  mostExports: [...fileMetrics].sort((a, b) => b.exportCount - a.exportCount).filter((m) => m.exportCount >= 10).slice(0, topCount),
  mostRawStyleValues: [...fileMetrics].map((m) => ({ ...m, styleDebt: m.rawColors + m.inlineStyles + m.magicPixels }))
    .filter((m) => m.styleDebt > 0).sort((a, b) => b.styleDebt - a.styleDebt).slice(0, topCount),
  vagueNames: vagueNames.slice(0, 200),
  typeFolders: typeFolders.map(([directory, fileCount]) => ({ directory, fileCount })),
  commentedCodeHotspots: commentedCodeByFile.sort((a, b) => b.commentedCodeLines - a.commentedCodeLines).slice(0, topCount),
};

if (options.json) { console.log(JSON.stringify(report, null, 2)); process.exit(0); }

const printTable = (title, rows, columns) => {
  console.log(`\n## ${title}`);
  if (!rows.length) { console.log('(none)'); return; }
  console.log(`| ${columns.join(' | ')} |\n|${columns.map(() => '---').join('|')}|`);
  for (const row of rows) console.log(`| ${columns.map((c) => row[c]).join(' | ')} |`);
};
console.log(`# Inventory of ${repositoryRoot}`);
console.log('\n## Totals'); for (const [key, value] of Object.entries(report.totals)) console.log(`- ${key}: ${value}`);
console.log('\n## Stack'); for (const line of detectedStack) console.log(`- ${line}`);
printTable(`Largest files (top ${topCount})`, report.largestFiles, ['relativePath', 'lineCount', 'exportCount']);
printTable('Files with 10+ exports', report.mostExports, ['relativePath', 'exportCount', 'lineCount']);
printTable('Style debt (raw colors / inline styles / magic px)', report.mostRawStyleValues, ['relativePath', 'rawColors', 'inlineStyles', 'magicPixels']);
printTable('Generic type folders', report.typeFolders, ['directory', 'fileCount']);
console.log(`\n## Vague names (${vagueNames.length})`); for (const name of report.vagueNames) console.log(`- ${name}`);
printTable('Commented-out code hotspots (5+ lines)', report.commentedCodeHotspots, ['relativePath', 'commentedCodeLines']);
