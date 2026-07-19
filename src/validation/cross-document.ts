// ============================================================================
// Cross-Document Validator — CI vs PL, Bundle vs CI+PL, Proforma vs CI
// ProformaFlow · Comercio Internacional · v1.0
// ============================================================================
import type {
  ShipmentData, DocumentType, Party,
} from '@/types/shipment';

export interface CrossValidationError {
  code: string;
  message: string;
  field: string;
  severity: 'ERROR' | 'WARNING';
  documentTypes: DocumentType[];
}

export interface CrossValidationWarning {
  code: string;
  message: string;
  field: string;
  severity: 'WARNING';
  documentTypes: DocumentType[];
}

export interface CrossValidationResult {
  valid: boolean;
  errors: CrossValidationError[];
  warnings: CrossValidationWarning[];
}

export function validateCrossDocumentConsistency(
  documents: Map<DocumentType, ShipmentData>
): CrossValidationResult {
  const errors: CrossValidationError[] = [];
  const warnings: CrossValidationWarning[] = [];

  const ci = documents.get('CI_FEDEX') || documents.get('CI_UPS') || documents.get('CI_DHL');
  const pl = documents.get('PACKING_LIST');
  const bundle = documents.get('BUNDLE_CIPL');
  const proforma = documents.get('PROFORMA');

  if (ci && pl) validateCiVsPl(ci, pl, errors, warnings);
  if (bundle && (ci || pl)) validateBundleVsComponents(bundle, ci, pl, errors, warnings);
  if (proforma && ci) validateProformaVsCi(proforma, ci, errors, warnings);

  validateAwbConsistency(documents, errors);
  validateTotalsArithmetic(documents, errors);

  return {
    valid: errors.filter((e) => e.severity === 'ERROR').length === 0,
    errors,
    warnings,
  };
}

// ─── CI vs PL ───────────────────────────────────────────────────────────────
function validateCiVsPl(
  ci: ShipmentData,
  pl: ShipmentData,
  errors: CrossValidationError[],
  warnings: CrossValidationWarning[]
): void {
  compareParties(ci.parties, pl.parties, 'CI', 'PL', errors);

  if (Math.abs(ci.totals.totalGrossWeightKg - pl.totals.totalGrossWeightKg) > 0.1) {
    errors.push({
      code: 'WEIGHT_MISMATCH_GROSS',
      message: `Peso bruto total difiere: CI=${ci.totals.totalGrossWeightKg}kg vs PL=${pl.totals.totalGrossWeightKg}kg`,
      field: 'totals.totalGrossWeightKg',
      severity: 'ERROR',
      documentTypes: ['CI_FEDEX', 'CI_UPS', 'CI_DHL', 'PACKING_LIST'],
    });
  }

  if (Math.abs(ci.totals.totalNetWeightKg - pl.totals.totalNetWeightKg) > 0.1) {
    errors.push({
      code: 'WEIGHT_MISMATCH_NET',
      message: `Peso neto total difiere: CI=${ci.totals.totalNetWeightKg}kg vs PL=${pl.totals.totalNetWeightKg}kg`,
      field: 'totals.totalNetWeightKg',
      severity: 'ERROR',
      documentTypes: ['CI_FEDEX', 'CI_UPS', 'CI_DHL', 'PACKING_LIST'],
    });
  }

  if (ci.totals.totalPackages !== pl.totals.totalPackages) {
    errors.push({
      code: 'PACKAGE_COUNT_MISMATCH',
      message: `Número de bultos difiere: CI=${ci.totals.totalPackages} vs PL=${pl.totals.totalPackages}`,
      field: 'totals.totalPackages',
      severity: 'ERROR',
      documentTypes: ['CI_FEDEX', 'CI_UPS', 'CI_DHL', 'PACKING_LIST'],
    });
  }

  if (ci.lines.length !== pl.lines.length) {
    errors.push({
      code: 'LINE_COUNT_MISMATCH',
      message: `Número de líneas difiere: CI=${ci.lines.length} vs PL=${pl.lines.length}`,
      field: 'lines',
      severity: 'ERROR',
      documentTypes: ['CI_FEDEX', 'CI_UPS', 'CI_DHL', 'PACKING_LIST'],
    });
  } else {
    ci.lines.forEach((ciLine, idx) => {
      const plLine = pl.lines[idx];
      if (ciLine.description !== plLine.description) {
        errors.push({
          code: 'DESCRIPTION_MISMATCH',
          message: `Línea ${idx + 1}: descripción difiere: CI="${ciLine.description}" vs PL="${plLine.description}"`,
          field: `lines[${idx}].description`,
          severity: 'ERROR',
          documentTypes: ['CI_FEDEX', 'CI_UPS', 'CI_DHL', 'PACKING_LIST'],
        });
      }
      if (ciLine.hsCode !== plLine.hsCode) {
        errors.push({
          code: 'HS_CODE_MISMATCH',
          message: `Línea ${idx + 1}: HS Code difiere: CI="${ciLine.hsCode}" vs PL="${plLine.hsCode}"`,
          field: `lines[${idx}].hsCode`,
          severity: 'ERROR',
          documentTypes: ['CI_FEDEX', 'CI_UPS', 'CI_DHL', 'PACKING_LIST'],
        });
      }
      if (ciLine.countryOfOrigin !== plLine.countryOfOrigin) {
        errors.push({
          code: 'COO_MISMATCH',
          message: `Línea ${idx + 1}: País de origen difiere: CI="${ciLine.countryOfOrigin}" vs PL="${plLine.countryOfOrigin}"`,
          field: `lines[${idx}].countryOfOrigin`,
          severity: 'ERROR',
          documentTypes: ['CI_FEDEX', 'CI_UPS', 'CI_DHL', 'PACKING_LIST'],
        });
      }
    });
  }

  const ciMarks = extractShippingMarks(ci);
  const plMarks = extractShippingMarks(pl);
  if (JSON.stringify(ciMarks.sort()) !== JSON.stringify(plMarks.sort())) {
    errors.push({
      code: 'SHIPPING_MARKS_MISMATCH',
      message: 'Marcas y números de bultos difieren entre CI y PL',
      field: 'packages.shippingMarks',
      severity: 'ERROR',
      documentTypes: ['CI_FEDEX', 'CI_UPS', 'CI_DHL', 'PACKING_LIST'],
    });
  }
}

