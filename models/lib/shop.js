'use strict';

// Board View / Shop (docs/Features/Board-Header/Board-Views/Shop.md,
// docs/Features/Board-Sidebar/Board-Settings/Shop.md): the products on a
// board's cards as a web shop, and an order as a card.
//
//   a product     a card, not archived, in a list on sale, whose price custom
//                 field holds a number - the card's title, description, cover
//                 image, labels (the categories) and, when mapped, its product
//                 code (SKU) and stock custom fields
//   lists on sale the lists ticked in Board Settings / Shop; none ticked is
//                 every list but the Orders list
//   the cart      { cardId, quantity } lines kept in the browser. Nothing else
//                 of it is read: prices and totals are computed here, from the
//                 cards, on the server
//   an order      a card in the Orders list, on a PRIVATE board - a public
//                 board shows every card to everybody, and an order carries the
//                 buyer's name and contact details
//   payment       the payment methods of Budget and billing
//                 (models/lib/paymentCodes.js PAYMENT_METHODS), each with its
//                 QR code, barcode, link or text, and the payment reference of
//                 Budget and billing (models/lib/billing.js paymentReference)
//
// Money is an integer of the currency's minor unit (models/lib/currencies.js),
// as in Budget and billing: never a float.
//
// Pure, no Meteor: the client (the Shop view and Board Settings / Shop), the
// server (server/shop.js) and tests/shop.test.cjs all load this one module, so
// what the shop shows and what an order is charged can not drift apart.

const { toMinorUnits } = require('./currencies');
const { normalizePaymentMethod, paymentInstructions } = require('./paymentCodes');
const { paymentReference, invoiceTotals } = require('./billing');
const { defaultBoardView, defaultBoardViewModifier, DEFAULT_BOARD_VIEW } = require('./boardViewSettings');

const SHOP_VIEW = 'board-view-shop';

const LIMITS = Object.freeze({
  title: 200,
  intro: 5000,
  url: 2000,
  methods: 20,
  ids: 500,
  cartLines: 100,
  quantity: 999,
  name: 100,
  email: 254,
  phone: 40,
  address: 500,
  note: 1000,
  // The largest price, in major units: 1 000 000 000.
  price: 1e9,
});

const REFERENCE_TYPES = ['rf', 'fi', 'be', 'no', 'se', 'none'];
// The custom field types each mapping takes (models/customFields.js).
const FIELD_TYPES = Object.freeze({
  priceFieldId: ['number', 'currency', 'text'],
  skuFieldId: ['text', 'number', 'stringtemplate'],
  stockFieldId: ['number'],
});

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const METHOD_ID = /^[A-Za-z0-9]{1,24}$/;

function fail(message) {
  const error = new Error(message);
  error.shop = true;
  throw error;
}

const str = value => (typeof value === 'string' ? value : '');

// What a board that never opened Board Settings / Shop has: a closed shop.
function defaultShopSettings() {
  return {
    enabled: false,
    title: '',
    intro: '',
    currency: 'EUR',
    priceFieldId: '',
    skuFieldId: '',
    stockFieldId: '',
    saleListIds: [],
    categoryLabelIds: [],
    ordersBoardId: '',
    ordersListId: '',
    guestCheckout: false,
    termsUrl: '',
    vatPercent: 0,
    pricesIncludeVat: true,
    referenceType: 'rf',
    decrementStock: true,
    confirmationEmail: true,
    paymentMethods: [],
  };
}

const KEYS = Object.keys(defaultShopSettings());

// The board's settings, made whole: a missing or broken document reads as the
// defaults, so a renderer never meets undefined.
function shopSettingsOf(board) {
  const stored = board && board.shopSettings && typeof board.shopSettings === 'object' ? board.shopSettings : {};
  const out = defaultShopSettings();
  for (const key of KEYS) {
    if (stored[key] === undefined || stored[key] === null) continue;
    if (typeof stored[key] === typeof out[key] && Array.isArray(stored[key]) === Array.isArray(out[key])) out[key] = stored[key];
  }
  return out;
}

