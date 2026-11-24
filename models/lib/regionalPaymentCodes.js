'use strict';

// More payment codes, each by its published specification
// (docs/Features/Billing/README.md), beside models/lib/paymentCodes.js.
// Pure; tests/regionalPaymentCodes.test.cjs.
//
//   PromptPay (Thailand)      Bank of Thailand / Thai Bankers' Association, EMVCo MPM, AID A000000677010111
//   PayNow (Singapore)        Association of Banks in Singapore, SGQR, EMVCo MPM, SG.PAYNOW
//   VietQR (Vietnam)          NAPAS, EMVCo MPM, AID A000000727, service QRIBFTTA
//   FPS (Hong Kong)           HKMA / HKICL, EMVCo MPM, hk.com.hkicl
//   QR Platba (Czechia)       Czech Banking Association, Short Payment Descriptor (SPAYD) 1.0
//   2D code (Poland)          Polish Bank Association (ZBP) recommendation
//   MNB QR (Hungary)          Magyar Nemzeti Bank, instant credit transfer QR, version 001
//   NBS IPS QR (Serbia)       National Bank of Serbia, IPS QR code
//   Structured communication  Belgium (mod 97)
//   KID                       Norway (mod 10)
//   OCR reference             Sweden, Bankgiro / Plusgiro (mod 10)
//   FI-kort +71               Denmark (mod 10)
//   Ethereum                  EIP-681 URI
//   Litecoin                  BIP 21-style URI

const { crc16, isValidIban, isValidBic } = require('./paymentCodes');
const { minorToText } = require('./currencies');

function fail(message) { throw new Error(message); }

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function ascii(value, max) {
  return String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '').slice(0, max);
}

// ---------------------------------------------------------------- EMVCo MPM

function emv(id, value) {
  const v = String(value);
  if (v.length > 99) fail('An EMV field is at most 99 characters');
  return id + String(v.length).padStart(2, '0') + v;
}

function withCrc(body) {
  const b = `${body}6304`;
  return b + crc16(b);
}

function initiation(amountMinor) {
  // 11 static (the payer types the amount), 12 dynamic (the amount is in it).
  return emv('00', '01') + emv('01', amountMinor === null || amountMinor === undefined ? '11' : '12');
}

function emvAmount(amountMinor, currency) {
  return amountMinor === null || amountMinor === undefined ? '' : emv('54', minorToText(amountMinor, currency));
}

// PromptPay: to a mobile number (+66), a national ID / tax ID (13 digits) or
// an e-wallet ID (15 digits). THB.
function promptPayPayload({ target, amountMinor = null }) {
  let d = digitsOnly(target);
  let sub;
  if (d.length === 15) sub = emv('03', d);
  else if (d.length === 13) sub = emv('02', d);
  else {
    if (d.startsWith('66')) d = d.slice(2);
    if (d.startsWith('0')) d = d.slice(1);
    if (d.length !== 9) fail('A PromptPay target is a Thai mobile number, a 13-digit ID or a 15-digit e-wallet ID');
    sub = emv('01', `0066${d}`);
  }
  return withCrc(initiation(amountMinor) + emv('29', emv('00', 'A000000677010111') + sub)
    + emv('53', '764') + emvAmount(amountMinor, 'THB') + emv('58', 'TH'));
}

// PayNow: to a mobile number (+65) or a company's UEN. SGD.
function payNowPayload({ proxy, name, amountMinor = null, reference = '', editable = false }) {
  const value = String(proxy || '').replace(/\s+/g, '');
  let type;
  let p;
  if (/^\+?65\d{8}$/.test(value) || /^[89]\d{7}$/.test(value)) {
    type = '0';
    p = `+65${value.replace(/^\+?65/, '')}`;
  } else if (/^[0-9A-Z]{9,10}$/i.test(value)) {
    type = '2';
    p = value.toUpperCase();
  } else fail('A PayNow proxy is a Singapore mobile number or a UEN');
  const n = ascii(name, 25);
  if (!n) fail('PayNow needs the payee name');
  const ref = ascii(reference, 25);
  return withCrc(initiation(amountMinor)
    + emv('26', emv('00', 'SG.PAYNOW') + emv('01', type) + emv('02', p) + emv('03', editable ? '1' : '0'))
    + emv('52', '0000') + emv('53', '702') + emvAmount(amountMinor, 'SGD') + emv('58', 'SG') + emv('59', n)
    + emv('60', 'Singapore') + (ref ? emv('62', emv('01', ref)) : ''));
}

