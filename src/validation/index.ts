// ============================================================================
// validateShipment — UNIFIED validation pipeline (spec §8, FASE 2)
// ProformaFlow
// Single gate: Zod schema + pre-generation checks + cross-document consistency.
// UI consumes ONLY this. No more scattered validate* calls.
// ============================================================================
import type { ShipmentData, DocumentType } from '@/types/shipment';
import { ShipmentSchema } from './schemas';
import { runPreGenerationChecks, type PreGenError, type PreGenWarning } from './pre-generation';
import { validateCrossDocumentConsistency, type CrossValidationError, type CrossValidationWarning } from './cross-document';

export type Severity = 'BLOCKING' | 'ERROR' | 'WARNING';

export interface ValidationIssue {
  code: string;
  message: string;
  field: string;
  severity: Severity;
  regulation?: string;
  recommendation?: string;
  documentTypes?: DocumentType[];
  source: 'ZOD' | 'PRE_GEN' | 'CROSS_DOC';
}

export interface ValidationResult {
  canGenerate: boolean;
  issues: ValidationIssue[];
  blocking: ValidationIssue[];
  warnings: ValidationIssue[];
}

export function validateShipment(
  data: ShipmentData,
  docMap?: Map<DocumentType, ShipmentData>
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // 1. Zod schema
  const parsed = ShipmentSchema.safeParse(data);
  if (!parsed.success) {
    for (const err of parsed.error.issues) {
      issues.push({
        code: `ZOD_${err.path.join('_').toUpperCase() || 'ROOT'}`,
        message: err.message,
        field: err.path.join('.'),
        severity: 'BLOCKING',
        source: 'ZOD',
      });
    }
  }

  // 2. Pre-generation (RED + AMBER)
  const pre = runPreGenerationChecks(data);
  for (const e of pre.blockingErrors as PreGenError[]) {
    issues.push({ code: e.code, message: e.message, field: e.field, severity: 'BLOCKING', regulation: e.regulation, source: 'PRE_GEN' });
  }
  for (const w of pre.warnings as PreGenWarning[]) {
    issues.push({ code: w.code, message: w.message, field: w.field, severity: 'WARNING', recommendation: w.recommendation, source: 'PRE_GEN' });
  }

  // 3. Cross-document (if multi-doc map provided)
  if (docMap && docMap.size > 0) {
    const cross = validateCrossDocumentConsistency(docMap);
    for (const e of cross.errors as CrossValidationError[]) {
      issues.push({ code: e.code, message: e.message, field: e.field, severity: e.severity, documentTypes: e.documentTypes, source: 'CROSS_DOC' });
    }
    for (const w of cross.warnings as CrossValidationWarning[]) {
      issues.push({ code: w.code, message: w.message, field: w.field, severity: 'WARNING', documentTypes: w.documentTypes, source: 'CROSS_DOC' });
    }
  }

  const blocking = issues.filter((i) => i.severity === 'BLOCKING' || i.severity === 'ERROR');
  const warnings = issues.filter((i) => i.severity === 'WARNING');

  return {
    canGenerate: blocking.length === 0,
    issues,
    blocking,
    warnings,
  };
}
