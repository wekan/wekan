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
| Send the buyer an order confirmation by email | On by default: the buyer gets the order number, lines, totals and how to pay by email, when this WeKan sends email |
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

**Budget and billing.** With it on for the admin who saves these settings,
every order is also an invoice of this board, with the order's payment
reference ([Shop](../../Board-Header/Board-Views/Shop.md#handle-the-orders-the-shops-team)).
The invoice's issuer, VAT ID and payment terms are Budget and billing's
**Invoicer** of this board.

**A copy of this board** - Board menu → Copy, or a board template - starts with
its shop closed and without the Orders list, the price, product code and
stock fields and the lists on sale, which are this board's; save the settings
on the copy to open its shop.

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

## Commits

 - [Shop: products, cart, totals and orders computed from the cards](https://github.com/wekan/wekan/commit/0aa3d0b9d67330670e51bb118dae44fa40eaca8a)
 - [Board View / Shop: the products on the cards as a web shop, with a cart and a checkout](https://github.com/wekan/wekan/commit/04436a739da5d0f1c5326253c4c92310c4fdb983)
 - [Board Settings / Shop: open the shop, map the cards to products, choose the Orders list and the payment methods](https://github.com/wekan/wekan/commit/493af449982c808b11e4d9e3ff138c635e05cc2a)
 - [Shop: every setting is enforced on the server, and refused attempts are in Admin Panel / Problems](https://github.com/wekan/wekan/commit/8892734fa987d89c0f455464dfdf7def84488850)
 - [Translations: the Shop's 38 new strings in every language](https://github.com/wekan/wekan/commit/136fdebf969071d371b94c5b7646b10fb43a925a)
 - [Shop: tests of the products, the prices, the settings and the orders, and of what is refused](https://github.com/wekan/wekan/commit/0d74e6ec25a8d7f976cbb69f1a5c34763036cf25)
 - [Shop: an order is also a Budget and billing invoice, the buyer gets a confirmation email, and a board copy closes its shop](https://github.com/wekan/wekan/commit/c7b48bce2f106e97a8cb2e4343a2544b59023887)
 - [Translations: the Shop's confirmation email and its setting in every language](https://github.com/wekan/wekan/commit/9f22d02b5dd5cb734a241c591a39b7eab98fd13f)
 - [Shop tests: the invoice, the confirmation email and the board copy, and what each must never do](https://github.com/wekan/wekan/commit/1083b52a3602219a8adda299ddcb0e1820a9ec5e)
 - [Budget and billing: a Product kind of invoice line, and the Shop's invoices use it](https://github.com/wekan/wekan/commit/ac7c3d93fe8c0cb2a8e54c50b0bc38c06a62304d)
 - [Translations: Product, the new kind of a Budget and billing invoice line, in every language](https://github.com/wekan/wekan/commit/070c72759a9f49829c616b977bac143041680398)
 - [Tests: a Shop invoice line is a Product, an unknown kind is refused, and every list of the line kinds names Product](https://github.com/wekan/wekan/commit/1abb2020302c394857f9b5d15908903692739489)
