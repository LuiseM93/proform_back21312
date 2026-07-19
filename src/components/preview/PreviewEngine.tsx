'use client';

// ============================================================================
// PreviewEngine — Live preview con error highlighting + blocking overlay
// ProformaFlow · FASE 2
// ============================================================================
import React, { useMemo } from 'react';
import type { ShipmentData, DocumentType } from '@/types/shipment';
import { runPreGenerationChecks } from '@/validation/pre-generation';

interface PreviewEngineProps {
  data: ShipmentData;
  activeDocument: DocumentType;
  validationErrors: { code: string; message: string; field: string; severity: 'ERROR' | 'WARNING'; documentTypes: DocumentType[] }[];
  onDataChange: (updates: Partial<ShipmentData>) => void;
}

export function PreviewEngine({ data, activeDocument, validationErrors, onDataChange }: PreviewEngineProps) {
  const preCheck = useMemo(() => runPreGenerationChecks(data), [data]);
  const hasBlocking = preCheck.blockingErrors.length > 0;

  const documentErrors = validationErrors.filter((e) => e.documentTypes.includes(activeDocument));

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#fafafa', position: 'relative' }}>
      <h3 style={{ marginTop: 0, fontSize: 14 }}>Live Preview — {activeDocument}</h3>

      {/* Validation Banner */}
      {preCheck.blockingErrors.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #dc2626', borderRadius: 6, padding: 8, marginBottom: 12 }}>
          <strong style={{ color: '#dc2626', fontSize: 12 }}>🔴 {preCheck.blockingErrors.length} Bloqueante(s)</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 11 }}>
            {preCheck.blockingErrors.map((e, i) => <li key={i} style={{ color: '#991b1b' }}>{e.message}</li>)}
          </ul>
        </div>
      )}
      {preCheck.warnings.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 6, padding: 8, marginBottom: 12 }}>
          <strong style={{ color: '#b45309', fontSize: 12 }}>🟡 {preCheck.warnings.length} Advertencia(s)</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 11 }}>
            {preCheck.warnings.map((w, i) => <li key={i} style={{ color: '#92400e' }}>{w.message}</li>)}
          </ul>
        </div>
      )}

      {/* Simple HTML preview (FASE 3 replaces with @react-pdf/renderer) */}
      <div style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: 4, padding: 12, fontSize: 12, minHeight: 200 }}>
        <div style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: 6, marginBottom: 8 }}>
          <strong style={{ fontSize: 16 }}>{documentTitle(activeDocument)}</strong>
          <div style={{ fontSize: 10, color: '#666' }}>{data.issueDate}</div>
        </div>

        {/* Parties */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ width: '48%' }}>
            <strong style={{ fontSize: 10 }}>SHIPPER</strong>
            <div>{data.parties.shipper.legalName}</div>
            <div style={{ fontSize: 10, color: '#666' }}>{data.parties.shipper.address.city}, {data.parties.shipper.address.countryName}</div>
            <div style={{ fontSize: 10 }}>{data.parties.shipper.taxIdType}: {data.parties.shipper.taxId}</div>
          </div>
          <div style={{ width: '48%' }}>
            <strong style={{ fontSize: 10 }}>CONSIGNEE</strong>
            <div>{data.parties.consignee.legalName}</div>
            <div style={{ fontSize: 10, color: '#666' }}>{data.parties.consignee.address.city}, {data.parties.consignee.address.countryName}</div>
            <div style={{ fontSize: 10 }}>{data.parties.consignee.taxIdType}: {data.parties.consignee.taxId}</div>
          </div>
        </div>

        {/* Lines table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
          <thead>
            <tr style={{ background: '#f0f0f0', borderBottom: '1px solid #000' }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>HS</th>
              <th style={thStyle}>COO</th>
              <th style={thStyle}>Qty</th>
              <th style={thStyle}>Unit</th>
              <th style={thStyle}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={tdStyle}>{idx + 1}</td>
                <td style={tdStyle}>
                  {line.description || <span style={{ color: '#dc2626' }}>MISSING</span>}
                  {hasFieldError(`lines[${idx}].description`, preCheck.blockingErrors) && <span style={{ color: '#dc2626' }}> ⚠</span>}
                </td>
                <td style={tdStyle}>{line.hsCode || <span style={{ color: '#dc2626' }}>—</span>}</td>
                <td style={tdStyle}>{line.countryOfOrigin || <span style={{ color: '#dc2626' }}>—</span>}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{line.quantity}</td>
                <td style={tdStyle}>{line.unitPrice > 0 ? line.unitPrice.toFixed(2) : <span style={{ color: '#dc2626' }}>0</span>}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{line.lineTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ marginTop: 8, textAlign: 'right', fontSize: 11 }}>
          <div>Subtotal: {data.totals.subtotal.toFixed(2)} {data.totals.currency}</div>
          <div><strong>Grand Total: {data.totals.grandTotal.toFixed(2)} {data.totals.currency}</strong></div>
          <div style={{ fontSize: 10, color: '#666' }}>
            Gross: {data.totals.totalGrossWeightKg.toFixed(2)} kg | Packages: {data.totals.totalPackages}
          </div>
        </div>
      </div>

      {/* Blocking overlay */}
      {hasBlocking && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(220,38,38,0.05)',
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px dashed #dc2626',
        }}>
          <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #dc2626', textAlign: 'center' }}>
            <div style={{ fontSize: 32 }}>⛔</div>
            <strong style={{ color: '#dc2626' }}>Errores Bloqueantes</strong>
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Corrija antes de generar</div>
          </div>
        </div>
      )}
    </div>
  );
}

function documentTitle(doc: DocumentType): string {
  const titles: Record<DocumentType, string> = {
    PROFORMA: 'PROFORMA INVOICE',
    CI_FEDEX: 'COMMERCIAL INVOICE (FedEx)',
    CI_UPS: 'COMMERCIAL INVOICE (UPS)',
    CI_DHL: 'COMMERCIAL INVOICE (DHL)',
    PACKING_LIST: 'PACKING LIST',
    BUNDLE_CIPL: 'COMMERCIAL INVOICE + PACKING LIST',
  };
  return titles[doc];
}

function hasFieldError(field: string, errors: { field: string }[]): boolean {
  return errors.some((e) => e.field === field);
}

const thStyle: React.CSSProperties = { padding: '4px 6px', textAlign: 'left', fontSize: 9, borderBottom: '1px solid #999' };
const tdStyle: React.CSSProperties = { padding: '4px 6px', borderBottom: '1px solid #eee' };
