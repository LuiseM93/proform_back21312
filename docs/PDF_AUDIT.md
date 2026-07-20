# PDF Audit — Binary Checklist vs Spec (FASE 1)

Estado: ✅ renderiza | ❌ falta | ⚠️ depende de form

## CiFedex
- [x] AWB 12 dígitos
- [x] Reason for Export (enum)
- [x] Duty/Tax Billing
- [x] CPC (EU/UK)
- [x] Marks & Numbers por línea (packages[].shippingMarks)
- [x] 2 páginas (M-1054 format)
- [x] ETD badge
- [ ] Dimensiones de paquete en tabla de líneas (19 CFR 141.86) — GAP MENOR (G4)

## CiUps
- [x] partiesRelationship (RELATED/NOT_RELATED)
- [x] termsOfSale (IncotermData)
- [x] additionalCosts[]
- [x] USMCA Certification pág 2 (rol/criterio/firma/fecha)
- [x] USMCA goods[] por producto (PDF itera; form lo deja [] → G2/F4)
- [x] Invoice Number (1Z+16)
- [ ] Dimensiones de paquete en tabla de líneas — GAP MENOR (G4)

## CiDhl
- [x] AWB 10 dígitos
- [x] typeOfExport (enum)
- [x] IOR (importerOfRecord)
- [x] termsOfTrade (IncotermData)
- [x] export/import license
- [x] mydhlGenerated badge
- [x] Marks & Numbers por línea
- [ ] Dimensiones de paquete en tabla de líneas — GAP MENOR (G4)

## PackingList
- [x] plNumber/plDate/CI ref/AWB ref
- [x] packages[] con shippingMarks
- [x] LANDSCAPE
- [x] SIN precios
- [x] net/gross weight por bulto

## Bundle
- [x] documentNumber/CI ref/PL ref
- [x] tabla combinada (financiero + físico)
- [x] LANDSCAPE
- [x] dual declarations

## Proforma
- [x] "NOT A COMMERCIAL INVOICE" notice
- [x] validityDays
- [x] parties + lines + estimated totals
- [x] signature block

## EDI JSON (spec §9) — ❌ MÓDULO NO EXISTE
- [ ] FedEx ETD JSON
- [ ] UPS Paperless JSON
- [ ] DHL MyDHL+ JSON
- [ ] generateEDI(shipment) dispatcher

## GAPs a cerrar
| # | Doc | Campo | Fase |
|---|-----|-------|------|
| G2 | CiUps USMCA | goods[] desde form (hoy []) | F4 |
| G3 | EDI | Módulo generateEDI (3 carriers) | F3 |
| G4 | CiFedex/CiUps/CiDhl | Dimensiones en tabla líneas | F3 (menor) |
