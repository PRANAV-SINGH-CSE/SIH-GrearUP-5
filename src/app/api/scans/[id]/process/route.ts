import { NextRequest, NextResponse } from 'next/server';
import { getScanRepository } from '@/lib/repository/repository.factory';
import { getStorageProvider } from '@/lib/storage/storage.factory';
import { getCompliScanPipeline } from '@/lib/pipeline/pipeline.factory';
import { handleApiError, AppError } from '@/lib/utils/errors';

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const repository = getScanRepository();
    const scan = await repository.getScanById(id);

    if (!scan) {
      throw new AppError('SCAN_NOT_FOUND', `Scan not found: ${id}`, 404);
    }

    if (!scan.asset) {
      throw new AppError('ASSET_NOT_FOUND', 'No asset associated with this scan to process.', 400);
    }

    const storage = getStorageProvider();
    const imageBuffer = await storage.get(scan.asset.originalUrl);

    let category = scan.category;
    let rulesetVersion = scan.rulesetVersion;
    let locale: 'en' | 'hi' = 'en';

    try {
      const body = await request.json();
      if (body.category) category = body.category;
      if (body.rulesetVersion) rulesetVersion = body.rulesetVersion;
      if (body.locale === 'hi') locale = 'hi';
    } catch {
      // Body optional
    }

    const pipeline = getCompliScanPipeline();
    const result = await pipeline.processScan(
      imageBuffer,
      'reprocess.jpg',
      scan.asset.mimeType,
      {
        category,
        rulesetVersion,
        offlineClientId: scan.offlineClientId,
        locale,
      }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