// VietQR: a bank account by the bank's 6-digit BIN (NAPAS) and the account
// number. VND, whole dong.
function vietQrPayload({ bin, account, amountMinor = null, message = '' }) {
  const b = digitsOnly(bin);
  const acc = String(account || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(b)) fail('A VietQR bank BIN is 6 digits');
  if (!/^[0-9A-Za-z]{1,19}$/.test(acc)) fail('Invalid account number');
  const msg = ascii(message, 25);
  return withCrc(initiation(amountMinor)
    + emv('38', emv('00', 'A000000727') + emv('01', emv('00', b) + emv('01', acc)) + emv('02', 'QRIBFTTA'))
    + emv('53', '704') + emvAmount(amountMinor, 'VND') + emv('58', 'VN') + (msg ? emv('62', emv('08', msg)) : ''));
}

// Hong Kong FPS: to an FPS ID, a mobile number (+852) or an email. HKD.
function fpsPayload({ proxy, name = '', amountMinor = null, reference = '' }) {
  const value = String(proxy || '').trim();
  let sub;
  if (/^\d{7,9}$/.test(value)) sub = emv('02', value);
  else if (/^\+?852-?\d{8}$/.test(value.replace(/\s+/g, ''))) sub = emv('03', `+852-${digitsOnly(value).replace(/^852/, '')}`);
  else if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) && value.length <= 64) sub = emv('04', value);
  else fail('An FPS proxy is an FPS ID, a Hong Kong mobile number or an email');
  const ref = ascii(reference, 25);
  return withCrc(initiation(amountMinor) + emv('26', emv('00', 'hk.com.hkicl') + sub)
    + emv('52', '0000') + emv('53', '344') + emvAmount(amountMinor, 'HKD') + emv('58', 'HK')
    + emv('59', ascii(name, 25) || 'NA') + emv('60', 'HK') + (ref ? emv('62', emv('05', ref)) : ''));
}

// ---------------------------------------------------------------- Europe

// QR Platba: SPD*1.0*ACC:IBAN*AM:..*CC:CZK*MSG:..*X-VS:.. ('*' is the separator,
// so a value carries it as %2A).
function spaydPayload({ iban, bic = '', amountMinor = null, currency = 'CZK', message = '', variableSymbol = '' }) {
  const acc = String(iban || '').replace(/\s+/g, '').toUpperCase();
  if (!isValidIban(acc)) fail('Invalid IBAN');
  if (bic && !isValidBic(bic)) fail('Invalid BIC');
  const esc = v => String(v).replace(/\*/g, '%2A');
  const vs = digitsOnly(variableSymbol).slice(0, 10);
  const parts = ['SPD', '1.0', `ACC:${acc}${bic ? `+${String(bic).toUpperCase()}` : ''}`];
  if (amountMinor !== null && amountMinor !== undefined) parts.push(`AM:${minorToText(amountMinor, currency)}`);
  if (!/^[A-Z]{3}$/.test(currency)) fail('Invalid currency');
  parts.push(`CC:${currency}`);
  if (message) parts.push(`MSG:${esc(ascii(message, 60))}`);
  if (vs) parts.push(`X-VS:${vs}`);
  return parts.join('*');
}

