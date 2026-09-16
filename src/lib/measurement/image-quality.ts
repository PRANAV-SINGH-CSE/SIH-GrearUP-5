/**
 * CompliScan — Pre-Measurement Image Quality Gate
 *
 * Validates that the uploaded/captured image has sufficient quality
 * for reliable measurement BEFORE spending computation on homography
 * or object detection.
 *
 * All processing uses Canvas API + typed arrays — no external libraries.
 */

import type { ImageQualityAssessment, MeasurementError } from './measurement.types';

// ---------------------------------------------------------------------------
// Thresholds (configurable)
// ---------------------------------------------------------------------------

const MIN_WIDTH = 640;
const MIN_HEIGHT = 480;
const BLUR_THRESHOLD = 0.55;        // blurScore > this → IMAGE_TOO_BLURRY
const MIN_BRIGHTNESS = 30;          // mean pixel intensity (0-255)
const MAX_BRIGHTNESS = 240;
const MIN_CONTRAST_STDEV = 18;      // std dev of pixel intensities

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Assesses whether the image is suitable for measurement.
 * Call this BEFORE any expensive CV processing.
 *
 * @param imageElement - An HTMLImageElement or HTMLCanvasElement containing the image
 * @returns Quality assessment with pass/fail and specific errors
 */
export function assessImageQuality(
  imageElement: HTMLImageElement | HTMLCanvasElement
): ImageQualityAssessment {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return failedAssessment([{
      code: 'CALIBRATION_FAILED',
      message: 'Could not create canvas context for quality assessment.',
      suggestion: 'Try a different browser or device.',
    }]);
  }

  // Draw image to canvas
  const width = 'naturalWidth' in imageElement
    ? (imageElement as HTMLImageElement).naturalWidth
    : imageElement.width;
  const height = 'naturalHeight' in imageElement
    ? (imageElement as HTMLImageElement).naturalHeight
    : imageElement.height;

  if (width === 0 || height === 0) {
    return failedAssessment([{
      code: 'IMAGE_RESOLUTION_TOO_LOW',
      message: 'Image has zero dimensions.',
      suggestion: 'Please provide a valid image.',
    }]);
  }

  // Work with a downscaled version for speed (max 800px on longest side)
  const scale = Math.min(1, 800 / Math.max(width, height));
  const sw = Math.round(width * scale);
  const sh = Math.round(height * scale);
  canvas.width = sw;
  canvas.height = sh;
  ctx.drawImage(imageElement, 0, 0, sw, sh);

  const imageData = ctx.getImageData(0, 0, sw, sh);
  const errors: MeasurementError[] = [];

  // 1. Resolution check
  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    errors.push({
      code: 'IMAGE_RESOLUTION_TOO_LOW',
      message: `Image resolution (${width}×${height}) is below minimum (${MIN_WIDTH}×${MIN_HEIGHT}).`,
      suggestion: 'Move closer to the label or use a higher-resolution camera.',
    });
  }

  // 2. Convert to grayscale for blur/brightness/contrast
  const gray = toGrayscale(imageData);

  // 3. Brightness check
  const { mean: brightness, stdev: contrast } = computeStats(gray);
  const normalizedBrightness = brightness / 255;
  const normalizedContrast = Math.min(1, contrast / 80); // 80 stdev → 1.0

  if (brightness < MIN_BRIGHTNESS) {
    errors.push({
      code: 'IMAGE_POOR_LIGHTING',
      message: 'Image is too dark for reliable measurement.',
      suggestion: 'Increase lighting or use the camera flash.',
    });
  } else if (brightness > MAX_BRIGHTNESS) {
    errors.push({
      code: 'IMAGE_POOR_LIGHTING',
      message: 'Image is overexposed / washed out.',
      suggestion: 'Reduce lighting or avoid direct flash glare.',
    });
  }

  // 4. Contrast check
  if (contrast < MIN_CONTRAST_STDEV) {
    errors.push({
      code: 'IMAGE_POOR_LIGHTING',
      message: 'Image has very low contrast — text and edges may not be distinguishable.',
      suggestion: 'Ensure the label has good lighting and is not uniformly colored.',
    });
  }

  // 5. Blur detection (Laplacian variance)
  const blurScore = computeBlurScore(gray, sw, sh);

  if (blurScore > BLUR_THRESHOLD) {
    errors.push({
      code: 'IMAGE_TOO_BLURRY',
      message: 'Image is too blurry for reliable measurement.',
      suggestion: 'Hold the camera steady, ensure focus is locked, and avoid motion during capture.',
    });
  }

  return {
    acceptable: errors.length === 0,
    blurScore,
    resolution: { width, height },
    brightnessScore: normalizedBrightness,
    contrastScore: normalizedContrast,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function failedAssessment(errors: MeasurementError[]): ImageQualityAssessment {
  return {
    acceptable: false,
    blurScore: 1,
    resolution: { width: 0, height: 0 },
    brightnessScore: 0,
    contrastScore: 0,
    errors,
  };
}

/** Convert RGBA ImageData to a flat Float32 grayscale array */
function toGrayscale(imageData: ImageData): Float32Array {
  const { data, width, height } = imageData;
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const offset = i * 4;
    // ITU-R BT.601 luma
    gray[i] = 0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
  }
  return gray;
}

/** Compute mean and standard deviation of a float array */
function computeStats(arr: Float32Array): { mean: number; stdev: number } {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i];
  const mean = sum / arr.length;

  let sumSq = 0;
  for (let i = 0; i < arr.length; i++) {
    const d = arr[i] - mean;
    sumSq += d * d;
  }
  const stdev = Math.sqrt(sumSq / arr.length);

  return { mean, stdev };
}

/**
 * Compute a blur score using the variance of a 3×3 Laplacian filter.
 * Lower variance = blurrier image.
 * Returns a normalized score where 0 = perfectly sharp, 1 = very blurry.
 */
function computeBlurScore(gray: Float32Array, width: number, height: number): number {
  // Laplacian kernel:
  //  0  1  0
  //  1 -4  1
  //  0  1  0
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const laplacian =
        gray[idx - width] +       // top
        gray[idx - 1] +           // left
        -4 * gray[idx] +          // center
        gray[idx + 1] +           // right
        gray[idx + width];        // bottom

      sum += laplacian;
      sumSq += laplacian * laplacian;
      count++;
    }
  }

  if (count === 0) return 1;

  const mean = sum / count;
  const variance = sumSq / count - mean * mean;

  // Map variance to a 0-1 blur score.
  // High variance = sharp edges = low blur score.
  // Empirically: variance > 500 = sharp, < 50 = very blurry.
  const sharpnessIndicator = Math.min(variance, 1000);
  const blurScore = 1 - Math.min(1, sharpnessIndicator / 500);

  return Math.round(blurScore * 100) / 100;
}
