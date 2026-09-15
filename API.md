# CompliScan — REST API Documentation

CompliScan exposes clean REST-style API endpoints consumed by web applications, Android applications, and field-inspector tablets.

---

## Base URL
```
http://localhost:3000/api
```

---

## 1. Create / Upload Scan

### `POST /api/scans`
Uploads a product label image and executes the complete verification pipeline.

#### Request Formats:
**A. Multipart Form-Data:**
- `file`: (Binary image file: JPEG, PNG, WebP)
- `category`: (Optional string, default: `GENERIC_PACKAGED_COMMODITY`)
- `locale`: (Optional: `en` | `hi`, default: `en`)
- `rulesetVersion`: (Optional string, default: `LMPC-2011.v2026`)
- `offlineClientId`: (Optional client-generated UUID)

**B. JSON (Base64):**
```json
{
  "image": "<base64-encoded-image-string>",
  "filename": "label.png",
  "mimeType": "image/png",
  "category": "GENERIC_PACKAGED_COMMODITY",
  "locale": "en"
}
```

#### Response (201 Created):
```json
{
  "success": true,
  "data": {
    "scan": {
      "id": "c71120f2-70b5-4a55-8735-a1bb942b083b",
      "status": "COMPLETED",
      "category": "GENERIC_PACKAGED_COMMODITY",
      "overallStatus": "COMPLIANT_WITH_WARNINGS",
      "rulesetVersion": "LMPC-2011.v2026",
      "createdAt": "2026-09-15T04:29:55.817Z"
    },
    "report": {
      "reportId": "REP-D73821AB",
      "scanId": "c71120f2-70b5-4a55-8735-a1bb942b083b",
      "overallStatus": "COMPLIANT_WITH_WARNINGS",
      "statusExplanation": "All mandatory declarations are present and compliant, but 1 advisory warning(s) were flagged.",
      "productInformation": {
        "productName": "Basmati Rice",
        "genericName": "Rice",
        "category": "GENERIC_PACKAGED_COMMODITY",
        "manufacturerOrPacker": "Himalayan Agro Foods Ltd"
      },
      "findings": {
        "passed": [...],
        "violations": [...],
        "warnings": [...],
        "unverifiable": [...]
      },
      "legalDisclaimer": "..."
    }
  }
}
```

---

## 2. List Scans

### `GET /api/scans?limit=50&offset=0`
Returns a paginated list of historic scans.

#### Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "c71120f2-70b5-4a55-8735-a1bb942b083b",
      "status": "COMPLETED",
      "category": "GENERIC_PACKAGED_COMMODITY",
      "overallStatus": "COMPLIANT_WITH_WARNINGS",
      "createdAt": "2026-09-15T04:29:55.817Z"
    }
  ]
}
```

---

## 3. Retrieve Scan Detail

### `GET /api/scans/:id`
Returns the full scan record including image metadata, OCR perception blocks, extracted declarations, and compliance status.

---

## 4. Retrieve Compliance Evaluation

### `GET /api/scans/:id/compliance`
Returns the evaluated rule breakdown and violation details.

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "scanId": "...",
    "rulesetVersion": "LMPC-2011.v2026",
    "category": "GENERIC_PACKAGED_COMMODITY",
    "overallStatus": "NON_COMPLIANT",
    "passedChecks": [...],
    "violations": [
      {
        "ruleId": "LMPC-R06-MRP-01",
        "name": "Maximum Retail Price (MRP) & Tax Inclusion",
        "status": "FAIL",
        "severity": "ERROR",
        "message": "Maximum Retail Price (MRP) declaration was not detected in the provided image.",
        "field": "mrp",
        "legalReference": "Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(e)",
        "errorCode": "ERR_MISSING_MRP"
      }
    ],
    "counts": {
      "total": 10,
      "passed": 8,
      "failed": 1,
      "warning": 1,
      "unverifiable": 1,
      "notApplicable": 0
    }
  }
}
```

---

## 5. Retrieve Compliance Report

### `GET /api/scans/:id/report?lang=en|hi&format=json|html`
Generates and returns an audit-ready compliance report.

- `lang`: `en` (default) or `hi` (Hindi)
- `format`: `json` (default) or `html` (printable document)

---

## 6. Delete Scan Record (Privacy & Retention)

### `DELETE /api/scans/:id`
Deletes the scan and associated image references.

---

## 7. Get Active Legal Rules

### `GET /api/rules?category=FOOD_PRODUCT`
Returns the catalog of Legal Metrology (Packaged Commodities) Rules active in the ruleset.

---

## 8. Get Product Categories

### `GET /api/categories`
Returns registered product categories (`GENERIC_PACKAGED_COMMODITY`, `FOOD_PRODUCT`, `IMPORTED_COMMODITY`) and their required rule IDs.

---

## 9. Offline Field Synchronization

### `POST /api/offline/sync`
Synchronizes scans captured offline by field inspectors.

#### Request Body:
```json
{
  "deviceId": "INSPECTOR-TAB-04",
  "clientTimestamp": "2026-09-15T09:00:00Z",
  "items": [
    {
      "offlineClientId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "capturedAt": "2026-09-15T08:50:00Z",
      "category": "GENERIC_PACKAGED_COMMODITY",
      "localRulesetVersion": "LMPC-2011.v2024",
      "extractedDeclarations": { ... },
      "imageHash": "aabbcc112233"
    }
  ]
}
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "success": true,
    "processedCount": 1,
    "results": [
      {
        "offlineClientId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "serverScanId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "syncStatus": "CONFLICT_RULES_UPDATED",
        "serverOverallStatus": "NON_COMPLIANT",
        "message": "Client ruleset (LMPC-2011.v2024) was updated to latest server ruleset (LMPC-2011.v2026). Compliance re-evaluated."
      }
    ]
  }
}
```
