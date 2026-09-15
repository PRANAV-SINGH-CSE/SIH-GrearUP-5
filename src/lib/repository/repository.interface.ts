import { ScanDetail, ScanStatus, UploadedAssetMetadata, CreateScanInput } from '../types/scan';
import { OCRResult } from '../types/ocr';
import { ProductDeclaration } from '../types/extraction';
import { ComplianceEvaluationResult, ComplianceOverallStatus } from '../types/compliance';

export interface IScanRepository {
  createScan(input: CreateScanInput): Promise<ScanDetail>;
  getScanById(id: string): Promise<ScanDetail | null>;
  findScanByImageHash(hash: string): Promise<ScanDetail | null>;
  findScanByOfflineClientId(offlineClientId: string): Promise<ScanDetail | null>;
  listScans(limit?: number, offset?: number): Promise<ScanDetail[]>;
  updateScanStatus(id: string, status: ScanStatus, errorMessage?: string): Promise<void>;
  saveAsset(scanId: string, asset: UploadedAssetMetadata): Promise<void>;
  saveOCRResult(scanId: string, result: OCRResult): Promise<void>;
  saveExtraction(scanId: string, extraction: ProductDeclaration): Promise<void>;
  saveComplianceEvaluation(
    scanId: string,
    evaluation: ComplianceEvaluationResult,
    overallStatus: ComplianceOverallStatus
  ): Promise<void>;
  deleteScan(id: string): Promise<boolean>;
}
