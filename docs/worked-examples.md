# Worked examples — draft acceptance cases

Version 0.1-research; checked 26 October 2026. Decision support, not legal advice. Rules/source links are in [rules-spec.md](rules-spec.md).

These are synthetic arithmetic fixtures, not actual payroll. Unless stated: annual requirement £52,000; hourly requirement £20; CoS assigned 8 April 2026; all pay is eligible basic pay; no leave, deductions or irregular pattern. Full history and relevant declarations are assumed. PASS refers only to specified tests. Before a full window exists, that test returns REVIEW for every earlier period. Boundary-spanning windows require the agreed allocation policy; these examples cover aligned complete windows only.

| # | Inputs per period | Expected per-period / window outcome | Deciding rule |
| --- | --- | --- | --- |
| 1 Monthly equality | May–July 2026, £4,333 / £4,333 / £4,334; 160h each | Hourly PASS each; May/June window REVIEW; July £13,000 window PASS | hourly + monthly |
| 2 Monthly window shortage | May–July, £4,000 each; 160h each | Hourly PASS each; first two windows REVIEW; July FAIL, £1,000 short | monthly |
| 3 Hourly shortage | May–July, £4,400 each; hours 160 / 230 / 160 | June hourly FAIL: £200 short; other hourly PASS; July £13,200 window PASS; June issue remains | hourly |
| 4 Weekly equality | 12 consecutive weeks from 4 May 2026; £1,000 and 40h each | Hourly PASS all; weeks 1–11 window REVIEW; week 12 £12,000 window PASS | frequent |
| 5 Weekly shortage | Same dates; £950 and 40h weekly | Hourly PASS all; week 12 FAIL, £600 window shortage | frequent |
| 6 Four-weekly | Three consecutive 4-week periods from 4 May; £4,000 and 160h each | Hourly PASS each; periods 1–2 window REVIEW; period 3 £12,000 window PASS | frequent, not monthly |
| 7 Fortnightly | Six consecutive fortnights from 4 May; £2,000 and 80h each | Hourly PASS each; first five windows REVIEW; sixth £12,000 window PASS | frequent |
| 8 Bonus-heavy | May–July £3,000 basic + £1,500 bonus; 160h each | Hourly FAIL each, £200 short; July eligible £9,000 window FAIL, £4,000 short | eligible-pay + hourly + monthly |
| 9 Variable pattern | 17 weeks from 4 May; alternating 30/50h; £1,000 weekly; confirmation absent | REVIEW every period: no approved pattern/evidence. £17,000 arithmetic alone cannot clear hourly or classification issues | irregular |
| 10 Mid-year rise | May–July £4,400 / £4,500 / £4,600; annual requirement changes £52,000→£54,000 on 15 June; 160h/month | Hourly PASS each if unchanged £20 rate; rolling outcome REVIEW pending effective-date policy | unresolved mixed requirement |
| 11 Unpaid leave | May–July £4,400 / £0 / £4,400; hours 160 / 0 / 160; June leave reason absent | June and July window REVIEW; cannot treat zero hours as overall PASS or automatically declare failure | leave |
| 12 Part-month starter | Starts 16 May; May £2,200/80h; June/July £4,400/160h | Hourly PASS each; window REVIEW throughout supplied history pending part-period policy | unresolved partial window |
| 13 Earlier CoS | CoS 7 April 2026; otherwise example 1 | REVIEW each period for scope; no retrospective PASS from this ruleset | commencement |
| 14 Deduction | Example 1, plus £500 employer-loan repayment in June | REVIEW affected period/window; net bank payment and gross basic pay are insufficient to classify the subtraction | deductions |
| 15 Hourly-paid regular | 12 weeks from 4 May; guaranteed 40h at £25/h; £1,000 weekly | Hourly PASS each; final complete aligned window PASS; earlier windows REVIEW | eligible-pay + frequent |

For every FAIL: show arithmetic, invite payroll review and adviser assessment, and flag that reporting duties may apply. A later top-up must not erase the original result or imply that a breach has been cured. REVIEW cases are intentionally not numerical legal determinations.
