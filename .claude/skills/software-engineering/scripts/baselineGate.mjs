#!/usr/bin/env node
// Phase 0 + after every commit: record typecheck/lint/test/build results, then compare against them.
//   node baselineGate.mjs snapshot <repoDir> [--name baseline] [--only typecheck,test]
//   node baselineGate.mjs compare  <repoDir> [--against baseline]
// Gate rule: no NEW error lines and no step that went from pass to fail. Pre-existing failures are allowed.
// Custom steps: put a .baseline/gate/gate.config.json  {"steps": {"name": "shell command", ...}}  to override detection.
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArguments } from './walkSourceFiles.mjs';

const { positional, options } = parseArguments(process.argv.slice(2));
const [mode, repositoryArgument] = positional;
const repositoryRoot = resolve(repositoryArgument || '.');
const baselineDirectory = join(repositoryRoot, '.baseline', 'gate'); // own subfolder: never mixes with a repo's existing .baseline files
if (!['snapshot', 'compare'].includes(mode)) {
  console.error('usage: baselineGate.mjs snapshot|compare <repoDir> [--name n] [--against n] [--only a,b]');
  process.exit(2);
}

function detectSteps() {
  const configPath = join(baselineDirectory, 'gate.config.json');
  if (existsSync(configPath)) return JSON.parse(readFileSync(configPath, 'utf8')).steps;
  const steps = {};
  const packagePath = join(repositoryRoot, 'package.json');
  if (existsSync(packagePath)) {
    const scripts = JSON.parse(readFileSync(packagePath, 'utf8')).scripts || {};
    const runner = existsSync(join(repositoryRoot, 'pnpm-lock.yaml')) ? 'pnpm' : existsSync(join(repositoryRoot, 'yarn.lock')) ? 'yarn' : 'npm';
    const run = (script) => (runner === 'npm' ? `npm run -s ${script}` : `${runner} run ${script}`);
    if (scripts.typecheck) steps.typecheck = run('typecheck');
    else if (existsSync(join(repositoryRoot, 'tsconfig.json'))) steps.typecheck = 'npx --no-install tsc --noEmit --pretty false';
    if (scripts.lint) steps.lint = run('lint');
    if (scripts.test) steps.test = runner === 'npm' ? 'npm test --silent' : `${runner} test`;
    if (scripts.build) steps.build = run('build');
  }
  if (existsSync(join(repositoryRoot, 'pyproject.toml')) || existsSync(join(repositoryRoot, 'requirements.txt'))) {
    steps.pythonTests = 'python -m pytest -q -p no:cacheprovider';
    steps.pythonLint = 'ruff check . --output-format concise';
  }
  return steps;
}

// Lines that look like errors/failures, normalized so timings, durations and absolute paths don't create noise.
const ERROR_LINE_PATTERN = /(error|failed|fail\b|✗|✕|×|exception|cannot find|is not assignable|not defined|unexpected)/i;
const normalizeLine = (line) => line
  .replace(/\x1b\[[0-9;]*m/g, '')
  .replace(repositoryRoot, '<repo>')
  .replace(/\(\d+(\.\d+)?\s?m?s\)/g, '')
  .replace(/\b\d+(\.\d+)?\s?(ms|s)\b/g, '<t>')
  .replace(/\b\d{1,2}:\d{2}:\d{2}\b/g, '<time>')
  .trim();

function runStep(name, command) {
  const startedAt = Date.now();
  let output = '', exitCode = 0;
  try {
    output = execSync(command, { cwd: repositoryRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024, env: { ...process.env, CI: '1', FORCE_COLOR: '0' } });
  } catch (failure) {
    output = `${failure.stdout || ''}\n${failure.stderr || ''}`;
    exitCode = failure.status ?? 1;
  }
  const errorLines = [...new Set(output.split('\n').map(normalizeLine).filter((line) => line && ERROR_LINE_PATTERN.test(line)))];
  console.log(`  ${name}: exit ${exitCode}, ${errorLines.length} error line(s), ${Math.round((Date.now() - startedAt) / 1000)}s`);
  return { command, exitCode, errorLines, rawOutput: output };
}

const onlySteps = options.only ? new Set(String(options.only).split(',')) : null;
const steps = Object.entries(detectSteps()).filter(([name]) => !onlySteps || onlySteps.has(name));
if (!steps.length) { console.error('No gate steps detected. Write .baseline/gate/gate.config.json with {"steps": {...}}'); process.exit(2); }

mkdirSync(baselineDirectory, { recursive: true });
const snapshotName = mode === 'snapshot' ? String(options.name || 'baseline') : 'current';
console.log(`Running ${steps.length} gate step(s) in ${repositoryRoot}`);
const results = {};
for (const [name, command] of steps) results[name] = runStep(name, command);

let gitHead = '';
try {
  gitHead = execSync('git rev-parse --short HEAD', {
    cwd: repositoryRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    env: { ...process.env, DEVELOPER_DIR: process.env.DEVELOPER_DIR || '/Library/Developer/CommandLineTools' },
  }).trim();
} catch {}
const snapshot = { takenAt: new Date().toISOString(), gitHead, results: Object.fromEntries(Object.entries(results).map(([n, r]) => [n, { command: r.command, exitCode: r.exitCode, errorLines: r.errorLines }])) };
writeFileSync(join(baselineDirectory, `${snapshotName}.json`), JSON.stringify(snapshot, null, 2));
for (const [name, result] of Object.entries(results)) writeFileSync(join(baselineDirectory, `${snapshotName}.${name}.log`), result.rawOutput);

if (mode === 'snapshot') {
  console.log(`Saved .baseline/gate/${snapshotName}.json (add .baseline/*.log to .gitignore if logs are large)`);
  process.exit(0);
}

const againstName = String(options.against || 'baseline');
const baselinePath = join(baselineDirectory, `${againstName}.json`);
if (!existsSync(baselinePath)) { console.error(`No .baseline/gate/${againstName}.json - run snapshot first`); process.exit(2); }
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));

let regressions = 0;
console.log(`\nCompare vs ${againstName} (${baseline.gitHead || 'no git'} @ ${baseline.takenAt})`);
for (const [name, current] of Object.entries(snapshot.results)) {
  const before = baseline.results[name];
  if (!before) { console.log(`  ${name}: NEW STEP (no baseline) exit ${current.exitCode}`); continue; }
  const beforeSet = new Set(before.errorLines);
  const afterSet = new Set(current.errorLines);
  const newErrors = current.errorLines.filter((line) => !beforeSet.has(line));
  const fixedErrors = before.errorLines.filter((line) => !afterSet.has(line));
  const newlyFailing = before.exitCode === 0 && current.exitCode !== 0;
  const status = newErrors.length || newlyFailing ? 'REGRESSION' : 'ok';
  if (status === 'REGRESSION') regressions++;
  console.log(`  ${name}: ${status}  exit ${before.exitCode}->${current.exitCode}, errors ${before.errorLines.length}->${current.errorLines.length} (+${newErrors.length} new, -${fixedErrors.length} gone)`);
  for (const line of newErrors.slice(0, 30)) console.log(`      + ${line}`);
  if (fixedErrors.length) console.log(`      (${fixedErrors.length} baseline error line(s) no longer present - check they were not silenced by a removed test)`);
}
console.log(regressions ? `\nGATE FAILED: ${regressions} step(s) regressed` : '\nGATE PASSED: no new failures vs baseline');
process.exit(regressions ? 1 : 0);
