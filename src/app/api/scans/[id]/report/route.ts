import { NextRequest, NextResponse } from 'next/server';
import { getScanRepository } from '@/lib/repository/repository.factory';
import { ReportService } from '@/lib/reports/report.service';
import { handleApiError, AppError } from '@/lib/utils/errors';

export async function GET(
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

    if (!scan.compliance || !scan.extraction) {
      throw new AppError(
        'SCAN_INCOMPLETE',
        'Compliance evaluation has not been completed for this scan yet.',
        400
      );
    }

    const url = new URL(request.url);
    const lang = url.searchParams.get('lang') === 'hi' ? 'hi' : 'en';
    const format = url.searchParams.get('format') || 'json';

    const report = ReportService.generateReport(scan, lang);

    if (format === 'html') {
      const html = ReportService.generateHtmlReport(report);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
