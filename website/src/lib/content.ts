import { getCollection, type CollectionEntry } from "astro:content";
import { readFile } from "node:fs/promises";

export type Article = CollectionEntry<"articles"> & {
  category: string;
  title: string;
  description: string;
  slug: string;
  order: number;
};

export const categoryNames: Record<string, string> = {
  banking: "银行与金融",
  cities: "德国城市",
  "daily-life": "日常生活",
  digital: "数字生活",
  education: "教育路径",
  germany: "认识德国",
  government: "行政事务",
  healthcare: "医疗健康",
  housing: "住房租房",
  "how-to": "办事指南",
  "mental-health": "心理健康",
  pets: "宠物生活",
  residence: "签证居留",
  shopping: "购物消费",
  transport: "交通出行",
  university: "大学体系",
  work: "工作职业"
};

export const categoryDescriptions: Record<string, string> = {
  banking: "账户、支付、SCHUFA 与金融基础服务。",
  cities: "选择适合学习、生活与工作的德国城市。",
  "daily-life": "理解德国的日常规则、习惯与沟通。",
  digital: "手机、网络、App 与线上服务。",
  education: "德国教育体系、申请路径与国际学生指南。",
  germany: "从整体认识德国的社会、文化与制度。",
  government: "Bürgeramt、税务与重要行政事项。",
  healthcare: "医保、看病、医院与紧急医疗。",
  housing: "找房、合同、押金与租客权益。",
  "how-to": "以任务为中心的德国生活行动指南。",
  "mental-health": "心理健康、支持资源与紧急求助路径。",
  pets: "在德国养宠、看兽医与携宠出行。",
  residence: "签证、居留许可、永居与入籍。",
  shopping: "超市、线上购物、退货与包裹。",
  transport: "公共交通、铁路、驾照与汽车。",
  university: "德国大学体系、学习规则与具体大学服务。",
  work: "求职、合同、学生工与德国职场。"
};

const stripFrontmatter = (value: string) => value.replace(/^---\s*[\s\S]*?---\s*/m, "");
const stripEmoji = (value: string) => value.replace(/[\p{Extended_Pictographic}]/gu, "").trim();
const words = (value: string) => value.replace(/^\d{4}_/, "").replace(/_/g, " ").replace(/-/g, " ");

function titleFromBody(body: string, fallback: string) {
  const heading = stripFrontmatter(body).match(/^#\s+(.+)$/m)?.[1];
  return stripEmoji(heading ?? words(fallback));
}

function descriptionFromBody(body: string, fallback: string) {
  const text = stripFrontmatter(body)
    .replace(/^#\s+.+$/m, "")
    .replace(/[#>*_`|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 155 ? `${text.slice(0, 152).trim()}…` : text || fallback;
}

function segmentToSlug(segment: string) {
  return segment.replace(/^\d{4}_/, "").replace(/_/g, "-").toLowerCase();
}

function hasSubstantialBody(body: string) {
  const text = stripFrontmatter(body)
    .replace(/^#\s+.+$/m, "")
    .replace(/[`*_>#|\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length >= 180;
}

async function asArticle(entry: CollectionEntry<"articles">): Promise<Article | undefined> {
  const parts = entry.id.split("/");
  const filename = parts.at(-1) ?? "";
  const category = parts[0];
  if (!category || filename.toLowerCase() === "readme") return undefined;
  if (entry.data.status === "draft") return undefined;
  const body = entry.filePath ? await readFile(entry.filePath, "utf8") : "";
  if (entry.data.status !== "published" && !hasSubstantialBody(body)) return undefined;

  const order = Number.parseInt(filename.match(/^(\d{4})_/)?.[1] ?? "9999", 10);
  return Object.assign(entry, {
    category,
    title: entry.data.title ?? titleFromBody(body, filename),
    description: entry.data.description ?? descriptionFromBody(body, "Germany OS 知识库文章"),
    slug: parts.map(segmentToSlug).join("/"),
    order
  });
}

export async function getPublishedArticles() {
  const entries = await getCollection("articles");
  const articles = (await Promise.all(entries.map(asArticle))).filter((entry): entry is Article => Boolean(entry));
  const slugs = new Set<string>();
  for (const article of articles) {
    if (slugs.has(article.slug)) throw new Error(`Duplicate public article URL: /${article.slug}`);
    slugs.add(article.slug);
  }
  return articles.sort((a, b) => a.category.localeCompare(b.category) || a.order - b.order || a.title.localeCompare(b.title));
}

export function categoriesFor(articles: Article[]) {
  return Object.keys(categoryNames)
    .map((id) => ({ id, title: categoryNames[id], description: categoryDescriptions[id], count: articles.filter((article) => article.category === id).length }));
}

export function articleUrl(article: Article) {
  return `/${article.slug}/`;
}
