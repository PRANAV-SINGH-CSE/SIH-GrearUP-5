import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getRules } from '@/app/api/rules/route';
import { GET as getCategories } from '@/app/api/categories/route';
import { POST as postScan, GET as listScans } from '@/app/api/scans/route';
import { GET as getScan, DELETE as deleteScan } from '@/app/api/scans/[id]/route';
import { GET as getCompliance } from '@/app/api/scans/[id]/compliance/route';
import { GET as getReport } from '@/app/api/scans/[id]/report/route';
import { POST as postOfflineSync } from '@/app/api/offline/sync/route';

describe('CompliScan REST API Endpoints', () => {
  it('GET /api/rules returns list of LMPC 2011 legal rules', async () => {
    const req = new NextRequest('http://localhost:3000/api/rules');
    const res = await getRules(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.rulesetVersion).toBe('LMPC-2011.v2026');
    expect(json.data.rules.length).toBeGreaterThanOrEqual(10);
    expect(json.data.rules.some((r: any) => r.id === 'LMPC-R06-MRP-01')).toBe(true);
  });

  it('GET /api/categories returns supported product categories', async () => {
    const res = await getCategories();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.length).toBeGreaterThanOrEqual(3);
    expect(json.data.some((c: any) => c.code === 'FOOD_PRODUCT')).toBe(true);
  });

  it('POST /api/scans with JSON base64 creates and evaluates a scan', async () => {
    // 1x1 transparent png
    const dummyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const req = new NextRequest('http://localhost:3000/api/scans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: dummyPng,
        filename: 'COMPLIANT_COMMODITY.png',
        mimeType: 'image/png',
        category: 'GENERIC_PACKAGED_COMMODITY',
      }),
    });

    const res = await postScan(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.scan.id).toBeDefined();
    expect(json.data.report.overallStatus).toBeDefined();

    const scanId = json.data.scan.id;

    // Test GET /api/scans/:id
    const getReq = new NextRequest(`http://localhost:3000/api/scans/${scanId}`);
    const getRes = await getScan(getReq, { params: Promise.resolve({ id: scanId }) });
    expect(getRes.status).toBe(200);
    const getJson = await getRes.json();
    expect(getJson.data.id).toBe(scanId);

    // Test GET /api/scans/:id/compliance
    const compReq = new NextRequest(`http://localhost:3000/api/scans/${scanId}/compliance`);
    const compRes = await getCompliance(compReq, { params: Promise.resolve({ id: scanId }) });
    expect(compRes.status).toBe(200);
    const compJson = await compRes.json();
    expect(compJson.data.overallStatus).toBeDefined();

    // Test GET /api/scans/:id/report (JSON format)
    const repReq = new NextRequest(`http://localhost:3000/api/scans/${scanId}/report?lang=hi`);
    const repRes = await getReport(repReq, { params: Promise.resolve({ id: scanId }) });
    expect(repRes.status).toBe(200);
    const repJson = await repRes.json();
    expect(repJson.data.locale).toBe('hi');

    // Test GET /api/scans/:id/report (HTML format)
    const htmlReq = new NextRequest(`http://localhost:3000/api/scans/${scanId}/report?format=html&lang=en`);
    const htmlRes = await getReport(htmlReq, { params: Promise.resolve({ id: scanId }) });
    expect(htmlRes.status).toBe(200);
    expect(htmlRes.headers.get('content-type')).toContain('text/html');

    // Test DELETE /api/scans/:id
    const delReq = new NextRequest(`http://localhost:3000/api/scans/${scanId}`, { method: 'DELETE' });
    const delRes = await deleteScan(delReq, { params: Promise.resolve({ id: scanId }) });
    expect(delRes.status).toBe(200);
  });

  it('GET /api/scans returns paginated scan records', async () => {
    const req = new NextRequest('http://localhost:3000/api/scans?limit=10&offset=0');
    const res = await listScans(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('POST /api/offline/sync validates schema and synchronizes field scans', async () => {
    const req = new NextRequest('http://localhost:3000/api/offline/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: 'FIELD-INSPECTION-TAB-4',
        clientTimestamp: new Date().toISOString(),
        items: [
          {
            offlineClientId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            capturedAt: new Date().toISOString(),
            category: 'GENERIC_PACKAGED_COMMODITY',
            localRulesetVersion: 'LMPC-2011.v2026',
            extractedDeclarations: {
              productName: { value: 'Basmati Rice', confidence: 0.95, extractionMethod: 'deterministic' },
              genericName: { value: 'Rice', confidence: 0.95, extractionMethod: 'deterministic' },
              manufacturer: { value: { name: 'Field Mills Ltd' }, confidence: 0.95, extractionMethod: 'deterministic' },
              packer: { value: null, confidence: 0, extractionMethod: 'deterministic' },
              importer: { value: null, confidence: 0, extractionMethod: 'deterministic' },
              netQuantity: { value: { value: 1, unit: 'kg', rawUnit: 'kg', isValidUnit: true }, confidence: 0.95, extractionMethod: 'deterministic' },
              mrp: { value: { amount: 150, currency: 'INR', isTaxInclusive: true }, confidence: 0.95, extractionMethod: 'deterministic' },
              unitSalePrice: { value: { amount: 150, perUnit: 'kg', currency: 'INR' }, confidence: 0.9, extractionMethod: 'deterministic' },
              countryOfOrigin: { value: 'India', confidence: 0.95, extractionMethod: 'deterministic' },
              manufactureDate: { value: { month: 2, year: 2026, rawText: '02/2026', isAmbiguous: false }, confidence: 0.95, extractionMethod: 'deterministic' },
              packingDate: { value: null, confidence: 0, extractionMethod: 'deterministic' },
              bestBefore: { value: '12 months', confidence: 0.9, extractionMethod: 'deterministic' },
              expiryDate: { value: null, confidence: 0, extractionMethod: 'deterministic' },
              consumerCare: { value: { phone: '1800-111-222', email: 'care@field.in' }, confidence: 0.95, extractionMethod: 'deterministic' },
              batchNumber: { value: 'B-77', confidence: 0.95, extractionMethod: 'deterministic' },
              rawFields: {},
              overallConfidence: 0.95,
              extractionMethod: 'deterministic',
            },
            imageHash: 'aabbcc112233',
          },
        ],
      }),
    });

    const res = await postOfflineSync(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.processedCount).toBe(1);
    expect(json.data.results[0].syncStatus).toBe('SYNCED');
  });
});
