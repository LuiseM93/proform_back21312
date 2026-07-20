// ============================================================================
// Pre-Generation Checks — 11 reglas ROJO + 6 AMARILLO
// ProformaFlow · Comercio Internacional · v1.0
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

  // 1. UNIT_PRICE_ZERO — Valor unitario > 0 en todas las líneas
  data.lines.forEach((line, idx) => {
    if (line.unitPrice <= 0) {
      blockingErrors.push({
        code: 'UNIT_PRICE_ZERO',
        message: `Línea ${idx + 1}: Valor unitario debe ser > 0 (incluso muestras/regalos requieren valor de aduana)`,
        field: `lines[${idx}].unitPrice`,
        severity: 'BLOCKING',
        regulation: '19 CFR 141.86(a)(5); FedEx/DHL/UPS policy',
      });
    }
  });

  // 2. HS_CODE_INVALID — HS Code presente (6-10 dígitos)
  data.lines.forEach((line, idx) => {
    if (!line.hsCode || !/^\d{6,10}$/.test(line.hsCode)) {
      blockingErrors.push({
        code: 'HS_CODE_INVALID',
        message: `Línea ${idx + 1}: HS Code inválido (requerido 6-10 dígitos)`,
        field: `lines[${idx}].hsCode`,
        severity: 'BLOCKING',
        regulation: 'WCO HS Convention; 19 CFR 141.86',
      });
    }
  });

  // 3. COO_MISSING — País de origen por línea
  data.lines.forEach((line, idx) => {
    if (!line.countryOfOrigin || line.countryOfOrigin.length !== 2) {
      blockingErrors.push({
        code: 'COO_MISSING',
        message: `Línea ${idx + 1}: País de origen requerido (ISO 3166-1 alpha-2)`,
        field: `lines[${idx}].countryOfOrigin`,
        severity: 'BLOCKING',
        regulation: '19 CFR 141.86(a)(10)',
      });
    }
  });

  // 4. DESCRIPTION — BLOCKING (largo/empaque) + WARNING (palabras genéricas) [FASE 3]
  data.lines.forEach((line, idx) => {
    const descCheck = validateDescriptionForCarrier(data.carrier, line.description);
    if (descCheck.errors.length > 0) {
      blockingErrors.push({
        code: 'DESCRIPTION_TOO_GENERIC',
        message: `Línea ${idx + 1}: ${descCheck.errors.join('; ')}`,
        field: `lines[${idx}].description`,
        severity: 'BLOCKING',
        regulation: 'FedEx/DHL/UPS description requirements; 19 CFR 141.86',
      });
    }
    if (descCheck.warnings.length > 0) {
      warnings.push({
        code: 'DESCRIPTION_BLACKLIST_WORD',
        message: `Línea ${idx + 1}: ${descCheck.warnings.join('; ')}`,
        field: `lines[${idx}].description`,
        severity: 'WARNING',
        recommendation: 'Reemplace términos genéricos por descripción específica (qué es, material, uso).',
      });
    }
  });

  // 5. EORI_MISSING_EU — EORI obligatorio si destino UE
  if (data.destinationCountryGroup === 'EU') {
    const importer = data.parties.consignee;
    const ior = data.parties.importerOfRecord || importer;
    if (!ior.taxId || !/^[A-Z]{2}[A-Z0-9]{1,15}$/.test(ior.taxId)) {
      blockingErrors.push({
        code: 'EORI_MISSING_EU',
        message: 'Destino UE: EORI del importador es obligatorio para despacho aduanero',
        field: 'parties.consignee.taxId',
        severity: 'BLOCKING',
        regulation: 'EU Customs Code (UCC); DHL/FedEx/UPS EU requirements',
      });
    }
  }

  // 6. RFC_RECOMMENDED_MX — RFC recomendado si exportador México (WARNING)
  if (data.parties.shipper.address.countryCode === 'MX') {
    if (!data.parties.shipper.taxId || !/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/.test(data.parties.shipper.taxId)) {
      warnings.push({
        code: 'RFC_RECOMMENDED_MX',
        message: 'Exportador México: RFC recomendado para CFDI 4.0 + Complemento Comercio Exterior',
        field: 'parties.shipper.taxId',
        severity: 'WARNING',
        recommendation: 'Capture RFC for Mexican fiscal compliance (CFDI)',
      });
    }
  }

  // 7. SUBTOTAL_MISMATCH — Totales cuadran aritméticamente
  const calcSubtotal = data.lines.reduce((sum, l) => sum + l.lineTotal, 0);
  if (Math.abs(calcSubtotal - data.totals.subtotal) > 0.01) {
    blockingErrors.push({
      code: 'SUBTOTAL_MISMATCH',
      message: `Subtotal (${data.totals.subtotal}) ≠ suma de líneas (${calcSubtotal})`,
      field: 'totals.subtotal',
      severity: 'BLOCKING',
      regulation: 'Arithmetic consistency; UPS/FedEx/DHL validation',
    });
  }

  // 8. WEIGHT_MISMATCH_BUNDLE — Pesos coinciden CI vs PL (Bundle)
  if (data.documentType === 'BUNDLE_CIPL') {
    const calcGross = data.lines.reduce((sum, l) => sum + l.grossWeightKg, 0);
    if (Math.abs(calcGross - data.totals.totalGrossWeightKg) > 0.1) {
      blockingErrors.push({
        code: 'WEIGHT_MISMATCH_BUNDLE',
        message: `Peso bruto total (${data.totals.totalGrossWeightKg}) ≠ suma líneas (${calcGross})`,
        field: 'totals.totalGrossWeightKg',
        severity: 'BLOCKING',
        regulation: 'Cross-document consistency; Carrier weight verification',
      });
    }
  }

  // 9. INCOTERM_INVALID — Incoterms 2020 válido
  const incoterm = data.lines[0]?.incoterm;
  if (incoterm && !['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF'].includes(incoterm)) {
    blockingErrors.push({
      code: 'INCOTERM_INVALID',
      message: `Incoterm "${incoterm}" no válido. Use Incoterms® 2020 (11 términos)`,
      field: 'lines[0].incoterm',
      severity: 'BLOCKING',
      regulation: 'ICC Incoterms® 2020',
    });
  }

  // 10. PROFORMA_USED_AS_CI — Proforma no válida para despacho (WARNING)
  if (data.documentType === 'PROFORMA') {
    warnings.push({
      code: 'PROFORMA_NOT_FOR_CLEARANCE',
      message: 'PROFORMA INVOICE no es válida para despacho aduanero. Genere Commercial Invoice para envío real.',
      field: 'documentType',
      severity: 'WARNING',
      recommendation: 'Use Commercial Invoice for actual shipment and customs clearance',
    });
  }

  // 11. NAFTA_OBSOLETE_CHECK — UPS no debe incluir NAFTA embebido (WARNING)
  if (data.carrier === 'UPS' && data.carrierSpecific.ups?.usmcaCertification) {
    // OK — es documento separado
  } else if (data.documentType === 'CI_UPS') {
    warnings.push({
      code: 'NAFTA_OBSOLETE_CHECK',
      message: 'Verifique que NO incluye bloque "NAFTA Certification" (obsoleto desde 2020). Use USMCA Certification separada.',
      field: 'carrierSpecific.ups',
      severity: 'WARNING',
      recommendation: 'USMCA Certification must be a separate document since 2020',
    });
  }

  // 12. AWB_FORMAT_INVALID — Formato AWB por carrier (ROJO)
  const awbField =
    data.documentType === 'CI_FEDEX' ? data.carrierSpecific.fedex?.awbNumber :
    data.documentType === 'CI_DHL' ? data.carrierSpecific.dhl?.awbNumber : undefined;

  if (data.documentType === 'CI_FEDEX' && awbField && !/^\d{12}$/.test(awbField)) {
    blockingErrors.push({
      code: 'AWB_FORMAT_INVALID',
      message: `AWB FedEx inválido: debe tener 12 dígitos (actual: "${awbField}")`,
      field: 'carrierSpecific.fedex.awbNumber',
      severity: 'BLOCKING',
      regulation: 'FedEx AWB format requirement',
    });
  }
  if (data.documentType === 'CI_DHL' && awbField && !/^\d{10}$/.test(awbField)) {
    blockingErrors.push({
      code: 'AWB_FORMAT_INVALID',
      message: `AWB DHL inválido: debe tener 10 dígitos (actual: "${awbField}")`,
      field: 'carrierSpecific.dhl.awbNumber',
      severity: 'BLOCKING',
      regulation: 'DHL AWB format requirement',
    });
  }

  // AWB/Tracking UPS: si el Invoice Number se captura como tracking 1Z, validar formato (ROJO)
  if (data.documentType === 'CI_UPS') {
    const upsRef = data.carrierSpecific.ups?.invoiceNumber;
    if (upsRef && upsRef.toUpperCase().startsWith('1Z') && !/^1Z[A-Z0-9]{16}$/.test(upsRef.toUpperCase())) {
      blockingErrors.push({
        code: 'AWB_FORMAT_INVALID',
        message: `Tracking UPS inválido: formato 1Z requiere 1Z + 16 alfanuméricos (actual: "${upsRef}")`,
        field: 'carrierSpecific.ups.invoiceNumber',
        severity: 'BLOCKING',
        regulation: 'UPS 1Z tracking format (1Z + 16 chars)',
      });
    }
  }

  // 13. PARTIES_RELATIONSHIP_MISSING_UPS — UPS RELATED/NOT_RELATED (ROJO)
  if (data.documentType === 'CI_UPS' && !data.carrierSpecific.ups?.partiesRelationship) {
    blockingErrors.push({
      code: 'PARTIES_RELATIONSHIP_MISSING_UPS',
      message: 'UPS: Related/Not Related (Parties to Transaction) es obligatorio para valoración intercompañía',
      field: 'carrierSpecific.ups.partiesRelationship',
      severity: 'BLOCKING',
      regulation: 'UPS valuation requirements; 19 CFR 152.103',
    });
  }

  // 14. PAPER_INVOICE_SURCHARGE_UPS — Warning si UPS papel (AMARILLO)
  if (data.carrier === 'UPS' && (data.output.outputFormat === 'PDF' || data.output.outputFormat === 'BOTH')) {
    warnings.push({
      code: 'PAPER_INVOICE_SURCHARGE_UPS',
      message: 'UPS cobra $5/shipment por factura en papel. Use Paperless Invoice / EDI para evitar recargo.',
      field: 'output.outputFormat',
      severity: 'WARNING',
      recommendation: 'Use EDI_JSON output format with UPS_PAPERLESS',
    });
  }

  // 15. DE_MINIMIS_SUSPENDED_US — Envío a EE.UU. < $800 (AMARILLO)
  if (data.destinationCountryCode === 'US' && data.totals.grandTotal < 800) {
    warnings.push({
      code: 'DE_MINIMIS_SUSPENDED_US',
      message: 'Sección 321 de minimis (USD 800) SUSPENDIDA globalmente desde 2025-08-29. CI formal + HS + arancel obligatorios.',
      field: 'totals.grandTotal',
      severity: 'WARNING',
      recommendation: 'Formal CI required even under $800 since de minimis suspension',
    });
  }

  // 16. BUNDLE_NOT_ACCEPTED_DESTINATION — Algunos países exigen CI+PL separados (AMARILLO)
  if (data.documentType === 'BUNDLE_CIPL') {
    const requiresSeparate = ['BR', 'AR', 'CL', 'PE', 'CO']; // Países latinoamericanos comunes
    if (requiresSeparate.includes(data.destinationCountryCode)) {
      warnings.push({
        code: 'BUNDLE_NOT_ACCEPTED_DESTINATION',
        message: `Destino ${data.destinationCountryCode} puede requerir CI y PL separados (no CIPL combinado). Verifique requisito país/banco.`,
        field: 'documentType',
        severity: 'WARNING',
        recommendation: 'Generate separate Commercial Invoice + Packing List for this destination',
      });
    }
  }

  // 17. PRICE_VARIANCE_PROFORMA_CI — Variación >10% Proforma→CI (AMARILLO)
  // Solo aplica si tenemos Proforma y CI en el mismo lote (se valida en cross-document)

  return {
    canGenerate: blockingErrors.length === 0,
    blockingErrors,
    warnings,
  };
}
