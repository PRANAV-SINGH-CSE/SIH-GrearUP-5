/**
 * CompliScan — Object Detector Registry
 *
 * Manages multiple object detectors and tries them in priority order.
 * The first detector that returns a result wins.
 *
 * Priority: lower number = tried first.
 * ML detectors (priority ~10) are tried before classical CV (priority ~100).
 */

import type { IObjectDetector, DetectedObject } from './measurement.types';

export class ObjectDetectorRegistry {
  private detectors: IObjectDetector[] = [];

  /** Register a detector. Detectors are sorted by priority automatically. */
  register(detector: IObjectDetector): void {
    this.detectors.push(detector);
    this.detectors.sort((a, b) => a.priority - b.priority);
  }

  /** Get all registered detectors */
  getDetectors(): ReadonlyArray<IObjectDetector> {
    return this.detectors;
  }

  /**
   * Try detectors in priority order until one succeeds.
   *
   * @param imageData - Rectified (perspective-corrected) region pixel data
   * @param regionWidthMm - Physical width of the region in mm
   * @param regionHeightMm - Physical height of the region in mm
   * @returns Detected object or null if all detectors fail
   */
  async detect(
    imageData: ImageData,
    regionWidthMm: number,
    regionHeightMm: number
  ): Promise<DetectedObject | null> {
    for (const detector of this.detectors) {
      try {
        const ready = await detector.isReady();
        if (!ready) continue;

        const result = await detector.detect(imageData, regionWidthMm, regionHeightMm);
        if (result && result.detectionConfidence > 0.15) {
          return result;
        }
      } catch (err) {
        console.warn(
          `[MeasurementDetector] ${detector.name} (${detector.id}) failed:`,
          err
        );
        // Continue to next detector
      }
    }

    return null;
  }
}

/**
 * Create the default detector registry with all available detectors.
 * ML detector is registered but returns null until a model is loaded.
 * Threshold detector is the reliable fallback.
 */
export async function createDefaultDetectorRegistry(): Promise<ObjectDetectorRegistry> {
  const registry = new ObjectDetectorRegistry();

  // Import detectors dynamically to enable tree-shaking
  const { MLObjectDetector } = await import('./detectors/ml-detector');
  const { ThresholdDetector } = await import('./detectors/threshold-detector');

  registry.register(new MLObjectDetector());
  registry.register(new ThresholdDetector());

  return registry;
}
