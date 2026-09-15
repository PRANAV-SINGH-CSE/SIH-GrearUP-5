import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { IStorageProvider, StoredAssetResult } from './storage.interface';

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;
  private inMemoryFiles = new Map<string, Buffer>();

  constructor(baseDir?: string) {
    if (baseDir) {
      this.baseDir = baseDir;
    } else if (
      process.env.VERCEL ||
      process.env.VERCEL_ENV ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT ||
      process.env.NODE_ENV === 'production'
    ) {
      // In serverless environments (Vercel, AWS Lambda), the deployment root is read-only.
      // os.tmpdir() (/tmp) is the only writable filesystem directory.
      this.baseDir = path.join(os.tmpdir(), 'compliscan-uploads');
    } else {
      this.baseDir = path.join(process.cwd(), 'public', 'uploads');
    }
  }

  private async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch {
      // Ignore if exists or read-only
    }
  }

  async save(buffer: Buffer, filename: string, _mimeType: string): Promise<StoredAssetResult> {
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const ext = path.extname(filename) || '.jpg';
    const uniqueFilename = `${Date.now()}-${hash.substring(0, 12)}${ext}`;

    // Keep an in-memory copy for immediate retrieval across pipeline steps
    this.inMemoryFiles.set(uniqueFilename, buffer);
    if (this.inMemoryFiles.size > 100) {
      const oldestKey = this.inMemoryFiles.keys().next().value;
      if (oldestKey) this.inMemoryFiles.delete(oldestKey);
    }

    let savedPath = path.join(this.baseDir, uniqueFilename);

    try {
      await this.ensureDir(this.baseDir);
      await fs.writeFile(savedPath, buffer);
    } catch {
      // If primary directory fails (e.g. read-only filesystem on Vercel), fallback to OS temp dir
      try {
        const tmpDir = path.join(os.tmpdir(), 'compliscan-uploads');
        await this.ensureDir(tmpDir);
        savedPath = path.join(tmpDir, uniqueFilename);
        await fs.writeFile(savedPath, buffer);
      } catch {
        // Ephemeral / strictly read-only: safely proceed with in-memory buffer without throwing
        savedPath = `memory://${uniqueFilename}`;
      }
    }

    return {
      url: `/uploads/${uniqueFilename}`,
      path: savedPath,
      hash,
      fileSize: buffer.length,
    };
  }

  async get(urlOrPath: string): Promise<Buffer> {
    const filename = path.basename(urlOrPath);
    if (this.inMemoryFiles.has(filename)) {
      return this.inMemoryFiles.get(filename)!;
    }

    try {
      const filePath = urlOrPath.startsWith('/uploads/')
        ? path.join(this.baseDir, filename)
        : urlOrPath;
      return await fs.readFile(filePath);
    } catch {
      // Try /tmp fallback
      try {
        const tmpPath = path.join(os.tmpdir(), 'compliscan-uploads', filename);
        return await fs.readFile(tmpPath);
      } catch {
        // Graceful fallback for serverless cold-starts
        return Buffer.from([]);
      }
    }
  }

  async delete(urlOrPath: string): Promise<boolean> {
    const filename = path.basename(urlOrPath);
    this.inMemoryFiles.delete(filename);
    try {
      const filePath = urlOrPath.startsWith('/uploads/')
        ? path.join(this.baseDir, filename)
        : urlOrPath;
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
