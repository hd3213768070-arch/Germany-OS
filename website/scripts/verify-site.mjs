import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { hasSubstantialBody, isPublicMarkdown, segmentToSlug } from "../src/lib/content-rules.ts";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const categories = ["banking", "cities", "daily-life", "digital", "education", "germany", "government", "healthcare", "housing", "how-to", "mental-health", "pets", "residence", "shopping", "transport", "university", "work"];
const exists = async (path) => access(path).then(() => true).catch(() => false);
const htmlFilesIn = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = entries.map(async (entry) => {
  const path = resolve(directory, entry.name);
  return entry.isDirectory() ? htmlFilesIn(path) : entry.name === "index.html" ? [path] : [];
  });
  return (await Promise.all(paths)).flat();
};

for (const category of categories) assert.equal(await exists(resolve(dist, "categories", category, "index.html")), true, `Missing category route: ${category}`);
for (const file of ["sitemap-index.xml", "robots.txt", "pagefind/pagefind.js", "pagefind/pagefind-entry.json"]) assert.equal(await exists(resolve(dist, file)), true, `Missing generated asset: ${file}`);

assert.equal(isPublicMarkdown({ filename: "0001_Test.md", body: "# Test\n\n" + "x".repeat(240), status: "draft" }), false, "Draft content must be excluded");
assert.equal(isPublicMarkdown({ filename: "0001_Placeholder.md", body: "# Placeholder", status: undefined }), false, "Title-only placeholders must be excluded");
assert.equal(hasSubstantialBody("# Published\n\n" + "x".repeat(240)), true, "Substantive legacy content must be included");
assert.equal(segmentToSlug("0012_Germany_Overview"), "germany-overview", "Numeric prefixes must be removed from URLs");

assert.equal(await exists(resolve(dist, "cities", "berlin", "overview", "index.html")), false, "Title-only source files must not generate public article routes");
const entry = JSON.parse(await readFile(resolve(dist, "pagefind/pagefind-entry.json"), "utf8"));
assert.ok(entry.languages?.["zh-cn"]?.page_count > 0, "Pagefind must index published articles");

const sitemapIndex = await readFile(resolve(dist, "sitemap-index.xml"), "utf8");
const sitemapPaths = [...sitemapIndex.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
const sitemapFiles = await Promise.all(sitemapPaths.map((path) => readFile(resolve(dist, path.replace(/^\//, "")), "utf8")));
const sitemap = sitemapFiles.join("\n");
assert.ok(!sitemap.includes("/search/"), "Search must be excluded from the sitemap");

for (const category of categories) {
  const categoryPath = `/categories/${category}/`;
  const html = await readFile(resolve(dist, "categories", category, "index.html"), "utf8");
  const isNoindex = html.includes('name="robots" content="noindex,follow"');
  assert.equal(sitemap.includes(`${categoryPath}</loc>`), !isNoindex, `Sitemap and robots policy disagree for ${categoryPath}`);
}

const publicHtml = await htmlFilesIn(dist);
for (const path of publicHtml.filter((path) => !path.includes("/categories/") && !path.includes("/search/"))) {
  const html = await readFile(path, "utf8");
  assert.ok(!html.includes('name="robots" content="noindex,follow"'), `Unexpected noindex on ${path}`);
}

for (const url of [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname)) {
  const output = url === "/" ? resolve(dist, "index.html") : resolve(dist, decodeURIComponent(url).replace(/^\//, ""), "index.html");
  assert.equal(await exists(output), true, `Sitemap URL has no generated page: ${url}`);
}

console.log(`Verified ${categories.length} category routes, publication rules, noindex policy, sitemap URLs, and Pagefind assets.`);
