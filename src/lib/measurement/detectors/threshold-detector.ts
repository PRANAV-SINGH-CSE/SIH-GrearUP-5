/**
 * CompliScan — Classical CV Threshold Detector (Fallback)
 *
 * Detects objects in a rectified reference region using:
 *   1. Adaptive thresholding (Otsu's method)
 *   2. Morphological cleanup
 *   3. Connected component labeling
 *   4. Heuristic-based component selection (NOT just "the largest")
 *   5. Optional contour tracing for higher-fidelity boundaries
 *
 * This is the FALLBACK detector (priority: 100). ML/segmentation
 * detectors run first when available.
 *
 * IMPORTANT: Bounding box ≠ exact object dimensions. This detector
 * explicitly reports whether it found a clean contour or only a bounding box.
 */

import type { IObjectDetector, DetectedObject, Point2D } from '../measurement.types';

export class ThresholdDetector implements IObjectDetector {
  readonly id = 'threshold-cv';
  readonly name = 'Classical CV Threshold Detector';
  readonly priority = 100; // fallback — tried after ML detectors

  async isReady(): Promise<boolean> {
    return true; // always available
  }

  async detect(
    imageData: ImageData,
    _regionWidthMm: number,
    _regionHeightMm: number
  ): Promise<DetectedObject | null> {
    const { width, height } = imageData;

    // 1. Convert to grayscale
    const gray = toGrayscale(imageData);

    // 2. Compute Otsu threshold
    const threshold = otsuThreshold(gray);

    // 3. Binarize (object = dark pixels on lighter background, or vice versa)
    const binary = binarize(gray, threshold, width, height);

    // 4. Morphological cleanup: close small gaps, remove noise
    const cleaned = morphClose(binary, width, height, 3);
    const denoised = morphOpen(cleaned, width, height, 2);

    // 5. Connected component labeling
    const { labels, numLabels } = labelConnectedComponents(denoised, width, height);

    if (numLabels === 0) return null;

    // 6. Select the best component using heuristics (NOT just largest)
    const best = selectBestComponent(labels, numLabels, width, height);
    if (!best) return null;

    // 7. Attempt contour tracing for higher fidelity
    const contour = traceContour(denoised, width, height, best.bbox);
    const hasCleanContour = contour !== null && contour.length >= 8 && isContourClean(contour, best.bbox);

    // 8. Compute detection confidence based on edge contrast and separation
    const confidence = computeDetectionConfidence(gray, best.bbox, width, height);

    return {
      boundingBox: best.bbox,
      contourPoints: hasCleanContour ? contour : null,
      boundaryType: hasCleanContour ? 'contour' : 'bounding_box',
      detectionConfidence: confidence,
      detectorId: this.id,
    };
  }
}

// ---------------------------------------------------------------------------
// Grayscale Conversion
// ---------------------------------------------------------------------------

function toGrayscale(imageData: ImageData): Uint8Array {
  const { data, width, height } = imageData;
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const off = i * 4;
    gray[i] = Math.round(0.299 * data[off] + 0.587 * data[off + 1] + 0.114 * data[off + 2]);
  }
  return gray;
}

// ---------------------------------------------------------------------------
// Otsu's Thresholding
// ---------------------------------------------------------------------------

function otsuThreshold(gray: Uint8Array): number {
  // Compute histogram
  const hist = new Int32Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;

  const total = gray.length;
  let sumAll = 0;
  for (let i = 0; i < 256; i++) sumAll += i * hist[i];

  let sumBg = 0;
  let weightBg = 0;
  let maxVariance = 0;
  let bestThreshold = 0;

  for (let t = 0; t < 256; t++) {
    weightBg += hist[t];
    if (weightBg === 0) continue;

    const weightFg = total - weightBg;
    if (weightFg === 0) break;

    sumBg += t * hist[t];
    const meanBg = sumBg / weightBg;
    const meanFg = (sumAll - sumBg) / weightFg;

    const variance = weightBg * weightFg * (meanBg - meanFg) * (meanBg - meanFg);
    if (variance > maxVariance) {
      maxVariance = variance;
      bestThreshold = t;
    }
  }

  return bestThreshold;
}

