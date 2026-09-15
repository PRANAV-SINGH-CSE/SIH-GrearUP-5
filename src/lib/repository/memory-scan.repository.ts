import { v4 as uuidv4 } from 'uuid';
import { IScanRepository } from './repository.interface';
import { ScanDetail, ScanStatus, UploadedAssetMetadata, CreateScanInput } from '../types/scan';
import { OCRResult } from '../types/ocr';
import { ProductDeclaration } from '../types/extraction';
import { ComplianceEvaluationResult, ComplianceOverallStatus } from '../types/compliance';

export class MemoryScanRepository implements IScanRepository {
  private scans: Map<string, ScanDetail> = new Map();

  async createScan(input: CreateScanInput): Promise<ScanDetail> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const scan: ScanDetail = {
      id,
      status: 'UPLOADED',
      category: input.category || 'GENERIC_PACKAGED_COMMODITY',
      rulesetVersion: input.rulesetVersion || 'LMPC-2011.v2026',
      offlineClientId: input.offlineClientId,
      isOfflineSync: !!input.offlineClientId,
      createdAt: now,
      updatedAt: now,
    };
    this.scans.set(id, scan);
    return { ...scan };
  }

  async getScanById(id: string): Promise<ScanDetail | null> {
    const scan = this.scans.get(id);
    return scan ? JSON.parse(JSON.stringify(scan)) : null;
  }

  async findScanByImageHash(hash: string): Promise<ScanDetail | null> {
    for (const scan of this.scans.values()) {
      if (scan.imageHash === hash || scan.asset?.hash === hash) {
        return JSON.parse(JSON.stringify(scan));
      }
    }
    return null;
  }

  async findScanByOfflineClientId(offlineClientId: string): Promise<ScanDetail | null> {
    for (const scan of this.scans.values()) {
      if (scan.offlineClientId === offlineClientId) {
        return JSON.parse(JSON.stringify(scan));
      }
    }
    return null;
  }

  async listScans(limit = 50, offset = 0): Promise<ScanDetail[]> {
    const all = Array.from(this.scans.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
    return JSON.parse(JSON.stringify(all));
  }

  async updateScanStatus(id: string, status: ScanStatus, errorMessage?: string): Promise<void> {
    const scan = this.scans.get(id);
    if (!scan) throw new Error(`Scan not found: ${id}`);
    scan.status = status;
    if (errorMessage !== undefined) scan.errorMessage = errorMessage;
    scan.updatedAt = new Date().toISOString();
  }

  async saveAsset(scanId: string, asset: UploadedAssetMetadata): Promise<void> {
    const scan = this.scans.get(scanId);
    if (!scan) throw new Error(`Scan not found: ${scanId}`);
    scan.asset = asset;
    scan.imageHash = asset.hash;
    scan.updatedAt = new Date().toISOString();
  }

  async saveOCRResult(scanId: string, result: OCRResult): Promise<void> {
    const scan = this.scans.get(scanId);
    if (!scan) throw new Error(`Scan not found: ${scanId}`);
    scan.ocrResult = result;
    scan.updatedAt = new Date().toISOString();
  }

  async saveExtraction(scanId: string, extraction: ProductDeclaration): Promise<void> {
    const scan = this.scans.get(scanId);
    if (!scan) throw new Error(`Scan not found: ${scanId}`);
    scan.extraction = extraction;
    scan.updatedAt = new Date().toISOString();
  }

  async saveComplianceEvaluation(
    scanId: string,
    evaluation: ComplianceEvaluationResult,
    overallStatus: ComplianceOverallStatus
  ): Promise<void> {
    const scan = this.scans.get(scanId);
    if (!scan) throw new Error(`Scan not found: ${scanId}`);
    scan.compliance = evaluation;
    scan.overallStatus = overallStatus;
    scan.status = 'COMPLETED';
    scan.updatedAt = new Date().toISOString();
  }

  async deleteScan(id: string): Promise<boolean> {
    return this.scans.delete(id);
  }

  clear(): void {
    this.scans.clear();
  }
}
