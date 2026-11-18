// Shared file walker for the refactor scripts. No dependencies.
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

export const IGNORED_DIRECTORIES = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'out', 'coverage', '.turbo',
  '.vercel', '.cache', '.baseline', '.output', '__pycache__', '.venv', 'venv', 'vendor',
]);

export const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.svelte', '.astro', '.py']);
export const STYLE_EXTENSIONS = new Set(['.css', '.scss', '.sass', '.less']);
export const MARKUP_EXTENSIONS = new Set(['.html', '.htm', '.md', '.mdx', '.json']);

export function listFiles(rootDirectory, { extensions } = {}) {
  const collected = [];
  const visit = (directory) => {
    let entries;
    try { entries = readdirSync(directory, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.github') {
        if (entry.isDirectory()) continue;
      }
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) visit(absolutePath);
      } else if (entry.isFile()) {
        if (!extensions || extensions.has(extname(entry.name))) collected.push(absolutePath);
      }
    }
  };
  visit(rootDirectory);
  return collected;
}

export function readText(filePath) {
  try {
    if (statSync(filePath).size > 2_000_000) return '';
    return readFileSync(filePath, 'utf8');
  } catch { return ''; }
}

export const toRelative = (rootDirectory, filePath) => relative(rootDirectory, filePath) || '.';

export function parseArguments(argv) {
  const positional = [];
  const options = {};
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument.startsWith('--')) {
      const [key, inlineValue] = argument.slice(2).split('=');
      if (inlineValue !== undefined) options[key] = inlineValue;
      else if (argv[index + 1] && !argv[index + 1].startsWith('--')) options[key] = argv[++index];
      else options[key] = true;
    } else positional.push(argument);
  }
  return { positional, options };
}
