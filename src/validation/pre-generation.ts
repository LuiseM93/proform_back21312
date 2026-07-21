// ============================================================================
// Pre-Generation Checks — RED (blocking) + AMBER (warning) validation
// ProformaFlow · International Trade Documents · v1.0
// ============================================================================
import type { ShipmentData } from '@/types/shipment';
import { validateDescriptionForCarrier } from '@/constants/controlled-vocabularies';

export interface PreGenError {
  code: string;
  message: string;
  field: string;
  severity: 'BLOCKING';
  regulation?: string;
}

export interface PreGenWarning {
  code: string;
  message: string;
  field: string;
  severity: 'WARNING';
  recommendation?: string;
}

export interface PreGenerationCheckResult {
  canGenerate: boolean;
  blockingErrors: PreGenError[];
  warnings: PreGenWarning[];
}

export function runPreGenerationChecks(data: ShipmentData): PreGenerationCheckResult {
  const blockingErrors: PreGenError[] = [];
  const warnings: PreGenWarning[] = [];

  // 1. UNIT_PRICE_ZERO — unit value > 0 on every line
  data.lines.forEach((line, idx) => {
    if (line.unitPrice <= 0) {
      blockingErrors.push({
        code: 'UNIT_PRICE_ZERO',
        message: `Line ${idx + 1}: Unit price must be > 0 (even samples/gifts require a customs value)`,
        field: `lines[${idx}].unitPrice`,
        severity: 'BLOCKING',
        regulation: '19 CFR 141.86(a)(5); FedEx/DHL/UPS policy',
      });
    }
  });

  // 2. HS_CODE_INVALID — HS Code present (6-10 digits)
  data.lines.forEach((line, idx) => {
    if (!line.hsCode || !/^\d{6,10}$/.test(line.hsCode)) {
      blockingErrors.push({
        code: 'HS_CODE_INVALID',
        message: `Line ${idx + 1}: Invalid HS Code (required: 6-10 digits)`,
        field: `lines[${idx}].hsCode`,
        severity: 'BLOCKING',
        regulation: 'WCO HS Convention; 19 CFR 141.86',
      });
    }
  });

  // 3. COO_MISSING — Country of origin per line
  data.lines.forEach((line, idx) => {
    if (!line.countryOfOrigin || line.countryOfOrigin.length !== 2) {
      blockingErrors.push({
        code: 'COO_MISSING',
        message: `Line ${idx + 1}: Country of origin required (ISO 3166-1 alpha-2)`,
        field: `lines[${idx}].countryOfOrigin`,
        severity: 'BLOCKING',
        regulation: '19 CFR 141.86(a)(10)',
      });
    }
  });

  // 4. DESCRIPTION — BLOCKING (length/package type/blacklist words) [FASE 3 + FIX P1]
  data.lines.forEach((line, idx) => {
    const descCheck = validateDescriptionForCarrier(data.carrier, line.description);
    if (descCheck.errors.length > 0) {
      blockingErrors.push({
        code: 'DESCRIPTION_TOO_GENERIC',
        message: `Line ${idx + 1}: ${descCheck.errors.join('; ')}`,
        field: `lines[${idx}].description`,
        severity: 'BLOCKING',
        regulation: 'FedEx/DHL/UPS description requirements; 19 CFR 141.86',
      });
    }
    // FIX P1: blacklist words are now inside descCheck.errors (BLOCKING). No separate warning.
  });

  // 5. EORI_MISSING_EU — EORI mandatory for EU destination (carrier-aware)
  if (data.destinationCountryGroup === 'EU') {
    const importer = data.parties.consignee;
    const ior = data.parties.importerOfRecord || importer;
    const isDHL = data.carrier === 'DHL';
    const eoriValue = isDHL ? ior.eori : ior.taxId;
    const eoriField = isDHL ? 'parties.importerOfRecord.eori / parties.consignee.eori' : 'parties.consignee.taxId';
    if (!eoriValue || !/^[A-Z]{2}[A-Z0-9]{1,15}$/.test(eoriValue)) {
      blockingErrors.push({
        code: 'EORI_MISSING_EU',
        message: `EU destination: Importer EORI is mandatory for customs clearance${isDHL ? ' (DHL requires IOR.eori field)' : ''}`,
        field: eoriField,
        severity: 'BLOCKING',
        regulation: 'EU Customs Code (UCC); DHL/FedEx/UPS EU requirements',
      });
    }
  }

  // 6. RFC_REQUIRED_MX — RFC mandatory if shipper is in Mexico (BLOCKING for CI documents)
  // SAT/CFDI 4.0: a Mexican shipper requires a valid RFC for fiscal customs validity.
  if (data.parties.shipper.address.countryCode === 'MX') {
    const isCommercialInvoice = ['CI_FEDEX', 'CI_UPS', 'CI_DHL'].includes(data.documentType);
    if (!data.parties.shipper.taxId || !/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/.test(data.parties.shipper.taxId)) {
      if (isCommercialInvoice) {
        blockingErrors.push({
          code: 'RFC_REQUIRED_MX',
          message: 'Shipper in Mexico: a valid RFC tax ID is mandatory for Commercial Invoices (CFDI 4.0 + Complemento Comercio Exterior).',
          field: 'parties.shipper.taxId',
          severity: 'BLOCKING',
          regulation: 'SAT CFDI 4.0; Complemento Comercio Exterior',
        });
      } else {
        warnings.push({
          code: 'RFC_RECOMMENDED_MX',
          message: 'Shipper in Mexico: RFC recommended for Mexican fiscal compliance (CFDI).',
          field: 'parties.shipper.taxId',
          severity: 'WARNING',
          recommendation: 'Capture the shipper RFC to enable CFDI 4.0 compliance.',
        });
      }
    }
  }

  // 7. SUBTOTAL_MISMATCH — totals must be arithmetically consistent
  const calcSubtotal = data.lines.reduce((sum, l) => sum + l.lineTotal, 0);
  if (Math.abs(calcSubtotal - data.totals.subtotal) > 0.01) {
    blockingErrors.push({
      code: 'SUBTOTAL_MISMATCH',
      message: `Subtotal (${data.totals.subtotal}) ≠ sum of lines (${calcSubtotal})`,
      field: 'totals.subtotal',
      severity: 'BLOCKING',
      regulation: 'Arithmetic consistency; UPS/FedEx/DHL validation',
    });
  }

  // 8. WEIGHT_MISMATCH_BUNDLE — weights match CI vs PL (Bundle)
  if (data.documentType === 'BUNDLE_CIPL') {
    const calcGross = data.lines.reduce((sum, l) => sum + l.grossWeightKg, 0);
    if (Math.abs(calcGross - data.totals.totalGrossWeightKg) > 0.1) {
      blockingErrors.push({
        code: 'WEIGHT_MISMATCH_BUNDLE',
        message: `Total gross weight (${data.totals.totalGrossWeightKg}) ≠ sum of lines (${calcGross})`,
        field: 'totals.totalGrossWeightKg',
        severity: 'BLOCKING',
        regulation: 'Cross-document consistency; Carrier weight verification',
      });
    }
  }

  // 9. INCOTERM_INVALID — valid Incoterms 2020
  const incoterm = data.lines[0]?.incoterm;
  if (incoterm && !['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF'].includes(incoterm)) {
    blockingErrors.push({
      code: 'INCOTERM_INVALID',
      message: `Incoterm "${incoterm}" is not valid. Use Incoterms® 2020 (11 terms)`,
      field: 'lines[0].incoterm',
      severity: 'BLOCKING',
      regulation: 'ICC Incoterms® 2020',
    });
  }

  // 10. PROFORMA_USED_AS_CI — A Proforma Invoice is NOT a Commercial Invoice (WARNING)
  // 19 CFR 141.86: only a formal Commercial Invoice is accepted for customs clearance.
  // The Proforma itself is a VALID quotation document and MUST be generable. We warn (not block)
  // so the user knows it cannot be used for clearance — but we do NOT prevent generation.
  if (data.documentType === 'PROFORMA') {
    warnings.push({
      code: 'PROFORMA_USED_AS_CI',
      message: 'A PROFORMA INVOICE is NOT valid for customs clearance. Generate a formal Commercial Invoice for the actual shipment.',
      field: 'documentType',
      severity: 'WARNING',
      recommendation: 'Use a Commercial Invoice (CI_FEDEX/CI_UPS/CI_DHL) for actual shipment and customs clearance.',
    });
  }

  // 11. NAFTA_OBSOLETE_CHECK — UPS must NOT embed a NAFTA block (BLOCKING + real detection)
  // NAFTA was replaced by USMCA (2020); an embedded "NAFTA Certification" block is obsolete and rejected.
  const embeddedNaftaDetected =
    (data.carrierSpecific.ups?.usmcaCertification as unknown as { nafta?: unknown } | undefined)?.nafta !== undefined ||
    JSON.stringify(data.carrierSpecific.ups || {}).toUpperCase().includes('"NAFTA"');
  if (data.carrier === 'UPS' && embeddedNaftaDetected) {
    blockingErrors.push({
      code: 'NAFTA_OBSOLETE_EMBEDDED',
      message: 'UPS: an embedded "NAFTA Certification" block is obsolete (replaced by USMCA in 2020). Remove it; use a separate USMCA Certificate.',
      field: 'carrierSpecific.ups',
      severity: 'BLOCKING',
      regulation: 'USMCA (2020); UPS valuation requirements',
    });
  } else if (data.carrier === 'UPS' && !data.carrierSpecific.ups?.usmcaCertification) {
    warnings.push({
      code: 'NAFTA_OBSOLETE_CHECK',
      message: 'Confirm NO "NAFTA Certification" block is embedded (obsolete since 2020). Use a separate USMCA Certificate if needed.',
      field: 'carrierSpecific.ups',
      severity: 'WARNING',
      recommendation: 'USMCA Certification must be a separate document since 2020.',
    });
  }

  // 12. AWB_FORMAT_INVALID — AWB format per carrier (RED)
  const awbField =
    data.documentType === 'CI_FEDEX' ? data.carrierSpecific.fedex?.awbNumber :
    data.documentType === 'CI_DHL' ? data.carrierSpecific.dhl?.awbNumber : undefined;

  if (data.documentType === 'CI_FEDEX' && awbField && !/^\d{12}$/.test(awbField)) {
    blockingErrors.push({
      code: 'AWB_FORMAT_INVALID',
      message: `Invalid FedEx AWB: must be 12 digits (received: "${awbField}")`,
      field: 'carrierSpecific.fedex.awbNumber',
      severity: 'BLOCKING',
      regulation: 'FedEx AWB format requirement',
    });
  }
  if (data.documentType === 'CI_DHL' && awbField && !/^\d{10}$/.test(awbField)) {
    blockingErrors.push({
      code: 'AWB_FORMAT_INVALID',
      message: `Invalid DHL AWB: must be 10 digits (received: "${awbField}")`,
      field: 'carrierSpecific.dhl.awbNumber',
      severity: 'BLOCKING',
      regulation: 'DHL AWB format requirement',
    });
  }

  // 12b. UPS Invoice/Tracking Number — full 1Z regex required at all times (RED)
  // A UPS invoice/tracking number must be "1Z" + 16 alphanumerics. Any other value is rejected.
  if (data.documentType === 'CI_UPS') {
    const upsRef = data.carrierSpecific.ups?.invoiceNumber ?? '';
    if (!/^1Z[A-Z0-9]{16}$/.test(upsRef.toUpperCase())) {
      blockingErrors.push({
        code: 'UPS_INVOICE_NUMBER_INVALID',
        message: `UPS invoice/tracking number invalid: required format is "1Z" + 16 alphanumerics (e.g. 1Z999AA10123456784). Received: "${upsRef}".`,
        field: 'carrierSpecific.ups.invoiceNumber',
        severity: 'BLOCKING',
        regulation: 'UPS 1Z tracking format (1Z + 16 chars)',
      });
    }
  }

  // 13. PARTIES_RELATIONSHIP_MISSING_UPS — UPS RELATED/NOT_RELATED (RED)
  if (data.documentType === 'CI_UPS' && !data.carrierSpecific.ups?.partiesRelationship) {
    blockingErrors.push({
      code: 'PARTIES_RELATIONSHIP_MISSING_UPS',
      message: 'UPS: Related/Not Related (Parties to Transaction) is mandatory for intercompany valuation.',
      field: 'carrierSpecific.ups.partiesRelationship',
      severity: 'BLOCKING',
      regulation: 'UPS valuation requirements; 19 CFR 152.103',
    });
  }

  // 14. PAPER_INVOICE_SURCHARGE_UPS — Warning if UPS paper invoice (AMBER)
  if (data.carrier === 'UPS' && (data.output.outputFormat === 'PDF' || data.output.outputFormat === 'BOTH')) {
    warnings.push({
      code: 'PAPER_INVOICE_SURCHARGE_UPS',
      message: 'UPS charges ~$5/shipment for a paper invoice. Use Paperless Invoice / EDI to avoid the surcharge.',
      field: 'output.outputFormat',
      severity: 'WARNING',
      recommendation: 'Use EDI_JSON output format with UPS_PAPERLESS',
    });
  }

  // 15. DE_MINIMIS_SUSPENDED_US — Shipment to US under $800 (AMBER)
  if (data.destinationCountryCode === 'US' && data.totals.grandTotal < 800) {
    warnings.push({
      code: 'DE_MINIMIS_SUSPENDED_US',
      message: 'Section 321 de minimis (USD 800) is SUSPENDED globally since 2025-08-29. A formal CI + HS + duty is mandatory.',
      field: 'totals.grandTotal',
      severity: 'WARNING',
      recommendation: 'Formal CI required even under $800 since de minimis suspension',
    });
  }

  // 16. BUNDLE_NOT_ACCEPTED_DESTINATION — Some countries require separate CI+PL (AMBER)
  if (data.documentType === 'BUNDLE_CIPL') {
    const requiresSeparate = ['BR', 'AR', 'CL', 'PE', 'CO']; // Common Latin American countries
    if (requiresSeparate.includes(data.destinationCountryCode)) {
      warnings.push({
        code: 'BUNDLE_NOT_ACCEPTED_DESTINATION',
        message: `Destination ${data.destinationCountryCode} may require separate CI and PL (not a combined CIPL). Verify country/bank requirements.`,
        field: 'documentType',
        severity: 'WARNING',
        recommendation: 'Generate separate Commercial Invoice + Packing List for this destination',
      });
    }
  }

  // 17. PRICE_VARIANCE_PROFORMA_CI — >10% variance Proforma→CI (AMBER)
  // Only applies if Proforma and CI are in the same batch (validated in cross-document)

  return {
    canGenerate: blockingErrors.length === 0,
    blockingErrors,
    warnings,
  };
}
