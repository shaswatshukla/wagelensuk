import { defineConfig } from "vite";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { docs, pageMeta, siteURL } from "./src/pages";
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export default defineConfig({
  plugins: [
    {
      name: "static-document-pages",
      closeBundle() {
        const out = resolve("dist");
        const template = readFileSync(resolve(out, "index.html"), "utf8");
        for (const [path, meta] of Object.entries(pageMeta)) {
          const entry = docs[path];
          const content = entry
            ? `<h1>${entry[0]}</h1>${entry[1]}`
            : `<h1>Spot potential Skilled Worker salary shortfalls.</h1><p>Compare payroll with your supplied salary requirements and export findings for review. Processing stays in your browser.</p><p>Research preview: every overall finding requires review. Supply the applicable thresholds; WageLens does not select occupation codes or provide legal advice. Enable JavaScript to use the screening form.</p>`;
          let html = template
            .replace(
              /<title>.*?<\/title>/,
              `<title>${escape(meta.title)}</title>`,
            )
            .replace(
              /(<meta\s+name="description"\s+content=")[^"]*(")/,
              `$1${escape(meta.description)}$2`,
            )
            .replace(
              /(<link rel="canonical" href=")[^"]*(")/,
              `$1${siteURL}${path === "/" ? "/" : path}$2`,
            );
          for (const [name, value] of Object.entries({
            "og:title": meta.title,
            "og:description": meta.description,
            "og:url": siteURL + (path === "/" ? "/" : path),
            "twitter:title": meta.title,
            "twitter:description": meta.description,
          })) {
            html = html.replace(
              new RegExp(
                `(<meta\\s+(?:property|name)="${name}"\\s+content=")[^"]*(")`,
              ),
              `$1${escape(value)}$2`,
            );
          }
          html = html.replace(
            '<div id="app"></div>',
            `<div id="app"><header><a href="/">WageLens</a><nav aria-label="Main navigation"><a href="/how-it-works">How it works</a> · <a href="/rules">Rules and methodology</a> · <a href="/worked-example">Worked example</a> · <a href="/privacy">Privacy</a></nav></header><main class="wrap document">${content}</main></div>`,
          );
          if (path === "/") html = html.replace("</head>", `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "WageLens", url: siteURL + "/", applicationCategory: "BusinessApplication", operatingSystem: "Web browser", description: pageMeta["/"].description, creator: { "@type": "Person", name: "shaswatshukla", url: "https://github.com/shaswatshukla" } })}</script></head>`);
          const folder = path === "/" ? out : resolve(out, path.slice(1));
          mkdirSync(folder, { recursive: true });
          writeFileSync(resolve(folder, "index.html"), html);
        }
        // Preview remains intentionally excluded from indexing; no sitemap submission is implied.
        writeFileSync(
          resolve(out, "sitemap.xml"),
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(
            pageMeta,
          )
            .map(
              (p) => `<url><loc>${siteURL}${p === "/" ? "/" : p}</loc></url>`,
            )
            .join("")}</urlset>`,
        );
      },
    },
  ],
});
