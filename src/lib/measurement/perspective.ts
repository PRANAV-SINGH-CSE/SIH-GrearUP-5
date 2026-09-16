/**
 * CompliScan — Perspective Correction via Homography
 *
 * Computes a 3×3 projective transformation matrix from 4 source→destination
 * point correspondences using the Direct Linear Transform (DLT) algorithm.
 * Then warps the image to a rectified (fronto-parallel) coordinate system.
 *
 * Pure TypeScript + typed arrays — no OpenCV dependency.
 */

import type { Point2D } from './measurement.types';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute a 3×3 homography matrix mapping src points to dst points.
 *
 * Uses the DLT (Direct Linear Transform) algorithm:
 *   For each correspondence (x,y) → (x',y'), we get 2 equations.
 *   4 correspondences = 8 equations for 8 unknowns (h33 = 1 normalization).
 *
 * @param src - 4 source points (the quad in the original image)
 * @param dst - 4 destination points (the rectified rectangle)
 * @returns 3×3 homography matrix as Float64Array[9] in row-major order, or null on failure
 */
export function computeHomography(
  src: [Point2D, Point2D, Point2D, Point2D],
  dst: [Point2D, Point2D, Point2D, Point2D]
): Float64Array | null {
  // Build the 8×9 matrix A for the DLT
  // For each correspondence: two rows of A
  //   [-x, -y, -1,  0,  0,  0, x*x', y*x', x']
  //   [ 0,  0,  0, -x, -y, -1, x*y', y*y', y']

  const A = new Float64Array(8 * 9);

  for (let i = 0; i < 4; i++) {
    const sx = src[i].x;
    const sy = src[i].y;
    const dx = dst[i].x;
    const dy = dst[i].y;

    const row1 = i * 2;
    const row2 = row1 + 1;

    // Row 1
    A[row1 * 9 + 0] = -sx;
    A[row1 * 9 + 1] = -sy;
    A[row1 * 9 + 2] = -1;
    A[row1 * 9 + 3] = 0;
    A[row1 * 9 + 4] = 0;
    A[row1 * 9 + 5] = 0;
    A[row1 * 9 + 6] = sx * dx;
    A[row1 * 9 + 7] = sy * dx;
    A[row1 * 9 + 8] = dx;

    // Row 2
    A[row2 * 9 + 0] = 0;
    A[row2 * 9 + 1] = 0;
    A[row2 * 9 + 2] = 0;
    A[row2 * 9 + 3] = -sx;
    A[row2 * 9 + 4] = -sy;
    A[row2 * 9 + 5] = -1;
    A[row2 * 9 + 6] = sx * dy;
    A[row2 * 9 + 7] = sy * dy;
    A[row2 * 9 + 8] = dy;
  }

  // Solve A*h = 0 via SVD-like approach.
  // For a minimal 4-point case, we can solve the 8×8 system directly
  // by setting h[8] = 1 and solving the linear system.
  const B = new Float64Array(8 * 8);
  const rhs = new Float64Array(8);

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      B[r * 8 + c] = A[r * 9 + c];
    }
    rhs[r] = -A[r * 9 + 8];
  }

  // Solve B * h = rhs using Gaussian elimination with partial pivoting
  const solution = solveLinearSystem(B, rhs, 8);
  if (!solution) return null;

  // Construct the 3×3 homography (row-major)
  const H = new Float64Array(9);
  for (let i = 0; i < 8; i++) {
    H[i] = solution[i];
  }
  H[8] = 1;

  return H;
}

/**
 * Apply homography to a single point.
 *
 * [x']   [h0 h1 h2] [x]
 * [y'] = [h3 h4 h5] [y]
 * [w']   [h6 h7 h8] [1]
 *
 * result = (x'/w', y'/w')
 */
export function applyHomographyToPoint(point: Point2D, H: Float64Array): Point2D {
  const w = H[6] * point.x + H[7] * point.y + H[8];
  if (Math.abs(w) < 1e-10) {
    return { x: 0, y: 0 }; // degenerate
  }
  return {
    x: (H[0] * point.x + H[1] * point.y + H[2]) / w,
    y: (H[3] * point.x + H[4] * point.y + H[5]) / w,
  };
}

/**
 * Compute the inverse homography matrix.
 * H_inv maps from destination back to source.
 */
export function invertHomography(H: Float64Array): Float64Array | null {
  // 3×3 matrix inversion using cofactors
  const [a, b, c, d, e, f, g, h, i] = H;

  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-10) return null;

  const invDet = 1 / det;
  const inv = new Float64Array(9);

  inv[0] = (e * i - f * h) * invDet;
  inv[1] = (c * h - b * i) * invDet;
  inv[2] = (b * f - c * e) * invDet;
  inv[3] = (f * g - d * i) * invDet;
  inv[4] = (a * i - c * g) * invDet;
  inv[5] = (c * d - a * f) * invDet;
  inv[6] = (d * h - e * g) * invDet;
  inv[7] = (b * g - a * h) * invDet;
  inv[8] = (a * e - b * d) * invDet;

  return inv;
}

