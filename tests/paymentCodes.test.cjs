'use strict';

// models/lib/paymentCodes.js against the published examples of each standard.
// Run: node tests/paymentCodes.test.cjs

const assert = require('node:assert/strict');
const P = require('../models/lib/paymentCodes.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('IBAN and BIC: valid ones pass, a changed digit does not', () => {
  assert.equal(P.isValidIban('GB82 WEST 1234 5698 7654 32'), true);
  assert.equal(P.isValidIban('FI2112345600000785'), true);
  assert.equal(P.isValidIban('FI2112345600000786'), false);
  assert.equal(P.isValidIban('not an iban'), false);
  assert.equal(P.isValidBic('NDEAFIHH'), true);
  assert.equal(P.isValidBic('NDEAFIHHXXX'), true);
  assert.equal(P.isValidBic('NDEA'), false);
  assert.equal(P.formatIban('fi2112345600000785'), 'FI21 1234 5600 0007 85');
});

test('Finnish reference number: the 7-3-1 check digit (Finanssiala)', () => {
  assert.equal(P.finnishReference('123'), '1232');
  assert.equal(P.isValidFinnishReference('1232'), true);
  assert.equal(P.isValidFinnishReference('1233'), false);
  assert.equal(P.isValidFinnishReference('868516259619897'), true);
  assert.throws(() => P.finnishReference('12'), /3 to 19 digits/);
  assert.equal(P.formatReference('868516259619897'), '86851 62596 19897');
});

test('RF creditor reference: the ISO 11649 example', () => {
  assert.equal(P.rfReference('539007547034'), 'RF18539007547034');
  assert.equal(P.isValidRfReference('RF18 5390 0754 7034'), true);
  assert.equal(P.isValidRfReference('RF19539007547034'), false);
  assert.equal(P.formatReference('RF18539007547034'), 'RF18 5390 0754 7034');
});

test('Finnish bank barcode, version 4: the Finanssiala example', () => {
  assert.equal(P.finnishBarcode({ iban: 'FI79 4405 2020 0360 82', amountMinor: 488315, reference: '86851 62596 19897', dueDate: '2010-06-12' }),
    '479440520200360820048831500000000868516259619897100612');
});

test('Finnish bank barcode, version 5 with RF; no due date and a too-large amount are zeros', () => {
  const code = P.finnishBarcode({ iban: 'FI7944052020036082', amountMinor: 100000000, reference: 'RF18539007547034' });
  assert.equal(code.length, 54);
  assert.equal(code, `57944052020036082${'00000000'}18${'000000000539007547034'}000000`);
  assert.throws(() => P.finnishBarcode({ iban: 'GB82WEST12345698765432', amountMinor: 1, reference: '1232' }), /Finnish IBAN/);
  assert.throws(() => P.finnishBarcode({ iban: 'FI7944052020036082', amountMinor: 1, reference: '1233' }), /reference/);
});

test('Code 128 C: start, pairs, checksum, stop', () => {
  assert.deepEqual(P.code128CValues('12345678'), [105, 12, 34, 56, 78, 47, 106]);
  const modules = P.code128CModules('12', 0);
  assert.match(modules, /^11010011100/, 'start C');
  assert.match(modules, /1100011101011$/, 'stop');
  assert.equal(P.code128CModules('1234', 10).length, 10 + 11 * 4 + 13 + 10);
  assert.throws(() => P.code128CValues('123'), /even number/);
});

test('EPC QR (GiroCode): the fields in order, RF or text, at most 331 bytes', () => {
  const payload = P.epcQrPayload({ name: 'Red Cross of Belgium', iban: 'BE72000000001616', bic: 'BPOTBEB1', amountMinor: 100, text: 'Urgency fund' });
  assert.equal(payload, 'BCD\n002\n1\nSCT\nBPOTBEB1\nRed Cross of Belgium\nBE72000000001616\nEUR1.00\n\n\nUrgency fund');
  const rf = P.epcQrPayload({ name: 'Firma Oy', iban: 'FI2112345600000785', amountMinor: 12345, reference: 'RF18539007547034' });
  assert.equal(rf.split('\n')[9], 'RF18539007547034');
  assert.throws(() => P.epcQrPayload({ name: 'X', iban: 'FI2112345600000785', reference: '1232' }), /RF reference/);
  assert.throws(() => P.epcQrPayload({ name: 'X', iban: 'FI2112345600000786' }), /IBAN/);
  assert.throws(() => P.epcQrPayload({ name: 'X'.repeat(71), iban: 'FI2112345600000785' }), /70/);
});

