import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';

export async function GET() {
  try {
    const categories = [
      {
        code: 'GENERIC_PACKAGED_COMMODITY',
        name: 'Generic Packaged Commodity',
        description: 'Standard consumer packages under general provisions of Rule 6.',
        applicableRules: [
          'LMPC-R06-MFG-01',
          'LMPC-R06-GEN-01',
          'LMPC-R06-QTY-01',
          'LMPC-R07-UNIT-01',
          'LMPC-R06-MRP-01',
          'LMPC-R06-DATE-01',
          'LMPC-R06-COO-01',
          'LMPC-R06-CC-01',
          'LMPC-R06-USP-01',
          'LMPC-R09-PDP-01',
        ],
      },
      {
        code: 'FOOD_PRODUCT',
        name: 'Packaged Food & Beverage',
        description: 'Food products requiring expiry/best-before in addition to general declarations.',
        applicableRules: [
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
          'LMPC-R09-PDP-01',
        ],
      },
      {
        code: 'IMPORTED_COMMODITY',
        name: 'Imported Packaged Commodity',
        description: 'Goods imported into India requiring importer address, origin, and landing date.',
        applicableRules: [
          'LMPC-R06-MFG-01',
          'LMPC-R06-GEN-01',
          'LMPC-R06-QTY-01',
          'LMPC-R07-UNIT-01',
          'LMPC-R06-MRP-01',
          'LMPC-R06-DATE-01',
          'LMPC-R06-COO-01',
          'LMPC-R06-CC-01',
          'LMPC-R06-USP-01',
          'LMPC-R09-PDP-01',
        ],
      },
    ];

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
