# CompliScan — Offline Field Inspection Architecture

Field inspectors from the Department of Legal Metrology frequently operate in remote warehouses, rural markets, and border checkposts without reliable internet access.

CompliScan is architected from the ground up to support **hybrid online/offline operations**.

---

## 1. Separation of Capabilities

```
+------------------------------------+    +------------------------------------+
|          OFFLINE-CAPABLE           |    |          ONLINE-REQUIRED           |
| (Runs on mobile device or local hub|    |  (Requires central server access)  |
+------------------------------------+    +------------------------------------+
| - Label image capture              |    | - Google Gemini multimodal vision  |
| - Local image preprocessing        |    | - Central audit database logging   |
| - Local OCR (Tesseract / On-device)|    | - Cloud ruleset synchronization    |
| - Deterministic rule evaluation    |    | - Legal notice generation          |
| - Local SQLite / IndexedDB storage |    | - Cross-inspector analytics        |
| - Generation of advisory reports   |    +------------------------------------+
+------------------------------------+
```

---

## 2. Synchronization Lifecycle

```
[FIELD DEVICE]                                                [CENTRAL SERVER]
      │                                                               │
      ├─ 1. Inspector captures label photograph                       │
      ├─ 2. Local preprocessing & OCR                                 │
      ├─ 3. Local Deterministic Rule Engine evaluates                 │
      ├─ 4. Stored locally with UUID (offlineClientId)                │
      │    Status: PENDING_SYNC                                       │
      │                                                               │
      │               ═══════ INTERNET AVAILABLE ═══════              │
      │                                                               │
      ├─ 5. POST /api/offline/sync (Batch payload) ──────────────────>│
      │                                                               ├─ 6. Verify client UUID
      │                                                               ├─ 7. Check server ruleset
      │                                                               │     (Conflict check)
      │                                                               ├─ 8. Re-evaluate if ruleset
      │                                                               │     was updated
      │                                                               ├─ 9. Persist central scan
      │<─ 10. Return batch response with syncStatus ──────────────────┘
      │
      ├─ 11. Mark local scan as SYNCED
```

---

## 3. Conflict Resolution Protocol

1. **Client Timestamp Integrity**: Every offline scan records `capturedAt` (device ISO timestamp) and `imageHash` (SHA-256).
2. **Ruleset Version Checks**:
   - If the client's `localRulesetVersion` matches the central server ruleset $\implies$ Status: `SYNCED`.
   - If the server has a newer ruleset $\implies$ Status: `CONFLICT_RULES_UPDATED`. The central server deterministically re-evaluates the extracted declarations using the latest legal ruleset, ensuring compliance audits are authoritative.
3. **Idempotency**: All sync requests use client-side UUIDs (`offlineClientId`). Resending a batch never duplicates scans.
