# Right sidebar / Board Settings / Shop

## What it is

**Board Settings → Shop** decides what Board View → [Shop](../../Board-Header/Board-Views/Shop.md)
sells and how: whether the shop is open, which custom fields of the cards are
the price, the product code and the stock, which lists are on sale, which
labels are the categories, where orders are written, which payment methods
are offered, and whether the Shop is what visitors of the public board see.
Board admins only.

## Read more

- [E-commerce](https://en.wikipedia.org/wiki/E-commerce) on Wikipedia.
- [Value-added tax](https://en.wikipedia.org/wiki/Value-added_tax) and
  [Creditor Reference (ISO 11649)](https://en.wikipedia.org/wiki/Creditor_Reference).
- In WeKan: [Shop](../../Board-Header/Board-Views/Shop.md),
  [Budget and billing](../../Billing/Billing.md) and
  [Board View](Board-View.md).

## How to use it

1. Open a board, its right sidebar, then **Board Settings** → **Shop**.
2. Set the rows below, then **Save**. Everything is saved at once, and the
   server checks every value again.

| Row | What it does |
| --- | --- |
| The shop is open | Off: visitors see *The shop is closed*, admins still see the products to prepare them, and no order is taken |
| Title, Introduction | The shop's name (the board's title when empty) and a text above the products, in Markdown |
| Price (custom field) | A Number, Currency or Text custom field of the board. A card with a number in it, in a list on sale, is a product |
| Product code (custom field), Stock (custom field) | Optional: a Text or Number field shown as the product code, a Number field as the stock |
| Take ordered products from the stock | An order lowers the stock field of each card in it |
| Currency, VAT %, Prices include VAT | The shop's currency (fixed to its own by a Currency price field), and its VAT |
| Payment reference | RF creditor reference, Finnish, Belgian, Norwegian KID, Swedish OCR, or none - Budget and billing's |
| Lists on sale | None ticked: every list but the Orders list |
| Labels shown as categories | None ticked: every label a product carries |
| Orders list | A list on a private board you are an admin of |
| Visitors without an account may order | Off: only signed-in users order |
| Terms and conditions (link) | An http or https address the buyer must accept |
| Show the Shop instead of the public board | The public board's default view becomes the Shop |
| Payment methods | Budget and billing's methods, each with its own fields; untick one to stop offering it |

A field, list or label left from an old setting that is not the board's own,
an Orders list on a public board, and an address that is not http or https
are refused with the reason.

**The Shop or the Website.** A public board opens in one view for its
visitors. Ticking *Show the Shop instead of the public board* makes the Shop
that view and replaces what was there - Website, say; choosing Website or
another view as *Default on Public Board* in [Board View](Board-View.md)
replaces the Shop. Unticking it when the Shop is the public view gives the
visitors Swimlanes again; when another view is, it changes nothing.

## How the numbers are calculated

The prices, totals, VAT, stock and order numbers are described in
[Shop: How the numbers are calculated](../../Board-Header/Board-Views/Shop.md#how-the-numbers-are-calculated).
The limits of the settings themselves (`LIMITS` in
[models/lib/shop.js](../../../../models/lib/shop.js)): a title of 200
characters, an introduction of 5,000, a terms link of 2,000, at most 20
payment methods, at most 500 lists or labels ticked, VAT 0 to 100 percent to
two decimals.

## How it works in WeKan

The popup is `boardShopSettingsPopup` in
[client/components/boards/shopView.jade](../../../../client/components/boards/shopView.jade),
opened from `boardMenuPopup` in
[client/components/sidebar/sidebar.jade](../../../../client/components/sidebar/sidebar.jade)
for board admins while Admin Panel / Settings / Features keeps **Shop view**
on. It saves through `shopSetSettings` in
[server/shop.js](../../../../server/shop.js), which refuses anybody but an
active admin of the board (recorded in Admin Panel → Problems as
`authz.shop-settings`), checks the settings with `normalizeShopSettings` and
`checkShopSettingsAgainstBoard` in
[models/lib/shop.js](../../../../models/lib/shop.js) - the payment methods
with Budget and billing's `normalizePaymentMethod` - and stores them on the
board as `shopSettings`, with who saved them. The Orders list choices come
from `shopOrderTargets`: the private boards the user administers. Tests:
[tests/shop.test.cjs](../../../../tests/shop.test.cjs) and
[server/lib/tests/shop.tests.js](../../../../server/lib/tests/shop.tests.js).
