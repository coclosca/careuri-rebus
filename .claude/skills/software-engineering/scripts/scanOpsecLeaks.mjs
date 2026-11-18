#!/usr/bin/env node
// OPSEC gate: finds personal / device / infrastructure identity leaking into what goes to a VPS.
// Identity markers are detected at runtime from THIS machine (username, full name, hostname, computer name,
// ssh aliases, git identity) - they are never written into the skill or the repo.
//
//   node scanOpsecLeaks.mjs <repoDir> [--all-files] [--history] [--json]
//     default      scans files tracked by git (what would be pushed); no git -> all files
//     --all-files  scans every file on disk (use on a build/deploy folder before it goes to a VPS)
//     --history    also scans commit authors and commit messages
//
// Allow-list (per repo, committed): .opsec-allow  - one literal or /regex/ per line, e.g. brand domains,
//   public support emails, the company name. Personal deny-list (local only, never in a repo):
//   ~/.config/opsec/denylist.txt - extra words that must never ship (nicknames, family names, client names...).
// Exit code 1 when any HIGH finding exists.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { homedir, hostname, userInfo } from 'node:os';
import { basename, extname, join, resolve } from 'node:path';
import { listFiles, readText, toRelative, parseArguments } from './walkSourceFiles.mjs';

const { positional, options } = parseArguments(process.argv.slice(2));
const repositoryRoot = resolve(positional[0] || '.');
const GIT_ENVIRONMENT = { ...process.env, DEVELOPER_DIR: process.env.DEVELOPER_DIR || '/Library/Developer/CommandLineTools' };

// ─── Local identity markers (runtime only) ────────────────

function runQuietly(command, workingDirectory = repositoryRoot) {
  try { return execSync(command, { cwd: workingDirectory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], env: GIT_ENVIRONMENT }).trim(); }
  catch { return ''; }
}

function collectIdentityMarkers() {
  const markers = new Map(); // term -> kind
  const add = (term, kind) => { const clean = (term || '').trim(); if (clean.length >= 4) markers.set(clean, kind); };
  add(userInfo().username, 'local username');
  add(hostname().replace(/\.local$/, ''), 'machine hostname');
  add(hostname(), 'machine hostname');
  add(runQuietly('scutil --get ComputerName'), 'computer name');
  add(runQuietly('scutil --get LocalHostName'), 'local host name');
  const fullName = runQuietly('id -F') || runQuietly('getent passwd "$USER" | cut -d: -f5 | cut -d, -f1');
  add(fullName, 'full personal name');
  const gitName = runQuietly('git config --global user.name');
  if (/\s/.test(gitName)) add(gitName, 'git identity name'); // a single generic word ("Office") would match everywhere
  add(runQuietly('git config --global user.email'), 'git identity email');
  add(homedir(), 'home directory path');
  const denylistPath = join(homedir(), '.config', 'opsec', 'denylist.txt');
  if (existsSync(denylistPath)) {
    for (const line of readFileSync(denylistPath, 'utf8').split('\n')) if (line.trim() && !line.startsWith('#')) add(line, 'personal deny-list');
  }
  return markers;
}

function collectSshAliases() {
  const sshConfigPath = join(homedir(), '.ssh', 'config');
  if (!existsSync(sshConfigPath)) return [];
  return readFileSync(sshConfigPath, 'utf8').split('\n')
    .map((line) => line.match(/^\s*Host\s+(.+)$/i)?.[1] ?? '')
    .flatMap((hosts) => hosts.split(/\s+/))
    .filter((alias) => alias && !alias.includes('*'));
}

// ─── Allow-list ───────────────────────────────────────────

function loadAllowList() {
  const allowPath = join(repositoryRoot, '.opsec-allow');
  if (!existsSync(allowPath)) return [];
  return readFileSync(allowPath, 'utf8').split('\n').map((line) => line.trim()).filter((line) => line && !line.startsWith('#'))
    .map((entry) => (entry.startsWith('/') && entry.lastIndexOf('/') > 0
      ? new RegExp(entry.slice(1, entry.lastIndexOf('/')), entry.slice(entry.lastIndexOf('/') + 1))
      : entry.toLowerCase()));
}
const allowList = loadAllowList();
const isAllowed = (text) => allowList.some((rule) => (typeof rule === 'string' ? text.toLowerCase().includes(rule) : rule.test(text)));

