// ============================================================================
// GeneratorFormV2 — Single reactive form (no multi-step), live validation
// ProformaFlow · FASE 2
// ============================================================================
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type {
  ShipmentData, DocumentType, Carrier, CountryGroup, Parties, ProductLine,
  CarrierSpecificData, OutputConfig,
} from '@/types/shipment';
import { ShipmentSchema } from '@/validation/schemas';
import { validateShipment } from '@/validation';
import { PartyForm } from './steps/PartyForm';
import { LinesForm } from './steps/LinesForm';
import { CarrierForm } from './steps/CarrierForm';
import { OutputForm } from './steps/OutputForm';
import { PreviewEngine } from '@/components/preview/PreviewEngine';
import { generatePDF, downloadPDF, generateEDI } from '@/components/pdf/generators/pdfFactory';

const STEPS = ['Document Type', 'Parties', 'Lines', 'Carrier', 'Output & Preview'] as const;

export function GeneratorFormV2({
  planWatermark = false, planAllTypes = true, planCarrierReady = true,
  remainingDocs = null, plan = 'starter',
}: {
  planWatermark?: boolean; planAllTypes?: boolean; planCarrierReady?: boolean;
  remainingDocs?: number | null; plan?: string;
}) {
  const [activeDoc, setActiveDoc] = useState<DocumentType>('CI_FEDEX');
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ShipmentData>(getDefault(activeDoc));

  const carrier: Carrier = activeDoc === 'CI_FEDEX' ? 'FEDEX'
    : activeDoc === 'CI_UPS' ? 'UPS'
    : activeDoc === 'CI_DHL' ? 'DHL' : 'NONE';

  const update = useCallback((patch: Partial<ShipmentData>) => {
    setData((prev) => ({ ...prev, ...patch, documentType: activeDoc, carrier }));
  }, [activeDoc, carrier]);

  const validation = useMemo(
    () => validateShipment(data, new Map([[activeDoc, data]])),
    [activeDoc, data]
  );

  const handleGenerate = useCallback(async () => {
        const result = ShipmentSchema.safeParse(data);
        if (!result.success) {
          console.error('Validation failed:', result.error.flatten());
          alert('Validation errors. Please review the form.');
          return;
        }
        if (!validation.canGenerate) {
          alert('Blocking errors present. Cannot generate.');
          return;
        }
        try {
          if (data.output.outputFormat === 'PDF' || data.output.outputFormat === 'BOTH') {
            const blob = await generatePDF(data);
            const filename = `${activeDoc}_${data.issueDate}.pdf`;
            downloadPDF(blob, filename);
          }
          if (data.output.outputFormat === 'EDI_JSON' || data.output.outputFormat === 'BOTH') {
            const edi = generateEDI(data);
            if (edi) {
              const blob = new Blob([JSON.stringify(edi.payload, null, 2)], { type: 'application/json' });
              downloadPDF(blob, `${activeDoc}_${edi.format}.json`);
            }
          }
          alert('Document generated successfully.');
        } catch (err) {
        console.error('Generation error:', err);
        alert('Generation error: ' + (err as Error).message);
      }
    }, [data, validation, activeDoc]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 1400, margin: '0 auto', padding: 16 }}>
      {/* Left: Form */}
      <div>
        {/* Stepper */}
        <div style={{ display: 'flex', marginBottom: 16 }}>
          {STEPS.map((s, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              flex: 1, padding: '8px 4px', fontSize: 12, border: 'none',
              borderBottom: i === step ? '3px solid #16a34a' : '3px solid #e5e7eb',
              background: 'none', cursor: 'pointer', fontWeight: i === step ? 700 : 400,
              color: i <= step ? '#111' : '#9ca3af',
            }}>{i + 1}. {s}</button>
          ))}
        </div>

        {/* Plan Banner */}
        <div style={{ marginBottom: 12, padding: '8px 12px', background: planWatermark ? '#fef3c7' : '#eff6ff', borderRadius: 6, fontSize: 12 }}>
          <strong>Plan: {plan.toUpperCase()}</strong>
          {remainingDocs !== null && <span> · Docs remaining: {remainingDocs}</span>}
          {!planAllTypes && <span style={{ color: '#dc2626' }}> · Limited types</span>}
          {!planCarrierReady && <span style={{ color: '#dc2626' }}> · Limited carriers</span>}
          {planWatermark && <span style={{ color: '#b45309' }}> · Watermark active</span>}
        </div>

        {/* Doc Type Selector */}
        {step === 0 && (
          <div>
            <label style={labelStyle}>Document Type *</label>
            <select style={inputStyle} value={activeDoc} onChange={(e) => {
              const newDoc = e.target.value as DocumentType;
              setActiveDoc(newDoc);
              setData(getDefault(newDoc));
              setStep(1);
            }}>
              <option value="CI_FEDEX">Commercial Invoice — FedEx</option>
              <option value="CI_UPS">Commercial Invoice — UPS</option>
              <option value="CI_DHL">Commercial Invoice — DHL</option>
              <option value="PACKING_LIST">Packing List</option>
              <option value="BUNDLE_CIPL">Bundle (CI + PL)</option>
              <option value="PROFORMA">Proforma Invoice</option>
            </select>
            <label style={labelStyle}>Destination Country (ISO-2)</label>
            <input style={inputStyle} value={data.destinationCountryCode}
              onChange={(e) => {
                const code = e.target.value.toUpperCase();
                const group = code === 'US' || code === 'CA' ? 'US_CA' as CountryGroup
                  : code === 'MX' ? 'MX' as CountryGroup
                  : ['DE','FR','ES','IT','NL','PT','BE','AT','SE','PL','IE','DK','FI','CZ','RO','HU','GR'].includes(code) ? 'EU' as CountryGroup
                  : 'REST_OF_WORLD' as CountryGroup;
                update({ destinationCountryCode: code, destinationCountryGroup: group });
              }} placeholder="US" />
            <label style={labelStyle}>Issue Date</label>
            <input type="date" style={inputStyle} value={data.issueDate}
              onChange={(e) => update({ issueDate: e.target.value })} />
            {activeDoc === 'PROFORMA' && (
              <label style={labelStyle}>Validity Days</label>
            )}
            {activeDoc === 'PROFORMA' && (
              <input type="number" style={inputStyle} value={data.validityDays || 30}
                onChange={(e) => update({ validityDays: Number(e.target.value) })} />
            )}
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button style={btnPrimary} onClick={() => setStep(1)}>Next →</button>
            </div>
          </div>
        )}

        {step === 1 && (
          <PartyForm documentType={activeDoc} carrier={carrier} value={data.parties}
            onChange={(parties: Parties) => update({ parties })} />
        )}
        {step === 2 && (
          <LinesForm documentType={activeDoc} carrier={carrier} value={data.lines}
            destinationCountry={data.destinationCountryCode}
            onChange={(lines: ProductLine[]) => {
              const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
              update({
                lines,
                totals: {
                  ...data.totals,
                  totalLines: lines.length,
                  totalQuantity: lines.reduce((s, l) => s + l.quantity, 0),
                  subtotal,
                  grandTotal: subtotal + data.totals.totalAdditionalCosts,
                  totalNetWeightKg: lines.reduce((s, l) => s + l.netWeightKg, 0),
                  totalGrossWeightKg: lines.reduce((s, l) => s + l.grossWeightKg, 0),
                  totalPackages: lines.reduce((s, l) => s + (l.packages?.length || 0), 0),
                },
              });
            }} />
        )}
        {step === 3 && (
          <CarrierForm documentType={activeDoc} carrier={carrier}
            value={data.carrierSpecific}
            onChange={(carrierSpecific: CarrierSpecificData) => update({ carrierSpecific })} />
        )}
        {step === 4 && (
                          <OutputForm documentType={activeDoc} destinationCountryGroup={data.destinationCountryGroup}
                              value={data.output} onChange={(output: OutputConfig) => update({ output })}
                              blockingErrors={validation.blocking.map((i) => ({ code: i.code, message: i.message, field: i.field }))}
                              warnings={validation.warnings.map((i) => ({ code: i.code, message: i.message, field: i.field, recommendation: i.recommendation }))}
                              onGenerate={handleGenerate}
                          /> 
                        )}

        {/* Navigation */}
        {step > 0 && step < 4 && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
            <button style={btnSecondary} onClick={() => setStep(step - 1)}>← Back</button>
            <button style={btnPrimary} onClick={() => setStep(step + 1)}>Next →</button>
          </div>
        )}
        {step === 4 && (
          <div style={{ marginTop: 16 }}>
            <button style={btnSecondary} onClick={() => setStep(3)}>← Back</button>
          </div>
        )}
      </div>

      {/* Right: Preview */}
            <div>
              <PreviewEngine
                              data={data}
                              activeDocument={activeDoc}
                              crossWarnings={validation.warnings.map((i) => ({ code: i.code, message: i.message, field: i.field, recommendation: i.recommendation }))}
                            />
            </div>
    </div>
  );
}

