'use strict';

// An invoice as a UBL 2.1 e-invoice, Peppol BIS Billing 3.0 (EN 16931): the
// format public bodies and many companies in Europe receive invoices in, and
// that e-invoicing operators accept. A credit note is a UBL CreditNote (381).
// Pure: tests/ublInvoice.test.cjs. docs/Features/Billing/Billing.md.

function xml(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
    // Characters XML 1.0 does not allow.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, '');
}

const { minorToText } = require('./currencies');

function tag(name, value, attrs = '') {
  if (value === null || value === undefined || value === '') return '';
  return `<${name}${attrs}>${xml(value)}</${name}>`;
}

// The VAT category of EN 16931: S standard rate, Z zero rate, AE reverse charge.
function taxCategory(invoice) {
  if (invoice.reverseCharge) return 'AE';
  return invoice.vatPercent > 0 ? 'S' : 'Z';
}

function party(role, { name, address, country, vatId, businessId, email }) {
  const lines = String(address || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return `<cac:${role}><cac:Party>`
    + (email ? `<cbc:EndpointID schemeID="EM">${xml(email)}</cbc:EndpointID>` : '')
    + `<cac:PartyName>${tag('cbc:Name', name || '-')}</cac:PartyName>`
    + `<cac:PostalAddress>${tag('cbc:StreetName', lines[0])}${tag('cbc:CityName', lines[lines.length - 1] && lines.length > 1 ? lines[lines.length - 1] : '')}`
    + `<cac:Country>${tag('cbc:IdentificationCode', country || 'ZZ')}</cac:Country></cac:PostalAddress>`
    + (vatId ? `<cac:PartyTaxScheme>${tag('cbc:CompanyID', vatId)}<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : '')
    + `<cac:PartyLegalEntity>${tag('cbc:RegistrationName', name || '-')}${tag('cbc:CompanyID', businessId)}</cac:PartyLegalEntity>`
    + `</cac:Party></cac:${role}>`;
}

/**
 * @param {Object} invoice  number, kind, issueDate, dueDate, currency, customer, customerCountry, customerVatId,
 *                          reference, notes, lines [{ title, hours, rateMinor, amountMinor }], netMinor, vatPercent,
 *                          vatMinor, totalMinor, paidMinor, paymentReference, creditOfNumber, reverseCharge
 * @param {Object} profile  issuerName, issuerAddress, issuerCountry, businessId, vatId, email, paymentMethods
 */
// A product line whose quantity times its unit price is its amount.
function productUnit(line) {
  return line.kind === 'product' && Number.isInteger(line.quantity) && line.quantity > 0
    && Number.isInteger(line.unitMinor) && line.unitMinor * line.quantity === line.amountMinor;
}

function ublInvoiceXml(invoice, profile) {
  const credit = invoice.kind === 'credit';
  const root = credit ? 'CreditNote' : 'Invoice';
  const lineTag = credit ? 'CreditNoteLine' : 'InvoiceLine';
  const qtyTag = credit ? 'cbc:CreditedQuantity' : 'cbc:InvoicedQuantity';
  const cur = invoice.currency;
  const money = (name, minor) => `<cbc:${name} currencyID="${xml(cur)}">${minorToText(minor, cur)}</cbc:${name}>`;
  const category = taxCategory(invoice);
  const percent = category === 'S' ? invoice.vatPercent : 0;
  const customerLines = String(invoice.customer || '').split(/\r?\n/);
  const sepa = (profile.paymentMethods || []).find(m => ['sepa', 'fi-bank', 'swiss-qr'].includes(m.type) && m.iban);
  const parts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<${root} xmlns="urn:oasis:names:specification:ubl:schema:xsd:${root}-2"`
      + ' xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"'
      + ' xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">',
    '<cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>',
    '<cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>',
    tag('cbc:ID', invoice.number),
    tag('cbc:IssueDate', invoice.issueDate),
    credit ? '' : tag('cbc:DueDate', invoice.dueDate),
    tag(credit ? 'cbc:CreditNoteTypeCode' : 'cbc:InvoiceTypeCode', credit ? '381' : '380'),
    tag('cbc:Note', invoice.notes),
    invoice.reverseCharge ? tag('cbc:Note', 'Reverse charge') : '',
    tag('cbc:DocumentCurrencyCode', cur),
    tag('cbc:BuyerReference', invoice.reference || invoice.number),
    credit && invoice.creditOfNumber ? `<cac:BillingReference><cac:InvoiceDocumentReference>${tag('cbc:ID', invoice.creditOfNumber)}</cac:InvoiceDocumentReference></cac:BillingReference>` : '',
    party('AccountingSupplierParty', { name: profile.issuerName, address: profile.issuerAddress, country: profile.issuerCountry,
      vatId: profile.vatId, businessId: profile.businessId, email: profile.email }),
    party('AccountingCustomerParty', { name: customerLines[0], address: customerLines.slice(1).join('\n'),
      country: invoice.customerCountry, vatId: invoice.customerVatId }),
    sepa ? `<cac:PaymentMeans><cbc:PaymentMeansCode>58</cbc:PaymentMeansCode>${tag('cbc:PaymentID', invoice.paymentReference || invoice.number)}`
      + `<cac:PayeeFinancialAccount>${tag('cbc:ID', sepa.iban)}${tag('cbc:Name', sepa.name)}`
      + (sepa.bic ? `<cac:FinancialInstitutionBranch>${tag('cbc:ID', sepa.bic)}</cac:FinancialInstitutionBranch>` : '')
      + '</cac:PayeeFinancialAccount></cac:PaymentMeans>' : '',
    `<cac:TaxTotal>${money('TaxAmount', invoice.vatMinor || 0)}<cac:TaxSubtotal>${money('TaxableAmount', invoice.netMinor)}`
      + `${money('TaxAmount', invoice.vatMinor || 0)}<cac:TaxCategory><cbc:ID>${category}</cbc:ID><cbc:Percent>${percent}</cbc:Percent>`
      + (category === 'AE' ? '<cbc:TaxExemptionReasonCode>VATEX-EU-AE</cbc:TaxExemptionReasonCode>' : '')
      + '<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal>',
    `<cac:LegalMonetaryTotal>${money('LineExtensionAmount', invoice.netMinor)}${money('TaxExclusiveAmount', invoice.netMinor)}`
      + `${money('TaxInclusiveAmount', invoice.totalMinor)}${money('PrepaidAmount', invoice.paidMinor || 0)}`
      + `${money('PayableAmount', Math.max((invoice.totalMinor || 0) - (invoice.paidMinor || 0), 0))}</cac:LegalMonetaryTotal>`,
    ...(invoice.lines || []).map((line, i) => `<cac:${lineTag}>${tag('cbc:ID', i + 1)}`
      // Hours (HUR) at the hourly rate; a product (Board View / Shop) is its
      // quantity of pieces (H87) at its unit price; a fee or an expense - and a
      // product whose net does not divide into a whole unit price - is one
      // unit (C62) at its amount (models/lib/billing.js INVOICE_LINE_KINDS).
      + (typeof line.rateMinor === 'number' ? `<${qtyTag} unitCode="HUR">${line.hours}</${qtyTag}>`
        : (productUnit(line) ? `<${qtyTag} unitCode="H87">${line.quantity}</${qtyTag}>` : `<${qtyTag} unitCode="C62">1</${qtyTag}>`))
      + money('LineExtensionAmount', line.amountMinor)
      + `<cac:Item>${tag('cbc:Name', line.title || '-')}<cac:ClassifiedTaxCategory><cbc:ID>${category}</cbc:ID><cbc:Percent>${percent}</cbc:Percent>`
      + '<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item>'
      + `<cac:Price>${money('PriceAmount', typeof line.rateMinor === 'number' ? line.rateMinor : (productUnit(line) ? line.unitMinor : line.amountMinor))}</cac:Price></cac:${lineTag}>`),
    `</${root}>`,
  ];
  return parts.filter(Boolean).join('\n');
}

module.exports = { ublInvoiceXml, xmlEscape: xml };