// The Polish bank QR code: NIP|PL|account|amount in grosze|name|title|||
// (at most 9 999.99 PLN in a code).
function zbpPayload({ account, name, title, amountMinor, nip = '' }) {
  let acc = String(account || '').replace(/\s+/g, '').toUpperCase();
  if (acc.startsWith('PL')) acc = acc.slice(2);
  if (!/^\d{26}$/.test(acc) || !isValidIban(`PL${acc}`)) fail('A Polish account number (NRB) is 26 digits');
  if (!Number.isInteger(amountMinor) || amountMinor < 1 || amountMinor > 999999) fail('The Polish QR code takes 0.01 to 9999.99 PLN');
  // The separator | (and any backslash) out of a value, so it stays one field.
  const clean = v => String(v || '').replace(/[|\\]/g, ' ');
  const n = digitsOnly(nip);
  if (n && n.length !== 10) fail('A NIP is 10 digits');
  const recipient = clean(name).slice(0, 20);
  if (!recipient) fail('The Polish QR code needs the recipient name');
  return `${n}|PL|${acc}|${String(amountMinor).padStart(6, '0')}|${recipient}|${clean(title).slice(0, 32)}|||`;
}

// MNB instant transfer QR: 17 lines, HCT version 001. Whole forints; a
// validity time is required (the due date, end of day, Budapest time +1).
function mnbPayload({ bic, name, iban, amountMinor = null, dueDate, message = '' }) {
  const acc = String(iban || '').replace(/\s+/g, '').toUpperCase();
  if (!acc.startsWith('HU') || !isValidIban(acc)) fail('The Hungarian QR code needs a Hungarian IBAN');
  if (!isValidBic(bic)) fail('The Hungarian QR code needs the BIC');
  const n = String(name || '').trim().slice(0, 70);
  if (!n) fail('The Hungarian QR code needs the beneficiary name');
  if (!/^\d{4}-\d\d-\d\d$/.test(String(dueDate || ''))) fail('The Hungarian QR code needs a due date');
  // HUF has 2 decimals in ISO 4217; the QR code is in whole forints.
  const amount = amountMinor === null || amountMinor === undefined ? '' : `HUF${Math.round(amountMinor / 100)}`;
  return ['HCT', '001', '1', String(bic).toUpperCase(), n, acc, amount, `${dueDate.replace(/-/g, '')}235959+1`, '',
    String(message || '').slice(0, 70), '', '', '', '', '', '', ''].join('\n');
}

// NBS IPS QR: K:PR|V:01|C:1|R:account|N:name|I:RSDamount|SF:code|S:purpose|RO:reference
function ipsPayload({ account, name, amountMinor = null, purposeCode = '289', purpose = '', reference = '' }) {
  // bank (3) - number (up to 13, padded with zeros) - check (2).
  const parts3 = String(account || '').trim().split('-');
  const acc = parts3.length === 3 ? parts3[0] + digitsOnly(parts3[1]).padStart(13, '0') + parts3[2] : digitsOnly(account);
  if (!/^\d{18}$/.test(acc)) fail('A Serbian account number is 18 digits');
  // The separator | (and any backslash) out of a value, so it stays one field.
  const clean = v => String(v || '').replace(/[|\\]/g, ' ');
  const n = clean(name).slice(0, 70);
  if (!n) fail('The IPS QR code needs the recipient name');
  if (!/^\d{3}$/.test(String(purposeCode))) fail('A payment code is 3 digits');
  const parts = ['K:PR', 'V:01', 'C:1', `R:${acc}`, `N:${n}`];
  if (amountMinor !== null && amountMinor !== undefined) parts.push(`I:RSD${minorToText(amountMinor, 'RSD').replace('.', ',')}`);
  parts.push(`SF:${purposeCode}`);
  if (purpose) parts.push(`S:${clean(purpose).slice(0, 35)}`);
  const ref = String(reference || '').replace(/\s+/g, '');
  if (ref) parts.push(`RO:${ref.slice(0, 25)}`);
  return parts.join('|');
}

// ---------------------------------------------------------------- references

