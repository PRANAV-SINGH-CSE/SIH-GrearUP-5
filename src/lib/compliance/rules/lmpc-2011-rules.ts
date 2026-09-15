import { IComplianceRule, RuleExecutionContext } from './rule.interface';
import { RuleEvaluation } from '../../types/compliance';

/**
 * LMPC-R06-MFG-01: Manufacturer / Packer / Importer Name & Address
 * Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(a)
 */
export class Rule06ManufacturerPacker implements IComplianceRule {
  readonly id = 'LMPC-R06-MFG-01';
  readonly name = 'Manufacturer / Packer Declaration';
  readonly legalReference = 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(a)';
  readonly category = 'MANDATORY_DECLARATION';
  readonly severity = 'ERROR';
  readonly applicability = 'ALL_PACKAGED_COMMODITIES';
  readonly ruleVersion = '2026.01';
  readonly humanVerificationRequired = false;
  readonly errorCode = 'ERR_MISSING_MANUFACTURER';
  readonly explanationKey = 'RULE_MISSING_MANUFACTURER';

  evaluate(context: RuleExecutionContext): RuleEvaluation {
    const { product, ocrResult } = context;
    const mfg = product.manufacturer?.value;
    const pkr = product.packer?.value;
    const imp = product.importer?.value;

    const hasParty = Boolean(
      (mfg && (mfg.name || mfg.address)) ||
      (pkr && (pkr.name || pkr.address)) ||
      (imp && (imp.name || imp.address))
    );

    if (hasParty) {
      const party = mfg || pkr || imp;
      return {
        ruleId: this.id,
        name: this.name,
        status: 'PASS',
        severity: this.severity,
        message: 'Manufacturer or packer declaration is clearly present.',
        field: 'manufacturer',
        extractedValue: `${party?.name || ''} ${party?.address || ''}`.trim(),
        evidenceText: product.manufacturer?.rawText || product.packer?.rawText,
        confidence: product.manufacturer?.confidence || 0.9,
        legalReference: this.legalReference,
        errorCode: this.errorCode,
        explanationKey: this.explanationKey,
        humanVerificationRequired: false,
      };
    }

    if (ocrResult && ocrResult.confidence < 0.6) {
      return {
        ruleId: this.id,
        name: this.name,
        status: 'UNVERIFIABLE',
        severity: this.severity,
        message: 'Manufacturer details could not be reliably verified due to low OCR confidence in the provided image.',
        field: 'manufacturer',
        confidence: ocrResult.confidence,
        legalReference: this.legalReference,
        errorCode: 'UNVERIFIABLE_OCR_QUALITY',
        explanationKey: 'RULE_UNVERIFIABLE_OCR',
        humanVerificationRequired: true,
      };
    }

    return {
      ruleId: this.id,
      name: this.name,
      status: 'FAIL',
      severity: this.severity,
      message: 'Declaration of manufacturer, packer, or importer name and address was not detected in the provided image.',
      field: 'manufacturer',
      confidence: product.manufacturer?.confidence ?? 0.9,
      legalReference: this.legalReference,
      errorCode: this.errorCode,
      explanationKey: this.explanationKey,
      humanVerificationRequired: false,
    };
  }
}

/**
 * LMPC-R06-GEN-01: Generic / Common Name of Commodity
 * Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(b)
 */
export class Rule06GenericName implements IComplianceRule {
  readonly id = 'LMPC-R06-GEN-01';
  readonly name = 'Generic / Common Commodity Name';
  readonly legalReference = 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(b)';
  readonly category = 'MANDATORY_DECLARATION';
  readonly severity = 'ERROR';
  readonly applicability = 'ALL_PACKAGED_COMMODITIES';
  readonly ruleVersion = '2026.01';
  readonly humanVerificationRequired = false;
  readonly errorCode = 'ERR_MISSING_GENERIC_NAME';
  readonly explanationKey = 'RULE_MISSING_GENERIC_NAME';

