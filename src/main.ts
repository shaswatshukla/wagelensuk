import "./style.css";
import { calculationParameters, findingGuidance, structuredReport, officialLinks } from "./guidance";
import { mountConfirmation } from "./confirmation";
import {
  preloadWorkbookTools,
  acceptedFiles,
  maxBytes,
  readPayrollFile,
  textToCSV,
  type PayrollImport,
} from "./imports";
import {
  columns,
  csvCells,
  parsePayroll,
  evaluate,
  rules,
  type Result,
  type Row,
} from "./engine/index";
const app = document.querySelector<HTMLDivElement>("#app")!;
let results: Result[] = [];
let confirmedPayroll: Row[] = [];
let sample = false;
let raw = "";
let headers: string[] = [];
let fileName = "";
let pendingFileName = "";
const money = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    p / 100,
  );
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const icon = (name: string, size = 16) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({ lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>', upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/>', file: '<path d="M14 2H5v20h14V7l-5-5Z M14 2v6h5M8 12h8m-8 4h6"/>', shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>', arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', download: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>', check: '<path d="m5 12 4 4L19 6"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>' } as Record<string, string>)[name] || ""}</svg>`;
const sampleCSV =
  columns.join(",") +
  "\n" +
  [
    [
      "SW-001",
      "2026-07-01",
      "2026-07-31",
      "2026-07-31",
      "4400",
      "0",
      "160",
      "52000",
      "20",
      "2026-04-08",
      "monthly",
    ],
    [
      "SW-002",
      "2026-07-01",
      "2026-07-31",
      "2026-07-31",
      "3000",
      "1200",
      "160",
      "52000",
      "20",
      "2026-04-08",
      "monthly",
    ],
    [
      "SW-003",
      "2026-07-01",
      "2026-07-31",
      "2026-07-31",
      "4200",
      "0",
      "175",
      "50400",
      "24",
      "2026-03-15",
      "monthly",
    ],
  ]
    .map((r) => r.join(","))
    .join("\n");
function brand() {
  return '<a class="brand" href="#/" aria-label="WageLens home"><span class="logo" aria-hidden="true">W</span>WageLens<span class="dot"></span></a>';
}
function shell(content: string) {
  app.innerHTML = `<header>${brand()}<nav aria-label="Main navigation"><a href="#/" class="${route() === "/" ? "active" : ""}">Salary checker</a><a href="#/how-it-works">How it works</a><a href="#/rules">Rules & sources ↗</a></nav><div class="header-end"><span class="private"><span class="dot"></span> Private by design</span><button class="icon-btn" id="theme" aria-label="Toggle colour theme">${icon("sun")}</button></div></header><main class="wrap">${content}</main><footer>${brand()}<p>Built for clarity. Designed for privacy.<br>Decision support, not legal advice. Always review findings with your adviser.</p><div class="links"><a href="#/privacy">Privacy</a><a href="#/disclaimer">Disclaimer</a><a href="#/rules">Sources ↗</a></div></footer>`;
  document
    .querySelector("#theme")
    ?.addEventListener("click", () =>
      document.documentElement.classList.toggle("light"),
    );
}
function route() {
  return location.hash.slice(1) || "/";
}
function how() {
  return `<section class="how" id="how"><div class="how-heading"><h2>Less admin. More clarity.</h2><p>Three steps. Your data stays with you.</p></div><div class="how-grid"><article class="how-card"><span class="number">01 / IMPORT</span><h3>Your payroll. Your format.</h3><p>Import your Excel, CSV, TSV or digital PDF, or paste spreadsheet cells. We suggest the useful fields. Confirm the matches and fill any missing details.</p></article><article class="how-card"><span class="number">02 / SCREEN</span><h3>See the numbers behind the pay.</h3><p>Screen basic pay against your supplied hourly rate. Missing evidence is flagged for review.</p></article><article class="how-card"><span class="number">03 / TAKE ACTION</span><h3>A clear next step for every finding.</h3><p>Explore each worker’s findings and export a report to review with your payroll team or adviser.</p></article></div></section>`;
}
function render() {
  if (route() !== "/") {
    renderDoc();
    return;
  }
  shell(
    `<section class="hero"><div><div class="eyebrow"><span></span> SKILLED WORKER SALARY SCREENING</div><h1>Every pay period.<br><em>A clearer picture.</em></h1><p>Spot potential salary shortfalls in your sponsored workforce. Your payroll stays in your browser.</p></div><aside class="hero-aside"><div class="tiny">${icon("shield", 15)} Your data is your business.</div><p>No accounts. No uploads. No tracking.<br>Just a clearer view of the numbers,<br>with the rules behind every finding.</p></aside></section><div class="feature-strip"><span><b>✓</b> Free to use</span><span><b>✓</b> No sign-up needed</span><span><b>✓</b> Browser-only processing</span><span><b>↗</b> Based on published Home Office rules</span></div><section class="workspace" aria-labelledby="checker-title"><div class="workspace-top"><div class="workspace-title"><span class="square-icon">${icon("file")}</span><span id="checker-title">Check your payroll</span><span class="tag">RESEARCH PREVIEW</span></div><div class="steps"><span class="current"><b>1</b> Import payroll</span><i></i><span><b>2</b> Confirm fields</span><i></i><span><b>3</b> Review findings</span></div></div><div id="import-content"><div class="workspace-body"><div class="upload-area"><div class="import-tabs" role="tablist" aria-label="Payroll input method"><button id="upload-tab" role="tab" aria-selected="true" aria-controls="upload-panel" tabindex="0">${icon("file", 14)} Upload a file</button><button id="paste-tab" role="tab" aria-selected="false" aria-controls="paste-panel" tabindex="-1">${icon("file", 14)} Paste spreadsheet</button></div><div id="upload-panel" role="tabpanel" aria-labelledby="upload-tab"><div class="dropzone" id="dropzone"><div class="upload-icon">${icon("upload", 24)}</div><h2>Drop your payroll file here</h2><p>Your existing payroll export. We find the fields.</p><button class="primary" id="browse">${icon("upload", 14)} Choose payroll file</button><input type="file" id="file" accept="${acceptedFiles}" hidden><p class="file-note"><span class="format-pill">.xlsx / .xls</span> <span class="format-pill">.csv</span> <span class="format-pill">.tsv</span> <span class="format-pill">.pdf</span><br>Up to 5 MB · Digital PDFs supported · No scans yet</p></div><div class="under-drop"><span>Just exploring? <button class="text-btn" id="sample">Try sample data ${icon("arrow", 12)}</button></span><button class="text-btn" id="template">${icon("download", 12)} Download CSV template</button></div></div><div id="paste-panel" role="tabpanel" aria-labelledby="paste-tab" hidden><label for="paste-data" class="paste-label">Paste your payroll cells</label><p class="paste-help" id="paste-help">Copy from Excel or Google Sheets, including the header row. We suggest matching columns and exclude obvious identifiers.</p><textarea id="paste-data" aria-describedby="paste-help" placeholder="worker_ref&#9;pay_period_start&#9;basic_pay_gbp&#10;SW-001&#9;2026-07-01&#9;4400" spellcheck="false" maxlength="5242880"></textarea><button class="primary" id="use-paste">Find payroll fields ${icon("arrow", 14)}</button></div><div id="error" role="alert" class="error"></div></div><aside class="sidebar"><h3>A little preparation goes a long way.</h3><div class="side-item"><span class="side-icon">${icon("file")}</span><div><strong>Use worker references</strong><p>Obvious identifying columns are excluded automatically. Confirm that selected fields contain no names or NI numbers.</p></div></div><div class="side-item"><span class="side-icon">${icon("check")}</span><div><strong>Have your CoS details ready</strong><p>You supply the required annual salary and applicable hourly going rate.</p></div></div><div class="side-item"><span class="side-icon">${icon("info")}</span><div><strong>Clear findings, no false certainty</strong><p>Unconfirmed rules or missing context always mean review.</p></div></div></aside></div></div><div class="privacy-line">${icon("lock", 12)} Processed in your browser. Nothing uploaded.<a class="text-btn" href="#/verify">Verify this ↗</a></div></section><div id="results"></div>${how()}`,
  );
  bindImport();
  renderResults();
}
function bindImport() {
  const tabs = [
    document.querySelector<HTMLButtonElement>("#upload-tab")!,
    document.querySelector<HTMLButtonElement>("#paste-tab")!,
  ];
  function selectTab(index: number) {
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")!)!.hidden =
        i !== index;
    });
    document.querySelector("#error")!.textContent = "";
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(index));
    tab.addEventListener("keydown", (e) => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        const next = e.key === "Home" ? 0 : e.key === "End" ? 1 : 1 - index;
        selectTab(next);
        tabs[next].focus();
      }
    });
  });
  document.querySelector("#use-paste")?.addEventListener("click", () => {
    try {
      const value =
        document.querySelector<HTMLTextAreaElement>("#paste-data")!.value;
      if (new Blob([value]).size > maxBytes)
        throw Error("Paste less than 5 MB of payroll data.");
      if (!value.trim())
        throw Error("Paste your header row and payroll data first.");
      stageImport(textToCSV(value), "Pasted spreadsheet");
    } catch (e) {
      showImportError(e);
    }
  });

  document
    .querySelector("#browse")
    ?.addEventListener("click", () =>
      document.querySelector<HTMLInputElement>("#file")!.click(),
    );
  document.querySelector("#file")?.addEventListener("change", (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) void loadFile(f);
  });
  const zone = document.querySelector("#dropzone");
  zone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("drag");
  });
  zone?.addEventListener("dragleave", () => zone.classList.remove("drag"));
  zone?.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("drag");
    const f = (e as DragEvent).dataTransfer?.files[0];
    if (f) void loadFile(f);
  });
  document.querySelector("#sample")?.addEventListener("click", () => {
    sample = true;
    fileName = "wagelens-sample.csv";
    confirmedPayroll = parsePayroll(sampleCSV);
    results = evaluate(confirmedPayroll);
    renderResults();
    document
      .querySelector("#results")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document
    .querySelector("#template")
    ?.addEventListener("click", () =>
      download(sampleCSV, "wagelens-template.csv"),
    );
}
function stageImport(csv: string, name: string) {
  mountConfirmation(
    document.querySelector("#import-content")!,
    csv,
    name,
    (confirmed) => {
      confirmedPayroll = confirmed;
      results = evaluate(confirmedPayroll);
      fileName = name;
      pendingFileName = "";
      sample = false;
      raw = "";
      headers = [];
      render();
      document
        .querySelector("#results")
        ?.scrollIntoView({ behavior: "smooth" });
    },
    () => {
      raw = "";
      headers = [];
      pendingFileName = "";
      render();
    },
  );
}
async function loadFile(file: File) {
  try {
    const imported = await readPayrollFile(file);
    if (imported.sheets.length === 1) {
      stageImport(imported.csvForSheet(imported.sheets[0]), file.name);
      return;
    }
    renderSheetPicker(imported, file.name);
  } catch (e) {
    showImportError(e);
  }
}
function showImportError(e: unknown) {
  const el = document.querySelector("#error");
  if (el) el.textContent = (e as Error).message;
}
function renderSheetPicker(imported: PayrollImport, name: string) {
  document.querySelector("#import-content")!.innerHTML =
    `<div class="mapping"><h2>Choose your payroll sheet.</h2><p>${esc(name)} · Select the sheet containing your payroll table. Hidden sheets are excluded.</p><label class="paste-label" for="payroll-sheet">Worksheet</label><select id="payroll-sheet">${imported.sheets.map((sheet) => `<option value="${esc(sheet)}">${esc(sheet)}</option>`).join("")}</select><div id="error" class="error" role="alert"></div><div class="sheet-actions"><button id="use-sheet" class="primary">Map this sheet ${icon("arrow", 14)}</button><button class="secondary" id="sheet-cancel">Choose another file</button></div></div>`;
  document.querySelector("#use-sheet")!.addEventListener("click", () => {
    try {
      stageImport(
        imported.csvForSheet(
          document.querySelector<HTMLSelectElement>("#payroll-sheet")!.value,
        ),
        name,
      );
    } catch (e) {
      showImportError(e);
    }
  });
  document.querySelector("#sheet-cancel")!.addEventListener("click", () => {
    raw = "";
    headers = [];
    render();
  });
}
function renderResults() {
  const el = document.querySelector("#results");
  if (!el) return;
  if (!results.length) {
    el.innerHTML = "";
    return;
  }
  const workers = new Set(results.map((r) => r.worker)).size;
  const issues = results.filter((r) => r.shortfallAmount).length;
  el.innerHTML = `<section class="results-section" aria-labelledby="results-title"><div class="section-head"><div><h2 id="results-title">Your payroll, in focus. <span class="tag">${sample ? "SAMPLE DATA" : "LOCAL FILE"}</span></h2><p>${esc(fileName)} · Pay-period screening preview</p></div><div class="report-actions"><button class="secondary" id="recheck">↻ Recheck data</button><button class="secondary" id="export-json">Export JSON</button><button class="secondary" id="export">${icon("download", 12)} Export CSV</button><button class="secondary" id="print">${icon("file", 12)} Print / save PDF</button><button class="secondary" id="clear">Clear data</button></div></div><div class="summary"><div class="stat"><div class="stat-top">Workers screened ${icon("file", 12)}</div><strong>${workers.toString().padStart(2, "0")}</strong></div><div class="stat"><div class="stat-top">Pay periods ${icon("check", 12)}</div><strong>${results.length.toString().padStart(2, "0")}</strong></div><div class="stat"><div class="stat-top">Potential hourly shortfalls ${icon("info", 12)}</div><strong class="red">${issues.toString().padStart(2, "0")}</strong></div><div class="stat"><div class="stat-top">Need full review ${icon("info", 12)}</div><strong class="amber">${results
    .filter((r) => r.status === "REVIEW")
    .length.toString()
    .padStart(
      2,
      "0",
    )}</strong></div></div><div class="table-shell" tabindex="0" role="region" aria-label="Scrollable pay-period findings"><table><caption class="file-note">Pay-period findings — expand each row for the calculation and next step</caption><thead><tr><th scope="col">Worker reference</th><th scope="col">Pay period</th><th scope="col">Basic pay</th><th scope="col">Hourly screen</th><th scope="col">Overall finding</th><th scope="col">Details</th></tr></thead><tbody>${results
    .map(
      (r, i) =>
        `<tr><td><div class="worker-ref"><span class="avatar">${String(i + 1).padStart(2, "0")}</span>${esc(r.worker)}</div></td><td>${esc(r.period)}</td><td>${money(r.pay)}</td><td class="${r.shortfallAmount ? "red" : ""}">${r.shortfallAmount ? money(r.shortfallAmount) + " potential gap" : r.windowFinding ? "No shortfall detected*" : "Not screened"}</td><td><span class="status">${icon("info", 11)} Review</span></td><td><button class="detail-btn" data-detail="${i}" aria-expanded="false" aria-controls="detail-${i}" aria-label="Show findings for ${esc(r.worker)}">⌄</button></td></tr><tr class="detail-row" id="detail-${i}" hidden><td colspan="6"><strong>${esc(findingGuidance(r).heading)} · ${esc(findingGuidance(r).references.join("; "))}</strong><br>${esc(r.explanation)}${r.windowFinding ? `<br><strong>Aligned window: ${r.windowFinding.status}</strong> · ${esc(r.windowFinding.explanation)}` : ""}<br><strong>Suggested mitigation / next steps:</strong><ol>${findingGuidance(
          r,
        )
          .actions.map((action) => `<li>${esc(action)}</li>`)
          .join(
            "",
          )}</ol><a href="${officialLinks.skilledWorker}" target="_blank" rel="noreferrer">Immigration rule source ↗</a> · <a href="${officialLinks.reporting}" target="_blank" rel="noreferrer">Sponsor reporting duties ↗</a>${r.shortfallAmount ? "<br>Consider whether a reportable salary reduction has occurred; the reporting clock is not calculated in this preview." : ""}<br>Rule version ${rules.version} · Last verified ${rules.lastVerified} · Decision support, not legal advice.</td></tr>`,
    )
    .join(
      "",
    )}</tbody></table></div><details class="match-details calculation-method"><summary>How these findings are calculated</summary><p>Predefined rules, not AI: confirmed basic pay is compared with actual hours × your supplied hourly going rate. Complete aligned monthly windows compare with annual requirement × ${calculationParameters.monthlyMonths}/${calculationParameters.monthsInYear}; more frequent pay uses ${calculationParameters.frequentWeeks}/${calculationParameters.weeksInYear}. Integer-pence and rational arithmetic avoid floating-point money comparisons. Missing evidence and unresolved exceptions remain REVIEW.</p><p>Recheck data repeats the calculation using the ruleset shown below. It does not fetch new Home Office rules or retrieve amended payroll. Import a new export when payroll changes; rule updates require a reviewed release.</p><a href="#/rules">Rules, version and limitations →</a> · <a href="${officialLinks.hmrc}" target="_blank" rel="noreferrer">HMRC payroll reporting guidance ↗</a><p>HMRC guidance concerns payroll reporting. Skilled Worker salary requirements come from the Home Office Immigration Rules.</p></details><div id="recheck-status" class="paste-help" role="status"></div><div class="result-note">${icon("info", 13)}<span>*This preview screens basic pay against the supplied hourly rate. Aligned window checks appear in row details; arbitrary boundaries and exceptions require further review. Every overall finding remains REVIEW. Decision support, not legal advice.</span></div><div class="version-line"><span>RULESET ${rules.version} · LAST VERIFIED ${rules.lastVerified} · SOLICITOR REVIEW PENDING</span><a href="#/rules">See how the rules are interpreted ↗</a><span>Generated ${new Date().toLocaleString("en-GB", { timeZone: "Europe/London" })} UK time</span></div></section>`;
  el.querySelectorAll<HTMLButtonElement>("[data-detail]").forEach((b) =>
    b.addEventListener("click", () => {
      const row = document.querySelector<HTMLTableRowElement>(
        `#detail-${b.dataset.detail}`,
      )!;
      row.hidden = !row.hidden;
      b.setAttribute("aria-expanded", String(!row.hidden));
      b.textContent = row.hidden ? "⌄" : "⌃";
    }),
  );
  el.querySelector("#clear")?.addEventListener("click", () => {
    results = [];
    confirmedPayroll = [];
    raw = "";
    headers = [];
    fileName = "";
    pendingFileName = "";
    render();
  });
  el.querySelector("#recheck")?.addEventListener("click", () => {
    results = evaluate(confirmedPayroll);
    renderResults();
    document.querySelector("#recheck-status")!.textContent =
      `Rechecked ${new Date().toLocaleTimeString("en-GB")} using rules ${rules.version}.`;
  });
  el.querySelector("#export-json")?.addEventListener("click", () =>
    download(
      JSON.stringify(structuredReport(results), null, 2),
      "wagelens-report.json",
      "application/json;charset=utf-8",
    ),
  );
  el.querySelector("#print")?.addEventListener("click", () => window.print());
  el.querySelector("#export")?.addEventListener("click", () => {
    const fields = [
      "worker_ref",
      "period",
      "status",
      "rule",
      "basic_pay_gbp",
      "potential_shortfall_gbp",
      "explanation",
      "suggested_action",
      "rule_references",
      "mitigation_recommendations",
      "official_rule_source",
      "hmrc_guidance",
      "aligned_window_status",
      "aligned_window_explanation",
      "rule_version",
      "last_verified",
      "generated_at",
      "disclaimer",
    ];
    const rows = results.map((r) => [
      r.worker,
      r.period,
      r.status,
      r.ruleId,
      (r.pay / 100).toFixed(2),
      r.shortfallAmount ? (r.shortfallAmount / 100).toFixed(2) : "",
      r.explanation,
      r.suggestedAction,
      findingGuidance(r).references.join("; "),
      findingGuidance(r).actions.join(" | "),
      officialLinks.skilledWorker,
      officialLinks.hmrc,
      r.windowFinding?.status || "REVIEW",
      r.windowFinding?.explanation || "Scope needs review",
      rules.version,
      rules.lastVerified,
      new Date().toISOString(),
      "Decision support, not legal advice. Preview: full window-boundary and exception checks incomplete.",
    ]);
    download(
      [fields, ...rows].map((row) => row.map(csvSafe).join(",")).join("\r\n"),
      "wagelens-report.csv",
    );
  });
}
function csvSafe(s: string) {
  return (
    '"' + (/^[=+\-@\t\r]/.test(s) ? "'" : "") + s.replaceAll('"', '""') + '"'
  );
}
function download(
  content: string,
  name: string,
  mime = "text/csv;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function renderDoc() {
  const source =
    "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-skilled-worker";
  const docs: Record<string, [string, string]> = {
    "/how-it-works": [
      "A clearer path through payroll.",
      "<p>Import an Excel, CSV or TSV file, or paste spreadsheet cells using pseudonymous worker references, map your columns, and review each finding. Supply the applicable annual requirement and hourly going rate yourself; WageLens does not select thresholds or occupation codes.</p><p>This research preview uses deterministic hourly screening and aligned-window arithmetic. Aligned 3-month and 12-week windows are screened where full history is supplied. Arbitrary boundaries, 17-week patterns, exceptions and reporting deadlines require further implementation and legal review.</p>" +
        how(),
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
  const entry = docs[route()] || [
    "This page is out of focus.",
    '<p>We couldn’t find that page. <a href="#/">Return to the salary checker →</a></p>',
  ];
  shell(
    `<article class="document"><div class="eyebrow"><span></span> WAGELENS / ${esc(route().slice(1).toUpperCase())}</div><h1>${entry[0]}</h1>${entry[1]}</article>`,
  );
}
window.addEventListener("hashchange", () => {
  render();
  window.scrollTo(0, 0);
});
render();

// Warm the local Excel reader after the page can paint; payroll never enters this request.
requestAnimationFrame(() => {
  setTimeout(() => {
    void preloadWorkbookTools().catch(() => {});
  }, 0);
});
