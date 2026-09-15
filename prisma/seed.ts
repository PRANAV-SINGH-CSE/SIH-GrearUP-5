import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Legal Metrology (Packaged Commodities) Rules, 2011...');

  // 1. Seed Ruleset Version
  await prisma.rulesetVersionRecord.upsert({
    where: { version: 'LMPC-2011.v2026' },
    create: {
      version: 'LMPC-2011.v2026',
      name: 'Legal Metrology (Packaged Commodities) Rules, 2011 (as amended up to 2023)',
      description: 'Standard packaged commodities ruleset under the Legal Metrology Act, 2009',
      legalSource: 'Ministry of Consumer Affairs, Food and Public Distribution, Government of India',
      isActive: true,
    },
    update: {
      isActive: true,
    },
  });

  // 2. Seed Product Categories
  const categories = [
    {
      code: 'GENERIC_PACKAGED_COMMODITY',
      name: 'Generic Packaged Commodity',
      description: 'General consumer goods packaged in the absence of the purchaser (Rule 6 general)',
      requiredRules: [
        'LMPC-R06-MFG-01',
        'LMPC-R06-GEN-01',
        'LMPC-R06-QTY-01',
        'LMPC-R07-UNIT-01',
        'LMPC-R06-MRP-01',
        'LMPC-R06-DATE-01',
        'LMPC-R06-COO-01',
        'LMPC-R06-CC-01',
        'LMPC-R06-USP-01',
      ],
    },
    {
      code: 'FOOD_PRODUCT',
      name: 'Packaged Food & Beverage',
      description: 'Pre-packaged food requiring expiry date / best-before declaration in addition to LMPC declarations',
      requiredRules: [
        'LMPC-R06-MFG-01',
        'LMPC-R06-GEN-01',
        'LMPC-R06-QTY-01',
        'LMPC-R07-UNIT-01',
        'LMPC-R06-MRP-01',
        'LMPC-R06-DATE-01',
        'LMPC-R06-EXP-01',
        'LMPC-R06-COO-01',
        'LMPC-R06-CC-01',
        'LMPC-R06-USP-01',
      ],
    },
    {
      code: 'IMPORTED_COMMODITY',
      name: 'Imported Packaged Commodity',
      description: 'Imported packages requiring importer address, country of origin, and import month/year',
      requiredRules: [
        'LMPC-R06-IMP-01',
        'LMPC-R06-GEN-01',
        'LMPC-R06-QTY-01',
        'LMPC-R07-UNIT-01',
        'LMPC-R06-MRP-01',
        'LMPC-R06-DATE-01',
        'LMPC-R06-COO-01',
        'LMPC-R06-CC-01',
        'LMPC-R06-USP-01',
      ],
    },
  ];

  for (const cat of categories) {
    await prisma.productCategoryRecord.upsert({
      where: { code: cat.code },
      create: {
        code: cat.code,
        name: cat.name,
        description: cat.description,
        requiredRulesJson: JSON.stringify(cat.requiredRules),
      },
      update: {
        name: cat.name,
        description: cat.description,
        requiredRulesJson: JSON.stringify(cat.requiredRules),
      },
    });
  }

  // 3. Seed Compliance Rules
  const rules = [
    {
      id: 'LMPC-R06-MFG-01',
      name: 'Manufacturer / Packer Declaration',
      description: 'Name and complete address of the manufacturer or packer must be declared on the package.',
      legalReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(a)',
      category: 'MANDATORY_DECLARATION',
      severity: 'ERROR',
      applicability: 'ALL_PACKAGED_COMMODITIES',
      ruleVersion: '2026.01',
      humanVerificationRequired: false,
      conditionType: 'PRESENCE',
      errorCode: 'ERR_MISSING_MANUFACTURER',
      explanationEn: 'The name and complete address of the manufacturer or packer is mandatory under Rule 6(1)(a) of Legal Metrology (Packaged Commodities) Rules, 2011.',
      explanationHi: 'विधिक मापविज्ञान (पैक की गई वस्तुएं) नियम, 2011 के नियम 6(1)(a) के तहत निर्माता या पैकर का नाम और पूरा पता अनिवार्य है।',
    },
    {
      id: 'LMPC-R06-GEN-01',
      name: 'Generic / Common Name',
      description: 'The common or generic name of the commodity contained in the package must be declared.',
      legalReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(b)',
      category: 'MANDATORY_DECLARATION',
      severity: 'ERROR',
      applicability: 'ALL_PACKAGED_COMMODITIES',
      ruleVersion: '2026.01',
      humanVerificationRequired: false,
      conditionType: 'PRESENCE',
      errorCode: 'ERR_MISSING_GENERIC_NAME',
      explanationEn: 'The generic or common name of the commodity must be prominently stated on the package under Rule 6(1)(b).',
      explanationHi: 'नियम 6(1)(b) के तहत वस्तु का सामान्य या जेनेरिक नाम पैकेज पर प्रमुखता से उल्लिखित होना चाहिए।',
    },
    {
      id: 'LMPC-R06-QTY-01',
      name: 'Net Quantity Declaration',
      description: 'The net quantity in terms of standard unit of weight, measure or number must be declared.',
      legalReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(c)',
      category: 'MANDATORY_DECLARATION',
      severity: 'ERROR',
      applicability: 'ALL_PACKAGED_COMMODITIES',
      ruleVersion: '2026.01',
      humanVerificationRequired: false,
      conditionType: 'PRESENCE',
      errorCode: 'ERR_MISSING_NET_QTY',
      explanationEn: 'Net quantity must be declared on every package under Rule 6(1)(c).',
      explanationHi: 'नियम 6(1)(c) के तहत प्रत्येक पैकेज पर शुद्ध मात्रा (Net Quantity) घोषित की जानी चाहिए।',
    },
    {
      id: 'LMPC-R07-UNIT-01',
      name: 'Standard Metric Units of Weight/Measure',
      description: 'Quantity must use approved standard symbols (g, kg, ml, l, m, cm, mm, N). Non-standard units (gms, kilos, ltrs, etc.) are prohibited.',
      legalReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 7 & Schedule II',
      category: 'METRIC_UNIT',
      severity: 'ERROR',
      applicability: 'ALL_PACKAGED_COMMODITIES',
      ruleVersion: '2026.01',
      humanVerificationRequired: false,
      conditionType: 'FORMAT',
      errorCode: 'ERR_INVALID_UNIT_SYMBOL',
      explanationEn: 'Only standard metric symbols (g, kg, ml, l, N, U) are permissible under Rule 7 and Schedule II. Symbols like "gms", "kilos", or "ltrs" violate Legal Metrology rules.',
      explanationHi: 'नियम 7 और अनुसूची II के तहत केवल मानक मीट्रिक प्रतीकों (g, kg, ml, l, N) की अनुमति है। "gms", "kilos", या "ltrs" जैसे प्रतीक अवैध हैं।',
    },
    {
      id: 'LMPC-R06-MRP-01',
      name: 'Maximum Retail Price (MRP) & Tax Inclusion',
      description: 'Retail sale price must be declared in Indian currency with explicit "inclusive of all taxes" declaration.',
      legalReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(e)',
      category: 'RETAIL_PRICE',
      severity: 'ERROR',
      applicability: 'ALL_PACKAGED_COMMODITIES',
      ruleVersion: '2026.01',
      humanVerificationRequired: false,
      conditionType: 'VALUE',
      errorCode: 'ERR_MISSING_MRP',
      explanationEn: 'Maximum Retail Price (MRP) must be clearly stated, inclusive of all taxes, under Rule 6(1)(e).',
      explanationHi: 'नियम 6(1)(e) के तहत सभी करों सहित अधिकतम खुदरा मूल्य (MRP) स्पष्ट रूप से लिखा होना चाहिए।',
    },
    {
      id: 'LMPC-R06-DATE-01',
      name: 'Date of Manufacture / Packing',
      description: 'Month and year of manufacture, packing, or import must be declared on the package.',
      legalReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(d)',
      category: 'MANDATORY_DECLARATION',
      severity: 'ERROR',
      applicability: 'ALL_PACKAGED_COMMODITIES',
      ruleVersion: '2026.01',
      humanVerificationRequired: false,
      conditionType: 'PRESENCE',
      errorCode: 'ERR_MISSING_MFG_DATE',
      explanationEn: 'The month and year of manufacture or packaging must be declared on every package under Rule 6(1)(d).',
      explanationHi: 'नियम 6(1)(d) के तहत प्रत्येक पैकेज पर निर्माण या पैकिंग का महीना और वर्ष घोषित किया जाना अनिवार्य है।',
    },
    {
      id: 'LMPC-R06-COO-01',
      name: 'Country of Origin Declaration',
      description: 'Country of origin or manufacture must be clearly declared.',
      legalReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(da)',
      category: 'ORIGIN',
      severity: 'ERROR',
      applicability: 'ALL_PACKAGED_COMMODITIES',
      ruleVersion: '2026.01',
      humanVerificationRequired: false,
      conditionType: 'PRESENCE',
      errorCode: 'ERR_MISSING_COUNTRY_OF_ORIGIN',
      explanationEn: 'Country of origin is mandatory on packaged commodities under Rule 6(1)(da).',
      explanationHi: 'नियम 6(1)(da) के तहत पैकेज पर मूल देश (Country of Origin) का स्पष्ट उल्लेख होना अनिवार्य है।',
    },
    {
      id: 'LMPC-R06-CC-01',
      name: 'Consumer Care Information',
      description: 'Name, address, telephone number, and email of the consumer grievance redressal contact must be provided.',
      legalReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(e) (as amended 2017)',
      category: 'CONSUMER_PROTECTION',
      severity: 'ERROR',
      applicability: 'ALL_PACKAGED_COMMODITIES',
      ruleVersion: '2026.01',
      humanVerificationRequired: false,
      conditionType: 'PRESENCE',
      errorCode: 'ERR_MISSING_CONSUMER_CARE',
      explanationEn: 'Consumer care contact details including phone number, email address, and postal address are mandatory under Rule 6(1)(e).',
      explanationHi: 'नियम 6(1)(e) के तहत फोन नंबर, ईमेल और डाक पते सहित उपभोक्ता देखभाल विवरण अनिवार्य है।',
    },
    {
      id: 'LMPC-R06-USP-01',
      name: 'Unit Sale Price (USP) Indication',
      description: 'Unit sale price in rupees per g/kg/ml/l/unit must be indicated where applicable.',
      legalReference: 'Legal Metrology (Packaged Commodities) Amendment Rules, 2021 - Rule 6(11)',
      category: 'RETAIL_PRICE',
      severity: 'WARNING',
      applicability: 'ALL_PACKAGED_COMMODITIES',
      ruleVersion: '2026.01',
      humanVerificationRequired: false,
      conditionType: 'CROSS_FIELD',
      errorCode: 'WARN_MISSING_UNIT_SALE_PRICE',
      explanationEn: 'Unit Sale Price (e.g. ₹/g or ₹/ml) should be declared alongside MRP under Rule 6(11) as amended in 2021.',
      explanationHi: '2021 में संशोधित नियम 6(11) के तहत MRP के साथ यूनिट सेल प्राइस (उदा. ₹/g या ₹/ml) प्रदर्शित होना चाहिए।',
    },
    {
      id: 'LMPC-R09-PDP-01',
      name: 'Principal Display Panel (PDP) Prominence & Height',
      description: 'Numeral height and declaration prominence on Principal Display Panel as per package area.',
      legalReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 9 & Rule 10',
      category: 'PLACEMENT',
      severity: 'WARNING',
      applicability: 'ALL_PACKAGED_COMMODITIES',
      ruleVersion: '2026.01',
      humanVerificationRequired: true,
      conditionType: 'PLACEMENT',
      errorCode: 'UNVERIFIABLE_PDP_PLACEMENT',
      explanationEn: 'Verification of absolute font height in mm requires physical measurement or calibrated 3D dimensions of the packaging. Marked for human verification.',
      explanationHi: 'मिमी में सटीक फॉन्ट आकार के सत्यापन के लिए पैकेज के भौतिक माप की आवश्यकता होती है। इसे मानव सत्यापन के लिए चिह्नित किया गया है।',
    },
  ];

  for (const rule of rules) {
    await prisma.complianceRuleRecord.upsert({
      where: { id: rule.id },
      create: {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        legalReference: rule.legalReference,
        category: rule.category,
        severity: rule.severity as any,
        applicability: rule.applicability,
        ruleVersion: rule.ruleVersion,
        humanVerificationRequired: rule.humanVerificationRequired,
        conditionType: rule.conditionType,
        errorCode: rule.errorCode,
        explanationEn: rule.explanationEn,
        explanationHi: rule.explanationHi,
      },
      update: {
        name: rule.name,
        description: rule.description,
        legalReference: rule.legalReference,
        category: rule.category,
        severity: rule.severity as any,
        applicability: rule.applicability,
        humanVerificationRequired: rule.humanVerificationRequired,
        conditionType: rule.conditionType,
        errorCode: rule.errorCode,
        explanationEn: rule.explanationEn,
        explanationHi: rule.explanationHi,
      },
    });
  }

  console.log(`Seeding complete. Seeded ${categories.length} categories and ${rules.length} legal rules.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