  evaluate(context: RuleExecutionContext): RuleEvaluation {
    const { product, ocrResult } = context;
    const genericName = product.genericName?.value || product.productName?.value;

    if (genericName) {
      return {
        ruleId: this.id,
        name: this.name,
        status: 'PASS',
        severity: this.severity,
        message: 'Generic or common name is declared.',
        field: 'genericName',
        extractedValue: genericName,
        evidenceText: product.genericName?.rawText || product.productName?.rawText,
        confidence: product.genericName?.confidence || 0.9,
        legalReference: this.legalReference,
        errorCode: this.errorCode,
        explanationKey: this.explanationKey,
        humanVerificationRequired: false,
      };
    }

    if (ocrResult && ocrResult.confidence < 0.6) {
      return {
        ruleId: this.id,
        name: this.name,
        status: 'UNVERIFIABLE',
        severity: this.severity,
        message: 'Generic commodity name could not be reliably verified due to OCR quality.',
        field: 'genericName',
        confidence: ocrResult.confidence,
        legalReference: this.legalReference,
        errorCode: 'UNVERIFIABLE_OCR_QUALITY',
        explanationKey: 'RULE_UNVERIFIABLE_OCR',
        humanVerificationRequired: true,
      };
    }

    return {
      ruleId: this.id,
      name: this.name,
      status: 'FAIL',
      severity: this.severity,
      message: 'Generic or common name was not detected in the provided image.',
      field: 'genericName',
      confidence: 0.9,
      legalReference: this.legalReference,
      errorCode: this.errorCode,
      explanationKey: this.explanationKey,
      humanVerificationRequired: false,
    };
  }
}

/**
 * LMPC-R06-QTY-01: Net Quantity Declaration Presence
 * Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(c)
 */
export class Rule06NetQuantityPresence implements IComplianceRule {
  readonly id = 'LMPC-R06-QTY-01';
  readonly name = 'Net Quantity Declaration';
  readonly legalReference = 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(c)';
  readonly category = 'MANDATORY_DECLARATION';
  readonly severity = 'ERROR';
  readonly applicability = 'ALL_PACKAGED_COMMODITIES';
  readonly ruleVersion = '2026.01';
  readonly humanVerificationRequired = false;
  readonly errorCode = 'ERR_MISSING_NET_QTY';
  readonly explanationKey = 'RULE_MISSING_NET_QTY';

  evaluate(context: RuleExecutionContext): RuleEvaluation {
    const { product, ocrResult } = context;
    const qty = product.netQuantity?.value;

    if (qty && typeof qty.value === 'number') {
      return {
        ruleId: this.id,
        name: this.name,
        status: 'PASS',
        severity: this.severity,
        message: 'Net quantity declaration is present.',
        field: 'netQuantity',
        extractedValue: `${qty.value} ${qty.unit}`,
        evidenceText: product.netQuantity?.rawText,
        confidence: product.netQuantity?.confidence || 0.9,
        legalReference: this.legalReference,
        errorCode: this.errorCode,
        explanationKey: this.explanationKey,
        humanVerificationRequired: false,
      };
    }

    if (ocrResult && ocrResult.confidence < 0.6) {
      return {
        ruleId: this.id,
        name: this.name,
        status: 'UNVERIFIABLE',
        severity: this.severity,
        message: 'Net quantity could not be reliably verified due to OCR quality.',
        field: 'netQuantity',
        confidence: ocrResult.confidence,
        legalReference: this.legalReference,
        errorCode: 'UNVERIFIABLE_OCR_QUALITY',
        explanationKey: 'RULE_UNVERIFIABLE_OCR',
        humanVerificationRequired: true,
      };
    }

    return {
      ruleId: this.id,
      name: this.name,
      status: 'FAIL',
      severity: this.severity,
      message: 'Net quantity declaration was not detected in the provided image.',
      field: 'netQuantity',
      confidence: 0.9,
      legalReference: this.legalReference,
      errorCode: this.errorCode,
      explanationKey: this.explanationKey,
      humanVerificationRequired: false,
    };
  }
}

/**
 * LMPC-R07-UNIT-01: Approved Metric Units of Weight/Measure
 * Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 7 & Schedule II
 */