// ─── Bundle vs CI+PL ─────────────────────────────────────────────────────────
function validateBundleVsComponents(
  bundle: ShipmentData,
  ci: ShipmentData | undefined,
  pl: ShipmentData | undefined,
  errors: CrossValidationError[],
  warnings: CrossValidationWarning[]
): void {
  if (ci) {
    if (bundle.lines.length !== ci.lines.length) {
      errors.push({
        code: 'BUNDLE_LINE_COUNT_MISMATCH',
        message: `Bundle líneas (${bundle.lines.length}) ≠ CI líneas (${ci.lines.length})`,
        field: 'lines',
        severity: 'ERROR',
        documentTypes: ['BUNDLE_CIPL', 'CI_FEDEX', 'CI_UPS', 'CI_DHL'],
      });
    }
    bundle.lines.forEach((bLine, idx) => {
      const ciLine = ci.lines[idx];
      if (!ciLine) return;
      if (bLine.unitPrice !== ciLine.unitPrice || bLine.lineTotal !== ciLine.lineTotal) {
        errors.push({
          code: 'BUNDLE_FINANCIAL_MISMATCH',
          message: `Línea ${idx + 1}: valores financieros difieren de CI`,
          field: `lines[${idx}].unitPrice|lineTotal`,
          severity: 'ERROR',
          documentTypes: ['BUNDLE_CIPL', 'CI_FEDEX', 'CI_UPS', 'CI_DHL'],
        });
      }
      if (pl) {
        const plLine = pl.lines[idx];
        if (plLine && bLine.packages) {
          const plPackages = plLine.packages || [];
          if (JSON.stringify(bLine.packages) !== JSON.stringify(plPackages)) {
            errors.push({
              code: 'BUNDLE_PHYSICAL_MISMATCH',
              message: `Línea ${idx + 1}: detalle de bultos difiere de PL`,
              field: `lines[${idx}].packages`,
              severity: 'ERROR',
              documentTypes: ['BUNDLE_CIPL', 'PACKING_LIST'],
            });
          }
        }
      }
    });
  }

  if (ci && Math.abs(bundle.totals.grandTotal - ci.totals.grandTotal) > 0.01) {
    errors.push({
      code: 'BUNDLE_TOTAL_MISMATCH',
      message: `Gran total Bundle (${bundle.totals.grandTotal}) ≠ CI (${ci.totals.grandTotal})`,
      field: 'totals.grandTotal',
      severity: 'ERROR',
      documentTypes: ['BUNDLE_CIPL', 'CI_FEDEX', 'CI_UPS', 'CI_DHL'],
    });
  }
}

