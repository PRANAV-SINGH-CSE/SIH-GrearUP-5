import { PrismaClient, ScanStatus as PrismaScanStatus, ComplianceOverallStatus as PrismaOverallStatus, RuleStatus as PrismaRuleStatus, RuleSeverity as PrismaRuleSeverity } from '@prisma/client';
import { IScanRepository } from './repository.interface';
import { ScanDetail, ScanStatus, UploadedAssetMetadata, CreateScanInput } from '../types/scan';
import { OCRResult } from '../types/ocr';
import { ProductDeclaration } from '../types/extraction';
import { ComplianceEvaluationResult, ComplianceOverallStatus, RuleEvaluation } from '../types/compliance';

export class PrismaScanRepository implements IScanRepository {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  async createScan(input: CreateScanInput): Promise<ScanDetail> {
    const record = await this.prisma.scan.create({
      data: {
        category: input.category || 'GENERIC_PACKAGED_COMMODITY',
        rulesetVersion: input.rulesetVersion || 'LMPC-2011.v2026',
        offlineClientId: input.offlineClientId,
        isOfflineSync: !!input.offlineClientId,
        status: PrismaScanStatus.UPLOADED,
      },
    });

    return {
      id: record.id,
      userId: record.userId ?? undefined,
      status: record.status as ScanStatus,
      category: record.category,
      overallStatus: (record.overallStatus as ComplianceOverallStatus) ?? undefined,
      rulesetVersion: record.rulesetVersion,
      offlineClientId: record.offlineClientId ?? undefined,
      isOfflineSync: record.isOfflineSync,
      errorMessage: record.errorMessage ?? undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  async getScanById(id: string): Promise<ScanDetail | null> {
    const record = await this.prisma.scan.findUnique({
      where: { id },
      include: {
        asset: true,
        ocrResult: true,
        extraction: true,
        evaluation: {
          include: {
            violations: true,
          },
        },
      },
    });

    if (!record) return null;

    let asset: UploadedAssetMetadata | undefined;
    if (record.asset) {
      asset = {
        id: record.asset.id,
        scanId: record.asset.scanId,
        originalUrl: record.asset.originalUrl,
        processedUrl: record.asset.processedUrl ?? undefined,
        mimeType: record.asset.mimeType,
        fileSize: record.asset.fileSize,
        width: record.asset.width ?? undefined,
        height: record.asset.height ?? undefined,
        qualityScore: record.asset.qualityScore ?? undefined,
        qualityWarning: record.asset.qualityWarning ?? undefined,
        hash: record.asset.hash,
        createdAt: record.asset.createdAt.toISOString(),
      };
    }

    let ocrResult: OCRResult | undefined;
    if (record.ocrResult) {
      ocrResult = {
        fullText: record.ocrResult.fullText,
        confidence: record.ocrResult.confidence,
        detectedLanguage: record.ocrResult.detectedLanguage ?? 'en',
        blocks: JSON.parse(record.ocrResult.blocksJson || '[]'),
        provider: record.ocrResult.provider,
        durationMs: record.ocrResult.durationMs ?? undefined,
      };
    }

    let extraction: ProductDeclaration | undefined;
    if (record.extraction) {
      extraction = {
        productName: { value: record.extraction.productName, confidence: record.extraction.confidence, extractionMethod: record.extraction.extractionMethod as any },
        genericName: { value: record.extraction.genericName, confidence: record.extraction.confidence, extractionMethod: record.extraction.extractionMethod as any },
        manufacturer: { value: record.extraction.manufacturer ? { name: record.extraction.manufacturer } : null, confidence: record.extraction.confidence, extractionMethod: record.extraction.extractionMethod as any },
        packer: { value: record.extraction.packer ? { name: record.extraction.packer } : null, confidence: record.extraction.confidence, extractionMethod: record.extraction.extractionMethod as any },
        importer: { value: record.extraction.importer ? { name: record.extraction.importer } : null, confidence: record.extraction.confidence, extractionMethod: record.extraction.extractionMethod as any },
        netQuantity: record.extraction.netQuantityJson ? JSON.parse(record.extraction.netQuantityJson) : { value: null, confidence: 0, extractionMethod: 'deterministic' },
        mrp: record.extraction.mrpJson ? JSON.parse(record.extraction.mrpJson) : { value: null, confidence: 0, extractionMethod: 'deterministic' },
        unitSalePrice: record.extraction.unitSalePriceJson ? JSON.parse(record.extraction.unitSalePriceJson) : { value: null, confidence: 0, extractionMethod: 'deterministic' },
        countryOfOrigin: { value: record.extraction.countryOfOrigin, confidence: record.extraction.confidence, extractionMethod: record.extraction.extractionMethod as any },
        manufactureDate: record.extraction.manufactureDate ? { value: { rawText: record.extraction.manufactureDate, isAmbiguous: false }, confidence: record.extraction.confidence, extractionMethod: record.extraction.extractionMethod as any } : { value: null, confidence: 0, extractionMethod: 'deterministic' },
        packingDate: record.extraction.packingDate ? { value: { rawText: record.extraction.packingDate, isAmbiguous: false }, confidence: record.extraction.confidence, extractionMethod: record.extraction.extractionMethod as any } : { value: null, confidence: 0, extractionMethod: 'deterministic' },
        bestBefore: { value: record.extraction.bestBefore, confidence: record.extraction.confidence, extractionMethod: record.extraction.extractionMethod as any },
        expiryDate: record.extraction.expiryDate ? { value: { rawText: record.extraction.expiryDate, isAmbiguous: false }, confidence: record.extraction.confidence, extractionMethod: record.extraction.extractionMethod as any } : { value: null, confidence: 0, extractionMethod: 'deterministic' },
        consumerCare: record.extraction.consumerCareJson ? JSON.parse(record.extraction.consumerCareJson) : { value: null, confidence: 0, extractionMethod: 'deterministic' },
        batchNumber: { value: record.extraction.batchNumber, confidence: record.extraction.confidence, extractionMethod: record.extraction.extractionMethod as any },
        rawFields: JSON.parse(record.extraction.rawFieldsJson || '{}'),
        overallConfidence: record.extraction.confidence,
        extractionMethod: record.extraction.extractionMethod as any,
      };
    }

    let compliance: ComplianceEvaluationResult | undefined;
    if (record.evaluation) {
      const violations: RuleEvaluation[] = [];
      const warnings: RuleEvaluation[] = [];
      const passedChecks: RuleEvaluation[] = [];
      const unverifiableChecks: RuleEvaluation[] = [];
      const notApplicableChecks: RuleEvaluation[] = [];

      for (const v of record.evaluation.violations) {
        const item: RuleEvaluation = {
          ruleId: v.ruleId,
          name: v.ruleId,
          status: v.status as any,
          severity: v.severity as any,
          message: v.message,
          field: v.field ?? undefined,
          extractedValue: v.extractedValue ?? undefined,
          evidenceText: v.evidenceText ?? undefined,
          boundingBox: v.boundingBoxJson ? JSON.parse(v.boundingBoxJson) : undefined,
          confidence: v.confidence ?? undefined,
          humanVerificationRequired: false,
          legalReference: '',
          errorCode: v.ruleId,
          explanationKey: v.ruleId,
        };

        if (v.status === 'FAIL') violations.push(item);
        else if (v.status === 'WARNING') warnings.push(item);
        else if (v.status === 'PASS') passedChecks.push(item);
        else if (v.status === 'UNVERIFIABLE') unverifiableChecks.push(item);
        else if (v.status === 'NOT_APPLICABLE') notApplicableChecks.push(item);
      }

      compliance = {
        scanId: record.id,
        rulesetVersion: record.evaluation.rulesetVersion,
        category: record.category,
        overallStatus: record.evaluation.overallStatus as any,
        passedChecks,
        violations,
        warnings,
        unverifiableChecks,
        notApplicableChecks,
        counts: {
          total: record.evaluation.violations.length,
          passed: record.evaluation.passedCount,
          failed: record.evaluation.failedCount,
          warning: record.evaluation.warningCount,
          unverifiable: record.evaluation.unverifiableCount,
          notApplicable: record.evaluation.notApplicableCount,
        },
        evaluatedAt: record.evaluation.evaluatedAt.toISOString(),
      };
    }

    return {
      id: record.id,
      userId: record.userId ?? undefined,
      status: record.status as ScanStatus,
      category: record.category,
      overallStatus: (record.overallStatus as ComplianceOverallStatus) ?? undefined,
      rulesetVersion: record.rulesetVersion,
      imageHash: record.imageHash ?? undefined,
      offlineClientId: record.offlineClientId ?? undefined,
      isOfflineSync: record.isOfflineSync,
      errorMessage: record.errorMessage ?? undefined,
      asset,
      ocrResult,
      extraction,
      compliance,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  async findScanByImageHash(hash: string): Promise<ScanDetail | null> {
    const record = await this.prisma.scan.findFirst({
      where: { imageHash: hash },
    });
    if (!record) return null;
    return this.getScanById(record.id);
  }

  async findScanByOfflineClientId(offlineClientId: string): Promise<ScanDetail | null> {
    const record = await this.prisma.scan.findFirst({
      where: { offlineClientId },
    });
    if (!record) return null;
    return this.getScanById(record.id);
  }

  async listScans(limit = 50, offset = 0): Promise<ScanDetail[]> {
    const records = await this.prisma.scan.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    const results: ScanDetail[] = [];
    for (const r of records) {
      const scan = await this.getScanById(r.id);
      if (scan) results.push(scan);
    }
    return results;
  }

  async updateScanStatus(id: string, status: ScanStatus, errorMessage?: string): Promise<void> {
    await this.prisma.scan.update({
      where: { id },
      data: {
        status: status as PrismaScanStatus,
        errorMessage,
      },
    });
  }

  async saveAsset(scanId: string, asset: UploadedAssetMetadata): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.uploadedAsset.upsert({
        where: { scanId },
        create: {
          scanId,
          originalUrl: asset.originalUrl,
          processedUrl: asset.processedUrl,
          mimeType: asset.mimeType,
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height,
          qualityScore: asset.qualityScore,
          qualityWarning: asset.qualityWarning,
          hash: asset.hash,
        },
        update: {
          processedUrl: asset.processedUrl,
          qualityScore: asset.qualityScore,
          qualityWarning: asset.qualityWarning,
        },
      }),
      this.prisma.scan.update({
        where: { id: scanId },
        data: { imageHash: asset.hash },
      }),
    ]);
  }

