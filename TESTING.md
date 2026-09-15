# CompliScan — Testing & Quality Assurance Guide

CompliScan includes an automated test suite executed with Vitest.

---

## 1. Running Automated Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

---

## 2. Test Suite Structure

```
tests/
├── unit/
│   ├── normalization.test.ts      # Tests MRP, tax inclusion, metric unit symbols, dates, consumer contacts
│   ├── compliance-rules.test.ts   # Tests individual LMPC 2011 statutory rules (pass, fail, unverifiable)
│   └── aggregator.test.ts         # Tests status matrix aggregation logic
└── integration/
    ├── synthetic-scenarios.test.ts# Tests all 12 synthetic compliance scenarios (Prompt Section 36)
    └── api.test.ts                # Tests all REST API endpoints (/rules, /scans, /compliance, /report, /sync)
```

---

## 3. Synthetic Compliance Scenarios (Section 36)

| # | Scenario | Expected Outcome | Statutory Legal Reference |
| :--- | :--- | :--- | :--- |
| 1 | Fully compliant label (Basmati Rice) | `COMPLIANT` / `COMPLIANT_WITH_WARNINGS` | LMPC 2011 Rules 6, 7, 18 |
| 2 | Missing MRP & Taxes (Roasted Almonds) | `NON_COMPLIANT` (`ERR_MISSING_MRP`) | Rule 6(1)(e) |
| 3 | Missing Net Quantity (Sunflower Oil) | `NON_COMPLIANT` (`ERR_MISSING_NET_QTY`) | Rule 6(1)(c) |
| 4 | Missing Manufacturer (Garam Masala) | `NON_COMPLIANT` (`ERR_MISSING_MANUFACTURER`) | Rule 6(1)(a) |
| 5 | Missing Country of Origin (Corn Flakes) | `NON_COMPLIANT` (`ERR_MISSING_COUNTRY_OF_ORIGIN`) | Rule 6(1)(da) |
| 6 | Missing Consumer Care (Green Tea) | `NON_COMPLIANT` (`ERR_MISSING_CONSUMER_CARE`) | Rule 6(1)(e) (amended 2017) |
| 7 | Prohibited unit symbol `"gms"` | `NON_COMPLIANT` (`ERR_INVALID_UNIT_SYMBOL`) | Rule 7 & Schedule II |
| 8 | Poor OCR / low confidence image | `NEEDS_REVIEW` (Distinguished from FAIL!) | System requirement |
| 9 | Ambiguous date (`05/06/2026`) | `WARNING` (`WARN_AMBIGUOUS_DATE`) | Rule 6(1)(d) advisory |
| 10 | Food product with expiry date | Evaluates `LMPC-R06-EXP-01` on food | Food Safety & LMPC Rules |
| 11 | Offline sync with ruleset mismatch | `CONFLICT_RULES_UPDATED` | Offline Sync protocol |
| 12 | Hindi localized report generation | Generates Hindi explanations & remedies | Rule Presentation layer |
