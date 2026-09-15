# CompliScan — System Architecture Documentation

CompliScan is an enterprise-grade, AI-assisted packaged-commodity label compliance verification system for India, strictly grounded in the **Legal Metrology (Packaged Commodities) Rules, 2011 (LMPC Rules 2011)** and its official amendments.

---

## 1. Architectural Core Principles

### Strict Decoupling of Perception, Intelligence, and Legal Logic
CompliScan enforces an uncompromising boundary between perception and legal adjudication:

$$\text{Perception (OCR)} \longrightarrow \text{Intelligence (Extraction/Normalization)} \longrightarrow \text{Legal Logic (Deterministic Rule Engine)} \longrightarrow \text{Presentation (API/Report)}$$

```
+-------------------------------------------------------------------------+
|                                PERCEPTION                               |
|  Image Upload -> Quality Assessment -> Preprocessing -> OCR (Mock/Gemini)|
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                               INTELLIGENCE                              |
|  Deterministic Parsers -> OCR Normalization -> Gemini 2.5 Flash Fallback|
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                               LEGAL LOGIC                               |
|  Deterministic LMPC 2011 Rule Engine -> Versioned Ruleset Adjudication  |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                               PRESENTATION                              |
|  Aggregation Matrix -> Localized Reports (EN/HI) -> REST APIs / Web / App|
+-------------------------------------------------------------------------+
```

1. **AI is NOT a Legal Judge**: An LLM is never asked *"Is this product compliant?"*. AI is employed solely for perception assistance, OCR transcription, and semantic structuring of ambiguous declarations.
2. **Determinism**: All compliance decisions originate from versioned, machine-verifiable rule definitions based on statutory legal metrology sections.
3. **Absence vs. Unverifiable**: The system strictly distinguishes between *"Declaration not detected in the provided image"* (which may result from image angle or poor resolution) and *"Declaration definitely absent"*. Poor OCR produces `UNVERIFIABLE` and `NEEDS_REVIEW`, never false non-compliance.
4. **Multilingual by Architecture**: Legal logic produces language-neutral rule codes (e.g. `ERR_MISSING_MRP`), and the presentation layer maps them to localized statutory explanations in English and Hindi.

---

## 2. Component Breakdown

### 2.1 Storage Layer (`src/lib/storage/`)
- `IStorageProvider`: Storage abstraction supporting local filesystem storage, AWS S3, and Supabase Storage.
- Automatically calculates SHA-256 image hashes to detect duplicate uploads and enable caching.
- Retains both the original photograph and the preprocessed OCR asset separately.

### 2.2 Image Preprocessing & Quality Assessment (`src/lib/image/`)
- `ImageQualityService`:
  - Analyzes image resolution (minimum recommended: 600x600 px).
  - Assesses contrast standard deviation across color channels to detect washed-out or overexposed labels.
  - Returns a composite quality score (0.0 to 1.0) and emits `LOW_IMAGE_QUALITY` warnings when appropriate.
- `ImagePreprocessorService`:
  - Automatically corrects orientation from EXIF metadata.
  - Scales oversized images to prevent memory spikes.
  - Converts images to high-contrast grayscale and applies sharpening filters tailored for OCR edge recognition.

### 2.3 OCR Perception (`src/lib/ocr/`)
- `IOCRProvider`: Decoupled interface returning structured `OCRResult` with full text, blocks, lines, words, confidence scores, and bounding boxes.
- `MockOCRProvider`: Fast, deterministic perception provider containing 10+ synthetic test scenarios.
- `GeminiOCRProvider`: Real multimodal vision perception adapter powered by Google Gemini 2.5 Flash.

