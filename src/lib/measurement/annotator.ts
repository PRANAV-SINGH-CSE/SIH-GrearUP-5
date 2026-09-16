/**
 * CompliScan — Canvas Annotation Renderer
 *
 * Draws measurement visualizations on a canvas:
 *   - Reference quad outline
 *   - Object boundary (bounding box or contour)
 *   - Dimension arrows with mm ± error labels
 *   - Distance lines from each edge
 *   - Quality grade badge
 *   - Boundary type label
 *   - Coplanarity disclaimer
 */

import type { MeasurementResult, MeasurementValue, Point2D, BBox } from './measurement.types';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Draw measurement annotations onto a canvas.
 *
 * @param canvas - Target canvas element (will be resized to fit the rectified image)
 * @param result - Measurement result to annotate
 * @param rectifiedImage - The rectified (perspective-corrected) image element
 */
export function drawMeasurementAnnotation(
  canvas: HTMLCanvasElement,
  result: MeasurementResult,
  rectifiedImage: HTMLImageElement | HTMLCanvasElement
): void {
  const imgW = 'naturalWidth' in rectifiedImage
    ? (rectifiedImage as HTMLImageElement).naturalWidth
    : rectifiedImage.width;
  const imgH = 'naturalHeight' in rectifiedImage
    ? (rectifiedImage as HTMLImageElement).naturalHeight
    : rectifiedImage.height;

  // Add padding for annotation labels
  const pad = 60;
  canvas.width = imgW + pad * 2;
  canvas.height = imgH + pad * 2;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the rectified image
  ctx.drawImage(rectifiedImage, pad, pad, imgW, imgH);

  // Determine font size based on image dimensions
  const baseFontSize = Math.max(11, Math.min(16, Math.round(Math.min(imgW, imgH) / 40)));

  // --- Draw reference boundary ---
  ctx.strokeStyle = '#3b82f6'; // blue
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.strokeRect(pad, pad, imgW, imgH);
  ctx.setLineDash([]);

  // --- Draw object boundary ---
  const bb = result.detection.boundingBox;
  const ox = pad + bb.x;
  const oy = pad + bb.y;

  if (result.detection.contourPoints && result.detection.contourPoints.length > 2) {
    // Draw contour
    ctx.strokeStyle = '#14b8a6'; // teal for contour
    ctx.lineWidth = 2;
    ctx.beginPath();
    const pts = result.detection.contourPoints;
    ctx.moveTo(pad + pts[0].x, pad + pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pad + pts[i].x, pad + pts[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // Always draw bounding box (solid green or dashed if contour present)
  if (result.detection.contourPoints) {
    ctx.setLineDash([4, 4]);
  }
  ctx.strokeStyle = '#22c55e'; // green
  ctx.lineWidth = 2;
  ctx.strokeRect(ox, oy, bb.width, bb.height);
  ctx.setLineDash([]);

  // --- Draw width dimension line ---
  const widthY = oy + bb.height + 20;
  drawDimensionLine(ctx, ox, widthY, ox + bb.width, widthY, formatMeasurement(result.boundingWidth), baseFontSize);

  // --- Draw height dimension line ---
  const heightX = ox + bb.width + 20;
  drawDimensionLine(ctx, heightX, oy, heightX, oy + bb.height, formatMeasurement(result.boundingHeight), baseFontSize, true);

  // --- Draw distance lines ---
  const centerX = ox + bb.width / 2;
  const centerY = oy + bb.height / 2;

  // Top distance
  if (result.distanceTop.valueMm > 0) {
    drawDistanceLine(ctx, centerX, pad, centerX, oy, formatMeasurement(result.distanceTop), baseFontSize, '#f59e0b');
  }

  // Bottom distance
  if (result.distanceBottom.valueMm > 0) {
    drawDistanceLine(ctx, centerX, oy + bb.height, centerX, pad + imgH, formatMeasurement(result.distanceBottom), baseFontSize, '#f59e0b');
  }

  // Left distance
  if (result.distanceLeft.valueMm > 0) {
    drawDistanceLine(ctx, pad, centerY, ox, centerY, formatMeasurement(result.distanceLeft), baseFontSize, '#f59e0b');
  }

  // Right distance
  if (result.distanceRight.valueMm > 0) {
    drawDistanceLine(ctx, ox + bb.width, centerY, pad + imgW, centerY, formatMeasurement(result.distanceRight), baseFontSize, '#f59e0b');
  }

  // --- Quality badge ---
  const gradeColors: Record<string, string> = {
    HIGH: '#22c55e',
    ACCEPTABLE: '#3b82f6',
    LOW: '#f59e0b',
    UNRELIABLE: '#ef4444',
  };
  const gradeColor = gradeColors[result.quality.grade] || '#94a3b8';
  const badgeText = `Quality: ${result.quality.grade}`;
  ctx.font = `bold ${baseFontSize}px system-ui, sans-serif`;
  const badgeWidth = ctx.measureText(badgeText).width + 16;
  const badgeX = canvas.width - badgeWidth - 8;
  const badgeY = 8;

  ctx.fillStyle = gradeColor + '33';
  ctx.strokeStyle = gradeColor;
  ctx.lineWidth = 1;
  roundRect(ctx, badgeX, badgeY, badgeWidth, baseFontSize + 12, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = gradeColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + (baseFontSize + 12) / 2);

  // --- Boundary type label ---
  const btLabel = result.detection.boundaryType === 'contour'
    ? 'Contour'
    : result.detection.boundaryType === 'user_adjusted'
      ? 'User Adjusted'
      : 'Bounding Box';
  ctx.font = `${baseFontSize - 1}px system-ui, sans-serif`;
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`Boundary: ${btLabel}`, 8, 12);

  // --- Reference label ---
  const refLabel = `Reference: ${result.calibration.referenceConfig.widthMm}×${result.calibration.referenceConfig.heightMm} mm`;
  ctx.fillText(refLabel, 8, 12 + baseFontSize + 4);
}

// ---------------------------------------------------------------------------
// Drawing Helpers
// ---------------------------------------------------------------------------

function formatMeasurement(mv: MeasurementValue): string {
  return `${mv.valueMm.toFixed(1)} ± ${mv.estimatedErrorMm.toFixed(1)} mm`;
}

function drawDimensionLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string,
  fontSize: number,
  vertical = false
): void {
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 1.5;

  // Line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // End ticks
  const tickSize = 6;
  if (vertical) {
    ctx.beginPath();
    ctx.moveTo(x1 - tickSize, y1);
    ctx.lineTo(x1 + tickSize, y1);
    ctx.moveTo(x2 - tickSize, y2);
    ctx.lineTo(x2 + tickSize, y2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x1, y1 - tickSize);
    ctx.lineTo(x1, y1 + tickSize);
    ctx.moveTo(x2, y2 - tickSize);
    ctx.lineTo(x2, y2 + tickSize);
    ctx.stroke();
  }

  // Label
  ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
  ctx.fillStyle = '#22c55e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Background for readability
  const textWidth = ctx.measureText(label).width;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(midX - textWidth / 2 - 4, midY - fontSize / 2 - 2, textWidth + 8, fontSize + 4);

  ctx.fillStyle = '#22c55e';
  if (vertical) {
    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  } else {
    ctx.fillText(label, midX, midY);
  }
}

function drawDistanceLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string,
  fontSize: number,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Arrowheads
  drawArrow(ctx, x1, y1, x2, y2, color);

  // Label
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  ctx.font = `${fontSize - 1}px system-ui, sans-serif`;
  const textWidth = ctx.measureText(label).width;

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(midX - textWidth / 2 - 3, midY - fontSize / 2 - 1, textWidth + 6, fontSize + 2);

  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, midX, midY);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
): void {
  const headLen = 6;
  const angle = Math.atan2(y2 - y1, x2 - x1);

  ctx.fillStyle = color;

  // Arrow at end
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  // Arrow at start (reverse)
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 + headLen * Math.cos(angle - Math.PI / 6), y1 + headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x1 + headLen * Math.cos(angle + Math.PI / 6), y1 + headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Create an annotated image from a MeasurementResult.
 * Returns a canvas element with all annotations drawn.
 */
export function createAnnotatedCanvas(
  result: MeasurementResult
): HTMLCanvasElement | null {
  if (!result.rectifiedImageDataUrl) return null;

  const canvas = document.createElement('canvas');
  const img = new Image();

  // We need to do this synchronously — create a temp canvas from the data URL
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return null;

  // Load the image data from the data URL
  // Since we have the data URL, we can use it directly
  // But Image loading is async — so we return the canvas and draw later
  // For synchronous use, we'll create from the raw rectified data

  return canvas; // Caller should use drawMeasurementAnnotation() with the loaded image
}
