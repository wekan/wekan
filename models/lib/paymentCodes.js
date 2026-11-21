'use strict';

// Payment methods of an invoice (docs/Features/Billing/Billing.md): the
// payment references, the QR code payloads and the barcode, each by its
// published standard, so the payer's bank or app reads them. Pure - nothing is
// sent anywhere; the codes are drawn on the invoice (PDF, print).
// tests/paymentCodes.test.cjs checks them against the standards' own examples.
//
//   SEPA credit transfer QR   EPC069-12 "Quick Response Code", version 002 (GiroCode)
//   Finnish bank barcode      Finanssiala "Pankkiviivakoodi", versions 4 and 5, Code 128 C
//   Finnish reference number  Finanssiala "Kotimainen viitenumero" (7-3-1 check digit)
//   RF creditor reference     ISO 11649
//   Swiss QR-bill             SIX "Swiss Payment Standards: QR-bill", version 0200
//   Swish                     Swish "QR code specification", prefilled C-format
//   Pix                       Banco Central do Brasil "BR Code" (EMV QRCPS-MPM, CRC16-CCITT)
//   UPI                       NPCI "UPI Linking Specs" deep link, upi://pay
//   Bitcoin                   BIP 21 URI
//   PayPal.me                 PayPal.me link with amount and currency

function fail(message) { throw new Error(message); }

const ALNUM = /^[A-Z0-9]+$/;

function cleanCode(value) {
  return String(value || '').replace(/\s+/g, '').toUpperCase();
}

// Letters to numbers for ISO 7064 mod 97: A = 10 ... Z = 35.
function toDigits(text) {
  return text.replace(/[A-Z]/g, ch => String(ch.charCodeAt(0) - 55));
}

function mod97(digits) {
  let rest = 0;
  for (let i = 0; i < digits.length; i += 7) rest = Number(String(rest) + digits.slice(i, i + 7)) % 97;
  return rest;
}

// ---------------------------------------------------------------- IBAN, BIC

function isValidIban(value) {
  const iban = cleanCode(value);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  return mod97(toDigits(iban.slice(4) + iban.slice(0, 4))) === 1;
}

function isValidBic(value) {
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleanCode(value));
}

function formatIban(value) {
  return cleanCode(value).replace(/(.{4})/g, '$1 ').trim();
}

// ---------------------------------------------------------------- references

// The Finnish reference number: the digits, and a check digit from the
// weights 7, 3, 1 repeated from the right.
function finnishReference(base) {
  const digits = String(base).replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length < 3 || digits.length > 19) fail('A reference number has 3 to 19 digits before its check digit');
  const weights = [7, 3, 1];
  let sum = 0;
  for (let i = digits.length - 1, w = 0; i >= 0; i -= 1, w += 1) sum += Number(digits[i]) * weights[w % 3];
  return digits + String((10 - (sum % 10)) % 10);
}

function isValidFinnishReference(value) {
  const digits = String(value || '').replace(/\s+/g, '');
  if (!/^\d{4,20}$/.test(digits)) return false;
  try { return finnishReference(digits.slice(0, -1)) === digits.replace(/^0+/, ''); } catch (e) { return false; }
}

// ISO 11649: "RF", two check digits, and the reference (up to 21 letters or digits).
function rfReference(base) {
  const ref = cleanCode(base);
  if (!ref || ref.length > 21 || !ALNUM.test(ref)) fail('An RF reference has 1 to 21 letters or digits');
  const check = 98 - mod97(toDigits(`${ref}RF00`));
  return `RF${String(check).padStart(2, '0')}${ref}`;
}

function isValidRfReference(value) {
  const ref = cleanCode(value);
  if (!/^RF\d{2}[A-Z0-9]{1,21}$/.test(ref)) return false;
  return mod97(toDigits(ref.slice(4) + ref.slice(0, 4))) === 1;
}

function formatReference(value) {
  const ref = cleanCode(value);
  if (ref.startsWith('RF')) return ref.replace(/(.{4})/g, '$1 ').trim();
  return ref.replace(/(\d)(?=(\d{5})+$)/g, '$1 ');
}

// ---------------------------------------------------------------- amounts

