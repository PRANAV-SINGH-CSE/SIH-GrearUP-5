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

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        throw new AppError('MISSING_FILE', 'No image file provided in form-data.', 400);
      }

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      filename = file.name || 'upload.jpg';
      mimeType = file.type || 'image/jpeg';

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
    } else if (contentType.includes('application/json')) {
      const json = await request.json();
      if (!json.image) {
        throw new AppError('MISSING_IMAGE', 'Base64 image string is required.', 400);
      }

      // Handle data URL prefix: data:image/png;base64,...
      const base64Data = json.image.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
      filename = json.filename || 'upload.jpg';
      mimeType = json.mimeType || 'image/jpeg';
      category = json.category || category;
      rulesetVersion = json.rulesetVersion || rulesetVersion;
      offlineClientId = json.offlineClientId;
      locale = json.locale === 'hi' ? 'hi' : 'en';
      userId = json.userId;
      userEmail = json.userEmail;
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
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
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
