import path from 'path';
import { IScanRepository } from '../repository/repository.interface';
import { IStorageProvider } from '../storage/storage.interface';
import { IOCRProvider } from '../ocr/ocr.interface';
import { ExtractionService } from '../extraction/extraction.service';
import { ComplianceEngine } from '../compliance/engine';
import { MeasurementMetadata } from '../compliance/rules/rule.interface';
import { AITextSizeInspectionService } from '../compliance/text-size/text-size-inspection.service';
import { ImageQualityService } from '../image/quality.service';
import { ImagePreprocessorService } from '../image/preprocessor.service';
import { ReportService } from '../reports/report.service';
import { ScanDetail } from '../types/scan';
import { ComplianceReport } from '../types/report';
import { Logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export interface AdditionalImageItem {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  label?: string;
}

export interface ScanPipelineOptions {
  category?: string;
  rulesetVersion?: string;
  offlineClientId?: string;
  locale?: 'en' | 'hi';
  scenarioId?: string;
  userId?: string;
  userEmail?: string;
  /** Optional calibrated client-side physical measurement metadata */
  measurementData?: MeasurementMetadata;
  /** Optional additional images of the same commodity (e.g. Back Panel, Side/MRP Panel, up to 2 extra) */
  additionalImages?: AdditionalImageItem[];
}

export class CompliScanPipeline {
  constructor(
    private repository: IScanRepository,
    private storage: IStorageProvider,
    private ocr: IOCRProvider,
    private extractionService: ExtractionService,
    private complianceEngine: ComplianceEngine = new ComplianceEngine(),
    private qualityService: ImageQualityService = new ImageQualityService(),
    private preprocessor: ImagePreprocessorService = new ImagePreprocessorService(),
    private textSizeService: AITextSizeInspectionService = new AITextSizeInspectionService()
  ) {}

  /**
   * Complete end-to-end CompliScan execution:
   * Image Buffer -> Upload Validation -> Quality Assessment -> Preprocessing -> OCR -> Extraction -> Legal Rule Engine -> Persistence -> Report
   */
  async processScan(
    imageBuffer: Buffer,
    filename: string,
    mimeType: string,
    options: ScanPipelineOptions = {}
  ): Promise<{ scan: ScanDetail; report: ComplianceReport }> {
    const startTime = Date.now();
    const {
      category = 'GENERIC_PACKAGED_COMMODITY',
      rulesetVersion = 'LMPC-2011.v2026',
      offlineClientId,
      locale = 'en',
    } = options;

    // 1. Validate and normalize upload MIME type (with magic bytes inspection)
    let effectiveMimeType = (mimeType || '').toLowerCase();
    if (
      !effectiveMimeType ||
      effectiveMimeType === 'application/octet-stream' ||
      !effectiveMimeType.startsWith('image/')
    ) {
      if (
        imageBuffer.length >= 3 &&
        imageBuffer[0] === 0xff &&
        imageBuffer[1] === 0xd8 &&
        imageBuffer[2] === 0xff
      ) {
        effectiveMimeType = 'image/jpeg';
      } else if (
        imageBuffer.length >= 8 &&
        imageBuffer[0] === 0x89 &&
        imageBuffer[1] === 0x50 &&
        imageBuffer[2] === 0x4e &&
        imageBuffer[3] === 0x47
      ) {
        effectiveMimeType = 'image/png';
      } else if (
        imageBuffer.length >= 12 &&
        imageBuffer.toString('ascii', 0, 4) === 'RIFF' &&
        imageBuffer.toString('ascii', 8, 12) === 'WEBP'
      ) {
        effectiveMimeType = 'image/webp';
      } else {
        const ext = path.extname(filename).toLowerCase();
        if (ext === '.png') effectiveMimeType = 'image/png';
        else if (ext === '.webp') effectiveMimeType = 'image/webp';
        else effectiveMimeType = 'image/jpeg';
      }
    }

    if (effectiveMimeType === 'image/jpg' || effectiveMimeType === 'image/pjpeg' || effectiveMimeType === 'image/jfif') {
      effectiveMimeType = 'image/jpeg';
    } else if (effectiveMimeType === 'image/x-png') {
      effectiveMimeType = 'image/png';
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowedMimeTypes.includes(effectiveMimeType)) {
      throw new AppError(
        'INVALID_IMAGE_FORMAT',
        `Unsupported image format: ${mimeType}. Please upload JPEG, PNG, or WebP.`,
        400
      );
    }

    if (imageBuffer.length > 15 * 1024 * 1024) {
      throw new AppError('IMAGE_TOO_LARGE', 'Image size exceeds maximum limit of 15MB.', 400);
    }

    // 2. Create Scan record
    const scan = await this.repository.createScan({
      category,
      rulesetVersion,
      offlineClientId,
    });
    const scanId = scan.id;

    Logger.info('Initiated CompliScan processing', { scanId, category, filename });

    try {
      // 3. Save original image to storage
      await this.repository.updateScanStatus(scanId, 'VALIDATING');
      const originalAsset = await this.storage.save(imageBuffer, filename, mimeType);

      // 4. Image Quality Check
      const quality = await this.qualityService.assessQuality(imageBuffer);
      Logger.info('Assessed image quality', {
        scanId,
        score: quality.score,
        warning: quality.warning,
      });

      // 5. Preprocessing
      await this.repository.updateScanStatus(scanId, 'PREPROCESSING');
      const preprocessed = await this.preprocessor.preprocessImage(imageBuffer);
      const processedAsset = await this.storage.save(
        preprocessed.processedBuffer,
        `processed_${filename}`,
        'image/png'
      );

      // Save asset metadata to repository
      await this.repository.saveAsset(scanId, {
        id: originalAsset.hash,
        scanId,
        originalUrl: originalAsset.url,
        processedUrl: processedAsset.url,
        mimeType,
        fileSize: originalAsset.fileSize,
        width: quality.width,
        height: quality.height,
        qualityScore: quality.score,
        qualityWarning: quality.warning,
        hash: originalAsset.hash,
        createdAt: new Date().toISOString(),
      });

      // Save additional image assets if provided (up to 2 extra, max 3 total)
      if (options.additionalImages && options.additionalImages.length > 0) {
        for (let i = 0; i < Math.min(2, options.additionalImages.length); i++) {
          const extra = options.additionalImages[i];
          try {
            const extraAsset = await this.storage.save(
              extra.buffer,
              extra.filename || `panel_${i + 2}_${filename}`,
              extra.mimeType || 'image/jpeg'
            );
            await this.repository.saveAsset(scanId, {
              id: extraAsset.hash,
              scanId,
              originalUrl: extraAsset.url,
              mimeType: extra.mimeType || 'image/jpeg',
              fileSize: extraAsset.fileSize,
              hash: extraAsset.hash,
              createdAt: new Date().toISOString(),
            });
          } catch (extraAssetErr) {
            Logger.warn('Non-fatal: failed to store additional image asset', { scanId, error: String(extraAssetErr) });
          }
        }
      }

      // 6. OCR Perception
      await this.repository.updateScanStatus(scanId, 'OCR_PROCESSING');
      const ocrStartTime = Date.now();
      const determinedScenarioId =
        options.scenarioId ||
        Object.keys({
          COMPLIANT_COMMODITY: 1,
          MISSING_MRP: 1,
          MISSING_NET_QUANTITY: 1,
          MISSING_MANUFACTURER: 1,
          MISSING_COUNTRY_OF_ORIGIN: 1,
          MISSING_CONSUMER_CARE: 1,
          INVALID_UNIT_SYMBOL: 1,
          POOR_OCR_CORRUPTED: 1,
          AMBIGUOUS_DECLARATION: 1,
          FOOD_PRODUCT_WITH_EXPIRY: 1,
        }).find((s) => filename.toUpperCase().includes(s));

      let ocrResult;
      try {
        ocrResult = await this.ocr.extractText(
          preprocessed.processedBuffer,
          'image/png',
          { scenarioId: determinedScenarioId }
        );
      } catch (ocrErr) {
        Logger.warn('OCR extraction failed', { scanId, error: String(ocrErr) });
        throw ocrErr;
      }

      // If additional packaging images are present, run OCR perception on them and merge transcripts
      if (options.additionalImages && options.additionalImages.length > 0) {
        for (let i = 0; i < Math.min(2, options.additionalImages.length); i++) {
          const extra = options.additionalImages[i];
          try {
            const extraPreprocessed = await this.preprocessor.preprocessImage(extra.buffer);
            const extraOcr = await this.ocr.extractText(
              extraPreprocessed.processedBuffer,
              'image/png'
            );
            if (extraOcr && extraOcr.fullText) {
              const panelLabel = extra.label || (i === 0 ? 'BACK / INFO PANEL' : 'SIDE / MRP & DATES PANEL');
              ocrResult.fullText = `${ocrResult.fullText}\n\n=== [${panelLabel}] ===\n${extraOcr.fullText}`;
              if (extraOcr.blocks && extraOcr.blocks.length > 0) {
                ocrResult.blocks = [
                  ...ocrResult.blocks,
                  ...extraOcr.blocks,
                ];
              }
            }
          } catch (extraOcrErr) {
            Logger.warn('Non-fatal additional image OCR failed', { scanId, error: String(extraOcrErr) });
          }
        }
      }

      ocrResult.durationMs = Date.now() - ocrStartTime;
      await this.repository.saveOCRResult(scanId, ocrResult);

      Logger.info('Completed OCR extraction', {
        scanId,
        confidence: ocrResult.confidence,
        provider: ocrResult.provider,
        durationMs: ocrResult.durationMs,
        totalPanels: 1 + (options.additionalImages?.length || 0),
      });

      // 7. Declaration Extraction (Deterministic Normalizers + AI across all panels)
      // All up to 3 image buffers are provided to the AI for holistic multimodal extraction
      await this.repository.updateScanStatus(scanId, 'EXTRACTING');
      const extraction = await this.extractionService.extractDeclarations(
        ocrResult,
        category,
        imageBuffer,
        mimeType,
        options.additionalImages
      );
      await this.repository.saveExtraction(scanId, extraction);

      // 7.5 AI Text Size & Font Height Inspection per LMPC Rule 10 & Schedule I
      let textSizeResult;
      try {
        textSizeResult = await this.textSizeService.inspectTextSize({
          imageBuffer,
          mimeType,
          ocrResult,
          product: extraction,
          measurementData: options.measurementData,
          category,
        });
      } catch (tsErr) {
        Logger.warn('Text size inspection non-fatal error:', { scanId, error: String(tsErr) });
      }

      // 8. Deterministic Compliance Rule Engine
      await this.repository.updateScanStatus(scanId, 'VALIDATING_COMPLIANCE');
      const compliance = this.complianceEngine.evaluate({
        scanId,
        product: extraction,
        category,
        rulesetVersion,
        ocrResult,
        imageQualityScore: quality.score,
        measurementData: options.measurementData,
        textSizeResult,
      });

      if (textSizeResult?.approximation) {
        (compliance as any).pdpApproximation = textSizeResult.approximation;
      }

      await this.repository.saveComplianceEvaluation(
        scanId,
        compliance,
        compliance.overallStatus
      );

      // 9. Retrieve updated scan detail and generate report
      const updatedScan = await this.repository.getScanById(scanId);
      if (!updatedScan) {
        throw new Error(`Failed to retrieve finalized scan: ${scanId}`);
      }

      const report = ReportService.generateReport(updatedScan, locale);
      if (textSizeResult?.approximation) {
        report.pdpApproximation = textSizeResult.approximation;
      }

      // Persist dynamic scan record to Firebase Realtime Database
      try {
        const { FirebaseService } = await import('../firebase/firebase.service');
        const formattedDate = new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const detectedName =
          report.productInformation?.productName ||
          extraction.productName?.value ||
          extraction.genericName?.value ||
          filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') ||
          'Packaged Commodity';

        const detectedMfg =
          report.productInformation?.manufacturerOrPacker ||
          extraction.manufacturer?.value?.name ||
          extraction.packer?.value?.name ||
          extraction.importer?.value?.name ||
          'Verified Manufacturer';

        const detectedAddress =
          extraction.manufacturer?.value?.address ||
          extraction.packer?.value?.address ||
          extraction.importer?.value?.address ||
          'Registered Industrial Premises, India';

        const detectedNetQty = extraction.netQuantity?.value
          ? `${extraction.netQuantity.value.value} ${extraction.netQuantity.value.unit || ''}`.trim()
          : extraction.netQuantity?.rawText || 'Standard Pack';

        const detectedMrp = extraction.mrp?.value?.amount !== undefined
          ? `₹ ${extraction.mrp.value.amount.toFixed(2)}${extraction.mrp.value.isTaxInclusive ? ' (incl. of all taxes)' : ''}`
          : extraction.mrp?.rawText || 'Declared';

        const detectedDate =
          extraction.manufactureDate?.value?.rawText ||
          (extraction.manufactureDate?.value?.month && extraction.manufactureDate?.value?.year
            ? `${String(extraction.manufactureDate.value.month).padStart(2, '0')}/${extraction.manufactureDate.value.year}`
            : extraction.packingDate?.value?.rawText || 'Recent');

        const detectedBestBefore =
          extraction.bestBefore?.value || extraction.expiryDate?.value?.rawText || 'Within shelf life';

        const detectedOrigin = extraction.countryOfOrigin?.value || 'India';
        const detectedBatch = extraction.batchNumber?.value || `B-${Date.now().toString().slice(-4)}`;

        const consumerCarePhone = extraction.consumerCare?.value?.phone;
        const consumerCareEmail = extraction.consumerCare?.value?.email;
        const consumerCareAddr = extraction.consumerCare?.value?.address;
        const detectedConsumerCare =
          [consumerCarePhone, consumerCareEmail].filter(Boolean).join(' / ') ||
          consumerCareAddr ||
          '1800-11-4000 / consumer@gov.in';

        if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
          await FirebaseService.saveScan({
          id: updatedScan.id,
          scanIdNumber: `#CS${Date.now().toString().slice(-8)}`,
          productName: detectedName,
          manufacturer: detectedMfg,
          scannedAt: formattedDate,
          timestamp: Date.now(),
          userId: options.userId,
          userEmail: options.userEmail,
          status:
            report.overallStatus === 'COMPLIANT'
              ? 'COMPLIANT'
              : report.overallStatus === 'NON_COMPLIANT'
              ? 'NON_COMPLIANT'
              : 'NEEDS_REVIEW',
          statusLabel:
            report.overallStatus === 'COMPLIANT'
              ? 'Compliant'
              : report.overallStatus === 'NON_COMPLIANT'
              ? 'Non-Compliant'
              : 'Needs Review',
          explanation: report.statusExplanation || 'Compliance evaluation completed successfully.',
          summary: {
            passed: report.findings.passed.length,
            failed: report.findings.violations.length,
            warning: report.findings.warnings.length,
            notApplicable: report.findings.notApplicable.length,
          },
          extractedInfo: {
            productName: detectedName,
            manufacturer: detectedMfg,
            consumerCare: detectedConsumerCare,
            netQuantity: detectedNetQty,
            mfgDate: detectedDate,
            address: detectedAddress,
            mrp: detectedMrp,
            bestBefore: detectedBestBefore,
            countryOfOrigin: detectedOrigin,
            batchNo: detectedBatch,
          },
          ruleChecks: [
            ...(report.findings.violations || []).map((v, idx) => ({
              id: `v-${idx}`,
              ruleName: v.name || 'Mandatory declaration violation',
              status: 'NON_COMPLIANT' as const,
              statusLabel: 'Non-Compliant',
              legalSection: v.legalReference,
              detail: v.localizedExplanation || v.message,
            })),
            ...(report.findings.warnings || []).map((w, idx) => ({
              id: `w-${idx}`,
              ruleName: w.name || 'Declaration warning',
              status: 'WARNING' as const,
              statusLabel: 'Warning',
              legalSection: w.legalReference,
              detail: w.localizedExplanation || w.message,
            })),
            ...(report.findings.passed || []).map((p, idx) => ({
              id: `p-${idx}`,
              ruleName: p.name || 'Verified declaration',
              status: 'COMPLIANT' as const,
              statusLabel: 'Compliant',
              legalSection: p.legalReference,
            })),
          ],
            ocrText: ocrResult.fullText,
            imageUrl: originalAsset.url,
          });
        }
      } catch (fbErr) {
        console.warn('Firebase scan persistence note:', fbErr);
      }

      Logger.info('CompliScan completed successfully', {
        scanId,
        overallStatus: compliance.overallStatus,
        durationMs: Date.now() - startTime,
      });

      return { scan: updatedScan, report };
    } catch (err: any) {
      Logger.error('CompliScan processing failed', err, { scanId });
      await this.repository.updateScanStatus(scanId, 'FAILED', err.message);
      throw err;
    }
  }
}
