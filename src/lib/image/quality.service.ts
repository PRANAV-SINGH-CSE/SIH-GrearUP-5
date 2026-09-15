import sharp from 'sharp';

export interface ImageQualityReport {
  width: number;
  height: number;
  isAcceptable: boolean;
  score: number; // 0.0 to 1.0
  warning?: string;
  details: {
    resolutionOk: boolean;
    contrastOk: boolean;
    aspectRatio: number;
    estimatedDpi?: number;
  };
}

export class ImageQualityService {
  /**
   * Assesses label image quality prior to OCR.
   * Checks resolution, aspect ratio, and contrast distribution.
   */
  async assessQuality(buffer: Buffer): Promise<ImageQualityReport> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;

      if (width === 0 || height === 0) {
        return {
          width,
          height,
          isAcceptable: false,
          score: 0,
          warning: 'Invalid image dimensions.',
          details: { resolutionOk: false, contrastOk: false, aspectRatio: 0 },
        };
      }

      const aspectRatio = width / height;
      const totalPixels = width * height;

      // 1. Resolution score (target at least 600x600 for reliable label OCR)
      const resolutionOk = width >= 400 && height >= 400;
      let resolutionScore = 1.0;
      if (totalPixels < 200 * 200) {
        resolutionScore = 0.2;
      } else if (totalPixels < 400 * 400) {
        resolutionScore = 0.5;
      } else if (totalPixels < 600 * 600) {
        resolutionScore = 0.8;
      }

      // 2. Contrast check using stats
      const stats = await image.stats();
      let contrastOk = true;
      let contrastScore = 1.0;

      // Check standard deviation across channels as proxy for dynamic range
      const channelStdevs = stats.channels.map((c) => c.stdev);
      const avgStdev = channelStdevs.reduce((a, b) => a + b, 0) / channelStdevs.length;

      if (avgStdev < 20) {
        // Very low contrast / washed out image
        contrastOk = false;
        contrastScore = 0.3;
      } else if (avgStdev < 35) {
        contrastScore = 0.7;
      }

      // 3. Composite score
      const compositeScore = Number((resolutionScore * 0.6 + contrastScore * 0.4).toFixed(2));
      const isAcceptable = compositeScore >= 0.5;

      let warning: string | undefined;
      if (compositeScore < 0.5) {
        warning = 'LOW_IMAGE_QUALITY: The image resolution or contrast is low, which may lead to unverified declarations.';
      } else if (!resolutionOk) {
        warning = 'Resolution is below recommended 600x600 px; some small text declarations may be missed.';
      } else if (!contrastOk) {
        warning = 'Low image contrast detected; OCR accuracy may be degraded.';
      }

      return {
        width,
        height,
        isAcceptable,
        score: compositeScore,
        warning,
        details: {
          resolutionOk,
          contrastOk,
          aspectRatio: Number(aspectRatio.toFixed(2)),
          estimatedDpi: metadata.density,
        },
      };
    } catch (err: any) {
      return {
        width: 0,
        height: 0,
        isAcceptable: false,
        score: 0,
        warning: `Image quality analysis failed: ${err.message}`,
        details: { resolutionOk: false, contrastOk: false, aspectRatio: 0 },
      };
    }
  }
}
