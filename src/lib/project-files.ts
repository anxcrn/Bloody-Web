import type { ProjectFile } from "./store";

/** Limits keep projects small enough for browser storage and a model's context. */
export const MAX_FILES = 150;
export const MAX_FILE_BYTES = 60_000;
export const MAX_TOTAL_BYTES = 400_000;

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".output",
  ".cache",
  "coverage",
  "__pycache__",
  ".venv",
  "venv",
  "target",
]);

const TEXT_EXT = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs", "json", "md", "mdx", "txt", "css", "scss", "html", "htm",
  "py", "rb", "go", "rs", "java", "kt", "c", "h", "cpp", "hpp", "cs", "php", "swift", "sh", "bash",
  "yml", "yaml", "toml", "ini", "env.example", "sql", "xml", "svg", "vue", "svelte", "astro", "lua", "r",
  "dart", "gradle", "csv",
]);

const TEXT_NAMES = new Set(["Dockerfile", "Makefile", "LICENSE", "README", ".gitignore", ".editorconfig"]);

export function isIgnoredPath(path: string): boolean {
  return path.split("/").some((part) => IGNORED_DIRS.has(part));
}

export function isTextFile(path: string): boolean {
  const name = path.split("/").pop() ?? "";
  if (TEXT_NAMES.has(name)) return true;
  if (name.startsWith(".env") && name !== ".env.example") return false; // never read secrets
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  return TEXT_EXT.has(ext);
}

export interface PickedFile {
  path: string;
  size: number;
  read: () => Promise<string>;
}

/** Picks which files to keep, applying ignore rules and size caps. */
export async function collectFiles(picked: PickedFile[]): Promise<{ files: ProjectFile[]; skipped: number; root: string }> {
  const root = picked[0]?.path.split("/")[0] ?? "";
  const sorted = [...picked].sort((a, b) => a.path.localeCompare(b.path));
  const files: ProjectFile[] = [];
  let total = 0;
  let skipped = 0;
  for (const f of sorted) {
    const rel = root && f.path.startsWith(`${root}/`) ? f.path.slice(root.length + 1) : f.path;
    if (
      isIgnoredPath(rel) ||
      !isTextFile(rel) ||
      f.size > MAX_FILE_BYTES ||
      files.length >= MAX_FILES ||
      total + f.size > MAX_TOTAL_BYTES
    ) {
      skipped++;
      continue;
    }
    const content = await f.read();
    total += content.length;
    files.push({ path: rel, content });
  }
  return { files, skipped, root };
}

export function fromFileList(list: FileList | File[]): PickedFile[] {
  return Array.from(list).map((file) => ({
    path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
    size: file.size,
    read: () => file.text(),
  }));
}

/** Text handed to the model so it can build inside the project. */
export function projectContext(p: { name: string; description: string; files: ProjectFile[] }, budget = 100_000): string {
  const tree = p.files.map((f) => `- ${f.path}`).join("\n");
  let out = `Project: ${p.name}\n${p.description ? `Goal: ${p.description}\n` : ""}Files (${p.files.length}):\n${tree || "(empty — start from scratch)"}\n`;
  for (const f of p.files) {
    const block = `\n--- ${f.path} ---\n${f.content}\n`;
    if (out.length + block.length > budget) {
      out += `\n(Remaining file contents omitted to fit the limit.)\n`;
      break;
    }
    out += block;
  }
  return out;
}
