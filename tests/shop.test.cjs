'use strict';

// Board View / Shop (models/lib/shop.js, server/shop.js,
// docs/Features/Board-Header/Board-Views/Shop.md): products from the cards,
// the cart priced from the cards and never from the browser, the payment
// methods of Budget and billing, the checkout gate, the order card's text and
// the one public view a board opens in.
// Run: node tests/shop.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const shop = require('../models/lib/shop.js');
const bvs = require('../models/lib/boardViewSettings.js');

const PRICE = 'fPrice';
const SKU = 'fSku';
const STOCK = 'fStock';
const settings = extra => ({
  ...shop.defaultShopSettings(),
  enabled: true, priceFieldId: PRICE, skuFieldId: SKU, stockFieldId: STOCK, ordersBoardId: 'orders', ordersListId: 'lOrders',
  paymentMethods: [
    { id: 'sepa1', enabled: true, method: { type: 'sepa', name: 'Shop Oy', iban: 'FI2112345600000785', bic: '' } },
    { id: 'cash1', enabled: false, method: { type: 'cash', details: 'At the counter' } },
  ],
  ...extra,
});
const card = (id, listId, price, extra = {}) => ({
  _id: id, title: `Card ${id}`, listId, sort: extra.sort || 0, archived: false, type: 'cardType-card',
  customFields: [{ _id: PRICE, value: price }, ...(extra.fields || [])], labelIds: extra.labelIds || [], description: extra.description || '',
  ...extra.card,
});
const lists = [
  { _id: 'lA', title: 'Shirts', sort: 0 },
  { _id: 'lB', title: 'Mugs', sort: 1 },
  { _id: 'lOrders', title: 'Orders', sort: 2 },
  { _id: 'lOld', title: 'Old', sort: 3, archived: true },
];

test('a product is a card with a price, in a list on sale, in board order', () => {
  const cards = [
    card('b1', 'lB', 7.5),
    card('a2', 'lA', '19,90', { sort: 2 }),
    card('a1', 'lA', 10, { sort: 1, fields: [{ _id: SKU, value: 'TS-1' }, { _id: STOCK, value: 3 }] }),
    card('nop', 'lA', ''), // no price: not a product
    card('neg', 'lA', -1), // a negative price is no price
    card('txt', 'lA', 'free'),
    card('arch', 'lA', 5, { card: { archived: true } }),
    card('ord', 'lOrders', 5), // the Orders list is never on sale by default
    card('old', 'lOld', 5), // an archived list is not either
    card('link', 'lA', 5, { card: { type: 'cardType-linkedCard' } }),
  ];
  const products = shop.productsOf({ lists, cards }, settings());
  assert.deepEqual(products.map(p => p._id), ['a1', 'a2', 'b1']);
  const [a1, a2, b1] = products;
  assert.deepEqual([a1.priceMinor, a2.priceMinor, b1.priceMinor], [1000, 1990, 750]);
  assert.equal(a1.sku, 'TS-1');
  assert.equal(a1.stock, 3);
  assert.equal(a2.stock, null, 'no stock value: not counted');
  // Ticked lists only, when any is ticked.
  assert.deepEqual(shop.productsOf({ lists, cards }, settings({ saleListIds: ['lB'] })).map(p => p._id), ['b1']);
  // No price field mapped: no products at all.
  assert.deepEqual(shop.productsOf({ lists, cards }, settings({ priceFieldId: '' })), []);
});

test('prices are integers of the currency\'s minor unit, never floats', () => {
  assert.equal(shop.priceMinorOf(0.1 + 0.2, 'EUR'), 30);
  assert.equal(shop.priceMinorOf('12.345', 'KWD'), 12345);
  assert.equal(shop.priceMinorOf(1000, 'JPY'), 1000);
  assert.equal(shop.priceMinorOf('1e3', 'EUR'), null, 'only plain decimals are read from text');
  assert.equal(shop.priceMinorOf(Infinity, 'EUR'), null);
  assert.equal(shop.priceMinorOf(2e9, 'EUR'), null, 'too large');
  assert.equal(shop.stockOf('4'), 4);
  assert.equal(shop.stockOf(-2), 0);
  assert.equal(shop.stockOf(''), null);
});