// ---------------------------------------------------------------------------
// Binarization
// ---------------------------------------------------------------------------

function binarize(gray: Uint8Array, threshold: number, width: number, height: number): Uint8Array {
  const binary = new Uint8Array(width * height);

  // Determine polarity: is the object darker or lighter than background?
  // Check border pixels vs center pixels
  let borderSum = 0;
  let borderCount = 0;
  let centerSum = 0;
  let centerCount = 0;

  const margin = Math.min(width, height) * 0.1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (x < margin || x >= width - margin || y < margin || y >= height - margin) {
        borderSum += gray[idx];
        borderCount++;
      } else if (
        x > width * 0.3 && x < width * 0.7 &&
        y > height * 0.3 && y < height * 0.7
      ) {
        centerSum += gray[idx];
        centerCount++;
      }
    }
  }

  const borderMean = borderCount > 0 ? borderSum / borderCount : 128;
  const centerMean = centerCount > 0 ? centerSum / centerCount : 128;

  // If center is darker than border → object is dark on light background
  const objectIsDark = centerMean < borderMean;

  for (let i = 0; i < gray.length; i++) {
    if (objectIsDark) {
      binary[i] = gray[i] < threshold ? 1 : 0;
    } else {
      binary[i] = gray[i] >= threshold ? 1 : 0;
    }
  }

  return binary;
}

// ---------------------------------------------------------------------------
// Morphological Operations
// ---------------------------------------------------------------------------

function morphClose(binary: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  return erode(dilate(binary, width, height, radius), width, height, radius);
}

function morphOpen(binary: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  return dilate(erode(binary, width, height, radius), width, height, radius);
}

function dilate(binary: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxVal = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            if (binary[ny * width + nx] > maxVal) maxVal = 1;
          }
        }
      }
      out[y * width + x] = maxVal;
    }
  }
  return out;
}

function erode(binary: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minVal = 1;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            if (binary[ny * width + nx] === 0) { minVal = 0; break; }
          } else {
            minVal = 0; break;
          }
        }
        if (minVal === 0) break;
      }
      out[y * width + x] = minVal;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Connected Component Labeling (Two-Pass)
// ---------------------------------------------------------------------------

interface ComponentInfo {
  label: number;
  pixelCount: number;
  bbox: { x: number; y: number; width: number; height: number };
  centroid: { x: number; y: number };
}

function labelConnectedComponents(
  binary: Uint8Array,
  width: number,
  height: number
): { labels: Int32Array; numLabels: number; components: ComponentInfo[] } {
  const labels = new Int32Array(width * height);
  const parent = new Int32Array(width * height + 1);
  let nextLabel = 1;

  // Initialize union-find
  for (let i = 0; i < parent.length; i++) parent[i] = i;

  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]; // path compression
      x = parent[x];
    }
    return x;
  };

  const union = (a: number, b: number): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  // First pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (binary[idx] === 0) continue;

      const neighbors: number[] = [];
      if (x > 0 && labels[idx - 1] > 0) neighbors.push(labels[idx - 1]);
      if (y > 0 && labels[idx - width] > 0) neighbors.push(labels[idx - width]);

      if (neighbors.length === 0) {
        labels[idx] = nextLabel++;
      } else {
        const minLabel = Math.min(...neighbors);
        labels[idx] = minLabel;
        for (const n of neighbors) union(n, minLabel);
      }
    }
  }

  // Second pass: resolve labels
  const labelMap = new Map<number, number>();
  let finalLabel = 0;

  for (let i = 0; i < labels.length; i++) {
    if (labels[i] > 0) {
      const root = find(labels[i]);
      if (!labelMap.has(root)) {
        labelMap.set(root, ++finalLabel);
      }
      labels[i] = labelMap.get(root)!;
    }
  }

  // Compute component info
  const components: ComponentInfo[] = [];
  const compMap = new Map<number, { pixels: number; minX: number; maxX: number; minY: number; maxY: number; sumX: number; sumY: number }>();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const lbl = labels[y * width + x];
      if (lbl === 0) continue;
      let info = compMap.get(lbl);
      if (!info) {
        info = { pixels: 0, minX: x, maxX: x, minY: y, maxY: y, sumX: 0, sumY: 0 };
        compMap.set(lbl, info);
      }
      info.pixels++;
      info.minX = Math.min(info.minX, x);
      info.maxX = Math.max(info.maxX, x);
      info.minY = Math.min(info.minY, y);
      info.maxY = Math.max(info.maxY, y);
      info.sumX += x;
      info.sumY += y;
    }
  }

  for (const [label, info] of compMap) {
    components.push({
      label,
      pixelCount: info.pixels,
      bbox: {
        x: info.minX,
        y: info.minY,
        width: info.maxX - info.minX + 1,
        height: info.maxY - info.minY + 1,
      },
      centroid: {
        x: info.sumX / info.pixels,
        y: info.sumY / info.pixels,
      },
    });
  }

  return { labels, numLabels: finalLabel, components };
}