function text(value, key, max, { multiline = false } = {}) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') fail(`${key} must be text`);
  // Control characters are never a shop's text; a newline is, where it may be.
  const allowed = multiline ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/;
  if (allowed.test(value)) fail(`${key} contains a control character`);
  const v = value.trim();
  if (v.length > max) fail(`${key} is at most ${max} characters`);
  return v;
}

function id(value, key) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string' || !ID.test(value)) fail(`${key} is not an id`);
  return value;
}

function ids(value, key) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > LIMITS.ids) fail(`${key} must be a list of at most ${LIMITS.ids} ids`);
  return [...new Set(value.map(v => id(v, key)).filter(Boolean))];
}

function bool(value, key, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'boolean') fail(`${key} must be true or false`);
  return value;
}

// An address a visitor may follow: http or https, nothing else - never a
// javascript: or data: link.
function url(value, key) {
  const v = text(value, key, LIMITS.url);
  if (!v) return '';
  if (!/^https?:\/\/[^\s<>"'`]+$/i.test(v)) fail(`${key} must be an http or https address`);
  return v;
}

/**
 * What Board Settings / Shop saves, checked and made whole - or an Error. Only
 * the shape is checked here; that the fields, lists and the orders board are
 * the board's own is checkShopSettingsAgainstBoard below, which needs them.
 */
function normalizeShopSettings(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Expected an object');
  for (const key of Object.keys(input)) if (!KEYS.includes(key)) fail(`Unsupported setting: ${key}`);
  const d = defaultShopSettings();
  const currency = input.currency === undefined ? d.currency : String(input.currency).trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) fail('The currency is a three-letter ISO 4217 code');
  const vat = input.vatPercent === undefined || input.vatPercent === null || input.vatPercent === '' ? 0 : Number(input.vatPercent);
  if (!Number.isFinite(vat) || vat < 0 || vat > 100) fail('VAT is 0 to 100 percent');
  const referenceType = input.referenceType === undefined ? d.referenceType : input.referenceType;
  if (!REFERENCE_TYPES.includes(referenceType)) fail('Invalid reference type');
  const methods = input.paymentMethods === undefined ? [] : input.paymentMethods;
  if (!Array.isArray(methods) || methods.length > LIMITS.methods) fail(`At most ${LIMITS.methods} payment methods`);
  const seen = new Set();
  const paymentMethods = methods.map(entry => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) fail('A payment method is an object');
    for (const key of Object.keys(entry)) if (!['id', 'enabled', 'method'].includes(key)) fail(`Unsupported field: ${key}`);
    if (typeof entry.id !== 'string' || !METHOD_ID.test(entry.id) || seen.has(entry.id)) fail('A payment method needs an id of its own');
    seen.add(entry.id);
    return { id: entry.id, enabled: bool(entry.enabled, 'enabled', true), method: normalizePaymentMethod(entry.method) };
  });
  return {
    enabled: bool(input.enabled, 'enabled', d.enabled),
    title: text(input.title, 'title', LIMITS.title),
    intro: text(input.intro, 'intro', LIMITS.intro, { multiline: true }),
    currency,
    priceFieldId: id(input.priceFieldId, 'priceFieldId'),
    skuFieldId: id(input.skuFieldId, 'skuFieldId'),
    stockFieldId: id(input.stockFieldId, 'stockFieldId'),
    saleListIds: ids(input.saleListIds, 'saleListIds'),
    categoryLabelIds: ids(input.categoryLabelIds, 'categoryLabelIds'),
    ordersBoardId: id(input.ordersBoardId, 'ordersBoardId'),
    ordersListId: id(input.ordersListId, 'ordersListId'),
    guestCheckout: bool(input.guestCheckout, 'guestCheckout', d.guestCheckout),
    termsUrl: url(input.termsUrl, 'termsUrl'),
    vatPercent: Math.round(vat * 100) / 100,
    pricesIncludeVat: bool(input.pricesIncludeVat, 'pricesIncludeVat', d.pricesIncludeVat),
    referenceType,
    decrementStock: bool(input.decrementStock, 'decrementStock', d.decrementStock),
    confirmationEmail: bool(input.confirmationEmail, 'confirmationEmail', d.confirmationEmail),
    paymentMethods,
  };
}

