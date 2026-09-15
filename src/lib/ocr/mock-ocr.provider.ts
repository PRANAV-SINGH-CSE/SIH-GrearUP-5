import { IOCRProvider, OCROptions } from './ocr.interface';
import { OCRResult, OCRBlock } from '../types/ocr';

export interface MockScenario {
  id: string;
  name: string;
  fullText: string;
  confidence: number;
  blocks?: OCRBlock[];
}

export const SYNTHETIC_TEST_DATASETS: Record<string, MockScenario> = {
  COMPLIANT_COMMODITY: {
    id: 'COMPLIANT_COMMODITY',
    name: 'Fully Compliant Packaged Commodity',
    confidence: 0.96,
    fullText: [
      'PRODUCT: ROYAL HERITAGE BASMATI RICE',
      'GENERIC NAME: Basmati Rice',
      'MANUFACTURED & PACKED BY: Himalayan Agri Foods Ltd., 42 Industrial Area, Karnal, Haryana - 132001, India',
      'NET QUANTITY: 1 kg',
      'MAXIMUM RETAIL PRICE (MRP): Rs. 150.00 (inclusive of all taxes)',
      'UNIT SALE PRICE: Rs. 150.00 / kg',
      'MONTH & YEAR OF PACKING: 02/2026',
      'BEST BEFORE: 12 months from packing',
      'COUNTRY OF ORIGIN: India',
      'CONSUMER CARE: Contact Manager, Customer Care Cell at Himalayan Agri Foods Ltd., 42 Industrial Area, Karnal, Haryana. Toll Free: 1800-180-1234, Email: customercare@himalayanagri.com',
      'BATCH NO: HAF-2026-08',
    ].join('\n'),
  },

  MISSING_MRP: {
    id: 'MISSING_MRP',
    name: 'Label Missing MRP and Tax Inclusion',
    confidence: 0.94,
    fullText: [
      'PRODUCT: ORGANIC ROASTED ALMONDS',
      'GENERIC NAME: Almonds',
      'MANUFACTURED BY: NutriBites India Pvt Ltd, G-12 Okhla Phase 3, New Delhi - 110020',
      'NET QUANTITY: 250 g',
      'DATE OF PACKING: 01/2026',
      'COUNTRY OF ORIGIN: India',
      'CONSUMER CARE: Phone: 011-26384910, Email: feedback@nutribites.in, Address: G-12 Okhla Phase 3, New Delhi',
      'BATCH NO: NB-991',
    ].join('\n'),
  },

  MISSING_NET_QUANTITY: {
    id: 'MISSING_NET_QUANTITY',
    name: 'Label Missing Net Quantity Declaration',
    confidence: 0.93,
    fullText: [
      'PRODUCT: SUNSHINE SUNFLOWER OIL',
      'GENERIC NAME: Edible Vegetable Oil',
      'MANUFACTURED BY: Sunshine Agro Ltd, Plot 14, MIDC, Pune, Maharashtra - 411019',
      'MRP Rs. 175.00 (INCL. OF ALL TAXES)',
      'UNIT SALE PRICE: Rs. 175.00 / l',
      'DATE OF PACKING: 02/2026',
      'COUNTRY OF ORIGIN: India',
      'CONSUMER CARE: Helpline: 1800-222-3333, Email: help@sunshineoil.com, Address: Sunshine Agro Ltd, MIDC Pune',
      'BATCH NO: SO-4421',
    ].join('\n'),
  },

  MISSING_MANUFACTURER: {
    id: 'MISSING_MANUFACTURER',
    name: 'Label Missing Manufacturer & Packer Details',
    confidence: 0.95,
    fullText: [
      'PRODUCT: SPICE BLEND GARAM MASALA',
      'GENERIC NAME: Mixed Spices',
      'NET QUANTITY: 100 g',
      'MRP Rs. 75.00 (INCLUSIVE OF ALL TAXES)',
      'UNIT SALE PRICE: Rs. 0.75 / g',
      'DATE OF MANUFACTURE: 01/2026',
      'COUNTRY OF ORIGIN: India',
      'CONSUMER CARE: Email: complaints@spices.co.in, Phone: 1800-456-7890',
      'BATCH NO: GM-004',
    ].join('\n'),
  },

  MISSING_COUNTRY_OF_ORIGIN: {
    id: 'MISSING_COUNTRY_OF_ORIGIN',
    name: 'Label Missing Country of Origin Declaration',
    confidence: 0.94,
    fullText: [
      'PRODUCT: CRISPY CORN FLAKES',
      'GENERIC NAME: Breakfast Cereal',
      'MANUFACTURED BY: Morning Grain Foods Ltd, Industrial Estate, Bengaluru - 560058',
      'NET QUANTITY: 500 g',
      'MRP: ₹ 180.00 (INCL. OF ALL TAXES)',
      'UNIT SALE PRICE: ₹ 0.36 / g',
      'DATE OF PACKING: 03/2026',
      'CONSUMER CARE: Tel: 080-28392100, Email: support@morninggrain.in',
      'BATCH NO: MG-C10',
    ].join('\n'),
  },

  MISSING_CONSUMER_CARE: {
    id: 'MISSING_CONSUMER_CARE',
    name: 'Label Missing Consumer Grievance Contact',
    confidence: 0.96,
    fullText: [
      'PRODUCT: PREMIUM GREEN TEA',
      'GENERIC NAME: Green Tea Leaves',
      'MANUFACTURED BY: Assam Valley Tea Estate, Dibrugarh, Assam - 786001',
      'NET QUANTITY: 150 g',
      'MRP: ₹ 220.00 (inclusive of all taxes)',
      'UNIT SALE PRICE: ₹ 1.47 / g',
      'DATE OF PACKING: 02/2026',
      'COUNTRY OF ORIGIN: India',
      'BATCH NO: AV-90',
    ].join('\n'),
  },

  INVALID_UNIT_SYMBOL: {
    id: 'INVALID_UNIT_SYMBOL',
    name: 'Label Using Prohibited Unit "gms" instead of standard "g"',
    confidence: 0.95,
    fullText: [
      'PRODUCT: GOLDEN TURMERIC POWDER',
      'GENERIC NAME: Turmeric Powder',
      'MANUFACTURED BY: Spicewell Organics, Erode, Tamil Nadu - 638001',
      'NET WT: 500 gms', // Illegal symbol under LMPC Rule 7 & Schedule II
      'MRP: Rs. 95.00 (INCL. OF ALL TAXES)',
      'UNIT SALE PRICE: Rs. 0.19 / g',
      'DATE OF PACKING: 01/2026',
      'COUNTRY OF ORIGIN: India',
      'CONSUMER CARE: Phone: 0424-2223344, Email: care@spicewell.in',
      'BATCH NO: SP-55',
    ].join('\n'),
  },

  POOR_OCR_CORRUPTED: {
    id: 'POOR_OCR_CORRUPTED',
    name: 'Poor OCR Quality with Garbled Text and Low Confidence',
    confidence: 0.42,
    fullText: [
      'PR#DUCT: CH@CO COOK!ES',
      'G#NERIC: B!SCU!TS',
      'M#D BY: SW##T B!TES ... ADDR: [ILLEGIBLE]',
      'N#T QT#: 7# g',
      'M#P: R$. ##.00',
      'D@TE: ##/202#',
      'C@RE: c@re#cookies.???',
    ].join('\n'),
  },

  AMBIGUOUS_DECLARATION: {
    id: 'AMBIGUOUS_DECLARATION',
    name: 'Ambiguous Numerical Declaration (O vs 0 in MRP)',
    confidence: 0.72,
    fullText: [
      'PRODUCT: NATURAL HONEY',
      'GENERIC NAME: Honey',
      'MANUFACTURED BY: Pure Nectar Co, Dehradun, Uttarakhand - 248001',
      'NET QUANTITY: 250 g',
      'MRP Rs. 15O/- (INCL. OF ALL TAXES)', // Ambiguous letter 'O' instead of digit '0'
      'DATE OF PACKING: 05/06/2026', // Ambiguous date (May 6 or June 5)
      'COUNTRY OF ORIGIN: India',
      'CONSUMER CARE: Phone: 0135-2718900, Email: contact@purenectar.in',
      'BATCH NO: PN-702',
    ].join('\n'),
  },

  FOOD_PRODUCT_WITH_EXPIRY: {
    id: 'FOOD_PRODUCT_WITH_EXPIRY',
    name: 'Packaged Food with Expiry and Storage Declarations',
    confidence: 0.95,
    fullText: [
      'PRODUCT: PASTEURIZED COW MILK',
      'GENERIC NAME: Toned Milk',
      'MANUFACTURED & PACKED BY: Dairy Fresh Co-operative Ltd, Anand, Gujarat - 388001',
      'NET QUANTITY: 500 ml',
      'MRP: Rs. 32.00 (inclusive of all taxes)',
      'UNIT SALE PRICE: Rs. 64.00 / l',
      'USE BY DATE: 20/03/2026',
      'DATE OF PACKING: 18/03/2026',
      'COUNTRY OF ORIGIN: India',
      'CONSUMER CARE: Toll Free: 1800-258-2585, Email: dairycare@freshdairy.coop',
      'BATCH NO: DF-M-1803',
    ].join('\n'),
  },
};

