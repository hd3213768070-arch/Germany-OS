# Germany OS Website

Astro 静态网站项目。它在构建时直接读取仓库根目录的 `../database/content/**/*.md`，不会复制、迁移或改写原始知识库内容。

## Local development

```bash
cd website
npm install
ASTRO_TELEMETRY_DISABLED=1 npm run dev
```

生产构建（包含 Pagefind 搜索索引）：

```bash
ASTRO_TELEMETRY_DISABLED=1 npm run build
```

## Content behaviour

- `README.md` 用作目录说明，不会作为普通文章发布。
- `status: draft` 的文章不会公开。
- 没有 `status` 的旧文章按正文长度判断是否公开；只有标题的骨架文件不会进入文章索引和 Pagefind。
- 标题依次使用 frontmatter `title`、第一个 H1、文件名。
- URL 从路径生成，移除四位编号前缀；构建时遇到公开 URL 冲突会失败。

## Cloudflare Pages

| Setting | Value |
| --- | --- |
| Project root | `website` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Production branch | `main` |

设置环境变量 `SITE_URL` 为正式域名，例如 `https://www.example.de`，用于 canonical URL、sitemap 和 robots.txt。