// An amount as a code writes it, in its currency's decimals (models/lib/currencies.js).
function amountText(minor, currency = 'EUR') {
  if (!Number.isSafeInteger(minor) || minor < 0) fail('Invalid amount');
  return require('./currencies').minorToText(minor, currency);
}

// ---------------------------------------------------------------- SEPA EPC QR

/**
 * EPC069-12 v002: a SEPA credit transfer in a QR code. EUR only, amount up to
 * 999 999 999.99, a structured RF reference or an unstructured text (not both).
 */
function epcQrPayload({ name, iban, bic = '', amountMinor = null, reference = '', text = '', purpose = '', information = '' }) {
  const n = String(name || '').trim();
  if (!n || n.length > 70) fail('The beneficiary name is 1 to 70 characters');
  if (!isValidIban(iban)) fail('Invalid IBAN');
  if (bic && !isValidBic(bic)) fail('Invalid BIC');
  if (amountMinor !== null && (amountMinor < 1 || amountMinor > 99999999999)) fail('The amount must be between 0.01 and 999999999.99 EUR');
  const ref = cleanCode(reference);
  if (ref && !isValidRfReference(ref)) fail('A structured reference in an EPC QR code is an RF reference');
  if (String(text).length > 140) fail('The remittance text is at most 140 characters');
  if (ref && text) fail('Use a reference or a text, not both');
  const lines = [
    'BCD', '002', '1', 'SCT', cleanCode(bic), n, cleanCode(iban),
    amountMinor === null ? '' : `EUR${amountText(amountMinor, 'EUR')}`,
    String(purpose || '').slice(0, 4), ref, ref ? '' : String(text || ''), String(information || '').slice(0, 70),
  ];
  while (lines.length > 10 && lines[lines.length - 1] === '') lines.pop();
  const payload = lines.join('\n');
  if (new TextEncoder().encode(payload).length > 331) fail('The EPC QR code would be longer than 331 bytes');
  return payload;
}

// ---------------------------------------------------------------- Finnish barcode

/**
 * The 54-digit Finnish bank barcode (pankkiviivakoodi). Version 4 for a
 * Finnish reference number, version 5 for an RF reference. A Finnish IBAN, an
 * amount up to 999 999.99 EUR (larger is written as zeros, as the standard
 * says), and the due date as YYMMDD (000000 when there is none).
 */
function finnishBarcode({ iban, amountMinor, reference, dueDate = null }) {
  const account = cleanCode(iban);
  if (!account.startsWith('FI') || !isValidIban(account)) fail('The bank barcode needs a Finnish IBAN');
  const accountDigits = account.slice(2); // check digits + 14-digit account
  const amount = amountMinor > 99999999 || amountMinor === null || amountMinor === undefined ? '00000000'
    : String(amountMinor).padStart(8, '0');
  let due = '000000';
  if (dueDate) {
    if (!/^\d{4}-\d\d-\d\d$/.test(dueDate)) fail('Use a due date written YYYY-MM-DD');
    due = dueDate.slice(2, 4) + dueDate.slice(5, 7) + dueDate.slice(8, 10);
  }
  const ref = cleanCode(reference);
  if (ref.startsWith('RF')) {
    if (!isValidRfReference(ref) || !/^RF\d+$/.test(ref)) fail('The bank barcode takes an RF reference of digits');
    const body = ref.slice(4);
    if (body.length > 21) fail('The RF reference is too long for the bank barcode');
    return `5${accountDigits}${amount}${ref.slice(2, 4)}${body.padStart(21, '0')}${due}`;
  }
  if (!isValidFinnishReference(ref)) fail('Invalid Finnish reference number');
  return `4${accountDigits}${amount}000${ref.padStart(20, '0')}${due}`;
}

