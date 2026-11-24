// The files of an invoice (docs/Features/Billing/README.md): PDF, Excel, CSV
// and UBL. Every label is in the requesting user's language; the payment
// codes (QR codes, the Finnish bank barcode) are drawn as vectors, so they
// print sharp at any size.
import PDFDocument from 'pdfkit';
import qrcode from 'qrcode-generator';
import { TAPi18n } from '/imports/i18n';
import { createWorkbook } from '/models/server/createWorkbook';
const { formatMoney } = require('/models/lib/billing');
const { fromMinorUnits, minorToText, minorUnits } = require('/models/lib/currencies');
const { code128CModules, formatReference, formatIban } = require('/models/lib/paymentCodes');
const { ublInvoiceXml } = require('/models/lib/ublInvoice');

const LABEL_KEYS = [
  'billing-invoice', 'billing-credit-note', 'billing-number', 'billing-issue-date', 'billing-due-date', 'billing-customer',
  'billing-reference', 'billing-payment-reference', 'billing-period', 'card', 'person', 'hours', 'billing-hourly-rate',
  'billing-amount', 'billing-net', 'billing-vat', 'billing-total', 'billing-paid', 'billing-amount-due', 'billing-business-id',
  'billing-vat-id', 'billing-payment-methods', 'billing-penalty-interest', 'billing-reverse-charge', 'billing-credit-of',
  'billing-pay-by-scanning', 'billing-quote', 'billing-valid-until',
];

// The title of the document: an invoice, a credit note or a quote.
function titleKey(invoice) {
  if (invoice.kind === 'credit') return 'billing-credit-note';
  return invoice.kind === 'quote' ? 'billing-quote' : 'billing-invoice';
}

// The third line of the document's details: what a credit note credits, when
// a quote is valid until, or when an invoice is due.
function dueRow(invoice, labels) {
  if (invoice.kind === 'credit') return [labels['billing-credit-of'], invoice.creditOfNumber];
  return [labels[invoice.kind === 'quote' ? 'billing-valid-until' : 'billing-due-date'], invoice.dueDate];
}

// A fee or an expense has no hours or rate: those cells are empty.
function hoursText(line) {
  return typeof line.rateMinor === 'number' ? String(line.hours) : '';
}

export function invoiceLabels(language) {
  const out = {};
  for (const key of LABEL_KEYS) {
    let value = key;
    try { value = TAPi18n.__(key, '', language || 'en'); } catch (e) { /* the key itself */ }
    out[key] = value && value !== key ? value : key;
  }
  return out;
}

function qrMatrix(payload) {
  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  const qr = qrcode(0, 'M');
  qr.addData(payload, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  return { n, dark: (r, c) => qr.isDark(r, c) };
}

function drawQr(pdf, payload, x, y, size, { swissCross = false } = {}) {
  const { n, dark } = qrMatrix(payload);
  const cell = size / n;
  pdf.save().fillColor('#000000');
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) if (dark(r, c)) pdf.rect(x + c * cell, y + r * cell, cell + 0.05, cell + 0.05).fill();
  }
  if (swissCross) {
    // The Swiss cross of the QR-bill: 7 mm in a 46 mm code.
    const s = size * 7 / 46;
    const cx = x + size / 2 - s / 2;
    const cy = y + size / 2 - s / 2;
    pdf.rect(cx, cy, s, s).fill('#ffffff');
    pdf.rect(cx + s * 0.06, cy + s * 0.06, s * 0.88, s * 0.88).fill('#000000');
    pdf.rect(cx + s * 0.4, cy + s * 0.2, s * 0.2, s * 0.6).fill('#ffffff');
    pdf.rect(cx + s * 0.2, cy + s * 0.4, s * 0.6, s * 0.2).fill('#ffffff');
  }
  pdf.restore();
}