/**
 * The settings checked against the board they are for: each mapped custom
 * field is a field of this board of a type that mapping takes, the lists on
 * sale are its lists, the categories its labels, and the Orders list is a list
 * of the orders board, which is a PRIVATE board. A price field of type
 * Currency fixes the shop's currency to its own. Returns the settings to store
 * or throws.
 *
 * @param {Object} ctx { board, customFields, lists, ordersBoard, ordersLists }
 */
function checkShopSettingsAgainstBoard(settings, { board, customFields = [], lists = [], ordersBoard = null, ordersLists = [] } = {}) {
  const out = { ...settings };
  const fields = new Map(customFields.filter(f => f && f._id).map(f => [f._id, f]));
  for (const key of Object.keys(FIELD_TYPES)) {
    if (!out[key]) continue;
    const field = fields.get(out[key]);
    if (!field) fail(`${key}: not a custom field of this board`);
    if (!FIELD_TYPES[key].includes(field.type)) fail(`${key}: a ${field.type} custom field can not be used here`);
  }
  const price = out.priceFieldId && fields.get(out.priceFieldId);
  if (price && price.type === 'currency' && price.settings && /^[A-Z]{3}$/.test(String(price.settings.currencyCode || ''))) {
    out.currency = price.settings.currencyCode;
  }
  const listIds = new Set(lists.filter(l => l && l._id).map(l => l._id));
  if (out.saleListIds.some(l => !listIds.has(l))) fail('saleListIds: not a list of this board');
  const labelIds = new Set(((board && board.labels) || []).filter(l => l && l._id).map(l => l._id));
  if (out.categoryLabelIds.some(l => !labelIds.has(l))) fail('categoryLabelIds: not a label of this board');
  if (out.ordersListId) {
    if (!out.ordersBoardId) out.ordersBoardId = board && board._id;
    if (!ordersBoard || ordersBoard._id !== out.ordersBoardId) fail('ordersBoardId: not a board you are an admin of');
    if (!isPrivateOrdersBoard(ordersBoard)) fail('ordersBoardId: orders are written only on a private board');
    if (!ordersLists.some(l => l && l._id === out.ordersListId)) fail('ordersListId: not a list of the orders board');
  } else {
    out.ordersBoardId = '';
  }
  return out;
}

// An order carries the buyer's name and contact details, so it is written only
// where its board's own members read it: a public board shows every card to
// everybody, an 'instance' board to every user of this WeKan.
function isPrivateOrdersBoard(board) {
  return !!board && board.permission === 'private' && !board.archived;
}

// ---------------------------------------------------------------- products

function fieldValue(card, fieldId) {
  if (!fieldId || !card || !Array.isArray(card.customFields)) return undefined;
  const f = card.customFields.find(x => x && x._id === fieldId);
  return f ? f.value : undefined;
}

// A price custom field's value as an integer of the currency's minor unit, or
// null when it holds no price: empty, not a number, negative, too large.
// "12,50" is 12.50 as a Currency field's own input reads it.
function priceMinorOf(value, currency) {
  let n = NaN;
  if (typeof value === 'number') n = value;
  else if (typeof value === 'string' && /^\s*\d{1,10}([.,]\d{1,8})?\s*$/.test(value)) n = Number(value.trim().replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > LIMITS.price) return null;
  const minor = toMinorUnits(n, currency);
  return Number.isSafeInteger(minor) ? minor : null;
}

// The stock: a whole number of 0 or more, or null when the card does not keep
// one (the field is not mapped or is empty) - which is "not counted".
function stockOf(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.floor(n));
}

function skuOf(value) {
  if (value === undefined || value === null) return '';
  return String(value).slice(0, 100);
}

// The lists whose cards are on sale.
function saleListIdsOf(settings, lists) {
  const open = lists.filter(l => l && !l.archived);
  if (settings.saleListIds && settings.saleListIds.length) {
    const ticked = new Set(settings.saleListIds);
    return new Set(open.filter(l => ticked.has(l._id)).map(l => l._id));
  }
  return new Set(open.filter(l => l._id !== settings.ordersListId).map(l => l._id));
}

