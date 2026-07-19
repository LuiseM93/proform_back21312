'use client';

// ============================================================================
// CarrierForm — Campos específicos por carrier + validación en vivo
// ProformaFlow · FASE 2
// ============================================================================
import React from 'react';
import type { Carrier, DocumentType, CarrierSpecificData, FedExReasonForExport, DHLReasonForExport, DHLTypeOfExport, Incoterm2020 } from '@/types/shipment';
import { FEDEX_REASONS_FOR_EXPORT, DHL_REASONS_FOR_EXPORT, DHL_TYPES_OF_EXPORT, CURRENCIES } from '@/constants/controlled-vocabularies';

interface CarrierFormProps {
  documentType: DocumentType;
  carrier: Carrier;
  value: CarrierSpecificData;
  onChange: (data: CarrierSpecificData) => void;
}

export function CarrierForm({ documentType, carrier, value, onChange }: CarrierFormProps) {
  if (documentType === 'PROFORMA') {
    return <div style={{ padding: 16, color: '#666' }}>Proforma no requiere configuración de carrier.</div>;
  }

  return (
    <div className="carrier-form">
      {carrier === 'FEDEX' && <FedExForm value={value} onChange={onChange} />}
      {carrier === 'UPS' && <UpsForm value={value} onChange={onChange} />}
      {carrier === 'DHL' && <DhlForm value={value} onChange={onChange} />}
      {(documentType === 'PACKING_LIST' || documentType === 'BUNDLE_CIPL') && <PlForm value={value} onChange={onChange} />}
      {documentType === 'BUNDLE_CIPL' && <BundleForm value={value} onChange={onChange} />}
    </div>
  );
}

