import sharp from 'sharp';

export interface PreprocessingOptions {
  autoRotate?: boolean;
  toGrayscale?: boolean;
  normalizeContrast?: boolean;
  sharpen?: boolean;
  maxDimension?: number;
}

export interface PreprocessedImageResult {
  processedBuffer: Buffer;
  format: string;
  width: number;
  height: number;
  transformations: string[];
}

export class ImagePreprocessorService {
  /**
   * Preprocesses raw uploaded image for optimal OCR and computer vision readability.
   * Does NOT alter the original input buffer.
   */
  async preprocessImage(
    buffer: Buffer,
    options: PreprocessingOptions = {}
  ): Promise<PreprocessedImageResult> {
    const {
      autoRotate = true,
      toGrayscale = true,
      normalizeContrast = true,
      sharpen = true,
      maxDimension = 2400,
    } = options;

    const transformations: string[] = [];

    try {
      let pipeline = sharp(buffer, { failOn: 'none', animated: false });

      // 1. Auto-rotate based on EXIF orientation
      if (autoRotate) {
        pipeline = pipeline.rotate();
        transformations.push('auto_rotate');
      }

      // 2. Fetch metadata to determine resizing
      const metadata = await pipeline.metadata();
      const origWidth = metadata.width || 1000;
      const origHeight = metadata.height || 1000;

      if (origWidth > maxDimension || origHeight > maxDimension) {
        pipeline = pipeline.resize({
          width: origWidth > origHeight ? maxDimension : undefined,
          height: origHeight >= origWidth ? maxDimension : undefined,
          fit: 'inside',
          withoutEnlargement: true,
        });
        transformations.push(`resize_to_max_${maxDimension}`);
      }

      // 3. Grayscale conversion for OCR edge extraction
      if (toGrayscale) {
        pipeline = pipeline.grayscale();
        transformations.push('grayscale');
      }

      // 4. Contrast normalization
      if (normalizeContrast) {
        pipeline = pipeline.normalize();
        transformations.push('normalize_contrast');
      }

      // 5. Sharpening for text edge clarity
      if (sharpen) {
        pipeline = pipeline.sharpen({
          sigma: 1.2,
          m1: 0.5,
          m2: 2.0,
        });
        transformations.push('sharpen');
      }

      // Output as PNG for lossless OCR processing
      const processedBuffer = await pipeline.png().toBuffer();
      const finalMetadata = await sharp(processedBuffer, { failOn: 'none' }).metadata();

      return {
        processedBuffer,
        format: 'png',
        width: finalMetadata.width || 0,
        height: finalMetadata.height || 0,
        transformations,
      };
    } catch (err) {
      console.warn('Image preprocessor fallback to raw buffer:', err);
      return {
        processedBuffer: buffer,
        format: 'original',
        width: 1200,
        height: 1600,
        transformations: ['fallback_unmodified'],
      };
    }
  }
}
