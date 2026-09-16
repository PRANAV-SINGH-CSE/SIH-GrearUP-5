'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Point2D,
  Quadrilateral,
  ReferenceConfig,
  REFERENCE_PRESETS,
  LensDistortionParams,
  MeasurementResult,
  MeasurementError,
  MeasurementMetadata,
  MeasurementStage,
  MEASUREMENT_STAGE_LABELS,
  BBox,
  ImageQualityAssessment,
} from '@/lib/measurement/measurement.types';
import { assessImageQuality } from '@/lib/measurement/image-quality';
import { validateCorners } from '@/lib/measurement/corner-validation';
import { MeasurementEngine, isMeasurementError } from '@/lib/measurement/measurement-engine';
import { drawMeasurementAnnotation } from '@/lib/measurement/annotator';

export interface MeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  onComplete: (metadata: MeasurementMetadata, annotatedDataUrl?: string) => void;
}

type Step = 'quality' | 'reference' | 'detection' | 'results';

export function MeasurementModal({
  isOpen,
  onClose,
  imageFile,
  onComplete,
}: MeasurementModalProps) {
  // Navigation & Pipeline State
  const [currentStep, setCurrentStep] = useState<Step>('quality');
  const [currentStage, setCurrentStage] = useState<MeasurementStage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Loaded Image
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgDims, setImgDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Step 1: Quality
  const [qualityAssessment, setQualityAssessment] = useState<ImageQualityAssessment | null>(null);

  // Step 2: Reference Corners & Dimensions
  const [corners, setCorners] = useState<Quadrilateral>({
    topLeft: { x: 50, y: 50 },
    topRight: { x: 300, y: 50 },
    bottomRight: { x: 300, y: 250 },
    bottomLeft: { x: 50, y: 250 },
  });
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [referenceConfig, setReferenceConfig] = useState<ReferenceConfig>({
    widthMm: REFERENCE_PRESETS[0].widthMm,
    heightMm: REFERENCE_PRESETS[0].heightMm,
    label: REFERENCE_PRESETS[0].label,
  });
  const [cornerFeedback, setCornerFeedback] = useState<{
    valid: boolean;
    errors: MeasurementError[];
    estimatedAngleDeg: number;
  } | null>(null);

  // Lens Distortion (Optional)
  const [enableLensDistortion, setEnableLensDistortion] = useState(false);
  const [lensParams, setLensParams] = useState<LensDistortionParams>({
    k1: -0.05,
    k2: 0.001,
    cx: 0.5,
    cy: 0.5,
  });

  // Step 3: Object Detection & Manual Adjustment
  const [measurementResult, setMeasurementResult] = useState<MeasurementResult | null>(null);
  const [objectBoundary, setObjectBoundary] = useState<BBox | null>(null);
  const [isManualAdjusted, setIsManualAdjusted] = useState(false);

  // Step 4: Annotation Canvas & Result
  const annotCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Container dimensions for responsive SVG handle mapping
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewTransform, setViewTransform] = useState<{ scale: number; offsetX: number; offsetY: number }>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  // Dragging state for reference corners
  const [activeCorner, setActiveCorner] = useState<keyof Quadrilateral | null>(null);

  // Dragging/resizing state for object bbox in Step 3
  const [activeBBoxHandle, setActiveBBoxHandle] = useState<string | null>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; origBox: BBox }>({
    startX: 0,
    startY: 0,
    origBox: { x: 0, y: 0, width: 0, height: 0 },
  });

  // -------------------------------------------------------------------------
  // Load Image when imageFile changes or modal opens
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !imageFile) return;

    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageElement(img);
      setImgDims({ width: img.naturalWidth, height: img.naturalHeight });

      // Initialize default corners inside the center 60% of the image
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const padX = w * 0.2;
      const padY = h * 0.2;

      const initialCorners: Quadrilateral = {
        topLeft: { x: Math.round(padX), y: Math.round(padY) },
        topRight: { x: Math.round(w - padX), y: Math.round(padY) },
        bottomRight: { x: Math.round(w - padX), y: Math.round(h - padY) },
        bottomLeft: { x: Math.round(padX), y: Math.round(h - padY) },
      };
      setCorners(initialCorners);

      // Run initial quality assessment automatically
      const quality = assessImageQuality(img);
      setQualityAssessment(quality);
      setCurrentStep('quality');
      setGeneralError(null);
      setMeasurementResult(null);
      setObjectBoundary(null);
      setIsManualAdjusted(false);
    };

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [isOpen, imageFile]);

  // -------------------------------------------------------------------------
  // Compute Viewport Scale for Corner Handles
  // -------------------------------------------------------------------------
  const updateTransform = useCallback(() => {
    if (!containerRef.current || imgDims.width === 0 || imgDims.height === 0) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    const scale = Math.min(clientWidth / imgDims.width, clientHeight / imgDims.height);
    const offsetX = (clientWidth - imgDims.width * scale) / 2;
    const offsetY = (clientHeight - imgDims.height * scale) / 2;

    setViewTransform({ scale, offsetX, offsetY });
  }, [imgDims]);

  useEffect(() => {
    updateTransform();
    window.addEventListener('resize', updateTransform);
    return () => window.removeEventListener('resize', updateTransform);
  }, [updateTransform, currentStep]);

  // Real-time corner validation update
  useEffect(() => {
    if (imgDims.width > 0 && imgDims.height > 0) {
      const fb = validateCorners(corners, imgDims.width, imgDims.height, referenceConfig);
      setCornerFeedback(fb);
    }
  }, [corners, imgDims, referenceConfig]);

  // -------------------------------------------------------------------------
  // Coordinate transformations
  // -------------------------------------------------------------------------
  const imgToScreen = (pt: Point2D): Point2D => ({
    x: pt.x * viewTransform.scale + viewTransform.offsetX,
    y: pt.y * viewTransform.scale + viewTransform.offsetY,
  });

  const screenToImg = (screenX: number, screenY: number): Point2D => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const relX = screenX - rect.left - viewTransform.offsetX;
    const relY = screenY - rect.top - viewTransform.offsetY;
    const imgX = Math.max(0, Math.min(imgDims.width, Math.round(relX / viewTransform.scale)));
    const imgY = Math.max(0, Math.min(imgDims.height, Math.round(relY / viewTransform.scale)));
    return { x: imgX, y: imgY };
  };

  // -------------------------------------------------------------------------
  // Corner Dragging Handlers (Pointer Events)
  // -------------------------------------------------------------------------
  const handleCornerPointerDown = (e: React.PointerEvent, cornerKey: keyof Quadrilateral) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveCorner(cornerKey);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activeCorner) {
      const newPt = screenToImg(e.clientX, e.clientY);
      setCorners((prev) => ({
        ...prev,
        [activeCorner]: newPt,
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeCorner) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }
      setActiveCorner(null);
    }
  };

  // -------------------------------------------------------------------------
  // Preset Selection
  // -------------------------------------------------------------------------
  const handlePresetSelect = (idx: number) => {
    setSelectedPresetIndex(idx);
    if (idx < REFERENCE_PRESETS.length) {
      const p = REFERENCE_PRESETS[idx];
      setReferenceConfig({
        widthMm: p.widthMm,
        heightMm: p.heightMm,
        label: p.label,
      });
    }
  };

  // -------------------------------------------------------------------------
  // Step Actions
  // -------------------------------------------------------------------------
  const handleProceedFromQuality = () => {
    setCurrentStep('reference');
  };

  // Run Measurement Pipeline (Compute Homography + Detect Object)
  const handleCalibrateAndDetect = async () => {
    if (!imageElement) return;
    setIsProcessing(true);
    setGeneralError(null);

    const engine = new MeasurementEngine((stage) => {
      setCurrentStage(stage);
    });

    const res = await engine.measure(imageElement, corners, referenceConfig, {
      lensDistortion: enableLensDistortion ? lensParams : undefined,
    });

    setIsProcessing(false);

    if (isMeasurementError(res)) {
      setGeneralError(`${res.message} — ${res.suggestion}`);
    } else {
      setMeasurementResult(res);
      setObjectBoundary(res.detection.boundingBox);
      setIsManualAdjusted(false);
      setCurrentStep('detection');
    }
  };

  // Recalculate with manual bbox in Step 3
  const handleFinalizeMeasurement = async () => {
    if (!imageElement || !objectBoundary) return;
    setIsProcessing(true);
    setGeneralError(null);

    const engine = new MeasurementEngine((stage) => {
      setCurrentStage(stage);
    });

    const res = await engine.measure(imageElement, corners, referenceConfig, {
      lensDistortion: enableLensDistortion ? lensParams : undefined,
      manualObjectBoundary: isManualAdjusted ? objectBoundary : undefined,
    });

    setIsProcessing(false);

    if (isMeasurementError(res)) {
      setGeneralError(`${res.message} — ${res.suggestion}`);
    } else {
      setMeasurementResult(res);
      setCurrentStep('results');
    }
  };

  // Render Canvas Annotation in Results step
  useEffect(() => {
    if (currentStep === 'results' && measurementResult && measurementResult.rectifiedImageDataUrl) {
      const rectImg = new Image();
      rectImg.onload = () => {
        if (annotCanvasRef.current) {
          drawMeasurementAnnotation(annotCanvasRef.current, measurementResult, rectImg);
        }
      };
      rectImg.src = measurementResult.rectifiedImageDataUrl;
    }
  }, [currentStep, measurementResult]);

  // Submit to Scan Flow
  const handleApplyToScan = () => {
    if (!measurementResult) return;

    const pdpBoundingArea =
      Math.round(measurementResult.boundingWidth.valueMm * measurementResult.boundingHeight.valueMm * 10) / 10;
    const pdpContourArea =
      measurementResult.contourWidth && measurementResult.contourHeight
        ? Math.round(measurementResult.contourWidth.valueMm * measurementResult.contourHeight.valueMm * 10) / 10
        : undefined;

    const metadata: MeasurementMetadata = {
      pdpBoundingWidthMm: measurementResult.boundingWidth.valueMm,
      pdpBoundingHeightMm: measurementResult.boundingHeight.valueMm,
      pdpBoundingAreaMm2: pdpBoundingArea,
      pdpContourWidthMm: measurementResult.contourWidth?.valueMm,
      pdpContourHeightMm: measurementResult.contourHeight?.valueMm,
      pdpContourAreaMm2: pdpContourArea,
      widthErrorMm: measurementResult.boundingWidth.estimatedErrorMm,
      heightErrorMm: measurementResult.boundingHeight.estimatedErrorMm,
      qualityGrade: measurementResult.quality.grade,
      boundaryType: measurementResult.detection.boundaryType,
      coplanarityAssumed: true,
      disclaimer: measurementResult.disclaimer,
    };

    const annotatedDataUrl = annotCanvasRef.current?.toDataURL('image/jpeg', 0.9);
    onComplete(metadata, annotatedDataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 text-white flex flex-col items-center justify-between p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      {/* Top Header */}
      <header className="w-full max-w-4xl flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
            📏
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              Physical Measurement & Calibration
              <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                LMPC Schedule I
              </span>
            </h2>
            <p className="text-xs text-slate-400 hidden sm:block">
              Calibrated reference dimension analysis with uncertainty estimation
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className={`px-2 py-1 rounded-md ${currentStep === 'quality' ? 'bg-blue-600 font-bold' : 'bg-white/10 text-slate-400'}`}>1. Quality</span>
          <span className="text-slate-600">→</span>
          <span className={`px-2 py-1 rounded-md ${currentStep === 'reference' ? 'bg-blue-600 font-bold' : 'bg-white/10 text-slate-400'}`}>2. Reference</span>
          <span className="text-slate-600">→</span>
          <span className={`px-2 py-1 rounded-md ${currentStep === 'detection' ? 'bg-blue-600 font-bold' : 'bg-white/10 text-slate-400'}`}>3. Object</span>
          <span className="text-slate-600">→</span>
          <span className={`px-2 py-1 rounded-md ${currentStep === 'results' ? 'bg-blue-600 font-bold' : 'bg-white/10 text-slate-400'}`}>4. Results</span>

          <button
            type="button"
            onClick={onClose}
            className="ml-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
            title="Cancel"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="relative w-full max-w-4xl flex-1 my-3 flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-slate-900 border border-white/10">
        {/* Loading / Stage Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping" />
              <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm font-semibold text-blue-200">
              {currentStage ? MEASUREMENT_STAGE_LABELS[currentStage] : 'Processing measurement...'}
            </p>
          </div>
        )}

        {/* Global Error Banner */}
        {generalError && (
          <div className="absolute top-3 left-3 right-3 z-20 bg-red-950/90 border border-red-500/40 text-red-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-lg">
            <span>{generalError}</span>
            <button
              onClick={() => setGeneralError(null)}
              className="text-red-400 hover:text-white ml-2 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* ===================================================================== */}
        {/* STEP 1: IMAGE QUALITY ASSESSMENT                                      */}
        {/* ===================================================================== */}
        {currentStep === 'quality' && (
          <div className="w-full h-full p-4 sm:p-6 flex flex-col md:flex-row items-center gap-6 overflow-y-auto">
            {/* Image Preview Thumbnail */}
            <div className="w-full md:w-1/2 max-h-72 md:max-h-full flex items-center justify-center bg-black/40 rounded-xl overflow-hidden border border-white/10 p-2">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Captured commodity"
                  className="max-h-64 md:max-h-80 object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="text-slate-500 text-sm">No image available</div>
              )}
            </div>

            {/* Quality Score Breakdown */}
            <div className="w-full md:w-1/2 flex flex-col space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Pre-Measurement Quality Gate</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Validates optical sharpness, resolution, and exposure before computing homography.
                </p>
              </div>

              {qualityAssessment ? (
                <div className="space-y-2.5 text-xs bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-slate-400">Resolution</span>
                    <span className="font-mono text-white font-semibold">
                      {qualityAssessment.resolution.width} × {qualityAssessment.resolution.height} px
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-slate-400">Blur Metric (Laplacian Var)</span>
                    <span className={`font-mono font-semibold ${qualityAssessment.blurScore < 0.6 ? 'text-green-400' : 'text-amber-400'}`}>
                      {qualityAssessment.blurScore < 0.6 ? '✓ Sharp' : '⚠ Borderline Blur'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-slate-400">Exposure / Lighting</span>
                    <span className="font-mono text-white font-semibold">
                      {qualityAssessment.brightnessScore > 0.85
                        ? 'Overexposed'
                        : qualityAssessment.brightnessScore < 0.15
                        ? 'Underexposed'
                        : '✓ Balanced'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Overall Assessment</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        qualityAssessment.acceptable
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {qualityAssessment.acceptable ? 'ACCEPTABLE FOR MEASUREMENT' : 'REJECTED — INSUFFICIENT QUALITY'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-xs">Analyzing image quality…</div>
              )}

              {qualityAssessment && !qualityAssessment.acceptable && (
                <div className="bg-amber-950/50 border border-amber-500/30 text-amber-200 text-xs p-3 rounded-xl">
                  <strong>Notice:</strong> {qualityAssessment.errors[0]?.message}
                  <div className="mt-1 text-slate-300">{qualityAssessment.errors[0]?.suggestion}</div>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
                >
                  Retake Photo
                </button>
                <button
                  type="button"
                  onClick={handleProceedFromQuality}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors cursor-pointer shadow-md"
                >
                  Proceed to Calibration &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* STEP 2: REFERENCE CALIBRATION (Drag 4 Corners)                         */}
        {/* ===================================================================== */}
        {currentStep === 'reference' && (
          <div className="relative w-full h-full flex flex-col">
            {/* Top Toolbar for Reference selection */}
            <div className="px-4 py-2 bg-slate-950/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
              <div className="flex items-center gap-2">
                <label className="text-slate-400 font-medium">Reference Preset:</label>
                <select
                  value={selectedPresetIndex}
                  onChange={(e) => handlePresetSelect(Number(e.target.value))}
                  className="bg-slate-800 text-white rounded-lg px-2.5 py-1.5 border border-white/20 focus:outline-none focus:border-blue-500"
                >
                  {REFERENCE_PRESETS.map((p, i) => (
                    <option key={p.label} value={i}>
                      {p.label} ({p.widthMm} × {p.heightMm} mm)
                    </option>
                  ))}
                  <option value={REFERENCE_PRESETS.length}>Custom Dimensions…</option>
                </select>
              </div>

              {selectedPresetIndex === REFERENCE_PRESETS.length && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="W (mm)"
                    value={referenceConfig.widthMm}
                    onChange={(e) =>
                      setReferenceConfig((prev) => ({ ...prev, widthMm: parseFloat(e.target.value) || 100 }))
                    }
                    className="w-18 bg-slate-800 text-white rounded px-2 py-1 border border-white/20 text-center font-mono"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    placeholder="H (mm)"
                    value={referenceConfig.heightMm}
                    onChange={(e) =>
                      setReferenceConfig((prev) => ({ ...prev, heightMm: parseFloat(e.target.value) || 100 }))
                    }
                    className="w-18 bg-slate-800 text-white rounded px-2 py-1 border border-white/20 text-center font-mono"
                  />
                  <span>mm</span>
                </div>
              )}

              {/* Corner status feedback */}
              <div className="flex items-center gap-2">
                {cornerFeedback && (
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      cornerFeedback.valid
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {cornerFeedback.valid
                      ? `✓ Quad Valid (~${Math.round(cornerFeedback.estimatedAngleDeg)}° angle)`
                      : cornerFeedback.errors[0]?.code}
                  </span>
                )}
              </div>
            </div>

            {/* Interactive Canvas/SVG Viewport */}
            <div
              ref={containerRef}
              className="relative flex-1 w-full h-full overflow-hidden select-none touch-none bg-black flex items-center justify-center"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Reference Quad alignment"
                  className="pointer-events-none max-w-full max-h-full object-contain"
                  style={{
                    width: imgDims.width * viewTransform.scale,
                    height: imgDims.height * viewTransform.scale,
                  }}
                />
              )}

              {/* SVG Polygon & Handles Overlay */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ width: '100%', height: '100%' }}
              >
                {/* Reference Quadrilateral Polygon */}
                {(() => {
                  const tl = imgToScreen(corners.topLeft);
                  const tr = imgToScreen(corners.topRight);
                  const br = imgToScreen(corners.bottomRight);
                  const bl = imgToScreen(corners.bottomLeft);
                  return (
                    <>
                      <polygon
                        points={`${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`}
                        fill="rgba(59, 130, 246, 0.18)"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        strokeDasharray="6 4"
                      />
                      {/* Edge lines */}
                      <line x1={tl.x} y1={tl.y} x2={tr.x} y2={tr.y} stroke="#60a5fa" strokeWidth="2" />
                      <line x1={tr.x} y1={tr.y} x2={br.x} y2={br.y} stroke="#60a5fa" strokeWidth="2" />
                      <line x1={br.x} y1={br.y} x2={bl.x} y2={bl.y} stroke="#60a5fa" strokeWidth="2" />
                      <line x1={bl.x} y1={bl.y} x2={tl.x} y2={tl.y} stroke="#60a5fa" strokeWidth="2" />
                    </>
                  );
                })()}
              </svg>

              {/* Draggable Corner Handles (44px touch targets) */}
              {(['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as (keyof Quadrilateral)[]).map((key) => {
                const pt = imgToScreen(corners[key]);
                const labelMap: Record<keyof Quadrilateral, string> = {
                  topLeft: 'TL',
                  topRight: 'TR',
                  bottomRight: 'BR',
                  bottomLeft: 'BL',
                };
                return (
                  <div
                    key={key}
                    onPointerDown={(e) => handleCornerPointerDown(e, key)}
                    style={{
                      left: `${pt.x}px`,
                      top: `${pt.y}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute w-11 h-11 flex items-center justify-center cursor-grab active:cursor-grabbing z-20 transition-transform ${
                      activeCorner === key ? 'scale-125' : 'hover:scale-110'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center">
                      <span className="text-[8px] font-black text-white">{labelMap[key]}</span>
                    </div>
                  </div>
                );
              })}

              {/* Hint badge */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/20 text-[11px] text-slate-300 pointer-events-none">
                Drag the 4 corner pins to align with your reference card/area
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="p-3 bg-slate-950/80 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEnableLensDistortion(!enableLensDistortion)}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                {enableLensDistortion ? 'Hide Lens Distortion' : 'Advanced: Lens Distortion'}
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('quality')}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={handleCalibrateAndDetect}
                  disabled={Boolean(cornerFeedback && !cornerFeedback.valid)}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white cursor-pointer shadow-md transition-all"
                >
                  Calibrate & Detect Object &rarr;
                </button>
              </div>
            </div>

            {/* Expandable Lens Distortion Settings */}
            {enableLensDistortion && (
              <div className="p-3 bg-slate-900 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Radial k1:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={lensParams.k1}
                    onChange={(e) => setLensParams({ ...lensParams, k1: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 rounded px-2 py-1 text-white border border-white/20"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Radial k2:</label>
                  <input
                    type="number"
                    step="0.001"
                    value={lensParams.k2}
                    onChange={(e) => setLensParams({ ...lensParams, k2: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 rounded px-2 py-1 text-white border border-white/20"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Optical Center X:</label>
                  <input
                    type="number"
                    step="0.05"
                    value={lensParams.cx}
                    onChange={(e) => setLensParams({ ...lensParams, cx: parseFloat(e.target.value) || 0.5 })}
                    className="w-full bg-slate-800 rounded px-2 py-1 text-white border border-white/20"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Optical Center Y:</label>
                  <input
                    type="number"
                    step="0.05"
                    value={lensParams.cy}
                    onChange={(e) => setLensParams({ ...lensParams, cy: parseFloat(e.target.value) || 0.5 })}
                    className="w-full bg-slate-800 rounded px-2 py-1 text-white border border-white/20"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* STEP 3: OBJECT DETECTION & MANUAL CORRECTION                           */}
        {/* ===================================================================== */}
        {currentStep === 'detection' && measurementResult && (
          <div className="relative w-full h-full flex flex-col">
            <div className="px-4 py-2.5 bg-slate-950/80 border-b border-white/10 flex items-center justify-between text-xs z-10">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Detected Object Boundary:</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  {isManualAdjusted ? 'User Adjusted' : measurementResult.detection.boundaryType}
                </span>
                <span className="text-slate-400">
                  Confidence: {Math.round(measurementResult.detection.detectionConfidence * 100)}%
                </span>
              </div>
              <span className="text-slate-400 hidden sm:inline">
                Drag handles to fine-tune the object boundary if needed
              </span>
            </div>

            {/* Rectified Image & Bounding Box View */}
            <div className="relative flex-1 w-full h-full overflow-hidden bg-black flex items-center justify-center p-4">
              {measurementResult.rectifiedImageDataUrl ? (
                <div className="relative max-w-full max-h-full border border-white/20 rounded shadow-lg overflow-hidden">
                  <img
                    src={measurementResult.rectifiedImageDataUrl}
                    alt="Rectified Reference Area"
                    className="max-h-[60vh] object-contain block"
                  />
                  {/* BBox visualization over the image */}
                  {objectBoundary && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${(objectBoundary.x / (measurementResult.boundingWidth.valueMm / measurementResult.calibration.scaleXMmPerPx)) * 100}%`,
                        top: `${(objectBoundary.y / (measurementResult.boundingHeight.valueMm / measurementResult.calibration.scaleYMmPerPx)) * 100}%`,
                      }}
                      className="border-2 border-emerald-400 bg-emerald-500/15 pointer-events-none"
                    />
                  )}
                </div>
              ) : (
                <div className="text-slate-400 text-xs">Generating rectified preview…</div>
              )}
            </div>

            {/* Dimension Preview Bar */}
            <div className="p-3 bg-slate-950/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-400">Estimated Width: </span>
                  <span className="font-mono font-bold text-white">
                    {measurementResult.boundingWidth.valueMm.toFixed(1)} ± {measurementResult.boundingWidth.estimatedErrorMm.toFixed(1)} mm
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Estimated Height: </span>
                  <span className="font-mono font-bold text-white">
                    {measurementResult.boundingHeight.valueMm.toFixed(1)} ± {measurementResult.boundingHeight.estimatedErrorMm.toFixed(1)} mm
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('reference')}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold"
                >
                  &larr; Re-align Reference
                </button>
                <button
                  type="button"
                  onClick={handleFinalizeMeasurement}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white cursor-pointer shadow-md"
                >
                  Confirm & View Results &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* STEP 4: RESULTS & ANNOTATED CANVAS                                    */}
        {/* ===================================================================== */}
        {currentStep === 'results' && measurementResult && (
          <div className="w-full h-full p-4 sm:p-6 flex flex-col md:flex-row items-center gap-6 overflow-y-auto">
            {/* Left: Annotated Canvas Display */}
            <div className="w-full md:w-1/2 flex items-center justify-center bg-black/60 rounded-xl overflow-hidden border border-white/10 p-2">
              <canvas
                ref={annotCanvasRef}
                className="max-h-64 sm:max-h-80 md:max-h-96 w-auto object-contain rounded shadow-lg"
              />
            </div>

            {/* Right: Detailed Metric Table & Statutory Warnings */}
            <div className="w-full md:w-1/2 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Measurement Results</h3>
                  <p className="text-xs text-slate-400">Calibrated dimensions with ± RSS uncertainty</p>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    measurementResult.quality.grade === 'HIGH'
                      ? 'bg-green-500/20 text-green-300 border-green-500/30'
                      : measurementResult.quality.grade === 'ACCEPTABLE'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  Grade: {measurementResult.quality.grade}
                </div>
              </div>

              {/* Measurements Table */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-300">Object Bounding Width</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {measurementResult.boundingWidth.valueMm.toFixed(1)} ± {measurementResult.boundingWidth.estimatedErrorMm.toFixed(1)} mm
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-300">Object Bounding Height</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {measurementResult.boundingHeight.valueMm.toFixed(1)} ± {measurementResult.boundingHeight.estimatedErrorMm.toFixed(1)} mm
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-300">Estimated PDP Area</span>
                  <span className="font-mono font-bold text-white">
                    {(
                      (measurementResult.boundingWidth.valueMm * measurementResult.boundingHeight.valueMm) /
                      100
                    ).toFixed(2)}{' '}
                    cm²
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Edge Distances (T / B / L / R)</span>
                  <span className="font-mono text-slate-300">
                    {measurementResult.distanceTop.valueMm.toFixed(0)} / {measurementResult.distanceBottom.valueMm.toFixed(0)} /{' '}
                    {measurementResult.distanceLeft.valueMm.toFixed(0)} / {measurementResult.distanceRight.valueMm.toFixed(0)} mm
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Homography Residual Error</span>
                  <span className="font-mono text-slate-400">
                    {measurementResult.calibration.reprojectionErrorPx.toFixed(2)} px
                  </span>
                </div>
              </div>

              {/* Mandatory Statutory Notice */}
              <div className="bg-blue-950/40 border border-blue-500/20 text-slate-300 text-[11px] p-3 rounded-xl leading-relaxed space-y-1">
                <div className="font-bold text-blue-300 flex items-center gap-1.5">
                  <span>⚖ Coplanarity & Technical Disclaimer:</span>
                </div>
                <p>
                  Measurements assume the commodity and reference marker lie on the same plane. Legal verification
                  under the Legal Metrology Act requires physical inspection with certified instruments.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('detection')}
                  className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
                >
                  Adjust
                </button>
                <button
                  type="button"
                  onClick={handleApplyToScan}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <span>Attach to Compliance Scan</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
