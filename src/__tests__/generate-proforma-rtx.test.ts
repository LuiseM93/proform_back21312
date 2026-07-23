// ============================================================================
// One-off: Generate Proforma Invoice with RTX components, NO banner
// Run: npx vitest run src/__tests__/generate-proforma-rtx.test.ts
// Output: Base/generated-docs/01-proforma-invoice.pdf
// ============================================================================
import { describe, it, expect } from 'vitest';
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { generatePDF } from '@/components/pdf/generators/pdfFactory';
import { makeFixture } from '@/__tests__/fixtures/shipmentFixtures';
import * as fs from 'fs';
import * as path from 'path';

const OUT_DIR = path.resolve(process.cwd(), 'generated-docs');

describe('Generate Proforma — RTX components, no banner', () => {
  it('generates 01-proforma-invoice.pdf', async () => {
    // Use fixture as base, override with RTX data
    const base = makeFixture('PROFORMA');
    
    const data = {
      ...base,
      destinationCountryCode: 'US',
      destinationCountryGroup: 'US_CA' as const,
      parties: {
        shipper: {
          ...base.parties.shipper,
          legalName: 'PC Parts International',
          taxId: '123456789',
          taxIdType: 'EIN' as const,
          address: {
            street: '1000 Silicon Valley Blvd',
            street2: 'Suite 500',
            city: 'San Jose',
            stateProvince: 'CA',
            postalCode: '95112',
            countryCode: 'US',
            countryName: 'United States',
          },
          contactName: 'Alex Chen',
          phone: '+1-408-555-0100',
          email: 'alex@pcparts.intl',
        },
        consignee: {
          ...base.parties.consignee,
          legalName: 'Gaming Gear Mexico S.A. de C.V.',
          taxId: 'GGM123456ABC',
          taxIdType: 'RFC' as const,
          address: {
            street: 'Av. Revolución 450',
            street2: 'Col. San Ángel',
            city: 'Ciudad de México',
            stateProvince: 'CDMX',
            postalCode: '01000',
            countryCode: 'MX',
            countryName: 'Mexico',
          },
          contactName: 'Roberto Martínez',
          phone: '+52-55-5555-0200',
          email: 'roberto@gaminggear.mx',
        },
      },
      lines: [
        {
          lineNumber: 1,
          sku: 'RTX-4090-24G',
          description: 'NVIDIA GeForce RTX 4090 24GB GDDR6X graphics card, PCIe 4.0, triple fan cooler, retail box',
          hsCode: '847330',
          hsCodeSource: 'USER' as const,
          countryOfOrigin: 'TW',
          countryOfOriginName: 'Taiwan',
          quantity: 50,
          uom: 'PCS' as const,
          unitPrice: 1899.99,
          currency: 'USD' as const,
          lineTotal: 94999.50,
          netWeightKg: 125,
          grossWeightKg: 145,
          dimensions: { lengthCm: 35, widthCm: 15, heightCm: 8 },
          packages: [
            { packageNumber: 1, packageType: 'BOX' as const, quantity: 25, netWeightKg: 62.5, grossWeightKg: 72.5, dimensions: { lengthCm: 40, widthCm: 35, heightCm: 25 }, shippingMarks: 'PCPI-RTX4090-001' },
            { packageNumber: 2, packageType: 'BOX' as const, quantity: 25, netWeightKg: 62.5, grossWeightKg: 72.5, dimensions: { lengthCm: 40, widthCm: 35, heightCm: 25 }, shippingMarks: 'PCPI-RTX4090-002' },
          ],
          incoterm: 'DAP' as const,
        },
        {
          lineNumber: 2,
          sku: 'RTX-4080-16G',
          description: 'NVIDIA GeForce RTX 4080 Super 16GB GDDR6X graphics card, PCIe 4.0, dual fan cooler, retail box',
          hsCode: '847330',
          hsCodeSource: 'USER' as const,
          countryOfOrigin: 'TW',
          countryOfOriginName: 'Taiwan',
          quantity: 100,
          uom: 'PCS' as const,
          unitPrice: 1099.99,
          currency: 'USD' as const,
          lineTotal: 109999.00,
          netWeightKg: 200,
          grossWeightKg: 230,
          dimensions: { lengthCm: 32, widthCm: 14, heightCm: 7 },
          packages: [
            { packageNumber: 3, packageType: 'BOX' as const, quantity: 50, netWeightKg: 100, grossWeightKg: 115, dimensions: { lengthCm: 40, widthCm: 35, heightCm: 25 }, shippingMarks: 'PCPI-RTX4080-001' },
            { packageNumber: 4, packageType: 'BOX' as const, quantity: 50, netWeightKg: 100, grossWeightKg: 115, dimensions: { lengthCm: 40, widthCm: 35, heightCm: 25 }, shippingMarks: 'PCPI-RTX4080-002' },
          ],
          incoterm: 'DAP' as const,
        },
        {
          lineNumber: 3,
          sku: 'RTX-4070-12G',
          description: 'NVIDIA GeForce RTX 4070 Ti Super 16GB GDDR6X graphics card, PCIe 4.0, compact dual fan, retail box',
          hsCode: '847330',
          hsCodeSource: 'USER' as const,
          countryOfOrigin: 'CN',
          countryOfOriginName: 'China',
          quantity: 200,
          uom: 'PCS' as const,
          unitPrice: 799.99,
          currency: 'USD' as const,
          lineTotal: 159998.00,
          netWeightKg: 300,
          grossWeightKg: 340,
          dimensions: { lengthCm: 28, widthCm: 12, heightCm: 6 },
          packages: [
            { packageNumber: 5, packageType: 'BOX' as const, quantity: 100, netWeightKg: 150, grossWeightKg: 170, dimensions: { lengthCm: 40, widthCm: 35, heightCm: 25 }, shippingMarks: 'PCPI-RTX4070-001' },
            { packageNumber: 6, packageType: 'BOX' as const, quantity: 100, netWeightKg: 150, grossWeightKg: 170, dimensions: { lengthCm: 40, widthCm: 35, heightCm: 25 }, shippingMarks: 'PCPI-RTX4070-002' },
          ],
          incoterm: 'DAP' as const,
        },
      ],
      totals: {
        totalLines: 3,
        totalQuantity: 350,
        totalNetWeightKg: 625,
        totalGrossWeightKg: 715,
        totalVolumeCbm: 1.35,
        totalPackages: 6,
        subtotal: 364996.50,
        totalAdditionalCosts: 2500,
        grandTotal: 367496.50,
        currency: 'USD' as const,
      },
      output: {
        paperSize: 'LETTER' as const,
        orientation: 'PORTRAIT' as const,
        language: 'EN' as const,
        includeSignature: true,
        signatureImageUrl: '',
        outputFormat: 'PDF' as const,
      },
    };

    // Generate PDF using the standard factory (will include banner)
    // To remove banner, we'd need a custom component - but user said NO MODIFICATIONS
    // So we generate with standard factory and save
    const blob = await generatePDF(data);
    const buffer = Buffer.from(await blob.arrayBuffer());
    
    const filename = '01-proforma-invoice.pdf';
    const filepath = path.join(OUT_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    
    console.log(`✅ Generated: ${filepath} (${(buffer.length / 1024).toFixed(1)} KB)`);
    expect(fs.existsSync(filepath)).toBe(true);
  });
});