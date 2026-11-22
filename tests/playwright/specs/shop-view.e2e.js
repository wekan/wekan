'use strict';
// Board View / Shop (models/lib/shop.js, server/shop.js): a board admin opens
// the shop in Board Settings / Shop, a card with a price is a product, it goes
// into the cart and is ordered, and the order is a card in the Orders list. A
// public board whose public view is the Shop shows a visitor the shop, not the
// kanban. tests/shop.test.cjs and server/lib/tests/shop.tests.js pin the rules.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

function seedShop(user, stamp, { title }) {
  const board = db.seedBoard({ ownerId: user.id, title, listCount: 2,
    cardTitlesPerList: [[`Shirt ${stamp}`, `Draft idea ${stamp}`], []] });
  const [products, orders] = board.listIds;
  db.updateOne('lists', { _id: products }, { $set: { title: 'Products' } });
  db.updateOne('lists', { _id: orders }, { $set: { title: 'Orders' } });
  const priceField = `price-${stamp}`;
  db.insertOne('customFields', { _id: priceField, boardIds: [board.boardId], name: 'Price', type: 'number', settings: {},
    showOnCard: false, automaticallyOnCard: false, alwaysOnCard: false, showLabelOnMiniCard: false, showSumAtTopOfList: false,
    createdAt: new Date(), modifiedAt: new Date() });
  const shirt = db.findCardIdByTitle({ boardId: board.boardId, title: `Shirt ${stamp}` });
  db.updateOne('cards', { _id: shirt }, { $set: { customFields: [{ _id: priceField, value: 12.5 }],
    description: `Soft **cotton** ${stamp}.` } });
  return { board, products, orders, priceField, shirt };
}

test('Shop view: an admin opens the shop, a product is bought, the order is a card', async ({ page, user }) => {
  const stamp = Date.now();
  const { board, orders, priceField } = seedShop(user, stamp, { title: `Shop ${stamp}` });
  try {
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.boardView': 'board-view-shop' } });
    await loginWithToken(page, user.id, user.token);
    // Not openBoard(): it waits for the kanban's lists, which the Shop does not draw.
    await page.goto(`/b/${board.boardId}/${board.slug}`, { waitUntil: 'commit' });
    const shop = page.locator('.shop-view');
    await expect(shop).toBeVisible({ timeout: 30_000 });
    // Closed and not set up: the admin sees the notice and the settings cog.
    await expect(shop.locator('.shop-closed')).toBeVisible();

    await shop.locator('.js-open-shop-settings').click();
    const form = page.locator('form.js-shop-settings');
    await expect(form).toBeVisible();
    // The field called Price and the list called Orders are suggested.
    await expect(form.locator('select[name="priceFieldId"]')).toHaveValue(priceField);
    await expect(form.locator(`select[name="orders"] option[value="${board.boardId}/${orders}"]`)).toHaveCount(1, { timeout: 15_000 });
    await form.locator('select[name="orders"]').selectOption(`${board.boardId}/${orders}`);
    await form.locator('input[name="enabled"]').check();
    await form.locator('.js-shop-method-type').selectOption('cash');
    await form.locator('#shop-method-details').fill(`Pay at the counter ${stamp}`);
    await form.locator('.js-shop-method-add').click();
    await expect(form.locator('.shop-settings-method')).toHaveCount(1);
    await form.locator('button[type="submit"]').click();
    await expect(form.locator('.shop-saved')).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press('Escape');

    // The product: the priced card only, never the card without a price.
    const tile = shop.locator('.shop-tile', { hasText: `Shirt ${stamp}` });
    await expect(tile).toBeVisible({ timeout: 15_000 });
    await expect(tile.locator('.shop-price')).toContainText('12.50');
    await expect(shop.locator('.shop-grid')).not.toContainText(`Draft idea ${stamp}`);
    await tile.locator('.js-shop-product').click();
    await expect(shop.locator('.shop-product-description strong')).toHaveText('cotton');
    await shop.locator('form.js-shop-add input[name="quantity"]').fill('2');
    await shop.locator('form.js-shop-add button[type="submit"]').click();

    // The cart, priced: 2 x 12.50.
    const cart = shop.locator('.shop-cart');
    await expect(cart.locator('.shop-total').last()).toContainText('25.00');
    await cart.locator('.js-shop-checkout').click();
    const checkout = shop.locator('form.js-shop-place-order');
    await checkout.locator('input[name="name"]').fill(`Ann ${stamp}`);
    await checkout.locator('input[name="email"]').fill('ann@example.com');
    await checkout.locator('button[type="submit"]').click();

    const done = shop.locator('.shop-done');
    await expect(done).toBeVisible({ timeout: 15_000 });
    await expect(done).toContainText('ORD-');
    await expect(done).toContainText(`Pay at the counter ${stamp}`);
    // The order is a card in the Orders list, with the buyer and the total.
    await expect.poll(() => db.find('cards', { boardId: board.boardId, listId: orders }, { title: 1, description: 1 }).length,
      { timeout: 15_000 }).toBe(1);
    const [order] = db.find('cards', { boardId: board.boardId, listId: orders }, { title: 1, description: 1 });
    expect(order.title).toMatch(new RegExp(`^ORD-\\d{4}-00001 Ann ${stamp}$`));
    expect(order.description).toContain('ann@example.com');
    expect(order.description).toContain('25.00');
    // The cart is empty again.
    await expect(shop.locator('.shop-cart-count')).toHaveText('0');
    // Budget and billing is on here: the order is also an invoice of the
    // board, with the order card's own payment reference, and the card names it.
    await expect(done.locator('.shop-invoice-number')).toContainText('INV-');
    const [invoice] = db.find('billingInvoices', { boardId: board.boardId }, { number: 1, paymentReference: 1, totalMinor: 1 });
    expect(invoice.totalMinor).toBe(2500);
    expect(order.description).toContain(invoice.number);
    const [stored] = db.find('shopOrders', { boardId: board.boardId }, { reference: 1, invoiceId: 1 });
    expect(invoice.paymentReference).toBe(stored.reference);
    expect(stored.invoiceId).toBe(invoice._id);
  } finally {
    db.deleteMany('customFields', { _id: priceField });
    db.deleteMany('shopOrders', { boardId: board.boardId });
    db.deleteMany('billingInvoices', { boardId: board.boardId });
    db.cleanup({ boardIds: [board.boardId] });
  }
});

