#!/usr/bin/env node
// Phase 5: find functions that are too long, too deeply nested, take too many parameters,
// or carry magic numbers - the candidates for "write it clearly, in blocks".
// Heuristic brace scanner for JS/TS (no parser dependency). Usage:
//   node findComplexFunctions.mjs <repoDir> [--max-lines 50] [--max-depth 4] [--max-params 4] [--top 40] [--json]
import { extname } from 'node:path';
import { listFiles, readText, toRelative, parseArguments } from './walkSourceFiles.mjs';

const { positional, options } = parseArguments(process.argv.slice(2));
const repositoryRoot = positional[0] || '.';
const maximumLines = Number(options['max-lines'] || 50);
const maximumDepth = Number(options['max-depth'] || 4);
const maximumParameters = Number(options['max-params'] || 4);
const topCount = Number(options.top || 40);
const SCANNED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

// Function starts: declarations, arrow functions assigned to names, class/object methods.
const FUNCTION_START_PATTERNS = [
  /(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)?\s*(?:<[^>]*>)?\s*\(([^)]*)\)/,
  /(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s+)?(?:\(([^)]*)\)|([A-Za-z_$][\w$]*))\s*(?::[^=]+)?=>/,
  /^\s*(?:public\s+|private\s+|protected\s+|static\s+|async\s+)*([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*(?::[^{]+)?\{\s*$/,
];
const CONTROL_KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'with', 'return', 'function']);
const MAGIC_NUMBER_PATTERN = /(?<![\w.$#-])(\d{3,}|\d+\.\d+)(?![\w.%]|px|rem|em|ms\b)/g;

function stripStringsAndComments(line, state) {
  let output = '';
  for (let index = 0; index < line.length; index++) {
    const character = line[index], next = line[index + 1];
    if (state.inBlockComment) { if (character === '*' && next === '/') { state.inBlockComment = false; index++; } continue; }
    if (state.quote) { if (character === '\\') { index++; continue; } if (character === state.quote) state.quote = null; continue; }
    if (character === '/' && next === '*') { state.inBlockComment = true; index++; continue; }
    if (character === '/' && next === '/') break;
    if (character === '"' || character === "'" || character === '`') { state.quote = character; output += '""'; continue; }
    output += character;
  }
  if (state.quote !== '`') state.quote = null; // only template literals span lines
  return output;
}

const findings = [];
for (const filePath of listFiles(repositoryRoot, { extensions: SCANNED_EXTENSIONS })) {
  if (/\.(test|spec)\.|\.d\.ts$|\.min\./.test(filePath)) continue;
  const relativePath = toRelative(repositoryRoot, filePath);
  const lines = readText(filePath).split('\n');
  const state = { inBlockComment: false, quote: null };
  const openFunctions = []; // {name, startLine, parameterCount, braceDepthAtStart, maxNesting, magicNumbers}
  let braceDepth = 0;

  lines.forEach((rawLine, lineIndex) => {
    const code = stripStringsAndComments(rawLine, state);
    let started = null;
    for (const pattern of FUNCTION_START_PATTERNS) {
      const match = code.match(pattern);
      if (match && !CONTROL_KEYWORDS.has(match[1])) {
        const parameterText = (match[2] ?? match[3] ?? '').trim();
        const parameterCount = parameterText ? parameterText.split(',').filter((p) => p.trim()).length : 0;
        started = { name: match[1] || '(anonymous)', startLine: lineIndex + 1, parameterCount, maxNesting: 0, magicNumbers: new Set() };
        break;
      }
    }
    for (const fn of openFunctions) for (const m of code.matchAll(MAGIC_NUMBER_PATTERN)) fn.magicNumbers.add(m[1]);

    for (const character of code) {
      if (character === '{') {
        if (started && code.indexOf('{') !== -1 && !started.opened) {
          started.opened = true; started.braceDepthAtStart = braceDepth; openFunctions.push(started);
        }
        braceDepth++;
        for (const fn of openFunctions) fn.maxNesting = Math.max(fn.maxNesting, braceDepth - fn.braceDepthAtStart - 1);
      } else if (character === '}') {
        braceDepth--;
        const top = openFunctions[openFunctions.length - 1];
        if (top && braceDepth === top.braceDepthAtStart) {
          openFunctions.pop();
          const lineCount = lineIndex + 1 - top.startLine + 1;
          const reasons = [];
          if (lineCount > maximumLines) reasons.push(`${lineCount} lines`);
          if (top.maxNesting > maximumDepth) reasons.push(`nesting ${top.maxNesting}`);
          if (top.parameterCount > maximumParameters) reasons.push(`${top.parameterCount} params`);
          if (top.magicNumbers.size >= 3) reasons.push(`magic numbers ${[...top.magicNumbers].slice(0, 5).join(',')}`);
          if (/^[a-z]$|^(fn|cb|tmp|data|handle|process|doStuff|run|go)$/i.test(top.name)) reasons.push('vague name');
          if (reasons.length) findings.push({ file: relativePath, line: top.startLine, functionName: top.name, lineCount, nesting: top.maxNesting, parameters: top.parameterCount, reasons: reasons.join('; '), score: lineCount / maximumLines + top.maxNesting / maximumDepth + reasons.length });
        }
      }
    }
  });
}

findings.sort((a, b) => b.score - a.score);
const shown = findings.slice(0, topCount);
if (options.json) { console.log(JSON.stringify({ thresholds: { maximumLines, maximumDepth, maximumParameters }, total: findings.length, findings: shown }, null, 2)); process.exit(0); }
console.log(`# Functions to rewrite for clarity in ${repositoryRoot}`);
console.log(`thresholds: > ${maximumLines} lines, nesting > ${maximumDepth}, > ${maximumParameters} params, 3+ magic numbers. ${findings.length} found, top ${shown.length}:`);
console.log('| file:line | function | lines | nesting | params | why |\n|---|---|---|---|---|---|');
for (const f of shown) console.log(`| ${f.file}:${f.line} | ${f.functionName} | ${f.lineCount} | ${f.nesting} | ${f.parameters} | ${f.reasons} |`);
console.log('\nHeuristic scan (no parser): confirm each entry by reading the code before putting it in the Clarity Table.');