/**
 * The board's products, in board order (the list's, then the card's).
 *
 * @param {Object} board { lists, cards } and `settings` (shopSettingsOf)
 */
function productsOf({ lists = [], cards = [] } = {}, settings) {
  const s = settings || defaultShopSettings();
  if (!s.priceFieldId) return [];
  const onSale = saleListIdsOf(s, lists);
  const listSort = new Map(lists.map(l => [l._id, Number(l.sort) || 0]));
  return cards
    .filter(c => c && !c.archived && (c.type || 'cardType-card') === 'cardType-card' && onSale.has(c.listId))
    .map(c => {
      const priceMinor = priceMinorOf(fieldValue(c, s.priceFieldId), s.currency);
      const stock = s.stockFieldId ? stockOf(fieldValue(c, s.stockFieldId)) : null;
      return {
        _id: c._id,
        title: str(c.title),
        description: str(c.description),
        priceMinor,
        currency: s.currency,
        sku: s.skuFieldId ? skuOf(fieldValue(c, s.skuFieldId)) : '',
        stock,
        soldOut: stock !== null && stock <= 0,
        labelIds: Array.isArray(c.labelIds) ? c.labelIds.slice() : [],
        listId: c.listId,
        coverId: str(c.coverId),
        sort: Number(c.sort) || 0,
      };
    })
    .filter(p => p.priceMinor !== null)
    .sort((a, b) => (listSort.get(a.listId) - listSort.get(b.listId)) || (a.sort - b.sort) || a.title.localeCompare(b.title));
}

// The categories: the board's labels that a product carries - only the ticked
// ones when Board Settings / Shop ticks any - in the board's label order.
function categoriesOf(products, labels, settings) {
  const used = new Set(products.flatMap(p => p.labelIds));
  const ticked = settings && settings.categoryLabelIds && settings.categoryLabelIds.length ? new Set(settings.categoryLabelIds) : null;
  return (labels || [])
    .filter(l => l && l._id && used.has(l._id) && (!ticked || ticked.has(l._id)))
    .map(l => ({ _id: l._id, name: str(l.name), color: str(l.color) }));
}

function productsInCategory(products, categoryId) {
  return categoryId ? products.filter(p => p.labelIds.includes(categoryId)) : products;
}

