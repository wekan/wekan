// Board View / Shop (shopView.jade, models/lib/shop.js). The board's own
// subscription brings its lists, cards, custom fields and attachments - for a
// visitor of a public board too - so the shop is drawn from them as they
// change. Which product is open is in the address (?product=), so a product
// can be linked to. The cart is this browser's (localStorage); the server
// never trusts it for anything but card ids and quantities.
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Random } from 'meteor/random';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';
import { METHOD_KEYS, FIELD_KEYS, PLACEHOLDERS, qrSvg, barcodeSvg } from '/client/lib/paymentCodeSvg';

const shop = require('/models/lib/shop');
const { formatMoney } = require('/models/lib/billing');
const { PAYMENT_METHODS, formatReference, formatIban } = require('/models/lib/paymentCodes');
const { BOARD_VIEWS } = require('/models/lib/boardViewSettings');

const t = (key, options) => TAPi18n.__(key, options);
const language = () => {
  try { return TAPi18n.getLanguage ? TAPi18n.getLanguage() : undefined; } catch (e) { return undefined; }
};
const errorText = error => (error ? (error.reason || error.error || error.message || String(error)) : '');

// ---------------------------------------------------------------- state

// What the shop shows: the products ('shop'), the cart, the checkout, or the
// order just placed. The open product is the address's ?product=.
const mode = new ReactiveVar('shop');
const category = new ReactiveVar('');
const placedOrder = new ReactiveVar(null);
const cartLines = new ReactiveVar([]);
let cartBoardId = null;

function storage() {
  try { return window.localStorage; } catch (e) { return null; }
}

// The cart of the board on screen, read from this browser once per board.
function cart() {
  const boardId = Utils.getCurrentBoardId();
  if (boardId !== cartBoardId) {
    cartBoardId = boardId;
    let lines = [];
    try {
      const raw = storage() && storage().getItem(shop.cartStorageKey(boardId));
      lines = raw ? shop.normalizeCart(JSON.parse(raw)).items : [];
    } catch (e) { lines = []; }
    cartLines.set(lines);
  }
  return cartLines.get();
}

function saveCart(lines) {
  const clean = shop.normalizeCart(lines.filter(l => l.quantity > 0)).items;
  cartLines.set(clean);
  try { storage() && storage().setItem(shop.cartStorageKey(Utils.getCurrentBoardId()), JSON.stringify(clean)); } catch (e) { /* a private window keeps it on screen only */ }
}

function addToCart(cardId, quantity) {
  const lines = cart().slice();
  const line = lines.find(l => l.cardId === cardId);
  if (line) line.quantity = Math.min(shop.LIMITS.quantity, line.quantity + quantity);
  else lines.push({ cardId, quantity });
  saveCart(lines);
}

// ---------------------------------------------------------------- the board's shop

function board() {
  return Utils.getCurrentBoard();
}

function settings() {
  return shop.shopSettingsOf(board());
}

function coverUrlOf(product) {
  let image = product.coverId ? ReactiveCache.getAttachment(product.coverId) : null;
  if (!image || !image.isImage) {
    image = (ReactiveCache.getAttachments({ 'meta.cardId': product._id }) || []).find(a => a && a.isImage);
  }
  return image && typeof image.link === 'function' ? image.link() : '';
}

function products() {
  const boardId = Utils.getCurrentBoardId();
  if (!boardId) return [];
  return shop.productsOf({
    lists: ReactiveCache.getLists({ boardId }) || [],
    cards: ReactiveCache.getCards({ boardId, archived: false }) || [],
  }, settings());
}

function money(minor) {
  return formatMoney(minor, settings().currency, language());
}

// The cart priced from the products on screen - what the buyer sees before
// ordering. The server prices it again from the cards.
function priced() {
  const items = cart();
  if (!items.length) return { lines: [] };
  const all = products();
  const known = new Set(all.map(p => p._id));
  const priceable = items.filter(i => known.has(i.cardId));
  if (!priceable.length) return { lines: [] };
  const result = shop.priceCart(priceable, all, settings());
  return result.error ? { lines: [], error: result.error } : result;
}

function isBoardAdmin() {
  const user = ReactiveCache.getCurrentUser();
  return !!(user && typeof user.isBoardAdmin === 'function' && user.isBoardAdmin());
}

function refusal() {
  const b = board();
  return shop.checkoutRefusal({ settings: settings(), featureOn: true, canRead: !!b, userId: Meteor.userId() });
}

const ERROR_KEYS = {
  'shop-closed': 'shop-closed',
  'shop-guest-not-allowed': 'shop-login-to-order',
  'shop-price-changed': 'shop-price-changed',
  'shop-sold-out': 'shop-sold-out',
  'shop-not-enough-stock': 'shop-sold-out',
  'shop-no-orders-list': 'shop-closed',
  'shop-no-payment-method': 'shop-closed',
};