// Code 128 bar patterns, values 0-106 (106 is the stop pattern, 13 modules).
const CODE128 = [
  '11011001100', '11001101100', '11001100110', '10010011000', '10010001100', '10001001100', '10011001000', '10011000100',
  '10001100100', '11001001000', '11001000100', '11000100100', '10110011100', '10011011100', '10011001110', '10111001100',
  '10011101100', '10011100110', '11001110010', '11001011100', '11001001110', '11011100100', '11001110100', '11101101110',
  '11101001100', '11100101100', '11100100110', '11101100100', '11100110100', '11100110010', '11011011000', '11011000110',
  '11000110110', '10100011000', '10001011000', '10001000110', '10110001000', '10001101000', '10001100010', '11010001000',
  '11000101000', '11000100010', '10110111000', '10110001110', '10001101110', '10111011000', '10111000110', '10001110110',
  '11101110110', '11010001110', '11000101110', '11011101000', '11011100010', '11011101110', '11101011000', '11101000110',
  '11100010110', '11101101000', '11101100010', '11100011010', '11101111010', '11001000010', '11110001010', '10100110000',
  '10100001100', '10010110000', '10010000110', '10000101100', '10000100110', '10110010000', '10110000100', '10011010000',
  '10011000010', '10000110100', '10000110010', '11000010010', '11001010000', '11110111010', '11000010100', '10001111010',
  '10100111100', '10010111100', '10010011110', '10111100100', '10011110100', '10011110010', '11110100100', '11110010100',
  '11110010010', '11011011110', '11011110110', '11110110110', '10101111000', '10100011110', '10001011110', '10111101000',
  '10111100010', '11110101000', '11110100010', '10111011110', '10111101110', '11101011110', '11110101110', '11010000100',
  '11010010000', '11010011100', '1100011101011',
];

// Code 128, code set C (pairs of digits): the code values, with the start C
// (105), the checksum and the stop (106).
function code128CValues(digits) {
  if (!/^(\d\d)+$/.test(digits)) fail('Code 128 C takes an even number of digits');
  const values = [105];
  for (let i = 0; i < digits.length; i += 2) values.push(Number(digits.slice(i, i + 2)));
  const checksum = values.reduce((s, v, i) => s + v * (i === 0 ? 1 : i), 0) % 103;
  values.push(checksum, 106);
  return values;
}

// The modules of the barcode, '1' a bar and '0' a space, with the quiet zones.
function code128CModules(digits, quiet = 10) {
  return '0'.repeat(quiet) + code128CValues(digits).map(v => CODE128[v]).join('') + '0'.repeat(quiet);
}

// ---------------------------------------------------------------- Swiss QR-bill

function swissAddress(a, role) {
  if (!a || !String(a.name || '').trim()) fail(`The ${role} needs a name`);
  const country = cleanCode(a.country);
  if (!/^[A-Z]{2}$/.test(country)) fail(`The ${role} needs a two-letter country code`);
  if (!String(a.postcode || '').trim() || !String(a.town || '').trim()) fail(`The ${role} needs a postcode and a town`);
  return ['S', String(a.name).slice(0, 70), String(a.street || '').slice(0, 70), String(a.building || '').slice(0, 16),
    String(a.postcode).slice(0, 16), String(a.town).slice(0, 35), country];
}

/**
 * The Swiss QR-bill payload (SPC, version 0200), CHF or EUR. With a QR-IBAN
 * (IID 30000-31999) the reference is a 27-digit QR reference (QRR); otherwise
 * an RF reference (SCOR) or none (NON).
 */
function swissQrPayload({ iban, creditor, amountMinor = null, currency = 'CHF', debtor = null, reference = '', message = '', billInformation = '' }) {
  const account = cleanCode(iban);
  if (!/^(CH|LI)/.test(account) || !isValidIban(account)) fail('The Swiss QR-bill needs a Swiss or Liechtenstein IBAN');
  if (!['CHF', 'EUR'].includes(currency)) fail('The Swiss QR-bill is in CHF or EUR');
  if (amountMinor !== null && (amountMinor < 1 || amountMinor > 99999999999)) fail('The amount must be between 0.01 and 999999999.99');
  const iid = Number(account.slice(4, 9));
  const isQrIban = iid >= 30000 && iid <= 31999;
  const ref = cleanCode(reference);
  let refType = 'NON';
  if (isQrIban) {
    if (!/^\d{27}$/.test(ref)) fail('A QR-IBAN needs a 27-digit QR reference');
    refType = 'QRR';
  } else if (ref) {
    if (!isValidRfReference(ref)) fail('Use an RF reference with an IBAN');
    refType = 'SCOR';
  }
  if (String(message).length + String(billInformation).length > 140) fail('The message and bill information are at most 140 characters');
  const empty = ['', '', '', '', '', '', ''];
  const lines = [
    'SPC', '0200', '1', account,
    ...swissAddress(creditor, 'creditor'),
    ...empty,
    amountMinor === null ? '' : amountText(amountMinor, currency), currency,
    ...(debtor ? swissAddress(debtor, 'debtor') : empty),
    refType, refType === 'NON' ? '' : ref,
    String(message || ''), 'EPD', String(billInformation || ''),
  ];
  return lines.join('\r\n');
}

