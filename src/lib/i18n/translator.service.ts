import { LEGAL_RULE_TRANSLATIONS, LocalizedExplanation } from './translations';
import { RuleEvaluation } from '../types/compliance';
import { LocalizedReportExplanation } from '../types/report';

export class TranslatorService {
  /**
   * Translates language-neutral compliance evaluation codes into human-readable,
   * legally accurate explanations in the requested locale ('en' | 'hi').
   */
  static localizeEvaluation(
    evaluation: RuleEvaluation,
    locale: 'en' | 'hi' = 'en'
  ): LocalizedReportExplanation {
    const key = evaluation.explanationKey;
    const translation = LEGAL_RULE_TRANSLATIONS[key]?.[locale];

    const localizedExplanation = translation
      ? `${translation.explanation} ${translation.remedy ? `[Remedy: ${translation.remedy}]` : ''}`
      : evaluation.message;

    return {
      ruleId: evaluation.ruleId,
      name: translation?.title || evaluation.name,
      status: evaluation.status,
      message: evaluation.message,
      localizedExplanation,
      legalReference: evaluation.legalReference,
      evidenceText: evaluation.evidenceText,
      extractedValue: evaluation.extractedValue,
      confidence: evaluation.confidence,
    };
  }

  static getStatusExplanation(
    overallStatus: string,
    locale: 'en' | 'hi' = 'en'
  ): string {
    const statusMap: Record<string, Record<'en' | 'hi', string>> = {
      COMPLIANT: {
        en: 'The product label meets all automated statutory declarations under Legal Metrology (Packaged Commodities) Rules, 2011.',
        hi: 'यह उत्पाद लेबल विधिक मापविज्ञान (पैक की गई वस्तुएं) नियम, 2011 के तहत सभी स्वचालित वैधानिक घोषणाओं को पूरा करता है।',
      },
      NON_COMPLIANT: {
        en: 'Actionable non-compliance detected. One or more mandatory statutory declarations are missing or violate packaging rules.',
        hi: 'गैर-अनुपालन का पता चला। एक या अधिक अनिवार्य वैधानिक घोषणाएं अनुपलब्ध हैं या पैकेजिंग नियमों का उल्लंघन करती हैं।',
      },
      COMPLIANT_WITH_WARNINGS: {
        en: 'All mandatory declarations are present, but advisory notices or optional formatting improvements were flagged.',
        hi: 'सभी अनिवार्य घोषणाएं मौजूद हैं, लेकिन सलाहकारी चेतावनियों या प्रारूप सुधारों को चिह्नित किया गया है।',
      },
      NEEDS_REVIEW: {
        en: 'Automated verification could not reliably verify one or more critical declarations due to image resolution or clarity. Manual review required.',
        hi: 'छवि की गुणवत्ता या ओसीआर स्पष्टता के कारण एक या अधिक महत्वपूर्ण घोषणाओं को सत्यापित नहीं किया जा सका। मैन्युअल समीक्षा की आवश्यकता है।',
      },
    };

    return statusMap[overallStatus]?.[locale] || statusMap[overallStatus]?.en || overallStatus;
  }
}
