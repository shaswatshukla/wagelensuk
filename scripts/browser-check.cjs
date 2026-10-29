const { chromium } = require("playwright-core");
const { default: AxeBuilder } = require("@axe-core/playwright");
const fs = require("node:fs");
(async () => {
  const path = require("node:path");
  const http = require("node:http");
  const server = http.createServer((req, res) => {
    const relative = decodeURIComponent((req.url || "/").split("?")[0]);
    let file = path.resolve(
      "dist",
      "." + (relative === "/" ? "/index.html" : relative),
    );
    if (!file.startsWith(path.resolve("dist") + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, "index.html");
    if (!fs.existsSync(file) && !path.extname(file))
      file = path.resolve("dist/index.html");
    try {
      const data = fs.readFileSync(file);
      res.setHeader(
        "Content-Type",
        file.endsWith(".js") || file.endsWith(".mjs")
          ? "text/javascript"
          : file.endsWith(".css")
            ? "text/css"
            : file.endsWith(".svg")
              ? "image/svg+xml"
              : "text/html",
      );
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(4174, "127.0.0.1", resolve));
  server.unref();
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL || process.platform === "win32"
      ? { channel: process.env.BROWSER_CHANNEL || "msedge" }
      : {}),
    args: ["--remote-debugging-port=9223"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
  });
  const page = await context.newPage();
  async function action(name) {
    const button = page.getByRole("button", { name, exact: true });
    if (!(await button.isVisible()))
      await page.getByText("More actions", { exact: true }).click();
    await button.click();
  }
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4174/");
  await page.waitForLoadState("networkidle");
  fs.mkdirSync("test-results", { recursive: true });
  const a11yHome = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  fs.writeFileSync(
    "test-results/accessibility-home.json",
    JSON.stringify(a11yHome.violations, null, 2),
  );
  await page.screenshot({
    path: "test-results/wagelens-desktop.png",
    fullPage: true,
  });
  const requests = [];
  page.on("request", (r) =>
    requests.push({ url: r.url(), method: r.method(), body: r.postData() }),
  );
  await page.getByRole("button", { name: /Try sample data/ }).click();
  if ((await page.locator(".worker-group").count()) !== 3)
    throw Error("Results must be grouped into three workers");
  await page
    .getByRole("columnheader", { name: "Salary-window check" })
    .first()
    .waitFor();
  if (
    !(await page.locator(".review-reason").allTextContents()).includes(
      "Potential hourly pay gap",
    )
  )
    throw Error("Results must explain why review is needed");
  const workerSummary = page.locator(".worker-group > summary").first();
  await workerSummary.click();
  if (
    (await page.locator(".worker-group").first().getAttribute("open")) !== null
  )
    throw Error("Worker group did not collapse");
  await workerSummary.click();
  await action("Recheck data");
  if (
    !(await page.locator("#recheck-status").innerText()).includes("Rechecked")
  )
    throw Error("Recheck status missing");
  const jsonPromise = page.waitForEvent("download");
  await action("Export JSON");
  await (await jsonPromise).saveAs("test-results/report.json");
  const jsonReport = JSON.parse(
    fs.readFileSync("test-results/report.json", "utf8"),
  );
  if (!jsonReport.findings[1].guidance.references.includes("SW 14.3B(a)"))
    throw Error("Export missing exact rule reference");
  await page
    .getByRole("button", { name: /View calculation for SW-002/ })
    .click();
  if (!(await page.locator("#detail-1").isVisible()))
    throw Error("Details did not expand");
  if (
    !(await page.locator("#detail-1").innerText()).includes(
      "160 hours × £20.00/hour = £3,200.00",
    )
  )
    throw Error("Missing calculation inputs and arithmetic");
  if (
    !(await page.locator("#screening-status").innerText()).includes(
      "Screening complete",
    )
  )
    throw Error("Missing screening announcement");
  if (!(await page.locator("#results-title").getAttribute("tabindex")))
    throw Error("Results heading cannot receive focus");
  const csvPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await csvPromise;
  await download.saveAs("test-results/report.csv");
  if (!fs.readFileSync("test-results/report.csv", "utf8").includes("REVIEW"))
    throw Error("Report missing results");
  await page.screenshot({
    path: "test-results/wagelens-results.png",
    fullPage: true,
  });
  const a11yResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  fs.writeFileSync(
    "test-results/accessibility-results.json",
    JSON.stringify(a11yResults.violations, null, 2),
  );
  await page.getByRole("button", { name: "Toggle colour theme" }).click();
  const lightAccessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  fs.writeFileSync(
    "test-results/accessibility-light.json",
    JSON.stringify(lightAccessibility.violations, null, 2),
  );
  await page.screenshot({
    path: "test-results/wagelens-light-results.png",
    fullPage: true,
  });
  if (lightAccessibility.violations.length)
    throw Error(
      "Light-theme accessibility violations: inspect accessibility-light.json",
    );
  await page.getByRole("button", { name: "Toggle colour theme" }).click();
  await page.pdf({
    path: "test-results/wagelens-report.pdf",
    format: "A4",
    printBackground: true,
    landscape: true,
  });
  await action("Clear data");
  const input =
    "worker_ref,pay_period_start,pay_period_end,pay_date,basic_pay_gbp,other_pay_gbp,hours_worked,required_annual_salary_gbp,going_rate_hourly_gbp,cos_assigned_date,pay_frequency\nPRIVATE-TEST-REF,2026-07-01,2026-07-31,2026-07-31,3000,0,160,52000,20,2026-04-08,monthly";
  await page.locator("#file").setInputFiles({
    name: "payroll.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(input),
  });
  await page.locator("#confirm-values").check();
  await page.getByRole("button", { name: "Review payroll" }).click();
  await page
    .locator(".worker-ref")
    .filter({ hasText: "PRIVATE-TEST-REF" })
    .waitFor();
  await page.locator("#file").setInputFiles({
    name: "cancelled.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(input),
  });
  await page
    .getByRole("button", { name: "Choose another file", exact: true })
    .click();
  const retainedReport = await page.locator("#results").innerText();
  if (
    !retainedReport.includes("payroll.csv") ||
    retainedReport.includes("cancelled.csv")
  )
    throw Error("Cancelling import changed the previous report label");
  await action("Clear data");
  await page.getByRole("tab", { name: "Paste spreadsheet" }).click();
  await page.locator("#paste-data").fill(input.replaceAll(",", "\t"));
  await page.getByRole("button", { name: "Find payroll fields" }).click();
  await page.locator("#confirm-values").check();
  await page.getByRole("button", { name: "Review payroll" }).click();
  await page
    .locator(".worker-ref")
    .filter({ hasText: "PRIVATE-TEST-REF" })
    .waitFor();
  await action("Clear data");
  const XLSX = require("xlsx");
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([["Instructions"], ["Select Payroll"]]),
    "Notes",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(input.split("\n").map((row) => row.split(","))),
    "Payroll",
  );
  await page.locator("#file").setInputFiles({
    name: "payroll.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  });
  await page.locator("#payroll-sheet").selectOption("Payroll");
  await page.getByRole("button", { name: "Map this sheet" }).click();
  await page.locator("#confirm-values").check();
  await page.getByRole("button", { name: "Review payroll" }).click();
  await page
    .locator(".worker-ref")
    .filter({ hasText: "PRIVATE-TEST-REF" })
    .waitFor();
  await action("Clear data");
  await page.locator("#file").setInputFiles({
    name: "payroll.tsv",
    mimeType: "text/tab-separated-values",
    buffer: Buffer.from(input.replaceAll(",", "\t")),
  });
  await page.locator("#confirm-values").check();
  await page.getByRole("button", { name: "Review payroll" }).click();
  await page
    .locator(".worker-ref")
    .filter({ hasText: "PRIVATE-TEST-REF" })
    .waitFor();
  await action("Clear data");
  const conventional =
    'Payroll export for July\nEmployee Name,Employee ID,Period From,Period To,Payment Date,Basic Salary,Other Pay,Hours\nPRIVATE-UNUSED-NAME,E-AUTO,01/07/2026,31/07/2026,31 Jul 2026,"£4,400.00",0,160 hrs';
  await page.locator("#file").setInputFiles({
    name: "normal-payroll.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(conventional),
  });
  await page.locator('[data-field="required_annual_salary_gbp"]').fill("52000");
  await page.locator('[data-field="going_rate_hourly_gbp"]').fill("20");
  await page.locator('[data-field="cos_assigned_date"]').fill("2026-04-08");
  await page.locator('[data-field="pay_frequency"]').fill("monthly");
  if ((await page.locator("body").innerText()).includes("PRIVATE-UNUSED-NAME"))
    throw Error("Excluded identifier leaked into confirmation");
  if (!(await page.locator("#run").isDisabled()))
    throw Error("Unconfirmed inputs can be evaluated");
  const confirmationAccessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  fs.writeFileSync(
    "test-results/accessibility-confirmation.json",
    JSON.stringify(confirmationAccessibility.violations, null, 2),
  );
  if (confirmationAccessibility.violations.length)
    throw Error("Confirmation accessibility violations");
  await page.screenshot({
    path: "test-results/wagelens-recognition.png",
    fullPage: true,
  });
  await page.locator("#confirm-values").check();
  await page.getByRole("button", { name: "Review payroll" }).click();
  await page.locator(".worker-ref").filter({ hasText: "E-AUTO" }).waitFor();
  await action("Clear data");
  const pdfPage = await context.newPage();
  const pdfLines = [
    "Employee ID: E-PDF",
    "Period From: 2026-07-01",
    "Period To: 2026-07-31",
    "Payment Date: 2026-07-31",
    "Basic Pay: 4400",
    "Other Pay: 0",
    "Hours worked: 160",
    "Required annual salary: 52000",
    "Required hourly going rate: 20",
    "CoS assigned date: 2026-04-08",
    "Pay frequency: monthly",
  ];
  await pdfPage.setContent(
    "<html><body>" +
      pdfLines.map((line) => "<p>" + line + "</p>").join("") +
      "</body></html>",
  );
  const pdfBuffer = await pdfPage.pdf({ format: "A4" });
  await pdfPage.close();
  await page.locator("#file").setInputFiles({
    name: "digital-payslip.pdf",
    mimeType: "application/pdf",
    buffer: pdfBuffer,
  });
  await page.locator("#confirm-values").waitFor();
  await page.locator("#confirm-values").check();
  await page.getByRole("button", { name: "Review payroll" }).click();
  await page.locator(".worker-ref").filter({ hasText: "E-PDF" }).waitFor();
  await action("Clear data");
  await page.locator("#file").setInputFiles("samples/wagelens-demo.csv");
  await page.locator("#confirm-values").check();
  await page.getByRole("button", { name: "Review payroll" }).click();
  const salaryGroup = page
    .locator(".worker-group")
    .filter({ hasText: "DEMO-003" });
  if (!(await salaryGroup.innerText()).includes("£1,000.00 potential gap"))
    throw Error(
      "Salary-window gap must be visible without expanding calculations",
    );
  if (!(await salaryGroup.innerText()).includes("Potential salary-window gap"))
    throw Error("Salary-window review reason missing");
  await page.screenshot({
    path: "test-results/wagelens-grouped-demo.png",
    fullPage: true,
  });
  const allowedAssets = new Set(
    fs
      .readdirSync("dist/assets")
      .map((name) => "http://127.0.0.1:4174/assets/" + name),
  );
  const dataRequests = requests.filter(
    (r) => r.method !== "GET" || r.body || !allowedAssets.has(r.url),
  );
  if (dataRequests.length)
    throw Error(
      "Payroll workflow unexpectedly made requests: " +
        JSON.stringify(dataRequests),
    );
  const workflowNetworkRequests = requests.length;
  await page.setViewportSize({ width: 360, height: 800 });
  await page.screenshot({
    path: "test-results/wagelens-mobile.png",
    fullPage: true,
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  if (overflow) throw Error("Page has horizontal overflow at 360px");
  if (!(await page.locator(".mobile-findings").first().isVisible()))
    throw Error("Mobile findings cards missing");
  if (
    (await page.locator(".detailed-table").first().getAttribute("open")) !==
    null
  )
    throw Error("Mobile detailed tables should be optional");
  await page.getByRole("button", { name: "Toggle colour theme" }).click();
  const mobileLight = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  fs.writeFileSync(
    "test-results/accessibility-mobile-light.json",
    JSON.stringify(mobileLight.violations, null, 2),
  );
  if (mobileLight.violations.length)
    throw Error("Mobile light-theme accessibility violations");
  await page.getByRole("button", { name: "Toggle colour theme" }).click();
  await page.setViewportSize({ width: 1440, height: 1080 });
  for (const route of [
    "rules",
    "privacy",
    "disclaimer",
    "verify",
    "how-it-works",
    "worked-example",
    "missing",
  ]) {
    await page.goto("http://127.0.0.1:4174/#/" + route);
    if (!(await page.locator("h1").isVisible()))
      throw Error("Missing route " + route);
  }
  for (const route of ["rules", "privacy", "how-it-works", "worked-example"]) {
    const response = await page.goto("http://127.0.0.1:4174/" + route);
    if (response.status() !== 200 || !(await response.text()).includes("<h1>"))
      throw Error("Direct route has no static HTML: " + route);
    const title = await page.title();
    if (title === "Skilled Worker Payroll Salary Screening | WageLens")
      throw Error("Route-specific title missing");
    if (
      !(
        await page.locator('link[rel="canonical"]').getAttribute("href")
      ).endsWith("/" + route)
    )
      throw Error("Wrong canonical");
  }
  await page.goto("http://127.0.0.1:4174/");
  await page.getByRole("link", { name: "Rules & sources ↗" }).click();
  if (
    !(await page.locator("h1").evaluate((el) => el === document.activeElement))
  )
    throw Error("Route heading did not receive focus");
  await page.goto("http://127.0.0.1:4174/");
  const largeHeader =
    "worker_ref,pay_period_start,pay_period_end,pay_date,basic_pay_gbp,other_pay_gbp,hours_worked,required_annual_salary_gbp,going_rate_hourly_gbp,cos_assigned_date,pay_frequency";
  const largeRows = Array.from({ length: 1000 }, (_, i) =>
    ["07", "08", "09"]
      .map(
        (month) =>
          `PERF-${i},2026-${month}-01,2026-${month}-${month === "09" ? "30" : "31"},2026-${month}-${month === "09" ? "30" : "31"},4000,0,160,52000,20,2026-04-08,monthly`,
      )
      .join("\n"),
  );
  const largeStart = Date.now();
  await page.locator("#file").setInputFiles({
    name: "synthetic-3000.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(largeHeader + "\n" + largeRows.join("\n")),
  });
  await page.locator("#confirm-values").check();
  await page.getByRole("button", { name: "Review payroll" }).click();
  await page.locator(".worker-group").first().waitFor();
  const largeWorkflowMs = Date.now() - largeStart;
  if ((await page.locator(".worker-group").count()) !== 10)
    throw Error("Large results must paginate workers");
  await page.getByRole("button", { name: "Next workers", exact: true }).click();
  if (
    !(await page.locator(".worker-name").first().innerText()).includes(
      "PERF-10",
    )
  )
    throw Error("Worker pagination failed");
  fs.writeFileSync(
    "test-results/large-payroll.json",
    JSON.stringify(
      {
        workers: 1000,
        periods: 3000,
        importConfirmScreenMs: largeWorkflowMs,
        renderedWorkerGroups: 10,
      },
      null,
      2,
    ),
  );
  if (errors.length) throw Error(errors.join("\n"));
  if (a11yHome.violations.length || a11yResults.violations.length)
    throw Error(
      "Accessibility violations: inspect test-results/accessibility-*.json",
    );
  let lighthouseScores;
  if (!process.env.SKIP_LIGHTHOUSE) {
    const { default: lighthouse } = await import("lighthouse");
    const audit = await lighthouse("http://127.0.0.1:4174/", {
      port: 9223,
      output: "json",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      formFactor: "desktop",
      screenEmulation: { disabled: true },
    });
    fs.writeFileSync("test-results/lighthouse.json", audit.report);
    lighthouseScores = Object.fromEntries(
      Object.entries(audit.lhr.categories).map(([k, v]) => [
        k,
        Math.round(v.score * 100),
      ]),
    );
  }
  console.log(
    JSON.stringify(
      {
        browser: "Edge (Chromium)",
        sample: true,
        recheck: true,
        structuredExport: true,
        expand: true,
        export: true,
        importAndMapping: true,
        pasteImport: true,
        excelSheetSelection: true,
        tsvImport: true,
        autoRecognitionAndMissingDetails: true,
        digitalPDFImport: true,
        workflowDataRequests: dataRequests.length,
        localParserAssetRequests: workflowNetworkRequests,
        workflowNetworkRequests,
        mobile360: "no page overflow",
        routes: 7,
        directStaticRoutes: 4,
        lightThemeViolations: lightAccessibility.violations.length,
        mobileLightViolations: mobileLight.violations.length,
        largePayrollWorkflowMs: largeWorkflowMs,
        pageErrors: errors.length,
        axeViolationsHome: a11yHome.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        axeViolationsResults: a11yResults.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        lighthouseScores,
      },
      null,
      2,
    ),
  );
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