// Luhn (mod 10, weights 2-1 from the right): the check digit of `digits`.
function luhnCheck(digits) {
  let sum = 0;
  for (let i = digits.length - 1, double = true; i >= 0; i -= 1, double = !double) {
    let v = Number(digits[i]) * (double ? 2 : 1);
    if (v > 9) v -= 9;
    sum += v;
  }
  return String((10 - (sum % 10)) % 10);
}

// Belgium: +++123/4567/89002+++ - ten digits and their remainder mod 97 (97 for 0).
function belgianStructuredReference(base) {
  const d = digitsOnly(base);
  if (!d || d.length > 10) fail('A Belgian structured reference has up to 10 digits before its check');
  const ten = d.padStart(10, '0');
  const rest = Number(BigInt(ten) % 97n) || 97;
  const all = ten + String(rest).padStart(2, '0');
  return `+++${all.slice(0, 3)}/${all.slice(3, 7)}/${all.slice(7)}+++`;
}

function isValidBelgianStructuredReference(value) {
  const d = digitsOnly(value);
  if (d.length !== 12) return false;
  return (Number(BigInt(d.slice(0, 10)) % 97n) || 97) === Number(d.slice(10));
}

// Norway KID, mod 10.
function norwegianKid(base) {
  const d = digitsOnly(base);
  if (d.length < 1 || d.length > 24) fail('A KID has 2 to 25 digits');
  return d + luhnCheck(d);
}

// Sweden OCR reference (Bankgiro/Plusgiro), mod 10, with the length digit.
function swedishOcr(base) {
  const d = digitsOnly(base);
  if (d.length < 1 || d.length > 22) fail('An OCR reference has 2 to 25 digits');
  const withLength = d + String((d.length + 2) % 10);
  return withLength + luhnCheck(withLength);
}

function isValidLuhn(value) {
  const d = digitsOnly(value);
  return d.length >= 2 && luhnCheck(d.slice(0, -1)) === d.slice(-1);
}

// Denmark FI-kort +71: a 15-digit payment ID with its mod 10 check digit, and
// the creditor number: "+71<000000001234567+12345678<".
function danishFik({ creditor, base }) {
  const c = digitsOnly(creditor);
  if (c.length !== 8) fail('A Danish creditor number is 8 digits');
  const d = digitsOnly(base);
  if (d.length < 1 || d.length > 14) fail('A +71 payment ID has up to 14 digits before its check');
  const id = (d + luhnCheck(d)).padStart(15, '0');
  return `+71<${id}+${c}<`;
}

// ---------------------------------------------------------------- crypto

// EIP-681: ether by the wei. WeKan keeps ETH to 8 decimals.
function ethereumUri({ address, amountMinor = null, currency = '' }) {
  const a = String(address || '').trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(a)) fail('Invalid Ethereum address');
  if (currency !== 'ETH' || amountMinor === null || amountMinor === undefined) return `ethereum:${a}`;
  return `ethereum:${a}?value=${(BigInt(amountMinor) * 10n ** 10n).toString()}`;
}

function litecoinUri({ address, amountMinor = null, currency = '', message = '' }) {
  const a = String(address || '').trim();
  if (!/^(ltc1[ac-hj-np-z02-9]{11,87}|[LM3][a-km-zA-HJ-NP-Z1-9]{26,33})$/.test(a)) fail('Invalid Litecoin address');
  const q = [];
  if (currency === 'LTC' && amountMinor !== null && amountMinor !== undefined) q.push(`amount=${minorToText(amountMinor, 'LTC')}`);
  if (message) q.push(`message=${encodeURIComponent(message)}`);
  return `litecoin:${a}${q.length ? `?${q.join('&')}` : ''}`;
}

module.exports = {
  promptPayPayload, payNowPayload, vietQrPayload, fpsPayload,
  spaydPayload, zbpPayload, mnbPayload, ipsPayload,
  luhnCheck, isValidLuhn, belgianStructuredReference, isValidBelgianStructuredReference, norwegianKid, swedishOcr, danishFik,
  ethereumUri, litecoinUri,
};