function drawBarcode(pdf, digits, x, y, width, height) {
  const modules = code128CModules(digits, 10);
  const w = width / modules.length;
  pdf.save().fillColor('#000000');
  for (let i = 0; i < modules.length; i += 1) if (modules[i] === '1') pdf.rect(x + i * w, y, w + 0.02, height).fill();
  pdf.restore();
  pdf.fontSize(7).text(digits, x, y + height + 2, { width, align: 'center' });
}

function money(minor, invoice, locale) {
  const sign = invoice.kind === 'credit' && minor ? -1 : 1;
  return formatMoney(sign * minor, invoice.currency, locale) || `${minorToText(sign * minor, invoice.currency)} ${invoice.currency}`;
}

/**
 * The invoice as a PDF (A4), with the payment codes of its methods.
 * @param {Object} fonts { main, upper } unifont buffers
 */
export function invoicePdf(invoice, profile, instructions, labels, fonts, locale) {
  return new Promise((resolve, reject) => {
    // Started with the Unicode font, as models/server/buildUnicodePdf.js is:
    // otherwise PDFKit opens its built-in Helvetica first, which a production
    // bundle does not carry ("Cannot find module '#standard-fonts/Helvetica'"),
    // and no invoice PDF could be made.
    const pdf = new PDFDocument({ size: 'A4', margin: 50, font: Buffer.from(fonts.main),
      info: { Title: `${labels[titleKey(invoice)]} ${invoice.number}` } });
    const chunks = [];
    pdf.on('data', chunk => chunks.push(chunk));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);
    pdf.registerFont('main', Buffer.from(fonts.main));
    pdf.font('main');
    const left = 50;
    const width = pdf.page.width - 100;
    const title = labels[titleKey(invoice)];

    pdf.fontSize(20).text(title, left, 50);
    pdf.fontSize(10).text(profile.issuerName || '', left, 80);
    for (const l of String(profile.issuerAddress || '').split(/\r?\n/)) if (l.trim()) pdf.text(l.trim());
    if (profile.businessId) pdf.text(`${labels['billing-business-id']}: ${profile.businessId}`);
    if (profile.vatId) pdf.text(`${labels['billing-vat-id']}: ${profile.vatId}`);
    for (const v of [profile.email, profile.phone, profile.website]) if (v) pdf.text(v);

    const metaX = left + width / 2;
    let y = 80;
    const meta = [
      [labels['billing-number'], invoice.number],
      [labels['billing-issue-date'], invoice.issueDate],
      dueRow(invoice, labels),
      [labels['billing-payment-reference'], invoice.paymentReference ? formatReference(invoice.paymentReference) : ''],
      [labels['billing-reference'], invoice.reference],
      [labels['billing-period'], invoice.periodStart || invoice.periodEnd ? `${invoice.periodStart || ''} – ${invoice.periodEnd || ''}` : ''],
    ].filter(([, v]) => v);
    for (const [k, v] of meta) {
      pdf.fontSize(9).text(k, metaX, y, { width: 110 });
      pdf.fontSize(10).text(String(v), metaX + 115, y, { width: width / 2 - 115 });
      y += 16;
    }

    y = Math.max(pdf.y, y) + 20;
    pdf.fontSize(9).text(labels['billing-customer'], left, y);
    pdf.fontSize(10);
    for (const l of String(invoice.customer || '').split(/\r?\n/)) if (l.trim()) pdf.text(l.trim(), left);
    if (invoice.customerVatId) pdf.text(`${labels['billing-vat-id']}: ${invoice.customerVatId}`, left);

    // The lines.
    y = pdf.y + 20;
    const cols = [{ k: 'card', w: 0.4 }, { k: 'person', w: 0.2 }, { k: 'hours', w: 0.1, right: true },
      { k: 'billing-hourly-rate', w: 0.15, right: true }, { k: 'billing-amount', w: 0.15, right: true }];
    const header = () => {
      let x = left;
      pdf.fontSize(9);
      for (const c of cols) { pdf.text(labels[c.k], x, y, { width: width * c.w - 4, align: c.right ? 'right' : 'left' }); x += width * c.w; }
      y += 14;
      pdf.moveTo(left, y - 2).lineTo(left + width, y - 2).stroke();
    };
    header();
    for (const line of invoice.lines || []) {
      if (y > pdf.page.height - 150) { pdf.addPage(); y = 50; header(); }
      const cells = [line.title + (line.firstDate ? `\n${line.firstDate}${line.lastDate && line.lastDate !== line.firstDate ? ` – ${line.lastDate}` : ''}` : ''),
        line.name || '', hoursText(line), hoursText(line) ? money(line.rateMinor, { ...invoice, kind: '' }, locale) : '', money(line.amountMinor, invoice, locale)];
      let x = left;
      let h = 0;
      pdf.fontSize(9);
      cells.forEach((cell, i) => {
        const opts = { width: width * cols[i].w - 4, align: cols[i].right ? 'right' : 'left' };
        pdf.text(cell, x, y, opts);
        h = Math.max(h, pdf.heightOfString(cell, opts));
        x += width * cols[i].w;
      });
      y += h + 4;
    }
    pdf.moveTo(left, y).lineTo(left + width, y).stroke();
    y += 6;
    const totals = [
      [labels['billing-net'], invoice.netMinor],
      [`${labels['billing-vat']} ${invoice.vatPercent || 0} %`, invoice.vatMinor || 0],
      [labels['billing-total'], invoice.totalMinor],
    ];
    if (invoice.paidMinor) totals.push([labels['billing-paid'], invoice.paidMinor], [labels['billing-amount-due'], invoice.amountDueMinor]);
    for (const [k, v] of totals) {
      pdf.fontSize(10).text(k, left + width * 0.5, y, { width: width * 0.3 });
      pdf.text(money(v, invoice, locale), left + width * 0.8, y, { width: width * 0.2, align: 'right' });
      y += 15;
    }
    if (invoice.reverseCharge) { pdf.fontSize(9).text(labels['billing-reverse-charge'], left, y); y += 14; }
    if (profile.penaltyInterestPercent && !['credit', 'quote'].includes(invoice.kind)) {
      pdf.fontSize(9).text(`${labels['billing-penalty-interest']}: ${profile.penaltyInterestPercent} %`, left, y); y += 14;
    }
    if (invoice.notes) { pdf.fontSize(9).text(invoice.notes, left, y + 4, { width }); y = pdf.y + 6; }

    // Payment methods, with their codes.
    const usable = (instructions || []).filter(i => !i.error);
    if (usable.length && invoice.kind !== 'credit') {
      if (y > pdf.page.height - 250) { pdf.addPage(); y = 50; }
      y += 10;
      pdf.fontSize(11).text(labels['billing-payment-methods'], left, y);
      y += 18;
      for (const item of usable) {
        if (y > pdf.page.height - 160) { pdf.addPage(); y = 50; }
        const top = y;
        pdf.fontSize(10).text(item.method.label || item.method.type.toUpperCase(), left, y, { width: width * 0.6 });
        for (const l of item.lines || []) pdf.fontSize(9).text(l, left, pdf.y, { width: width * 0.6 });
        if (item.link) pdf.fontSize(8).fillColor('#0645ad').text(item.link, left, pdf.y, { width: width * 0.6, link: item.link }).fillColor('#000000');
        let bottom = pdf.y;
        if (item.qr) {
          drawQr(pdf, item.qr, left + width - 110, top, 110, { swissCross: item.swissCross });
          pdf.fontSize(7).text(labels['billing-pay-by-scanning'], left + width - 110, top + 112, { width: 110, align: 'center' });
          bottom = Math.max(bottom, top + 125);
        }
        if (item.barcode) {
          drawBarcode(pdf, item.barcode, left, bottom + 6, Math.min(width * 0.75, 380), 40);
          bottom += 60;
        }
        y = bottom + 14;
      }
    }
    if (profile.footer) pdf.fontSize(8).text(profile.footer, left, pdf.page.height - 70, { width, align: 'center' });
    pdf.end();
  });
}