  async saveOCRResult(scanId: string, result: OCRResult): Promise<void> {
    await this.prisma.oCRResultRecord.upsert({
      where: { scanId },
      create: {
        scanId,
        fullText: result.fullText,
        confidence: result.confidence,
        detectedLanguage: result.detectedLanguage,
        blocksJson: JSON.stringify(result.blocks),
        provider: result.provider,
        durationMs: result.durationMs,
      },
      update: {
        fullText: result.fullText,
        confidence: result.confidence,
        detectedLanguage: result.detectedLanguage,
        blocksJson: JSON.stringify(result.blocks),
        provider: result.provider,
        durationMs: result.durationMs,
      },
    });
  }

  async saveExtraction(scanId: string, extraction: ProductDeclaration): Promise<void> {
    await this.prisma.extractedDeclarationRecord.upsert({
      where: { scanId },
      create: {
        scanId,
        productName: extraction.productName.value,
        genericName: extraction.genericName.value,
        manufacturer: extraction.manufacturer.value?.name,
        packer: extraction.packer.value?.name,
        importer: extraction.importer.value?.name,
        countryOfOrigin: extraction.countryOfOrigin.value,
        manufactureDate: extraction.manufactureDate.value?.rawText,
        packingDate: extraction.packingDate.value?.rawText,
        bestBefore: extraction.bestBefore.value,
        expiryDate: extraction.expiryDate.value?.rawText,
        batchNumber: extraction.batchNumber.value,
        netQuantityJson: JSON.stringify(extraction.netQuantity),
        mrpJson: JSON.stringify(extraction.mrp),
        unitSalePriceJson: JSON.stringify(extraction.unitSalePrice),
        consumerCareJson: JSON.stringify(extraction.consumerCare),
        rawFieldsJson: JSON.stringify(extraction.rawFields),
        confidence: extraction.overallConfidence,
        extractionMethod: extraction.extractionMethod,
      },
      update: {
        productName: extraction.productName.value,
        genericName: extraction.genericName.value,
        manufacturer: extraction.manufacturer.value?.name,
        packer: extraction.packer.value?.name,
        importer: extraction.importer.value?.name,
        countryOfOrigin: extraction.countryOfOrigin.value,
        manufactureDate: extraction.manufactureDate.value?.rawText,
        packingDate: extraction.packingDate.value?.rawText,
        bestBefore: extraction.bestBefore.value,
        expiryDate: extraction.expiryDate.value?.rawText,
        batchNumber: extraction.batchNumber.value,
        netQuantityJson: JSON.stringify(extraction.netQuantity),
        mrpJson: JSON.stringify(extraction.mrp),
        unitSalePriceJson: JSON.stringify(extraction.unitSalePrice),
        consumerCareJson: JSON.stringify(extraction.consumerCare),
        rawFieldsJson: JSON.stringify(extraction.rawFields),
        confidence: extraction.overallConfidence,
        extractionMethod: extraction.extractionMethod,
      },
    });
  }

