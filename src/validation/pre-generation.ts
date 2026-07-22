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

  // 10. PROFORMA_USED_AS_CI — A Proforma Invoice is NOT a Commercial Invoice (BLOCKING)
  // 19 CFR 141.86: only a formal Commercial Invoice is accepted for customs clearance.
  // The Proforma itself is a VALID quotation document but MUST NOT be used for clearance.
  if (data.documentType === 'PROFORMA') {
    blockingErrors.push({
      code: 'PROFORMA_USED_AS_CI',
      message: 'A PROFORMA INVOICE is NOT valid for customs clearance. Generate a formal Commercial Invoice (CI_FEDEX/CI_UPS/CI_DHL) for the actual shipment.',
      field: 'documentType',
      severity: 'BLOCKING',
      regulation: '19 CFR 141.86; FedEx/DHL/UPS policy',
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

  // ============================================================================
  // NEW BLOCKING VALIDATIONS — Informe Doc 2-6 compliance
  // ============================================================================

  // 14. REASON_FOR_EXPORT_MISSING — FedEx/DHL requieren motivo
  if (data.documentType === 'CI_FEDEX') {
    const reason = data.carrierSpecific.fedex?.reasonForExport;
    if (!reason || !['SALE', 'SAMPLE', 'GIFT', 'REPAIR', 'RETURN', 'PERSONAL_USE'].includes(reason)) {
      blockingErrors.push({
        code: 'REASON_FOR_EXPORT_MISSING',
        message: 'FedEx: Reason for Export is mandatory (SALE, SAMPLE, GIFT, REPAIR, RETURN, PERSONAL_USE)',
        field: 'carrierSpecific.fedex.reasonForExport',
        severity: 'BLOCKING',
        regulation: 'FedEx M-1054; 19 CFR 141.86',
      });
    }
  }
  if (data.documentType === 'CI_DHL') {
    const reason = data.carrierSpecific.dhl?.reasonForExport;
    if (!reason || !['SALE', 'SAMPLE', 'REPAIR', 'RETURN', 'PERSONAL_USE', 'GIFT', 'POST_REPAIR'].includes(reason)) {
      blockingErrors.push({
        code: 'REASON_FOR_EXPORT_MISSING',
        message: 'DHL: Reason for Export is mandatory (SALE, SAMPLE, REPAIR, RETURN, PERSONAL_USE, GIFT, POST_REPAIR)',
        field: 'carrierSpecific.dhl.reasonForExport',
        severity: 'BLOCKING',
        regulation: 'DHL MyDHL+ requirements',
      });
    }
  }

  // 15. DHL_TYPE_OF_EXPORT_MISSING
  if (data.documentType === 'CI_DHL') {
    const typeOfExport = data.carrierSpecific.dhl?.typeOfExport;
    if (!typeOfExport || !['PERMANENT', 'TEMPORARY', 'REPAIR_AND_RETURN'].includes(typeOfExport)) {
      blockingErrors.push({
        code: 'DHL_TYPE_OF_EXPORT_MISSING',
        message: 'DHL: Type of Export is mandatory (PERMANENT, TEMPORARY, REPAIR_AND_RETURN)',
        field: 'carrierSpecific.dhl.typeOfExport',
        severity: 'BLOCKING',
        regulation: 'DHL MyDHL+ requirements',
      });
    }
  }

  // 16. LINE_TOTAL_ARITHMETIC — quantity × unitPrice = lineTotal por línea
  data.lines.forEach((line, idx) => {
    const expected = line.quantity * line.unitPrice;
    if (Math.abs(line.lineTotal - expected) > 0.01) {
      blockingErrors.push({
        code: 'LINE_TOTAL_ARITHMETIC',
        message: `Line ${idx + 1}: lineTotal (${line.lineTotal}) ≠ quantity × unitPrice (${expected})`,
        field: `lines[${idx}].lineTotal`,
        severity: 'BLOCKING',
        regulation: 'Arithmetic consistency; 19 CFR 141.86(a)(5)-(6)',
      });
    }
  });

  // 17. GRAND_TOTAL_ARITHMETIC — subtotal + additionalCosts = grandTotal
  const expectedGrand = data.totals.subtotal + data.totals.totalAdditionalCosts;
  if (Math.abs(data.totals.grandTotal - expectedGrand) > 0.01) {
    blockingErrors.push({
      code: 'GRAND_TOTAL_ARITHMETIC',
      message: `grandTotal (${data.totals.grandTotal}) ≠ subtotal + additionalCosts (${expectedGrand})`,
      field: 'totals.grandTotal',
      severity: 'BLOCKING',
      regulation: 'Arithmetic consistency; Invoice total verification',
    });
  }

  // 18. TOTAL_PACKAGES_POSITIVE
  if (data.totals.totalPackages <= 0) {
    blockingErrors.push({
      code: 'TOTAL_PACKAGES_POSITIVE',
      message: 'Total packages must be > 0 (carrier requires at least 1 package)',
      field: 'totals.totalPackages',
      severity: 'BLOCKING',
      regulation: 'Carrier manifest requirements; UPS/FedEx/DHL package count',
    });
  }

  // 19. CARRIER_REFERENCE_MISSING — Invoice/Reference obligatorio por carrier
  if (data.documentType === 'CI_FEDEX') {
    const ref = data.carrierSpecific.fedex?.exportReferences?.trim();
    const awb = data.carrierSpecific.fedex?.awbNumber?.trim();
    if (!ref && !awb) {
      blockingErrors.push({
        code: 'CARRIER_REFERENCE_MISSING',
        message: 'FedEx: Export References or AWB Number is required',
        field: 'carrierSpecific.fedex.exportReferences / awbNumber',
        severity: 'BLOCKING',
        regulation: 'FedEx M-1054 field 2',
      });
    }
  }
  if (data.documentType === 'CI_UPS') {
    const inv = data.carrierSpecific.ups?.invoiceNumber?.trim();
    if (!inv) {
      blockingErrors.push({
        code: 'CARRIER_REFERENCE_MISSING',
        message: 'UPS: Invoice Number is required',
        field: 'carrierSpecific.ups.invoiceNumber',
        severity: 'BLOCKING',
        regulation: 'UPS Commercial Invoice field 9',
      });
    }
  }
  if (data.documentType === 'CI_DHL') {
    const awb = data.carrierSpecific.dhl?.awbNumber?.trim();
    const ref = data.carrierSpecific.dhl?.shipmentReference?.trim();
    if (!awb || !ref) {
      blockingErrors.push({
        code: 'CARRIER_REFERENCE_MISSING',
        message: 'DHL: AWB Number (10 digits) and Shipment Reference are required',
        field: 'carrierSpecific.dhl.awbNumber / shipmentReference',
        severity: 'BLOCKING',
        regulation: 'DHL MyDHL+ Block 1',
      });
    }
  }

  // 20. PARTIES_REQUIRED_FIELDS — Shipper/Consignee campos obligatorios
  ['shipper', 'consignee'].forEach((role) => {
    const party = data.parties[role as keyof typeof data.parties];
    if (!party) {
      blockingErrors.push({
        code: 'PARTIES_REQUIRED_FIELDS',
        message: `${role} is required`,
        field: `parties.${role}`,
        severity: 'BLOCKING',
        regulation: '19 CFR 141.86(j)',
      });
      return;
    }
    if (!party.legalName?.trim()) {
      blockingErrors.push({
        code: 'PARTIES_REQUIRED_FIELDS',
        message: `${role}: legalName is required`,
        field: `parties.${role}.legalName`,
        severity: 'BLOCKING',
        regulation: '19 CFR 141.86(j)',
      });
    }
    if (!party.address?.street?.trim() || !party.address?.city?.trim() || !party.address?.countryCode?.trim()) {
      blockingErrors.push({
        code: 'PARTIES_REQUIRED_FIELDS',
        message: `${role}: complete address (street, city, countryCode) is required`,
        field: `parties.${role}.address`,
        severity: 'BLOCKING',
        regulation: '19 CFR 141.86(a)(1)-(3)',
      });
    }
    if (!party.taxId?.trim()) {
      blockingErrors.push({
        code: 'PARTIES_REQUIRED_FIELDS',
        message: `${role}: taxId is required`,
        field: `parties.${role}.taxId`,
        severity: 'BLOCKING',
        regulation: '19 CFR 141.86(j); EU EORI; SAT RFC',
      });
    }
  });

  // 21. INCOTERM_REQUIRED — Obligatorio en CI + Proforma
  const isCI = ['CI_FEDEX', 'CI_UPS', 'CI_DHL'].includes(data.documentType);
  const isProforma = data.documentType === 'PROFORMA';
  if (isCI || isProforma) {
    // Buscar incoterm en lines[0] O en carrierSpecific
    const lineIncoterm = data.lines[0]?.incoterm;
    const carrierIncoterm = data.carrierSpecific.ups?.termsOfSale?.code ||
                            data.carrierSpecific.dhl?.termsOfTrade?.code;
    const incoterm = lineIncoterm || carrierIncoterm;
    if (!incoterm) {
      blockingErrors.push({
        code: 'INCOTERM_REQUIRED',
        message: 'Incoterms® 2020 is mandatory for Commercial Invoice and Proforma',
        field: isCI ? 'carrierSpecific.<carrier>.termsOfSale/termsOfTrade' : 'lines[0].incoterm',
        severity: 'BLOCKING',
        regulation: 'ICC Incoterms® 2020; 19 CFR 141.86; Informe checklist',
      });
    } else if (!['EXW','FCA','CPT','CIP','DAP','DPU','DDP','FAS','FOB','CFR','CIF'].includes(incoterm)) {
      blockingErrors.push({
        code: 'INCOTERM_INVALID',
        message: `Incoterm "${incoterm}" is not valid. Use Incoterms® 2020 (11 terms)`,
        field: 'incoterm',
        severity: 'BLOCKING',
        regulation: 'ICC Incoterms® 2020',
      });
    }
  }

  // 22. CURRENCY_CONSISTENCY — Todas las líneas misma moneda = totales misma moneda
  const lineCurrencies = [...new Set(data.lines.map(l => l.currency))];
  if (lineCurrencies.length > 1) {
    blockingErrors.push({
      code: 'CURRENCY_CONSISTENCY',
      message: `Multiple currencies in lines: ${lineCurrencies.join(', ')}. All lines must use the same currency.`,
      field: 'lines[*].currency',
      severity: 'BLOCKING',
      regulation: 'Invoice monetary consistency; Customs valuation single currency',
    });
  }
  if (lineCurrencies[0] && data.totals.currency !== lineCurrencies[0]) {
    blockingErrors.push({
      code: 'CURRENCY_CONSISTENCY',
      message: `Totals currency (${data.totals.currency}) ≠ lines currency (${lineCurrencies[0]})`,
      field: 'totals.currency',
      severity: 'BLOCKING',
      regulation: 'Invoice monetary consistency',
    });
  }

  // 23. UOM_PACKAGE_TYPE_CATALOG — Validar contra catálogos controlados
  const validUOM = ['PCS','KG','LB','M','M2','M3','L','MT','PR','SET','DOZ','GRO','THD','HUND','RL','BX','CS','CT','PK','EA'];
  const validPkgTypes = ['BOX','PALLET','CRATE','DRUM','BAG','ROLL','BUNDLE','CARTON','CASE','CONTAINER','OTHER'];
  data.lines.forEach((line, idx) => {
    if (!validUOM.includes(line.uom)) {
      blockingErrors.push({
        code: 'UOM_INVALID',
        message: `Line ${idx + 1}: UOM "${line.uom}" not in controlled catalog`,
        field: `lines[${idx}].uom`,
        severity: 'BLOCKING',
        regulation: 'Controlled vocabularies (UN/CEFACT Recommendation 20)',
      });
    }
    line.packages?.forEach((pkg, pi) => {
      if (pkg.packageType && !validPkgTypes.includes(pkg.packageType)) {
        blockingErrors.push({
          code: 'PACKAGE_TYPE_INVALID',
          message: `Line ${idx + 1} pkg ${pi + 1}: packageType "${pkg.packageType}" not in catalog`,
          field: `lines[${idx}].packages[${pi}].packageType`,
          severity: 'BLOCKING',
          regulation: 'Controlled vocabularies (UN/CEFACT)',
        });
      }
    });
  });

  // 24. CROSS_DOCUMENT_CONSISTENCY_CI_PL — Packages con shippingMarks obligatorios
  if (data.documentType === 'BUNDLE_CIPL' || data.documentType === 'PACKING_LIST') {
    data.lines.forEach((line, idx) => {
      if (!line.packages || line.packages.length === 0) {
        blockingErrors.push({
          code: 'CROSS_DOCUMENT_CONSISTENCY',
          message: `Line ${idx + 1}: Packing List requires at least 1 package with shippingMarks per line`,
          field: `lines[${idx}].packages`,
          severity: 'BLOCKING',
          regulation: '19 CFR 141.86(e); Marks & numbers mandatory for customs verification',
        });
      } else {
        line.packages.forEach((pkg, pi) => {
          if (!pkg.shippingMarks?.trim()) {
            blockingErrors.push({
              code: 'CROSS_DOCUMENT_CONSISTENCY',
              message: `Line ${idx + 1} pkg ${pi + 1}: shippingMarks required (must match physical boxes)`,
              field: `lines[${idx}].packages[${pi}].shippingMarks`,
              severity: 'BLOCKING',
              regulation: '19 CFR 141.86(a)(3); Cross-doc consistency (CI ↔ PL)',
            });
          }
        });
      }
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

  // 16. BUNDLE_NOT_ACCEPTED_DESTINATION — Some countries/banks/transport modes require separate CI+PL (AMBER)
  if (data.documentType === 'BUNDLE_CIPL') {
    const requiresSeparate = [
      'BR', 'AR', 'CL', 'PE', 'CO',  // LATAM
      'CN', 'IN', 'ID', 'VN', 'TH',  // Asia - often require separate docs
      'SA', 'AE', 'EG', 'NG', 'ZA',  // Middle East/Africa
    ];
    const isMaritimeLCL = data.carrierSpecific.fedex?.customsProcedureCode?.startsWith('LCL') ||
                          data.carrierSpecific.ups?.additionalCosts?.some(c => c.type === 'FREIGHT' && c.description.toLowerCase().includes('ocean')) ||
                          data.carrierSpecific.dhl?.typeOfExport === 'TEMPORARY';
    // Note: LC/bank involvement typically indicated by payment terms or separate flag
    // For now, warn on known countries + maritime LCL
    if (requiresSeparate.includes(data.destinationCountryCode) || isMaritimeLCL) {
      warnings.push({
        code: 'BUNDLE_NOT_ACCEPTED_DESTINATION',
        message: `Destination ${data.destinationCountryCode} or transport mode may require separate CI and PL (not a combined CIPL). Verify with broker/bank.`,
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