test('Swiss QR-bill: SPC 0200, SCOR with an IBAN, QRR only with a QR-IBAN', () => {
  const creditor = { name: 'Robert Schneider AG', street: 'Rue du Lac', building: '1268', postcode: '2501', town: 'Biel', country: 'CH' };
  const p = P.swissQrPayload({ iban: 'CH4431999123000889012', creditor, amountMinor: 199995, currency: 'CHF',
    reference: '210000000003139471430009017', message: 'Order 2027' }).split('\r\n');
  assert.deepEqual(p.slice(0, 4), ['SPC', '0200', '1', 'CH4431999123000889012']);
  assert.deepEqual(p.slice(4, 11), ['S', 'Robert Schneider AG', 'Rue du Lac', '1268', '2501', 'Biel', 'CH']);
  assert.equal(p[18], '1999.95');
  assert.equal(p[19], 'CHF');
  assert.deepEqual(p.slice(27, 29), ['QRR', '210000000003139471430009017']);
  assert.equal(p[30], 'EPD');
  const scor = P.swissQrPayload({ iban: 'CH5604835012345678009', creditor, reference: 'RF18539007547034', currency: 'EUR' }).split('\r\n');
  assert.equal(scor[27], 'SCOR');
  assert.throws(() => P.swissQrPayload({ iban: 'CH4431999123000889012', creditor }), /QR reference/);
  assert.throws(() => P.swissQrPayload({ iban: 'FI2112345600000785', creditor }), /Swiss/);
});

test('Pix BR Code: the Banco Central do Brasil example CRC', () => {
  const body = '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***6304';
  assert.equal(P.crc16(body), '1D3D');
  assert.equal(P.pixPayload({ key: '123e4567-e12b-12d1-a456-426655440000', name: 'Fulano de Tal', city: 'BRASILIA' }), `${body}1D3D`);
  const withAmount = P.pixPayload({ key: 'a@b.br', name: 'Loja São João', city: 'São Paulo', amountMinor: 1050, txid: 'INV-2027-0001' });
  assert.match(withAmount, /540510\.50/);
  assert.match(withAmount, /5913Loja Sao Joao/, 'accents dropped to ASCII, as BR Code requires');
  assert.match(withAmount, /6304[0-9A-F]{4}$/);
});

test('Swish, UPI, Bitcoin, PayPal.me and payment links', () => {
  assert.equal(P.swishQrPayload({ payee: '123 456 78 90', amountMinor: 50000, message: 'INV-1' }), 'C1234567890;500.00;INV-1;0');
  assert.throws(() => P.swishQrPayload({ payee: '12', amountMinor: 1 }), /6 to 15/);
  assert.equal(P.upiUri({ vpa: 'shop@okbank', name: 'My Shop', amountMinor: 150000, note: 'INV 1' }),
    'upi://pay?pa=shop%40okbank&pn=My%20Shop&am=1500.00&cu=INR&tn=INV%201');
  assert.equal(P.bitcoinUri({ address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', amountMinor: 5000, currency: 'EUR', message: 'INV 1' }),
    'bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq?message=INV%201', 'no bitcoin amount for a EUR invoice');
  assert.equal(P.paypalMeUrl({ user: 'wekan', amountMinor: 1234, currency: 'EUR' }), 'https://paypal.me/wekan/12.34EUR');
  assert.equal(P.paymentLink('https://pay.example.com/p?amt={amount}&ref={reference}', { amountMinor: 1234, reference: 'RF18 5390' }),
    'https://pay.example.com/p?amt=12.34&ref=RF185390');
  assert.throws(() => P.paymentLink('javascript:alert(1)'), /https/);
  assert.throws(() => P.paymentLink('http://pay.example.com/{amount}'), /https/);
});

test('payment methods: validated on the way in; instructions say why one does not fit', () => {
  const sepa = P.normalizePaymentMethod({ type: 'sepa', name: 'Firma Oy', iban: 'fi21 1234 5600 0007 85', bic: 'nordfihh' });
  assert.equal(sepa.iban, 'FI2112345600000785');
  assert.throws(() => P.normalizePaymentMethod({ type: 'sepa', name: 'x', iban: 'FI2112345600000786' }), /IBAN/);
  assert.throws(() => P.normalizePaymentMethod({ type: 'wire-to-me' }), /Unknown payment method/);
  assert.throws(() => P.normalizePaymentMethod({ type: 'cash', details: 'x', evil: 1 }), /Unsupported/);
  assert.throws(() => P.normalizePaymentMethod({ type: 'fi-bank', name: 'x', iban: 'GB82WEST12345698765432' }), /Finnish IBAN/);
  const invoice = { number: 'INV-2027-0001', currency: 'EUR', amountDueMinor: 12345, paymentReference: 'RF18539007547034', dueDate: '2027-05-14' };
  assert.match(P.paymentInstructions(sepa, invoice).qr, /^BCD\n002/);
  const fi = P.paymentInstructions(P.normalizePaymentMethod({ type: 'fi-bank', name: 'Firma Oy', iban: 'FI7944052020036082' }), invoice);
  assert.equal(fi.barcode.length, 54);
  const swish = P.paymentInstructions(P.normalizePaymentMethod({ type: 'swish', payee: '1234567890' }), invoice);
  assert.equal(swish.error, 'Swish is in SEK');
  assert.deepEqual(P.paymentInstructions({ type: 'cash', details: 'At the office' }, invoice).lines, ['At the office']);
});

console.log(`\npaymentCodes: ${passed} tests passed`);