test('categories are the labels the products carry, the ticked ones when any are', () => {
  const cards = [card('a', 'lA', 1, { labelIds: ['red', 'blue'] }), card('b', 'lA', 1, { labelIds: ['blue'] })];
  const labels = [{ _id: 'red', name: 'Sale', color: 'red' }, { _id: 'blue', name: 'Cotton', color: 'blue' }, { _id: 'green', name: 'Unused', color: 'green' }];
  const products = shop.productsOf({ lists, cards }, settings());
  assert.deepEqual(shop.categoriesOf(products, labels, settings()).map(l => l._id), ['red', 'blue']);
  assert.deepEqual(shop.categoriesOf(products, labels, settings({ categoryLabelIds: ['blue'] })).map(l => l._id), ['blue']);
  assert.deepEqual(shop.productsInCategory(products, 'red').map(p => p._id), ['a']);
  assert.deepEqual(shop.productsInCategory(products, '').map(p => p._id), ['a', 'b']);
});

test('the cart is priced from the products, with VAT taken out of or added to the prices', () => {
  const products = shop.productsOf({ lists, cards: [card('a', 'lA', 12.4), card('b', 'lB', 0.5)] }, settings());
  const items = [{ cardId: 'a', quantity: 2 }, { cardId: 'b', quantity: 3 }];
  const plain = shop.priceCart(items, products, settings());
  assert.deepEqual(plain.lines.map(l => l.lineMinor), [2480, 150]);
  assert.deepEqual([plain.netMinor, plain.vatMinor, plain.totalMinor, plain.currency], [2630, 0, 2630, 'EUR']);
  const incl = shop.priceCart(items, products, settings({ vatPercent: 25.5 }));
  // 2630 * 25.5 / 125.5 = 534.38 -> 534.
  assert.deepEqual([incl.netMinor, incl.vatMinor, incl.totalMinor], [2096, 534, 2630]);
  const excl = shop.priceCart(items, products, settings({ vatPercent: 24, pricesIncludeVat: false }));
  assert.deepEqual([excl.netMinor, excl.vatMinor, excl.totalMinor], [2630, 631, 3261]);
});

test('negative: a price, a total or a title sent with the cart is not read', () => {
  const products = shop.productsOf({ lists, cards: [card('a', 'lA', 100)] }, settings());
  const sent = [{ cardId: 'a', quantity: 1, priceMinor: 1, unitMinor: 1, lineMinor: 1, title: 'Free', totalMinor: 1 }];
  const cart = shop.normalizeCart(sent);
  assert.equal(cart.tampered, true, 'reported, so the server records it');
  assert.deepEqual(cart.items, [{ cardId: 'a', quantity: 1 }], 'only the card and the quantity are kept');
  const priced = shop.priceCart(cart.items, products, settings());
  assert.equal(priced.totalMinor, 10000, 'priced from the card');
  assert.equal(shop.normalizeCart([{ cardId: 'a', quantity: 1 }]).tampered, false);
  // The same card twice is added together, never two lines with two prices.
  assert.deepEqual(shop.normalizeCart([{ cardId: 'a', quantity: 2 }, { cardId: 'a', quantity: 3 }]).items, [{ cardId: 'a', quantity: 5 }]);
  for (const bad of [{}, null, 'x', [{ cardId: 'a', quantity: 0 }], [{ cardId: 'a', quantity: 1.5 }], [{ cardId: 'a', quantity: 1000 }],
    [{ cardId: { $ne: 1 }, quantity: 1 }], [{ cardId: 'a b', quantity: 1 }], new Array(101).fill({ cardId: 'a', quantity: 1 })]) {
    assert.throws(() => shop.normalizeCart(bad), undefined, JSON.stringify(bad).slice(0, 60));
  }
});

