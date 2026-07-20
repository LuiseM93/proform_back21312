'use client';

// ============================================================================
// PreviewEngine — Live preview with error highlighting + blocking overlay
// ProformaFlow · FASE 2 (AMBER warnings mapped per line + regulatory banner)
// ============================================================================
import React, { useMemo } from 'react';
import type { ShipmentData, DocumentType } from '@/types/shipment';
import { runPreGenerationChecks } from '@/validation/pre-generation';
import { ShipmentSchema } from '@/validation/schemas';

interface PreviewEngineProps {
  data: ShipmentData;
  activeDocument: DocumentType;
  crossWarnings?: { code: string; message: string; field: string; recommendation?: string }[];
}

export function PreviewEngine({ data, activeDocument, crossWarnings = [] }: PreviewEngineProps) {
  const preCheck = useMemo(() => runPreGenerationChecks(data), [data]);
  // FIX F2: also run the full Zod schema so preview reflects the SAME blocking
  // errors as handleGenerate (EORI/RFC/AWB/totals-mismatch etc.)
  const zodResult = useMemo(() => ShipmentSchema.safeParse(data), [data]);
  const zodBlocking = useMemo(() => {
    if (zodResult.success) return [] as string[];
    return zodResult.error.issues.map((i) => `${i.path.join('.') || 'root'}: ${i.message}`);
  }, [zodResult]);
  const hasBlocking = preCheck.blockingErrors.length > 0 || zodBlocking.length > 0;

  // FASE 2: warnings per line (field starts with "lines[idx]")
  const lineWarnings = useMemo(() => {
    const map = new Map<number, string[]>();
    preCheck.warnings.forEach((w) => {
      const m = w.field.match(/^lines\[(\d+)\]/);
      if (m) {
        const idx = parseInt(m[1], 10);
        const arr = map.get(idx) || [];
        arr.push(w.message);
        map.set(idx, arr);
      }
    });
    return map;
  }, [preCheck.warnings]);

  // FASE 2: global regulatory warnings (not per line, with recommendation)
  // FIX P3: also include cross-document warnings (price variance, proforma→CI diff, etc.)
  const regulatoryWarnings = useMemo(() => {
    const base = preCheck.warnings.filter((w) => !w.field.startsWith('lines['));
    return [...base, ...crossWarnings.filter((w) => !w.field.startsWith('lines['))];
  }, [preCheck.warnings, crossWarnings]);

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#fafafa', position: 'relative' }}>
      <h3 style={{ marginTop: 0, fontSize: 14 }}>Live Preview — {activeDocument}</h3>

      {/* Validation Banner — RED (Blocking) */}
      {(preCheck.blockingErrors.length > 0 || zodBlocking.length > 0) && (
        <div style={{ background: '#fef2f2', border: '1px solid #dc2626', borderRadius: 6, padding: 8, marginBottom: 12 }}>
          <strong style={{ color: '#dc2626', fontSize: 12 }}>🔴 {preCheck.blockingErrors.length + zodBlocking.length} Blocking Error(s)</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 11 }}>
            {preCheck.blockingErrors.map((e, i) => <li key={`p${i}`} style={{ color: '#991b1b' }}>{e.message}</li>)}
            {zodBlocking.map((e, i) => <li key={`z${i}`} style={{ color: '#991b1b' }}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* FASE 2: Banner AMBER — Global regulatory warnings */}
      {regulatoryWarnings.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 6, padding: 8, marginBottom: 12 }}>
          <strong style={{ color: '#b45309', fontSize: 12 }}>🟡 {regulatoryWarnings.length} Regulatory Warning(s)</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 11 }}>
            {regulatoryWarnings.map((w, i) => (
              <li key={i} style={{ color: '#92400e' }}>
                {w.message}
                {w.recommendation && (
                  <span style={{ display: 'block', color: '#b45309', fontStyle: 'italic' }}>→ {w.recommendation}</span>
                )}
              </li>
            ))}
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
                  {/* FASE 2: AMBER badge per line */}
                  {lineWarnings.get(idx) && lineWarnings.get(idx)!.length > 0 && (
                    <span title={lineWarnings.get(idx)!.join(' | ')} style={lineWarnBadge}>
                      🟡
                    </span>
                  )}
                  {/* Expanded tooltip below the description */}
                  {lineWarnings.get(idx) && lineWarnings.get(idx)!.length > 0 && (
                    <div style={{ fontSize: 8, color: '#b45309', marginTop: 2 }}>
                      {lineWarnings.get(idx)!.map((w, i) => <div key={i}>⚠ {w}</div>)}
                    </div>
                  )}
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
              <strong style={{ color: '#dc2626' }}>Blocking Errors</strong>
              <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Fix before generating</div>
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

const thStyle: React.CSSProperties = { padding: '4px 6px', textAlign: 'left', fontSize: 9, borderBottom: '1px solid #999' };
const tdStyle: React.CSSProperties = { padding: '4px 6px', borderBottom: '1px solid #eee' };
const lineWarnBadge: React.CSSProperties = { marginLeft: 4, cursor: 'help', fontSize: 11 };
