import { v4 as uuidv4 } from 'uuid';
import { ScanDetail } from '../types/scan';
import { ComplianceReport } from '../types/report';
import { TranslatorService } from '../i18n/translator.service';
import { STATUTORY_LEGAL_DISCLAIMER } from './disclaimer';

export class ReportService {
  /**
   * Generates a comprehensive, audit-ready compliance report in the requested locale.
   */
  static generateReport(scan: ScanDetail, locale: 'en' | 'hi' = 'en'): ComplianceReport {
    if (!scan.compliance || !scan.extraction) {
      throw new Error(`Scan ${scan.id} has not completed compliance evaluation yet.`);
    }

    const { compliance, extraction } = scan;

    const localize = (evaluations: any[]) =>
      evaluations.map((ev) => TranslatorService.localizeEvaluation(ev, locale));

    const reportId = `REP-${uuidv4().substring(0, 8).toUpperCase()}`;
    const generatedAt = new Date().toISOString();

    const mfgOrPacker =
      extraction.manufacturer?.value?.name ||
      extraction.packer?.value?.name ||
      extraction.importer?.value?.name ||
      null;

    return {
      reportId,
      scanId: scan.id,
      generatedAt,
      locale,
      productInformation: {
        productName: extraction.productName?.value,
        genericName: extraction.genericName?.value,
        category: scan.category,
        manufacturerOrPacker: mfgOrPacker,
      },
      overallStatus: compliance.overallStatus,
      statusExplanation: TranslatorService.getStatusExplanation(compliance.overallStatus, locale),
      rulesetVersion: compliance.rulesetVersion,
      extractedDeclarations: extraction,
      findings: {
        passed: localize(compliance.passedChecks),
        violations: localize(compliance.violations),
        warnings: localize(compliance.warnings),
        unverifiable: localize(compliance.unverifiableChecks),
        notApplicable: localize(compliance.notApplicableChecks),
      },
      metadata: {
        ocrProvider: scan.ocrResult?.provider || 'mock',
        ocrConfidence: scan.ocrResult?.confidence || 0,
        aiProvider: extraction.extractionMethod,
        extractionMethod: extraction.extractionMethod,
        imageQualityScore: scan.asset?.qualityScore,
        imageQualityWarning: scan.asset?.qualityWarning,
        processingDurationMs: scan.ocrResult?.durationMs,
      },
      pdpApproximation: (compliance as any)?.pdpApproximation || (scan as any)?.pdpApproximation,
      legalDisclaimer: STATUTORY_LEGAL_DISCLAIMER[locale],
    };
  }

  /**
   * Formats the report as a clean printable HTML document.
   */
  static generateHtmlReport(report: ComplianceReport): string {
    const statusColor =
      report.overallStatus === 'COMPLIANT'
        ? '#15803d'
        : report.overallStatus === 'NON_COMPLIANT'
        ? '#b91c1c'
        : report.overallStatus === 'COMPLIANT_WITH_WARNINGS'
        ? '#b45309'
        : '#4338ca';

    const renderItems = (items: any[], title: string, color: string) => {
      if (items.length === 0) return '';
      return `
        <div style="margin-top: 20px;">
          <h3 style="color: ${color}; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">${title} (${items.length})</h3>
          <ul style="list-style-type: none; padding-left: 0;">
            ${items
              .map(
                (item) => `
              <li style="margin-bottom: 12px; padding: 12px; background-color: #f9fafb; border-left: 4px solid ${color}; border-radius: 4px;">
                <div style="font-weight: 600;">${item.name} <span style="font-size: 0.85em; color: #6b7280;">(${item.ruleId})</span></div>
                <div style="font-size: 0.9em; color: #374151; margin-top: 4px;">${item.localizedExplanation}</div>
                ${item.evidenceText ? `<div style="font-size: 0.85em; color: #4b5563; margin-top: 4px;"><em>Evidence:</em> "${item.evidenceText}"</div>` : ''}
                <div style="font-size: 0.8em; color: #9ca3af; margin-top: 4px;">Source: ${item.legalReference}</div>
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
      `;
    };

    return `
      <!DOCTYPE html>
      <html lang="${report.locale}">
      <head>
        <meta charset="utf-8" />
        <title>CompliScan Report — ${report.reportId}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #111827; max-width: 800px; margin: 0 auto; padding: 32px 16px; }
          .header { border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 24px; }
          .status-badge { display: inline-block; padding: 6px 16px; color: white; background-color: ${statusColor}; font-weight: 700; border-radius: 9999px; font-size: 0.9em; }
          .meta-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          .meta-table td { padding: 6px 0; font-size: 0.9em; }
          .disclaimer { margin-top: 40px; padding: 16px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 6px; font-size: 0.8em; color: #991b1b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>CompliScan — Packaged Commodity Compliance Verification</h2>
          <div>Report ID: <strong>${report.reportId}</strong> | Scan ID: <strong>${report.scanId}</strong></div>
          <div>Date: ${new Date(report.generatedAt).toLocaleString()}</div>
        </div>

        <div>
          <span class="status-badge">${report.overallStatus}</span>
          <p style="font-size: 1.05em; margin-top: 12px;">${report.statusExplanation}</p>
        </div>

        <table class="meta-table">
          <tr><td><strong>Product / Generic Name:</strong></td><td>${report.productInformation.productName || 'N/A'} (${report.productInformation.genericName || 'N/A'})</td></tr>
          <tr><td><strong>Category:</strong></td><td>${report.productInformation.category}</td></tr>
          <tr><td><strong>Manufacturer / Packer:</strong></td><td>${report.productInformation.manufacturerOrPacker || 'N/A'}</td></tr>
          <tr><td><strong>Ruleset Version:</strong></td><td>${report.rulesetVersion}</td></tr>
        </table>

        ${renderItems(report.findings.violations, 'Violations (Non-Compliance)', '#b91c1c')}
        ${renderItems(report.findings.unverifiable, 'Human Verification / Unverifiable', '#4338ca')}
        ${renderItems(report.findings.warnings, 'Warnings & Advisories', '#b45309')}
        ${renderItems(report.findings.passed, 'Passed Declarations', '#15803d')}

        <div class="disclaimer">
          <strong>LEGAL DISCLAIMER:</strong><br/>
          ${report.legalDisclaimer.replace(/\n/g, '<br/>')}
        </div>
      </body>
      </html>
    `;
  }
}
