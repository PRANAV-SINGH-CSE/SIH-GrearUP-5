# CompliScan — AI-Assisted Packaged-Commodity Label Compliance Verification System

CompliScan is an enterprise full-stack backend and API system designed for automated compliance screening of packaged commodity labels in India under the **Legal Metrology (Packaged Commodities) Rules, 2011 (LMPC Rules 2011)** and its subsequent statutory amendments.

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(By default, `.env.local` runs in zero-configuration local mode using `DATABASE_PROVIDER=memory`, `OCR_PROVIDER=mock`, `AI_PROVIDER=mock` so you can immediately run and test the complete pipeline without external credentials!)*

To enable Google Gemini 2.5 Flash multimodal perception and PostgreSQL:
```env
DATABASE_PROVIDER=prisma
DATABASE_URL=postgresql://user:pass@localhost:5432/compliscan
OCR_PROVIDER=gemini
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Automated Tests
```bash
npm run test
```
Executes all 38 unit and integration tests across all 12 synthetic compliance scenarios, normalization modules, deterministic rule checks, and REST API endpoints.

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the interactive functional test harness.

---

## 🏛️ Architectural Principle

CompliScan strictly enforces separation of concerns across four distinct layers:

$$\text{Perception (OCR)} \longrightarrow \text{Intelligence (Extraction/Normalization)} \longrightarrow \text{Legal Logic (Deterministic Rule Engine)} \longrightarrow \text{Presentation (APIs/Reports)}$$

- **Perception Layer**: Image upload validation, sharpness/contrast quality scoring, Sharp image preprocessing, and OCR transcription (Mock or Gemini 2.5 Flash).
- **Intelligence Layer**: Zero-cost deterministic regex/keyword parsing, statutory unit validation (LMPC Rule 7 & Schedule II), currency/MRP normalization, date parsing, consumer care extraction, and multimodal Gemini 2.5 Flash structured JSON extraction.
  - *Direct Image Fallback*: When OCR confidence is low or text is unreadable, the raw label photograph is passed directly to the Gemini 2.5 Flash multimodal vision API.
- **Legal Logic Layer**: Pure deterministic, versioned rule engine implementing the Legal Metrology (Packaged Commodities) Rules, 2011. An LLM is **NEVER** asked to decide whether a product is legally compliant.
- **Presentation Layer**: Language-neutral status aggregator (`COMPLIANT`, `NON_COMPLIANT`, `COMPLIANT_WITH_WARNINGS`, `NEEDS_REVIEW`), bilingual report generator (English and Hindi), and REST API endpoints.

---

## 📁 Repository Structure

```
src/
├── app/
│   ├── api/
│   │   ├── scans/
│   │   │   ├── route.ts                 # POST /api/scans, GET /api/scans
│   │   │   └── [id]/
│   │   │       ├── route.ts             # GET, DELETE /api/scans/:id
│   │   │       ├── process/route.ts     # POST /api/scans/:id/process
│   │   │       ├── compliance/route.ts  # GET /api/scans/:id/compliance
│   │   │       └── report/route.ts      # GET /api/scans/:id/report (?lang=en|hi)
│   │   ├── rules/route.ts               # GET /api/rules
│   │   ├── categories/route.ts          # GET /api/categories
│   │   └── offline/sync/route.ts        # POST /api/offline/sync
│   ├── page.tsx                         # Minimal functional test harness UI
│   └── layout.tsx
├── lib/
│   ├── compliance/                      # Deterministic Legal Rule Engine
│   │   ├── engine.ts                    # ComplianceEngine evaluator
│   │   ├── aggregator.ts                # Overall status decision matrix
│   │   └── rules/                       # Authoritative LMPC 2011 rule implementations
│   ├── extraction/                      # Declaration extraction layer (Deterministic + AI)
│   ├── normalization/                   # Currency, metric unit, date, contact normalizers
│   ├── ocr/                             # OCR abstraction (Mock + Gemini 2.5 Flash)
│   ├── image/                           # Image preprocessing & quality assessment (Sharp)
│   ├── storage/                         # Object storage abstraction (Local, S3, Supabase)
│   ├── repository/                      # Repository pattern (Prisma PostgreSQL + In-Memory)
│   ├── reports/                         # Structured JSON and printable HTML report generators
│   ├── i18n/                            # Bilingual translation dictionaries (English & Hindi)
│   ├── offline/                         # Offline sync contracts & conflict resolution
│   └── utils/                           # Structured logging & API error handling
├── prisma/
│   ├── schema.prisma                    # PostgreSQL database schema
│   └── seed.ts                          # Authoritative LMPC 2011 seed data
└── tests/
    ├── unit/                            # Normalization, rule, and aggregation unit tests
    └── integration/                     # Synthetic test scenarios & REST API integration tests
```

---

## ⚖️ Legal Source of Truth: LMPC Rules, 2011

All compliance checks correspond to statutory provisions under the **Legal Metrology (Packaged Commodities) Rules, 2011**:
- **Rule 6(1)(a)**: Name and complete address of the manufacturer, packer, or importer.
- **Rule 6(1)(b)**: Generic or common name of the commodity.
- **Rule 6(1)(c)**: Net quantity declaration.
- **Rule 7 & Schedule II**: Standard metric units of weight, measure, or number (`g`, `kg`, `ml`, `l`, `N`, `U`). Prohibited symbols (`gms`, `kilos`, `ltrs`, `gm`) constitute an explicit legal violation.
- **Rule 6(1)(e)**: Maximum Retail Price (MRP) in INR with mandatory *"inclusive of all taxes"* declaration.
- **Rule 6(1)(d)**: Month and year of manufacture or pre-packing.
- **Rule 6(1)(da)**: Country of origin declaration.
- **Rule 6(1)(e) (2017 Amendment)**: Consumer grievance redressal details (name, address, phone number, email address).
- **Rule 6(11) (2021 Amendment)**: Unit Sale Price (USP) in ₹/g, ₹/kg, ₹/ml, ₹/l.
- **Rule 9 & 10**: Principal Display Panel (PDP) prominence. *Flagged as `UNVERIFIABLE` / `humanVerificationRequired: true` because a 2D photograph lacks calibrated 3D package measurements.*

---

## 📱 Mobile App Conversion (Android Studio)

CompliScan's Next.js web application is architected to be packaged into an Android application via Android Studio using an Android WebView wrapper, Capacitor, or PWA. All core backend functions communicate strictly via clean REST APIs (`/api/scans`, `/api/offline/sync`, etc.), ensuring zero coupling between UI components and backend compliance logic.

---

## 📖 Documentation Sitemap
- [System Architecture (ARCHITECTURE.md)](./ARCHITECTURE.md)
- [REST API Specification (API.md)](./API.md)
- [Legal Compliance Engine (COMPLIANCE_ENGINE.md)](./COMPLIANCE_ENGINE.md)
- [LMPC 2011 Legal Rules Catalog (RULES.md)](./RULES.md)
- [Offline Inspection & Sync Guide (OFFLINE_ARCHITECTURE.md)](./OFFLINE_ARCHITECTURE.md)
- [Deployment & Operations (DEPLOYMENT.md)](./DEPLOYMENT.md)
- [Testing & Quality Assurance (TESTING.md)](./TESTING.md)
