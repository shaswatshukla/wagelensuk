# WageLens: BA case study

**Pay-period salary screening for UK Skilled Worker sponsors**  
**Status:** portfolio research prototype · decision support only · not legal advice

## 1. Problem statement

The Home Office Skilled Worker rules require sponsors to assess salary in pay periods and compare pay with the going rate for hours worked. For CoS assigned on or after 8 April 2026, Appendix Skilled Worker SW 14.3B sets checks over each pay period, any three-month period for monthly-or-less pay, any 12-week period for more frequent pay, and a 17-week period for certain uneven patterns. [Sponsor guidance](https://www.gov.uk/government/publications/sponsor-a-skilled-worker/workers-and-temporary-workers-sponsor-a-skilled-worker-accessible) · [Immigration Rules](https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-skilled-worker)

The proposed user problem is operational: payroll exports vary, relevant salary requirements live in CoS and rule context, and manual comparisons across pay periods are easy to miss. The prototype makes selected inputs and arithmetic easier to inspect. It does not establish whether a worker or role meets immigration requirements.

## 2. Users and stakeholders

| Stakeholder | Need or concern |
|---|---|
| Sponsor HR / immigration compliance | Check payroll against a known CoS requirement and identify records needing attention. |
| Payroll administrator | Use the employer’s existing export format; correct uncertain imports without restructuring the source file. |
| Worker | Avoid unnecessary disclosure of payroll identifiers and receive fair, explainable handling. |
| Immigration adviser / solicitor | Verify SOC code, salary option, exceptions and interpretation against the rules and evidence. |
| Business owner / sponsor authorising officer | Understand limits, evidence trail and who owns a follow-up action. |

These are stakeholder hypotheses from desk research and rule analysis. Interviews with sponsor payroll and HR professionals are still needed.

## 3. Business-analysis approach

1. **Source review:** read Appendix Skilled Worker SW 14.1–14.5, Appendix Skilled Occupations and sponsor guidance. Separate the legal requirements from assumptions the prototype cannot resolve.
2. **Workflow analysis:** define import → recognise fields → show provenance → let the user correct values → calculate → explain → export.
3. **Requirements:** prioritize conservative data handling, traceable calculations, editable extraction and explicit missing information.
4. **Acceptance examples:** cover monthly and more-frequent pay, hourly comparisons, missing fields, uncertain mapping and unsupported cases.
5. **Scope control:** keep unsupported situations at REVIEW and state what evidence or adviser confirmation is still needed.

## 4. Requirements and acceptance criteria

| ID | Requirement | Acceptance criterion | Status |
|---|---|---|---|
| BA-01 | Accept common payroll exports without forcing an employer template | User can import supported Excel/CSV/TSV or paste cells; the source file is not changed. | Implemented in the prototype |
| BA-02 | Show field recognition and uncertainty | Each suggested match is visible and editable; unmatched requirement fields remain blank. | Implemented in the prototype |
| BA-03 | Show extraction provenance | Confirmation view pairs imported values with source headings/values and requires confirmation before screening. | Implemented in the prototype |
| BA-04 | Explain hourly arithmetic | Finding exposes the basic pay, hours and supplied rate used in the comparison. | Implemented in the prototype |
| BA-05 | Keep payroll client-side | Browser test rejects requests containing payroll data; ordinary page loads may be logged by the host. | Test-backed, not a formal security certification |
| BA-06 | Screen salary windows | Aligned monthly and 12-week windows have prototype calculations; boundary allocation is not complete. | Partial |
| BA-07 | Assess uneven-pattern 17-week cases and legal exceptions | Confirm the pattern, applicable threshold, deductions and related context before producing a final result. | Not complete |
| BA-08 | Produce a definitive compliance verdict | Return PASS/FAIL only after all supported legal conditions and evidence are covered. | Not implemented; all overall findings remain REVIEW |

## 5. Assumptions and decisions

- The sponsor or adviser supplies and confirms the applicable SOC code, CoS hours and salary option.
- Basic pay and actual hours are not inferred from overtime, allowances, bonuses or benefits.
- Generic “salary” columns are not assumed to be a CoS salary requirement.
- Uncertain fields and unsupported legal cases remain REVIEW.
- Payroll data should stay on the user’s device; selected report exports are user initiated.
- The public baseline does not automatically fetch or refresh the Home Office rules.

## 6. Risks and mitigations

| Risk | Mitigation in the prototype | Remaining gap |
|---|---|---|
| Wrong column or PDF extraction | Show source values, allow edits, require confirmation. | Layout parsing is not universal; validate every extraction. |
| Wrong SOC code or salary option | Require user-supplied requirements and provide source links. | The tool does not determine role eligibility or choose the correct option. |
| Boundary or irregular pay mishandled | Keep incomplete cases at REVIEW and explain scope. | Implement and validate full window allocation only after user research and legal review. |
| Rules change | Version and verification date appear with research rules. | No automatic legal-change approval; add a stale-source alert and reviewed release process. |
| Sensitive payroll exposure | Browser-only processing, no payroll backend, privacy checks. | Security tests do not prove absence of every leak or host log. |

## 7. Definition of done for this research preview

- A recruiter can load sample data without uploading real payroll.
- A user can inspect and edit recognized values before calculation.
- Findings expose their calculation and official rule references.
- Missing or unsupported inputs never silently become zero or a legal conclusion.
- Privacy claims are scoped to payroll processing, with hosting request logs disclosed.
- Limitations are visible before a user treats a finding as an assurance.

## 8. Validation plan

Before expanding the verdict engine, interview five people who manage sponsor payroll or HR compliance. Ask:

1. How do you check pay-period compliance today?
2. What evidence would you need before trusting a browser-only screening result?
3. What would a missed shortfall cost your team or the worker?

Use the answers to prioritize the next workflow and acceptance criteria. Do not treat interview feedback as legal validation.

## 9. Two-minute walkthrough

1. Open the [public baseline](https://wagelensuk.wluk.workers.dev/#/) and click **Try sample screening**.
2. Expand a sample finding to show the calculation and missing context.
3. Open the rules/methodology panel and explain why overall findings stay REVIEW.
4. Export the sample report and clear it.
5. Demonstrate a sample import confirmation without using real employee data.

## 10. Source references

- [Appendix Skilled Worker, especially SW 14.1–14.5](https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-skilled-worker)
- [Appendix Skilled Occupations](https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-skilled-occupations)
- [Sponsor a Skilled Worker guidance, version 04/26](https://www.gov.uk/government/publications/sponsor-a-skilled-worker/workers-and-temporary-workers-sponsor-a-skilled-worker-accessible)

The case study is an analysis artifact, not a solicitor’s opinion or proof that all scenarios are covered.
