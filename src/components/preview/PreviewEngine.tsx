// ============================================================================
// PreviewEngine — Live preview with actual PDF rendering + validation banners
// ProformaFlow · FASE 2
// ============================================================================
import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { ShipmentData, DocumentType } from '@/types/shipment';
import { runPreGenerationChecks } from '@/validation/pre-generation';
import { ShipmentSchema } from '@/validation/schemas';
import { generatePDF } from '@/components/pdf/generators/pdfFactory';

interface PreviewEngineProps {
  data: ShipmentData;
  activeDocument: DocumentType;
  crossWarnings?: { code: string; message: string; field: string; recommendation?: string }[];
  logoUrl?: string | null;
}

export function PreviewEngine({ data, activeDocument, crossWarnings = [], logoUrl }: PreviewEngineProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const prevHasBlocking = useRef(false);

  // Run validation (same as handleGenerate)
  const preCheck = useMemo(() => runPreGenerationChecks(data), [data]);
  const zodResult = useMemo(() => ShipmentSchema.safeParse(data), [data]);
  const zodBlocking = useMemo(() => {
    if (zodResult.success) return [] as string[];
    return zodResult.error.issues.map((i) => `${i.path.join('.') || 'root'}: ${i.message}`);
  }, [zodResult]);

  const hasBlocking = preCheck.blockingErrors.length > 0 || zodBlocking.length > 0;

  // Regulatory warnings (global + per line)
  const regulatoryWarnings = useMemo(() => {
    const base = preCheck.warnings.filter((w: { field: string }) => !w.field.startsWith('lines['));
    return [...base, ...crossWarnings.filter((w: { field: string }) => !w.field.startsWith('lines['))];
  }, [preCheck.warnings, crossWarnings]);

  // Clear preview when blocking changes
  useEffect(() => {
    if (hasBlocking && !prevHasBlocking.current) {
      setPdfUrl(null);
      setPdfError(null);
    }
    prevHasBlocking.current = hasBlocking;
  }, [hasBlocking]);

  // Generate ACTUAL PDF blob (not simulated preview)
    useEffect(() => {
      let revoked = false;
      if (!hasBlocking) {
        generatePDF(data, logoUrl)
          .then((blob) => {
            if (revoked) return;
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            setPdfError(null);
          })
          .catch(() => {
            if (revoked) return;
            setPdfError('Preview unavailable — check data validity');
          });
      }
      return () => { revoked = true; };
    }, [data, hasBlocking, logoUrl]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#fafafa' }}>
      <h3 style={{ marginTop: 0, fontSize: 14 }}>Live Preview — {activeDocument}</h3>

      {/* ROJO banner (blocking) */}
      {hasBlocking && (
        <div style={{ background: '#fef2f2', border: '1px solid #dc2626', borderRadius: 6, padding: 8, marginBottom: 12 }}>
          <strong style={{ color: '#dc2626', fontSize: 12 }}>🔴 {preCheck.blockingErrors.length + zodBlocking.length} Blocking Error(s)</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 11 }}>
            {preCheck.blockingErrors.map((e: { message: string }, i: number) => <li key={`p${i}`} style={{ color: '#991b1b' }}>{e.message}</li>)}
            {zodBlocking.map((e: string, i: number) => <li key={`z${i}`} style={{ color: '#991b1b' }}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* AMARILLO banner (warnings) */}
      {regulatoryWarnings.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 6, padding: 8, marginBottom: 12 }}>
          <strong style={{ color: '#b45309', fontSize: 12 }}>🟡 {regulatoryWarnings.length} Regulatory Warning(s)</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 11 }}>
            {regulatoryWarnings.map((w: { message: string; recommendation?: string }, i: number) => (
              <li key={i} style={{ color: '#92400e' }}>
                {w.message}
                {w.recommendation && <span style={{ display: 'block', color: '#b45309', fontStyle: 'italic' }}>→ {w.recommendation}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ACTUAL PDF RENDERING */}
      {pdfUrl && !hasBlocking && (
        <div style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: 4 }}>
          <iframe
            src={pdfUrl}
            style={{ width: '100%', height: '600px', border: 'none', borderRadius: 4 }}
            title="PDF Preview"
          />
        </div>
      )}

      {pdfError && (
        <div style={{ color: '#dc2626', fontSize: 12, padding: 12 }}>{pdfError}</div>
      )}

      {!pdfUrl && !hasBlocking && !pdfError && (
        <div style={{ color: '#666', fontSize: 12, padding: 20, textAlign: 'center' }}>Generating preview...</div>
      )}
    </div>
  );
}