/** The invoice as an Excel workbook: the invoice sheet, and its lines as a table. */
export async function invoiceXlsx(invoice, profile, labels) {
  const workbook = createWorkbook();
  const sheet = workbook.addWorksheet(invoice.number.slice(0, 31));
  const sign = invoice.kind === 'credit' ? -1 : 1;
  const digits = minorUnits(invoice.currency);
  const cur = `#,##0${digits ? `.${'0'.repeat(digits)}` : ''} "${invoice.currency}"`;
  const major = minor => fromMinorUnits(minor, invoice.currency);
  // Widths one by one: sheet.columns = [...] would add an empty header row.
  [40, 24, 10, 14, 16].forEach((width, i) => { sheet.getColumn(i + 1).width = width; });
  sheet.addRow([labels[titleKey(invoice)], invoice.number]).font = { bold: true, size: 14 };
  for (const [k, v] of [
    [profile.issuerName, profile.businessId ? `${labels['billing-business-id']} ${profile.businessId}` : ''],
    [labels['billing-issue-date'], invoice.issueDate],
    dueRow(invoice, labels),
    [labels['billing-payment-reference'], invoice.paymentReference ? formatReference(invoice.paymentReference) : ''],
    [labels['billing-reference'], invoice.reference || ''],
    [labels['billing-customer'], String(invoice.customer || '').replace(/\r?\n/g, ', ')],
  ]) if (k || v) sheet.addRow([k, v]);
  sheet.addRow([]);
  const head = sheet.addRow([labels.card, labels.person, labels.hours, labels['billing-hourly-rate'], labels['billing-amount']]);
  head.font = { bold: true };
  for (const line of invoice.lines || []) {
    const timed = typeof line.rateMinor === 'number';
    const row = sheet.addRow([line.title, line.name || '', timed ? line.hours : '', timed ? major(line.rateMinor) : '', sign * major(line.amountMinor)]);
    row.getCell(4).numFmt = cur;
    row.getCell(5).numFmt = cur;
  }
  sheet.addRow([]);
  for (const [k, v] of [[labels['billing-net'], invoice.netMinor], [`${labels['billing-vat']} ${invoice.vatPercent || 0} %`, invoice.vatMinor || 0],
    [labels['billing-total'], invoice.totalMinor], [labels['billing-paid'], invoice.paidMinor || 0], [labels['billing-amount-due'], invoice.amountDueMinor]]) {
    const row = sheet.addRow(['', '', '', k, sign * major(v)]);
    row.getCell(5).numFmt = cur;
    row.font = { bold: k === labels['billing-total'] };
  }
  const methods = (profile.paymentMethods || []).filter(m => m.iban);
  for (const m of methods) sheet.addRow([m.name || '', formatIban(m.iban), '', m.bic || '']);
  // Text cells that begin like a formula are kept as text by exceljs (they are
  // strings, not { formula }), so nothing in a title runs.
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// ---------------------------------------------------------------- SVG

function svgText(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
}

// A line no wider than about `chars` characters, as several lines.
function wrap(value, chars) {
  const out = [];
  for (const paragraph of String(value || '').split(/\r?\n/)) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if ((`${line} ${word}`).trim().length > chars && line) { out.push(line); line = word; } else line = `${line} ${word}`.trim();
    }
    out.push(line);
  }
  return out;
}