function refusalTextOf(code) {
  return ERROR_KEYS[code] ? t(ERROR_KEYS[code]) : code;
}

function goHome() {
  mode.set('shop');
  FlowRouter.setQueryParams({ product: null });
}

const shared = { money, settings };

// ---------------------------------------------------------------- the shop

Template.shopView.helpers({
  ...shared,
  mode: () => mode.get(),
  order: () => placedOrder.get(),
  isBoardAdmin,
  shopTitle() {
    const b = board();
    return settings().title || (b ? b.title : '');
  },
  shopIntro: () => settings().intro,
  // A closed shop shows its products to the board's admins only, so they can
  // see what it will look like before opening it.
  showShop: () => settings().enabled || isBoardAdmin(),
  cartCount: () => cart().reduce((n, l) => n + l.quantity, 0),
  category: () => category.get(),
  categories() {
    const b = board();
    return shop.categoriesOf(products(), b ? b.labels : [], settings());
  },
  products() {
    return shop.productsInCategory(products(), category.get())
      .map(p => ({ ...p, coverUrl: coverUrlOf(p), short: shop.shortDescription(p.description) }));
  },
  productPage() {
    const id = FlowRouter.getQueryParam('product');
    const product = id && products().find(p => p._id === id);
    if (!product) return null;
    return {
      ...product,
      coverUrl: coverUrlOf(product),
      hasStock: product.stock !== null,
      maxQuantity: product.stock === null ? shop.LIMITS.quantity : Math.min(product.stock, shop.LIMITS.quantity),
    };
  },
});

Template.shopView.events({
  'click .js-shop-home'(evt) {
    evt.preventDefault();
    goHome();
  },
  'click .js-shop-product'(evt) {
    evt.preventDefault();
    mode.set('shop');
    FlowRouter.setQueryParams({ product: evt.currentTarget.getAttribute('data-id') });
    window.scrollTo(0, 0);
  },
  'click .js-shop-category'(evt) {
    evt.preventDefault();
    category.set(evt.currentTarget.getAttribute('data-id') || '');
  },
  'click .js-shop-cart'(evt) {
    evt.preventDefault();
    mode.set('cart');
  },
  'click .js-shop-add-one'(evt) {
    evt.preventDefault();
    addToCart(evt.currentTarget.getAttribute('data-id'), 1);
  },
  'submit .js-shop-add'(evt) {
    evt.preventDefault();
    const quantity = parseInt(evt.currentTarget.elements.quantity.value, 10);
    if (!Number.isInteger(quantity) || quantity < 1) return;
    addToCart(evt.currentTarget.getAttribute('data-id'), Math.min(quantity, shop.LIMITS.quantity));
    mode.set('cart');
  },
  'click .js-open-shop-settings'(evt) {
    evt.preventDefault();
    Popup.open('boardShopSettings', { titleKey: 'board-view-shop', dataContext: board() })(evt);
  },
});

// ---------------------------------------------------------------- the cart

Template.shopCart.helpers({
  ...shared,
  priced,
  checkoutRefusal: refusal,
  refusalText: () => refusalTextOf(refusal()),
  priceErrorText: () => refusalTextOf(priced().error),
});

Template.shopCart.events({
  'change .js-shop-quantity'(evt) {
    const cardId = evt.currentTarget.getAttribute('data-id');
    const quantity = parseInt(evt.currentTarget.value, 10);
    saveCart(cart().map(l => (l.cardId === cardId ? { cardId, quantity: Number.isInteger(quantity) ? Math.max(0, Math.min(quantity, shop.LIMITS.quantity)) : l.quantity } : l)));
  },
  'click .js-shop-remove'(evt) {
    evt.preventDefault();
    const cardId = evt.currentTarget.getAttribute('data-id');
    saveCart(cart().filter(l => l.cardId !== cardId));
  },
  'click .js-shop-checkout'(evt) {
    evt.preventDefault();
    if (!refusal()) mode.set('checkout');
  },
});

Template.shopTotals.helpers(shared);

// ---------------------------------------------------------------- checkout

function methodLabel(entry) {
  const m = entry.method || {};
  return m.label || t(METHOD_KEYS[m.type] || m.type);
}

Template.shopCheckout.onCreated(function () {
  this.error = new ReactiveVar('');
  this.sending = new ReactiveVar(false);
});

Template.shopCheckout.helpers({
  ...shared,
  priced,
  error: () => Template.instance().error.get(),
  sending: () => Template.instance().sending.get(),
  paymentMethods: () => shop.enabledPaymentMethods(settings()).map(m => ({ id: m.id, label: methodLabel(m) })),
});

