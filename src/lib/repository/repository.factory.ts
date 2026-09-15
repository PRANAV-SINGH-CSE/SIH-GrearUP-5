import { IScanRepository } from './repository.interface';
import { MemoryScanRepository } from './memory-scan.repository';
import { PrismaScanRepository } from './prisma-scan.repository';

let scanRepositoryInstance: IScanRepository | null = null;

export function getScanRepository(): IScanRepository {
  if (scanRepositoryInstance) {
    return scanRepositoryInstance;
  }

  const provider = process.env.DATABASE_PROVIDER || 'memory';

  if (provider === 'prisma' && process.env.DATABASE_URL) {
    try {
      scanRepositoryInstance = new PrismaScanRepository();
      return scanRepositoryInstance;
    } catch (err) {
      console.warn('Prisma initialization failed, falling back to MemoryScanRepository:', err);
      scanRepositoryInstance = new MemoryScanRepository();
      return scanRepositoryInstance;
    }
  }

  scanRepositoryInstance = new MemoryScanRepository();
  return scanRepositoryInstance;
}

export function resetScanRepository(): void {
  scanRepositoryInstance = null;
}
