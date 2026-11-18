#!/usr/bin/env node
// PlayLudiq site check - run before every publish: `node tools/check-site.mjs`
// Exits 1 when something must be fixed. No dependencies.
//
// Checks:
//  1. every local link / script / stylesheet / image in site/*.html exists
//  2. sw.js PRECACHE_FILES lists exactly the files that ship (offline mode)
//  3. no {{PLACEHOLDER}} left (legal pages filled in)
//  4. no raw #hex colour in any stylesheet except styles/tokens.css
//  5. sitemap.xml lists every public page
//  6. every .js file parses (node --check)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SITE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "site");
const NOT_PRECACHED = new Set(["sw.js", "CNAME", "robots.txt", "sitemap.xml"]);
const NOT_IN_SITEMAP = new Set(["404.html"]);
const TOKENS_FILE = "styles/tokens.css";
const problems = [];

const files = listFiles(SITE_DIR);
checkLocalReferences();
checkPrecacheList();
checkPlaceholders();
checkRawColours();
checkSitemap();
checkScriptsParse();
report();

// --- Checks -------------------------------------------------------------------
function checkLocalReferences() {
  for (const page of files.filter((file) => file.endsWith(".html"))) {
    const html = read(page);
    const references = [...html.matchAll(/\b(?:href|src|data-src)="([^"]+)"/g)].map((match) => match[1]);
    for (const reference of references) {
      if (/^(https?:|mailto:|tel:|#|data:|\{\{)/.test(reference)) continue;
      const clean = reference.split("#")[0].split("?")[0];
      if (!clean) continue;
      const target = clean.startsWith("/") ? clean.slice(1) : path.posix.join(path.posix.dirname(page), clean);
      if (target === "" || target === ".") continue;
      if (!fs.existsSync(path.join(SITE_DIR, target))) problems.push(`${page}: missing file "${reference}"`);
    }
  }
}

function checkPrecacheList() {
  const list = (read("sw.js").match(/PRECACHE_FILES\s*=\s*\[([\s\S]*?)\];/) || [, ""])[1];
  const listed = new Set([...list.matchAll(/"([^"]+)"/g)].map((match) => match[1]).filter((entry) => entry !== "./"));
  const shipped = files.filter((file) => !NOT_PRECACHED.has(file));
  for (const file of shipped) if (!listed.has(file)) problems.push(`sw.js: "${file}" is not in PRECACHE_FILES (add it and raise CACHE_VERSION)`);
  for (const entry of listed) if (!files.includes(entry)) problems.push(`sw.js: PRECACHE_FILES lists "${entry}", which does not exist`);
}

function checkPlaceholders() {
  for (const file of files.filter((name) => /\.(html|js|css)$/.test(name))) {
    const found = read(file).match(/\{\{[A-Z_]+\}\}/g);
    if (found) problems.push(`${file}: unfilled ${[...new Set(found)].join(", ")} (run the playludiq-legal skill)`);
  }
}

function checkRawColours() {
  for (const file of files.filter((name) => name.endsWith(".css") && name !== TOKENS_FILE)) {
    const lines = read(file).split("\n");
    lines.forEach((line, index) => {
      if (/#[0-9a-fA-F]{3,8}\b/.test(line)) problems.push(`${file}:${index + 1}: raw colour; use a token from ${TOKENS_FILE}`);
    });
  }
}

function checkSitemap() {
  const sitemap = read("sitemap.xml");
  for (const page of files.filter((file) => file.endsWith(".html") && !file.includes("/") && !NOT_IN_SITEMAP.has(file))) {
    const url = page === "index.html" ? "https://playludiq.com/<" : `https://playludiq.com/${page}<`;
    if (!sitemap.includes(url)) problems.push(`sitemap.xml: "${page}" is missing`);
  }
}

function checkScriptsParse() {
  for (const file of files.filter((name) => name.endsWith(".js"))) {
    try {
      execFileSync(process.execPath, ["--check", path.join(SITE_DIR, file)], { stdio: "pipe" });
    } catch (error) {
      problems.push(`${file}: does not parse: ${String(error.stderr || error.message).split("\n").slice(0, 3).join(" ")}`);
    }
  }
}

// --- Helpers ------------------------------------------------------------------
function listFiles(directory, prefix = "") {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".")) return [];
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? listFiles(path.join(directory, entry.name), relative) : [relative];
  });
}

function read(file) {
  return fs.readFileSync(path.join(SITE_DIR, file), "utf8");
}

function report() {
  if (problems.length === 0) {
    console.log(`site check passed (${files.length} files)`);
    return;
  }
  console.log(`site check found ${problems.length} problem(s):`);
  problems.forEach((problem) => console.log(`  - ${problem}`));
  process.exitCode = 1;
}
