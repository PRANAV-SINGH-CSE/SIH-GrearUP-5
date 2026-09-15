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
      throw new AppError('SCAN_NOT_FOUND', `Scan not found: ${id}`, 404);
    }

    if (!scan.compliance) {
      throw new AppError('COMPLIANCE_NOT_EVALUATED', 'Compliance evaluation has not been performed for this scan yet.', 404);
    }

    return NextResponse.json({
      success: true,
      data: scan.compliance,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