// ---------------------------------------------------------------------------
// Component Selection (NOT just "the largest")
// ---------------------------------------------------------------------------

function selectBestComponent(
  _labels: Int32Array,
  _numLabels: number,
  width: number,
  height: number
): ComponentInfo | null {
  // Re-extract component info from the labeled image
  const { components } = labelConnectedComponents(
    new Uint8Array(Array.from(_labels).map((l) => l > 0 ? 1 : 0)),
    width,
    height
  );

  if (components.length === 0) return null;

  const imageArea = width * height;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  // Score each component using multiple heuristics
  let bestComponent: ComponentInfo | null = null;
  let bestScore = -Infinity;

  for (const comp of components) {
    // Skip tiny components (noise) — less than 1% of image
    if (comp.pixelCount < imageArea * 0.01) continue;

    // Skip components that fill almost the entire image (likely background)
    if (comp.pixelCount > imageArea * 0.9) continue;

    // Heuristic 1: Size (prefer larger objects, but not too large)
    const sizeRatio = comp.pixelCount / imageArea;
    const sizeScore = sizeRatio > 0.5 ? 1 - sizeRatio : sizeRatio * 2;

    // Heuristic 2: Centrality (prefer objects near the center)
    const dx = comp.centroid.x - centerX;
    const dy = comp.centroid.y - centerY;
    const centralityScore = 1 - Math.sqrt(dx * dx + dy * dy) / maxDist;

    // Heuristic 3: Separation from edges (not touching image borders)
    const marginX = Math.min(comp.bbox.x, width - (comp.bbox.x + comp.bbox.width));
    const marginY = Math.min(comp.bbox.y, height - (comp.bbox.y + comp.bbox.height));
    const separationScore = Math.min(marginX / (width * 0.05), marginY / (height * 0.05), 1);

    // Heuristic 4: Aspect ratio plausibility (not extremely elongated)
    const ar = comp.bbox.width / Math.max(comp.bbox.height, 1);
    const arScore = ar > 0.1 && ar < 10 ? 1 : 0.3;

    // Weighted combination
    const score = sizeScore * 0.3 + centralityScore * 0.35 + separationScore * 0.2 + arScore * 0.15;

    if (score > bestScore) {
      bestScore = score;
      bestComponent = comp;
    }
  }

  return bestComponent;
}

// ---------------------------------------------------------------------------
// Contour Tracing (Moore Neighborhood)
// ---------------------------------------------------------------------------