test('negative: what is not for sale, sold out or short of stock is refused', () => {
  const cards = [card('a', 'lA', 5, { fields: [{ _id: STOCK, value: 2 }] }), card('z', 'lA', 5, { fields: [{ _id: STOCK, value: 0 }] }),
    card('o', 'lOrders', 5)];
  const products = shop.productsOf({ lists, cards }, settings());
  assert.equal(shop.priceCart([], products, settings()).error, 'shop-cart-empty');
  assert.equal(shop.priceCart([{ cardId: 'o', quantity: 1 }], products, settings()).error, 'shop-not-for-sale');
  assert.equal(shop.priceCart([{ cardId: 'missing', quantity: 1 }], products, settings()).error, 'shop-not-for-sale');
  assert.equal(shop.priceCart([{ cardId: 'z', quantity: 1 }], products, settings()).error, 'shop-sold-out');
  assert.equal(shop.priceCart([{ cardId: 'a', quantity: 3 }], products, settings()).error, 'shop-not-enough-stock');
  assert.equal(shop.priceCart([{ cardId: 'a', quantity: 2 }], products, settings()).totalMinor, 1000);
});

test('the payment methods are Budget and billing\'s, and only the ones switched on are offered', () => {
  const s = settings();
  assert.deepEqual(shop.enabledPaymentMethods(s).map(m => m.id), ['sepa1']);
  assert.equal(shop.paymentMethodFor(s, 'sepa1').method.type, 'sepa');
  // Negative: switched off, unknown, or not a string.
  assert.equal(shop.paymentMethodFor(s, 'cash1'), null);
  assert.equal(shop.paymentMethodFor(s, 'nope'), null);
  assert.equal(shop.paymentMethodFor(s, { $ne: '' }), null);
  // The instructions are Budget and billing's: a SEPA QR code for the total, with the RF reference.
  const reference = shop.orderReference(2026, 7, 'rf');
  const order = { number: shop.orderNumber(2026, 7), reference, totalMinor: 2630, currency: 'EUR' };
  assert.equal(order.number, 'ORD-2026-00007');
  assert.match(reference, /^RF\d{2}202600007\d$/, 'the RF form of the Finnish reference of year and number');
  const pay = shop.orderPaymentInstructions(shop.paymentMethodFor(s, 'sepa1'), order, 'Shop');
  assert.match(pay.qr, /^BCD\n002\n1\nSCT\n/);
  assert.match(pay.qr, /\nEUR26\.30\n/);
  assert.ok(pay.qr.includes(reference));
  // A method that does not fit the currency says why rather than drawing a wrong code.
  assert.match(shop.orderPaymentInstructions(shop.paymentMethodFor(s, 'sepa1'), { ...order, currency: 'USD' }, '').error, /EUR/);
  // The reference types are Budget and billing's.
  assert.equal(shop.orderReference(2026, 7, 'none'), '');
  assert.match(shop.orderReference(2026, 7, 'fi'), /^202600007\d$/);
});

test('settings are checked: unknown keys, bad values and unvalidated payment methods are refused', () => {
  const ok = shop.normalizeShopSettings({ enabled: true, currency: 'eur', vatPercent: '24', termsUrl: 'https://example.com/terms',
    paymentMethods: [{ id: 'm1', enabled: true, method: { type: 'sepa', name: 'Shop', iban: 'FI21 1234 5600 0007 85', bic: '' } }] });
  assert.equal(ok.currency, 'EUR');
  assert.equal(ok.vatPercent, 24);
  assert.equal(ok.paymentMethods[0].method.iban, 'FI2112345600000785', 'normalised by paymentCodes');
  const refused = [
    { nope: 1 },
    { enabled: 'yes' },
    { currency: 'EURO' },
    { vatPercent: 101 },
    { termsUrl: 'javascript:alert(1)' },
    { termsUrl: 'data:text/html,x' },
    { title: 'a\u0000b' },
    { title: 'x'.repeat(201) },
    { priceFieldId: { $ne: '' } },
    { saleListIds: 'lA' },
    { referenceType: 'xx' },
    { paymentMethods: [{ id: 'm1', method: { type: 'sepa', name: 'Shop', iban: 'FI00 0000', bic: '' } }] },
    { paymentMethods: [{ id: 'm1', method: { type: 'card-gateway' } }] },
    { paymentMethods: [{ id: 'm1', method: { type: 'cash', details: '' } }, { id: 'm1', method: { type: 'cash', details: '' } }] },
    { paymentMethods: [{ id: 'm1', method: { type: 'cash', details: '', script: 'x' } }] },
  ];
  for (const input of refused) assert.throws(() => shop.normalizeShopSettings(input), undefined, JSON.stringify(input));
});

