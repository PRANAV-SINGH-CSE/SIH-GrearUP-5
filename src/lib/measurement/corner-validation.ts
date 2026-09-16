/**
 * CompliScan — Corner Placement Validation
 *
 * Validates that the 4 user-selected reference corners form a valid
 * convex quadrilateral in the correct winding order before homography.
 */

import type { Point2D, Quadrilateral, ReferenceConfig, MeasurementError } from './measurement.types';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface CornerValidationResult {
  valid: boolean;
  errors: MeasurementError[];
  /** Corrected corners (winding-order fixed) if applicable */
  correctedCorners: Quadrilateral;
  /** Estimated camera angle from perpendicular (degrees) */
  estimatedAngleDeg: number;
}

/**
 * Validates that 4 corner points form a valid, convex, correctly-ordered
 * quadrilateral suitable for homography computation.
 */
export function validateCorners(
  corners: Quadrilateral,
  imageWidth: number,
  imageHeight: number,
  referenceSizeMm: ReferenceConfig
): CornerValidationResult {
  const errors: MeasurementError[] = [];
  let pts = quadToArray(corners);

  // 1. Check all points are within image bounds
  for (const p of pts) {
    if (p.x < 0 || p.x > imageWidth || p.y < 0 || p.y > imageHeight) {
      errors.push({
        code: 'REFERENCE_PARTIALLY_VISIBLE',
        message: 'One or more reference corners are outside the image bounds.',
        suggestion: 'Ensure the entire reference area is visible in the image.',
      });
      break;
    }
  }

  // 2. Check for self-intersection (bowtie)
  if (hasEdgeIntersection(pts)) {
    errors.push({
      code: 'REFERENCE_CORNERS_INVALID',
      message: 'Reference corners form a self-intersecting shape (edges cross each other).',
      suggestion: 'Re-order the corners: top-left, top-right, bottom-right, bottom-left (clockwise).',
    });
  }

  // 3. Check convexity
  if (!isConvex(pts)) {
    errors.push({
      code: 'REFERENCE_NOT_CONVEX',
      message: 'Reference corners do not form a convex quadrilateral.',
      suggestion: 'Ensure all four corners are placed at the actual corners of the reference area without any corner being "inside" the others.',
    });
  }

  // 4. Check and fix winding order (should be clockwise)
  if (!isClockwise(pts)) {
    pts = pts.slice().reverse() as [Point2D, Point2D, Point2D, Point2D];
  }

  // 5. Ensure correct corner assignment (TL should be top-left-most, etc.)
  pts = assignCornerRoles(pts);

  // 6. Minimum area check (at least 5% of image area)
  const quadArea = computeQuadArea(pts);
  const imageArea = imageWidth * imageHeight;
  const areaRatio = quadArea / imageArea;
  if (areaRatio < 0.05) {
    errors.push({
      code: 'REFERENCE_TOO_SMALL',
      message: `Reference area is too small (${(areaRatio * 100).toFixed(1)}% of image). Minimum is 5%.`,
      suggestion: 'Move closer to the reference or select a larger area.',
    });
  }

  // 7. Aspect ratio sanity check (only for rigid external reference cards like Credit Card or A4 Paper)
  const isAutoPackage =
    referenceSizeMm.isAuto ||
    referenceSizeMm.label?.toLowerCase().includes('package') ||
    referenceSizeMm.label?.toLowerCase().includes('auto') ||
    referenceSizeMm.label?.toLowerCase().includes('pouch') ||
    referenceSizeMm.label?.toLowerCase().includes('carton') ||
    referenceSizeMm.label?.toLowerCase().includes('bottle');

  if (!isAutoPackage) {
    const declaredAR = referenceSizeMm.widthMm / referenceSizeMm.heightMm;
    const measuredAR = estimateQuadAspectRatio(pts);
    const arDiff = Math.abs(declaredAR - measuredAR) / declaredAR;
    if (arDiff > 0.55) {
      errors.push({
        code: 'REFERENCE_ASPECT_RATIO_MISMATCH',
        message: `The selected area's aspect ratio (~${measuredAR.toFixed(2)}) differs significantly from the declared reference (${declaredAR.toFixed(2)}).`,
        suggestion: 'Check that you selected the correct reference area and entered the right dimensions.',
      });
    }
  }

  // 8. Estimate perspective angle
  const estimatedAngleDeg = estimatePerspectiveAngle(pts);
  if (estimatedAngleDeg > 60) {
    errors.push({
      code: 'PERSPECTIVE_TOO_EXTREME',
      message: `Camera angle is too extreme (~${Math.round(estimatedAngleDeg)}° from perpendicular). Maximum recommended: 45°.`,
      suggestion: 'Capture the image more directly from above or in front of the reference surface.',
    });
  } else if (estimatedAngleDeg > 45) {
    // Warning but not rejection — will be noted in quality assessment
  }

  const correctedCorners = arrayToQuad(pts);

  return {
    valid: errors.length === 0,
    errors,
    correctedCorners,
    estimatedAngleDeg,
  };
}

