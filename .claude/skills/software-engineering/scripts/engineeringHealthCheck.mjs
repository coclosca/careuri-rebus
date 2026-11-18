#!/usr/bin/env node
// Phase 1: facts for the 8-pillar Engineering Health Report
// (architecture, clean code, tests, modular design, security, scalability, documentation, monitoring & logs).
// Heuristic grep-level evidence - every hit must be read and confirmed before it goes in a table.
// Usage: node engineeringHealthCheck.mjs <repoDir> [--features src/features,src/domains] [--json]
import { extname, dirname, basename, join, relative, sep } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';
import { listFiles, readText, toRelative, parseArguments, CODE_EXTENSIONS } from './walkSourceFiles.mjs';

const { positional, options } = parseArguments(process.argv.slice(2));
const repositoryRoot = positional[0] || '.';
const featureRoots = options.features ? String(options.features).split(',') : [];

const files = listFiles(repositoryRoot).filter((f) => CODE_EXTENSIONS.has(extname(f)));
const isTestFile = (path) => /(\.|_)(test|spec)\.|__tests__|(^|\/)tests?(\/|\.)|(^|\/)(test|spec)s?\.[cm]?[jt]sx?$|(^|\/)test-[\w-]+\.[cm]?[jt]sx?$/.test(path);
const sourceFiles = files.filter((f) => !isTestFile(toRelative(repositoryRoot, f)));
const testFiles = files.filter((f) => isTestFile(toRelative(repositoryRoot, f)));