test('settings are checked against the board: its fields, lists and labels, and a private orders board', () => {
  const board = { _id: 'b', permission: 'public', labels: [{ _id: 'red' }] };
  const customFields = [
    { _id: PRICE, type: 'currency', settings: { currencyCode: 'SEK' } },
    { _id: SKU, type: 'text' },
    { _id: STOCK, type: 'number' },
    { _id: 'fDate', type: 'date' },
  ];
  const ordersBoard = { _id: 'orders', permission: 'private', archived: false };
  const base = { ...shop.normalizeShopSettings({ priceFieldId: PRICE, skuFieldId: SKU, stockFieldId: STOCK, saleListIds: ['lA'], categoryLabelIds: ['red'] }),
    ordersBoardId: 'orders', ordersListId: 'lOrders' };
  const ctx = { board, customFields, lists, ordersBoard, ordersLists: [{ _id: 'lOrders' }] };
  const out = shop.checkShopSettingsAgainstBoard(base, ctx);
  assert.equal(out.currency, 'SEK', 'a Currency price field fixes the currency');
  assert.throws(() => shop.checkShopSettingsAgainstBoard({ ...base, priceFieldId: 'fDate' }, ctx), /date/);
  assert.throws(() => shop.checkShopSettingsAgainstBoard({ ...base, stockFieldId: SKU }, ctx), /stockFieldId/);
  assert.throws(() => shop.checkShopSettingsAgainstBoard({ ...base, priceFieldId: 'other' }, ctx), /not a custom field/);
  assert.throws(() => shop.checkShopSettingsAgainstBoard({ ...base, saleListIds: ['elsewhere'] }, ctx), /saleListIds/);
  assert.throws(() => shop.checkShopSettingsAgainstBoard({ ...base, categoryLabelIds: ['blue'] }, ctx), /categoryLabelIds/);
  // Negative: orders - names and addresses - never on a public or 'instance' board.
  for (const permission of ['public', 'instance']) {
    assert.throws(() => shop.checkShopSettingsAgainstBoard(base, { ...ctx, ordersBoard: { ...ordersBoard, permission } }), /private/);
  }
  assert.throws(() => shop.checkShopSettingsAgainstBoard(base, { ...ctx, ordersBoard: null }), /admin/);
  assert.throws(() => shop.checkShopSettingsAgainstBoard({ ...base, ordersListId: 'lA' }, { ...ctx, ordersLists: [{ _id: 'lOrders' }] }), /ordersListId/);
  assert.equal(shop.checkShopSettingsAgainstBoard({ ...base, ordersListId: '' }, ctx).ordersBoardId, '');
});

test('the checkout gate: feature, read access, open shop, guests only where allowed, an Orders list and a method', () => {
  const s = settings();
  const gate = extra => shop.checkoutRefusal({ settings: s, featureOn: true, canRead: true, userId: 'u', ...extra });
  assert.equal(gate(), null);
  assert.equal(gate({ featureOn: false }), 'shop-feature-off');
  assert.equal(gate({ canRead: false }), 'not-authorized');
  assert.equal(gate({ settings: { ...s, enabled: false } }), 'shop-closed');
  assert.equal(gate({ userId: null }), 'shop-guest-not-allowed');
  assert.equal(gate({ userId: null, settings: { ...s, guestCheckout: true } }), null);
  assert.equal(gate({ settings: { ...s, ordersListId: '' } }), 'shop-no-orders-list');
  assert.equal(gate({ settings: { ...s, paymentMethods: s.paymentMethods.map(m => ({ ...m, enabled: false })) } }), 'shop-no-payment-method');
});

