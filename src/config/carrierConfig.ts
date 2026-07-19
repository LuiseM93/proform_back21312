// ============================================================================
// carrierConfig — Loader + helpers versionado
// ProformaFlow · FASE 4
// ============================================================================
import configData from '@/config/carrier-config.v2026.07.json';
import type { Carrier, CountryGroup, DocumentType, PaperSize } from '@/types/shipment';

export interface CarrierConfigEntry {
  awbFormat: string;
  awbLength: number;
  descriptionRequired: boolean;
  descriptionMinWords: number;
  paperSizeByCountry: Record<CountryGroup, PaperSize>;
  partiesRelationshipRequired?: boolean;
  iorRequired?: boolean;
  usmcaSupported?: boolean;
  mydhlSupported?: boolean;
  etdSupported?: boolean;
  regulatoryChanges: { id: string; activeFrom: string; description: string }[];
}

export interface CarrierConfigFile {
  version: string;
  effectiveDate: string;
  carriers: Record<Carrier, CarrierConfigEntry>;
  blacklist: string[];
  restrictedWords: string[];
  paperSizeByDocumentType: Record<DocumentType, PaperSize>;
}

export const carrierConfig: CarrierConfigFile = configData as CarrierConfigFile;

export function getCarrierConfig(carrier: Carrier): CarrierConfigEntry {
  return carrierConfig.carriers[carrier];
}

export function getPaperSize(carrier: Carrier, countryGroup: CountryGroup, docType: DocumentType): PaperSize {
  const carrierEntry = getCarrierConfig(carrier);
  const byDoc = carrierConfig.paperSizeByDocumentType[docType];
  if (byDoc === 'LETTER' || byDoc === 'A4') return byDoc;
  return carrierEntry.paperSizeByCountry[countryGroup] || 'A4';
}

export function isRegulatoryChangeActive(changeId: string): boolean {
  const now = new Date();
  for (const carrier of Object.values(carrierConfig.carriers)) {
    const change = carrier.regulatoryChanges.find((c) => c.id === changeId);
    if (change) {
      return new Date(change.activeFrom) <= now;
    }
  }
  return false;
}

export function getBlacklist(): string[] {
  return carrierConfig.blacklist;
}

export function getRestrictedWords(): string[] {
  return carrierConfig.restrictedWords;
}

export function validateDescriptionAgainstConfig(description: string, carrier: Carrier): string[] {
  const config = getCarrierConfig(carrier);
  const errors: string[] = [];
  if (config.descriptionRequired && description.trim().length === 0) {
    errors.push('Description is required');
  }
  const words = description.trim().split(/\s+/).filter(Boolean);
  if (config.descriptionMinWords && words.length < config.descriptionMinWords) {
    errors.push(`Description must have at least ${config.descriptionMinWords} words (current: ${words.length})`);
  }
  const lower = description.toLowerCase();
  for (const word of getBlacklist()) {
    if (lower.includes(word)) {
      errors.push(`Blacklisted term detected: "${word}"`);
    }
  }
  return errors;
}
