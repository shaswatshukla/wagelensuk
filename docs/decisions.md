# Decisions before implementation

## Proposed brand

**WageLens** — “See every pay period clearly.” A working name only: trade mark, company-name and domain availability have not been checked.

Visual direction requested by owner: dark mode by default, charcoal surfaces, oversized geometric headings, electric-indigo controls, restrained lime highlights and legible status text/icons. Build the checker into the hero. Use system fonts or local assets, accessible contrast and reduced-motion support. No UI created before Phase 0 approval.

## Owner questions

1. Approve Phase 0 and WageLens as the working name?
2. Approve additional import declarations for the input gaps in the specification, with REVIEW whenever evidence is missing?
3. Retain no public launch before solicitor review (the supplied default)?
4. Use GOV.UK England and Wales bank-holiday data as the proposed working-day source? Retrieval and deadline policy still need verification.

Before launch, also decide business/footer identity, adviser CTA/provider, repo name/visibility, domain and primary host. These need not block local implementation once Phase 0 is approved. No purchases, settings changes or public deployment authorised.

## Solicitor questions

- Confirm commencement/transitional treatment for pre-8-April CoS, later extensions and in-progress sponsorship.
- Define any-three-month / 12-week / 17-week boundary allocation, incomplete history and part-period treatment.
- Resolve SW 14.3B(d) versus SK7.25, deduction averaging and evidence required.
- Confirm eligible-pay classification, legacy allowance exceptions and how guaranteed hourly pay is treated.
- Agree leave exceptions, salary changes within a window, applicable hourly discounts and rounding.
- Define a reporting trigger separately from a detected numerical shortage, and approve working-day calculation conventions.

## Next phase

After approval: static TypeScript application, versioned rules JSON, pure calculation engine and acceptance/property tests; then CSV mapping and dark UI. Design tools were inspected but no design generation, external project or deployment was started because the brief requires this gate first.