test('the buyer gives a name and an email, the rest is optional, and the terms are accepted where there are terms', () => {
  const c = shop.normalizeContact({ name: ' Ann ', email: 'ann@example.com', phone: '+358 40 123', address: 'Street 1\nTown', note: '' }, settings());
  assert.deepEqual(c, { name: 'Ann', email: 'ann@example.com', phone: '+358 40 123', address: 'Street 1\nTown', note: '' });
  assert.throws(() => shop.normalizeContact({ name: '', email: 'ann@example.com' }, settings()), /shop-name-required/);
  assert.throws(() => shop.normalizeContact({ name: 'Ann', email: 'not an email' }, settings()), /shop-email-invalid/);
  assert.throws(() => shop.normalizeContact({ name: 'Ann', email: 'a@b.fi', phone: 'call me' }, settings()), /shop-phone-invalid/);
  assert.throws(() => shop.normalizeContact({ name: 'Ann', email: 'a@b.fi', creditCard: '4111' }, settings()), /Unsupported/);
  assert.throws(() => shop.normalizeContact({ name: 'Ann', email: 'a@b.fi' }, settings({ termsUrl: 'https://x.fi/t' })), /shop-terms-required/);
  assert.ok(shop.normalizeContact({ name: 'Ann', email: 'a@b.fi', termsAccepted: true }, settings({ termsUrl: 'https://x.fi/t' })));
});

test('negative: a script in a card title or a buyer\'s name is text on the order card, never markup', () => {
  const evil = '<img src=x onerror=alert(1)>[click](javascript:alert(2))';
  const order = { number: 'ORD-2026-00001', reference: 'RF18', lines: [{ title: evil, sku: '*b*', quantity: 1, unitMinor: 100, lineMinor: 100 }],
    netMinor: 100, vatMinor: 0, totalMinor: 100 };
  const text = shop.orderCardDescription({ order, contact: { name: evil, email: 'a@b.fi', phone: '', address: '', note: '<script>x</script>' },
    method: 'SEPA', t: key => key, money: m => `${m / 100} EUR` });
  assert.ok(!/(^|[^\\])</m.test(text), 'every < is escaped, so no tag can form');
  assert.ok(!/\]\(javascript:/.test(text), 'no link can form');
  assert.ok(text.includes('\\<img src=x onerror=alert\\(1\\)\\>'), 'the title is kept, escaped');
  assert.equal(shop.markdownText('a_b*c'), 'a\\_b\\*c');
  assert.equal(shop.markdownText('- item\n1. first\n12.50 EUR'), '\\- item\n1\\. first\n12\\.50 EUR', 'a list can not start a line');
  assert.equal(shop.markdownText('ann@example.com 12.50'), 'ann@example.com 12.50', 'ordinary text stays readable');
  // The Shop view draws card text with {{ }} (escaped) or the Markdown viewer, never {{{ }}}.
  const jade = read('client/components/boards/shopView.jade');
  const triples = [...jade.matchAll(/\{\{\{\s*(\w+)\s*\}\}\}/g)].map(m => m[1]).sort();
  assert.deepEqual(triples, ['barcodeCode', 'qrCode'], 'only the drawn payment codes, which are SVG of modules only');
});

test('a public board opens in one view: the Shop replaces the Website there, and the Website the Shop', () => {
  const onWebsite = { permission: 'public', defaultPublicBoardView: 'board-view-website' };
  const toShop = shop.publicShopModifier(onWebsite, true);
  assert.equal(toShop.defaultPublicBoardView, 'board-view-shop');
  assert.equal(toShop['boardViewSettings.board-view-shop.showOnPublic'], true, 'the new default is shown');
  const onShop = { permission: 'public', defaultPublicBoardView: 'board-view-shop' };
  assert.equal(shop.showsShopOnPublic(onShop), true);
  assert.deepEqual(shop.publicShopModifier(onShop, true), {}, 'already the Shop: nothing to change');
  assert.deepEqual(shop.publicShopModifier(onShop, false), { defaultPublicBoardView: 'board-view-swimlanes' });
  assert.deepEqual(shop.publicShopModifier(onWebsite, false), {}, 'unticking the Shop leaves the Website alone');
  // Choosing the Website in Board Settings / Board View replaces the Shop: one field holds the one default.
  const back = bvs.defaultBoardViewModifier(onShop, 'board-view-website', 'public');
  assert.equal(back.defaultPublicBoardView, 'board-view-website');
  assert.equal(shop.showsShopOnPublic({ ...onShop, ...back }), false);
  // A visitor of such a board sees the Shop.
  assert.equal(bvs.resolveBoardView(onShop, null, () => true, null), 'board-view-shop');
});

