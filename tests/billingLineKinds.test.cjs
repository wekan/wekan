'use strict';

// Budget and billing: the kinds of an invoice line - time, fee, expense and,
// since Board View / Shop (2026-11-22), product - are one list
// (models/lib/billing.js INVOICE_LINE_KINDS). Every place that names the kinds
// must name all of them, so a new output, label or style that forgets the
// product kind fails here.
// Run: node tests/billingLineKinds.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const B = require('../models/lib/billing.js');
const shop = require('../models/lib/shop.js');
const { ublInvoiceXml } = require('../models/lib/ublInvoice.js');

test('product is a kind of invoice line, with a label', () => {
  assert.deepEqual([...B.INVOICE_LINE_KINDS], ['time', 'fee', 'expense', 'product']);
  assert.equal(B.LINE_KIND_LABEL_KEYS.product, 'billing-line-product');
  for (const kind of B.INVOICE_LINE_KINDS.filter(k => k !== 'time')) assert.ok(B.LINE_KIND_LABEL_KEYS[kind], kind);
  assert.equal(B.isInvoiceLineKind('product'), true);
  assert.equal(B.isInvoiceLineKind(undefined), true, 'a line with no kind is time');
});

test('negative: an unknown kind is still refused', () => {
  for (const kind of ['gift', 'Product', '', 'fee ', 0, null, {}]) assert.equal(B.isInvoiceLineKind(kind), false, String(kind));
  const schema = read('models/billing.js');
  const m = /'lines\.\$\.kind': \{ type: String, optional: true, allowedValues: \[([^\]]*)\] \}/.exec(schema);
  assert.ok(m, 'the schema lists the kinds');
  const listed = m[1].split(',').map(v => v.trim().replace(/^'|'$/g, ''));
  assert.deepEqual(listed, [...B.INVOICE_LINE_KINDS]);
  assert.ok(!listed.includes('gift'));
  // The shop's invoice refuses a line of a kind billing does not know.
  assert.match(read('server/lib/shopInvoice.js'), /if \(!lines\.every\(line => isInvoiceLineKind\(line\.kind\)\)\) throw new Error\('Unknown invoice line kind'\);/);
});

test('a shop invoice line is a product, and the lines add up to the net', () => {
  const order = { netMinor: 2096, vatMinor: 534, totalMinor: 2630, lines: [
    { cardId: 'a', title: 'Mug', sku: 'M-1', quantity: 2, unitMinor: 1000, lineMinor: 2000 },
    { cardId: 'b', title: 'Pen', sku: '', quantity: 3, unitMinor: 210, lineMinor: 630 },
  ] };
  const lines = shop.invoiceLinesOf(order);
  assert.deepEqual(lines.map(l => l.kind), ['product', 'product']);
  assert.deepEqual(lines.map(l => l.cardId), ['a', 'b']);
  assert.equal(lines[0].title, '2 × Mug (M-1)');
  assert.equal(lines.reduce((s, l) => s + l.amountMinor, 0), 2096, 'the lines are the net, VAT taken out');
  // Without VAT the lines are the prices, each with its unit price.
  const plain = shop.invoiceLinesOf({ ...order, netMinor: 2630, vatMinor: 0 });
  assert.deepEqual(plain.map(l => [l.quantity, l.unitMinor, l.amountMinor]), [[2, 1000, 2000], [3, 210, 630]]);
  assert.ok(!/kind: 'fee'/.test(read('models/lib/shop.js')), 'no shop line is a fee any more');
});

test('the e-invoice writes a product as its quantity of pieces at its unit price', () => {
  const profile = { issuerName: 'Shop Oy', paymentMethods: [] };
  const invoice = { number: 'INV-2026-0001', issueDate: '2026-11-22', dueDate: '2026-12-06', currency: 'EUR', customer: 'Ann',
    netMinor: 2630, vatMinor: 0, vatPercent: 0, totalMinor: 2630,
    lines: [{ kind: 'product', title: '2 × Mug', quantity: 2, unitMinor: 1000, amountMinor: 2000 },
      { kind: 'product', title: '3 × Pen', quantity: 3, amountMinor: 630 }] };
  const xml = ublInvoiceXml(invoice, profile);
  assert.match(xml, /<cbc:InvoicedQuantity unitCode="H87">2<\/cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="EUR">20\.00<\/cbc:LineExtensionAmount>/);
  assert.match(xml, /<cbc:PriceAmount currencyID="EUR">10\.00<\/cbc:PriceAmount>/);
  // No whole unit price: one unit at the line's amount, still a valid line.
  assert.match(xml, /<cbc:InvoicedQuantity unitCode="C62">1<\/cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="EUR">6\.30<\/cbc:LineExtensionAmount>/);
  // A fee is unchanged.
  const fee = ublInvoiceXml({ ...invoice, lines: [{ kind: 'fee', title: 'Launch', amountMinor: 2630 }] }, profile);
  assert.match(fee, /unitCode="C62">1</);
});

test('every place that lists the kinds of a line lists the product kind too (source scan)', () => {
  const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
    if (['node_modules', 'tests', 'data'].includes(e.name) || e.name.startsWith('.') || e.name.startsWith('_build')) return [];
    const rel = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(rel) : (/\.(c|m)?js$|\.jade$|\.css$/.test(e.name) ? [rel] : []);
  });
  const files = ['models', 'server', 'client', 'imports', 'config'].filter(d => fs.existsSync(path.join(ROOT, d))).flatMap(walk);
  // A list of kinds names the fee and the expense kinds together: as quoted
  // strings, as their label keys, or as their style classes.
  const fee = /['"]fee['"]|billing-line-fee/;
  const expense = /['"]expense['"]|billing-line-expense/;
  const product = /['"]product['"]|billing-line-product/;
  const places = [];
  const missing = [];
  for (const file of files) {
    const lines = read(file).split('\n');
    lines.forEach((line, i) => {
      const window = lines.slice(Math.max(0, i - 1), i + 2).join('\n');
      if (!(fee.test(line) && expense.test(window)) && !(expense.test(line) && fee.test(window))) return;
      places.push(`${file}:${i + 1}`);
      if (!product.test(lines.slice(Math.max(0, i - 2), i + 3).join('\n'))) missing.push(`${file}:${i + 1}`);
    });
  }
  assert.ok(places.length >= 3, `the scan finds the lists (${places.join(', ')})`);
  assert.deepEqual(missing, [], 'these list the kinds of a line without product');
});

test('the product label is translated in every language', () => {
  for (const file of fs.readdirSync(path.join(ROOT, 'imports/i18n/data'))) {
    const data = JSON.parse(read(`imports/i18n/data/${file}`));
    assert.ok(typeof data['billing-line-product'] === 'string' && data['billing-line-product'].trim(), file);
    assert.ok(!/__\w+__/.test(data['billing-line-product']), `${file}: no placeholder`);
  }
});
