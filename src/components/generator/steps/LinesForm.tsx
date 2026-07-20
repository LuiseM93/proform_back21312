'use client';

// ============================================================================
// LinesForm — Line items with live validation (HS, COO, generic description)
// ProformaFlow · FASE 2
// ============================================================================
import React from 'react';
import type { ProductLine, UOM, Currency, Incoterm2020, DocumentType, Carrier } from '@/types/shipment';
import {
  UOM_CATALOG, CURRENCIES, INCOTERMS_2020, PACKAGE_TYPES,
  validateDescriptionForCarrier,
} from '@/constants/controlled-vocabularies';

interface LinesFormProps {
  documentType: DocumentType;
  carrier: Carrier;
  value: ProductLine[];
  destinationCountry: string;
  onChange: (lines: ProductLine[]) => void;
}

export function LinesForm({ documentType, carrier, value, destinationCountry, onChange }: LinesFormProps) {
  const showPackages = documentType === 'PACKING_LIST' || documentType === 'BUNDLE_CIPL';
  const showDimensions = showPackages;

  const updateLine = (idx: number, patch: Partial<ProductLine>) => {
    const next = value.map((l, i) => (i === idx ? { ...l, ...patch } : l));
    onChange(next);
  };

  const addLine = () => {
    const newLine: ProductLine = {
      lineNumber: value.length + 1,
      description: '',
      hsCode: '',
      hsCodeSource: 'USER',
      countryOfOrigin: '',
      countryOfOriginName: '',
      quantity: 1,
      uom: 'PCS',
      unitPrice: 0,
      currency: 'USD',
      lineTotal: 0,
      netWeightKg: 0,
      grossWeightKg: 0,
      ...(showPackages ? { packages: [] } : {}),
    };
    onChange([...value, newLine]);
  };

  const removeLine = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx).map((l, i) => ({ ...l, lineNumber: i + 1 })));
  };

  return (
    <div className="lines-form">
      <button type="button" onClick={addLine} style={btnStyle}>+ Add Line</button>
      {value.map((line, idx) => (
        <div key={idx} className="line-item" style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong>Line {idx + 1}</strong>
            <button type="button" onClick={() => removeLine(idx)} style={{ ...btnStyle, background: '#fee2e2', color: '#dc2626' }}>Remove</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
            <textarea
              placeholder="Description (specific: what, material, use, brand/model)"
              value={line.description}
              onChange={(e) => updateLine(idx, { description: e.target.value })}
              style={{ ...inputStyle, minHeight: 60, gridColumn: 'span 3', borderColor: (() => {
                const check = validateDescriptionForCarrier(carrier, line.description);
                if (check.errors.length > 0) return '#dc2626';
                if (check.warnings.length > 0) return '#f59e0b';
                return line.description ? '#16a34a' : '#d1d5db';
              })() }}
            />
            {(() => {
              const check = validateDescriptionForCarrier(carrier, line.description);
              if (check.errors.length === 0 && check.warnings.length === 0) return null;
              return (
                <div style={{ gridColumn: 'span 3', fontSize: 11, marginTop: 2 }}>
                  {check.errors.map((err, i) => (
                    <div key={`e${i}`} style={{ color: '#dc2626' }}>🔴 {err}</div>
                  ))}
                  {check.warnings.map((warn, i) => (
                    <div key={`w${i}`} style={{ color: '#b45309' }}>🟡 {warn}</div>
                  ))}
                </div>
              );
            })()}
            <input
              placeholder="HS Code (6-10 digits)"
              value={line.hsCode}
              onChange={(e) => updateLine(idx, { hsCode: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              style={inputStyle}
            />
            <select
              value={line.hsCodeSource}
              onChange={(e) => updateLine(idx, { hsCodeSource: e.target.value as ProductLine['hsCodeSource'] })}
              style={inputStyle}
            >
              <option value="USER">User</option>
              <option value="AI_SUGGESTION">AI</option>
              <option value="CARRIER_TOOL">Carrier</option>
            </select>
            <select
              value={line.incoterm || ''}
              onChange={(e) => updateLine(idx, { incoterm: (e.target.value || undefined) as Incoterm2020 | undefined })}
              style={inputStyle}
            >
              <option value="">Incoterm (opt)</option>
              {INCOTERMS_2020.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            <input
              placeholder="Country of Origin (ISO-2)"
              value={line.countryOfOrigin}
              onChange={(e) => updateLine(idx, { countryOfOrigin: e.target.value.toUpperCase() })}
              style={inputStyle}
            />
            <input
              placeholder="Origin Name"
              value={line.countryOfOriginName}
              onChange={(e) => updateLine(idx, { countryOfOriginName: e.target.value })}
              style={inputStyle}
            />
            <input
              placeholder="SKU (opt)"
              value={line.sku || ''}
              onChange={(e) => updateLine(idx, { sku: e.target.value })}
              style={inputStyle}
            />
            <input
              type="number" placeholder="Qty"
              value={line.quantity}
              onChange={(e) => updateLine(idx, { quantity: Number(e.target.value), lineTotal: Number(e.target.value) * line.unitPrice })}
              style={inputStyle}
            />
            <select
              value={line.uom}
              onChange={(e) => updateLine(idx, { uom: e.target.value as UOM })}
              style={inputStyle}
            >
              {UOM_CATALOG.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <input
              type="number" placeholder="Unit Price"
              value={line.unitPrice}
              onChange={(e) => updateLine(idx, { unitPrice: Number(e.target.value), lineTotal: line.quantity * Number(e.target.value) })}
              style={{ ...inputStyle, borderColor: line.unitPrice <= 0 ? '#dc2626' : '#d1d5db' }}
            />
            <select
              value={line.currency}
              onChange={(e) => updateLine(idx, { currency: e.target.value as Currency })}
              style={inputStyle}
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <span style={{ ...inputStyle, background: '#f3f4f6', display: 'flex', alignItems: 'center' }}>
              Total: {(line.quantity * line.unitPrice).toFixed(2)}
            </span>
            <input
              type="number" placeholder="Net Wt (kg)"
              value={line.netWeightKg}
              onChange={(e) => updateLine(idx, { netWeightKg: Number(e.target.value) })}
              style={inputStyle}
            />
            <input
              type="number" placeholder="Gross Wt (kg)"
              value={line.grossWeightKg}
              onChange={(e) => updateLine(idx, { grossWeightKg: Number(e.target.value) })}
              style={inputStyle}
            />
            {showDimensions && (
              <>
                <input type="number" placeholder="L (cm)" value={line.dimensions?.lengthCm || ''}
                  onChange={(e) => updateLine(idx, { dimensions: { ...line.dimensions!, lengthCm: Number(e.target.value), widthCm: line.dimensions?.widthCm || 0, heightCm: line.dimensions?.heightCm || 0 } })} style={inputStyle} />
                <input type="number" placeholder="W (cm)" value={line.dimensions?.widthCm || ''}
                  onChange={(e) => updateLine(idx, { dimensions: { ...line.dimensions!, lengthCm: line.dimensions?.lengthCm || 0, widthCm: Number(e.target.value), heightCm: line.dimensions?.heightCm || 0 } })} style={inputStyle} />
                <input type="number" placeholder="H (cm)" value={line.dimensions?.heightCm || ''}
                  onChange={(e) => updateLine(idx, { dimensions: { ...line.dimensions!, lengthCm: line.dimensions?.lengthCm || 0, widthCm: line.dimensions?.widthCm || 0, heightCm: Number(e.target.value) } })} style={inputStyle} />
              </>
            )}
          </div>
          {showPackages && (
            <PackageEditor line={line} idx={idx} onChange={(packages) => updateLine(idx, { packages })} />
          )}
        </div>
      ))}
    </div>
  );
}

function PackageEditor({ line, idx, onChange }: {
  line: ProductLine; idx: number; onChange: (p: ProductLine['packages']) => void;
}) {
  const packages = line.packages || [];
  const addPkg = () => onChange([...packages, {
    packageNumber: packages.length + 1,
    packageType: 'BOX',
    quantity: 1,
    netWeightKg: 0,
    grossWeightKg: 0,
    dimensions: { lengthCm: 0, widthCm: 0, heightCm: 0 },
    shippingMarks: '',
  }]);
  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #d1d5db' }}>
      <strong style={{ fontSize: 12 }}>Packages (Line {idx + 1})</strong>
      <button type="button" onClick={addPkg} style={{ ...btnStyle, fontSize: 11, padding: '2px 8px', marginLeft: 8 }}>+ Pkg</button>
      {packages.map((pkg, pi) => (
        <div key={pi} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginTop: 4 }}>
          <select value={pkg.packageType} onChange={(e) => onChange(packages.map((p, i) => i === pi ? { ...p, packageType: e.target.value as typeof p.packageType } : p))} style={inputStyle}>
            {PACKAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="number" placeholder="Qty" value={pkg.quantity} onChange={(e) => onChange(packages.map((p, i) => i === pi ? { ...p, quantity: Number(e.target.value) } : p))} style={inputStyle} />
          <input placeholder="Marks" value={pkg.shippingMarks} onChange={(e) => onChange(packages.map((p, i) => i === pi ? { ...p, shippingMarks: e.target.value } : p))} style={inputStyle} />
          <input type="number" placeholder="Net kg" value={pkg.netWeightKg} onChange={(e) => onChange(packages.map((p, i) => i === pi ? { ...p, netWeightKg: Number(e.target.value) } : p))} style={inputStyle} />
        </div>
      ))}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, width: '100%', boxSizing: 'border-box',
};
const btnStyle: React.CSSProperties = {
  padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, cursor: 'pointer', background: '#f9fafb',
};