// Each check: pillar, label, regex, severity. Hits are counted per file with first line numbers.
const CHECKS = [
  // Security
  { pillar: 'security', label: 'possible hard-coded secret', severity: 'high', pattern: /(api[_-]?key|secret|password|passwd|token|private[_-]?key)\s*[:=]\s*['"`][^'"`\s]{8,}['"`]/i },
  { pillar: 'security', label: 'live key / credential literal', severity: 'high', pattern: /\b(sk_live_[\w]{10,}|AKIA[0-9A-Z]{16}|ghp_[\w]{20,}|xox[bp]-[\w-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY)/ },
  { pillar: 'security', label: 'SQL built by string concatenation/template', severity: 'high', pattern: /(query|execute|raw|sql)\s*\(\s*[`'"][^`'"]*(select|insert|update|delete)\b[^`'"]*(\$\{|['"]\s*\+)/i },
  { pillar: 'security', label: 'eval / new Function', severity: 'high', pattern: /\beval\s*\(|new\s+Function\s*\(/ },
  { pillar: 'security', label: 'raw HTML injection', severity: 'medium', pattern: /dangerouslySetInnerHTML|\.innerHTML\s*=|v-html=/ },
  { pillar: 'security', label: 'TLS verification disabled', severity: 'high', pattern: /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED|verify\s*=\s*False/ },
  { pillar: 'security', label: 'hard-coded IP address', severity: 'medium', pattern: /\b(?!127\.0\.0\.1|0\.0\.0\.0)(\d{1,3}\.){3}\d{1,3}\b/ },
  // Clean code / hard-coded values
  { pillar: 'cleanCode', label: 'hard-coded URL (should be config)', severity: 'low', pattern: /['"`]https?:\/\/(?!localhost|127\.0\.0\.1|schemas\.|www\.w3\.org)[^'"`\s]+['"`]/ },
  { pillar: 'cleanCode', label: 'TODO / FIXME / HACK', severity: 'low', pattern: /\b(TODO|FIXME|HACK|XXX)\b/ },
  { pillar: 'cleanCode', label: '`any` type', severity: 'low', pattern: /:\s*any\b|as\s+any\b|<any>/ },
  { pillar: 'cleanCode', label: 'ts-ignore / eslint-disable', severity: 'low', pattern: /@ts-ignore|@ts-nocheck|eslint-disable(?!-next-line\s+no-console)/ },
  // Monitoring & logs
  { pillar: 'monitoring', label: 'empty catch (swallowed error)', severity: 'high', pattern: /catch\s*(\([^)]*\))?\s*\{\s*\}|\.catch\(\s*\(\s*\)\s*=>\s*(\{\s*\}|undefined|null)\s*\)/ },
  { pillar: 'monitoring', label: 'console.log left in source', severity: 'low', pattern: /\bconsole\.log\(/ },
  // Scalability
  { pillar: 'scalability', label: 'SELECT without LIMIT (check if unbounded)', severity: 'medium', pattern: /select\s[^;`'"]*\sfrom\s(?![^;`'"]*\blimit\b)[^;`'"]*[`'"]/i },
  { pillar: 'scalability', label: 'await inside loop (possible N+1)', severity: 'medium', pattern: /for\s*\([^)]*\)\s*\{[^}]*\bawait\s|\.forEach\(\s*async/ },
  { pillar: 'scalability', label: 'synchronous fs in request path', severity: 'low', pattern: /\b(readFileSync|writeFileSync|execSync)\(/ },
  // Contracts & type safety
  { pillar: 'typeSafety', label: 'loose equality == / != (implicit coercion)', severity: 'low', pattern: /[^=!<>]==[^=]|!=[^=]/ },
  { pillar: 'typeSafety', label: 'double cast (as unknown as)', severity: 'medium', pattern: /as\s+unknown\s+as\s/ },
  { pillar: 'typeSafety', label: 'request body/JSON used without schema (check)', severity: 'medium', pattern: /(await\s+\w+\.json\(\)|req\.body|request\.body|JSON\.parse\()(?![^;]*\.(parse|safeParse)\()/ },
  // Performance & memory
  { pillar: 'performance', label: 'whole-library import (blocks tree-shaking)', severity: 'low', pattern: /import\s+\*\s+as\s+\w+\s+from\s+['"](lodash|moment|date-fns|rxjs|@mui\/material|@mui\/icons-material|lucide-react|react-icons)['"]|import\s+\w+\s+from\s+['"](lodash|moment)['"]/ },
];

// Resources opened in a file but never released in the same file (heuristic count match).
const CLEANUP_PAIRS = [
  { label: 'addEventListener without removeEventListener/AbortController', open: /addEventListener\(/g, close: /removeEventListener\(|signal\s*:|AbortController/g },
  { label: 'setInterval without clearInterval', open: /setInterval\(/g, close: /clearInterval\(/g },
  { label: 'WebSocket/EventSource without close()', open: /new\s+(WebSocket|EventSource)\(/g, close: /\.close\(\)/g },
  { label: 'subscribe without unsubscribe', open: /\.subscribe\(/g, close: /unsubscribe|\.off\(|removeListener/g },
  { label: '.on( listener without .off(/removeListener', open: /\.\s*on\(\s*['"]/g, close: /\.off\(|removeListener|removeAllListeners|\.once\(/g },
];
const leakSuspects = [];
// Feature modules that import heavy UI libraries statically (candidates for lazy loading).
const HEAVY_LIBRARIES = /from\s+['"](recharts|chart\.js|react-chartjs-2|echarts|monaco-editor|@monaco-editor\/react|@tiptap\/[\w-]+|quill|react-quill|three|mapbox-gl|leaflet|pdfjs-dist|xlsx|exceljs)['"]/;
const heavyStaticImports = [];

const hitsByCheck = new Map(CHECKS.map((c) => [c.label, []]));
for (const filePath of sourceFiles) {
  const relativePath = toRelative(repositoryRoot, filePath);
  const lines = readText(filePath).split('\n');
  for (const check of CHECKS) {
    const lineNumbers = [];
    lines.forEach((line, index) => { if (check.pattern.test(line)) lineNumbers.push(index + 1); });
    if (lineNumbers.length) hitsByCheck.get(check.label).push({ file: relativePath, lines: lineNumbers.slice(0, 5), count: lineNumbers.length });
  }
  const fileText = lines.join('\n');
  for (const pair of CLEANUP_PAIRS) {
    const opened = (fileText.match(pair.open) || []).length;
    const closed = (fileText.match(pair.close) || []).length;
    if (opened > closed) leakSuspects.push({ file: relativePath, issue: pair.label, opened, closed });
  }
  const heavyMatch = fileText.match(HEAVY_LIBRARIES);
  if (heavyMatch && !/dynamic\(|React\.lazy|lazy\(/.test(fileText)) heavyStaticImports.push({ file: relativePath, library: heavyMatch[1] });
}

// Tests: which source folders have no test next to them.
const testedStems = new Set(testFiles.map((f) => basename(f).replace(/(\.|_)(test|spec)\.[^.]+$/, '').replace(/\.[^.]+$/, '')));
const untestedLargeFiles = sourceFiles
  .map((f) => ({ file: toRelative(repositoryRoot, f), lines: readText(f).split('\n').length, stem: basename(f).replace(/\.[^.]+$/, '') }))
  .filter((f) => f.lines >= 150 && !testedStems.has(f.stem) && !/\.(d|config)\.|index\./.test(f.file))
  .sort((a, b) => b.lines - a.lines);

// Documentation: README at root and per feature.
const rootReadme = ['README.md', 'readme.md', 'Readme.md'].some((n) => existsSync(join(repositoryRoot, n)));
const featureReadmes = [];
for (const root of featureRoots) {
  const absoluteRoot = join(repositoryRoot, root.trim());
  if (!existsSync(absoluteRoot)) continue;
  for (const entry of readdirSync(absoluteRoot, { withFileTypes: true })) {
    if (entry.isDirectory()) featureReadmes.push({ feature: `${root.trim()}/${entry.name}`, hasReadme: existsSync(join(absoluteRoot, entry.name, 'README.md')) });
  }
}

// Monitoring: is there a logger / error tracker at all?
const allText = sourceFiles.map(readText).join('\n');
const loggerSignals = ['pino', 'winston', 'bunyan', 'logger.', 'Sentry', '@sentry', 'opentelemetry', 'logtail', 'datadog'].filter((s) => allText.includes(s));
const envAccesses = (allText.match(/process\.env\.[A-Z_][A-Z0-9_]*/g) || []);
const envValidated = /z\.object\([\s\S]{0,200}process\.env|envalid|@t3-oss\/env|cleanEnv\(|parseEnv/.test(allText);

const pillarSummary = {};
for (const check of CHECKS) {
  const hits = hitsByCheck.get(check.label);
  const total = hits.reduce((s, h) => s + h.count, 0);
  pillarSummary[check.pillar] ??= [];
  pillarSummary[check.pillar].push({ label: check.label, severity: check.severity, total, files: hits.length, examples: hits.slice(0, 8) });
}

const report = {
  totals: { sourceFiles: sourceFiles.length, testFiles: testFiles.length, testToSourceRatio: +(testFiles.length / Math.max(1, sourceFiles.length)).toFixed(2) },
  pillars: pillarSummary,
  tests: { untestedLargeFiles: untestedLargeFiles.slice(0, 30) },
  documentation: { rootReadme, featureReadmes },
  monitoring: { loggerOrTrackerFound: loggerSignals, distinctEnvVariables: [...new Set(envAccesses)].length, envValidatedAtStartup: envValidated },
  memory: { cleanupSuspects: leakSuspects.slice(0, 50), heavyStaticImports: heavyStaticImports.slice(0, 30) },
  schemaLibrary: ['zod', 'valibot', 'yup', 'pydantic', 'superstruct', 'io-ts'].filter((s) => allText.includes(`'${s}'`) || allText.includes(`"${s}"`) || allText.includes(`import ${s}`)),
};

if (options.json) { console.log(JSON.stringify(report, null, 2)); process.exit(0); }

const titles = { security: 'Security', cleanCode: 'Clean code / hard-coded values', monitoring: 'Monitoring & logs', scalability: 'Scalability', typeSafety: 'Contracts & type safety', performance: 'Performance & bundle' };
console.log(`# Engineering health facts for ${repositoryRoot}`);
console.log(`source files ${report.totals.sourceFiles}, test files ${report.totals.testFiles} (ratio ${report.totals.testToSourceRatio})`);
for (const [pillar, checks] of Object.entries(pillarSummary)) {
  console.log(`\n## ${titles[pillar] || pillar}`);
  for (const c of checks) {
    if (!c.total) { console.log(`- [ok] ${c.label}`); continue; }
    console.log(`- [${c.severity}] ${c.label}: ${c.total} hit(s) in ${c.files} file(s)`);
    for (const e of c.examples) console.log(`    ${e.file}:${e.lines.join(',')}`);
  }
}
console.log('\n## Tests');
console.log(`- large files (150+ lines) with no matching test file: ${untestedLargeFiles.length}`);
for (const f of untestedLargeFiles.slice(0, 15)) console.log(`    ${f.file} (${f.lines} lines)`);
console.log('\n## Documentation');
console.log(`- root README: ${rootReadme ? 'yes' : 'MISSING'}`);
for (const f of featureReadmes) console.log(`- ${f.feature}: ${f.hasReadme ? 'README ok' : 'no README'}`);
console.log('\n## Monitoring & config');
console.log(`- logger / error tracker found: ${loggerSignals.length ? loggerSignals.join(', ') : 'NONE'}`);
console.log(`- distinct env variables read: ${report.monitoring.distinctEnvVariables}, validated at startup: ${envValidated ? 'yes' : 'no'}`);
console.log(`- schema validation library in use: ${report.schemaLibrary.length ? report.schemaLibrary.join(', ') : 'NONE (boundaries likely unvalidated)'}`);
console.log('\n## Memory & cleanup (resources opened more often than released in the same file)');
if (!leakSuspects.length) console.log('- [ok] none');
for (const s of leakSuspects.slice(0, 20)) console.log(`- ${s.file}: ${s.issue} (${s.opened} open / ${s.closed} close)`);
console.log('\n## Heavy libraries imported statically (lazy-load candidates)');
if (!heavyStaticImports.length) console.log('- [ok] none');
for (const h of heavyStaticImports.slice(0, 15)) console.log(`- ${h.file}: ${h.library}`);
console.log('\nArchitecture and modular design: use inventory.mjs and checkFeatureBoundaries.mjs. All hits are heuristic - confirm by reading the code.');
