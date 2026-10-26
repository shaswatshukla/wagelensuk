# Local verification — 26 October 2026

## Commands and results

`node node_modules/typescript/bin/tsc --noEmit`: exit 0.

`node node_modules/vite/bin/vite.js build`: exit 0; 7 modules transformed; static output in `dist/`. JavaScript 26.69 kB (10.12 kB gzip), CSS 12.88 kB (3.46 kB gzip), at time of audit.

`node node_modules/vitest/vitest.mjs run --coverage`: 68 tests passed after rule-reference and mitigation/export additions; implemented engine files 100% statements, branches, functions and lines. This does not certify unimplemented legal workflows or universal document extraction.

`node scripts/browser-check.cjs`: headless Microsoft Edge (Chromium), production static build served locally. Verified sample workflow, expandable findings, CSV export, file import and column mapping, six information/fallback routes, no page errors, and no page-wide overflow at 360px.

Payroll data requests: **0**, including import, recognition, confirmation, evaluation and CSV export. CSV/Excel/paste operations made no workflow requests after initial assets loaded. The first digital PDF import fetched two fixed local parser assets; no document data was present in URLs or bodies. The script allows only exact known build assets with GET and no body, and rejects every other request. Page-load requests and optional external source navigation are separate.

Axe WCAG A/AA scan: **0 violations** on home, results and the populated confirmation screen. This is an automated scan, not a complete accessibility certification. Desktop and 360px screenshots were visually inspected.

Lighthouse desktop, local origin after Excel support and loading optimisation: **Performance 91; Accessibility 100; Best Practices 100; SEO 63**. The failed SEO audit is intentional preview blocking in `robots.txt`; indexing must be enabled only after public-launch approval. The brief's all-categories 90+ target is therefore not met. No mobile Lighthouse or public-origin scores are claimed.

Additional formats verified in-browser: pasted tab-separated cells, Excel worksheet selection and TSV, all through the same mapping and validation flow. The unit suite also checks legacy XLS, formula rejection, hidden sheets and quoted text. The Excel reader is a local asset warmed after initial paint; it sends no payroll data. Initial JavaScript is approximately 32.93 kB (12.25 kB gzip), with the separate Excel reader 499.54 kB (162.96 kB gzip); CSS 14.02 kB (3.71 kB gzip).

The browser generated a landscape A4 print PDF. CSV reports include rule metadata, timestamp, disclaimer, hourly and aligned-window findings; formula-like cells are neutralised. Screenshots, audit JSON, CSV and PDF are local ignored artifacts in `test-results/`.

## Limits

This is a local website preview. Overall findings remain REVIEW; no claim of complete compliance assessment is made. Legal sign-off, full arbitrary-window treatment, irregular pattern and exception workflows, deadline helper, domain availability/pricing, infrastructure research/provisioning, CI deployment and public launch remain outstanding. See `launch-checklist.md`.
