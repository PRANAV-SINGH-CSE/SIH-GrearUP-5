# CompliScan — Legal Compliance Engine Documentation

The **ComplianceEngine** is the central adjudicating component of CompliScan. It evaluates structured product declarations against versioned statutory rules under the **Legal Metrology (Packaged Commodities) Rules, 2011 (LMPC Rules 2011)**.

---

## 1. Design Philosophy

1. **Deterministic Execution**: Given the same structured product declaration and ruleset, the engine will always produce the exact same evaluation.
2. **Decoupled from Perception**: The compliance engine does not know whether declarations were extracted via local OCR, Google Gemini, regex parsers, or human input. It operates purely on domain objects.
3. **No Hallucinated Legal Logic**: Every rule corresponds directly to a section or schedule of the Legal Metrology Act, 2009 or the Packaged Commodities Rules, 2011. If a rule requires physical parameters not ascertainable from a 2D photograph (such as font height in millimeters), the rule is explicitly designated as `humanVerificationRequired: true` and marked `UNVERIFIABLE`.

---

## 2. Rule Evaluation Model

Every rule implements the `IComplianceRule` interface:

```typescript
export interface IComplianceRule {
  readonly id: string;
  readonly name: string;
  readonly legalReference: string;
  readonly category: string;
  readonly severity: 'ERROR' | 'WARNING' | 'INFO';
  readonly applicability: string;
  readonly ruleVersion: string;
  readonly humanVerificationRequired: boolean;
  readonly errorCode: string;
  readonly explanationKey: string;

  evaluate(context: RuleExecutionContext): RuleEvaluation;
}
```

### Result Statuses (`RuleStatus`):
| Status | Meaning |
| :--- | :--- |
| `PASS` | Statutory requirement is completely satisfied. |
| `FAIL` | Statutory requirement is violated (e.g. prohibited unit symbol or missing mandatory declaration). |
| `WARNING` | Advisory finding (e.g. Unit Sale Price missing or date format ambiguous). |
| `UNVERIFIABLE` | Cannot be verified automatically (e.g. low OCR confidence or physical dimensions required). |
| `NOT_APPLICABLE`| Rule does not apply to this commodity category (e.g. food expiry on non-food). |

---

## 3. Overall Status Aggregation Logic

The `ComplianceAggregator` computes the composite status based on strict statutory priorities:

```
                  ┌───────────────────────────────┐
                  │ Are there any FAIL statuses   │
                  │ on ERROR-severity rules?      │
                  └───────────────┬───────────────┘
                                  │
                       YES ───────┴─────── NO
                        │                   │
                        ▼                   ▼
                ┌───────────────┐   ┌───────────────────────────────┐
                │ NON_COMPLIANT │   │ Are key mandatory declarations│
                └───────────────┘   │ UNVERIFIABLE (e.g. bad OCR)?  │
                                    └───────────────┬───────────────┘
                                                    │
                                         YES ───────┴─────── NO
                                          │                   │
                                          ▼                   ▼
                                  ┌──────────────┐   ┌───────────────────────────────┐
                                  │ NEEDS_REVIEW │   │ Are there any WARNING         │
                                  └──────────────┘   │ statuses present?             │
                                                     └───────────────┬───────────────┘
                                                                     │
                                                          YES ───────┴─────── NO
                                                           │                   │
                                                           ▼                   ▼
                                                ┌────────────────────────┐   ┌───────────┐
                                                │COMPLIANT_WITH_WARNINGS │   │ COMPLIANT │
                                                └────────────────────────┘   └───────────┘
```

---

## 4. Evidence & Auditability

Every rule evaluation returns concrete evidence:
- `extractedValue`: The parsed value extracted from the package.
- `evidenceText`: Verbatim OCR snippet where the declaration was identified.
- `boundingBox`: Pixel coordinates on the image $(x, y, w, h)$ enabling bounding-box overlays in client applications.
- `confidence`: Perception/extraction confidence score $(0.0 - 1.0)$.
- `legalReference`: Explicit citation of the Legal Metrology rule (e.g., `Rule 6(1)(e)`).