export class Rule07StandardMetricUnit implements IComplianceRule {
  readonly id = 'LMPC-R07-UNIT-01';
  readonly name = 'Standard Metric Units of Weight/Measure';
  readonly legalReference = 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 7 & Schedule II';
  readonly category = 'METRIC_UNIT';
  readonly severity = 'ERROR';
  readonly applicability = 'ALL_PACKAGED_COMMODITIES';
  readonly ruleVersion = '2026.01';
  readonly humanVerificationRequired = false;
  readonly errorCode = 'ERR_INVALID_UNIT_SYMBOL';
  readonly explanationKey = 'RULE_INVALID_UNIT_SYMBOL';

  evaluate(context: RuleExecutionContext): RuleEvaluation {
    const { product } = context;
    const qty = product.netQuantity?.value;

    if (!qty) {
      return {
        ruleId: this.id,
        name: this.name,
        status: 'NOT_APPLICABLE',
        severity: this.severity,
        message: 'Net quantity is missing; unit formatting check skipped.',
        field: 'netQuantity.unit',
        legalReference: this.legalReference,
        errorCode: this.errorCode,
        explanationKey: this.explanationKey,
        humanVerificationRequired: false,
      };
    }

    if (!qty.isValidUnit) {
      return {
        ruleId: this.id,
        name: this.name,
        status: 'FAIL',
        severity: this.severity,
        message: `Non-standard unit symbol '${qty.rawUnit}' detected. Under Rule 7 and Schedule II, only approved metric symbols (g, kg, ml, l, N, etc.) are permissible. Symbols like 'gms', 'kilos', or 'ltrs' are prohibited.`,
        field: 'netQuantity.unit',
        extractedValue: qty.rawUnit,
        evidenceText: product.netQuantity?.rawText,
        confidence: product.netQuantity?.confidence || 0.95,
        legalReference: this.legalReference,
        errorCode: this.errorCode,
        explanationKey: this.explanationKey,
        humanVerificationRequired: false,
      };
    }

    return {
      ruleId: this.id,
      name: this.name,
      status: 'PASS',
      severity: this.severity,
      message: `Standard metric unit symbol '${qty.unit}' is correctly used.`,
      field: 'netQuantity.unit',
      extractedValue: qty.unit,
      evidenceText: product.netQuantity?.rawText,
      confidence: 0.95,
      legalReference: this.legalReference,
      errorCode: this.errorCode,
      explanationKey: this.explanationKey,
      humanVerificationRequired: false,
    };
  }
}

/**
 * LMPC-R06-MRP-01: Maximum Retail Price (MRP) and Tax Inclusion
 * Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(e)
 */
export class Rule06MRP implements IComplianceRule {
  readonly id = 'LMPC-R06-MRP-01';
  readonly name = 'Maximum Retail Price (MRP) & Tax Inclusion';
  readonly legalReference = 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(e)';
  readonly category = 'RETAIL_PRICE';
  readonly severity = 'ERROR';
  readonly applicability = 'ALL_PACKAGED_COMMODITIES';
  readonly ruleVersion = '2026.01';
  readonly humanVerificationRequired = false;
  readonly errorCode = 'ERR_MISSING_MRP';
  readonly explanationKey = 'RULE_MISSING_MRP';

