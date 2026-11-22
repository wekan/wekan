// The payment methods of Budget and billing (models/lib/paymentCodes.js), as
// the browser draws them: their labels' translation keys, the placeholders of
// their fields, and the QR code and the Finnish bank barcode as SVG. Shared by
// the Budget and billing page (client/components/main/billing.js) and Board
// View / Shop (client/components/boards/shopView.js), so a method reads and
// scans the same on an invoice and at a shop's checkout.
import qrcode from 'qrcode-generator';

const { code128CModules } = require('/models/lib/paymentCodes');

const METHOD_KEYS = {
  sepa: 'billing-method-sepa', 'fi-bank': 'billing-method-fi-bank', 'swiss-qr': 'billing-method-swiss-qr',
  'bank-transfer': 'billing-method-bank-transfer', swish: 'billing-method-swish', pix: 'billing-method-pix',
  upi: 'billing-method-upi', bitcoin: 'billing-method-bitcoin', paypal: 'billing-method-paypal', link: 'billing-method-link',
  cash: 'billing-method-cash', cheque: 'billing-method-cheque', other: 'billing-method-other',
  promptpay: 'billing-method-promptpay', paynow: 'billing-method-paynow', vietqr: 'billing-method-vietqr', fps: 'billing-method-fps',
  spayd: 'billing-method-spayd', zbp: 'billing-method-zbp', mnb: 'billing-method-mnb', ips: 'billing-method-ips',
  'dk-fik': 'billing-method-dk-fik', ethereum: 'billing-method-ethereum', litecoin: 'billing-method-litecoin',
};
const FIELD_KEYS = {
  name: 'billing-field-name', iban: 'billing-field-iban', bic: 'billing-field-bic', street: 'billing-field-street',
  building: 'billing-field-building', postcode: 'billing-field-postcode', town: 'billing-field-town', country: 'billing-country',
  details: 'billing-field-details', payee: 'billing-field-payee', key: 'billing-field-pix-key', city: 'billing-field-town',
  vpa: 'billing-field-vpa', address: 'billing-field-crypto-address', user: 'billing-field-paypal-user', label: 'billing-field-label',
  url: 'billing-field-url', target: 'billing-field-promptpay-target', proxy: 'billing-field-proxy', bin: 'billing-field-bank-bin',
  account: 'billing-field-account', nip: 'billing-field-nip', creditor: 'billing-field-creditor',
};
const PLACEHOLDERS = {
  iban: 'FI21 1234 5600 0007 85', bic: 'NDEAFIHH', country: 'CH', url: '…?amount={amount}&reference={reference}', vpa: 'shop@bank',
  target: '081 234 5678', proxy: '+65 9123 4567', bin: '970436', creditor: '12345678', nip: '5260250274',
};

// The QR code of a payment, drawn from its matrix: the SVG carries modules
// only, never the payload's text.
function qrSvg(payload, swissCross) {
  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  const qr = qrcode(0, 'M');
  qr.addData(payload, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  const m = 4;
  let path = '';
  for (let r = 0; r < n; r += 1) for (let c = 0; c < n; c += 1) if (qr.isDark(r, c)) path += `M${c + m} ${r + m}h1v1h-1z`;
  const size = n + 2 * m;
  let cross = '';
  if (swissCross) {
    const s = n * 7 / 46;
    const x = m + n / 2 - s / 2;
    cross = `<rect x="${x}" y="${x}" width="${s}" height="${s}" fill="#fff"/><rect x="${x + s * 0.06}" y="${x + s * 0.06}" width="${s * 0.88}" height="${s * 0.88}" fill="#000"/>`
      + `<rect x="${x + s * 0.4}" y="${x + s * 0.2}" width="${s * 0.2}" height="${s * 0.6}" fill="#fff"/><rect x="${x + s * 0.2}" y="${x + s * 0.4}" width="${s * 0.6}" height="${s * 0.2}" fill="#fff"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="160" height="160" shape-rendering="crispEdges" role="img">`
    + `<rect width="${size}" height="${size}" fill="#fff"/><path d="${path}" fill="#000"/>${cross}</svg>`;
}

// The Finnish bank barcode: digits only, as bars.
function barcodeSvg(digits) {
  if (!/^\d{54}$/.test(String(digits))) return '';
  const modules = code128CModules(digits, 10);
  let path = '';
  for (let i = 0; i < modules.length; i += 1) if (modules[i] === '1') path += `M${i} 0h1v40h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${modules.length} 40" width="100%" height="60" preserveAspectRatio="none" shape-rendering="crispEdges" role="img">`
    + `<rect width="${modules.length}" height="40" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
}


export { METHOD_KEYS, FIELD_KEYS, PLACEHOLDERS, qrSvg, barcodeSvg };