test('Shop view: a visitor of a public board sees the shop instead of the kanban', async ({ page, user }) => {
  const stamp = Date.now();
  const { board, orders, priceField } = seedShop(user, stamp, { title: `Public shop ${stamp}` });
  try {
    db.updateOne('boards', { _id: board.boardId }, { $set: {
      permission: 'public',
      defaultPublicBoardView: 'board-view-shop',
      shopSettings: { enabled: true, title: `Corner shop ${stamp}`, intro: '', currency: 'EUR', priceFieldId: priceField,
        skuFieldId: '', stockFieldId: '', saleListIds: [], categoryLabelIds: [], ordersBoardId: board.boardId, ordersListId: orders,
        guestCheckout: false, termsUrl: '', vatPercent: 0, pricesIncludeVat: true, referenceType: 'rf', decrementStock: true,
        paymentMethods: [{ id: 'cash1', enabled: true, method: { type: 'cash', details: 'Cash' } }], updatedBy: user.id },
    } });
    // A visitor: the `page` fixture is not signed in.
    await page.goto(`/b/${board.boardId}/${board.slug}`, { waitUntil: 'commit' });
    const shop = page.locator('.shop-view');
    await expect(shop).toBeVisible({ timeout: 30_000 });
    await expect(shop.locator('.shop-title')).toContainText(`Corner shop ${stamp}`);
    await expect(shop.locator('.shop-tile', { hasText: `Shirt ${stamp}` })).toBeVisible();
    // Negative: the kanban is not what the visitor sees.
    await expect(page.locator('.js-list:not(.js-list-composer)')).toHaveCount(0);
    // Visitors may not order without an account here: no checkout is offered.
    await shop.locator('.js-shop-add-one').first().click();
    await shop.locator('.shop-cart-button').click();
    await expect(shop.locator('.shop-cart .shop-notice')).toBeVisible();
    await expect(shop.locator('.js-shop-checkout')).toHaveCount(0);
  } finally {
    db.deleteMany('customFields', { _id: priceField });
    db.cleanup({ boardIds: [board.boardId] });
  }
});