// ---------------------------------------------------------------------------
// Geometry Helpers
// ---------------------------------------------------------------------------

function quadToArray(q: Quadrilateral): [Point2D, Point2D, Point2D, Point2D] {
  return [q.topLeft, q.topRight, q.bottomRight, q.bottomLeft];
}

function arrayToQuad(pts: Point2D[]): Quadrilateral {
  return {
    topLeft: pts[0],
    topRight: pts[1],
    bottomRight: pts[2],
    bottomLeft: pts[3],
  };
}

/**
 * Cross product of vectors (p1->p2) and (p1->p3).
 * Positive = counter-clockwise, Negative = clockwise.
 */
function cross(p1: Point2D, p2: Point2D, p3: Point2D): number {
  return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
}

/** Check if points form a convex polygon */
function isConvex(pts: Point2D[]): boolean {
  const n = pts.length;
  if (n < 3) return false;

  let sign = 0;
  for (let i = 0; i < n; i++) {
    const cp = cross(pts[i], pts[(i + 1) % n], pts[(i + 2) % n]);
    if (cp !== 0) {
      if (sign === 0) {
        sign = cp > 0 ? 1 : -1;
      } else if ((cp > 0 ? 1 : -1) !== sign) {
        return false;
      }
    }
  }
  return true;
}

/** Check if polygon winding is clockwise (in screen coords where Y increases downward) */
function isClockwise(pts: Point2D[]): boolean {
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % pts.length];
    sum += (next.x - curr.x) * (next.y + curr.y);
  }
  return sum > 0;
}

/** Check if any pair of non-adjacent edges intersect (self-intersection / bowtie) */
function hasEdgeIntersection(pts: Point2D[]): boolean {
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // adjacent edges
      if (segmentsIntersect(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) {
        return true;
      }
    }
  }
  return false;
}

/** Check if two line segments intersect */
function segmentsIntersect(a: Point2D, b: Point2D, c: Point2D, d: Point2D): boolean {
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  return false;
}

/** Compute area of a quadrilateral using the shoelace formula */
function computeQuadArea(pts: Point2D[]): number {
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2;
}

/** Assign TL/TR/BR/BL roles based on position */
function assignCornerRoles(pts: Point2D[]): [Point2D, Point2D, Point2D, Point2D] {
  // Sort by y (top to bottom), then by x (left to right)
  const sorted = [...pts].sort((a, b) => a.y - b.y || a.x - b.x);

  // Top two points
  const topPair = sorted.slice(0, 2).sort((a, b) => a.x - b.x);
  // Bottom two points
  const bottomPair = sorted.slice(2, 4).sort((a, b) => a.x - b.x);

  return [topPair[0], topPair[1], bottomPair[1], bottomPair[0]]; // TL, TR, BR, BL
}

/** Estimate aspect ratio from a quad (average of top/bottom widths vs left/right heights) */
function estimateQuadAspectRatio(pts: Point2D[]): number {
  const topWidth = dist(pts[0], pts[1]);
  const bottomWidth = dist(pts[3], pts[2]);
  const leftHeight = dist(pts[0], pts[3]);
  const rightHeight = dist(pts[1], pts[2]);

  const avgWidth = (topWidth + bottomWidth) / 2;
  const avgHeight = (leftHeight + rightHeight) / 2;

  return avgHeight > 0 ? avgWidth / avgHeight : 1;
}

/** Euclidean distance between two points */
function dist(a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Estimate the camera's angle from perpendicular based on how
 * non-rectangular the quad is. A perfectly frontal view gives a rectangle;
 * perspective makes it trapezoidal.
 *
 * Uses the ratio of parallel edge lengths as a proxy.
 */
function estimatePerspectiveAngle(pts: Point2D[]): number {
  const topWidth = dist(pts[0], pts[1]);
  const bottomWidth = dist(pts[3], pts[2]);
  const leftHeight = dist(pts[0], pts[3]);
  const rightHeight = dist(pts[1], pts[2]);

  // Ratio of shorter to longer parallel edges
  const widthRatio = Math.min(topWidth, bottomWidth) / Math.max(topWidth, bottomWidth);
  const heightRatio = Math.min(leftHeight, rightHeight) / Math.max(leftHeight, rightHeight);

  // Average ratio — 1.0 = perfectly rectangular = 0° angle
  const avgRatio = (widthRatio + heightRatio) / 2;

  // Map ratio to angle: 1.0 → 0°, 0.5 → ~60°, 0.3 → ~70°
  // This is a rough approximation, not exact trigonometry
  const angleDeg = Math.acos(Math.min(1, avgRatio)) * (180 / Math.PI) * 1.2;

  return Math.round(Math.min(90, angleDeg) * 10) / 10;
}
