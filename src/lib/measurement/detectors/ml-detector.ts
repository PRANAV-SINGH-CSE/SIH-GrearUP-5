/**
 * CompliScan — ML Object Detector (Stub / Architecture Placeholder)
 *
 * Primary detector (priority: 10) — tried BEFORE classical CV.
 * Currently returns null (not ready) until a browser-compatible ML model
 * is loaded (ONNX Runtime Web, TensorFlow.js, or custom WASM).
 *
 * When a model becomes available, this detector will:
 *   1. Run the image through the segmentation/detection model
 *   2. Return precise object boundaries with contour-level accuracy
 *   3. Override the threshold detector's bounding-box approximation
 *
 * The architecture is ready — only the model loading and inference
 * code needs to be implemented when a suitable model is selected.
 */

import type { IObjectDetector, DetectedObject } from '../measurement.types';

export class MLObjectDetector implements IObjectDetector {
  readonly id = 'ml-segmentation';
  readonly name = 'ML Segmentation Model';
  readonly priority = 10; // tried first when available

  private modelLoaded = false;

  /**
   * Returns true only when a browser-compatible ML model is loaded.
   * Until then, the detector registry skips this detector and falls
   * through to the ThresholdDetector.
   */
  async isReady(): Promise<boolean> {
    return this.modelLoaded;
  }

  /**
   * Run ML-based object detection / instance segmentation.
   *
   * TODO: When implementing, the model should:
   *   - Accept an ImageData of the rectified reference region
   *   - Return a segmentation mask or bounding box + contour
   *   - Report confidence from the model's output logits
   *   - Set boundaryType to 'contour' if mask-based, 'bounding_box' if box-based
   */
  async detect(
    _imageData: ImageData,
    _regionWidthMm: number,
    _regionHeightMm: number
  ): Promise<DetectedObject | null> {
    // Model not loaded — return null so the registry falls through
    // to the next detector (ThresholdDetector)
    return null;
  }

  /**
   * Load a browser-compatible ML model.
   * Call this method when a model becomes available.
   *
   * Example future implementation:
   *   async loadModel(modelUrl: string): Promise<void> {
   *     const ort = await import('onnxruntime-web');
   *     this.session = await ort.InferenceSession.create(modelUrl);
   *     this.modelLoaded = true;
   *   }
   */
  async loadModel(_modelUrl: string): Promise<void> {
    // Placeholder — implement when a suitable model is selected
    console.info('[MLObjectDetector] Model loading not yet implemented. Using fallback detector.');
    this.modelLoaded = false;
  }
}
