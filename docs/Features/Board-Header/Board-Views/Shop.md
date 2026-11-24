# Shop

## What it is

Board → View → **Shop** shows the products on a board's cards as a web shop:
a grid of products with their pictures, prices and short descriptions, a
filter by category, a page per product, a cart and a checkout. It is drawn
from the board itself - no second copy of a product is kept:

| In the shop | On the board |
| --- | --- |
| A product | A card in a list on sale, whose price custom field holds a number |
| Its name, picture and text | The card's title, cover image (or first image attachment) and description, drawn as WeKan draws Markdown |
| Its price | The custom field chosen as the price (Number, Currency or Text) |
| Its product code and stock | The custom fields chosen as the product code (SKU) and the stock |
| A category | A label of the card |
| An order | A new card in the Orders list, on a private board - and, with Budget and billing on, an invoice of the shop's board |
| The buyer's receipt | An order confirmation by email, in the buyer's language |
| How to pay | The payment methods of [Budget and billing](../../Billing/README.md): SEPA QR code, Finnish bank barcode, Swiss QR-bill, Swish, Pix, UPI, PayPal.me, a payment link, the regional QR codes, crypto addresses, bank transfer, cash and cheque |

A public board can open in it: with **Show the Shop instead of the public
board** ticked in [Board Settings / Shop](../../Board-Sidebar/Board-Settings/Shop.md),
a visitor sees the shop at the board's address instead of the kanban, the way
the [Website](../../Board-Sidebar/Board-Settings/Import-Export/Website/README.md)
view can be shown.

## Read more

