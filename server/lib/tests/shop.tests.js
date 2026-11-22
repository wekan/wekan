import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Cards from '/models/cards';
import Swimlanes from '/models/swimlanes';
import CustomFields from '/models/customFields';
import ShopOrders from '/models/shopOrders';
import Settings from '/models/settings';
import { BillingInvoices } from '/models/billing';
import { setOrderEmailSenderForTests } from '/server/lib/shopEmail';

// Board View / Shop (server/shop.js, models/lib/shop.js): Board Settings /
// Shop only for the board's admins, and an order priced from the cards - never
// from the browser - written as a card on a private orders board, with every
// setting enforced: a closed shop, visitors without an account, a payment
// method the shop does not offer, the stock.
describe('Shop view', function () {
  this.timeout(60000);
  it('saves settings for admins only, and takes orders only as the settings say, priced from the cards', async function () {
    if (!Meteor.isAppTest) this.skip();
    const admin = Random.id(), member = Random.id();
    const shopBoard = Random.id(), ordersBoard = Random.id(), publicOther = Random.id();
    const priceField = Random.id(), stockField = Random.id();
    const as = userId => (name, ...args) => DDP._CurrentMethodInvocation.withValue(
      { userId, isSimulation: false, connection: null, setUserId() {}, unblock() {} },
      () => Meteor.server.method_handlers[name].apply({ userId }, args));
    const asAdmin = as(admin), asMember = as(member), asGuest = as(null);
    const person = (userId, isAdmin) => ({ userId, isAdmin, isActive: true });
    const sepa = { id: 'm1', enabled: true, method: { type: 'sepa', name: 'Shop Oy', iban: 'FI2112345600000785', bic: '' } };
    const cash = { id: 'm2', enabled: false, method: { type: 'cash', details: 'At the counter' } };
    const settings = extra => ({
      enabled: true, title: 'Test shop', priceFieldId: priceField, stockFieldId: stockField, currency: 'EUR',
      ordersBoardId: ordersBoard, ordersListId: `${ordersBoard}-orders`, guestCheckout: false, paymentMethods: [sepa, cash], ...extra,
    });
    const contact = { name: 'Ann <b>Buyer</b>', email: 'ann@example.com' };
    // Admin Panel / Settings / Features / Shop view on, whatever this database
    // decided before (an approval policy holds back a feature added later).
    const setting = await Settings.findOneAsync({});
    const savedShopState = setting && setting.featureStates ? setting.featureStates['views-shop'] : undefined;
    const savedBillingState = setting && setting.featureStates ? setting.featureStates.billing : undefined;
    // Budget and billing OFF for the first orders: no invoice is made.
    if (setting) await Settings.updateAsync(setting._id, { $set: { 'featureStates.views-shop': true, 'featureStates.billing': false } });
    const billingOn = on => setting && Settings.updateAsync(setting._id, { $set: { 'featureStates.billing': on } });
    // The confirmation e-mails, captured instead of sent.
    const mails = [];
    setOrderEmailSenderForTests(async mail => { mails.push(mail); });
    let copyId = null;
    try {
      await Meteor.users.rawCollection().insertMany([
        { _id: admin, username: `admin-${admin}`, profile: {} },
        { _id: member, username: `member-${member}`, profile: {} },
      ]);
      await Boards.rawCollection().insertMany([
        { _id: shopBoard, title: 'Shop', slug: 'shop', type: 'board', archived: false, permission: 'public',
          members: [person(admin, true), person(member, false)], labels: [] },
        { _id: ordersBoard, title: 'Orders', slug: 'orders', type: 'board', archived: false, permission: 'private',
          members: [person(admin, true)], labels: [] },
        { _id: publicOther, title: 'Other', slug: 'other', type: 'board', archived: false, permission: 'public',
          members: [person(admin, true)], labels: [] },
      ]);
      await Swimlanes.rawCollection().insertMany([shopBoard, ordersBoard, publicOther].map(boardId => ({
        _id: `${boardId}-s`, boardId, title: 'Default', sort: 0, archived: false, type: 'swimlane' })));
      await Lists.rawCollection().insertMany([
        { _id: `${shopBoard}-l`, boardId: shopBoard, title: 'Products', sort: 0, archived: false },
        { _id: `${ordersBoard}-orders`, boardId: ordersBoard, title: 'Orders', sort: 0, archived: false },
        { _id: `${publicOther}-orders`, boardId: publicOther, title: 'Orders', sort: 0, archived: false },
      ]);
      await CustomFields.rawCollection().insertMany([
        { _id: priceField, boardIds: [shopBoard], name: 'Price', type: 'number', settings: {} },
        { _id: stockField, boardIds: [shopBoard], name: 'Stock', type: 'number', settings: {} },
      ]);
      const product = (id, title, price, stock) => ({ _id: id, boardId: shopBoard, swimlaneId: `${shopBoard}-s`, listId: `${shopBoard}-l`,
        title, sort: 0, archived: false, type: 'cardType-card', userId: admin,
        customFields: [{ _id: priceField, value: price }, ...(stock === undefined ? [] : [{ _id: stockField, value: stock }])] });
      await Cards.rawCollection().insertMany([product('shirt', 'Shirt', 10, 2), product('mug', 'Mug', 5)]);

      // Board Settings / Shop: a member who is not an admin is refused.
      await assert.rejects(asMember('shopSetSettings', shopBoard, settings(), true), /not-authorized/);
      // Negative: orders - names and addresses - never on a public board.
      await assert.rejects(asAdmin('shopSetSettings', shopBoard, settings({ ordersBoardId: publicOther, ordersListId: `${publicOther}-orders` })),
        /private board/);
      // Negative: a payment method that is not one of Budget and billing's, validated.
      await assert.rejects(asAdmin('shopSetSettings', shopBoard, settings({ paymentMethods: [{ id: 'x', method: { type: 'card-gateway' } }] })),
        /Unknown payment method/);
      const saved = await asAdmin('shopSetSettings', shopBoard, settings(), true);
      assert.equal(saved.enabled, true);
      let board = await Boards.findOneAsync(shopBoard);
      assert.equal(board.defaultPublicBoardView, 'board-view-shop', 'the Shop is what visitors see');
      assert.equal(board.shopSettings.updatedBy, admin);

      // A visitor without an account: refused while the shop does not allow it.
      await assert.rejects(asGuest('shopPlaceOrder', shopBoard, { cart: [{ cardId: 'mug', quantity: 1 }], contact, paymentMethodId: 'm1' }),
        /shop-guest-not-allowed/);
      // A payment method the shop does not offer (switched off) is refused.
      await assert.rejects(asMember('shopPlaceOrder', shopBoard, { cart: [{ cardId: 'mug', quantity: 1 }], contact, paymentMethodId: 'm2' }),
        /shop-payment-method/);
      // A total the buyer did not see: told, not charged.
      await assert.rejects(asMember('shopPlaceOrder', shopBoard,
        { cart: [{ cardId: 'mug', quantity: 1 }], contact, paymentMethodId: 'm1', expectedTotalMinor: 1 }), /shop-price-changed/);

      // A tampered price is not read: 2 shirts at 10 EUR are 20 EUR.
      await Cards.rawCollection().updateOne({ _id: 'shirt' }, { $set: { title: 'Shirt <script>alert(1)</script>' } });
      const order = await asMember('shopPlaceOrder', shopBoard,
        { cart: [{ cardId: 'shirt', quantity: 2, priceMinor: 1, totalMinor: 1 }], contact, paymentMethodId: 'm1', language: 'fi' });
      assert.equal(order.totalMinor, 2000);
      assert.match(order.number, /^ORD-\d{4}-00001$/);
      assert.match(order.reference, /^RF\d+$/);
      assert.match(order.payment.qr, /^BCD\n002\n/, 'the SEPA QR code of Budget and billing');
      const orderCard = await Cards.findOneAsync({ boardId: ordersBoard, listId: `${ordersBoard}-orders` });
      assert.ok(orderCard, 'the order is a card in the Orders list');
      assert.ok(orderCard.title.startsWith(order.number));
      assert.ok(orderCard.description.includes('ann@example.com'));
      assert.ok(!orderCard.description.includes('<b>'), 'the buyer\'s text is escaped');
      assert.equal(orderCard.userId, admin, 'written in the name of the admin who chose the Orders list');
      const shirt = await Cards.findOneAsync('shirt');
      assert.equal(shirt.customFields.find(f => f._id === stockField).value, 0, 'the stock is taken');
      const stored = await ShopOrders.findOneAsync({ boardId: shopBoard });
      assert.equal(stored.cardId, orderCard._id);
      assert.equal(stored.name, undefined, 'no personal data outside the order card');
      assert.equal(stored.email, undefined);
      // Budget and billing off: no invoice, and the card names none.
      assert.equal(order.invoiceNumber, '');
      assert.equal(await BillingInvoices.find({ boardId: shopBoard }).countAsync(), 0, 'no invoice while billing is off');
      assert.equal(stored.invoiceId, undefined);
      // The buyer's confirmation, in the buyer's language: number, lines, total, how to pay, the shop.
      assert.equal(order.emailed, true);
      assert.equal(mails.length, 1);
      const [mail] = mails;
      assert.equal(mail.to, 'ann@example.com');
      assert.ok(mail.subject.includes(order.number) && mail.subject.includes('Test shop'), mail.subject);
      assert.ok(!/[\r\n]/.test(mail.subject));
      assert.ok(mail.text.includes(order.number));
      assert.ok(mail.text.includes('2 × Shirt <script>alert(1)</script>'), 'the plain text keeps the title as text');
      assert.ok(mail.text.includes(order.reference));
      assert.ok(mail.text.includes('FI21 1234 5600 0007 85'), 'the IBAN line of the payment method');
      assert.ok(mail.text.includes('Näin maksat'), 'in Finnish, the buyer\'s language');
      assert.ok(!mail.html.includes('<script>'), 'the HTML part escapes the title');
      assert.ok(mail.html.includes('&lt;script&gt;'));

      // Sold out now.
      await assert.rejects(asMember('shopPlaceOrder', shopBoard, { cart: [{ cardId: 'shirt', quantity: 1 }], contact, paymentMethodId: 'm1' }),
        /shop-sold-out/);
      // A card that is not a product of this shop.
      await assert.rejects(asMember('shopPlaceOrder', shopBoard, { cart: [{ cardId: `${ordersBoard}-x`, quantity: 1 }], contact, paymentMethodId: 'm1' }),
        /shop-not-for-sale/);

      // Visitors allowed: a guest orders. Budget and billing on: the order is
      // also an invoice of the shop's board, with the order's reference. The
      // mail server fails: the order stands.
      await asAdmin('shopSetSettings', shopBoard, settings({ guestCheckout: true }));
      await billingOn(true);
      setOrderEmailSenderForTests(async () => { throw new Error('550 mail server says no'); });
      const guestOrder = await asGuest('shopPlaceOrder', shopBoard, { cart: [{ cardId: 'mug', quantity: 3 }], contact, paymentMethodId: 'm1' });
      assert.equal(guestOrder.totalMinor, 1500);
      assert.match(guestOrder.number, /-00002$/);
      assert.equal(guestOrder.emailed, false, 'a failed confirmation never fails the order');
      const invoice = await BillingInvoices.findOneAsync({ boardId: shopBoard });
      assert.ok(invoice, 'an invoice of the shop\'s board');
      assert.equal(invoice.number, guestOrder.invoiceNumber);
      assert.match(invoice.number, /^INV-\d{4}-\d{4}$/);
      assert.equal(invoice.paymentReference, guestOrder.reference, 'the same reference as the order card');
      assert.equal(invoice.reference, guestOrder.number);
      assert.equal(invoice.totalMinor, 1500);
      // A product line (models/lib/billing.js INVOICE_LINE_KINDS): 3 mugs at 5 EUR.
      assert.deepEqual(invoice.lines.map(l => [l.kind, l.cardId, l.quantity, l.unitMinor, l.amountMinor]), [['product', 'mug', 3, 500, 1500]]);
      const guestCard = await Cards.findOneAsync({ boardId: ordersBoard, title: { $regex: `^${guestOrder.number}` } });
      assert.ok(guestCard.description.includes(invoice.number), 'the order card names its invoice');
      assert.equal((await ShopOrders.findOneAsync({ number: guestOrder.number, boardId: shopBoard })).invoiceId, invoice._id);
      // Board Settings / Shop turns the e-mail off: nothing is sent.
      setOrderEmailSenderForTests(async mail => { mails.push(mail); });
      await asAdmin('shopSetSettings', shopBoard, settings({ guestCheckout: true, confirmationEmail: false }));
      const quiet = await asGuest('shopPlaceOrder', shopBoard, { cart: [{ cardId: 'mug', quantity: 1 }], contact, paymentMethodId: 'm1' });
      assert.equal(quiet.emailed, false);
      assert.equal(mails.length, 1, 'no confirmation when it is turned off');

      // A closed shop takes no order.
      await asAdmin('shopSetSettings', shopBoard, settings({ enabled: false }), false);
      board = await Boards.findOneAsync(shopBoard);
      assert.equal(board.defaultPublicBoardView, 'board-view-swimlanes', 'unticked: the kanban again');
      await assert.rejects(asMember('shopPlaceOrder', shopBoard, { cart: [{ cardId: 'mug', quantity: 1 }], contact, paymentMethodId: 'm1' }),
        /shop-closed/);

      // Negative: a copy of the board never takes orders into this Orders list.
      await asAdmin('shopSetSettings', shopBoard, settings());
      copyId = await asAdmin('copyBoard', shopBoard, {});
      const copy = await Boards.findOneAsync(copyId);
      assert.ok(copy && copy._id !== shopBoard);
      assert.equal(copy.shopSettings.enabled, false, 'the copy\'s shop is closed');
      assert.equal(copy.shopSettings.ordersBoardId, '');
      assert.equal(copy.shopSettings.ordersListId, '');
      assert.equal(copy.shopSettings.priceFieldId, '', 'not the source board\'s custom field');
      assert.equal(copy.shopSettings.updatedBy, undefined, 'no owner to write orders in the name of');
      assert.equal(copy.shopSettings.title, 'Test shop', 'the look is kept');
      await assert.rejects(asMember('shopPlaceOrder', copyId, { cart: [{ cardId: 'mug', quantity: 1 }], contact, paymentMethodId: 'm1' }),
        /shop-closed|not-authorized/);
    } finally {
      setOrderEmailSenderForTests(null);
      if (copyId) {
        for (const c of [Cards, Lists, Swimlanes]) await c.rawCollection().deleteMany({ boardId: copyId });
        await CustomFields.rawCollection().deleteMany({ boardIds: copyId });
        await Boards.rawCollection().deleteMany({ _id: copyId });
      }
      await BillingInvoices.rawCollection().deleteMany({ boardId: shopBoard });
      await Cards.rawCollection().deleteMany({ boardId: { $in: [shopBoard, ordersBoard, publicOther] } });
      await Lists.rawCollection().deleteMany({ boardId: { $in: [shopBoard, ordersBoard, publicOther] } });
      await Swimlanes.rawCollection().deleteMany({ boardId: { $in: [shopBoard, ordersBoard, publicOther] } });
      await Boards.rawCollection().deleteMany({ _id: { $in: [shopBoard, ordersBoard, publicOther] } });
      await CustomFields.rawCollection().deleteMany({ _id: { $in: [priceField, stockField] } });
      await ShopOrders.rawCollection().deleteMany({ boardId: shopBoard });
      await Meteor.users.rawCollection().deleteMany({ _id: { $in: [admin, member] } });
      if (setting) {
        await Settings.updateAsync(setting._id, savedShopState === undefined
          ? { $unset: { 'featureStates.views-shop': '' } } : { $set: { 'featureStates.views-shop': savedShopState } });
        await Settings.updateAsync(setting._id, savedBillingState === undefined
          ? { $unset: { 'featureStates.billing': '' } } : { $set: { 'featureStates.billing': savedBillingState } });
      }
    }
  });
});
