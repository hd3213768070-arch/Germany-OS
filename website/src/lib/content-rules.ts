export type PublicationStatus = "draft" | "published" | undefined;

export const stripFrontmatter = (value: string) => value.replace(/^---\s*[\s\S]*?---\s*/m, "");

export function hasSubstantialBody(body: string) {
  const text = stripFrontmatter(body)
    .replace(/^#\s+.+$/m, "")
    .replace(/[`*_>#|\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length >= 180;
}

export function isPublicMarkdown({ filename, body, status }: { filename: string; body: string; status: PublicationStatus }) {
  if (filename.toLowerCase() === "readme") return false;
  if (status === "draft") return false;
  return status === "published" || hasSubstantialBody(body);
}

export function segmentToSlug(segment: string) {
  return segment.replace(/^\d{4}_/, "").replace(/_/g, "-").toLowerCase();
}
