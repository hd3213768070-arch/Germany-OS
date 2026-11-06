import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const contentRoot = new URL("../database/content/", import.meta.url);

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : entry.name.endsWith(".md") ? [path] : [];
  });
}

function isPublicSource(filename, body) {
  if (filename.toLowerCase() === "readme.md") return false;
  const frontmatter = body.match(/^---\s*[\s\S]*?---\s*/m)?.[0] ?? "";
  if (/^status:\s*draft\s*$/m.test(frontmatter)) return false;
  if (/^status:\s*published\s*$/m.test(frontmatter)) return true;
  const text = body.replace(/^---\s*[\s\S]*?---\s*/m, "").replace(/^#\s+.+$/m, "").replace(/[`*_>#|\-]/g, " ").replace(/\s+/g, " ").trim();
  return text.length >= 180;
}

const publicCategories = new Set(
  filesIn(contentRoot.pathname)
    .filter((path) => isPublicSource(path.split("/").at(-1) ?? "", readFileSync(path, "utf8")))
    .map((path) => relative(contentRoot.pathname, path).split("/")[0])
);

export default defineConfig({
  site: process.env.SITE_URL ?? "https://germany-os.pages.dev",
  output: "static",
  integrations: [sitemap({
    filter: (page) => {
      const pathname = new URL(page).pathname;
      if (pathname === "/search/") return false;
      const category = pathname.match(/^\/categories\/([^/]+)\/$/)?.[1];
      return !category || publicCategories.has(category);
    }
  })],
  vite: {
    plugins: [tailwindcss()]
  }
});
