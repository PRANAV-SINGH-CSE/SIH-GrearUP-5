export interface LocalizedExplanation {
  title: string;
  explanation: string;
  remedy: string;
}

export const LEGAL_RULE_TRANSLATIONS: Record<string, Record<'en' | 'hi', LocalizedExplanation>> = {
  RULE_MISSING_MANUFACTURER: {
    en: {
      title: 'Missing Manufacturer / Packer Details',
      explanation: 'Under Rule 6(1)(a) of Legal Metrology (Packaged Commodities) Rules, 2011, the name and complete address of the manufacturer or packer must be prominently declared.',
      remedy: 'Ensure the complete registered business address and company name are printed clearly on the packaging.',
    },
    hi: {
      title: 'निर्माता / पैकर विवरण अनुपलब्ध',
      explanation: 'विधिक मापविज्ञान (पैक की गई वस्तुएं) नियम, 2011 के नियम 6(1)(a) के तहत निर्माता या पैकर का नाम और पूरा पता पैकेज पर प्रमुखता से होना अनिवार्य है।',
      remedy: 'सुनिश्चित करें कि कंपनी का पूरा पंजीकृत व्यावसायिक पता और नाम पैकेजिंग पर स्पष्ट रूप से मुद्रित हो।',
    },
  },

  RULE_MISSING_GENERIC_NAME: {
    en: {
      title: 'Missing Generic / Common Name',
      explanation: 'Under Rule 6(1)(b), the generic or common name of the commodity must be declared on the principal display panel.',
      remedy: 'Print the standard common or generic commodity name (e.g., "Basmati Rice", "Mustard Oil").',
    },
    hi: {
      title: 'सामान्य / जेनेरिक नाम अनुपलब्ध',
      explanation: 'नियम 6(1)(b) के तहत वस्तु का सामान्य या जेनेरिक नाम मुख्य प्रदर्शन पैनल पर घोषित किया जाना चाहिए।',
      remedy: 'मानक सामान्य या जेनेरिक वस्तु का नाम स्पष्ट रूप से लिखें (जैसे "बासमती चावल", "सरसों का तेल")।',
    },
  },

  RULE_MISSING_NET_QTY: {
    en: {
      title: 'Missing Net Quantity Declaration',
      explanation: 'Under Rule 6(1)(c), every package must declare the net quantity in terms of standard units of weight, volume, or number.',
      remedy: 'Indicate net quantity clearly (e.g. Net Qty: 500 g, 1 kg, 1 L).',
    },
    hi: {
      title: 'शुद्ध मात्रा (Net Quantity) अनुपलब्ध',
      explanation: 'नियम 6(1)(c) के तहत प्रत्येक पैकेज पर वजन, आयतन या संख्या की मानक इकाइयों में शुद्ध मात्रा घोषित करना अनिवार्य है।',
      remedy: 'शुद्ध मात्रा स्पष्ट रूप से इंगित करें (उदा. शुद्ध मात्रा: 500 g, 1 kg, 1 L)।',
    },
  },

  RULE_INVALID_UNIT_SYMBOL: {
    en: {
      title: 'Non-Standard Metric Unit Symbol',
      explanation: 'Under Rule 7 and Schedule II, only standard metric symbols (g, kg, ml, l, N) are permissible. Symbols such as "gms", "kilos", "ltrs", or "gm" violate Legal Metrology rules.',
      remedy: 'Replace non-standard symbols like "gms" with statutory symbol "g", "kilos" with "kg", and "ltrs" with "l".',
    },
    hi: {
      title: 'अमानक मीट्रिक इकाई प्रतीक',
      explanation: 'नियम 7 और अनुसूची II के तहत केवल मानक मीट्रिक प्रतीकों (g, kg, ml, l, N) की अनुमति है। "gms", "kilos", "ltrs", या "gm" जैसे प्रतीक विधिक मापविज्ञान नियमों का उल्लंघन करते हैं।',
      remedy: '"gms" के स्थान पर वैधानिक प्रतीक "g", "kilos" के स्थान पर "kg", और "ltrs" के स्थान पर "l" का उपयोग करें।',
    },
  },

  RULE_MISSING_MRP: {
    en: {
      title: 'Missing Maximum Retail Price (MRP)',
      explanation: 'Under Rule 6(1)(e), the retail sale price of the package must be declared in the statutory format including all taxes.',
      remedy: 'Print MRP clearly in the format: "MRP Rs. xx.xx (incl. of all taxes)" or "Maximum Retail Price ₹ xx.xx (inclusive of all taxes)".',
    },
    hi: {
      title: 'अधिकतम खुदरा मूल्य (MRP) अनुपलब्ध',
      explanation: 'नियम 6(1)(e) के तहत पैकेज का खुदरा विक्रय मूल्य सभी करों सहित वैधानिक प्रारूप में घोषित किया जाना चाहिए।',
      remedy: 'एमआरपी को स्पष्ट रूप से "MRP Rs. xx.xx (सभी करों सहित)" प्रारूप में मुद्रित करें।',
    },
  },

  RULE_MISSING_TAX_INCLUSION: {
    en: {
      title: 'Missing "Inclusive of all taxes" Phrasing',
      explanation: 'Under Rule 6(1)(e), MRP must be explicitly accompanied by the wording "inclusive of all taxes" or "incl. of all taxes".',
      remedy: 'Add "(inclusive of all taxes)" next to the MRP figure.',
    },
    hi: {
      title: '"सभी करों सहित" विवरण अनुपलब्ध',
      explanation: 'नियम 6(1)(e) के तहत MRP के साथ "सभी करों सहित" (inclusive of all taxes) वाक्यांश होना अनिवार्य है।',
      remedy: 'MRP आंकड़े के बगल में "(inclusive of all taxes)" जोड़ें।',
    },
  },

  RULE_MISSING_MFG_DATE: {
    en: {
      title: 'Missing Date of Manufacture / Packing',
      explanation: 'Under Rule 6(1)(d), the month and year in which the commodity is manufactured or pre-packed must be clearly stated.',
      remedy: 'Declare the packing/manufacturing date as MM/YYYY (e.g. "03/2026") or Month and Year.',
    },
    hi: {
      title: 'निर्माण / पैकिंग की तारीख अनुपलब्ध',
      explanation: 'नियम 6(1)(d) के तहत वस्तु के निर्माण या प्री-पैकिंग का महीना और वर्ष स्पष्ट रूप से लिखा होना चाहिए।',
      remedy: 'पैकिंग/निर्माण की तारीख को MM/YYYY (उदा. "03/2026") के रूप में घोषित करें।',
    },
  },

  RULE_AMBIGUOUS_DATE: {
    en: {
      title: 'Ambiguous Date Representation',
      explanation: 'The declared date could be interpreted in both DD/MM/YYYY and MM/DD/YYYY formats.',
      remedy: 'Use unambiguous textual month format (e.g. "05 MAY 2026") or standard DD/MM/YYYY.',
    },
    hi: {
      title: 'अस्पष्ट तारीख प्रारूप',
      explanation: 'घोषित तिथि को DD/MM/YYYY और MM/DD/YYYY दोनों प्रारूपों में समझा जा सकता है।',
      remedy: 'महीने का नाम लिखकर स्पष्ट प्रारूप का उपयोग करें (उदा. "05 MAY 2026")।',
    },
  },

  RULE_MISSING_COUNTRY_OF_ORIGIN: {
    en: {
      title: 'Missing Country of Origin Declaration',
      explanation: 'Under Rule 6(1)(da), the name of the country of origin or manufacture is mandatory on all packaged commodities.',
      remedy: 'Declare origin clearly (e.g. "Country of Origin: India" or "Made in India").',
    },
    hi: {
      title: 'मूल देश (Country of Origin) अनुपलब्ध',
      explanation: 'नियम 6(1)(da) के तहत सभी पैक की गई वस्तुओं पर मूल देश का नाम घोषित करना अनिवार्य है।',
      remedy: 'मूल देश को स्पष्ट रूप से घोषित करें (उदा. "Country of Origin: India" या "Made in India")।',
    },
  },

  RULE_MISSING_CONSUMER_CARE: {
    en: {
      title: 'Missing Consumer Grievance Contact',
      explanation: 'Under Rule 6(1)(e) (amended 2017), the name, address, telephone number, and email of the consumer grievance redressal cell must be declared.',
      remedy: 'Include complete consumer contact: Toll-Free phone number, email address, and postal address.',
    },
    hi: {
      title: 'उपभोक्ता शिकायत निवारण संपर्क अनुपलब्ध',
      explanation: 'नियम 6(1)(e) (संशोधित 2017) के तहत उपभोक्ता शिकायत निवारण प्रकोष्ठ का नाम, पता, फोन नंबर और ईमेल घोषित किया जाना चाहिए।',
      remedy: 'टोल-फ्री फोन नंबर, ईमेल और डाक पता सहित पूर्ण उपभोक्ता देखभाल विवरण शामिल करें।',
    },
  },

  RULE_INCOMPLETE_CONSUMER_CARE: {
    en: {
      title: 'Incomplete Consumer Care Details',
      explanation: 'Consumer care contact was detected, but telephone or email is missing.',
      remedy: 'Ensure both a telephone helpline and an email address are provided.',
    },
    hi: {
      title: 'अपूर्ण उपभोक्ता देखभाल विवरण',
      explanation: 'उपभोक्ता देखभाल संपर्क मिला, लेकिन फोन या ईमेल में से एक अनुपलब्ध है।',
      remedy: 'सुनिश्चित करें कि फोन हेल्पलाइन और ईमेल पता दोनों प्रदान किए गए हैं।',
    },
  },

  RULE_MISSING_UNIT_SALE_PRICE: {
    en: {
      title: 'Missing Unit Sale Price (USP)',
      explanation: 'Under Rule 6(11) (as amended in 2021), commodities sold by weight/volume should indicate Unit Sale Price (e.g. ₹/g, ₹/kg, ₹/ml, ₹/l) alongside MRP.',
      remedy: 'Print Unit Sale Price near MRP (e.g. "Unit Sale Price: ₹ 0.50 / g").',
    },
    hi: {
      title: 'यूनिट सेल प्राइस (USP) अनुपलब्ध',
      explanation: '2021 में संशोधित नियम 6(11) के तहत वजन/मात्रा द्वारा बेची जाने वाली वस्तुओं को MRP के साथ यूनिट सेल प्राइस (उदा. ₹/g, ₹/ml) दर्शाना चाहिए।',
      remedy: 'MRP के पास यूनिट सेल प्राइस मुद्रित करें (उदा. "Unit Sale Price: ₹ 0.50 / g")।',
    },
  },

  RULE_UNVERIFIABLE_PDP: {
    en: {
      title: 'Principal Display Panel Physical Verification Required',
      explanation: 'Verification of font height in mm and PDP ratio requires physical measurement or calibrated 3D dimensions of the packaging.',
      remedy: 'Conduct physical inspection using a Legal Metrology font gauge.',
    },
    hi: {
      title: 'मुख्य प्रदर्शन पैनल भौतिक सत्यापन आवश्यक',
      explanation: 'मिमी में फॉन्ट आकार और पीडीपी अनुपात के सत्यापन के लिए पैकेज के भौतिक माप की आवश्यकता होती है।',
      remedy: 'विधिक मापविज्ञान गेज का उपयोग करके भौतिक निरीक्षण करें।',
    },
  },

  RULE_UNVERIFIABLE_OCR: {
    en: {
      title: 'Declaration Unverifiable Due to OCR Clarity',
      explanation: 'The declaration could not be reliably verified because the image was blurry, skewed, or OCR confidence was below acceptable threshold.',
      remedy: 'Capture and upload a higher-resolution photograph with even lighting and minimal glare.',
    },
    hi: {
      title: 'ओसीआर स्पष्टता के कारण सत्यापन असमर्थ',
      explanation: 'छवि के धुंधले होने या ओसीआर गुणवत्ता कम होने के कारण घोषणा को सत्यापित नहीं किया जा सका।',
      remedy: 'समान प्रकाश और बिना चमक के उच्च-रिज़ॉल्यूशन वाली तस्वीर लें और अपलोड करें।',
    },
  },

  RULE_MISSING_EXPIRY_DATE: {
    en: {
      title: 'Missing Expiry / Best-Before Date on Food Package',
      explanation: 'Under packaging rules, pre-packaged food commodities must declare Best-Before date or Use-by/Expiry date.',
      remedy: 'Declare Best-Before date (e.g. "Best before 6 months from packaging") or Expiry date.',
    },
    hi: {
      title: 'खाद्य पैकेज पर समाप्ति / सर्वश्रेष्ठ उपयोग तिथि अनुपलब्ध',
      explanation: 'पैकेजिंग नियमों के तहत खाद्य उत्पादों पर सर्वश्रेष्ठ उपयोग तिथि या समाप्ति तिथि घोषित करना अनिवार्य है।',
      remedy: 'सर्वश्रेष्ठ उपयोग तिथि या समाप्ति तिथि घोषित करें।',
    },
  },
};