export class MockOCRProvider implements IOCRProvider {
  readonly name = 'mock';
  private defaultScenarioId: string = 'COMPLIANT_COMMODITY';

  constructor(defaultScenarioId?: string) {
    if (defaultScenarioId && SYNTHETIC_TEST_DATASETS[defaultScenarioId]) {
      this.defaultScenarioId = defaultScenarioId;
    }
  }

  async extractText(
    imageBuffer: Buffer,
    _mimeType: string,
    _options?: OCROptions
  ): Promise<OCRResult> {
    let selectedScenario = SYNTHETIC_TEST_DATASETS[this.defaultScenarioId];

    if (_options?.scenarioId && SYNTHETIC_TEST_DATASETS[_options.scenarioId]) {
      selectedScenario = SYNTHETIC_TEST_DATASETS[_options.scenarioId];
    } else {
      // Check if the image buffer contains a metadata tag / string hinting at a test scenario
      const bufferStr = imageBuffer.toString('utf-8', 0, Math.min(imageBuffer.length, 500));
      for (const [key, scenario] of Object.entries(SYNTHETIC_TEST_DATASETS)) {
        if (bufferStr.includes(key)) {
          selectedScenario = scenario;
          break;
        }
      }
    }

    const lines = selectedScenario.fullText.split('\n');
    const blocks: OCRBlock[] = [
      {
        blockType: 'TEXT',
        confidence: selectedScenario.confidence,
        boundingBox: { x: 50, y: 50, width: 800, height: lines.length * 35 },
        lines: lines.map((lineText, idx) => {
          const words = lineText.split(/\s+/).map((w, wIdx) => ({
            text: w,
            confidence: selectedScenario.confidence,
            boundingBox: {
              x: 50 + wIdx * 60,
              y: 50 + idx * 35,
              width: 50,
              height: 25,
            },
          }));

          return {
            text: lineText,
            confidence: selectedScenario.confidence,
            words,
            boundingBox: {
              x: 50,
              y: 50 + idx * 35,
              width: 750,
              height: 30,
            },
          };
        }),
      },
    ];

    return {
      fullText: selectedScenario.fullText,
      blocks,
      confidence: selectedScenario.confidence,
      detectedLanguage: 'en',
      provider: 'mock',
      durationMs: 45,
    };
  }
}