### 2.4 OCR Normalization (`src/lib/normalization/`)
- `CurrencyNormalizer`: Normalizes MRP strings (e.g., `Rs. 50/-`, `₹50`, `MRP 50.00`), inspects statutory tax inclusion phrasing (*"inclusive of all taxes"*), and detects OCR ambiguity (e.g. `O` vs `0` in `15O/-`).
- `QuantityNormalizer`: Strictly validates metric units under LMPC Rule 7 & Schedule II. Standard symbols (`g`, `kg`, `ml`, `l`, `N`, `U`) pass. Illegal non-standard symbols (`gms`, `kilos`, `ltrs`, `gm`) are flagged as violations.
- `DateNormalizer`: Parses month/year manufacturing and packing dates (e.g. `02/2026`, `FEB 2026`, `DD/MM/YYYY`) and detects month/day ambiguity.
- `ContactNormalizer`: Extracts consumer grievance helpline telephone numbers (e.g. `1800-xxx-xxxx`), email addresses, and postal addresses.

### 2.5 Declaration Extraction (`src/lib/extraction/`)
- `DeterministicExtractor`: Executes zero-cost regex and heuristic parsing on OCR text.
- `GeminiAIExtractionProvider`: Multimodal and text extraction via Gemini 2.5 Flash returning strict JSON validated by Zod schema.
- **OCR Failure Direct-Image Fallback**: If OCR fails or yields confidence $< 0.5$, CompliScan sends the image directly to Gemini 2.5 Flash vision to extract structured declarations.

### 2.6 Deterministic Legal Rule Engine (`src/lib/compliance/`)
- `RuleRegistry`: Stores active rules and maps applicable rules to product categories (`GENERIC_PACKAGED_COMMODITY`, `FOOD_PRODUCT`, `IMPORTED_COMMODITY`).
- Authoritative LMPC 2011 Rules:
  - `LMPC-R06-MFG-01`: Manufacturer / Packer declaration (Rule 6(1)(a))
  - `LMPC-R06-GEN-01`: Generic / Common commodity name (Rule 6(1)(b))
  - `LMPC-R06-QTY-01`: Net quantity declaration presence (Rule 6(1)(c))
  - `LMPC-R07-UNIT-01`: Standard metric units of weight/measure (Rule 7 & Schedule II)
  - `LMPC-R06-MRP-01`: Maximum Retail Price and tax inclusion (Rule 6(1)(e))
  - `LMPC-R06-DATE-01`: Month and year of manufacture/packing (Rule 6(1)(d))
  - `LMPC-R06-COO-01`: Country of origin declaration (Rule 6(1)(da))
  - `LMPC-R06-CC-01`: Consumer grievance redressal details (Rule 6(1)(e) as amended 2017)
  - `LMPC-R06-USP-01`: Unit Sale Price indication (Rule 6(11) as amended 2021)
  - `LMPC-R09-PDP-01`: Principal Display Panel prominence (requires physical measurement $\implies$ marked for human verification)
  - `LMPC-R06-EXP-01`: Expiry date for packaged food commodities.
- `ComplianceAggregator`: Evaluates the status matrix:
  - Any mandatory `FAIL` $\implies$ `NON_COMPLIANT`
  - All mandatory `PASS` with warnings $\implies$ `COMPLIANT_WITH_WARNINGS`
  - All mandatory `PASS` with zero warnings $\implies$ `COMPLIANT`
  - Unverifiable mandatory checks without hard failures $\implies$ `NEEDS_REVIEW`.

### 2.7 Multilingual & Report Generation (`src/lib/i18n/`, `src/lib/reports/`)
- `TranslatorService`: Localizes rule findings into English and Hindi without dynamic LLM translation.
- `ReportService`: Generates structured JSON reports and printable HTML documents including official non-certification disclaimers.

### 2.8 Repository & Database Layer (`src/lib/repository/`, `prisma/`)
- Full PostgreSQL schema managed via Prisma ORM.
- Abstract repository interface (`IScanRepository`) allowing seamless switching between PostgreSQL (`PrismaScanRepository`) and fast in-memory execution (`MemoryScanRepository`) for automated testing and offline environments.