/**
 * Warp an image region using a homography.
 *
 * Maps each pixel in the output (rectified) image back to the source
 * using the inverse homography, with bilinear interpolation.
 *
 * @param sourceImageData - The original image pixel data
 * @param sourceWidth - Width of the source image
 * @param sourceHeight - Height of the source image
 * @param H - Homography from source → destination
 * @param outputWidth - Desired width of the rectified output
 * @param outputHeight - Desired height of the rectified output
 * @returns Rectified image as ImageData
 */
export function warpPerspective(
  sourceImageData: ImageData,
  H: Float64Array,
  outputWidth: number,
  outputHeight: number
): ImageData | null {
  const Hinv = invertHomography(H);
  if (!Hinv) return null;

  const srcData = sourceImageData.data;
  const srcW = sourceImageData.width;
  const srcH = sourceImageData.height;

  const output = new ImageData(outputWidth, outputHeight);
  const dstData = output.data;

  for (let dy = 0; dy < outputHeight; dy++) {
    for (let dx = 0; dx < outputWidth; dx++) {
      // Map destination pixel back to source using inverse homography
      const srcPt = applyHomographyToPoint({ x: dx, y: dy }, Hinv);
      const sx = srcPt.x;
      const sy = srcPt.y;

      const dstIdx = (dy * outputWidth + dx) * 4;

      // Bilinear interpolation from source
      if (sx >= 0 && sx < srcW - 1 && sy >= 0 && sy < srcH - 1) {
        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const fx = sx - x0;
        const fy = sy - y0;

        const i00 = (y0 * srcW + x0) * 4;
        const i10 = (y0 * srcW + x0 + 1) * 4;
        const i01 = ((y0 + 1) * srcW + x0) * 4;
        const i11 = ((y0 + 1) * srcW + x0 + 1) * 4;

        for (let c = 0; c < 4; c++) {
          dstData[dstIdx + c] = Math.round(
            srcData[i00 + c] * (1 - fx) * (1 - fy) +
            srcData[i10 + c] * fx * (1 - fy) +
            srcData[i01 + c] * (1 - fx) * fy +
            srcData[i11 + c] * fx * fy
          );
        }
      }
      // else: out-of-bounds → black (0,0,0,0)
    }
  }

  return output;
}

/**
 * Compute reprojection error: how well the homography maps src → dst.
 * Lower error = better calibration quality.
 *
 * @returns Mean reprojection error in pixels
 */
export function computeReprojectionError(
  src: Point2D[],
  dst: Point2D[],
  H: Float64Array
): number {
  let totalError = 0;
  for (let i = 0; i < src.length; i++) {
    const projected = applyHomographyToPoint(src[i], H);
    const dx = projected.x - dst[i].x;
    const dy = projected.y - dst[i].y;
    totalError += Math.sqrt(dx * dx + dy * dy);
  }
  return totalError / src.length;
}

// ---------------------------------------------------------------------------
// Linear Algebra Helpers
// ---------------------------------------------------------------------------

/**
 * Solve Ax = b using Gaussian elimination with partial pivoting.
 * A is n×n (row-major), b is length n.
 * Returns solution x, or null if singular.
 */
function solveLinearSystem(
  A: Float64Array,
  b: Float64Array,
  n: number
): Float64Array | null {
  // Create augmented matrix [A | b]
  const aug = new Float64Array(n * (n + 1));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      aug[r * (n + 1) + c] = A[r * n + c];
    }
    aug[r * (n + 1) + n] = b[r];
  }

  // Forward elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxVal = Math.abs(aug[col * (n + 1) + col]);
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      const val = Math.abs(aug[row * (n + 1) + col]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = row;
      }
    }

    if (maxVal < 1e-12) return null; // Singular

    // Swap rows
    if (maxRow !== col) {
      for (let c = 0; c <= n; c++) {
        const tmp = aug[col * (n + 1) + c];
        aug[col * (n + 1) + c] = aug[maxRow * (n + 1) + c];
        aug[maxRow * (n + 1) + c] = tmp;
      }
    }

    // Eliminate below
    const pivot = aug[col * (n + 1) + col];
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row * (n + 1) + col] / pivot;
      for (let c = col; c <= n; c++) {
        aug[row * (n + 1) + c] -= factor * aug[col * (n + 1) + c];
      }
    }
  }

  // Back substitution
  const x = new Float64Array(n);
  for (let row = n - 1; row >= 0; row--) {
    let sum = aug[row * (n + 1) + n];
    for (let col = row + 1; col < n; col++) {
      sum -= aug[row * (n + 1) + col] * x[col];
    }
    const diag = aug[row * (n + 1) + row];
    if (Math.abs(diag) < 1e-12) return null;
    x[row] = sum / diag;
  }

  return x;
}
