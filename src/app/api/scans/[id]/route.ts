import { NextRequest, NextResponse } from 'next/server';
import { getScanRepository } from '@/lib/repository/repository.factory';
import { handleApiError, AppError } from '@/lib/utils/errors';

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const repository = getScanRepository();
    const scan = await repository.getScanById(id);

    if (!scan) {
      throw new AppError('SCAN_NOT_FOUND', `Scan not found with id: ${id}`, 404);
    }

    return NextResponse.json({
      success: true,
      data: scan,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const repository = getScanRepository();
    const deleted = await repository.deleteScan(id);

    if (!deleted) {
      throw new AppError('SCAN_NOT_FOUND', `Scan not found or could not be deleted: ${id}`, 404);
    }

    return NextResponse.json({
      success: true,
      message: `Scan ${id} successfully deleted from records.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
