# WageLens — draft rules specification

Version: 0.1-research. Last checked: 26 October 2026. Phase 0 only; awaiting owner approval and solicitor review. Decision support, not legal advice.

## Primary sources

- [A: April 2026 sponsor guidance, version 04/26](https://assets.publishing.service.gov.uk/media/69e76a2ff766dcdcd05034ff/Sponsor-a-Skilled-Worker-04-26-v1.0_.pdf), pages 7, 48–51.
- [B: current Appendix Skilled Worker](https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-skilled-worker), SW 14 and SW 4.4.
- [C: sponsor duties, Part 3](https://www.gov.uk/government/publications/workers-and-temporary-workers-guidance-for-sponsors-part-3-sponsor-duties-and-compliance/workers-and-temporary-workers-guidance-for-sponsors-part-3-sponsor-duties-and-compliance-accessible), C1.13–C1.16.
- [D: HC 1691 publication](https://www.gov.uk/government/publications/statement-of-changes-to-the-immigration-rules-hc-1619-5-march-2026). The supplied PDF resolved to this publication page; commencement text was not independently extracted. Do not imply that it was fully verified.

## Rule register

All source letters link to the URLs above. Confirmation describes the underlying text, not approval of an implementation.

| ID | Reference/source | Short quotation | Status | Interpretation |
| --- | --- | --- | --- | --- |
| frequency | SK7.20 / A | “unless their contract specifies a different pay frequency” | PRIMARY-CONFIRMED | Default monthly-or-more-often; contractual exceptions require evidence. |
| hourly | SW 14.3B(a) / B | “for every hour worked” | PRIMARY-CONFIRMED | Test eligible pay against actual hours × supplied applicable hourly rate. |
| monthly | SK7.22 / A | “a quarter of the required annual salary” | PRIMARY-CONFIRMED | Monthly or less frequent: rolling three-month total. |
| frequent | SK7.23 / A | “any 12-week period” | PRIMARY-CONFIRMED | Weekly, fortnightly and four-weekly: annual requirement × 12/52. |
| irregular | SK7.24 / A | “any 17-week period” | PRIMARY-CONFIRMED | Confirmed uneven working patterns require annual × 17/52; declaration needed. |
| eligible-pay | SW 14.1–14.2 / B | “guaranteed basic gross pay” | PRIMARY-CONFIRMED | Exclude overtime, bonuses and ordinary allowances; guaranteed equivalents need classification. |
| deductions | SW 14.2A; 14.3B(d) / B | “the sponsor must confirm this” | PRIMARY-CONFIRMED | Sponsor-related deductions need separate assessment; REVIEW. |
| commencement | Changes section / A | — | PRIMARY-CONFIRMED | Guidance identifies CoS assignment from 8 April 2026; older cases REVIEW pending transition verification. |
| leave | SK8.1–8.5 / A | — | PRIMARY-CONFIRMED | Exceptions and reduction conditions exist; leave cases REVIEW. |
| reporting | C1.15 / C | “10 working days after the relevant change or event” | PRIMARY-CONFIRMED | Report qualifying reductions via SMS. Ordinary increases need not be reported; nurse/midwife registration exception applies. |

## Unresolved interpretation

SW 14.3B(d) refers to (c); SK7.25 discusses deductions across a wider set of tests. Seek advice before implementing an exception. Calendar-window boundaries, allocation of payment dates, incomplete windows, fractional pence, part-month starters and changing annual requirements need agreed treatment. These are unresolved implementation questions, not confirmed alternative legal rules; output REVIEW.

Current SW 4.4 confirms £41,700 for Option A, with other options. Its historical commencement was not verified here. Never select a threshold automatically: require employer-confirmed annual requirement and hourly rate. Missing either prevents an overall PASS. SW 14.5 contains transitional allowance provisions: REVIEW where relevant.

## Input gaps and proposed behaviour

The proposed CSV lacks contract-frequency confirmation, employment start/end, leave context, deduction breakdown, working-pattern confirmation and effective-dated salary requirements. Add optional structured declarations after import, subject to owner approval. Never infer them from low pay. Reject direct identifiers; process files only in browser memory.

PASS means only no issues found in the stated tests and complete supplied history. FAIL means a numerical shortfall with no unresolved exception; REVIEW covers incomplete evidence. Show each test separately; do not let a passing window conceal an hourly shortfall. Never present a licence-wide compliance conclusion.

Implementation proposal: integer pence; rational hour/rate comparisons; upward rounding only for displayed minimum payable pence, subject to solicitor approval. Rules and parameters will live in versioned JSON after approval. Every result/export must include version, checked date and disclaimer. No engine or UI is approved yet.

## Verification record

Read A, B and C using web retrieval, including relevant paragraph extracts. No executable tests exist at this phase. HC 1691 commencement and older sponsorship treatment remain unresolved. Market claims, domains, hosting terms and prices have not been checked; no infrastructure or accounts changed.
