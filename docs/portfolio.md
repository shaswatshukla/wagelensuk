# WageLens portfolio walkthrough

## Problem

Small UK employers need a practical way to inspect sponsored-worker payroll without uploading employee documents to a service. Payroll exports vary, and applicable salary requirements cannot safely be inferred from generic salary fields.

## Engineering decisions

- Static TypeScript/Vite architecture with no payroll backend, accounts, database or analytics.
- Automatic, deterministic field recognition followed by explicit user confirmation; ambiguous fields remain blank.
- Local spreadsheet and readable-PDF parsers, with selected-field provenance and excluded identifying columns.
- Integer-pence arithmetic and rational comparisons for fractional hours; versioned rule configuration and primary-source research.
- Conservative REVIEW results where legal interpretation, history or exceptions are unresolved.
- Real browser tests that reject payroll network requests and permit only exact, known local parser assets.
- Keyboard-accessible controls, automated WCAG checks and 360px overflow checks.
- Locked builds, CI and native Cloudflare Git deployments.

## Demo in under two minutes

1. Open the hosted preview and choose **Try sample data**.
2. Expand the potential hourly shortfall and inspect the calculation and limitations.
3. Export a local report, then clear the sample.
4. Import a payroll-shaped spreadsheet with Employee ID, Basic Salary and Payment Date headings. Show automatic matching and the missing CoS fields.
5. Show that evaluation is disabled until extracted values are confirmed.
6. Open the browser Network panel to demonstrate that payroll does not leave the browser.

## Honest limitations

This is a research preview and an engineering demonstration. It is not solicitor-approved legal advice or a complete compliance product. Scanned documents/OCR, universal document understanding, arbitrary salary-window boundaries and several legal exception workflows remain out of scope. Automated test coverage does not establish legal correctness.

Recruiters cannot open a private repository without an invitation. The hosted demonstration can be shared separately; visibility stays private until the owner explicitly changes it.