  async saveComplianceEvaluation(
    scanId: string,
    evaluation: ComplianceEvaluationResult,
    overallStatus: ComplianceOverallStatus
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Upsert evaluation record
      const evalRecord = await tx.complianceEvaluationRecord.upsert({
        where: { scanId },
        create: {
          scanId,
          rulesetVersion: evaluation.rulesetVersion,
          overallStatus: overallStatus as PrismaOverallStatus,
          passedCount: evaluation.counts.passed,
          failedCount: evaluation.counts.failed,
          warningCount: evaluation.counts.warning,
          unverifiableCount: evaluation.counts.unverifiable,
          notApplicableCount: evaluation.counts.notApplicable,
        },
        update: {
          rulesetVersion: evaluation.rulesetVersion,
          overallStatus: overallStatus as PrismaOverallStatus,
          passedCount: evaluation.counts.passed,
          failedCount: evaluation.counts.failed,
          warningCount: evaluation.counts.warning,
          unverifiableCount: evaluation.counts.unverifiable,
          notApplicableCount: evaluation.counts.notApplicable,
        },
      });

      // Clear previous violations
      await tx.complianceViolationRecord.deleteMany({
        where: { evaluationId: evalRecord.id },
      });

      // Insert all evaluations as records
      const allRules = [
        ...evaluation.violations,
        ...evaluation.warnings,
        ...evaluation.passedChecks,
        ...evaluation.unverifiableChecks,
        ...evaluation.notApplicableChecks,
      ];

      for (const item of allRules) {
        await tx.complianceViolationRecord.create({
          data: {
            evaluationId: evalRecord.id,
            ruleId: item.ruleId,
            severity: item.severity as PrismaRuleSeverity,
            status: item.status as PrismaRuleStatus,
            message: item.message,
            field: item.field,
            extractedValue: item.extractedValue,
            evidenceText: item.evidenceText,
            boundingBoxJson: item.boundingBox ? JSON.stringify(item.boundingBox) : null,
            confidence: item.confidence,
          },
        });
      }

      // Update scan overallStatus and status
      await tx.scan.update({
        where: { id: scanId },
        data: {
          overallStatus: overallStatus as PrismaOverallStatus,
          status: PrismaScanStatus.COMPLETED,
        },
      });
    });
  }

  async deleteScan(id: string): Promise<boolean> {
    try {
      await this.prisma.scan.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
