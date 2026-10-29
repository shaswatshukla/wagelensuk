import rules from "./rules/skilled-worker.json";
export const siteURL = "https://wagelensuk.wluk.workers.dev";
export const pageMeta: Record<string, { title: string; description: string }> =
  {
    "/": {
      title: "Skilled Worker Payroll Salary Screening | WageLens",
      description:
        "Screen payroll against user-supplied Skilled Worker salary requirements. Browser-only processing, explainable calculations and exportable research-preview findings.",
    },
    "/rules": {
      title: "Salary screening methodology and limitations | WageLens",
      description:
        "Inspect WageLens rules, inputs, arithmetic, verification dates and unsupported scenarios. Specialist validation remains pending.",
    },
    "/how-it-works": {
      title: "How payroll screening works | WageLens",
      description:
        "Import existing payroll, confirm extracted fields and supplied thresholds, then review explainable salary-screening findings.",
    },
    "/worked-example": {
      title: "Worked payroll shortfall example | WageLens",
      description:
        "Follow synthetic payroll inputs through a £200 hourly shortfall calculation and a three-month salary-window example.",
    },
    "/privacy": {
      title: "Payroll privacy and local processing | WageLens",
      description:
        "How WageLens handles payroll in browser memory, excludes identifiers and provides local exports.",
    },
    "/verify": {
      title: "Verify browser-only payroll processing | WageLens",
      description:
        "Inspect network requests while importing, screening and exporting synthetic payroll data.",
    },
    "/disclaimer": {
      title: "Research preview limitations | WageLens",
      description:
        "WageLens offers decision support and incomplete screening, with overall findings requiring review. It does not provide legal advice.",
    },
  };
const source =
  "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-skilled-worker";
export const docs: Record<string, [string, string]> = {
  "/how-it-works": [
    "A clearer path through payroll.",
    "<p>Import an Excel, CSV or TSV file, or paste spreadsheet cells using pseudonymous worker references, map your columns, and review each finding. Supply the applicable annual requirement and hourly going rate yourself; WageLens does not select thresholds or occupation codes.</p><p>This research preview uses deterministic hourly screening and aligned-window arithmetic. Aligned 3-month and 12-week windows are screened where full history is supplied. Arbitrary boundaries, 17-week patterns, exceptions and reporting deadlines require further implementation and legal review.</p>" +
      `<p><a href="/worked-example">See a complete worked example →</a></p>`,
  ],
  "/rules": [
    "The rules. In the open.",
    `<p>Version ${rules.version} · Last verified ${rules.lastVerified} · Solicitor review pending.</p><h2>What this preview checks</h2><p>Basic pay compared with your supplied hourly rate × hours worked. Bonuses and other pay do not cover an hourly shortfall in this preview. Earlier CoS assignments and every overall finding require REVIEW.</p><h2>What needs further review</h2><p>Arbitrary window boundaries and 17-week salary patterns; deductions; unpaid leave; part periods; contractual frequencies; transitional cases and changing salary requirements. Aligned window arithmetic may show PASS or FAIL; it does not clear every possible boundary or exception. Every overall finding remains REVIEW.</p><h2>Primary sources</h2><ul><li><a href="${source}" target="_blank" rel="noreferrer">Appendix Skilled Worker, SW 14.1–14.3B</a></li><li><a href="https://assets.publishing.service.gov.uk/media/69e76a2ff766dcdcd05034ff/Sponsor-a-Skilled-Worker-04-26-v1.0_.pdf" target="_blank" rel="noreferrer">Sponsor guidance version 04/26, SK7–SK8</a></li><li><a href="https://www.gov.uk/government/publications/workers-and-temporary-workers-guidance-for-sponsors-part-3-sponsor-duties-and-compliance/workers-and-temporary-workers-guidance-for-sponsors-part-3-sponsor-duties-and-compliance-accessible" target="_blank" rel="noreferrer">Sponsor reporting duties, C1.15</a></li></ul><p>All currently listed rules are PRIMARY-CONFIRMED; implementation limitations still require REVIEW. Decision support, not legal advice.</p>`,
  ],
  "/privacy": [
    "Your payroll stays yours.",
    '<p>Payroll files and pasted cells are read and processed in browser memory. There is no account, backend, database, analytics, tracking cookie or persistent payroll storage in this application.</p><p>Names, NI numbers, addresses and other direct identifiers must be removed before import. Identifying columns are excluded from suggested matches and screening inputs. Header recognition cannot guarantee that selected cells contain no personal data, so confirmation is required. Digital PDF extraction uses readable text only; scans are unsupported.</p><p>Clear data or reload the page to discard imported data from application memory. Exported files are saved to your own device. External source links open GOV.UK only when you choose them.</p><p>The hosting provider may receive ordinary page-request metadata; it does not receive the contents of your payroll through this application. This portfolio demonstration is maintained by <a href="https://github.com/shaswatshukla" target="_blank" rel="noreferrer">shaswatshukla on GitHub</a>.</p><p><a href="#/verify">Verify browser-only processing →</a></p>',
  ],
  "/verify": [
    "Trust you can inspect.",
    "<ol><li>Open your browser’s developer tools and select Network.</li><li>Wait for the page to load, then clear the request log.</li><li>Choose a payroll file or paste spreadsheet cells, map columns, run screening and export a report.</li><li>No application request should contain the file, rows or findings. The digital PDF reader may fetch fixed local parser assets on first use. Those requests must contain no payroll data.</li></ol><p>During local development, Vite maintains a reload connection. Verify the built production version for launch assurance. Do not share screenshots or network logs that contain payroll.</p>",
  ],
  "/disclaimer": [
    "Clarity, with the right context.",
    "<p>WageLens is decision support, not legal advice. It cannot confirm that a business is compliant, will pass an audit, or is safe from enforcement.</p><p>The preview only screens a subset of payroll arithmetic against the values you enter. Every overall result is REVIEW. Rules may change, the inputs may be incomplete, and exceptions may require an immigration adviser’s judgment.</p><p>Do not use a potential shortfall as an automatic reporting decision. Review the applicable duties and circumstances with your adviser. This hosted portfolio demonstration is a research preview. A production compliance-service launch remains pending solicitor review and completion of the outstanding checks.</p>",
  ],
};