// ---------------------------------------------------------------- Swish

// Swish C-format: payee; amount; message; which fields the payer may change
// (0 = none). SEK only.
function swishQrPayload({ payee, amountMinor = null, message = '', editable = 0 }) {
  const number = String(payee || '').replace(/[\s-]/g, '');
  if (!/^\d{6,15}$/.test(number)) fail('A Swish number is 6 to 15 digits');
  if (String(message).length > 50) fail('A Swish message is at most 50 characters');
  if (/;/.test(message)) fail('A Swish message cannot contain ;');
  if (!Number.isInteger(editable) || editable < 0 || editable > 7) fail('Invalid Swish editable flags');
  return `C${number};${amountMinor === null ? '' : amountText(amountMinor, 'SEK')};${message};${editable}`;
}

// ---------------------------------------------------------------- Pix (BR Code)

function emv(id, value) {
  const v = String(value);
  if (v.length > 99) fail('An EMV field is at most 99 characters');
  return id + String(v.length).padStart(2, '0') + v;
}

// CRC16-CCITT-FALSE: polynomial 0x1021, initial 0xFFFF.
function crc16(text) {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(text)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i += 1) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function ascii(value, max) {
  return String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '').slice(0, max);
}

// A static Pix BR Code: the payee's Pix key, name and city, an amount in BRL.
function pixPayload({ key, name, city, amountMinor = null, txid = '***' }) {
  const k = String(key || '').trim();
  if (!k || k.length > 77) fail('A Pix key is 1 to 77 characters');
  const n = ascii(name, 25);
  const c = ascii(city, 15);
  if (!n || !c) fail('Pix needs the payee name and city');
  const id = ascii(txid, 25).replace(/[^A-Za-z0-9*]/g, '') || '***';
  const body = emv('00', '01')
    + emv('26', emv('00', 'br.gov.bcb.pix') + emv('01', k))
    + emv('52', '0000') + emv('53', '986')
    + (amountMinor === null ? '' : emv('54', amountText(amountMinor, 'BRL')))
    + emv('58', 'BR') + emv('59', n) + emv('60', c)
    + emv('62', emv('05', id))
    + '6304';
  return body + crc16(body);
}

// ---------------------------------------------------------------- URIs and links

