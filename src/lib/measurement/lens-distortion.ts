/**
 * CompliScan — Optional Lens Distortion Correction
 *
 * Applies Brown-Conrady radial distortion correction to points or images.
 * This is a PRE-STEP before homography — homography corrects projective
 * distortion but NOT lens barrel/pincushion distortion.
 *
 * Default: No correction applied. User must provide calibration coefficients.
 */

import type { Point2D, LensDistortionParams } from './measurement.types';

/**
 * Remove radial lens distortion from a set of points.
 *
 * Uses the Brown-Conrady model:
 *   r² = x_n² + y_n²
 *   x_corrected = x_n * (1 + k1*r² + k2*r⁴)
 *   y_corrected = y_n * (1 + k1*r² + k2*r⁴)
 *
 * Where x_n, y_n are normalized coordinates centered on the optical center.
 */
export function undistortPoints(
  points: Point2D[],
  params: LensDistortionParams,
  imageWidth: number,
  imageHeight: number
): Point2D[] {
  const { k1, k2, cx, cy } = params;

  // Optical center in pixel coordinates
  const centerX = cx * imageWidth;
  const centerY = cy * imageHeight;

  // Normalization factor (use the diagonal as the reference distance)
  const normFactor = Math.sqrt(imageWidth * imageWidth + imageHeight * imageHeight) / 2;

  return points.map((p) => {
    // Normalize to [-1, 1] range centered on optical center
    const xn = (p.x - centerX) / normFactor;
    const yn = (p.y - centerY) / normFactor;

    const r2 = xn * xn + yn * yn;
    const r4 = r2 * r2;

    const radialFactor = 1 + k1 * r2 + k2 * r4;

    return {
      x: centerX + xn * radialFactor * normFactor,
      y: centerY + yn * radialFactor * normFactor,
    };
  });
}

/**
 * Apply lens distortion correction to an entire image.
 * This is computationally expensive — only use when lens params are provided.
 *
 * Creates a new ImageData with corrected pixels via inverse mapping.
 */
export function undistortImage(
  imageData: ImageData,
  params: LensDistortionParams
): ImageData {
  const { width, height, data: srcData } = imageData;
  const output = new ImageData(width, height);
  const dstData = output.data;

  const { k1, k2, cx, cy } = params;
  const centerX = cx * width;
  const centerY = cy * height;
  const normFactor = Math.sqrt(width * width + height * height) / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // For each output pixel, find the corresponding source pixel (inverse mapping)
      const xn = (x - centerX) / normFactor;
      const yn = (y - centerY) / normFactor;

      const r2 = xn * xn + yn * yn;
      const r4 = r2 * r2;
      const radialFactor = 1 + k1 * r2 + k2 * r4;

      // Source coordinates (distorted image)
      const srcX = centerX + xn * radialFactor * normFactor;
      const srcY = centerY + yn * radialFactor * normFactor;

      // Bilinear interpolation
      const dstIdx = (y * width + x) * 4;

      if (srcX >= 0 && srcX < width - 1 && srcY >= 0 && srcY < height - 1) {
        const x0 = Math.floor(srcX);
        const y0 = Math.floor(srcY);
        const fx = srcX - x0;
        const fy = srcY - y0;

        const i00 = (y0 * width + x0) * 4;
        const i10 = (y0 * width + x0 + 1) * 4;
        const i01 = ((y0 + 1) * width + x0) * 4;
        const i11 = ((y0 + 1) * width + x0 + 1) * 4;

        for (let c = 0; c < 4; c++) {
          dstData[dstIdx + c] = Math.round(
            srcData[i00 + c] * (1 - fx) * (1 - fy) +
            srcData[i10 + c] * fx * (1 - fy) +
            srcData[i01 + c] * (1 - fx) * fy +
            srcData[i11 + c] * fx * fy
          );
        }
      }
      // else: out-of-bounds → leave as black (0,0,0,0)
    }
  }

  return output;
}
