# Review fixes — 30 October 2026

This update addresses the supplied visual, accessibility and technical review. It does not update the immigration rules or imply legal sign-off. The rules remain version `0.1-research`, last research verification 26 October 2026.

## Changes

- Result summaries, explanations and secondary controls use theme tokens. Both themes remain available on mobile.
- Each screened calculation includes confirmed hours, the supplied hourly rate, required basic pay, actual basic pay, excluded other pay, annual requirement, period and source references. CSV and JSON exports retain the input evidence.
- Buttons include the visible “View calculation” / “Hide calculation” wording in their accessible names, with worker and period context. Screening is announced; sample/import headings receive focus. Internal navigation focuses the destination heading or requested methodology section. A skip link and larger interaction targets are included.
- Mobile cards expose period, basic pay, hourly gap, salary-window finding and next action. The wide table is optional. CSV export stays prominent; JSON, print, recheck and clear are grouped under More actions.
- Rendering is capped at 10 workers per page and 20 periods per worker. Larger worker sets start collapsed. CSV, JSON and print exports include all records, not only the current page.
- `/rules`, `/how-it-works`, `/privacy`, `/verify`, `/disclaimer` and `/worked-example` have static initial HTML, unique titles/descriptions, canonical URLs and sharing metadata. Legacy `#/…` links migrate to their path equivalents. Home has accurate SoftwareApplication metadata; no ratings or legal certification are invented. Sitemap is generated. Unknown paths retain the existing SPA fallback; a meaningful 404 HTTP status is not implemented in this release.
- The versioned methodology table and complete synthetic worked example explain supplied inputs, implemented arithmetic, exclusions and unresolved scenarios. Research source confirmation remains distinct from solicitor review.
- Excel and PDF parsers load only on demand. CSV formula neutralisation also covers whitespace-prefixed formulas. Text tables are limited to 101 columns. Workbook archives with more than 1,000 entries or over 50 MB of declared expansion are rejected before workbook parsing. Existing 5 MB upload, row, PDF-page and formula-cell limits remain.

## Verification

The production build and TypeScript check passed. The unit suite covers engine, imports, recognition, PDF extraction, guidance, export formula neutralisation, safe rendering and period pagination. Implemented engine coverage remains 100%; this does not certify legal completeness.

Production-build browser checks passed for imports, confirmation, recheck, calculation expansion, CSV/JSON export, both themes, mobile cards, direct static pages, metadata, navigation focus and worker pagination. Automated axe checks found zero violations in the tested dark/light desktop and light mobile states. These checks do not constitute a complete WCAG conformance audit.

The synthetic import → confirm → screen workflow for **1,000 workers / 3,000 periods took 386 ms** in the local Edge run, with only 10 worker groups rendered. This is a local end-to-end test timing, not a field Core Web Vital or guaranteed performance on other devices. Rendering is bounded; spreadsheet parsing still runs on the main thread. A worker-based Excel parser should be considered if representative workbooks demonstrate blocking.

At this build, core JavaScript is approximately **61.5 kB / 21.1 kB gzip**, CSS **19.6 kB / 4.8 kB gzip**. Separate on-demand assets: spreadsheet parser **499.5 kB / 163 kB gzip**, PDF module **438.9 kB / 132.2 kB gzip**, PDF worker **1,264.3 kB uncompressed**. These are build sizes, not measured public-origin transfer sizes or field performance.

The synthetic import-to-export network check found **zero payroll-data requests**; only exact known static parser assets were permitted as GETs without bodies. The production dependency audit reported zero known advisories on this run. This is not a guarantee against undiscovered vulnerabilities, deceptive ZIP metadata, parser resource exhaustion or every possible malformed document. Full security assurance and independent legal validation remain outstanding.

Screenshots, accessibility findings, the large-payroll timing and dependency audit are ignored local artifacts under `test-results/`. Historical Lighthouse scores in `docs/verification.md` have not been remeasured for this release. Field Core Web Vitals and Search Console coverage have not been measured.

## Search visibility

The hosted research preview intentionally retains `robots.txt: Disallow: /`. Static HTML, metadata and the sitemap prepare the content for a later reviewed launch; they do not mean search indexing is enabled, submitted or guaranteed. Enabling indexing requires a separate launch decision.