function query(params) {
  return Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

// UPI (India): the payee's virtual payment address, an amount in INR.
function upiUri({ vpa, name, amountMinor = null, note = '', reference = '' }) {
  if (!/^[A-Za-z0-9._-]{2,256}@[A-Za-z][A-Za-z0-9.-]{1,63}$/.test(String(vpa || ''))) fail('Invalid UPI address');
  return `upi://pay?${query({ pa: vpa, pn: String(name || '').slice(0, 99), am: amountMinor === null ? '' : amountText(amountMinor, 'INR'),
    cu: 'INR', tn: String(note || '').slice(0, 80), tr: String(reference || '').slice(0, 35) })}`;
}

// BIP 21. The amount is in bitcoin, so it is written only for an invoice in BTC.
function bitcoinUri({ address, amountMinor = null, currency = '', label = '', message = '' }) {
  const a = String(address || '').trim();
  if (!/^(bc1[ac-hj-np-z02-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(a)) fail('Invalid bitcoin address');
  const amount = currency === 'BTC' && amountMinor !== null ? amountText(amountMinor, 'BTC') : '';
  const q = query({ amount, label, message });
  return `bitcoin:${a}${q ? `?${q}` : ''}`;
}

function paypalMeUrl({ user, amountMinor = null, currency = '' }) {
  const u = String(user || '').trim();
  if (!/^[A-Za-z0-9]{1,20}$/.test(u)) fail('Invalid PayPal.me name');
  const amount = amountMinor === null ? '' : `/${amountText(amountMinor, currency)}${/^[A-Z]{3}$/.test(currency) ? currency : ''}`;
  return `https://paypal.me/${u}${amount}`;
}

// A payment link of any service (Stripe Payment Links, Mollie, Square,
// MobilePay, Vipps, Revolut, ...), with {amount}, {currency}, {reference} and
// {number} filled in, URL-encoded. Only an https address.
function paymentLink(template, { amountMinor = null, currency = '', reference = '', number = '' } = {}) {
  const t = String(template || '').trim();
  if (!/^https:\/\/[^\s<>"']+$/.test(t) || t.length > 2000) fail('A payment link is an https address');
  const values = { amount: amountMinor === null ? '' : amountText(amountMinor, currency), currency, reference: cleanCode(reference), number };
  return t.replace(/\{(amount|currency|reference|number)\}/g, (m, key) => encodeURIComponent(values[key]));
}

// ---------------------------------------------------------------- methods

// The payment methods an issuer can offer, and the fields each needs. 'qr' is
// whether the invoice carries a QR code for it.
const PAYMENT_METHODS = Object.freeze({
  sepa: { fields: ['name', 'iban', 'bic'], qr: true },
  'fi-bank': { fields: ['name', 'iban', 'bic'], qr: false, barcode: true },
  'swiss-qr': { fields: ['name', 'iban', 'street', 'building', 'postcode', 'town', 'country'], qr: true },
  'bank-transfer': { fields: ['name', 'details'], qr: false },
  swish: { fields: ['payee'], qr: true },
  pix: { fields: ['key', 'name', 'city'], qr: true },
  upi: { fields: ['vpa', 'name'], qr: true },
  bitcoin: { fields: ['address'], qr: true },
  paypal: { fields: ['user'], qr: true },
  link: { fields: ['label', 'url'], qr: true },
  promptpay: { fields: ['target'], qr: true },
  paynow: { fields: ['proxy', 'name'], qr: true },
  vietqr: { fields: ['bin', 'account'], qr: true },
  fps: { fields: ['proxy', 'name'], qr: true },
  spayd: { fields: ['iban', 'bic'], qr: true },
  zbp: { fields: ['account', 'name', 'nip'], qr: true },
  mnb: { fields: ['name', 'iban', 'bic'], qr: true },
  ips: { fields: ['account', 'name'], qr: true },
  'dk-fik': { fields: ['creditor'], qr: false },
  ethereum: { fields: ['address'], qr: true },
  litecoin: { fields: ['address'], qr: true },
  cash: { fields: ['details'], qr: false },
  cheque: { fields: ['details'], qr: false },
  other: { fields: ['label', 'details'], qr: false },
});

function normalizePaymentMethod(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Expected an object');
  const spec = PAYMENT_METHODS[value.type];
  if (!spec) fail('Unknown payment method');
  const out = { type: value.type };
  for (const key of Object.keys(value)) if (key !== 'type' && !spec.fields.includes(key)) fail(`Unsupported field: ${key}`);
  for (const key of spec.fields) {
    const v = value[key] === undefined || value[key] === null ? '' : value[key];
    if (typeof v !== 'string' || v.length > 2000 || v.includes('\0')) fail(`Invalid ${key}`);
    out[key] = v.trim();
  }
  if (['sepa', 'fi-bank', 'swiss-qr', 'spayd', 'mnb'].includes(out.type)) {
    if (!isValidIban(out.iban)) fail('Invalid IBAN');
    out.iban = cleanCode(out.iban);
    if (out.bic && !isValidBic(out.bic)) fail('Invalid BIC');
    if (out.bic) out.bic = cleanCode(out.bic);
  }
  if (out.type === 'fi-bank' && !out.iban.startsWith('FI')) fail('The Finnish bank barcode needs a Finnish IBAN');
  if (out.type === 'link') paymentLink(out.url);
  // The regional codes check their own fields: try one with no amount.
  const R = require('./regionalPaymentCodes');
  const sample = {
    promptpay: () => R.promptPayPayload({ target: out.target }),
    paynow: () => R.payNowPayload({ proxy: out.proxy, name: out.name }),
    vietqr: () => R.vietQrPayload({ bin: out.bin, account: out.account }),
    fps: () => R.fpsPayload({ proxy: out.proxy, name: out.name }),
    spayd: () => R.spaydPayload({ iban: out.iban, bic: out.bic }),
    zbp: () => R.zbpPayload({ account: out.account, name: out.name, nip: out.nip, amountMinor: 1 }),
    mnb: () => R.mnbPayload({ name: out.name, iban: out.iban, bic: out.bic, dueDate: '2000-01-01' }),
    ips: () => R.ipsPayload({ account: out.account, name: out.name }),
    'dk-fik': () => R.danishFik({ creditor: out.creditor, base: '1' }),
    ethereum: () => R.ethereumUri({ address: out.address }),
    litecoin: () => R.litecoinUri({ address: out.address }),
  }[out.type];
  if (sample) sample();
  return out;
}

/**
 * What an invoice shows for one payment method: a QR payload, a barcode, a
 * link and lines of text. A method that does not fit the invoice (a Swish
 * number on a EUR invoice, say) gives { error } instead, so the invoice still
 * renders and the issuer sees why.
 */
function paymentInstructions(method, invoice) {
  const amountMinor = invoice.amountDueMinor;
  const currency = invoice.currency;
  const reference = invoice.paymentReference || '';
  const rf = reference.startsWith('RF') ? reference : '';
  const text = `${invoice.number}`;
  try {
    switch (method.type) {
      case 'sepa': {
        if (currency !== 'EUR') return { method, error: 'SEPA QR codes are in EUR' };
        // A Belgian structured reference goes in the text, as Belgian banks read it.
        const remittance = rf ? '' : (reference.startsWith('+++') ? reference : text);
        return { method, qr: epcQrPayload({ name: method.name, iban: method.iban, bic: method.bic, amountMinor, reference: rf, text: remittance }),
          lines: [method.name, formatIban(method.iban), method.bic].filter(Boolean) };
      }
      case 'fi-bank': {
        if (currency !== 'EUR') return { method, error: 'The Finnish bank barcode is in EUR' };
        return { method, barcode: finnishBarcode({ iban: method.iban, amountMinor, reference, dueDate: invoice.dueDate }),
          lines: [method.name, formatIban(method.iban), method.bic, formatReference(reference)].filter(Boolean) };
      }
      case 'swiss-qr': {
        return { method, qr: swissQrPayload({ iban: method.iban, currency, amountMinor, reference: rf, message: text,
          creditor: { name: method.name, street: method.street, building: method.building, postcode: method.postcode, town: method.town, country: method.country } }),
        swissCross: true, lines: [method.name, formatIban(method.iban)] };
      }
      case 'swish': {
        if (currency !== 'SEK') return { method, error: 'Swish is in SEK' };
        return { method, qr: swishQrPayload({ payee: method.payee, amountMinor, message: text.slice(0, 50) }), lines: [method.payee] };
      }
      case 'pix': {
        if (currency !== 'BRL') return { method, error: 'Pix is in BRL' };
        return { method, qr: pixPayload({ key: method.key, name: method.name, city: method.city, amountMinor, txid: invoice.number }), lines: [method.key] };
      }
      case 'upi': {
        if (currency !== 'INR') return { method, error: 'UPI is in INR' };
        const uri = upiUri({ vpa: method.vpa, name: method.name, amountMinor, note: text, reference: invoice.number });
        return { method, qr: uri, link: uri, lines: [method.vpa] };
      }
      case 'bitcoin': {
        const uri = bitcoinUri({ address: method.address, amountMinor, currency, label: invoice.issuerName || '', message: text });
        return { method, qr: uri, link: uri, lines: [method.address] };
      }
      case 'paypal': {
        const url = paypalMeUrl({ user: method.user, amountMinor, currency });
        return { method, qr: url, link: url, lines: [url] };
      }
      case 'link': {
        const url = paymentLink(method.url, { amountMinor, currency, reference, number: invoice.number });
        return { method, qr: url, link: url, lines: [method.label || url] };
      }
      case 'promptpay': case 'paynow': case 'vietqr': case 'fps': case 'spayd': case 'zbp': case 'mnb': case 'ips':
      case 'dk-fik': case 'ethereum': case 'litecoin':
        return regionalInstructions(method, invoice);
      default:
        return { method, lines: [method.label, method.name, method.details].filter(Boolean) };
    }
  } catch (e) {
    return { method, error: e.message };
  }
}

// The regional methods (models/lib/regionalPaymentCodes.js), each in the
// currency its scheme carries.
const REGIONAL_CURRENCY = { promptpay: 'THB', paynow: 'SGD', vietqr: 'VND', fps: 'HKD', spayd: 'CZK', zbp: 'PLN', mnb: 'HUF', ips: 'RSD', 'dk-fik': 'DKK' };

function regionalInstructions(method, invoice) {
  const R = require('./regionalPaymentCodes');
  const { amountDueMinor: amountMinor, currency } = invoice;
  const need = REGIONAL_CURRENCY[method.type];
  if (need && currency !== need) return { method, error: `${method.type} is in ${need}` };
  const ref = invoice.paymentReference || '';
  const text = invoice.number;
  switch (method.type) {
    case 'promptpay': return { method, qr: R.promptPayPayload({ target: method.target, amountMinor }), lines: [method.target] };
    case 'paynow': return { method, qr: R.payNowPayload({ proxy: method.proxy, name: method.name, amountMinor, reference: text }), lines: [method.name, method.proxy] };
    case 'vietqr': return { method, qr: R.vietQrPayload({ bin: method.bin, account: method.account, amountMinor, message: text }), lines: [method.account] };
    case 'fps': return { method, qr: R.fpsPayload({ proxy: method.proxy, name: method.name, amountMinor, reference: text }), lines: [method.name, method.proxy] };
    case 'spayd': {
      const vs = /^\d+$/.test(ref) ? ref.slice(-10) : '';
      return { method, qr: R.spaydPayload({ iban: method.iban, bic: method.bic, amountMinor, currency, message: text, variableSymbol: vs }),
        lines: [formatIban(method.iban), method.bic, vs ? `VS ${vs}` : ''].filter(Boolean) };
    }
    case 'zbp': {
      if (amountMinor > 999999) return { method, error: 'The Polish QR code is for up to 9999.99 PLN' };
      return { method, qr: R.zbpPayload({ account: method.account, name: method.name, nip: method.nip, title: text, amountMinor }), lines: [method.name, method.account] };
    }
    case 'mnb': {
      if (!invoice.dueDate) return { method, error: 'The Hungarian QR code needs a due date' };
      return { method, qr: R.mnbPayload({ bic: method.bic, name: method.name, iban: method.iban, amountMinor, dueDate: invoice.dueDate, message: text }),
        lines: [method.name, formatIban(method.iban)] };
    }
    case 'ips': return { method, qr: R.ipsPayload({ account: method.account, name: method.name, amountMinor, purpose: text, reference: ref }), lines: [method.name, method.account] };
    case 'dk-fik': {
      const base = (String(ref).replace(/\D/g, '') || String(text).replace(/\D/g, '')).slice(-14);
      return { method, lines: [R.danishFik({ creditor: method.creditor, base })] };
    }
    case 'ethereum': { const uri = R.ethereumUri({ address: method.address, amountMinor, currency }); return { method, qr: uri, link: uri, lines: [method.address] }; }
    case 'litecoin': { const uri = R.litecoinUri({ address: method.address, amountMinor, currency, message: text }); return { method, qr: uri, link: uri, lines: [method.address] }; }
    default: return { method, lines: [] };
  }
}

module.exports = {
  PAYMENT_METHODS,
  isValidIban, isValidBic, formatIban,
  finnishReference, isValidFinnishReference, rfReference, isValidRfReference, formatReference,
  epcQrPayload, finnishBarcode, code128CValues, code128CModules,
  swissQrPayload, swishQrPayload, pixPayload, crc16, upiUri, bitcoinUri, paypalMeUrl, paymentLink,
  normalizePaymentMethod, paymentInstructions,
};