Template.shopCheckout.events({
  'click .js-shop-cart'(evt) {
    evt.preventDefault();
    mode.set('cart');
  },
  async 'submit .js-shop-place-order'(evt, tpl) {
    evt.preventDefault();
    const form = evt.currentTarget;
    const value = name => (form.elements[name] ? String(form.elements[name].value || '') : '');
    const method = form.querySelector('input[name="paymentMethodId"]:checked');
    const totals = priced();
    tpl.error.set('');
    tpl.sending.set(true);
    try {
      const order = await Meteor.callAsync('shopPlaceOrder', Utils.getCurrentBoardId(), {
        // Card ids and quantities only: the server prices the order itself.
        cart: cart().map(l => ({ cardId: l.cardId, quantity: l.quantity })),
        contact: {
          name: value('name'), email: value('email'), phone: value('phone'), address: value('address'), note: value('note'),
          termsAccepted: !!(form.elements.termsAccepted && form.elements.termsAccepted.checked),
        },
        paymentMethodId: method ? method.value : '',
        expectedTotalMinor: totals.totalMinor,
        // The confirmation e-mail is written in the buyer's language.
        language: language() || 'en',
      });
      saveCart([]);
      placedOrder.set(order);
      mode.set('done');
      window.scrollTo(0, 0);
    } catch (error) {
      tpl.error.set(refusalTextOf(error && error.error) !== (error && error.error) ? refusalTextOf(error.error) : errorText(error));
    } finally {
      tpl.sending.set(false);
    }
  },
});

// ---------------------------------------------------------------- the order placed

Template.shopOrderDone.helpers({
  ...shared,
  methodLabel() {
    return methodLabel(this);
  },
  qrCode() {
    return this.qr ? qrSvg(this.qr, this.swissCross) : '';
  },
  barcodeCode() {
    return this.barcode ? barcodeSvg(this.barcode) : '';
  },
  // A payment link of the method: https, or a payment app's own scheme -
  // never anything a browser would run.
  safeLink() {
    const link = typeof this.link === 'string' ? this.link : '';
    return /^(https:\/\/|upi:\/\/|bitcoin:|ethereum:|litecoin:)/i.test(link) ? link : '';
  },
  formattedReference() {
    const order = Template.currentData().order;
    return order ? formatReference(order.reference) : '';
  },
});

// ---------------------------------------------------------------- Board Settings / Shop

function fieldsOfBoard() {
  const boardId = Utils.getCurrentBoardId();
  return boardId ? (ReactiveCache.getCustomFields({ boardIds: { $in: [boardId] } }) || []) : [];
}

Template.boardShopSettingsPopup.onCreated(function () {
  const b = board();
  const current = settings();
  // A board that never saved its shop gets the fields and the Orders list its
  // names suggest: a custom field called Price, a list called Orders.
  const suggested = shop.suggestedMapping({
    customFields: fieldsOfBoard(),
    lists: b ? (ReactiveCache.getLists({ boardId: b._id, archived: false }) || []) : [],
  });
  const stored = b && b.shopSettings;
  // A copied board's shop keeps its look but not the source's fields and
  // Orders list (models/lib/shop.js copiedShopSettings): suggest those too.
  const fill = {};
  for (const key of ['priceFieldId', 'skuFieldId', 'stockFieldId']) if (!current[key] && suggested[key]) fill[key] = suggested[key];
  if (!current.ordersListId && suggested.ordersListId) Object.assign(fill, { ordersListId: suggested.ordersListId, ordersBoardId: b._id });
  this.draft = new ReactiveVar(stored ? { ...current, ...fill } : { ...current, ...suggested, ordersBoardId: suggested.ordersListId ? b._id : '' });
  this.methods = new ReactiveVar(current.paymentMethods.slice());
  this.methodType = new ReactiveVar('sepa');
  this.targets = new ReactiveVar([]);
  this.error = new ReactiveVar('');
  this.saved = new ReactiveVar(false);
  Meteor.callAsync('shopOrderTargets').then(targets => this.targets.set(targets || [])).catch(error => this.error.set(errorText(error)));
});