/**
 * The invoice as one SVG document, A4 wide (210 mm) and as long as it needs:
 * text as text - selectable, searchable, translatable by a reader - and the
 * payment codes as vector paths. Nothing a user wrote becomes markup.
 */
export function invoiceSvg(invoice, profile, instructions, labels, locale) {
  const W = 595; // A4 width in points
  const L = 40;
  const els = [];
  let y = 50;
  const text = (x, value, { size = 9, bold = false, anchor = 'start', color = '#000' } = {}) => {
    els.push(`<text x="${x}" y="${y}" font-size="${size}"${bold ? ' font-weight="bold"' : ''}${anchor !== 'start' ? ` text-anchor="${anchor}"` : ''} fill="${color}">${svgText(value)}</text>`);
  };
  const title = labels[titleKey(invoice)];
  text(L, title, { size: 20, bold: true });
  const metaTop = y;
  y += 24;
  for (const l of [profile.issuerName, ...String(profile.issuerAddress || '').split(/\r?\n/),
    profile.businessId ? `${labels['billing-business-id']}: ${profile.businessId}` : '',
    profile.vatId ? `${labels['billing-vat-id']}: ${profile.vatId}` : '', profile.email, profile.phone, profile.website].filter(v => v && String(v).trim())) {
    text(L, String(l).trim()); y += 12;
  }
  const leftEnd = y;
  y = metaTop + 24;
  for (const [k, v] of [
    [labels['billing-number'], invoice.number], [labels['billing-issue-date'], invoice.issueDate],
    dueRow(invoice, labels),
    [labels['billing-payment-reference'], invoice.paymentReference ? formatReference(invoice.paymentReference) : ''],
    [labels['billing-reference'], invoice.reference],
    [labels['billing-period'], invoice.periodStart || invoice.periodEnd ? `${invoice.periodStart || ''} – ${invoice.periodEnd || ''}` : ''],
  ].filter(([, v]) => v)) {
    text(320, k, { size: 8, color: '#555' }); text(420, v); y += 14;
  }
  y = Math.max(y, leftEnd) + 18;
  text(L, labels['billing-customer'], { size: 8, color: '#555' }); y += 12;
  for (const l of String(invoice.customer || '').split(/\r?\n/).filter(v => v.trim())) { text(L, l.trim(), { size: 10 }); y += 13; }
  if (invoice.customerVatId) { text(L, `${labels['billing-vat-id']}: ${invoice.customerVatId}`); y += 13; }

  y += 14;
  const cols = [[L, labels.card, 'start'], [300, labels.person, 'start'], [420, labels.hours, 'end'], [490, labels['billing-hourly-rate'], 'end'], [W - L, labels['billing-amount'], 'end']];
  for (const [x, label, anchor] of cols) text(x, label, { size: 8, bold: true, anchor });
  y += 5;
  els.push(`<line x1="${L}" y1="${y}" x2="${W - L}" y2="${y}" stroke="#000" stroke-width="0.6"/>`);
  y += 12;
  for (const line of invoice.lines || []) {
    const titleLines = wrap(line.title, 50);
    if (line.firstDate) titleLines.push(`${line.firstDate}${line.lastDate && line.lastDate !== line.firstDate ? ` – ${line.lastDate}` : ''}`);
    const startY = y;
    titleLines.forEach((t, i) => { text(L, t, { size: 9, color: i === titleLines.length - 1 && line.firstDate ? '#555' : '#000' }); y += 11; });
    const endY = y;
    y = startY;
    text(300, line.name || '');
    text(420, hoursText(line), { anchor: 'end' });
    if (hoursText(line)) text(490, money(line.rateMinor, { ...invoice, kind: '' }, locale), { anchor: 'end' });
    text(W - L, money(line.amountMinor, invoice, locale), { anchor: 'end' });
    y = endY + 3;
  }
  els.push(`<line x1="${L}" y1="${y - 6}" x2="${W - L}" y2="${y - 6}" stroke="#000" stroke-width="0.6"/>`);
  y += 6;
  const totals = [[labels['billing-net'], invoice.netMinor], [`${labels['billing-vat']} ${invoice.vatPercent || 0} %`, invoice.vatMinor || 0],
    [labels['billing-total'], invoice.totalMinor]];
  if (invoice.paidMinor) totals.push([labels['billing-paid'], invoice.paidMinor], [labels['billing-amount-due'], invoice.amountDueMinor]);
  for (const [k, v] of totals) {
    const bold = k === labels['billing-total'];
    text(420, k, { anchor: 'end', bold }); text(W - L, money(v, invoice, locale), { anchor: 'end', bold }); y += 14;
  }
  if (invoice.reverseCharge) { text(L, labels['billing-reverse-charge']); y += 13; }
  if (profile.penaltyInterestPercent && !['credit', 'quote'].includes(invoice.kind)) { text(L, `${labels['billing-penalty-interest']}: ${profile.penaltyInterestPercent} %`); y += 13; }
  for (const l of wrap(invoice.notes, 100)) { if (l) { text(L, l); y += 12; } }

  const usable = (instructions || []).filter(i => !i.error);
  if (usable.length && invoice.kind !== 'credit') {
    y += 16;
    text(L, labels['billing-payment-methods'], { size: 11, bold: true });
    y += 16;
    for (const item of usable) {
      const top = y;
      text(L, item.method.label || item.method.type.toUpperCase(), { size: 10, bold: true }); y += 13;
      for (const l of item.lines || []) { text(L, l); y += 12; }
      if (item.link) { for (const l of wrap(item.link, 80)) { text(L, l, { size: 7, color: '#0645ad' }); y += 10; } }
      let bottom = y;
      if (item.qr) {
        const { n, dark } = qrMatrix(item.qr);
        const size = 110;
        const cell = size / n;
        const x0 = W - L - size;
        let d = '';
        for (let r = 0; r < n; r += 1) for (let c = 0; c < n; c += 1) if (dark(r, c)) d += `M${(x0 + c * cell).toFixed(2)} ${(top - 8 + r * cell).toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h-${cell.toFixed(2)}z`;
        els.push(`<path d="${d}" fill="#000"/>`);
        if (item.swissCross) {
          const s = size * 7 / 46;
          const cx = x0 + size / 2 - s / 2;
          const cy = top - 8 + size / 2 - s / 2;
          els.push(`<rect x="${cx}" y="${cy}" width="${s}" height="${s}" fill="#fff"/><rect x="${cx + s * 0.06}" y="${cy + s * 0.06}" width="${s * 0.88}" height="${s * 0.88}" fill="#000"/>`
            + `<rect x="${cx + s * 0.4}" y="${cy + s * 0.2}" width="${s * 0.2}" height="${s * 0.6}" fill="#fff"/><rect x="${cx + s * 0.2}" y="${cy + s * 0.4}" width="${s * 0.6}" height="${s * 0.2}" fill="#fff"/>`);
        }
        const saved = y;
        y = top - 8 + size + 10;
        text(x0 + size / 2, labels['billing-pay-by-scanning'], { size: 6, anchor: 'middle' });
        y = saved;
        bottom = Math.max(bottom, top - 8 + size + 16);
      }
      if (item.barcode) {
        const modules = code128CModules(item.barcode, 10);
        const width = 380;
        const w = width / modules.length;
        let d = '';
        for (let i = 0; i < modules.length; i += 1) if (modules[i] === '1') d += `M${(L + i * w).toFixed(3)} ${bottom + 6}h${w.toFixed(3)}v40h-${w.toFixed(3)}z`;
        els.push(`<path d="${d}" fill="#000"/>`);
        y = bottom + 56;
        text(L + width / 2, item.barcode, { size: 7, anchor: 'middle' });
        bottom = y + 4;
      }
      y = bottom + 14;
    }
  }
  if (profile.footer) { y += 10; for (const l of wrap(profile.footer, 110)) { text(W / 2, l, { size: 8, anchor: 'middle', color: '#555' }); y += 11; } }
  const H = Math.max(842, Math.ceil(y + 40)); // at least an A4 page
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="${(H * 210 / W).toFixed(1)}mm" viewBox="0 0 ${W} ${H}"`
    + ` font-family="DejaVu Sans, Arial, Helvetica, sans-serif">\n<title>${svgText(`${title} ${invoice.number}`)}</title>\n`
    + `<rect width="${W}" height="${H}" fill="#fff"/>\n${els.join('\n')}\n</svg>\n`;
}

export function invoiceUbl(invoice, profile) {
  return ublInvoiceXml(invoice, profile);
}