  evaluate(context: RuleExecutionContext): RuleEvaluation {
    const { product, ocrResult } = context;
    const mrp = product.mrp?.value;

    if (!mrp || mrp.amount === null) {
      if (ocrResult && ocrResult.confidence < 0.6) {
        return {
          ruleId: this.id,
          name: this.name,
          status: 'UNVERIFIABLE',
          severity: this.severity,
          message: 'MRP declaration could not be reliably verified due to OCR quality.',
          field: 'mrp',
          confidence: ocrResult.confidence,
          legalReference: this.legalReference,
          errorCode: 'UNVERIFIABLE_OCR_QUALITY',
          explanationKey: 'RULE_UNVERIFIABLE_OCR',
          humanVerificationRequired: true,
        };
      }

      return {
        ruleId: this.id,
        name: this.name,
        status: 'FAIL',
        severity: this.severity,
        message: 'Maximum Retail Price (MRP) declaration was not detected in the provided image.',
        field: 'mrp',
        confidence: 0.9,
        legalReference: this.legalReference,
        errorCode: this.errorCode,
        explanationKey: this.explanationKey,
        humanVerificationRequired: false,
      };
    }

    if (!mrp.isTaxInclusive) {
      return {
        ruleId: this.id,
        name: this.name,
        status: 'WARNING',
        severity: 'WARNING',
        message: `MRP of ₹${mrp.amount} was detected, but mandatory 'inclusive of all taxes' declaration was not explicitly identified.`,
        field: 'mrp.isTaxInclusive',
        extractedValue: `₹${mrp.amount}`,
        evidenceText: product.mrp?.rawText,
        confidence: product.mrp?.confidence || 0.85,
        legalReference: this.legalReference,
        errorCode: 'WARN_MISSING_TAX_INCLUSION',
        explanationKey: 'RULE_MISSING_TAX_INCLUSION',
        humanVerificationRequired: false,
      };
    }

    return {
      ruleId: this.id,
      name: this.name,
      status: 'PASS',
      severity: this.severity,
      message: `MRP declared as ₹${mrp.amount} inclusive of all taxes.`,
      field: 'mrp',
      extractedValue: `₹${mrp.amount} (incl. of all taxes)`,
      evidenceText: product.mrp?.rawText,
      confidence: product.mrp?.confidence || 0.95,
      legalReference: this.legalReference,
      errorCode: this.errorCode,
      explanationKey: this.explanationKey,
      humanVerificationRequired: false,
    };
  }
}

/**
 * LMPC-R06-DATE-01: Date of Manufacture / Packing
 * Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(d)
 */
export class Rule06MfgPackingDate implements IComplianceRule {
  readonly id = 'LMPC-R06-DATE-01';
  readonly name = 'Date of Manufacture / Packing';
  readonly legalReference = 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(d)';
  readonly category = 'MANDATORY_DECLARATION';
  readonly severity = 'ERROR';
  readonly applicability = 'ALL_PACKAGED_COMMODITIES';
  readonly ruleVersion = '2026.01';
  readonly humanVerificationRequired = false;
  readonly errorCode = 'ERR_MISSING_MFG_DATE';
  readonly explanationKey = 'RULE_MISSING_MFG_DATE';

  evaluate(context: RuleExecutionContext): RuleEvaluation {
    const { product, ocrResult } = context;
    const mfgDate = product.manufactureDate?.value;
    const pkgDate = product.packingDate?.value;
    const anyDate = mfgDate || pkgDate;

    if (anyDate) {
      if (anyDate.isAmbiguous) {
        return {
          ruleId: this.id,
          name: this.name,
          status: 'WARNING',
          severity: 'WARNING',
          message: `Date '${anyDate.rawText}' is present but ambiguous between DD/MM/YYYY and MM/DD/YYYY format.`,
          field: 'manufactureDate',
          extractedValue: anyDate.rawText,
          evidenceText: product.manufactureDate?.rawText || product.packingDate?.rawText,
          confidence: 0.75,
          legalReference: this.legalReference,
          errorCode: 'WARN_AMBIGUOUS_DATE',
          explanationKey: 'RULE_AMBIGUOUS_DATE',
          humanVerificationRequired: false,
        };
      }

      return {
        ruleId: this.id,
        name: this.name,
        status: 'PASS',
        severity: this.severity,
        message: `Date of manufacture/packing declared as '${anyDate.rawText}'.`,
        field: 'manufactureDate',
        extractedValue: anyDate.rawText,
        evidenceText: product.manufactureDate?.rawText || product.packingDate?.rawText,
        confidence: 0.95,
        legalReference: this.legalReference,
        errorCode: this.errorCode,
        explanationKey: this.explanationKey,
        humanVerificationRequired: false,
      };
    }

    if (ocrResult && ocrResult.confidence < 0.6) {
      return {
        ruleId: this.id,
        name: this.name,
        status: 'UNVERIFIABLE',
        severity: this.severity,
        message: 'Date of manufacture or packing could not be verified due to OCR quality.',
        field: 'manufactureDate',
        confidence: ocrResult.confidence,
        legalReference: this.legalReference,
        errorCode: 'UNVERIFIABLE_OCR_QUALITY',
        explanationKey: 'RULE_UNVERIFIABLE_OCR',
        humanVerificationRequired: true,
      };
    }

    return {
      ruleId: this.id,
      name: this.name,
      status: 'FAIL',
      severity: this.severity,
      message: 'Month and year of manufacture or packing was not detected in the provided image.',
      field: 'manufactureDate',
      confidence: 0.9,
      legalReference: this.legalReference,
      errorCode: this.errorCode,
      explanationKey: this.explanationKey,
      humanVerificationRequired: false,
    };
  }
}