- [E-commerce](https://en.wikipedia.org/wiki/E-commerce),
  [Online shopping](https://en.wikipedia.org/wiki/Online_shopping) and
  [Shopping cart software](https://en.wikipedia.org/wiki/Shopping_cart_software)
  on Wikipedia - what this view is.
- [Stock keeping unit](https://en.wikipedia.org/wiki/Stock_keeping_unit) - the
  product code.
- [Value-added tax](https://en.wikipedia.org/wiki/Value-added_tax) and
  [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) - the VAT and the
  currencies with their decimals.
- [EPC QR code](https://en.wikipedia.org/wiki/EPC_QR_code) and
  [Creditor Reference (ISO 11649)](https://en.wikipedia.org/wiki/Creditor_Reference)
  - the SEPA QR code and the RF payment reference an order is paid with.
- In WeKan: [Board Settings / Shop](../../Board-Sidebar/Board-Settings/Shop.md),
  [Budget and billing](../../Billing/README.md) (the payment methods) and
  [Board View](../../Board-Sidebar/Board-Settings/Board-View.md).

## How to use it

### Set up the shop (a board admin)

1. On the board, add a custom field for the price: open a card, its menu →
   **Custom Fields** → the cog, and add a **Number** or **Currency** field
   named for example *Price*. Optionally add a **Text** field *SKU* and a
   **Number** field *Stock*.
2. Add a list *Orders* on a **private** board - this board when it is private,
   or another private board you are an admin of.
3. Open the right sidebar → **Board Settings** → **Shop**. Fields and a list
   named *Price*, *SKU*, *Stock* and *Orders* are chosen already; check them.
4. Tick **The shop is open**, give a **Title** and an **Introduction**, choose
   the **Currency** and the **VAT** (and **Prices include VAT**), and the
   **Payment reference**.
5. Under **Payment methods**, choose a **Payment method**, fill in its fields
   and click **Add payment method**; untick one to stop offering it.
6. Tick the **Lists on sale** (none ticked: every list but the Orders list)
   and the **Labels shown as categories** (none ticked: every label).
7. Optionally tick **Visitors without an account may order**, give **Terms
   and conditions (link)**, and tick **Show the Shop instead of the public
   board**. Click **Save**.
8. Put a price on a card: it is a product now.

### Shop (anybody who sees the board)

1. Board header → the view switcher → **Shop** (under *Communication and
   code*), or open a public board whose public view is the Shop.
2. Click a category to filter, a product to open its page.
3. **Add to cart**; the **Cart** button shows how many are in it. The cart is
   kept in this browser.
4. In the **Cart**, change a **Quantity** or delete a line, then **Check out**.
5. Fill in **Full Name** and **Email** (phone, address and a message are
   optional), choose the **Payment method**, accept the terms if asked, and
   **Place order**.
6. The page shows the order number, the total, and how to pay: the QR code to
   scan with a bank or payment app, the barcode, the payment link or the
   account details, and the **Payment reference** - and, with Budget and
   billing on, the **Invoice** number.
7. The buyer gets an email with the same: the order number, the lines, the
   totals with the VAT, how to pay with the payment reference, and the shop's
   name.

### Handle the orders (the shop's team)

Each order is a card in the Orders list: its title is the order number and
the buyer's name, its description the lines, the totals, the payment method
and reference, and the buyer's details. Move it through your lists as you
deliver it, like any card.

With **Budget and billing** on (Admin Panel / Settings / Features) for the
admin who saved Board Settings / Shop, each order is also an invoice of the
shop's board, marked *Sent*, whose lines are of the kind **Product**: Member
menu → **Budget and billing** lists it,
numbered `INV-<year>-<number>` as every invoice is, with the order number as
its reference, the buyer's name as its customer, a line per product and the
order's own **Payment reference** - the same as on the card and in the email,
so a payment is matched to both. The order card names the invoice
(*Invoice: INV-...*). **Record payment** on the invoice when the money
arrives. With Budget and billing off, no invoice is made.

**A copy of the board** - Board menu → Copy, a board template, or a board made
from a template - has its shop closed and no Orders list, price, product code
or stock field, and no lists on sale: they are the source board's. Its title,
introduction, currency, VAT, categories and payment methods are kept; open
Board Settings / Shop on the copy, check the suggested fields and Orders list,
and open the shop. An exported and imported board does not carry the shop.

## How the numbers are calculated

- **Money is an integer of the currency's minor unit** - cents for EUR, none
  for JPY, three decimals for KWD - from ISO 4217 (`models/lib/currencies.js`),
  as in Budget and billing. A price of 12.50 EUR is 1250; nothing is a float.
- **A price** is the price field's number, or a Text field holding one such
  as `12,50`. Empty, negative, more than 1 000 000 000 or not a number: the
  card is not a product. A **Currency** custom field sets the shop's currency
  to its own.
- **A line** is the price × the quantity; a quantity is a whole number from 1
  to 999, and a cart has at most 100 lines (`LIMITS` in
  [models/lib/shop.js](../../../../models/lib/shop.js)).
- **VAT**, when set: with **Prices include VAT** the total is the sum of the
  lines and the VAT in it is `round(sum × p / (100 + p))`, the net the rest;
  without it the VAT is `round(net × p / 100)` added to the net, as an invoice
  of Budget and billing adds it. Rounded to the minor unit, half up.
- **Stock**: a product whose stock is 0 is *Sold out*; an order of more than
  the stock is refused; with **Take ordered products from the stock** an order
  lowers it. A card with no stock value is not counted.
- **The order number** is `ORD-<year>-<number>`, counting from 1 in each shop
  each year; **the payment reference** is made from the year and that number
  in the chosen form - RF (ISO 11649), Finnish, Belgian, Norwegian KID or
  Swedish OCR - by Budget and billing's own `paymentReference`.
- **The invoice** has the order's net, VAT and total, one **Product** line
  per product (*2 × Shirt (TS-1)*, its card linked, its quantity and unit
  price), the due date of the board's payment terms in Budget and billing,
  and the order's payment reference. The lines add up to the net: with prices
  that include VAT, the net is shared over the lines in proportion to their
  prices, the rounding remainder on the last line. A line's unit price is kept
  when its net divides into a whole unit price; the e-invoice then writes the
  quantity in pieces (UN/ECE unit H87) at that price, and otherwise one unit
  (C62) at the line's amount.
- **Limits**: five orders a minute from one connection, thirty an hour from
  one address, and 200 an hour to one shop.

Every number is computed again on the server, from the cards, when the order
is placed. The cart sends only card ids and quantities; when the total the
buyer saw differs from the server's, the order is not placed and the buyer is
told the price changed.

## How it works in WeKan

- **The view**: `shopView` in
  [client/components/boards/shopView.jade](../../../../client/components/boards/shopView.jade)
  and [shopView.js](../../../../client/components/boards/shopView.js); it reads
  the board's published cards, lists, custom fields and attachments, so it
  works for a visitor of a public board too. A card's text is drawn escaped,
  its description through the Markdown viewer; only the payment QR code and
  barcode - SVG of their modules, made in the browser by
  [client/lib/paymentCodeSvg.js](../../../../client/lib/paymentCodeSvg.js),
  shared with Budget and billing - are drawn as markup. The cart is in
  `localStorage` (`wekan-shop-cart-<boardId>`).
- **The rules**: [models/lib/shop.js](../../../../models/lib/shop.js) - products,
  categories, the cart, totals, the checkout gate, the buyer's details, the
  order card, and the public view - is loaded by the browser, the server and
  the tests alike.
- **The view's place**: `board-view-shop` in `BOARD_VIEWS`
  ([models/lib/boardViewSettings.js](../../../../models/lib/boardViewSettings.js)),
  shown and ordered per board in [Board View](../../Board-Sidebar/Board-Settings/Board-View.md),
  and the Admin Panel / Settings / Features entry **Shop view** (`views-shop`
  in `models/lib/instanceFeatures.js`).
- **The server**: [server/shop.js](../../../../server/shop.js) - the methods
  `shopSetSettings`, `shopOrderTargets` and `shopPlaceOrder`. Settings are
  stored on the board as `shopSettings`; only an active admin of the board
  saves them, through that method, and a client write of `shopSettings` is
  refused (`Boards.deny`). An order is refused when the shop is closed, when
  a visitor without an account orders where only accounts may, for a payment
  method the shop does not offer, and for a board the caller can not read; it
  is written only on a private board, in the name of the admin who chose the
  Orders list, while they are still its admin.
- **The invoice**: [server/lib/shopInvoice.js](../../../../server/lib/shopInvoice.js)
  writes the order into Budget and billing's own `billingInvoices` with its
  numbering, issuer profile and payment terms, when `shopPlaceOrder` finds
  Budget and billing on for the shop's owner and the owner still an admin of
  the shop's board. It is made before the order card, and an order that fails
  after it removes it again, with the stock it took.
- **The confirmation email**: [server/lib/shopEmail.js](../../../../server/lib/shopEmail.js)
  sends it after the order is stored, through Meteor's `Email` - so Admin
  Panel / E-mail / Bounces takes out a stopped address and the SMTP limits
  hold. It is not sent when this WeKan sends no email (no `MAIL_URL`), when
  Board Settings / Shop unticks **Send the buyer an order confirmation by
  email**, or to a stopped address. The text is plain
  (`orderEmail` in `models/lib/shop.js`): the order number, lines, totals with
  VAT, the payment method, its reference and account lines, an https payment
  link, and the shop's title, in the language of the buyer's browser; the
  subject is one line. The HTML part is the account email layout of that text
  (`models/lib/accountEmailHtml.js`), which escapes every character, so a
  product title or a shop title can not become markup. No QR image is
  attached: the mail code has no inline images; the reference and the account
  lines pay the same. A send that fails is recorded in Admin Panel →
  Problems → Email and never fails the order.
- **A copy of the board**: `copy()` in [models/boards.js](../../../../models/boards.js),
  which the copyBoard method, `POST /api/boards/:boardId/copy` and the board
  templates use, resets `shopSettings` through `copiedShopSettings` in
  `models/lib/shop.js`; a WeKan import leaves `shopSettings` out
  (`models/lib/wekanBoardFields.js`), and so does the board clone that runs
  through it.
- **The order's personal data**: the buyer's name and email address, and an
  optional phone number, delivery address and message - nothing else is
  asked. They are written only into the order card on the private orders
  board. The `shopOrders` collection
  ([models/shopOrders.js](../../../../models/shopOrders.js)) numbers the orders
  and keeps, per order, its number, reference, totals, payment method and
  card - no name, address or contact detail.
- **Admin Panel → Problems**: refusals that no screen produces are recorded -
  `authz.shop-settings` (settings by a non-admin, an Orders list on a board the
  user does not administer, a client write of `shopSettings`), `authz.shop-order`
  (an order the shop does not take; *detected*: a cart line carrying a price)
  and `dos.shop-orders` (more orders in an hour than a shop takes), in
  `models/lib/securityCategories.js`.
- **Tests**: [tests/shop.test.cjs](../../../../tests/shop.test.cjs) (products,
  prices, totals, the cart, tampering, payment methods, the gate, escaping,
  the public view, the server's enforcement),
  [server/lib/tests/shop.tests.js](../../../../server/lib/tests/shop.tests.js)
  (the methods against a database) and
  [tests/playwright/specs/shop-view.e2e.js](../../../../tests/playwright/specs/shop-view.e2e.js)
  (a shop opened, a product bought, the order card and its invoice found, and
  a public board showing the shop to a visitor). They also pin the invoice
  (none while Budget and billing is off; the same reference as the card), the
  board copy (closed, no Orders list) and the email (its content, its
  escaping, a failed send that leaves the order standing).

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
