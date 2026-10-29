import { docs, pageMeta, siteURL } from "./pages";
import { workerMarkup } from "./results-view";
import { csvSafe } from "./exports";
import "./style.css";
import {
  calculationParameters,
  findingGuidance,
  structuredReport,
  officialLinks,
} from "./guidance";
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
let workerPage = 0;
const periodPages = new Map<string, number>();
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
  return '<a class="brand" href="/" aria-label="WageLens home"><span class="logo" aria-hidden="true">W</span>WageLens<span class="dot"></span></a>';
}
function shell(content: string) {
  updateMetadata();
  app.innerHTML = `<a class="skip-link" href="#main-content">Skip to main content</a><div id="screening-status" class="sr-only" role="status" aria-live="polite"></div><header>${brand()}<nav aria-label="Main navigation"><a href="/" class="${route() === "/" ? "active" : ""}">Salary checker</a><a href="/how-it-works">How it works</a><a href="/rules">Rules & sources ↗</a></nav><div class="header-end"><span class="private"><span class="dot"></span> Private by design</span><button class="icon-btn" id="theme" aria-label="Toggle colour theme">${icon("sun")}</button></div></header><main class="wrap" id="main-content" tabindex="-1">${content}</main><footer>${brand()}<p>Built for clarity. Designed for privacy.<br>Decision support, not legal advice. Always review findings with your adviser.</p><div class="links"><a href="/privacy">Privacy</a><a href="/disclaimer">Disclaimer</a><a href="/rules">Sources ↗</a></div></footer>`;
  document
    .querySelector("#theme")
    ?.addEventListener("click", () =>
      document.documentElement.classList.toggle("light"),
    );
}
function route() {
  return (
    (location.hash.startsWith("#/")
      ? location.hash.slice(1)
      : location.pathname
    ).replace(/\/$/, "") || "/"
  );
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
    `<section class="hero"><div><div class="eyebrow"><span></span> SKILLED WORKER SALARY SCREENING</div><h1>Spot potential Skilled Worker <em>salary shortfalls.</em></h1><p>Compare payroll with your supplied salary requirements and export findings for review. Your payroll stays in your browser.</p><div class="hero-actions"><button class="primary" id="hero-sample">Try sample screening</button><button class="secondary" id="hero-browse">Choose payroll file</button></div></div><aside class="hero-aside"><div class="tiny">${icon("shield", 15)} Your data is your business.</div><p>No accounts. No uploads. No tracking.<br>Just a clearer view of the numbers,<br>with the rules behind every finding.</p></aside></section><div class="feature-strip"><span><b>✓</b> Free to use</span><span><b>✓</b> No sign-up needed</span><span><b>✓</b> Browser-only processing</span><span><b>↗</b> Based on published Home Office rules</span></div><section class="workspace" aria-labelledby="checker-title"><div class="workspace-top"><div class="workspace-title"><span class="square-icon">${icon("file")}</span><h2 id="checker-title">Check your payroll</h2><span class="tag">RESEARCH PREVIEW</span></div><div class="steps"><span class="current"><b>1</b> Import payroll</span><i></i><span><b>2</b> Confirm fields</span><i></i><span><b>3</b> Review findings</span></div></div><div id="import-content"><div class="workspace-body"><div class="upload-area"><div class="import-tabs" role="tablist" aria-label="Payroll input method"><button id="upload-tab" role="tab" aria-selected="true" aria-controls="upload-panel" tabindex="0">${icon("file", 14)} Upload a file</button><button id="paste-tab" role="tab" aria-selected="false" aria-controls="paste-panel" tabindex="-1">${icon("file", 14)} Paste spreadsheet</button></div><div id="upload-panel" role="tabpanel" aria-labelledby="upload-tab"><div class="dropzone" id="dropzone"><div class="upload-icon">${icon("upload", 24)}</div><h3>Drop your payroll file here</h3><p>Your existing payroll export. We find the fields.</p><button class="primary" id="browse">${icon("upload", 14)} Choose payroll file</button><input type="file" id="file" accept="${acceptedFiles}" hidden><p class="file-note"><span class="format-pill">.xlsx / .xls</span> <span class="format-pill">.csv</span> <span class="format-pill">.tsv</span> <span class="format-pill">.pdf</span><br>Up to 5 MB · Digital PDFs supported · No scans yet</p></div><div class="under-drop"><span>Just exploring? <button class="text-btn" id="sample">Try sample data ${icon("arrow", 12)}</button></span><button class="text-btn" id="template">${icon("download", 12)} Download CSV template</button></div></div><div id="paste-panel" role="tabpanel" aria-labelledby="paste-tab" hidden><label for="paste-data" class="paste-label">Paste your payroll cells</label><p class="paste-help" id="paste-help">Copy from Excel or Google Sheets, including the header row. We suggest matching columns and exclude obvious identifiers.</p><textarea id="paste-data" aria-describedby="paste-help" placeholder="worker_ref&#9;pay_period_start&#9;basic_pay_gbp&#10;SW-001&#9;2026-07-01&#9;4400" spellcheck="false" maxlength="5242880"></textarea><button class="primary" id="use-paste">Find payroll fields ${icon("arrow", 14)}</button></div><div id="error" role="alert" class="error"></div></div><aside class="sidebar"><h3>A little preparation goes a long way.</h3><div class="side-item"><span class="side-icon">${icon("file")}</span><div><strong>Use worker references</strong><p>Obvious identifying columns are excluded automatically. Confirm that selected fields contain no names or NI numbers.</p></div></div><div class="side-item"><span class="side-icon">${icon("check")}</span><div><strong>Have your CoS details ready</strong><p>You supply each worker’s applicable annual requirement and hourly going rate. Check their CoS, occupation and current Home Office guidance with your adviser. WageLens does not select these thresholds. <a href="/rules#inputs">Required inputs →</a></p></div></div><div class="side-item"><span class="side-icon">${icon("info")}</span><div><strong>Clear findings, no false certainty</strong><p>Unconfirmed rules or missing context always mean review.</p></div></div></aside></div></div><div class="privacy-line">${icon("lock", 12)} Processed in your browser. Nothing uploaded.<a class="text-btn" href="/verify">Verify this ↗</a></div></section><div id="results"></div>${how()}`,
  );
  bindImport();
  renderResults();
}
function bindImport() {
  document
    .querySelector("#hero-sample")
    ?.addEventListener("click", () =>
      document.querySelector<HTMLButtonElement>("#sample")!.click(),
    );
  document
    .querySelector("#hero-browse")
    ?.addEventListener("click", () =>
      document.querySelector<HTMLInputElement>("#file")!.click(),
    );
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
    workerPage = 0;
    periodPages.clear();
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
      workerPage = 0;
      periodPages.clear();
      results = evaluate(confirmedPayroll);
      fileName = name;
      pendingFileName = "";
      sample = false;
      raw = "";
      headers = [];
      render();
      document.querySelector<HTMLElement>("#results-title")?.focus();
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
  const expandedWorkers = new Set(
    Array.from(
      el.querySelectorAll<HTMLDetailsElement>(".worker-group[open]"),
    ).map((d) => d.dataset.worker),
  );
  if (!results.length) {
    el.innerHTML = "";
    return;
  }
  const groups = new Map<string, Result[]>();
  const resultIndices = new Map<Result, number>();
  results.forEach((r, i) => {
    const group = groups.get(r.worker) ?? [];
    group.push(r);
    groups.set(r.worker, group);
    resultIndices.set(r, i);
  });
  const workers = groups.size;
  const issues = results.filter((r) => r.shortfallAmount).length;
  el.innerHTML = `<section class="results-section" aria-labelledby="results-title"><div class="section-head"><div><h2 id="results-title" tabindex="-1">Your payroll, in focus. <span class="tag">${sample ? "SAMPLE DATA" : "LOCAL FILE"}</span></h2><p>${esc(fileName)} · Based on user-supplied thresholds · Research preview</p></div><div class="report-actions"><button class="primary" id="export">${icon("download", 12)} Export CSV</button><details class="report-menu"><summary class="secondary">More actions</summary><div><button class="secondary" id="export-json">Export JSON</button><button class="secondary" id="print">Print / save PDF</button><button class="secondary" id="recheck"><span aria-hidden="true">↻</span> Recheck data</button><button class="secondary" id="clear">Clear data</button></div></details></div></div><div class="summary"><div class="stat"><div class="stat-top">Workers screened ${icon("file", 12)}</div><strong>${workers.toString().padStart(2, "0")}</strong></div><div class="stat"><div class="stat-top">Pay periods ${icon("check", 12)}</div><strong>${results.length.toString().padStart(2, "0")}</strong></div><div class="stat"><div class="stat-top">Potential hourly shortfalls ${icon("info", 12)}</div><strong class="red">${issues.toString().padStart(2, "0")}</strong></div><div class="stat"><div class="stat-top">Need full review ${icon("info", 12)}</div><strong class="amber">${results
    .filter((r) => r.status === "REVIEW")
    .length.toString()
    .padStart(2, "0")}</strong></div></div>${[...groups]
    .slice(workerPage * 10, (workerPage + 1) * 10)
    .map(([worker, rows]) =>
      workerMarkup(
        worker,
        rows,
        resultIndices,
        workers,
        periodPages.get(worker) || 0,
      ),
    )
    .join(
      "",
    )}${workers > 10 ? `<div class="results-pagination"><button class="secondary" id="previous-workers" ${workerPage === 0 ? "disabled" : ""}>Previous workers</button><span>Workers ${workerPage * 10 + 1}–${Math.min(workers, (workerPage + 1) * 10)} of ${workers}. Exports include all records.</span><button class="secondary" id="next-workers" ${(workerPage + 1) * 10 >= workers ? "disabled" : ""}>Next workers</button></div>` : ""}<details class="match-details calculation-method"><summary>How these findings are calculated</summary><p>Predefined rules, not AI: confirmed basic pay is compared with actual hours × your supplied hourly going rate. Complete aligned monthly windows compare with annual requirement × ${calculationParameters.monthlyMonths}/${calculationParameters.monthsInYear}; more frequent pay uses ${calculationParameters.frequentWeeks}/${calculationParameters.weeksInYear}. Integer-pence and rational arithmetic avoid floating-point money comparisons. Missing evidence and unresolved exceptions remain REVIEW.</p><p>Recheck data repeats the calculation using the ruleset shown below. It does not fetch new Home Office rules or retrieve amended payroll. Import a new export when payroll changes; rule updates require a reviewed release.</p><a href="/rules">Rules, version and limitations →</a> · <a href="${officialLinks.hmrc}" target="_blank" rel="noreferrer">HMRC payroll reporting guidance ↗</a><p>HMRC guidance concerns payroll reporting. Skilled Worker salary requirements come from the Home Office Immigration Rules.</p></details><div id="recheck-status" class="paste-help" role="status"></div><div class="result-note">${icon("info", 13)}<span>*This preview screens basic pay against the supplied hourly rate. Aligned salary-window checks are shown separately; arbitrary boundaries and exceptions require further review. Every overall finding remains REVIEW. Decision support, not legal advice.</span></div><div class="version-line"><span>RULESET ${rules.version} · LAST VERIFIED ${rules.lastVerified} · SOLICITOR REVIEW PENDING</span><a href="/rules">See how the rules are interpreted ↗</a><span>Generated ${new Date().toLocaleString("en-GB", { timeZone: "Europe/London" })} UK time</span></div></section>`;
  el.querySelectorAll<HTMLDetailsElement>(".worker-group").forEach((d) => {
    if (expandedWorkers.has(d.dataset.worker)) d.open = true;
  });
  el.querySelectorAll<HTMLDetailsElement>(".detailed-table").forEach(
    (d) => (d.open = !matchMedia("(max-width: 650px)").matches),
  );
  el.querySelectorAll<HTMLButtonElement>("[data-detail]").forEach((b) =>
    b.addEventListener("click", () => {
      const row = document.querySelector<HTMLTableRowElement>(
        `#${b.getAttribute("aria-controls")}`,
      )!;
      row.hidden = !row.hidden;
      b.setAttribute("aria-expanded", String(!row.hidden));
      b.textContent = row.hidden ? "View calculation ⌄" : "Hide calculation ⌃";
      b.setAttribute(
        "aria-label",
        `${row.hidden ? "View" : "Hide"} calculation for ${results[Number(b.dataset.detail)].worker} ${results[Number(b.dataset.detail)].period}`,
      );
    }),
  );
  el.querySelector("#previous-workers")?.addEventListener("click", () => {
    workerPage--;
    renderResults();
    document.querySelector<HTMLElement>("#results-title")?.focus();
  });
  el.querySelector("#next-workers")?.addEventListener("click", () => {
    workerPage++;
    renderResults();
    document.querySelector<HTMLElement>("#results-title")?.focus();
  });
  el.querySelectorAll<HTMLButtonElement>("[data-period-worker]").forEach(
    (button) =>
      button.addEventListener("click", () => {
        periodPages.set(
          button.dataset.periodWorker!,
          Number(button.dataset.periodPage),
        );
        renderResults();
      }),
  );
  document.querySelector("#screening-status")!.textContent =
    `Screening complete. ${workers} workers, ${results.length} pay periods, ${issues} potential hourly shortfalls. All findings require review.`;
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
    workerPage = 0;
    periodPages.clear();
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
  el.querySelector("#print")?.addEventListener("click", () => {
    const report = document.createElement("section");
    report.className = "print-report";
    // Every period is included, including records beyond the on-screen pagination.
    report.innerHTML =
      `<h1>WageLens screening report</h1><p>Rules ${rules.version} · Verified ${rules.lastVerified}. Based on user-supplied thresholds. Decision support, not legal advice.</p>` +
      [...groups]
        .map(([worker, rows]) =>
          Array.from({ length: Math.ceil(rows.length / 20) }, (_, page) =>
            workerMarkup(worker, rows, resultIndices, 1, page),
          ).join(""),
        )
        .join("");
    report.querySelectorAll("details").forEach((d) => (d.open = true));
    report
      .querySelectorAll<HTMLElement>("[hidden]")
      .forEach((d) => (d.hidden = false));
    document.body.append(report);
    window.print();
    report.remove();
  });
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
      r.inputs?.hoursWorked || "",
      r.inputs?.hourlyRate || "",
      r.inputs?.annualSalary || "",
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
  const entry = docs[route()] || [
    "This page is out of focus.",
    '<p>We couldn’t find that page. <a href="/">Return to the salary checker →</a></p>',
  ];
  shell(
    `<article class="document"><div class="eyebrow"><span></span> WAGELENS / ${esc(route().slice(1).toUpperCase())}</div><h1>${entry[0]}</h1>${entry[1]}</article>`,
  );
}
function updateMetadata() {
  const meta = pageMeta[route()] || {
    title: "Page not found | WageLens",
    description: "Return to WageLens salary screening.",
  };
  document.title = meta.title;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", meta.description);
  document
    .querySelector('link[rel="canonical"]')
    ?.setAttribute("href", siteURL + (route() === "/" ? "/" : route()));
  for (const [key, value] of Object.entries({
    "og:title": meta.title,
    "og:description": meta.description,
    "og:url": siteURL + (route() === "/" ? "/" : route()),
    "twitter:title": meta.title,
    "twitter:description": meta.description,
  }))
    document
      .querySelector(`meta[property="${key}"],meta[name="${key}"]`)
      ?.setAttribute("content", value);
}
function focusHeading() {
  const heading = document.querySelector<HTMLElement>("h1");
  if (heading) {
    heading.tabIndex = -1;
    heading.focus();
  }
}
document.addEventListener("click", (event) => {
  const anchor = (event.target as Element).closest<HTMLAnchorElement>(
    "a[href]",
  );
  if (
    !anchor ||
    event.defaultPrevented ||
    (event as MouseEvent).button !== 0 ||
    (event as MouseEvent).ctrlKey ||
    (event as MouseEvent).metaKey ||
    (event as MouseEvent).shiftKey ||
    (event as MouseEvent).altKey ||
    anchor.target ||
    anchor.hasAttribute("download")
  )
    return;
  const target = new URL(anchor.href);
  if (
    target.origin !== location.origin ||
    anchor.getAttribute("href")?.startsWith("#")
  )
    return;
  event.preventDefault();
  history.pushState({}, "", target.pathname + target.hash);
  render();
  window.scrollTo(0, 0);
  const section = target.hash
    ? document.getElementById(target.hash.slice(1))
    : null;
  if (section) {
    section.tabIndex = -1;
    section.scrollIntoView();
    section.focus({ preventScroll: true });
  } else focusHeading();
});
window.addEventListener("popstate", () => {
  render();
  focusHeading();
});
window.addEventListener("hashchange", () => {
  if (location.hash.startsWith("#/")) {
    history.replaceState({}, "", location.hash.slice(1));
    render();
    focusHeading();
  }
});
if (location.hash.startsWith("#/"))
  history.replaceState({}, "", location.hash.slice(1));
render();
matchMedia("(max-width: 650px)").addEventListener("change", (event) => {
  document
    .querySelectorAll<HTMLDetailsElement>(".detailed-table")
    .forEach((d) => (d.open = !event.matches));
});