/**
 * LMPC-R06-COO-01: Country of Origin Declaration
 * Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(da)
 */
export class Rule06CountryOfOrigin implements IComplianceRule {
  readonly id = 'LMPC-R06-COO-01';
  readonly name = 'Country of Origin Declaration';
  readonly legalReference = 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(da)';
  readonly category = 'ORIGIN';
  readonly severity = 'ERROR';
  readonly applicability = 'ALL_PACKAGED_COMMODITIES';
  readonly ruleVersion = '2026.01';
  readonly humanVerificationRequired = false;
  readonly errorCode = 'ERR_MISSING_COUNTRY_OF_ORIGIN';
  readonly explanationKey = 'RULE_MISSING_COUNTRY_OF_ORIGIN';

  evaluate(context: RuleExecutionContext): RuleEvaluation {
    const { product, ocrResult } = context;
    const coo = product.countryOfOrigin?.value;

    if (coo) {
      return {
        ruleId: this.id,
        name: this.name,
        status: 'PASS',
        severity: this.severity,
        message: `Country of origin declared as '${coo}'.`,
        field: 'countryOfOrigin',
        extractedValue: coo,
        evidenceText: product.countryOfOrigin?.rawText,
        confidence: product.countryOfOrigin?.confidence || 0.95,
        legalReference: this.legalReference,
        errorCode: this.errorCode,
        explanationKey: this.explanationKey,
        humanVerificationRequired: false,
      };
    }

    if (ocrResult && ocrResult.confidence < 0.6) {
      return {
        ruleId: this.id,
        name: this.name,
        status: 'UNVERIFIABLE',
        severity: this.severity,
        message: 'Country of origin could not be verified due to OCR quality.',
        field: 'countryOfOrigin',
        confidence: ocrResult.confidence,
        legalReference: this.legalReference,
        errorCode: 'UNVERIFIABLE_OCR_QUALITY',
        explanationKey: 'RULE_UNVERIFIABLE_OCR',
        humanVerificationRequired: true,
      };
    }

    return {
      ruleId: this.id,
      name: this.name,
      status: 'FAIL',
      severity: this.severity,
      message: 'Country of origin declaration was not detected in the provided image.',
      field: 'countryOfOrigin',
      confidence: 0.9,
      legalReference: this.legalReference,
      errorCode: this.errorCode,
      explanationKey: this.explanationKey,
      humanVerificationRequired: false,
    };
  }
}

/**
 * LMPC-R06-CC-01: Consumer Care Grievance Details
 * Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(e) (as amended 2017)
 */
export class Rule06ConsumerCare implements IComplianceRule {
  readonly id = 'LMPC-R06-CC-01';
  readonly name = 'Consumer Care Information';
  readonly legalReference = 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(e) (as amended 2017)';
  readonly category = 'CONSUMER_PROTECTION';
  readonly severity = 'ERROR';
  readonly applicability = 'ALL_PACKAGED_COMMODITIES';
  readonly ruleVersion = '2026.01';
  readonly humanVerificationRequired = false;
  readonly errorCode = 'ERR_MISSING_CONSUMER_CARE';
  readonly explanationKey = 'RULE_MISSING_CONSUMER_CARE';