// The first words of a description, for a product's tile: Markdown marks and
// links taken out, never cut inside a word when it can be helped.
function shortDescription(description, max = 160) {
  let text = str(description)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  // Until nothing changes: one pass over "<<b>b>" would leave a "<b>".
  let before;
  do {
    before = text;
    text = text.replace(/<[^>]*>/g, ' ');
  } while (text !== before);
  const plain = text
    .replace(/[#*_`<>~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max / 2 ? cut.slice(0, space) : cut).trim()}…`;
}

// ---------------------------------------------------------------- the cart

/**
 * The cart as the browser sent it, reduced to what is ever read of it: card
 * ids and quantities. Anything else on a line - a price, a total, a title - is
 * dropped and reported as `tampered`, since the Shop view sends only these two.
 * Repeated cards are added together; a quantity is a whole number 1 to 999.
 */
function normalizeCart(input) {
  if (!Array.isArray(input)) fail('The cart is a list');
  if (input.length > LIMITS.cartLines) fail(`At most ${LIMITS.cartLines} lines in a cart`);
  let tampered = false;
  const byCard = new Map();
  for (const line of input) {
    if (!line || typeof line !== 'object' || Array.isArray(line)) fail('A cart line is an object');
    if (Object.keys(line).some(k => k !== 'cardId' && k !== 'quantity')) tampered = true;
    if (typeof line.cardId !== 'string' || !ID.test(line.cardId)) fail('A cart line names a card');
    const q = line.quantity;
    if (!Number.isInteger(q) || q < 1 || q > LIMITS.quantity) fail(`A quantity is 1 to ${LIMITS.quantity}`);
    byCard.set(line.cardId, Math.min(LIMITS.quantity, (byCard.get(line.cardId) || 0) + q));
  }
  return { items: [...byCard].map(([cardId, quantity]) => ({ cardId, quantity })), tampered };
}

// Totals of a sum of prices with the shop's VAT: prices that include VAT have
// it taken out (net = total - VAT, the VAT rounded to the minor unit), prices
// that do not have it added as an invoice of Budget and billing adds it.
function totalsOf(sumMinor, settings) {
  const p = Number(settings.vatPercent) || 0;
  if (!p) return { netMinor: sumMinor, vatPercent: 0, vatMinor: 0, totalMinor: sumMinor };
  if (settings.pricesIncludeVat !== false) {
    const vat = Math.round(sumMinor * p / (100 + p));
    return { netMinor: sumMinor - vat, vatPercent: p, vatMinor: vat, totalMinor: sumMinor };
  }
  return invoiceTotals(sumMinor, p);
}

/**
 * The cart priced from the products - the server's products, read from the
 * cards when the order is placed. { lines, netMinor, vatMinor, totalMinor,
 * currency } or { error, cardId }.
 */
function priceCart(items, products, settings) {
  if (!items || !items.length) return { error: 'shop-cart-empty' };
  const byId = new Map(products.map(p => [p._id, p]));
  const lines = [];
  let sum = 0;
  for (const { cardId, quantity } of items) {
    const p = byId.get(cardId);
    if (!p) return { error: 'shop-not-for-sale', cardId };
    if (p.soldOut) return { error: 'shop-sold-out', cardId };
    if (p.stock !== null && quantity > p.stock) return { error: 'shop-not-enough-stock', cardId };
    const lineMinor = p.priceMinor * quantity;
    sum += lineMinor;
    if (!Number.isSafeInteger(sum)) return { error: 'shop-total-too-large' };
    lines.push({ cardId, title: p.title, sku: p.sku, quantity, unitMinor: p.priceMinor, lineMinor });
  }
  return { lines, currency: settings.currency, ...totalsOf(sum, settings) };
}

// ---------------------------------------------------------------- payment

function enabledPaymentMethods(settings) {
  return ((settings && settings.paymentMethods) || []).filter(m => m && m.enabled !== false && m.method);
}

// The payment method the buyer chose, when the shop offers it - null for one it
// does not offer (switched off, removed, or never there).
function paymentMethodFor(settings, methodId) {
  if (typeof methodId !== 'string') return null;
  return enabledPaymentMethods(settings).find(m => m.id === methodId) || null;
}

function orderNumber(year, sequence) {
  return `ORD-${year}-${String(sequence).padStart(5, '0')}`;
}

// The payment reference of an order: the reference type of Board Settings /
// Shop, from the year and the order's number, as Budget and billing makes an
// invoice's.
function orderReference(year, sequence, type) {
  return paymentReference(year, sequence, type || 'rf');
}

// What the buyer is shown for the chosen method: its QR code, barcode, link and
// lines (models/lib/paymentCodes.js paymentInstructions), for the order's total.
function orderPaymentInstructions(entry, order, shopTitle) {
  return paymentInstructions(entry.method, {
    amountDueMinor: order.totalMinor,
    currency: order.currency,
    paymentReference: order.reference || '',
    number: order.number,
    dueDate: null,
    issuerName: shopTitle || '',
  });
}

// ---------------------------------------------------------------- the gate

/**
 * Whether this person may place an order now: an error key, or null.
 *   featureOn   Admin Panel / Settings / Features / Shop view for them
 *   canRead     they may read the board (a public board: anybody)
 *   userId      signed in, or not
 */
function checkoutRefusal({ settings, featureOn, canRead, userId }) {
  if (!featureOn) return 'shop-feature-off';
  if (!canRead) return 'not-authorized';
  if (!settings || !settings.enabled) return 'shop-closed';
  if (!userId && !settings.guestCheckout) return 'shop-guest-not-allowed';
  if (!settings.ordersListId || !settings.ordersBoardId) return 'shop-no-orders-list';
  if (!enabledPaymentMethods(settings).length) return 'shop-no-payment-method';
  return null;
}

// ---------------------------------------------------------------- the buyer

const EMAIL = /^[^\s@<>()[\]\\,;:"]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

/**
 * The buyer's details: a name and an email address, and optionally a phone
 * number, a delivery address and a message - nothing more is asked or kept.
 * With a terms link set, the terms must be accepted.
 */
function normalizeContact(input, settings) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Expected an object');
  for (const key of Object.keys(input)) if (!['name', 'email', 'phone', 'address', 'note', 'termsAccepted'].includes(key)) fail(`Unsupported field: ${key}`);
  const name = text(input.name, 'name', LIMITS.name);
  if (!name) fail('shop-name-required');
  const email = text(input.email, 'email', LIMITS.email);
  if (!EMAIL.test(email)) fail('shop-email-invalid');
  const phone = text(input.phone, 'phone', LIMITS.phone);
  if (phone && !/^[0-9+() .-]{3,40}$/.test(phone)) fail('shop-phone-invalid');
  const contact = {
    name,
    email,
    phone,
    address: text(input.address, 'address', LIMITS.address, { multiline: true }),
    note: text(input.note, 'note', LIMITS.note, { multiline: true }),
  };
  if (settings && settings.termsUrl && input.termsAccepted !== true) fail('shop-terms-required');
  return contact;
}

// ---------------------------------------------------------------- the order card

// Text a buyer typed, written into Markdown as text: every Markdown and HTML
// mark escaped, so a name can not become a link, an image or markup.
function markdownText(value) {
  return str(value)
    .replace(/[\\`*_{}[\]()#!|<>~&]/g, ch => `\\${ch}`)
    // A list, a heading underline or a numbered list starts only a line.
    .replace(/^(\s*)([-+=]|\d+\.)/gm, (m, space, mark) => `${space}${mark.replace(/([-+=.])$/, '\\$1')}`);
}

function orderCardTitle(order, contact) {
  return `${order.number} ${str(contact.name)}`.slice(0, 250);
}

/**
 * The order card's description, in Markdown: the lines, the totals, the
 * payment method and reference, and the buyer's details. `t(key)` gives the
 * labels in the shop owner's language and `money(minor)` an amount.
 */
function orderCardDescription({ order, contact, method, t, money, invoiceNumber = '' }) {
  const label = key => markdownText(t(key));
  const out = [];
  out.push(`**${label('board-view-shop')}** ${markdownText(order.number)}`, '');
  out.push(`| ${label('title')} | ${label('shop-quantity')} | ${label('billing-amount')} |`, '| --- | ---: | ---: |');
  for (const line of order.lines) {
    const sku = line.sku ? ` (${markdownText(line.sku)})` : '';
    out.push(`| ${markdownText(line.title)}${sku} | ${line.quantity} × ${markdownText(money(line.unitMinor))} | ${markdownText(money(line.lineMinor))} |`);
  }
  out.push('');
  if (order.vatMinor) {
    out.push(`${label('billing-net')}: ${markdownText(money(order.netMinor))}  `);
    out.push(`${label('billing-vat')} ${order.vatPercent} %: ${markdownText(money(order.vatMinor))}  `);
  }
  out.push(`**${label('billing-total')}: ${markdownText(money(order.totalMinor))}**`, '');
  out.push(`${label('billing-method')}: ${markdownText(method)}  `);
  if (order.reference) out.push(`${label('billing-payment-reference')}: ${markdownText(order.reference)}  `);
  // The Budget and billing invoice of the order, by its number (Member menu /
  // Budget and billing lists it under the shop's board).
  if (invoiceNumber) out.push(`${label('billing-invoice')}: ${markdownText(invoiceNumber)}  `);
  out.push('');
  out.push(`${label('fullname')}: ${markdownText(contact.name)}  `);
  out.push(`${label('email')}: ${markdownText(contact.email)}  `);
  if (contact.phone) out.push(`${label('billing-phone')}: ${markdownText(contact.phone)}  `);
  if (contact.address) out.push(`${label('billing-address')}: ${markdownText(contact.address).replace(/\n/g, ', ')}  `);
  if (contact.note) out.push('', `${label('shop-note')}:`, '', markdownText(contact.note));
  return out.join('\n');
}

// ---------------------------------------------------------------- defaults

// What Board Settings / Shop starts with on a board that never saved it: the
// custom fields and the list its names suggest, in the languages WeKan is
// most used in. A board admin sees them chosen and changes what is wrong.
const SUGGEST = {
  priceFieldId: /^(price|prices|hinta|pris|preis|prix|precio|prezzo|preço|prijs|cena|ár|fiyat|цена|価格|价格)$/i,
  skuFieldId: /^(sku|product ?code|code|tuotekoodi|tuotenumero|artikelnummer|artikkelinumero|référence|referencia|codice|código|ean)$/i,
  stockFieldId: /^(stock|in stock|inventory|varasto|saldo|lager|lagerbestand|bestand|existencias|giacenza|estoque|voorraad|zapas|остаток)$/i,
};
const ORDERS_LIST = /^(orders?|tilaukset|bestellungen|bestellingen|beställningar|bestillinger|commandes|pedidos|ordini|encomendas|zamówienia|заказы)$/i;

function suggestedMapping({ customFields = [], lists = [] } = {}) {
  const out = {};
  for (const [key, re] of Object.entries(SUGGEST)) {
    const field = customFields.find(f => f && FIELD_TYPES[key].includes(f.type) && re.test(str(f.name).trim()));
    if (field) out[key] = field._id;
  }
  const orders = lists.find(l => l && !l.archived && ORDERS_LIST.test(str(l.title).trim()));
  if (orders) out.ordersListId = orders._id;
  return out;
}

// ---------------------------------------------------------------- the invoice

/**
 * The order's lines as Budget and billing invoice lines of the kind
 * 'product' (models/lib/billing.js INVOICE_LINE_KINDS): the product card, its
 * title with the quantity and product code, the quantity and the unit price.
 *
 * An invoice's lines add up to its NET: with prices that include VAT the
 * net is shared over the lines in proportion to their prices, the rounding
 * remainder on the last line, so the lines, the net, the VAT and the total of
 * the invoice and its e-invoice agree. A line's unit price is written only
 * when its net divides into a whole unit price; otherwise the line is the
 * quantity's amount as one (models/lib/ublInvoice.js).
 */
function invoiceLinesOf(order) {
  const lines = order.lines || [];
  const gross = lines.reduce((sum, line) => sum + line.lineMinor, 0);
  const net = Number.isSafeInteger(order.netMinor) ? order.netMinor : gross;
  let left = net;
  return lines.map((line, i) => {
    const amountMinor = i === lines.length - 1 ? left : (gross ? Math.round(line.lineMinor * net / gross) : 0);
    left -= amountMinor;
    const out = {
      kind: 'product',
      cardId: line.cardId,
      title: `${line.quantity} × ${str(line.title)}${line.sku ? ` (${str(line.sku)})` : ''}`.slice(0, 500),
      quantity: line.quantity,
      amountMinor,
    };
    if (line.quantity > 0 && amountMinor % line.quantity === 0) out.unitMinor = amountMinor / line.quantity;
    return out;
  });
}

// ---------------------------------------------------------------- the confirmation email

// A language tag as WeKan names its translations (fi, pt-BR, ca@valencia,
// zh_SG): anything else is not a language the buyer's browser could have.
function isLanguageTag(value) {
  return typeof value === 'string' && /^[A-Za-z]{2,3}(?:[-_@][A-Za-z0-9]{2,10})?$/.test(value);
}

/**
 * The buyer's order confirmation: { subject, text }, plain text in the
 * buyer's language. Every text in it - the shop's title, the products'
 * titles, the payment details - is TEXT: the HTML part is made from it by
 * the account e-mail layout (models/lib/accountEmailHtml.js), which escapes
 * everything first. The subject is one line.
 *
 * @param {Object} payment  models/lib/paymentCodes.js paymentInstructions(): { lines, link, error }
 */
function orderEmail({ order, payment, methodLabel, shopTitle, t, money }) {
  const oneLine = value => str(value).replace(/[\r\n\u0000-\u001f\u007f]+/g, ' ').trim();
  const subject = oneLine(t('shop-email-subject', { number: order.number, shop: oneLine(shopTitle) })).slice(0, 300);
  const out = [];
  out.push(oneLine(t('shop-order-placed', { number: order.number })), '');
  for (const line of order.lines || []) {
    const sku = line.sku ? ` (${oneLine(line.sku)})` : '';
    out.push(`${line.quantity} × ${oneLine(line.title)}${sku}: ${money(line.lineMinor)}`);
  }
  out.push('');
  if (order.vatMinor) {
    out.push(`${t('billing-net')}: ${money(order.netMinor)}`);
    out.push(`${t('billing-vat')} ${order.vatPercent} %: ${money(order.vatMinor)}`);
  }
  out.push(`${t('billing-total')}: ${money(order.totalMinor)}`, '');
  out.push(`${t('shop-email-pay')}`);
  out.push(`${t('billing-method')}: ${oneLine(methodLabel)}`);
  if (order.reference) out.push(`${t('billing-payment-reference')}: ${order.reference}`);
  if (payment && !payment.error) {
    for (const line of payment.lines || []) if (oneLine(line)) out.push(oneLine(line));
    if (payment.link && /^https:\/\//i.test(payment.link)) out.push('', payment.link);
  }
  out.push('', oneLine(shopTitle));
  return { subject, text: out.join('\n') };
}

// ---------------------------------------------------------------- a copy of the board

/**
 * Board Settings / Shop on a COPY of a board (models/boards.js copy, board
 * templates): the copy's shop is closed, and its Orders list, the custom
 * fields and lists it maps - all of the source board's - are cleared, so a
 * copy never takes an order into the source's Orders list nor prices from
 * the source's fields. The look and the payment methods are kept for the
 * admin who opens it. Nothing for a board without shop settings.
 */
function copiedShopSettings(stored) {
  if (!stored || typeof stored !== 'object') return undefined;
  const s = shopSettingsOf({ shopSettings: stored });
  return {
    ...s,
    enabled: false,
    ordersBoardId: '',
    ordersListId: '',
    priceFieldId: '',
    skuFieldId: '',
    stockFieldId: '',
    saleListIds: [],
  };
}

// ---------------------------------------------------------------- the public view

/**
 * Board Settings / Shop / "Show the Shop instead of the public board". A
 * public board opens in ONE view for its visitors (defaultPublicBoardView), so
 * the Shop and the Website - or any other view - can not both be it: choosing
 * the Shop replaces whatever was there, and choosing another view in Board
 * Settings / Board View replaces the Shop. Turning it off when the Shop is the
 * public view gives the public Swimlanes back; when another view is, it
 * changes nothing. Returns the $set, empty when nothing changes.
 */
function publicShopModifier(board, showShop) {
  const current = defaultBoardView(board, 'public');
  if (showShop) return current === SHOP_VIEW ? {} : defaultBoardViewModifier(board, SHOP_VIEW, 'public');
  return current === SHOP_VIEW ? { defaultPublicBoardView: DEFAULT_BOARD_VIEW } : {};
}

function showsShopOnPublic(board) {
  return defaultBoardView(board, 'public') === SHOP_VIEW;
}

// The browser's cart of one board: its localStorage key.
function cartStorageKey(boardId) {
  return `wekan-shop-cart-${str(boardId)}`;
}

module.exports = {
  SHOP_VIEW,
  LIMITS,
  REFERENCE_TYPES,
  FIELD_TYPES,
  defaultShopSettings,
  shopSettingsOf,
  normalizeShopSettings,
  checkShopSettingsAgainstBoard,
  isPrivateOrdersBoard,
  fieldValue,
  priceMinorOf,
  stockOf,
  saleListIdsOf,
  productsOf,
  categoriesOf,
  productsInCategory,
  shortDescription,
  normalizeCart,
  totalsOf,
  priceCart,
  enabledPaymentMethods,
  paymentMethodFor,
  orderNumber,
  orderReference,
  orderPaymentInstructions,
  checkoutRefusal,
  normalizeContact,
  markdownText,
  orderCardTitle,
  orderCardDescription,
  suggestedMapping,
  publicShopModifier,
  showsShopOnPublic,
  cartStorageKey,
  invoiceLinesOf,
  isLanguageTag,
  orderEmail,
  copiedShopSettings,
};
