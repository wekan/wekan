// Board View / Shop (docs/Features/Board-Header/Board-Views/Shop.md,
// docs/Features/Board-Sidebar/Board-Settings/Shop.md): Board Settings / Shop
// and the orders of a shop.
//
// Every setting is enforced HERE, whatever a browser sends:
//   - only an active admin of the board saves its shop settings, and only
//     through shopSetSettings: a client write of shopSettings is refused;
//   - a closed shop takes no order, a visitor without an account orders only
//     where the shop allows it, a payment method the shop does not offer is
//     refused;
//   - prices and totals are computed from the cards (models/lib/shop.js); a
//     cart sends card ids and quantities, nothing else of it is read;
//   - an order is written only on a private board, by its admin's settings.
// Refusals no screen produces are recorded in Admin Panel -> Problems.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import CustomFields from '/models/customFields';
import ShopOrders from '/models/shopOrders';
import { featureOnFor, requireFeature } from '/server/lib/assistGate';
import { canReadBoard } from '/models/lib/boardVisibility';
import { createOrderInvoice, removeOrderInvoice } from '/server/lib/shopInvoice';
import { sendOrderConfirmation } from '/server/lib/shopEmail';

const shop = require('/models/lib/shop');
const { isFeatureAvailable } = require('/models/lib/instanceFeatures');
const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');
const { formatMoney } = require('/models/lib/billing');

const MAX_BOARDS = 500;
const MAX_LISTS = 300;
// Orders one shop takes in an hour, from everybody together: beyond it the
// shop is being flooded, not shopped in.
const MAX_ORDERS_PER_HOUR = 200;

function record(key, action, source, detail, userId) {
  try {
    require('/server/lib/securityLog').record({ key, action, source, detail, userId: userId || undefined });
  } catch (e) { /* logging must never break the guard */ }
}

function invalid(error) {
  throw new Meteor.Error('invalid-input', (error && error.message) || 'Invalid input');
}

function activeAdmin(board, userId) {
  return !!userId && (board.members || []).some(m => m && m.userId === userId && m.isActive !== false && m.isAdmin === true);
}

// Admin Panel / Settings / Features / Shop view, for whoever is asking. A
// visitor has no account, so the instance's own decision answers for them.
async function shopFeatureOn(userId, source) {
  if (!userId) {
    const setting = await ReactiveCache.getCurrentSetting();
    return isFeatureAvailable(setting, null, 'views-shop');
  }
  if (await featureOnFor(userId, 'views-shop')) return true;
  record('authz.disabled-setting', 'blocked', source, 'Admin Panel / Settings / Features: views-shop is turned off.', userId);
  return false;
}

// Labels of the order card, in the shop owner's language.
async function translator(userId) {
  const user = userId ? await Meteor.users.findOneAsync(userId, { fields: { 'profile.language': 1 } }) : null;
  const language = (user && user.profile && user.profile.language) || 'en';
  // The server has only English loaded until a language is asked for.
  try { await TAPi18n.ensureLanguageLoaded(language); } catch (e) { /* English, then */ }
  return {
    language,
    t: key => {
      try { return TAPi18n.__(key, {}, language); } catch (e) { return key; }
    },
  };
}

// The next order number of a shop this year: the one after the largest, taken
// by a unique index so two orders at once can not share it.
async function insertNumbered(boardId, year, build) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const last = await ShopOrders.findOneAsync({ boardId, year }, { sort: { sequence: -1 }, fields: { sequence: 1 } });
    const sequence = ((last && last.sequence) || 0) + 1 + attempt;
    const doc = build(sequence);
    try {
      const _id = await ShopOrders.insertAsync(doc);
      return { _id, doc };
    } catch (e) {
      if (!/duplicate key|E11000/i.test(String(e && e.message))) throw e;
    }
  }
  throw new Meteor.Error('shop-busy', 'Could not number the order; try again');
}

// Stock taken by an order, card by card: each written only if the card still
// has the custom fields it was priced with, so two buyers of the last one can
// not both have it. Undone if a later card of the order fails.
async function takeStock(settings, cards, lines) {
  const done = [];
  const restore = async () => {
    for (const { cardId, before } of done.reverse()) {
      await Cards.rawCollection().updateOne({ _id: cardId }, { $set: { customFields: before } }).catch(() => {});
    }
  };
  for (const line of lines) {
    const card = cards.find(c => c._id === line.cardId);
    const stock = shop.stockOf(shop.fieldValue(card, settings.stockFieldId));
    if (stock === null) continue;
    const before = card.customFields;
    const after = before.map(f => (f && f._id === settings.stockFieldId ? { ...f, value: stock - line.quantity } : f));
    // The driver's own update: a whole-array match, as MongoDB and FerretDB
    // both compare it, with nothing in between that could rewrite the selector.
    const result = await Cards.rawCollection().updateOne({ _id: card._id, customFields: before }, { $set: { customFields: after, modifiedAt: new Date() } });
    if (!result || !result.modifiedCount) {
      await restore();
      throw new Meteor.Error('shop-not-enough-stock', line.cardId);
    }
    done.push({ cardId: card._id, before });
  }
  return restore;
}