// ─── Content rules ────────────────────────────────────────

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const identityMarkers = collectIdentityMarkers();
const sshAliases = collectSshAliases();

const CONTENT_RULES = [
  ...[...identityMarkers].map(([term, kind]) => ({ severity: 'high', label: `${kind}`, pattern: new RegExp(escapeRegExp(term).replace(/[’']/g, "[’']"), 'i') })),
  // (?<![\w.-]) keeps URL paths like example.com/news/home/2025 out.
  { severity: 'high', label: 'absolute personal home path', pattern: /(?<![\w.-])\/Users\/(?!Shared\/)[A-Za-z0-9._-]+\/|(?<![\w.-])\/home\/(?!(?:runner|node|app|ubuntu|deploy|www-data|git|ec2-user|admin|user|USER|\$\w+)\/)[A-Za-z0-9._-]+\/|C:\\\\?Users\\\\?[A-Za-z0-9._-]+/ },
  // Device names: "Anna's MacBook", "iPhone di Marco", "Marcos-MacBook-Pro(.local)", "DESKTOP-4F2K9QJ".
  { severity: 'high', label: 'device name', pattern: /\b[A-Z][a-z]+[’']s\s+(MacBook|iMac|Mac\s?mini|Mac\s?Studio|iPhone|iPad)|\b(MacBook|iPhone|iPad)\s+(di|de|von|van)\s+[A-Z][a-z]+|\b[A-Za-z]+-(MacBook|iMac|Mac-?mini|Mac-?Studio|iPhone|iPad)[\w-]*\b|\b(DESKTOP|LAPTOP)-[A-Z0-9]{6,}\b/ },
  // Server IPs. Excluded: documentation ranges (RFC 5737), well-known public resolvers, placeholder 1.2.3.4,
  // CIDR ranges (provider lists like Cloudflare's) - those are reported as low below.
  { severity: 'high', label: 'public IPv4 address', pattern: /(?<![\d.])(?!(?:10|127|0)\.)(?!192\.168\.)(?!172\.(?:1[6-9]|2\d|3[01])\.)(?!169\.254\.)(?!192\.0\.2\.|198\.51\.100\.|203\.0\.113\.|198\.1[89]\.|192\.0\.0\.)(?!(?:1\.1\.1\.1|8\.8\.[48]\.[48]|9\.9\.9\.9|1\.2\.3\.4|255\.255\.255\.\d+)(?![\d.]))(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}(?![\d.]|\/\d)/ },
  { severity: 'high', label: 'private key / credential material', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY|\b(sk_live_[A-Za-z0-9]{10,}|rk_live_[A-Za-z0-9]{10,}|AKIA[0-9A-Z]{16}|ghp_[\w]{20,}|github_pat_[\w]{20,}|xox[bpas]-[\w-]{10,}|AIza[\w-]{30,})/ },
  { severity: 'low', label: 'public IP range (CIDR) - check it is a provider list, not your server', pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\/\d{1,2}\b/ },
  { severity: 'medium', label: 'email address', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/ },
  { severity: 'medium', label: 'user@host / ssh target', pattern: /\b[\w.-]+@(?:\d{1,3}\.){3}\d{1,3}\b|\bssh\s+(?:-\w+\s+\S+\s+)*[\w.-]+@[\w.-]+/ },
  ...(sshAliases.length ? [{ severity: 'medium', label: 'personal ssh alias used (reveals infra layout)', pattern: new RegExp(`\\b(?:ssh|scp|rsync)\\b[^\\n]*?\\s(?:${sshAliases.map(escapeRegExp).join('|')})(?::|\\s|$)|git@(?:${sshAliases.map(escapeRegExp).join('|')}):`) }] : []),
  { severity: 'low', label: 'private/LAN IP address', pattern: /\b(?:192\.168|10\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\b/ },
  { severity: 'low', label: 'personal note / internal marker', pattern: /\b(TODO|FIXME|NOTE)\b[^\n]*\b(me|my|mine|mio|mia|io)\b|\bdo not (ship|commit|push)\b|\bnon (pushare|committare)\b/i },
];

// ─── File rules (files that should never ship) ────────────

const FORBIDDEN_FILE_RULES = [
  { severity: 'high', label: 'environment file', test: (name) => /^\.env(\..+)?$/.test(name) && !/\.(example|sample|template)$/.test(name) },
  { severity: 'high', label: 'key / certificate file', test: (name) => /\.(pem|key|p12|pfx|keystore|jks)$|^id_(rsa|ed25519|ecdsa)(\.pub)?$/.test(name) },
  // Migrations and schema files are source code; dumps and local databases are data.
  { severity: 'high', label: 'database dump / local database', test: (name, path) => /\.(dump|sqlite|sqlite3|db)$|\.sql\.gz$/.test(name) || (/\.sql$/.test(name) && !/(^|\/)(migrations?|schema|seeds?|sql)\//.test(path) && /dump|backup|export|prod|live/i.test(name)) },
  { severity: 'medium', label: 'backup / leftover file', test: (name) => /\.(bak|orig|old|swp|swo|tmp|rej)$|~$|\.backup$| copy( \d+)?\.|\(\d+\)\.[a-z]+$/i.test(name) }, // Finder-style "x copy.ts" / "x (1).ts", not "page-copy.ts"
  { severity: 'medium', label: 'log file', test: (name) => /\.log$/.test(name) },
  { severity: 'low', label: 'OS / editor junk', test: (name) => /^(\.DS_Store|Thumbs\.db|desktop\.ini|\.AppleDouble|Icon\r)$/.test(name) },
  { severity: 'low', label: 'personal editor settings', test: (name, path) => /(^|\/)\.(idea|vscode)\//.test(path) && !/extensions\.json$|settings\.json$/.test(name) },
];

// ─── Collect files to scan ────────────────────────────────

function listShippableFiles() {
  if (!options['all-files']) {
    const trackedFiles = runQuietly('git ls-files -z --cached --others --exclude-standard');
    if (trackedFiles) return trackedFiles.split('\0').filter(Boolean).map((path) => join(repositoryRoot, path));
  }
  return listFiles(repositoryRoot);
}

const findings = [];
const BINARY_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.zip', '.gz', '.woff', '.woff2', '.ttf', '.otf', '.mp4', '.mov', '.mp3']);
for (const filePath of listShippableFiles()) {
  const relativePath = toRelative(repositoryRoot, filePath);
  const fileName = basename(filePath);
  for (const rule of FORBIDDEN_FILE_RULES) {
    if (rule.test(fileName, relativePath)) findings.push({ severity: rule.severity, label: rule.label, location: relativePath, excerpt: '(file should not ship)' });
  }
  if (BINARY_EXTENSIONS.has(extname(fileName).toLowerCase())) continue;
  // Vector/minified/lock files: numbers look like IPs and there is no human-written text to leak.
  if (/\.(svg|min\.js|min\.css|map)$|(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/.test(relativePath)) continue;
  try { if (statSync(filePath).size > 2_000_000) continue; } catch { continue; }
  const lines = readText(filePath).split('\n');
  lines.forEach((line, index) => {
    // Inline SVG geometry (path data, viewBox, points) is full of dotted numbers that look like IPs.
    const isSvgGeometryLine = /<svg\b|\sd="|viewBox="|points="/.test(line);
    for (const rule of CONTENT_RULES) {
      if (isSvgGeometryLine && /IP/.test(rule.label)) continue;
      const match = line.match(rule.pattern);
      if (!match || isAllowed(match[0]) || isAllowed(line)) continue;
      findings.push({ severity: rule.severity, label: rule.label, location: `${relativePath}:${index + 1}`, excerpt: line.trim().slice(0, 140) });
    }
  });
}

// ─── Git checks ───────────────────────────────────────────

const gitChecks = [];
if (runQuietly('git rev-parse --is-inside-work-tree') === 'true') {
  const ignoredText = runQuietly('git check-ignore -v .env .DS_Store node_modules x.log 2>/dev/null; true');
  for (const mustBeIgnored of ['.env', '.DS_Store', 'x.log']) {
    if (!ignoredText.includes(mustBeIgnored)) gitChecks.push(`.gitignore does not ignore ${mustBeIgnored === 'x.log' ? '*.log' : mustBeIgnored}`);
  }
  const localAuthor = `${runQuietly('git config user.name')} <${runQuietly('git config user.email')}>`;
  gitChecks.push(`commits from this repo will be signed as: ${localAuthor}`);
  if (options.history) {
    const authors = runQuietly("git log --all --format='%an <%ae>|%cn <%ce>'").split('\n').flatMap((line) => line.split('|'));
    for (const author of new Set(authors)) {
      const leaksIdentity = [...identityMarkers.keys()].some((term) => author.toLowerCase().includes(term.toLowerCase()));
      if (author.trim() && !isAllowed(author)) gitChecks.push(`history author/committer: ${author}${leaksIdentity ? '   <- personal identity' : ''}`);
    }
    const messages = runQuietly("git log --all --format='%h %s%n%b'").split('\n');
    for (const message of messages) {
      for (const rule of CONTENT_RULES.filter((r) => r.severity !== 'low')) {
        const match = message.match(rule.pattern);
        if (match && !isAllowed(match[0])) findings.push({ severity: rule.severity, label: `commit message: ${rule.label}`, location: message.slice(0, 9), excerpt: message.slice(0, 140) });
      }
    }
  }
}

// ─── Report ───────────────────────────────────────────────

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };
// Test files use fake IPs, paths and keys on purpose: downgrade those (never identity markers) to low.
const TEST_FILE_PATTERN = /(\.|_)(test|spec)\.|__tests__|fixtures?\//;
const FAKE_DATA_LABELS = new Set(['public IPv4 address', 'absolute personal home path', 'private key / credential material', 'email address']);
for (const finding of findings) {
  if (FAKE_DATA_LABELS.has(finding.label) && TEST_FILE_PATTERN.test(finding.location)) finding.severity = 'low';
}
// One finding per location: keep the most severe, list every reason.
const findingsByLocation = new Map();
for (const finding of findings) {
  const existing = findingsByLocation.get(finding.location);
  if (!existing) { findingsByLocation.set(finding.location, { ...finding }); continue; }
  if (!existing.label.split(' + ').includes(finding.label)) existing.label += ` + ${finding.label}`;
  if (SEVERITY_ORDER[finding.severity] < SEVERITY_ORDER[existing.severity]) existing.severity = finding.severity;
}
findings.length = 0;
findings.push(...findingsByLocation.values());
findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.location.localeCompare(b.location));
const highCount = findings.filter((f) => f.severity === 'high').length;

if (options.json) {
  console.log(JSON.stringify({ findings, gitChecks, markerKinds: [...new Set(identityMarkers.values())] }, null, 2));
} else {
  console.log(`# OPSEC scan of ${repositoryRoot}  (${options['all-files'] ? 'all files on disk' : 'files git would push'})`);
  console.log(`identity markers checked: ${[...new Set(identityMarkers.values())].join(', ')}; ssh aliases: ${sshAliases.length}`);
  for (const severity of ['high', 'medium', 'low']) {
    const group = findings.filter((f) => f.severity === severity);
    console.log(`\n## ${severity.toUpperCase()} (${group.length})`);
    for (const f of group.slice(0, 60)) console.log(`- [${f.label}] ${f.location}  ${f.excerpt}`);
    if (group.length > 60) console.log(`  ... ${group.length - 60} more (use --json)`);
  }
  console.log('\n## Git'); for (const line of gitChecks) console.log(`- ${line}`);
  console.log(`\n${highCount ? `OPSEC GATE FAILED: ${highCount} high finding(s) - fix before any push or deploy` : 'OPSEC GATE PASSED (no high findings) - still review medium ones'}`);
  console.log('Allow brand terms in .opsec-allow (committed); keep personal words in ~/.config/opsec/denylist.txt (never committed).');
}
process.exit(highCount ? 1 : 0);