test('suggested mapping: the fields and the list named for what they are', () => {
  const m = shop.suggestedMapping({
    customFields: [{ _id: 'p', name: 'Hinta', type: 'currency' }, { _id: 's', name: 'SKU', type: 'text' }, { _id: 'q', name: 'Stock', type: 'number' },
      { _id: 'pText', name: 'Price', type: 'date' }],
    lists: [{ _id: 'l1', title: 'Todo' }, { _id: 'l2', title: 'Tilaukset' }],
  });
  assert.deepEqual(m, { priceFieldId: 'p', skuFieldId: 's', stockFieldId: 'q', ordersListId: 'l2' });
  assert.deepEqual(shop.suggestedMapping({}), {});
});

test('a board without shop settings is a closed shop; a broken document reads as the defaults', () => {
  assert.deepEqual(shop.shopSettingsOf({}), shop.defaultShopSettings());
  assert.equal(shop.shopSettingsOf({ shopSettings: { enabled: 'yes', paymentMethods: 'x' } }).enabled, false);
  assert.deepEqual(shop.shopSettingsOf({ shopSettings: { paymentMethods: 'x' } }).paymentMethods, []);
});

test('the server enforces every setting, and records the refusals no screen produces', () => {
  const src = read('server/shop.js');
  // Only an active board admin saves; anybody else is recorded.
  assert.match(src, /if \(!activeAdmin\(board, this\.userId\)\) \{\n\s*\/\/[^\n]*\n\s*record\('authz\.shop-settings', 'blocked'/);
  // A client write of shopSettings is refused.
  assert.match(src, /Boards\.deny\(\{\n\s*update\(userId, doc, fields\) \{\n\s*if \(!Array\.isArray\(fields\) \|\| !fields\.includes\('shopSettings'\)\) return false;/);
  // The checkout gate, the payment method, the tampered cart.
  assert.match(src, /const refusal = shop\.checkoutRefusal\(/);
  assert.match(src, /record\('authz\.shop-order', 'blocked', source, 'An order with a payment method the shop does not offer\.'/);
  assert.match(src, /if \(cart\.tampered\) \{[\s\S]*?record\('authz\.shop-order', 'detected'/);
  // Prices from the cards: the cart's lines are priced by priceCart from productsOf(cards).
  assert.match(src, /const products = shop\.productsOf\(\{ lists, cards \}, settings\);\n\s*const priced = shop\.priceCart\(cart\.items, products, settings\);/);
  assert.ok(!/request\.cart\[[^\]]*\]\.(price|unit|line|total)/.test(src), 'nothing priced from the request');
  // Rate limited, and logging never breaks a guard.
  assert.match(src, /DDPRateLimiter\.addRule\(\{ type: 'method', name: 'shopPlaceOrder', connectionId\(\) \{ return true; \} \}, 5, 60000\);/);
  assert.match(src, /try \{\n\s*require\('\/server\/lib\/securityLog'\)\.record\([^)]*\);\n\s*\} catch \(e\) \{ \/\* logging must never break the guard \*\/ \}/);
  // The keys are in the Admin Panel -> Problems catalog, and never disable an account.
  const catalog = read('models/lib/securityCategories.js');
  for (const key of ['authz.shop-settings', 'authz.shop-order', 'dos.shop-orders']) {
    assert.match(catalog, new RegExp(`'${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}': \\{ category: '\\w+', bleed: 'Shop', severity: '\\w+', cwe: 'CWE-\\d+', blocksAccount: false \\}`));
  }
});

test('negative: no other code writes a board\'s shopSettings', () => {
  const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
    if (e.name === 'node_modules' || e.name.startsWith('.') || e.name.startsWith('_build')) return [];
    const rel = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(rel) : (/\.(c|m)?js$/.test(e.name) ? [rel] : []);
  });
  const writers = ['client', 'server', 'models', 'imports', 'config'].flatMap(walk)
    .filter(f => /\$set:\s*\{[^}]*shopSettings|'shopSettings\.|shopSettings:\s*\{\s*\.\.\.checked/.test(read(f)));
  assert.deepEqual(writers, ['server/shop.js']);
});

test('a copy of a board never takes orders into the source board\'s Orders list', () => {
  const stored = { ...settings(), title: 'Corner shop', updatedBy: 'admin', saleListIds: ['lA'], categoryLabelIds: ['red'] };
  const copy = shop.copiedShopSettings(stored);
  assert.equal(copy.enabled, false);
  assert.equal(copy.ordersBoardId, '');
  assert.equal(copy.ordersListId, '');
  assert.deepEqual([copy.priceFieldId, copy.skuFieldId, copy.stockFieldId, copy.saleListIds], ['', '', '', []],
    'the source board\'s fields and lists are not the copy\'s');
  assert.equal(copy.updatedBy, undefined, 'nobody\'s orders are written in the copy\'s name');
  assert.equal(copy.title, 'Corner shop', 'the look is kept');
  assert.deepEqual(copy.categoryLabelIds, ['red'], 'labels are copied with their ids');
  assert.equal(copy.paymentMethods.length, 2);
  // The copy can not take an order: closed, and no Orders list.
  assert.equal(shop.checkoutRefusal({ settings: copy, featureOn: true, canRead: true, userId: 'u' }), 'shop-closed');
  assert.equal(shop.checkoutRefusal({ settings: { ...copy, enabled: true }, featureOn: true, canRead: true, userId: 'u' }), 'shop-no-orders-list');
  assert.equal(shop.copiedShopSettings(undefined), undefined);
});

test('negative: every board copy resets the shop settings, and an import never brings them', () => {
  // Board.copy() is the one copy of a board: the copyBoard method, the REST
  // copy route and the board templates all call it.
  const boards = read('models/boards.js');
  const copy = boards.slice(boards.indexOf('  async copy(withoutCards = false, copyOptions) {'));
  const reset = copy.indexOf("this.shopSettings = require('/models/lib/shop').copiedShopSettings(this.shopSettings);");
  assert.ok(reset > 0 && reset < copy.indexOf('await Boards.insertAsync(this);'), 'reset before the copy is inserted');
  assert.match(read('server/publications/boards.js'), /if \(selection\) return copy\.copy\(!selection\.cards, selection\);/);
  assert.match(read('server/models/boards.js'), /const ret = await copy\.copy\(\);/);
  // No other place inserts a board from an existing board's document.
  const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
    if (e.name === 'node_modules' || e.name.startsWith('.') || e.name.startsWith('_build') || e.name === 'tests') return [];
    const rel = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(rel) : (/\.(c|m)?js$/.test(e.name) ? [rel] : []);
  });
  const inserts = ['client', 'server', 'models'].flatMap(walk).filter(f => /Boards\.insertAsync\(this\)/.test(read(f)));
  assert.deepEqual(inserts, ['models/boards.js']);
  // Import (and the cloneBoard that runs through it) leaves shopSettings out.
  const fields = read('models/lib/wekanBoardFields.js');
  assert.match(fields, /^ {2}shopSettings: '/m);
});

test('the confirmation e-mail: number, lines, VAT, how to pay and the shop - and the buyer\'s text stays text', () => {
  const { renderAccountEmailHtml } = require('../models/lib/accountEmailHtml.js');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const t = (key, options = {}) => String(en[key] || key).replace(/__(\w+)__/g, (m, name) => (name in options ? options[name] : m));
  const order = { number: 'ORD-2026-00007', reference: 'RF18202600007', netMinor: 2096, vatMinor: 534, vatPercent: 25.5, totalMinor: 2630,
    lines: [{ cardId: 'a', title: 'Mug <img src=x onerror=alert(1)>', sku: 'M-1', quantity: 2, unitMinor: 1315, lineMinor: 2630 }] };
  const payment = { lines: ['Shop Oy', 'FI21 1234 5600 0007 85'], link: 'javascript:alert(1)' };
  const mail = shop.orderEmail({ order, payment, methodLabel: 'SEPA credit transfer', shopTitle: 'Corner\r\nBcc: x@evil.example shop',
    t, money: m => `${(m / 100).toFixed(2)} EUR` });
  assert.equal(mail.subject, 'Your order ORD-2026-00007 at Corner Bcc: x@evil.example shop', 'one line: no header can be injected');
  for (const part of ['ORD-2026-00007', '2 × Mug <img src=x onerror=alert(1)> (M-1): 26.30 EUR', 'Net: 20.96 EUR', 'VAT 25.5 %: 5.34 EUR',
    'Total: 26.30 EUR', 'How to pay:', 'SEPA credit transfer', 'RF18202600007', 'FI21 1234 5600 0007 85']) {
    assert.ok(mail.text.includes(part), part);
  }
  assert.ok(!mail.text.includes('javascript:'), 'only an https payment link is written');
  const html = renderAccountEmailHtml({ text: mail.text, siteName: 'Corner shop' });
  assert.ok(!/<img/.test(html), 'the HTML part escapes the product title');
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  // The keys and their placeholders, in every language.
  for (const file of fs.readdirSync(path.join(ROOT, 'imports/i18n/data'))) {
    const data = JSON.parse(read(`imports/i18n/data/${file}`));
    assert.equal((data['shop-email-subject'].match(/__number__|__shop__/g) || []).sort().join(), '__number__,__shop__', file);
    assert.ok(data['shop-email-pay'] && data['shop-confirmation-email'], file);
  }
});

test('the server sends the confirmation, makes the invoice, and neither can fail the order wrongly', () => {
  const src = read('server/shop.js');
  // The invoice is part of the order, made only with Budget and billing on.
  assert.match(src, /if \(activeAdmin\(board, ownerId\) && await featureOnFor\(ownerId, 'billing'\)\) \{\n\s*invoice = await createOrderInvoice\(/);
  assert.match(src, /if \(invoice\) await removeOrderInvoice\(invoice\.invoiceId\)/, 'a failed order leaves no invoice');
  // The invoice is billing's own: its collection, numbering and the order's reference.
  const inv = read('server/lib/shopInvoice.js');
  assert.match(inv, /import \{ BillingInvoices, BillingProfiles \} from '\/models\/billing';/);
  assert.match(inv, /invoiceNumber\(year, count \+ 1 \+ attempt, 'invoice'\)/);
  assert.match(inv, /paymentReference: order\.reference \|\| undefined,/);
  // The e-mail comes after the order is stored, and its sender never throws.
  assert.ok(src.indexOf('await sendOrderConfirmation(') > src.indexOf('await ShopOrders.updateAsync({ _id: orderId }, { $set: { cardId } });'));
  const mail = read('server/lib/shopEmail.js');
  assert.match(mail, /export async function sendOrderConfirmation\([^)]*\) \{\n\s*try \{/);
  assert.match(mail, /\} catch \(error\) \{\n\s*try \{\n\s*require\('\/server\/lib\/mailProblems'\)\.recordMailProblem\('send-failed'/);
  assert.match(mail, /return 'failed';\n\s*\}\n\}/);
  // It respects what turns e-mail off: no MAIL_URL, the shop's setting, a stopped address.
  assert.match(mail, /settings\.confirmationEmail === false \|\| !to \|\| !mailConfigured\(\)\) return 'skipped';/);
  assert.match(mail, /isAddressStopped\(to\)\) return 'skipped';/);
  assert.match(mail, /html: renderAccountEmailHtml\(\{ text, siteName: shopTitle \}\),/);
});