Template.boardShopSettingsPopup.helpers({
  draft: () => Template.instance().draft.get(),
  boardTitle: () => (board() ? board().title : ''),
  fieldsFor(key) {
    const types = shop.FIELD_TYPES[key] || [];
    return fieldsOfBoard().filter(f => types.includes(f.type)).map(f => ({ _id: f._id, name: f.name }));
  },
  referenceTypes: () => shop.REFERENCE_TYPES.map(value => ({ value, label: t(`billing-reference-${value}`) })),
  boardLists() {
    const b = board();
    const ticked = new Set(Template.instance().draft.get().saleListIds);
    return (b ? ReactiveCache.getLists({ boardId: b._id, archived: false }, { sort: { sort: 1 } }) || [] : [])
      .map(l => ({ _id: l._id, title: l.title, checked: ticked.has(l._id) }));
  },
  boardLabels() {
    const b = board();
    const ticked = new Set(Template.instance().draft.get().categoryLabelIds);
    return ((b && b.labels) || []).map(l => ({ _id: l._id, name: l.name || l.color, color: l.color, checked: ticked.has(l._id) }));
  },
  orderTargets: () => Template.instance().targets.get(),
  isOrdersList(boardId, listId) {
    const d = Template.instance().draft.get();
    return d.ordersListId === listId && (d.ordersBoardId || Utils.getCurrentBoardId()) === boardId;
  },
  showsOnPublic: () => shop.showsShopOnPublic(board()),
  // The view a visitor of this public board sees now, by its menu label.
  publicViewName() {
    const view = require('/models/lib/boardViewSettings').defaultBoardView(board(), 'public');
    const entry = BOARD_VIEWS.find(v => v.view === view);
    return entry ? t(entry.labelKey) : view;
  },
  draftMethods() {
    return Template.instance().methods.get().map(m => ({
      id: m.id, enabled: m.enabled !== false, label: methodLabel(m),
      summary: m.method.iban ? formatIban(m.method.iban)
        : (m.method.payee || m.method.key || m.method.vpa || m.method.address || m.method.user || m.method.url || m.method.details || ''),
    }));
  },
  methodTypes: () => Object.keys(PAYMENT_METHODS).map(value => ({ value, label: t(METHOD_KEYS[value] || value) })),
  methodType: () => Template.instance().methodType.get(),
  methodFields() {
    const spec = PAYMENT_METHODS[Template.instance().methodType.get()];
    return (spec ? spec.fields : []).map(name => ({ name, label: t(FIELD_KEYS[name] || name), placeholder: PLACEHOLDERS[name] || '' }));
  },
  error: () => Template.instance().error.get(),
  saved: () => Template.instance().saved.get(),
});

Template.boardShopSettingsPopup.events({
  'change .js-shop-method-type'(evt, tpl) {
    tpl.methodType.set(evt.currentTarget.value);
  },
  'click .js-shop-method-add'(evt, tpl) {
    evt.preventDefault();
    const type = tpl.methodType.get();
    const method = { type };
    for (const name of PAYMENT_METHODS[type].fields) {
      const input = tpl.find(`.js-shop-method-field[data-name="${name}"]`);
      method[name] = input ? input.value : '';
    }
    tpl.methods.set([...tpl.methods.get(), { id: Random.id(12).replace(/[^A-Za-z0-9]/g, ''), enabled: true, method }]);
    tpl.findAll('.js-shop-method-field').forEach(input => { input.value = ''; });
  },
  'change .js-shop-method-enabled'(evt, tpl) {
    const id = evt.currentTarget.getAttribute('data-id');
    tpl.methods.set(tpl.methods.get().map(m => (m.id === id ? { ...m, enabled: evt.currentTarget.checked } : m)));
  },
  'click .js-shop-method-remove'(evt, tpl) {
    evt.preventDefault();
    const id = evt.currentTarget.getAttribute('data-id');
    tpl.methods.set(tpl.methods.get().filter(m => m.id !== id));
  },
  async 'submit .js-shop-settings'(evt, tpl) {
    evt.preventDefault();
    const form = evt.currentTarget;
    const el = form.elements;
    const ticked = name => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(i => i.value);
    const [ordersBoardId, ordersListId] = String(el.orders.value || '').split('/');
    const input = {
      enabled: el.enabled.checked,
      title: el.title.value,
      intro: el.intro.value,
      currency: el.currency.value,
      priceFieldId: el.priceFieldId.value,
      skuFieldId: el.skuFieldId.value,
      stockFieldId: el.stockFieldId.value,
      decrementStock: el.decrementStock.checked,
      confirmationEmail: el.confirmationEmail.checked,
      vatPercent: el.vatPercent.value === '' ? 0 : Number(el.vatPercent.value),
      pricesIncludeVat: el.pricesIncludeVat.checked,
      referenceType: el.referenceType.value,
      saleListIds: ticked('saleListIds'),
      categoryLabelIds: ticked('categoryLabelIds'),
      ordersBoardId: ordersBoardId || '',
      ordersListId: ordersListId || '',
      guestCheckout: el.guestCheckout.checked,
      termsUrl: el.termsUrl.value,
      paymentMethods: tpl.methods.get(),
    };
    tpl.error.set('');
    tpl.saved.set(false);
    try {
      const stored = await Meteor.callAsync('shopSetSettings', Utils.getCurrentBoardId(), input, el.showOnPublic.checked);
      tpl.draft.set(stored);
      tpl.methods.set(stored.paymentMethods.slice());
      tpl.saved.set(true);
    } catch (error) {
      tpl.error.set(errorText(error));
    }
  },
});
