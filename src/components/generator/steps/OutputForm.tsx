'use client';

// ============================================================================
// OutputForm — Paper size por destino, orientation, language, signature, EDI
// ProformaFlow · FASE 2
// ============================================================================
import React from 'react';
import type { OutputConfig, DocumentType, CountryGroup, EdiFormat } from '@/types/shipment';
import { derivePaperConfig } from '@/constants/controlled-vocabularies';

interface OutputFormProps {
  documentType: DocumentType;
  destinationCountryGroup: CountryGroup;
  value: OutputConfig;
  onChange: (config: OutputConfig) => void;
  blockingErrors: { code: string; message: string; field: string }[];
  warnings: { code: string; message: string; field: string; recommendation?: string }[];
  onGenerate: () => void;
  logoUrl?: string | null;
}

export function OutputForm({
  documentType, destinationCountryGroup, value, onChange, blockingErrors, warnings, onGenerate,
  logoUrl,
}: OutputFormProps) {
  const paper = derivePaperConfig(destinationCountryGroup, documentType);
  const autoPaper = paper.paperSize;
  const autoOrientation = paper.orientation;

  const set = (patch: Partial<OutputConfig>) => onChange({ ...value, ...patch });

  return (
    <div className="output-form">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Paper Size (auto: {autoPaper})</label>
          <select style={inputStyle} value={value.paperSize} onChange={(e) => set({ paperSize: e.target.value as OutputConfig['paperSize'] })}>
            <option value="LETTER">Letter</option>
            <option value="A4">A4</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Orientation (auto: {autoOrientation})</label>
          <select style={inputStyle} value={value.orientation} onChange={(e) => set({ orientation: e.target.value as OutputConfig['orientation'] })}>
            <option value="PORTRAIT">Portrait</option>
            <option value="LANDSCAPE">Landscape</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Language</label>
          <select style={inputStyle} value={value.language} onChange={(e) => set({ language: e.target.value as OutputConfig['language'] })}>
            <option value="EN">English</option>
            <option value="ES">Español</option>
            <option value="BILINGUAL">Bilingual</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Output Format</label>
          <select style={inputStyle} value={value.outputFormat} onChange={(e) => set({ outputFormat: e.target.value as OutputConfig['outputFormat'] })}>
            <option value="PDF">PDF</option>
            <option value="EDI_JSON">EDI JSON</option>
            <option value="BOTH">Both</option>
          </select>
        </div>
        {value.outputFormat !== 'PDF' && (
          <div>
            <label style={labelStyle}>EDI Format</label>
            <select style={inputStyle} value={value.ediFormat || ''} onChange={(e) => set({ ediFormat: e.target.value as EdiFormat })}>
              <option value="FEDEX_ETD">FedEx ETD</option>
              <option value="UPS_PAPERLESS">UPS Paperless</option>
              <option value="DHL_MYDHL">DHL MyDHL+</option>
            </select>
          </div>
        )}
      </div>

      <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <input type="checkbox" checked={value.includeSignature} onChange={(e) => set({ includeSignature: e.target.checked })} />
        Include Signature Block
      </label>

      {value.includeSignature && (
              <div style={{ marginTop: 8 }}>
                <label style={labelStyle}>Signature Image URL (opt)</label>
                <input style={inputStyle} value={value.signatureImageUrl || ''}
                  onChange={(e) => set({ signatureImageUrl: e.target.value })} placeholder="https://... or base64" />
              </div>
            )}

            {logoUrl && (
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <input type="checkbox" checked={value.includeLogo} onChange={(e) => set({ includeLogo: e.target.checked })} />
                Include Company Logo
              </label>
            )}

            {/* Validation Banner */}
      <div style={{ marginTop: 16 }}>
        {blockingErrors.length > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #dc2626', borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <strong style={{ color: '#dc2626' }}>🔴 {blockingErrors.length} Blocking Error(s):</strong>
            <ul style={{ margin: '4px 0 0', paddingLeft: 20, fontSize: 12 }}>
              {blockingErrors.map((e, i) => <li key={i} style={{ color: '#991b1b' }}>{e.message}</li>)}
            </ul>
          </div>
        )}
        {warnings.length > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <strong style={{ color: '#b45309' }}>🟡 {warnings.length} Warning(s):</strong>
            <ul style={{ margin: '4px 0 0', paddingLeft: 20, fontSize: 12 }}>
              {warnings.map((w, i) => <li key={i} style={{ color: '#92400e' }}>{w.message}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Customs Disclaimer - Step 5 Review */}
      <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: '#475569' }}>
          <strong style={{ color: '#dc2626' }}>⚠️ Customs Notice:</strong> This preview is an automated representation based on the data entered. Verify that all information complies with the customs regulations of your country of origin and destination before exporting. The exporter is solely legally responsible for the content of this document.
        </p>
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={blockingErrors.length > 0}
        style={{
          ...btnStyle, width: '100%', marginTop: 12,
          background: blockingErrors.length > 0 ? '#9ca3af' : '#16a34a',
          color: 'white', cursor: blockingErrors.length > 0 ? 'not-allowed' : 'pointer',
        }}
      >
        {blockingErrors.length > 0 ? 'Blocked — Fix errors' : 'Generate PDF / EDI'}
      </button>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, display: 'block', color: '#374151' };
const inputStyle: React.CSSProperties = { padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, width: '100%', boxSizing: 'border-box', marginTop: 2 };
const btnStyle: React.CSSProperties = { padding: '10px 16px', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600 };