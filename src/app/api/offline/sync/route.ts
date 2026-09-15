import { NextRequest, NextResponse } from 'next/server';
import { getScanRepository } from '@/lib/repository/repository.factory';
import { OfflineSyncService } from '@/lib/offline/sync.service';
import { OfflineSyncBatchRequestSchema } from '@/lib/offline/offline.interface';
import { handleApiError, AppError } from '@/lib/utils/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = OfflineSyncBatchRequestSchema.safeParse(body);

    if (!parseResult.success) {
      throw new AppError(
        'INVALID_SYNC_PAYLOAD',
        'Offline sync batch payload failed validation.',
        400,
        parseResult.error.flatten()
      );
    }

    const repository = getScanRepository();
    const syncService = new OfflineSyncService(repository);
    const response = await syncService.processSyncBatch(parseResult.data);

    return NextResponse.json({
      success: response.success,
      data: response,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