docs["/worked-example"] = [
  "A calculation you can follow.",
  `<p>Synthetic example · rules ${rules.version} · last research verification ${rules.lastVerified}. These example thresholds are illustrative, not a recommendation for any occupation.</p><h2>Hourly example: a £200 potential gap</h2><dl><dt>Worker and period</dt><dd>DEMO-002 · 1–31 July 2026</dd><dt>Actual hours supplied</dt><dd>160</dd><dt>Hourly requirement supplied</dt><dd>£20</dd><dt>Basic pay supplied</dt><dd>£3,000</dd><dt>Other pay supplied</dt><dd>£500, excluded from this comparison</dd></dl><p><strong>160 × £20 = £3,200 required basic pay. £3,200 − £3,000 = £200 potential gap.</strong></p><p>The preview flags a potential gap. Confirm source values, eligibility, deductions and exceptions with your adviser before acting. Reference: SW 14.3B(a). No reporting decision or deadline is calculated.</p><h2>Three-month example: hourly screening can pass while a salary window fails</h2><p>DEMO-003 receives £4,000 basic pay in each of July, August and September 2026, works 160 hours each month, and has supplied requirements of £20/hour and £52,000/year. Its CoS assignment is 8 April 2026.</p><p>Hourly: 160 × £20 = £3,200, below £4,000 basic pay. Aligned July–September basic pay: £4,000 × 3 = £12,000. Supplied annual requirement × 3/12: £52,000 × 3/12 = £13,000. Potential aligned-window gap: £13,000 − £12,000 = <strong>£1,000</strong>.</p><p>July and August lack a complete three-month history in this file. September completes one aligned window. Every overall finding remains REVIEW: arbitrary boundaries, exceptions and full eligibility are unresolved.</p><p><a href="/rules#methodology">Inspect the methodology and limitations</a> · <a href="/">Try sample screening</a></p>`,
];
docs["/rules"][1] +=
  `<h2 id="inputs">Inputs you must verify</h2><p>Each worker needs a pseudonymous reference, payroll period and payment date, pay frequency, basic pay, other pay, actual hours worked, CoS assignment date, required annual salary and required hourly going rate. Confirm applicable requirements from the worker’s CoS and current Home Office guidance with your adviser. Payroll labels alone cannot establish eligibility or select the occupation, route or transitional treatment.</p><h2 id="methodology">Versioned methodology</h2><div class="table-shell" tabindex="0" role="region" aria-label="Screening methodology"><table><caption>Rules ${rules.version} · verified ${rules.lastVerified} · solicitor review pending</caption><thead><tr><th scope="col">Provision / interpretation</th><th scope="col">Implemented arithmetic</th><th scope="col">Unsupported / review cases</th></tr></thead><tbody><tr><td><a href="${source}">SW 14.3B(a)</a> · hourly basic-pay screen</td><td>Actual hours × supplied hourly rate, compared with confirmed basic pay. Money uses integer pence and rational hours; displayed minimum pennies round upward.</td><td>Earlier CoS, eligible-pay classification, leave, deductions and legal exceptions require review.</td></tr><tr><td><a href="${source}">SW 14.3B(b)–(d)</a> · aligned salary windows</td><td>Complete aligned monthly history: annual requirement × 3/12. More frequent payroll: annual requirement × 12/52.</td><td>Arbitrary boundaries, missing history, gaps, partial periods, changes and 17-week patterns remain outside complete implementation.</td></tr></tbody></table></div><p>Research source confirmation is not legal sign-off. All overall results remain REVIEW. <a href="/worked-example">See inputs, arithmetic and outcomes together →</a></p>`;
