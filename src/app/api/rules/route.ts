import { NextRequest, NextResponse } from 'next/server';
import { RuleRegistry } from '@/lib/compliance/rules/registry';
import { handleApiError } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');

    const rules = category
      ? RuleRegistry.getRulesForCategory(category)
      : RuleRegistry.getAllRules();

    const response = rules.map((r) => ({
      id: r.id,
      name: r.name,
      legalReference: r.legalReference,
      category: r.category,
      severity: r.severity,
      applicability: r.applicability,
      ruleVersion: r.ruleVersion,
      humanVerificationRequired: r.humanVerificationRequired,
      errorCode: r.errorCode,
    }));

    return NextResponse.json({
      success: true,
      data: {
        rulesetVersion: 'LMPC-2011.v2026',
        totalRules: response.length,
        rules: response,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