// ─── Proforma vs CI ─────────────────────────────────────────────────────────
function validateProformaVsCi(
  proforma: ShipmentData,
  ci: ShipmentData,
  errors: CrossValidationError[],
  warnings: CrossValidationWarning[]
): void {
  compareParties(proforma.parties, ci.parties, 'PROFORMA', 'CI', warnings);

  if (proforma.lines.length !== ci.lines.length) {
    warnings.push({
      code: 'PROFORMA_CI_LINE_COUNT_DIFF',
      message: `Número de líneas difiere: Proforma=${proforma.lines.length} vs CI=${ci.lines.length}`,
      field: 'lines',
      severity: 'WARNING',
      documentTypes: ['PROFORMA', 'CI_FEDEX', 'CI_UPS', 'CI_DHL'],
    });
  } else {
    proforma.lines.forEach((pLine, idx) => {
      const ciLine = ci.lines[idx];
      if (pLine.description !== ciLine.description) {
        warnings.push({
          code: 'PROFORMA_CI_DESC_DIFF',
          message: `Línea ${idx + 1}: descripción cambió de Proforma a CI`,
          field: `lines[${idx}].description`,
          severity: 'WARNING',
          documentTypes: ['PROFORMA', 'CI_FEDEX', 'CI_UPS', 'CI_DHL'],
        });
      }
      if (pLine.hsCode !== ciLine.hsCode) {
        warnings.push({
          code: 'PROFORMA_CI_HS_DIFF',
          message: `Línea ${idx + 1}: HS Code cambió de Proforma a CI`,
          field: `lines[${idx}].hsCode`,
          severity: 'WARNING',
          documentTypes: ['PROFORMA', 'CI_FEDEX', 'CI_UPS', 'CI_DHL'],
        });
      }
      if (pLine.countryOfOrigin !== ciLine.countryOfOrigin) {
        errors.push({
          code: 'PROFORMA_CI_COO_DIFF',
          message: `Línea ${idx + 1}: País de origen CAMBIÓ (ilegal): Proforma="${pLine.countryOfOrigin}" vs CI="${ciLine.countryOfOrigin}"`,
          field: `lines[${idx}].countryOfOrigin`,
          severity: 'ERROR',
          documentTypes: ['PROFORMA', 'CI_FEDEX', 'CI_UPS', 'CI_DHL'],
        });
      }
      if (pLine.unitPrice > 0 && ciLine.unitPrice > 0) {
        const variance = Math.abs(ciLine.unitPrice - pLine.unitPrice) / pLine.unitPrice;
        if (variance > 0.1) {
          warnings.push({
            code: 'PROFORMA_CI_PRICE_VARIANCE',
            message: `Línea ${idx + 1}: variación de precio ${(variance * 100).toFixed(1)}% (Proforma: ${pLine.unitPrice} → CI: ${ciLine.unitPrice})`,
            field: `lines[${idx}].unitPrice`,
            severity: 'WARNING',
            documentTypes: ['PROFORMA', 'CI_FEDEX', 'CI_UPS', 'CI_DHL'],
          });
        }
      }
    });
  }
}

// ─── AWB Consistency ────────────────────────────────────────────────────────
function validateAwbConsistency(
  documents: Map<DocumentType, ShipmentData>,
  errors: CrossValidationError[]
): void {
  const awbs = new Map<string, DocumentType[]>();
  documents.forEach((doc, type) => {
    let awb: string | undefined;
    if (type === 'CI_FEDEX') awb = doc.carrierSpecific.fedex?.awbNumber;
    if (type === 'CI_DHL') awb = doc.carrierSpecific.dhl?.awbNumber;
    if (type === 'PACKING_LIST') awb = doc.carrierSpecific.packingList?.awbBlRef;
    if (type === 'BUNDLE_CIPL') awb = doc.carrierSpecific.bundle?.commercialInvoiceRef;
    if (awb) {
      const existing = awbs.get(awb) || [];
      existing.push(type);
      awbs.set(awb, existing);
    }
  });

  awbs.forEach((types, awb) => {
    if (types.length > 1) {
      const carriers = types.map((t) => documents.get(t)!.carrier).filter(Boolean);
      if (new Set(carriers).size > 1) {
        errors.push({
          code: 'AWB_CARRIER_MISMATCH',
          message: `AWB ${awb} referenciado en documentos de carriers distintos: ${types.join(', ')}`,
          field: 'carrierSpecific.awbNumber',
          severity: 'ERROR',
          documentTypes: types,
        });
      }
    }
  });
}

