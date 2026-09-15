import { CompliScanPipeline } from './pipeline.service';
import { getScanRepository } from '../repository/repository.factory';
import { getStorageProvider } from '../storage/storage.factory';
import { getOCRProvider } from '../ocr/ocr.factory';
import { ExtractionService } from '../extraction/extraction.service';

export function getCompliScanPipeline(): CompliScanPipeline {
  const repository = getScanRepository();
  const storage = getStorageProvider();
  const ocr = getOCRProvider();
  const extractionService = new ExtractionService();

  return new CompliScanPipeline(repository, storage, ocr, extractionService);
}
