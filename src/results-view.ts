import { type Result, rules, pence } from "./engine/index";
import { findingGuidance, officialLinks } from "./guidance";
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const money = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    p / 100,
  );
export function windowLabel(r: Result): string {
  const f = r.windowFinding;
  return !f || f.status === "REVIEW"
    ? "More evidence / review needed"
    : f.status === "FAIL"
      ? f.shortfallAmount
        ? money(f.shortfallAmount) + " potential gap"
        : "Potential salary gap"
      : "No shortfall in aligned window";
}
export function reviewReason(r: Result): string {
  if (r.shortfallAmount && r.windowFinding?.status === "FAIL")
    return "Hourly and salary-window gaps";
  if (r.shortfallAmount) return "Potential hourly pay gap";
  if (r.windowFinding?.status === "FAIL") return "Potential salary-window gap";
  if (!r.windowFinding) return "Unsupported / transitional scenario";
  if (r.windowFinding.status === "REVIEW")
    return "Window evidence or scope needs review";
  return "Full boundaries and exceptions need review";
}
function hourly(r: Result) {
  return r.shortfallAmount
    ? money(r.shortfallAmount) + " potential gap"
    : r.windowFinding
      ? "No hourly shortfall detected"
      : "Not screened";
}
function calculation(r: Result) {
  if (!r.inputs || !r.windowFinding)
    return "<p>Calculation not applied: " + esc(r.explanation) + "</p>";
  const [whole, fraction = ""] = r.inputs.hoursWorked.split(".");
  const hours = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  const rate = BigInt(pence(r.inputs.hourlyRate));
  const minimum = Number((hours * rate + 99n) / 100n);
  return `<div class="calculation-evidence"><h4>Hourly calculation</h4><p><strong>${esc(r.inputs.hoursWorked)} hours × ${money(Number(rate))}/hour = ${money(minimum)} required basic pay</strong></p><p>${money(minimum)} − ${money(r.pay)} basic pay = ${money(Math.max(0, minimum - r.pay))} potential gap (minimum zero).</p><p>Amounts use integer pence; a fractional minimum penny rounds up. Other pay: ${money(Math.round(Number(r.inputs.otherPay) * 100))}, excluded from this hourly comparison. Supplied annual requirement: ${money(Math.round(Number(r.inputs.annualSalary) * 100))}.</p></div>`;
}
function detail(r: Result) {
  const g = findingGuidance(r);
  return `<strong>${esc(g.heading)} · ${esc(g.references.join("; "))}</strong><p>${esc(r.worker)} · ${esc(r.period)}</p>${calculation(r)}<p>${esc(r.explanation)}</p>${r.windowFinding ? `<p><strong>Aligned window: ${r.windowFinding.status}</strong> · ${esc(r.windowFinding.explanation)}</p>` : ""}<strong>Suggested mitigation / next steps:</strong><ol>${g.actions.map((a) => `<li>${esc(a)}</li>`).join("")}</ol><a href="/rules#methodology">Calculation methodology</a> · <a href="${officialLinks.skilledWorker}" target="_blank" rel="noreferrer">Immigration rule source ↗</a> · <a href="${officialLinks.reporting}" target="_blank" rel="noreferrer">Sponsor reporting duties ↗</a><p>Rules ${rules.version} · Verified ${rules.lastVerified} · Decision support, not legal advice.</p>`;
}
function button(r: Result, index: number, mobile = false) {
  const id = `${mobile ? "mobile-" : ""}detail-${index}`;
  return `<button class="detail-btn" data-detail="${index}" aria-expanded="false" aria-controls="${id}" aria-label="View calculation for ${esc(r.worker)} ${esc(r.period)}">View calculation ⌄</button>`;
}
export function workerMarkup(
  worker: string,
  rows: Result[],
  indices: Map<Result, number>,
  totalWorkers: number,
  periodPage: number,
) {
  const hourlyGaps = rows.filter((r) => r.shortfallAmount).length;
  const windowGaps = rows.filter(
    (r) => r.windowFinding?.status === "FAIL",
  ).length;
  const latest = rows[rows.length - 1];
  const visible = rows.slice(periodPage * 20, (periodPage + 1) * 20);
  const pagination =
    rows.length > 20
      ? `<div class="results-pagination"><button class="secondary" data-period-worker="${esc(worker)}" data-period-page="${periodPage - 1}" ${periodPage === 0 ? "disabled" : ""}>Previous periods</button><span>Periods ${periodPage * 20 + 1}–${Math.min(rows.length, (periodPage + 1) * 20)} of ${rows.length}</span><button class="secondary" data-period-worker="${esc(worker)}" data-period-page="${periodPage + 1}" ${(periodPage + 1) * 20 >= rows.length ? "disabled" : ""}>Next periods</button></div>`
      : "";
  return `<details class="worker-group" data-worker="${esc(worker)}" ${totalWorkers <= 3 ? "open" : ""}><summary><strong class="worker-name">${esc(worker)}</strong><span>${rows.length} pay period${rows.length === 1 ? "" : "s"}</span><span class="${hourlyGaps ? "red" : ""}">Hourly: ${hourlyGaps ? `${hourlyGaps} potential gap${hourlyGaps === 1 ? "" : "s"}` : rows.every((r) => r.windowFinding) ? "No shortfall detected" : "Review required"}</span><span class="${windowGaps ? "red" : ""}">Salary window: ${windowGaps ? `${windowGaps} potential gap${windowGaps === 1 ? "" : "s"}` : esc(windowLabel(latest))}</span><span class="worker-toggle">Pay periods ⌄</span></summary><div class="mobile-findings">${visible.map((r) => `<article class="finding-card"><h3>${esc(r.period)}</h3><dl><dt>Basic pay</dt><dd>${money(r.pay)}</dd><dt>Hourly check</dt><dd class="${r.shortfallAmount ? "red" : ""}">${hourly(r)}</dd><dt>Salary-window check</dt><dd class="${r.windowFinding?.status === "FAIL" ? "red" : ""}">${windowLabel(r)}</dd><dt>Review reason</dt><dd>${esc(reviewReason(r))}</dd></dl><p><strong>Next action:</strong> ${esc(findingGuidance(r).actions[r.shortfallAmount || r.windowFinding?.status === "FAIL" ? 1 : 0])}</p>${button(r, indices.get(r)!, true)}<div id="mobile-detail-${indices.get(r)!}" hidden>${detail(r)}</div></article>`).join("")}</div><details class="detailed-table" open><summary>Detailed table for ${esc(worker)}</summary><div class="table-shell" tabindex="0" role="region" aria-label="Pay-period findings for ${esc(worker)}"><table><caption class="file-note">Pay-period checks — based on user-supplied thresholds</caption><thead><tr><th scope="col">Worker reference</th><th scope="col">Pay period</th><th scope="col">Basic pay</th><th scope="col">Hourly screen</th><th scope="col">Salary-window check</th><th scope="col">Review reason</th><th scope="col">Details</th></tr></thead><tbody>${visible.map((r) => `<tr><td><div class="worker-ref">${esc(r.worker)}</div></td><td>${esc(r.period)}</td><td>${money(r.pay)}</td><td class="${r.shortfallAmount ? "red" : ""}">${hourly(r)}</td><td class="${r.windowFinding?.status === "FAIL" ? "red" : ""}">${windowLabel(r)}</td><td><span class="status">Review</span><small class="review-reason">${esc(reviewReason(r))}</small></td><td>${button(r, indices.get(r)!)}</td></tr><tr class="detail-row" id="detail-${indices.get(r)!}" hidden><td colspan="7">${detail(r)}</td></tr>`).join("")}</tbody></table></div></details>${pagination}</details>`;
}