// ─── Totals Arithmetic ──────────────────────────────────────────────────────
function validateTotalsArithmetic(
  documents: Map<DocumentType, ShipmentData>,
  errors: CrossValidationError[]
): void {
  documents.forEach((doc, type) => {
    const calculatedSubtotal = doc.lines.reduce((sum, l) => sum + l.lineTotal, 0);
    if (Math.abs(calculatedSubtotal - doc.totals.subtotal) > 0.01) {
      errors.push({
        code: 'SUBTOTAL_ARITHMETIC_ERROR',
        message: `Subtotal (${doc.totals.subtotal}) ≠ suma de líneas (${calculatedSubtotal})`,
        field: 'totals.subtotal',
        severity: 'ERROR',
        documentTypes: [type],
      });
    }

    const calculatedGrand = doc.totals.subtotal + doc.totals.totalAdditionalCosts;
    if (Math.abs(calculatedGrand - doc.totals.grandTotal) > 0.01) {
      errors.push({
        code: 'GRAND_TOTAL_ARITHMETIC_ERROR',
        message: `Gran total (${doc.totals.grandTotal}) ≠ subtotal + additionalCosts (${calculatedGrand})`,
        field: 'totals.grandTotal',
        severity: 'ERROR',
        documentTypes: [type],
      });
    }

    const calcGross = doc.lines.reduce((sum, l) => sum + l.grossWeightKg, 0);
    if (Math.abs(calcGross - doc.totals.totalGrossWeightKg) > 0.1) {
      errors.push({
        code: 'GROSS_WEIGHT_ARITHMETIC_ERROR',
        message: `Peso bruto total (${doc.totals.totalGrossWeightKg}) ≠ suma líneas (${calcGross})`,
        field: 'totals.totalGrossWeightKg',
        severity: 'ERROR',
        documentTypes: [type],
      });
    }
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function compareParties(
  partiesA: PartiesLike,
  partiesB: PartiesLike,
  labelA: string,
  labelB: string,
  target: CrossValidationError[] | CrossValidationWarning[]
): void {
  const targetAny = target as Array<CrossValidationError | CrossValidationWarning>;
  const isErrorArray = targetAny.length === 0 || targetAny[0]?.severity === 'ERROR';
  const severity: 'ERROR' | 'WARNING' = isErrorArray ? 'ERROR' : 'WARNING';

  const compare = (a: Party | undefined, b: Party | undefined, field: string) => {
    if (a?.legalName !== b?.legalName) {
      targetAny.push({
        code: `PARTY_MISMATCH_${field}`,
        message: `${field}: ${labelA}="${a?.legalName}" vs ${labelB}="${b?.legalName}"`,
        field: `parties.${field}.legalName`,
        severity,
        documentTypes: [],
      });
    }
    if (a?.taxId !== b?.taxId) {
      targetAny.push({
        code: `PARTY_TAXID_MISMATCH_${field}`,
        message: `${field} TaxID: ${labelA}="${a?.taxId}" vs ${labelB}="${b?.taxId}"`,
        field: `parties.${field}.taxId`,
        severity,
        documentTypes: [],
      });
    }
  };

  compare(partiesA.shipper, partiesB.shipper, 'shipper');
  compare(partiesA.consignee, partiesB.consignee, 'consignee');
}

interface PartiesLike {
  shipper?: Party;
  consignee?: Party;
  buyer?: Party;
  producer?: Party;
  importerOfRecord?: Party;
  notifyParty?: Party;
}

function extractShippingMarks(doc: ShipmentData): string[] {
  const marks: string[] = [];
  doc.lines.forEach((line) => {
    line.packages?.forEach((pkg) => marks.push(pkg.shippingMarks));
  });
  return marks;
}
