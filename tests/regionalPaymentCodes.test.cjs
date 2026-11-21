'use strict';

// models/lib/currencies.js and models/lib/regionalPaymentCodes.js.
// Run: node tests/regionalPaymentCodes.test.cjs

const assert = require('node:assert/strict');
const C = require('../models/lib/currencies.js');
const R = require('../models/lib/regionalPaymentCodes.js');
const { crc16 } = require('../models/lib/paymentCodes.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// An EMV payload ends with 6304 and the CRC of everything before it.
function emvValid(payload) {
  return /6304[0-9A-F]{4}$/.test(payload) && crc16(payload.slice(0, -4)) === payload.slice(-4);
}
// The fields of an EMV payload, id -> value.
function emvFields(payload) {
  const out = {};
  for (let i = 0; i < payload.length;) {
    const id = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    out[id] = payload.slice(i + 4, i + 4 + len);
    i += 4 + len;
  }
  return out;
}

test('ISO 4217 minor units: 2 by default, 0 for JPY, 3 for KWD', () => {
  assert.equal(C.minorUnits('EUR'), 2);
  assert.equal(C.minorUnits('JPY'), 0);
  assert.equal(C.minorUnits('vnd'), 0);
  assert.equal(C.minorUnits('KWD'), 3);
  assert.equal(C.toMinorUnits(1000, 'JPY'), 1000, '1 000 yen is 1000, not 100000');
  assert.equal(C.toMinorUnits(1.5, 'KWD'), 1500);
  assert.equal(C.toMinorUnits(12.5, 'EUR'), 1250);
  assert.equal(C.minorToText(1000, 'JPY'), '1000');
  assert.equal(C.minorToText(1500, 'KWD'), '1.500');
  assert.equal(C.minorToText(5, 'EUR'), '0.05');
  assert.equal(C.fromMinorUnits(1500, 'KWD'), 1.5);
});

test('PromptPay: a mobile number to 0066..., THB 764, a valid CRC', () => {
  const p = R.promptPayPayload({ target: '081-234-5678' });
  assert.equal(p.slice(0, 12), '000201010211', 'static');
  assert.deepEqual(emvFields(emvFields(p)['29']), { '00': 'A000000677010111', '01': '0066812345678' }, 'mobile 0066 + 812345678');
  const f = emvFields(p);
  assert.equal(f['53'], '764');
  assert.equal(f['58'], 'TH');
  assert.ok(emvValid(p));
  const withAmount = R.promptPayPayload({ target: '1234567890123', amountMinor: 50025 });
  assert.equal(emvFields(withAmount)['01'], '12', 'dynamic with an amount');
  assert.equal(emvFields(withAmount)['54'], '500.25');
  assert.equal(emvFields(emvFields(withAmount)['29'])['02'], '1234567890123', 'a national ID');
  assert.throws(() => R.promptPayPayload({ target: '12' }), /PromptPay target/);
});

test('PayNow: mobile or UEN, SGD 702, with the bill reference', () => {
  const p = R.payNowPayload({ proxy: '91234567', name: 'Shop Pte Ltd', amountMinor: 1000, reference: 'INV-1' });
  const f = emvFields(p);
  assert.equal(emvFields(f['26'])['00'], 'SG.PAYNOW');
  assert.equal(emvFields(f['26'])['01'], '0');
  assert.equal(emvFields(f['26'])['02'], '+6591234567');
  assert.equal(f['53'], '702');
  assert.equal(f['54'], '10.00');
  assert.equal(emvFields(f['62'])['01'], 'INV-1');
  assert.ok(emvValid(p));
  assert.equal(emvFields(emvFields(R.payNowPayload({ proxy: '201234567A', name: 'X' }))['26'])['01'], '2', 'a UEN');
});

test('VietQR: bank BIN and account, whole dong', () => {
  const p = R.vietQrPayload({ bin: '970436', account: '0011001932418', amountMinor: 150000, message: 'INV 1' });
  const f = emvFields(p);
  const merchant = emvFields(f['38']);
  assert.equal(merchant['00'], 'A000000727');
  assert.deepEqual(emvFields(merchant['01']), { '00': '970436', '01': '0011001932418' });
  assert.equal(merchant['02'], 'QRIBFTTA');
  assert.equal(f['54'], '150000', 'VND has no decimals');
  assert.ok(emvValid(p));
});

test('Hong Kong FPS: FPS ID, mobile or email, HKD 344', () => {
  assert.equal(emvFields(emvFields(R.fpsPayload({ proxy: '1234567' }))['26'])['02'], '1234567');
  assert.equal(emvFields(emvFields(R.fpsPayload({ proxy: '+852 91234567' }))['26'])['03'], '+852-91234567');
  const p = R.fpsPayload({ proxy: 'pay@shop.hk', amountMinor: 2000 });
  assert.equal(emvFields(emvFields(p)['26'])['04'], 'pay@shop.hk');
  assert.equal(emvFields(p)['53'], '344');
  assert.ok(emvValid(p));
});

test('QR Platba (SPAYD): the fields, and * escaped', () => {
  assert.equal(R.spaydPayload({ iban: 'CZ65 0800 0000 1920 0014 5399', amountMinor: 45000, message: 'Faktura *1*', variableSymbol: '123456' }),
    'SPD*1.0*ACC:CZ6508000000192000145399*AM:450.00*CC:CZK*MSG:Faktura %2A1%2A*X-VS:123456');
  assert.throws(() => R.spaydPayload({ iban: 'CZ6508000000192000145398' }), /IBAN/);
});

test('Polish ZBP code: NIP|PL|account|grosze|name|title|||', () => {
  assert.equal(R.zbpPayload({ nip: '526-025-02-74', account: 'PL61 1090 1014 0000 0712 1981 2874', amountMinor: 12345, name: 'Firma Sp. z o.o.', title: 'FV 1/2027' }),
    '5260250274|PL|61109010140000071219812874|012345|Firma Sp. z o.o.|FV 1/2027|||');
  assert.throws(() => R.zbpPayload({ account: '61109010140000071219812874', amountMinor: 1000000, name: 'X' }), /9999.99/);
});

test('MNB QR (Hungary): 17 lines, whole forints, a validity time', () => {
  const lines = R.mnbPayload({ bic: 'GIBAHUHB', name: 'Kft', iban: 'HU42117730161111101800000000', amountMinor: 1234500, dueDate: '2027-05-14' }).split('\n');
  assert.equal(lines.length, 17);
  assert.deepEqual(lines.slice(0, 8), ['HCT', '001', '1', 'GIBAHUHB', 'Kft', 'HU42117730161111101800000000', 'HUF12345', '20270514235959+1']);
  assert.throws(() => R.mnbPayload({ bic: 'GIBAHUHB', name: 'x', iban: 'HU42117730161111101800000000' }), /due date/);
});

test('NBS IPS QR (Serbia): K:PR|V:01|C:1|R:..|N:..|I:RSD..,..', () => {
  assert.equal(R.ipsPayload({ account: '845-0000040484987-83', name: 'JP EPS BEOGRAD', amountMinor: 355300, purpose: 'Racun 1' }),
    'K:PR|V:01|C:1|R:845000004048498783|N:JP EPS BEOGRAD|I:RSD3553,00|SF:289|S:Racun 1');
  assert.match(R.ipsPayload({ account: '160-5-11', name: 'X' }), /R:160000000000000511\|/, 'the short form, padded');
});

test('references: Belgian mod 97, Norwegian KID, Swedish OCR, Danish +71', () => {
  assert.equal(R.belgianStructuredReference('1234567890'), '+++123/4567/89002+++');
  assert.equal(R.isValidBelgianStructuredReference('+++123/4567/89002+++'), true);
  assert.equal(R.isValidBelgianStructuredReference('+++123/4567/89003+++'), false);
  assert.equal(R.belgianStructuredReference('97'), '+++000/0000/09797+++', 'a remainder of 0 is written 97');
  assert.equal(R.norwegianKid('123456789'), '1234567897');
  assert.equal(R.isValidLuhn('1234567897'), true);
  const ocr = R.swedishOcr('12345');
  assert.equal(ocr.slice(0, 6), '123457', 'the length digit: 7 digits');
  assert.equal(R.isValidLuhn(ocr), true);
  assert.match(R.danishFik({ creditor: '12345678', base: '42' }), /^\+71<0{12}42\d\+12345678<$/);
  assert.throws(() => R.danishFik({ creditor: '123', base: '1' }), /8 digits/);
});

test('Ethereum and Litecoin URIs: an amount only in their own currency', () => {
  const a = '0x' + 'ab'.repeat(20);
  assert.equal(R.ethereumUri({ address: a, amountMinor: 150000000, currency: 'ETH' }), `ethereum:${a}?value=1500000000000000000`);
  assert.equal(R.ethereumUri({ address: a, amountMinor: 100, currency: 'EUR' }), `ethereum:${a}`);
  assert.throws(() => R.ethereumUri({ address: '0x12' }), /Ethereum/);
  assert.equal(R.litecoinUri({ address: 'ltc1qg42tkwuuxefutzxezdkdel39gfstuap288mfea', amountMinor: 50000000, currency: 'LTC' }),
    'litecoin:ltc1qg42tkwuuxefutzxezdkdel39gfstuap288mfea?amount=0.50000000');
});

test('billing in the currency\'s own decimals: JPY has none, KWD three', () => {
  const B = require('../models/lib/billing.js');
  const jpy = B.normalizeRate({ hourlyRate: 5000, currency: 'JPY' });
  assert.equal(jpy.hourlyRateMinor, 5000, '5 000 yen is 5000, not 500000');
  assert.equal(B.formatMoney(5000, 'JPY', 'en-US'), '¥5,000');
  assert.equal(B.normalizeRate({ hourlyRate: 12.345, currency: 'KWD' }).hourlyRateMinor, 12345);
  assert.match(B.formatMoney(12345, 'KWD', 'en-US'), /^KWD[\s\u00a0]12\.345$/);
  assert.equal(B.normalizePayment({ date: '2027-05-01', amount: 1000 }, 'JPY').amountMinor, 1000);
  assert.match(B.invoiceCsv({ number: 'INV-1', currency: 'JPY', netMinor: 5000, vatMinor: 500, totalMinor: 5500, lines: [] }), /"total","","","","","","5500","JPY"/);
});

test('references by country: Belgian, Norwegian KID, Swedish OCR', () => {
  const B = require('../models/lib/billing.js');
  assert.equal(R.isValidBelgianStructuredReference(B.paymentReference(2027, 42, 'be')), true);
  assert.equal(R.isValidLuhn(B.paymentReference(2027, 42, 'no')), true);
  assert.equal(R.isValidLuhn(B.paymentReference(2027, 42, 'se')), true);
  assert.throws(() => B.normalizeProfile({ referenceType: 'xx' }), /reference type/);
  assert.equal(B.normalizeProfile({ referenceType: 'be' }).referenceType, 'be');
});

test('the regional methods on an invoice: their code in their currency, and why not otherwise', () => {
  const P = require('../models/lib/paymentCodes.js');
  const inv = (currency, extra = {}) => ({ number: 'INV-2027-0001', currency, amountDueMinor: 150000, paymentReference: '2027000017', dueDate: '2027-05-14', ...extra });
  const pp = P.normalizePaymentMethod({ type: 'promptpay', target: '0812345678' });
  assert.ok(emvValid(P.paymentInstructions(pp, inv('THB')).qr));
  assert.equal(P.paymentInstructions(pp, inv('EUR')).error, 'promptpay is in THB');
  assert.match(P.paymentInstructions(P.normalizePaymentMethod({ type: 'spayd', iban: 'CZ6508000000192000145399' }), inv('CZK')).qr, /^SPD\*1\.0\*ACC:CZ65.*\*AM:1500\.00\*CC:CZK\*MSG:INV-2027-0001\*X-VS:2027000017$/);
  assert.equal(P.paymentInstructions(P.normalizePaymentMethod({ type: 'vietqr', bin: '970436', account: '0011001932418' }), inv('VND')).qr.includes('5406150000'), true, 'VND whole dong');
  assert.match(P.paymentInstructions(P.normalizePaymentMethod({ type: 'dk-fik', creditor: '12345678' }), inv('DKK')).lines[0], /^\+71<\d{15}\+12345678<$/);
  assert.match(P.paymentInstructions(P.normalizePaymentMethod({ type: 'mnb', name: 'Kft', iban: 'HU42117730161111101800000000', bic: 'GIBAHUHB' }), inv('HUF')).qr, /^HCT\n001/);
  assert.equal(P.paymentInstructions(P.normalizePaymentMethod({ type: 'zbp', account: '61109010140000071219812874', name: 'Firma' }), inv('PLN', { amountDueMinor: 1000000 })).error, 'The Polish QR code is for up to 9999.99 PLN');
  assert.throws(() => P.normalizePaymentMethod({ type: 'promptpay', target: '12' }), /PromptPay target/, 'negative: checked on the way in');
  assert.throws(() => P.normalizePaymentMethod({ type: 'ethereum', address: '0x1' }), /Ethereum/);
  const be = P.paymentInstructions(P.normalizePaymentMethod({ type: 'sepa', name: 'BV', iban: 'BE72000000001616' }),
    inv('EUR', { paymentReference: '+++123/4567/89002+++' }));
  assert.equal(be.qr.split('\n')[10], '+++123/4567/89002+++', 'a Belgian reference is the EPC text');
});

console.log(`\nregionalPaymentCodes: ${passed} tests passed`);