function traceContour(
  binary: Uint8Array,
  width: number,
  height: number,
  bbox: { x: number; y: number; width: number; height: number }
): Point2D[] | null {
  // Find a starting boundary pixel
  let startX = -1;
  let startY = -1;

  for (let y = bbox.y; y < bbox.y + bbox.height && startX === -1; y++) {
    for (let x = bbox.x; x < bbox.x + bbox.width; x++) {
      if (binary[y * width + x] > 0) {
        startX = x;
        startY = y;
        break;
      }
    }
  }

  if (startX === -1) return null;

  // Moore neighborhood tracing (8-connected)
  const dx8 = [1, 1, 0, -1, -1, -1, 0, 1];
  const dy8 = [0, 1, 1, 1, 0, -1, -1, -1];

  const contour: Point2D[] = [];
  let cx = startX;
  let cy = startY;
  let dir = 0; // start direction
  const maxSteps = width * height; // safety limit

  for (let step = 0; step < maxSteps; step++) {
    contour.push({ x: cx, y: cy });

    // Search for next boundary pixel
    let found = false;
    const startDir = (dir + 5) % 8; // backtrack direction

    for (let i = 0; i < 8; i++) {
      const d = (startDir + i) % 8;
      const nx = cx + dx8[d];
      const ny = cy + dy8[d];

      if (nx >= 0 && nx < width && ny >= 0 && ny < height && binary[ny * width + nx] > 0) {
        cx = nx;
        cy = ny;
        dir = d;
        found = true;
        break;
      }
    }

    if (!found) break;
    if (cx === startX && cy === startY && contour.length > 2) break;
  }

  // Simplify contour (Douglas-Peucker-like: keep every Nth point)
  if (contour.length < 4) return null;

  const step = Math.max(1, Math.floor(contour.length / 200));
  const simplified: Point2D[] = [];
  for (let i = 0; i < contour.length; i += step) {
    simplified.push(contour[i]);
  }

  return simplified.length >= 4 ? simplified : null;
}

// ---------------------------------------------------------------------------
// Contour Quality Assessment
// ---------------------------------------------------------------------------

function isContourClean(
  contour: Point2D[],
  bbox: { x: number; y: number; width: number; height: number }
): boolean {
  if (contour.length < 8) return false;

  // Check that the contour roughly matches the bounding box area
  // A clean contour should fill at least 50% of the bounding box
  const contourArea = computePolygonArea(contour);
  const bboxArea = bbox.width * bbox.height;

  if (contourArea < bboxArea * 0.4) return false;
  if (contourArea > bboxArea * 1.1) return false; // shouldn't exceed bbox

  return true;
}

function computePolygonArea(pts: Point2D[]): number {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2;
}

// ---------------------------------------------------------------------------
// Detection Confidence
// ---------------------------------------------------------------------------

function computeDetectionConfidence(
  gray: Uint8Array,
  bbox: { x: number; y: number; width: number; height: number },
  width: number,
  height: number
): number {
  // Measure edge contrast at the object boundary
  const margin = 5;
  let insideSum = 0;
  let insideCount = 0;
  let outsideSum = 0;
  let outsideCount = 0;

  for (let y = Math.max(0, bbox.y - margin); y < Math.min(height, bbox.y + bbox.height + margin); y++) {
    for (let x = Math.max(0, bbox.x - margin); x < Math.min(width, bbox.x + bbox.width + margin); x++) {
      const val = gray[y * width + x];
      const isInside =
        x >= bbox.x && x < bbox.x + bbox.width &&
        y >= bbox.y && y < bbox.y + bbox.height;

      if (isInside) {
        insideSum += val;
        insideCount++;
      } else {
        outsideSum += val;
        outsideCount++;
      }
    }
  }

  if (insideCount === 0 || outsideCount === 0) return 0.3;

  const insideMean = insideSum / insideCount;
  const outsideMean = outsideSum / outsideCount;
  const contrastDiff = Math.abs(insideMean - outsideMean);

  // Map contrast difference to confidence
  // High contrast (>80) = high confidence, Low contrast (<20) = low confidence
  return Math.min(0.95, Math.max(0.2, contrastDiff / 100));
}
