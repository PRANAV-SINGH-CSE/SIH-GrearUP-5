import { NextRequest, NextResponse } from 'next/server';
import { getScanRepository } from '@/lib/repository/repository.factory';
import { getCompliScanPipeline } from '@/lib/pipeline/pipeline.factory';
import { handleApiError, AppError } from '@/lib/utils/errors';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let buffer: Buffer;
    let filename = 'upload.jpg';
    let mimeType = 'image/jpeg';
    let category = 'GENERIC_PACKAGED_COMMODITY';
    let rulesetVersion = 'LMPC-2011.v2026';
    let offlineClientId: string | undefined;
    let locale: 'en' | 'hi' = 'en';
    let userId: string | undefined;
    let userEmail: string | undefined;
    let measurementData: any = undefined;
    const additionalImages: Array<{ buffer: Buffer; filename: string; mimeType: string; label?: string }> = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const rawFileList: File[] = [];

      // Read all files from 'files' or 'file' form fields (up to 3 images)
      const filesParam = formData.getAll('files');
      if (filesParam.length > 0) {
        filesParam.forEach((item) => {
          if (item instanceof File) rawFileList.push(item);
        });
      }
      const fileParam = formData.getAll('file');
      if (fileParam.length > 0) {
        fileParam.forEach((item) => {
          if (item instanceof File && !rawFileList.some((f) => f.name === item.name && f.size === item.size)) {
            rawFileList.push(item);
          }
        });
      }

      if (rawFileList.length === 0) {
        throw new AppError('MISSING_FILE', 'No image file provided in form-data.', 400);
      }

      const primaryFile = rawFileList[0];
      const arrayBuffer = await primaryFile.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      filename = primaryFile.name || 'upload_front.jpg';
      mimeType = primaryFile.type || 'image/jpeg';

      // Capture up to 2 additional images (e.g. Back Panel, Side/MRP Panel)
      for (let i = 1; i < Math.min(3, rawFileList.length); i++) {
        const extraFile = rawFileList[i];
        const extraBuf = Buffer.from(await extraFile.arrayBuffer());
        const label = i === 1 ? 'Back Information Panel' : 'Side / MRP & Dates Panel';
        additionalImages.push({
          buffer: extraBuf,
          filename: extraFile.name || `panel_${i + 1}.jpg`,
          mimeType: extraFile.type || 'image/jpeg',
          label,
        });
      }

      if (formData.has('category')) {
        category = formData.get('category') as string;
      }
      if (formData.has('rulesetVersion')) {
        rulesetVersion = formData.get('rulesetVersion') as string;
      }
      if (formData.has('offlineClientId')) {
        offlineClientId = formData.get('offlineClientId') as string;
      }
      if (formData.has('locale')) {
        locale = (formData.get('locale') as string) === 'hi' ? 'hi' : 'en';
      }
      if (formData.has('userId')) {
        userId = formData.get('userId') as string;
      }
      if (formData.has('userEmail')) {
        userEmail = formData.get('userEmail') as string;
      }
      if (formData.has('measurementData')) {
        try {
          const rawM = formData.get('measurementData');
          if (typeof rawM === 'string') {
            measurementData = JSON.parse(rawM);
          }
        } catch {
          // Non-blocking parse error
        }
      }
    } else if (contentType.includes('application/json')) {
      const json = await request.json();
      const rawImages: string[] = [];
      if (Array.isArray(json.images) && json.images.length > 0) {
        rawImages.push(...json.images);
      } else if (json.image) {
        rawImages.push(json.image);
      }

      if (rawImages.length === 0) {
        throw new AppError('MISSING_IMAGE', 'Base64 image string is required.', 400);
      }

      // Handle data URL prefix: data:image/png;base64,...
      const base64Data = rawImages[0].replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
      filename = json.filename || 'upload_front.jpg';
      mimeType = json.mimeType || 'image/jpeg';

      for (let i = 1; i < Math.min(3, rawImages.length); i++) {
        const extraBase64 = rawImages[i].replace(/^data:image\/\w+;base64,/, '');
        const label = i === 1 ? 'Back Information Panel' : 'Side / MRP & Dates Panel';
        additionalImages.push({
          buffer: Buffer.from(extraBase64, 'base64'),
          filename: `panel_${i + 1}.jpg`,
          mimeType: json.mimeType || 'image/jpeg',
          label,
        });
      }

      category = json.category || category;
      rulesetVersion = json.rulesetVersion || rulesetVersion;
      offlineClientId = json.offlineClientId;
      locale = json.locale === 'hi' ? 'hi' : 'en';
      userId = json.userId;
      userEmail = json.userEmail;
      if (json.measurementData) {
        measurementData = json.measurementData;
      }
    } else {
      throw new AppError(
        'UNSUPPORTED_CONTENT_TYPE',
        'Request must be multipart/form-data or application/json',
        415
      );
    }

    const pipeline = getCompliScanPipeline();
    const result = await pipeline.processScan(buffer, filename, mimeType, {
      category,
      rulesetVersion,
      offlineClientId,
      locale,
      userId,
      userEmail,
      measurementData,
      additionalImages: additionalImages.length > 0 ? additionalImages : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.message && (error.message.includes('heif:') || error.message.includes('bad seek'))) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'IMAGE_DECODE_FAILED',
            message: 'Camera image format could not be processed directly. Please retake the photo or select JPEG/PNG.',
          },
        },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const repository = getScanRepository();
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const scans = await repository.listScans(limit, offset);

    return NextResponse.json({
      success: true,
      data: scans,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