function getDefault(doc: DocumentType): ShipmentData {
  const carrier: Carrier = doc === 'CI_FEDEX' ? 'FEDEX' : doc === 'CI_UPS' ? 'UPS' : doc === 'CI_DHL' ? 'DHL' : 'NONE';
  return {
    shipmentId: crypto.randomUUID(),
    documentType: doc,
    carrier,
    destinationCountryCode: 'US',
    destinationCountryGroup: 'US_CA',
    issueDate: new Date().toISOString().slice(0, 10),
    ...(doc === 'PROFORMA' ? { validityDays: 30 } : {}),
    parties: {
      shipper: emptyParty(), consignee: emptyParty(),
    },
    lines: [{
      lineNumber: 1, description: '', hsCode: '', hsCodeSource: 'USER',
      countryOfOrigin: '', countryOfOriginName: '', quantity: 1, uom: 'PCS',
      unitPrice: 0, currency: 'USD', lineTotal: 0, netWeightKg: 0, grossWeightKg: 0,
    }],
    totals: {
      totalLines: 1, totalQuantity: 1, totalNetWeightKg: 0, totalGrossWeightKg: 0,
      totalVolumeCbm: 0, totalPackages: 0, subtotal: 0, totalAdditionalCosts: 0,
      grandTotal: 0, currency: 'USD',
    },
    carrierSpecific: {},
    output: { paperSize: 'LETTER', orientation: 'PORTRAIT', language: 'EN', includeSignature: false, outputFormat: 'PDF' },
  };
}

function emptyParty() {
  return {
    legalName: '', taxId: '', taxIdType: 'EIN' as const,
    address: { street: '', city: '', stateProvince: '', postalCode: '', countryCode: '', countryName: '' },
  };
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, display: 'block', color: '#374151', marginTop: 8 };
const inputStyle: React.CSSProperties = { padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, width: '100%', boxSizing: 'border-box', marginTop: 2 };
const btnPrimary: React.CSSProperties = { padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer' };