  evaluate(context: RuleExecutionContext): RuleEvaluation {
    const { product, ocrResult } = context;
    const cc = product.consumerCare?.value;

    if (cc && (cc.phone || cc.email || cc.address)) {
      if (!cc.phone || !cc.email) {
        return {
          ruleId: this.id,
          name: this.name,
          status: 'WARNING',
          severity: 'WARNING',
          message: 'Consumer grievance contact detected, but either telephone or email is missing.',
          field: 'consumerCare',
          extractedValue: `Phone: ${cc.phone || 'N/A'}, Email: ${cc.email || 'N/A'}`,
          evidenceText: product.consumerCare?.rawText,
          confidence: product.consumerCare?.confidence || 0.85,
          legalReference: this.legalReference,
          errorCode: 'WARN_INCOMPLETE_CONSUMER_CARE',
          explanationKey: 'RULE_INCOMPLETE_CONSUMER_CARE',
          humanVerificationRequired: false,
        };
      }

      return {
        ruleId: this.id,
        name: this.name,
        status: 'PASS',
        severity: this.severity,
        message: 'Consumer care contact details (phone, email, address) are fully declared.',
        field: 'consumerCare',
        extractedValue: `Phone: ${cc.phone}, Email: ${cc.email}`,
        evidenceText: product.consumerCare?.rawText,
        confidence: product.consumerCare?.confidence || 0.95,
        legalReference: this.legalReference,
        errorCode: this.errorCode,
        explanationKey: this.explanationKey,
        humanVerificationRequired: false,
      };
    }

    if (ocrResult && ocrResult.confidence < 0.6) {
      return {
        ruleId: this.id,
        name: this.name,
        status: 'UNVERIFIABLE',
        severity: this.severity,
        message: 'Consumer care details could not be verified due to OCR quality.',
        field: 'consumerCare',
        confidence: ocrResult.confidence,
        legalReference: this.legalReference,
        errorCode: 'UNVERIFIABLE_OCR_QUALITY',
        explanationKey: 'RULE_UNVERIFIABLE_OCR',
        humanVerificationRequired: true,
      };
    }

    return {
      ruleId: this.id,
      name: this.name,
      status: 'FAIL',
      severity: this.severity,
      message: 'Consumer grievance redressal contact information was not detected in the provided image.',
      field: 'consumerCare',
      confidence: 0.9,
      legalReference: this.legalReference,
      errorCode: this.errorCode,
      explanationKey: this.explanationKey,
      humanVerificationRequired: false,
    };
  }
}

/**
 * LMPC-R06-USP-01: Unit Sale Price (USP) Indication
 * Legal Metrology (Packaged Commodities) Amendment Rules, 2021 - Rule 6(11)
 */
export class Rule06UnitSalePrice implements IComplianceRule {
  readonly id = 'LMPC-R06-USP-01';
  readonly name = 'Unit Sale Price (USP) Indication';
  readonly legalReference = 'Legal Metrology (Packaged Commodities) Amendment Rules, 2021 - Rule 6(11)';
  readonly category = 'RETAIL_PRICE';
  readonly severity = 'WARNING';
  readonly applicability = 'ALL_PACKAGED_COMMODITIES';
  readonly ruleVersion = '2026.01';
  readonly humanVerificationRequired = false;
  readonly errorCode = 'WARN_MISSING_UNIT_SALE_PRICE';
  readonly explanationKey = 'RULE_MISSING_UNIT_SALE_PRICE';

  evaluate(context: RuleExecutionContext): RuleEvaluation {
    const { product } = context;
    const usp = product.unitSalePrice?.value;

    if (usp && usp.amount > 0) {
      return {
        ruleId: this.id,
        name: this.name,
        status: 'PASS',
        severity: this.severity,
        message: `Unit sale price declared as ₹${usp.amount} / ${usp.perUnit}.`,
        field: 'unitSalePrice',
        extractedValue: `₹${usp.amount} / ${usp.perUnit}`,
        evidenceText: product.unitSalePrice?.rawText,
        confidence: product.unitSalePrice?.confidence || 0.9,
        legalReference: this.legalReference,
        errorCode: this.errorCode,
        explanationKey: this.explanationKey,
        humanVerificationRequired: false,
      };
    }

    return {
      ruleId: this.id,
      name: this.name,
      status: 'WARNING',
      severity: 'WARNING',
      message: 'Unit Sale Price (USP) was not detected alongside MRP on the package.',
      field: 'unitSalePrice',
      confidence: 0.8,
      legalReference: this.legalReference,
      errorCode: this.errorCode,
      explanationKey: this.explanationKey,
      humanVerificationRequired: false,
    };
  }
}

