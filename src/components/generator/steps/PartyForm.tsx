'use client';

// ============================================================================
// PartyForm — Supports shipper, consignee, buyer, producer, IOR, notifyParty
// ProformaFlow · FASE 2
// ============================================================================
import React from 'react';
import type { Parties, Party, DocumentType, Carrier, TaxIdType } from '@/types/shipment';
import { TAX_ID_TYPES } from '@/constants/controlled-vocabularies';

interface PartyFormProps {
  documentType: DocumentType;
  carrier: Carrier;
  value: Parties;
  onChange: (parties: Parties) => void;
}

export function PartyForm({ documentType, carrier, value, onChange }: PartyFormProps) {
  const updateParty = (key: keyof Parties, party: Party) => {
    onChange({ ...value, [key]: party });
  };

  const updatePartyField = (key: keyof Parties, field: keyof Party, val: unknown) => {
    const current = value[key] as Party | undefined;
    if (!current) return;
    onChange({ ...value, [key]: { ...current, [field]: val } });
  };

  const updateAddressField = (key: keyof Parties, field: keyof Party['address'], val: string) => {
    const current = value[key] as Party | undefined;
    if (!current) return;
    onChange({
      ...value,
      [key]: { ...current, address: { ...current.address, [field]: val } },
    });
  };

  const showBuyer = carrier === 'UPS';
  const showProducer = carrier === 'UPS';
  const showIOR = carrier === 'DHL';
  const showNotify = documentType === 'PACKING_LIST';

  const renderPartyBlock = (key: keyof Parties, label: string, required: boolean) => {
    const party = value[key] as Party | undefined;
    if (!party) return null;
    return (
      <div className="party-block" style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>
          {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input placeholder="Legal Name" value={party.legalName}
            onChange={(e) => updatePartyField(key, 'legalName', e.target.value)} style={inputStyle} />
          <div style={{ display: 'flex', gap: 4 }}>
            <select value={party.taxIdType}
              onChange={(e) => updatePartyField(key, 'taxIdType', e.target.value as TaxIdType)}
              style={{ ...inputStyle, width: '40%' }}>
              {TAX_ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input placeholder="Tax ID" value={party.taxId}
              onChange={(e) => updatePartyField(key, 'taxId', e.target.value)}
              style={{ ...inputStyle, width: '60%' }} />
          </div>
          <input placeholder="Street" value={party.address.street}
            onChange={(e) => updateAddressField(key, 'street', e.target.value)} style={inputStyle} />
          <input placeholder="Street 2 (opt)" value={party.address.street2 || ''}
            onChange={(e) => updateAddressField(key, 'street2', e.target.value)} style={inputStyle} />
          <input placeholder="City" value={party.address.city}
            onChange={(e) => updateAddressField(key, 'city', e.target.value)} style={inputStyle} />
          <input placeholder="State/Province" value={party.address.stateProvince}
            onChange={(e) => updateAddressField(key, 'stateProvince', e.target.value)} style={inputStyle} />
          <input placeholder="Postal Code" value={party.address.postalCode}
            onChange={(e) => updateAddressField(key, 'postalCode', e.target.value)} style={inputStyle} />
          <input placeholder="Country Code (ISO-2)" value={party.address.countryCode}
            onChange={(e) => updateAddressField(key, 'countryCode', e.target.value.toUpperCase())} style={inputStyle} />
          <input placeholder="Country Name" value={party.address.countryName}
            onChange={(e) => updateAddressField(key, 'countryName', e.target.value)}
            style={{ ...inputStyle, gridColumn: 'span 2' }} />
          <input placeholder="Contact Name (opt)" value={party.contactName || ''}
            onChange={(e) => updatePartyField(key, 'contactName', e.target.value)} style={inputStyle} />
          <input placeholder="Phone (opt)" value={party.phone || ''}
            onChange={(e) => updatePartyField(key, 'phone', e.target.value)} style={inputStyle} />
          <input placeholder="Email (opt)" value={party.email || ''}
            onChange={(e) => updatePartyField(key, 'email', e.target.value)}
            style={{ ...inputStyle, gridColumn: 'span 2' }} />
          {key === 'shipper' && (
            <input
              placeholder="EORI (mandatory for EU destination) — e.g. MX1234567890"
              value={party.eori || ''}
              onChange={(e) => updatePartyField(key, 'eori', e.target.value.toUpperCase())}
              style={{ ...inputStyle, gridColumn: 'span 2' }}
            />
          )}
          {key === 'shipper' && party.address.countryCode === 'MX' && (
            <div style={warnBox}>
              🟡 Shipper in Mexico: RFC required for CFDI 4.0 + Complemento Comercio Exterior (Commercial Invoices). Capture Tax ID with type RFC.
            </div>
          )}
          {carrier === 'UPS' && (key === 'buyer' || key === 'producer' || key === 'consignee') && (
            <select value={party.relationship || 'NOT_RELATED'}
              onChange={(e) => updatePartyField(key, 'relationship', e.target.value as 'RELATED' | 'NOT_RELATED')}
              style={{ ...inputStyle, gridColumn: 'span 2' }}>
              <option value="NOT_RELATED">Not Related</option>
              <option value="RELATED">Related</option>
            </select>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="party-form">
      {renderPartyBlock('shipper', 'Shipper / Exporter', true)}
      {renderPartyBlock('consignee', 'Consignee / Importer', true)}
      {showBuyer && renderPartyBlock('buyer', 'UPS: Sold To Party (Buyer)', false)}
      {showProducer && renderPartyBlock('producer', 'UPS: Producer', false)}
      {showIOR && renderPartyBlock('importerOfRecord', 'DHL: Importer of Record (IOR)', false)}
      {showNotify && renderPartyBlock('notifyParty', 'Notify Party (PL)', false)}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '6px 8px',
  border: '1px solid #d1d5db',
  borderRadius: 4,
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box',
};

const warnBox: React.CSSProperties = {
  gridColumn: 'span 2',
  background: '#fffbeb',
  border: '1px solid #f59e0b',
  color: '#92400e',
  borderRadius: 4,
  padding: '6px 8px',
  fontSize: 12,
};