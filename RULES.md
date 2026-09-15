# Legal Metrology (Packaged Commodities) Rules, 2011 — Rules Reference

This document lists all Legal Metrology rules implemented in CompliScan Ruleset `LMPC-2011.v2026`.

---

## 1. Implemented & Authoritative Rules

| Rule ID | Legal Reference | Statutory Requirement | Severity | Automatable? |
| :--- | :--- | :--- | :--- | :--- |
| **`LMPC-R06-MFG-01`** | Rule 6(1)(a) | Name and complete address of the manufacturer, packer, or importer must be declared on the package. | `ERROR` | Yes (Presence check) |
| **`LMPC-R06-GEN-01`** | Rule 6(1)(b) | Generic or common name of the commodity contained in the package. | `ERROR` | Yes (Presence check) |
| **`LMPC-R06-QTY-01`** | Rule 6(1)(c) | Net quantity declaration in terms of standard unit of weight, volume, or number. | `ERROR` | Yes (Presence check) |
| **`LMPC-R07-UNIT-01`** | Rule 7 & Sched. II | Quantity must strictly use approved metric unit symbols: `g`, `kg`, `ml`, `l`, `N`, `U`. Prohibited symbols (`gms`, `kilos`, `ltrs`, `gm`) constitute an explicit violation. | `ERROR` | Yes (Format check) |
| **`LMPC-R06-MRP-01`** | Rule 6(1)(e) | Maximum Retail Price (MRP) in INR with explicit statutory wording: *"inclusive of all taxes"* or *"incl. of all taxes"*. | `ERROR` | Yes (Value & Phrase check) |
| **`LMPC-R06-DATE-01`** | Rule 6(1)(d) | Month and year of manufacture or pre-packing (MM/YYYY or Month Year). | `ERROR` | Yes (Format & Ambiguity check) |
| **`LMPC-R06-COO-01`** | Rule 6(1)(da) | Country of origin or manufacture. Mandatory on all packaged goods (notified 2017/2020). | `ERROR` | Yes (Presence check) |
| **`LMPC-R06-CC-01`** | Rule 6(1)(e) (2017) | Consumer grievance redressal details: Name, address, telephone helpline, and email address of grievance contact. | `ERROR` | Yes (Multi-contact check) |
| **`LMPC-R06-USP-01`** | Rule 6(11) (2021) | Unit Sale Price (USP) in ₹/g, ₹/kg, ₹/ml, ₹/l where MRP is indicated. | `WARNING` | Yes (Cross-field check) |
| **`LMPC-R06-EXP-01`** | Rule 6(1)(d) & Food | Expiry date or Best-Before declaration on pre-packaged food commodities. | `ERROR` | Yes (Category-specific) |

---

## 2. Rules Requiring Physical / Human Verification

| Rule ID | Legal Reference | Statutory Requirement | Status in CompliScan |
| :--- | :--- | :--- | :--- |
| **`LMPC-R09-PDP-01`** | Rule 9 & Rule 10 | Numeral font height on Principal Display Panel (PDP) based on package surface area (e.g. min 2mm, 4mm, 6mm). | **Flagged as `UNVERIFIABLE`**. A 2D photo lacks calibrated 3D package surface area measurements. CompliScan explicitly flags this for physical gauge inspection rather than faking compliance. |
| **`LMPC-R10-CONT-01`** | Rule 9(2) | Color contrast of declarations against background packaging. | **Flagged as Advisory Warning** if image contrast is below threshold. |