/**
 * LMPC-R09-PDP-01: Principal Display Panel Prominence
 * Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 9 & Rule 10
 */
export class Rule09PDPProminence implements IComplianceRule {
  readonly id = 'LMPC-R09-PDP-01';
  readonly name = 'Principal Display Panel Prominence';
  readonly legalReference = 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 9 & Rule 10';
  readonly category = 'PLACEMENT';
  readonly severity = 'WARNING';
  readonly applicability = 'ALL_PACKAGED_COMMODITIES';
  readonly ruleVersion = '2026.01';
  readonly humanVerificationRequired = true;
  readonly errorCode = 'UNVERIFIABLE_PDP_PLACEMENT';
  readonly explanationKey = 'RULE_UNVERIFIABLE_PDP';

  evaluate(_context: RuleExecutionContext): RuleEvaluation {
    // Under Section 14 & 52 of guidelines: Do NOT fake millimeter placement compliance from uncalibrated 2D photos
    return {
      ruleId: this.id,
      name: this.name,
      status: 'UNVERIFIABLE',
      severity: 'WARNING',
      message: 'Verification of absolute font height in millimeters and PDP area ratio requires calibrated 3D dimensions. Flagged for human physical verification.',
      field: 'principalDisplayPanel',
      confidence: 0.5,
      legalReference: this.legalReference,
      errorCode: this.errorCode,
      explanationKey: this.explanationKey,
      humanVerificationRequired: true,
    };
  }
}

/**
 * LMPC-R06-EXP-01: Expiry Date for Packaged Food
 * Applicable specifically for Food products
 */
export class Rule06FoodExpiry implements IComplianceRule {
  readonly id = 'LMPC-R06-EXP-01';
  readonly name = 'Food Expiry / Best Before Declaration';
  readonly legalReference = 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(d) & Food Safety Regulations';
  readonly category = 'MANDATORY_DECLARATION';
  readonly severity = 'ERROR';
  readonly applicability = 'FOOD_PRODUCT';
  readonly ruleVersion = '2026.01';
  readonly humanVerificationRequired = false;
  readonly errorCode = 'ERR_MISSING_EXPIRY_DATE';
  readonly explanationKey = 'RULE_MISSING_EXPIRY_DATE';

  evaluate(context: RuleExecutionContext): RuleEvaluation {
    const { product, category } = context;

    if (category !== 'FOOD_PRODUCT') {
      return {
        ruleId: this.id,
        name: this.name,
        status: 'NOT_APPLICABLE',
        severity: this.severity,
        message: 'Mandatory expiry rule applies only to packaged food products.',
        legalReference: this.legalReference,
        errorCode: this.errorCode,
        explanationKey: this.explanationKey,
        humanVerificationRequired: false,
      };
    }

    const exp = product.expiryDate?.value;
    const bb = product.bestBefore?.value;

    if (exp || bb) {
      return {
        ruleId: this.id,
        name: this.name,
        status: 'PASS',
        severity: this.severity,
        message: `Food expiry / best before declared as '${exp?.rawText || bb}'.`,
        field: 'expiryDate',
        extractedValue: exp?.rawText || bb,
        evidenceText: product.expiryDate?.rawText,
        confidence: 0.95,
        legalReference: this.legalReference,
        errorCode: this.errorCode,
        explanationKey: this.explanationKey,
        humanVerificationRequired: false,
      };
    }

    return {
      ruleId: this.id,
      name: this.name,
      status: 'FAIL',
      severity: this.severity,
      message: 'Best-before or Use-by/Expiry date was not detected on this packaged food commodity.',
      field: 'expiryDate',
      confidence: 0.9,
      legalReference: this.legalReference,
      errorCode: this.errorCode,
      explanationKey: this.explanationKey,
      humanVerificationRequired: false,
    };
  }
}
