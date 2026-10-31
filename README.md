# WageLens — pay-period salary screening for UK Skilled Worker sponsors

**Research preview. Decision support, not legal advice.** This is a business-analysis portfolio case study about translating a changing rule into a transparent, privacy-first workflow. It is not a completed compliance checker or a Home Office-approved service.

## The problem

For relevant Certificates of Sponsorship assigned on or after 8 April 2026, the Skilled Worker rules require pay-period checks as well as annual salary checks. Appendix Skilled Worker paragraph SW 14.3B sets different periods for monthly and more frequent pay, and a 17-week rule for certain uneven working patterns. Sponsors also need to compare pay for every hour worked with the applicable going rate. [Home Office sponsor guidance](https://www.gov.uk/government/publications/sponsor-a-skilled-worker/workers-and-temporary-workers-sponsor-a-skilled-worker-accessible) · [Immigration Rules, Appendix Skilled Worker](https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-skilled-worker)

## What I did as a business analyst

- Turned SW 14.3A–14.4 into a rules specification, assumptions and out-of-scope cases.
- Mapped the payroll review workflow from import and field confirmation through calculation, explanation and export.
- Wrote worked examples and acceptance criteria for monthly, more-frequent and uneven-pay scenarios.
- Built a browser-only prototype that keeps payroll in the device, makes uncertain field matches visible, and shows the arithmetic behind a finding.
- Recorded the current gaps rather than presenting uncertain results as legal conclusions.

**Try the public baseline:** [Open WageLens](https://wagelensuk.wluk.workers.dev/#/) · **BA case study:** [Problem, stakeholders, requirements, risks and acceptance criteria](docs/ba-case-study.md) · **Two-minute walkthrough:** [Demo steps and engineering notes](docs/portfolio.md)

> This public repository is the portfolio baseline. A separate private research repository contains newer work and its Vercel preview may require temporary access. Do not assume the public Worker demo and private Vercel preview are the same build.

## Scope at a glance

| Area | Status | What that means |
|---|---|---|
| Import and field review | Prototype done | Excel, CSV, TSV, pasted cells and supported digital PDFs; users review field matches and extracted values. A sample-data button is available on the first screen. |
| Basic hourly screen | Partial | Basic pay is compared with actual hours and a supplied hourly rate. |
| Aligned annual salary windows | Partial | The prototype screens aligned monthly and 12-week windows; arbitrary boundaries and all circumstances are not covered. |
| 17-week uneven-pattern rule | Not implemented as a final check | The relevant pattern and pay must be assessed under the rules; use a qualified adviser. |
| Final compliance verdict | Not implemented | Overall findings remain REVIEW. The prototype does not return a definitive PASS or FAIL. |
| Occupation and salary requirements | Not selected by the public baseline | Confirm the SOC code and applicable salary option from the actual job and CoS. Do not infer them from job title or generic payroll columns. |
| Legal exceptions and deadlines | Not complete | Deductions, transitional cases and other exceptions need further assessment. |

A completed import is not a compliance verdict. Never use a WageLens result as the only basis for sponsor action.

## Two-minute demo

1. Open the public baseline and choose **Try sample screening**.
2. Inspect the sample’s possible hourly shortfall and expand the calculation.
3. Open **How these findings are calculated** to see the rules and limitations.
4. Export a report, then clear the sample.

No real employee payroll is needed for the walkthrough.

## Run locally

Node 22+ and pnpm:

```sh
pnpm install
pnpm dev
pnpm test
pnpm coverage
pnpm build
```

The browser/privacy check is `node scripts/browser-check.cjs` after building. It uses installed Edge on Windows and saves artifacts under ignored `test-results/`.

## Privacy and technical notes

The public baseline is a static TypeScript/Vite site. Payroll import, confirmation, calculations and exports run in the browser. There is no payroll database, account system or analytics. The project tests that payroll is not sent in network requests; ordinary page requests may still be logged by the hosting provider. Use worker references and avoid names or National Insurance numbers.

Money comparisons use integer pence and rational arithmetic for fractional hours. The import flow shows source headings and values so users can correct extraction. Supported digital PDF extraction is approximate and requires checking the original document. Scanned PDFs/OCR and arbitrary Word documents are out of scope.

## Rules and evidence

The public baseline stores a versioned research rules file at `src/rules/skilled-worker.json`. Its `lastVerified` date records the last source review; it is not a live Home Office feed and does not mean solicitor approval. Rule text can change, so check GOV.UK directly before relying on it.

- [Appendix Skilled Worker](https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-skilled-worker)
- [Appendix Skilled Occupations](https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-skilled-occupations)
- [Sponsor a Skilled Worker guidance](https://www.gov.uk/government/publications/sponsor-a-skilled-worker/workers-and-temporary-workers-sponsor-a-skilled-worker-accessible)

## Licence

No open-source licence is declared. All rights are reserved by default; viewing this public repository does not grant permission to reuse or redistribute its code. Ask the owner before reuse.
