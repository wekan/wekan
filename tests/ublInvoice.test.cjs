'use strict';

// models/lib/ublInvoice.js: an invoice as a Peppol BIS Billing 3.0 UBL document.
// Run: node tests/ublInvoice.test.cjs

const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { ublInvoiceXml } = require('../models/lib/ublInvoice.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const profile = {
  issuerName: 'Firma Oy', issuerAddress: 'Katu 1\n00100 Helsinki', issuerCountry: 'FI', businessId: '1234567-8',
  vatId: 'FI12345678', email: 'laskut@firma.example',
  paymentMethods: [{ type: 'sepa', name: 'Firma Oy', iban: 'FI2112345600000785', bic: 'NDEAFIHH' }],
};
const invoice = {
  number: 'INV-2027-0001', issueDate: '2027-04-30', dueDate: '2027-05-14', currency: 'EUR',
  customer: 'Asiakas & Co <Ab>\nTie 2\n33100 Tampere', customerCountry: 'FI', customerVatId: 'FI87654321', reference: 'PO-77',
  lines: [{ title: 'Design "phase 1"', hours: 6, rateMinor: 12000, amountMinor: 72000 }, { title: 'Build', hours: 2, rateMinor: 8000, amountMinor: 16000 }],
  netMinor: 88000, vatPercent: 25.5, vatMinor: 22440, totalMinor: 110440, paidMinor: 10440, paymentReference: 'RF18539007547034',
};

function parse(text) {
  const doc = new JSDOM(text, { contentType: 'text/xml' }).window.document;
  assert.equal(doc.getElementsByTagName('parsererror').length, 0, 'well-formed XML');
  return doc;
}
const value = (doc, name) => doc.getElementsByTagName(name)[0] && doc.getElementsByTagName(name)[0].textContent;

test('an invoice: Peppol BIS 3.0 ids, type 380, the parties, totals and lines', () => {
  const doc = parse(ublInvoiceXml(invoice, profile));
  assert.equal(doc.documentElement.localName, 'Invoice');
  assert.equal(value(doc, 'cbc:CustomizationID'), 'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0');
  assert.equal(value(doc, 'cbc:InvoiceTypeCode'), '380');
  assert.equal(value(doc, 'cbc:BuyerReference'), 'PO-77');
  assert.equal(value(doc, 'cbc:TaxableAmount'), '880.00');
  assert.equal(value(doc, 'cbc:TaxInclusiveAmount'), '1104.40');
  assert.equal(value(doc, 'cbc:PayableAmount'), '1000.00', 'less what is already paid');
  assert.equal(value(doc, 'cbc:PaymentID'), 'RF18539007547034');
  assert.equal(doc.getElementsByTagName('cac:InvoiceLine').length, 2);
  assert.equal(doc.getElementsByTagName('cbc:InvoicedQuantity')[0].getAttribute('unitCode'), 'HUR');
  assert.equal(doc.getElementsByTagName('cac:TaxCategory')[0].getElementsByTagName('cbc:ID')[0].textContent, 'S');
});

test('negative: text is escaped, never markup', () => {
  const text = ublInvoiceXml(invoice, profile);
  assert.match(text, /Asiakas &amp; Co &lt;Ab&gt;/);
  assert.match(text, /Design &quot;phase 1&quot;/);
  assert.doesNotMatch(text, /<Ab>/);
  parse(ublInvoiceXml({ ...invoice, notes: 'bad \u0001 control' }, profile));
});

test('a credit note is a CreditNote (381) referring to the invoice; reverse charge is AE at 0 %', () => {
  const doc = parse(ublInvoiceXml({ ...invoice, kind: 'credit', number: 'CRN-2027-0002', creditOfNumber: 'INV-2027-0001',
    reverseCharge: true, vatPercent: 0, vatMinor: 0, totalMinor: 88000, paidMinor: 0 }, profile));
  assert.equal(doc.documentElement.localName, 'CreditNote');
  assert.equal(value(doc, 'cbc:CreditNoteTypeCode'), '381');
  assert.equal(doc.getElementsByTagName('cac:InvoiceDocumentReference')[0].textContent, 'INV-2027-0001');
  assert.equal(doc.getElementsByTagName('cac:CreditNoteLine').length, 2);
  assert.equal(value(doc, 'cbc:TaxExemptionReasonCode'), 'VATEX-EU-AE');
});

test('a fee or an expense line is one unit (C62) at its amount', () => {
  const xml = ublInvoiceXml({ ...invoice, lines: [{ kind: 'fee', title: 'Launch', amountMinor: 50000 }], netMinor: 50000, totalMinor: 50000, vatMinor: 0 }, profile);
  assert.match(xml, /<cbc:InvoicedQuantity unitCode="C62">1<\/cbc:InvoicedQuantity>/);
  assert.match(xml, /<cbc:PriceAmount currencyID="EUR">500.00<\/cbc:PriceAmount>/);
  assert.doesNotMatch(xml, /undefined|NaN/);
});

console.log(`\nublInvoice: ${passed} tests passed`);
