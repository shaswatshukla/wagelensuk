import type { Result } from "./engine/index";
import { rules } from "./engine/index";
export const calculationParameters = rules.rules.find(
  (rule) => rule.id === "window",
)!.parameters;
export const officialLinks = {
  skilledWorker:
    "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-skilled-worker",
  hmrc: "https://www.gov.uk/guidance/what-payroll-information-to-report-to-hmrc",
  reporting:
    "https://www.gov.uk/government/publications/workers-and-temporary-workers-guidance-for-sponsors-part-3-sponsor-duties-and-compliance/workers-and-temporary-workers-guidance-for-sponsors-part-3-sponsor-duties-and-compliance-accessible",
};
export function findingGuidance(result: Result) {
  const references = result.windowFinding
    ? [
        rules.rules.find((rule) => rule.id === "hourly")!.paragraph,
        ...(result.windowFinding.ruleId === "window"
          ? [rules.rules.find((rule) => rule.id === "window")!.paragraph]
          : []),
      ]
    : ["CoS scope / transitional review"];
  const actions = [
    "Check the extracted basic pay and actual hours against the original payroll, then verify the applicable CoS salary requirements.",
    ...(result.shortfallAmount || result.windowFinding?.status === "FAIL"
      ? [
          "If an underpayment is confirmed, discuss a payroll correction with your payroll team and adviser. A later payment does not automatically cure an earlier issue.",
        ]
      : []),
    "Review deductions, leave, partial periods and complete payroll history with an adviser before drawing a legal conclusion.",
    "If a reportable salary reduction occurred, check the applicable Home Office SMS reporting duty and deadline. HMRC payroll reporting is a separate obligation.",
  ];
  return {
    heading: result.shortfallAmount
      ? "Potential hourly rule issue"
      : result.windowFinding?.status === "FAIL"
        ? "Potential salary-window issue"
        : "Evidence and scope review",
    references,
    actions,
  };
}
export function structuredReport(
  results: Result[],
  generatedAt = new Date().toISOString(),
) {
  return {
    product: "WageLens",
    reportType: "research-preview",
    generatedAt,
    ruleVersion: rules.version,
    lastVerified: rules.lastVerified,
    ruleSources: rules.rules.map((rule) => ({
      id: rule.id,
      paragraph: rule.paragraph,
      source: rule.source,
      status: rule.status,
    })),
    officialLinks,
    disclaimer:
      "Decision support, not legal advice. Overall findings remain REVIEW. This preview does not complete all legal, boundary or exception checks.",
    findings: results.map((result) => ({
      ...result,
      guidance: findingGuidance(result),
    })),
  };
}
