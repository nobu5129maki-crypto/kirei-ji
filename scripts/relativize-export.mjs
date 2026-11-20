import { readdir, readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve("out");
const prefix = "/kirei-ji/";

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

function baseHref(file) {
  const rel = path.relative(outDir, file);
  const depth = path.dirname(rel) === "." ? 0 : path.dirname(rel).split(path.sep).length;
  if (depth === 0) return "./";
  return "../".repeat(depth);
}

const publicAssets = [
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/icon.png",
  "/favicon.ico",
  "/apple-icon.png",
];

function stripRootAssets(text) {
  let next = text;
  for (const asset of publicAssets) {
    next = next.replaceAll(asset, asset.slice(1));
  }
  return next;
}

function relativizeHtml(html, file) {
  const href = baseHref(file);
  let next = html.replaceAll(prefix, "");
  next = next.replaceAll('"/_next/', '"_next/');
  next = next.replaceAll("'/_next/", "'_next/");
  next = next.replaceAll("=/_next/", "=_next/");
  next = stripRootAssets(next);
  if (!next.includes("<base ")) {
    next = next.replace("<head>", `<head><base href="${href}">`);
  }
  return next;
}

function relativizeCss(css, file) {
  const dir = path.dirname(file);
  return css.replace(/url\((['"]?)\/(?:kirei-ji\/)?(_next\/[^)'"]+)\1\)/g, (_full, quote, asset) => {
    const target = path.join(outDir, asset);
    let rel = path.relative(dir, target).split(path.sep).join("/");
    if (!rel.startsWith(".")) rel = `./${rel}`;
    return `url(${quote}${rel}${quote})`;
  });
}

function relativizeJs(text) {
  return stripRootAssets(text.replaceAll(`${prefix}_next/`, "_next/"));
}

function relativizeText(text) {
  return stripRootAssets(text.replaceAll(`${prefix}_next/`, "_next/").replaceAll(prefix, ""));
}

const files = await walk(outDir);
for (const file of files) {
  const ext = path.extname(file);
  if (![".html", ".js", ".css", ".txt"].includes(ext)) continue;
  const raw = await readFile(file, "utf8");
  const next =
    ext === ".html"
      ? relativizeHtml(raw, file)
      : ext === ".css"
        ? relativizeCss(raw, file)
        : ext === ".txt"
          ? relativizeText(raw)
          : relativizeJs(raw);
  if (next !== raw) await writeFile(file, next);
}

const xserverDir = path.resolve("xserver");
for (const name of [".htaccess", "auth.php", "gate.php", "index.php", "sw.js"]) {
  await copyFile(path.join(xserverDir, name), path.join(outDir, name));
}
await mkdir(outDir, { recursive: true });
console.log("relativized", outDir);