function FedExForm({ value, onChange }: { value: CarrierSpecificData; onChange: (d: CarrierSpecificData) => void }) {
  const fedex = value.fedex || { awbNumber: '', dutyTaxBilling: 'BILL_RECIPIENT' as const, reasonForExport: 'SALE' as FedExReasonForExport, etdEnabled: false };
  const set = (patch: Partial<NonNullable<CarrierSpecificData['fedex']>>) => onChange({ ...value, fedex: { ...fedex, ...patch } });
  return (
    <div style={blockStyle}>
      <h4>FedEx Configuration</h4>
      <label style={labelStyle}>AWB Number (12 digits) *</label>
      <input style={{ ...inputStyle, borderColor: fedex.awbNumber.length === 12 ? '#16a34a' : '#dc2626' }} value={fedex.awbNumber} maxLength={12} onChange={(e) => set({ awbNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })} placeholder="123456789012" />
      <label style={labelStyle}>Export References (PO#)</label>
      <input style={inputStyle} value={fedex.exportReferences || ''} onChange={(e) => set({ exportReferences: e.target.value })} />
      <label style={labelStyle}>Customs Procedure Code (EU/UK)</label>
      <input style={inputStyle} value={fedex.customsProcedureCode || ''} onChange={(e) => set({ customsProcedureCode: e.target.value })} />
      <label style={labelStyle}>Reason for Export</label>
      <select style={inputStyle} value={fedex.reasonForExport} onChange={(e) => set({ reasonForExport: e.target.value as FedExReasonForExport })}>{FEDEX_REASONS_FOR_EXPORT.map((r) => <option key={r} value={r}>{r}</option>)}</select>
      <label style={labelStyle}>Duty/Tax Billing</label>
      <select style={inputStyle} value={fedex.dutyTaxBilling} onChange={(e) => set({ dutyTaxBilling: e.target.value as 'BILL_RECIPIENT' | 'BILL_SHIPPER' })}><option value="BILL_RECIPIENT">Bill Recipient</option><option value="BILL_SHIPPER">Bill Shipper</option></select>
      <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={fedex.etdEnabled} onChange={(e) => set({ etdEnabled: e.target.checked })} /> ETD Enabled
      </label>
    </div>
  );
}

function UpsForm({ value, onChange }: { value: CarrierSpecificData; onChange: (d: CarrierSpecificData) => void }) {
  const ups = value.ups || {
    invoiceNumber: '', invoiceDate: new Date().toISOString().slice(0, 10), currencyOfSale: 'USD' as const, grossWeightKg: 0,
    termsOfSale: { code: 'DAP' as Incoterm2020, place: '', version: '2020' as const }, brokerageDutyBilling: 'CONSIGNEE' as const, additionalCosts: [],
    partiesRelationship: 'NOT_RELATED' as const,
  };
  const set = (patch: Partial<NonNullable<CarrierSpecificData['ups']>>) => onChange({ ...value, ups: { ...ups, ...patch } });
  return (
    <div style={blockStyle}>
      <h4>UPS Configuration</h4>
      <label style={labelStyle}>Invoice Number *</label>
      <input style={inputStyle} value={ups.invoiceNumber} onChange={(e) => set({ invoiceNumber: e.target.value })} />
      <label style={labelStyle}>Invoice Date *</label>
      <input type="date" style={inputStyle} value={ups.invoiceDate} onChange={(e) => set({ invoiceDate: e.target.value })} />
      <label style={labelStyle}>Currency of Sale</label>
      <select style={inputStyle} value={ups.currencyOfSale} onChange={(e) => set({ currencyOfSale: e.target.value as typeof ups.currencyOfSale })}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
      <label style={labelStyle}>Gross Shipment Weight (kg) *</label>
      <input type="number" style={inputStyle} value={ups.grossWeightKg} onChange={(e) => set({ grossWeightKg: Number(e.target.value) })} />
      <label style={labelStyle}>Terms of Sale (Incoterms 2020)</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <select style={{ ...inputStyle, flex: 1 }} value={ups.termsOfSale.code} onChange={(e) => set({ termsOfSale: { ...ups.termsOfSale, code: e.target.value as Incoterm2020 } })}>{['EXW','FCA','CPT','CIP','DAP','DPU','DDP','FAS','FOB','CFR','CIF'].map((i) => <option key={i} value={i}>{i}</option>)}</select>
        <input style={{ ...inputStyle, flex: 2 }} placeholder="Place" value={ups.termsOfSale.place} onChange={(e) => set({ termsOfSale: { ...ups.termsOfSale, place: e.target.value } })} />
      </div>
      <label style={labelStyle}>Brokerage/Duty Billing</label>
      <select style={inputStyle} value={ups.brokerageDutyBilling} onChange={(e) => set({ brokerageDutyBilling: e.target.value as 'CONSIGNEE' | 'SHIPPER' })}><option value="CONSIGNEE">Consignee</option><option value="SHIPPER">Shipper</option></select>
      <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={ups.partiesRelationship === 'RELATED'} onChange={(e) => set({ partiesRelationship: e.target.checked ? 'RELATED' : 'NOT_RELATED' })} />
        Parties are RELATED (intercompany)
      </label>
      <span style={{ fontSize: 11, color: ups.partiesRelationship === 'NOT_RELATED' ? '#666' : '#16a34a' }}>{ups.partiesRelationship === 'RELATED' ? '⚠ Related party — valuation required' : '✓ Not Related (standard valuation)'}</span>
    </div>
  );
}

function DhlForm({ value, onChange }: { value: CarrierSpecificData; onChange: (d: CarrierSpecificData) => void }) {
  const dhl = value.dhl || { awbNumber: '', shipmentReference: '', reasonForExport: 'SALE' as DHLReasonForExport, typeOfExport: 'PERMANENT' as DHLTypeOfExport, termsOfTrade: { code: 'DAP' as Incoterm2020, place: '', version: '2020' as const }, mydhlGenerated: false };
  const set = (patch: Partial<NonNullable<CarrierSpecificData['dhl']>>) => onChange({ ...value, dhl: { ...dhl, ...patch } });
  return (
    <div style={blockStyle}>
      <h4>DHL Configuration</h4>
      <label style={labelStyle}>AWB Number (10 digits) *</label>
      <input style={{ ...inputStyle, borderColor: dhl.awbNumber.length === 10 ? '#16a34a' : '#dc2626' }} value={dhl.awbNumber} maxLength={10} onChange={(e) => set({ awbNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="1234567890" />
      <label style={labelStyle}>Shipment Reference</label>
      <input style={inputStyle} value={dhl.shipmentReference} onChange={(e) => set({ shipmentReference: e.target.value })} />
      <label style={labelStyle}>Reason for Export</label>
      <select style={inputStyle} value={dhl.reasonForExport} onChange={(e) => set({ reasonForExport: e.target.value as DHLReasonForExport })}>{DHL_REASONS_FOR_EXPORT.map((r) => <option key={r} value={r}>{r}</option>)}</select>
      <label style={labelStyle}>Type of Export *</label>
      <select style={inputStyle} value={dhl.typeOfExport} onChange={(e) => set({ typeOfExport: e.target.value as DHLTypeOfExport })}>{DHL_TYPES_OF_EXPORT.map((t) => <option key={t} value={t}>{t}</option>)}</select>
      <label style={labelStyle}>Terms of Trade</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <select style={{ ...inputStyle, flex: 1 }} value={dhl.termsOfTrade.code} onChange={(e) => set({ termsOfTrade: { ...dhl.termsOfTrade, code: e.target.value as Incoterm2020 } })}>{['EXW','FCA','CPT','CIP','DAP','DPU','DDP','FAS','FOB','CFR','CIF'].map((i) => <option key={i} value={i}>{i}</option>)}</select>
        <input style={{ ...inputStyle, flex: 2 }} placeholder="Place" value={dhl.termsOfTrade.place} onChange={(e) => set({ termsOfTrade: { ...dhl.termsOfTrade, place: e.target.value } })} />
      </div>
      <label style={labelStyle}>Export License (opt)</label>
      <input style={inputStyle} value={dhl.exportLicenseNumber || ''} onChange={(e) => set({ exportLicenseNumber: e.target.value })} />
      <label style={labelStyle}>Import License (opt)</label>
      <input style={inputStyle} value={dhl.importLicenseNumber || ''} onChange={(e) => set({ importLicenseNumber: e.target.value })} />
      <label style={labelStyle}>Payment Method (opt)</label>
      <input style={inputStyle} value={dhl.paymentMethod || ''} onChange={(e) => set({ paymentMethod: e.target.value })} />
      <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={dhl.mydhlGenerated} onChange={(e) => set({ mydhlGenerated: e.target.checked })} /> Generated via MyDHL+
      </label>
    </div>
  );
}

function PlForm({ value, onChange }: { value: CarrierSpecificData; onChange: (d: CarrierSpecificData) => void }) {
  const pl = value.packingList || { plNumber: '', plDate: new Date().toISOString().slice(0, 10), commercialInvoiceRef: '', awbBlRef: '', packages: [] };
  const set = (patch: Partial<NonNullable<CarrierSpecificData['packingList']>>) => onChange({ ...value, packingList: { ...pl, ...patch } });
  return (
    <div style={blockStyle}>
      <h4>Packing List Configuration</h4>
      <label style={labelStyle}>PL Number *</label>
      <input style={inputStyle} value={pl.plNumber} onChange={(e) => set({ plNumber: e.target.value })} />
      <label style={labelStyle}>PL Date *</label>
      <input type="date" style={inputStyle} value={pl.plDate} onChange={(e) => set({ plDate: e.target.value })} />
      <label style={labelStyle}>Commercial Invoice Ref *</label>
      <input style={inputStyle} value={pl.commercialInvoiceRef} onChange={(e) => set({ commercialInvoiceRef: e.target.value })} />
      <label style={labelStyle}>AWB/BL Ref *</label>
      <input style={inputStyle} value={pl.awbBlRef} onChange={(e) => set({ awbBlRef: e.target.value })} />
      <span style={{ fontSize: 11, color: pl.packages.length >= 1 ? '#16a34a' : '#dc2626' }}>{pl.packages.length >= 1 ? `✓ ${pl.packages.length} bultos` : '⚠ Mínimo 1 bulto requerido'}</span>
    </div>
  );
}

function BundleForm({ value, onChange }: { value: CarrierSpecificData; onChange: (d: CarrierSpecificData) => void }) {
  const bundle = value.bundle || { documentNumber: '', commercialInvoiceRef: '', packingListRef: '' };
  const set = (patch: Partial<NonNullable<CarrierSpecificData['bundle']>>) => onChange({ ...value, bundle: { ...bundle, ...patch } });
  return (
    <div style={blockStyle}>
      <h4>Bundle CIPL Configuration</h4>
      <label style={labelStyle}>Document Number *</label>
      <input style={inputStyle} value={bundle.documentNumber} onChange={(e) => set({ documentNumber: e.target.value })} />
      <label style={labelStyle}>Commercial Invoice Ref *</label>
      <input style={inputStyle} value={bundle.commercialInvoiceRef} onChange={(e) => set({ commercialInvoiceRef: e.target.value })} />
      <label style={labelStyle}>Packing List Ref *</label>
      <input style={inputStyle} value={bundle.packingListRef} onChange={(e) => set({ packingListRef: e.target.value })} />
    </div>
  );
}

const blockStyle: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginTop: 12 };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, marginTop: 8, display: 'block', color: '#374151' };
const inputStyle: React.CSSProperties = { padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, width: '100%', boxSizing: 'border-box', marginTop: 2 };