Meteor.methods({
  // Board Settings / Shop: the whole settings at once. `showOnPublic`, when
  // given, is "Show the Shop instead of the public board".
  async shopSetSettings(boardId, input, showOnPublic) {
    check(boardId, String);
    check(input, Object);
    check(showOnPublic, Match.Optional(Boolean));
    await requireFeature(this.userId, 'views-shop', 'ddp:shopSetSettings');
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const board = await Boards.findOneAsync(boardId);
    if (!board) throw new Meteor.Error('not-found');
    if (!activeAdmin(board, this.userId)) {
      // Board Settings / Shop is drawn for the board's admins only.
      record('authz.shop-settings', 'blocked', 'ddp:shopSetSettings', 'Board Settings / Shop saved by somebody who is not an admin of the board.', this.userId);
      throw new Meteor.Error('not-authorized');
    }
    let settings;
    try { settings = shop.normalizeShopSettings(input); } catch (e) { invalid(e); }
    const [customFields, lists] = await Promise.all([
      CustomFields.find({ boardIds: boardId }, { fields: { _id: 1, type: 1, settings: 1 } }).fetchAsync(),
      Lists.find({ boardId }, { fields: { _id: 1, archived: 1 }, limit: MAX_LISTS }).fetchAsync(),
    ]);
    const ordersBoardId = settings.ordersListId ? (settings.ordersBoardId || boardId) : '';
    let ordersBoard = null;
    let ordersLists = [];
    if (ordersBoardId) {
      ordersBoard = ordersBoardId === boardId ? board : await Boards.findOneAsync(ordersBoardId);
      if (ordersBoard && !activeAdmin(ordersBoard, this.userId)) {
        // The Orders list is chosen from the boards this admin administers.
        record('authz.shop-settings', 'blocked', 'ddp:shopSetSettings', 'Board Settings / Shop named an Orders list on a board the user is not an admin of.', this.userId);
        ordersBoard = null;
      }
      if (ordersBoard) {
        ordersLists = await Lists.find({ boardId: ordersBoard._id, archived: { $ne: true } }, { fields: { _id: 1 } }).fetchAsync();
      }
    }
    let checked;
    try {
      checked = shop.checkShopSettingsAgainstBoard({ ...settings, ordersBoardId }, { board, customFields, lists, ordersBoard, ordersLists });
    } catch (e) { invalid(e); }
    // Who chose the Orders list: the order cards are written in their name,
    // and only while they are still an admin of that board.
    const $set = { shopSettings: { ...checked, updatedBy: this.userId, updatedAt: new Date() } };
    if (typeof showOnPublic === 'boolean') Object.assign($set, shop.publicShopModifier(board, showOnPublic));
    await Boards.updateAsync({ _id: boardId }, { $set });
    return shop.shopSettingsOf({ shopSettings: checked });
  },

  // The boards an Orders list may be on: private boards this user is an admin
  // of, with their lists.
  async shopOrderTargets() {
    await requireFeature(this.userId, 'views-shop', 'ddp:shopOrderTargets');
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const boards = await Boards.find({
      archived: { $ne: true }, permission: 'private', type: { $nin: ['template-container', 'template-board'] },
      members: { $elemMatch: { userId: this.userId, isAdmin: true, isActive: { $ne: false } } },
    }, { fields: { _id: 1, title: 1 }, sort: { title: 1 }, limit: MAX_BOARDS }).fetchAsync();
    const lists = boards.length ? await Lists.find({ boardId: { $in: boards.map(b => b._id) }, archived: { $ne: true } },
      { fields: { _id: 1, boardId: 1, title: 1, sort: 1 }, sort: { sort: 1 }, limit: MAX_BOARDS * 20 }).fetchAsync() : [];
    return boards.map(b => ({ _id: b._id, title: b.title || '',
      lists: lists.filter(l => l.boardId === b._id).map(l => ({ _id: l._id, title: l.title || '' })) }));
  },

  // Checkout: the order as a card in the Orders list, and what the buyer pays
  // with. Open to a visitor without an account where the shop allows it.
  async shopPlaceOrder(boardId, request) {
    check(boardId, String);
    check(request, {
      cart: [Object],
      contact: Object,
      paymentMethodId: String,
      expectedTotalMinor: Match.Optional(Match.Integer),
      // The buyer's language, for the confirmation e-mail.
      language: Match.Optional(String),
    });
    const userId = this.userId || null;
    const source = 'ddp:shopPlaceOrder';
    const featureOn = await shopFeatureOn(userId, source);
    const board = await ReactiveCache.getBoard(boardId);
    if (!board) throw new Meteor.Error('not-found');
    const settings = shop.shopSettingsOf(board);
    const refusal = shop.checkoutRefusal({ settings, featureOn, canRead: canReadBoard(userId, board), userId });
    if (refusal) {
      // The Shop view offers no checkout in any of these cases: a closed shop,
      // a visitor where only accounts may order, a board the caller can not
      // read, a shop with no Orders list or no payment method.
      if (refusal !== 'shop-feature-off') {
        record('authz.shop-order', 'blocked', source, `An order the shop does not take: ${refusal}.`, userId);
      }
      throw new Meteor.Error(refusal);
    }
    let contact;
    let cart;
    try {
      contact = shop.normalizeContact(request.contact, settings);
      cart = shop.normalizeCart(request.cart);
    } catch (e) { invalid(e); }
    if (cart.tampered) {
      // The Shop view sends a card and a quantity per line; a price or a total
      // on a line is somebody else's. It is not read: the cards decide.
      record('authz.shop-order', 'detected', source, 'A cart line carried more than a card and a quantity; the order was priced from the cards.', userId);
    }
    const method = shop.paymentMethodFor(settings, request.paymentMethodId);
    if (!method) {
      record('authz.shop-order', 'blocked', source, 'An order with a payment method the shop does not offer.', userId);
      throw new Meteor.Error('shop-payment-method');
    }
    const ownerId = board.shopSettings && board.shopSettings.updatedBy;
    const ordersBoard = await Boards.findOneAsync(settings.ordersBoardId);
    const ordersList = ordersBoard && await Lists.findOneAsync({ _id: settings.ordersListId, boardId: ordersBoard._id, archived: { $ne: true } });
    if (!ordersList || !activeAdmin(ordersBoard, ownerId)) throw new Meteor.Error('shop-no-orders-list');
    if (!shop.isPrivateOrdersBoard(ordersBoard)) throw new Meteor.Error('shop-orders-board-public');

    // The products of the cart, read now from the cards - only those this
    // person sees on the board.
    const ids = cart.items.map(i => i.cardId);
    let cards = await Cards.find({ _id: { $in: ids }, boardId: board._id, archived: false },
      { fields: { _id: 1, title: 1, listId: 1, type: 1, archived: 1, customFields: 1, labelIds: 1, sort: 1, assignees: 1 } }).fetchAsync();
    if (userId && isAssignedOnlyMember(board, userId)) cards = cards.filter(c => (c.assignees || []).includes(userId));
    const lists = await Lists.find({ boardId: board._id }, { fields: { _id: 1, sort: 1, archived: 1 }, limit: MAX_LISTS }).fetchAsync();
    const products = shop.productsOf({ lists, cards }, settings);
    const priced = shop.priceCart(cart.items, products, settings);
    if (priced.error) throw new Meteor.Error(priced.error, priced.cardId || '');
    if (request.expectedTotalMinor !== undefined && request.expectedTotalMinor !== priced.totalMinor) {
      // A price changed since the cart was drawn: the buyer sees the new total
      // and orders again. Not an attempt - prices change.
      throw new Meteor.Error('shop-price-changed', String(priced.totalMinor));
    }
    const lastHour = await ShopOrders.find({ boardId: board._id, createdAt: { $gt: new Date(Date.now() - 3600000) } }).countAsync();
    if (lastHour >= MAX_ORDERS_PER_HOUR) {
      record('dos.shop-orders', 'blocked', source, `More than ${MAX_ORDERS_PER_HOUR} orders in an hour.`, userId);
      throw new Meteor.Error('shop-too-many-orders');
    }

    const year = new Date().getFullYear();
    const { _id: orderId, doc: order } = await insertNumbered(board._id, year, sequence => ({
      boardId: board._id,
      ordersBoardId: ordersBoard._id,
      year,
      sequence,
      number: shop.orderNumber(year, sequence),
      reference: shop.orderReference(year, sequence, settings.referenceType) || '',
      currency: priced.currency,
      netMinor: priced.netMinor,
      vatMinor: priced.vatMinor,
      vatPercent: priced.vatPercent,
      totalMinor: priced.totalMinor,
      lineCount: priced.lines.length,
      paymentMethodId: method.id,
      paymentType: method.method.type,
      byAccount: !!userId,
      createdAt: new Date(),
    }));
    let restoreStock = async () => {};
    let invoice = null;
    const full = { ...order, lines: priced.lines };
    try {
      if (settings.decrementStock && settings.stockFieldId) restoreStock = await takeStock(settings, cards, priced.lines);
      // Budget and billing on for the shop's owner, who is still an admin of
      // the shop's board: the order is also an invoice of that board, with the
      // order's own payment reference. Off: no invoice at all.
      if (activeAdmin(board, ownerId) && await featureOnFor(ownerId, 'billing')) {
        invoice = await createOrderInvoice({ boardId: board._id, ownerId, order: full, contact });
        await ShopOrders.updateAsync({ _id: orderId }, { $set: { invoiceId: invoice.invoiceId, invoiceNumber: invoice.number } });
      }
      const { t, language } = await translator(ownerId);
      const swimlane = await ordersBoard.getDefaultSwimlineAsync();
      if (!swimlane) throw new Meteor.Error('shop-no-orders-list');
      const last = await Cards.findOneAsync({ listId: ordersList._id, archived: false }, { sort: { sort: -1 }, fields: { sort: 1 } });
      const methodLabel = method.method.label || t(`billing-method-${method.method.type}`);
      const cardId = await Cards.insertAsync({
        title: shop.orderCardTitle(full, contact),
        description: shop.orderCardDescription({
          order: full, contact, method: methodLabel, t, money: minor => formatMoney(minor, priced.currency, language),
          invoiceNumber: invoice ? invoice.number : '',
        }),
        listId: ordersList._id,
        boardId: ordersBoard._id,
        swimlaneId: swimlane._id,
        sort: last && Number.isFinite(last.sort) ? last.sort + 1 : 0,
        type: 'cardType-card',
        cardNumber: await ordersBoard.getNextCardNumber(),
        userId: ownerId,
      });
      await ShopOrders.updateAsync({ _id: orderId }, { $set: { cardId } });
    } catch (e) {
      await restoreStock();
      if (invoice) await removeOrderInvoice(invoice.invoiceId).catch(() => {});
      await ShopOrders.removeAsync({ _id: orderId }).catch(() => {});
      throw e;
    }
    const payment = shop.orderPaymentInstructions(method, order, settings.title);
    // The buyer's receipt. It never fails the order: a failure is recorded in
    // Admin Panel / Problems and the order stands.
    const language = shop.isLanguageTag(request.language) ? request.language : 'en';
    const emailed = await sendOrderConfirmation({ settings, shopTitle: board.title, to: contact.email, language, order: full, payment, method,
      money: (minor, lang) => formatMoney(minor, priced.currency, lang) });
    return {
      number: order.number,
      reference: order.reference,
      currency: order.currency,
      netMinor: order.netMinor,
      vatMinor: order.vatMinor,
      vatPercent: order.vatPercent,
      totalMinor: order.totalMinor,
      lines: priced.lines,
      payment,
      invoiceNumber: invoice ? invoice.number : '',
      emailed: emailed === 'sent',
    };
  },
});

// shopSettings is written by shopSetSettings above, which checks it; a client
// write would skip that - an Orders list on somebody else's board, a payment
// method that was never validated. Board Settings / Shop never writes it so.
Boards.deny({
  update(userId, doc, fields) {
    if (!Array.isArray(fields) || !fields.includes('shopSettings')) return false;
    record('authz.shop-settings', 'blocked', 'ddp:boards.update', 'A client write of a board\'s shopSettings, past Board Settings / Shop.', userId);
    return true;
  },
});

// A checkout is a person filling in a form: five a minute from one connection,
// thirty an hour from one address, is more than anybody shops.
DDPRateLimiter.addRule({ type: 'method', name: 'shopPlaceOrder', connectionId() { return true; } }, 5, 60000);
DDPRateLimiter.addRule({ type: 'method', name: 'shopPlaceOrder', clientAddress() { return true; } }, 30, 3600000);
DDPRateLimiter.addRule({ type: 'method', name: 'shopSetSettings', connectionId() { return true; } }, 30, 60000);
