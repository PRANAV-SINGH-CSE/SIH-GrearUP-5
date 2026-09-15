import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { IStorageProvider, StoredAssetResult } from './storage.interface';

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(process.cwd(), 'public', 'uploads');
  }

  private async ensureDir(): Promise<void> {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch {
      // Ignore if exists
    }
  }

  async save(buffer: Buffer, filename: string, _mimeType: string): Promise<StoredAssetResult> {
    await this.ensureDir();
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const ext = path.extname(filename) || '.jpg';
    const uniqueFilename = `${Date.now()}-${hash.substring(0, 12)}${ext}`;
    const filePath = path.join(this.baseDir, uniqueFilename);

    await fs.writeFile(filePath, buffer);

    return {
      url: `/uploads/${uniqueFilename}`,
      path: filePath,
      hash,
      fileSize: buffer.length,
    };
  }

  async get(urlOrPath: string): Promise<Buffer> {
    const filePath = urlOrPath.startsWith('/uploads/')
      ? path.join(this.baseDir, path.basename(urlOrPath))
      : urlOrPath;
    return fs.readFile(filePath);
  }

  async delete(urlOrPath: string): Promise<boolean> {
    try {
      const filePath = urlOrPath.startsWith('/uploads/')
        ? path.join(this.baseDir, path.basename(urlOrPath))
        : urlOrPath;
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
