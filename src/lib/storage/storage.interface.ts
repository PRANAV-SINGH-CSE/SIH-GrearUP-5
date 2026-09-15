export interface StoredAssetResult {
  url: string;
  path: string;
  hash: string;
  fileSize: number;
}

export interface IStorageProvider {
  save(buffer: Buffer, filename: string, mimeType: string): Promise<StoredAssetResult>;
  get(urlOrPath: string): Promise<Buffer>;
  delete(urlOrPath: string): Promise<boolean>;
}
