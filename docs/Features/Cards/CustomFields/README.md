# Custom Fields

[Custom Fields issue](https://github.com/wekan/wekan/issues/807)

## What it is

Custom fields are a board's own extra fields for its cards, beside the
built-in title, dates, members and labels: a release version, a budget, a
customer, a checkbox, a choice from a list. A board member who may change
the board defines a field
once for the board - its name and type - and then each card can carry a
value for it, shown on the opened card and, when chosen, on the minicard.
Number and date fields can also be summed or ranged at the top of each list.

## Read more

- [Field (computer science)](https://en.wikipedia.org/wiki/Field_(computer_science))
  on Wikipedia - what a field is.
- [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development)) -
  the board whose cards these fields describe.
- [Template processor](https://en.wikipedia.org/wiki/Template_processor),
  [Percent-encoding](https://en.wikipedia.org/wiki/Percent-encoding) and
  [Regular expression](https://en.wikipedia.org/wiki/Regular_expression) - for
  the String Template type.
- In WeKan: [Admin only and display order](Custom-Field-Admin-Only-And-Order.md),
  [Linked custom fields](Linked-Custom-Fields.md) and
  [Card Settings](../Card-Settings.md), where a board's custom fields are
  managed.

## To translators, about the word Custom

See other feature for description of Custom [Customize Translations](../../Translations/Customize-Translations.md)

## How to use it

The screenshots below are from an older WeKan; the steps under each are the
current menus.

**1) Open the board's custom fields:** **Board Settings → Card** (the board's
cog menu), then the **Custom Fields** section of Card Settings. (In the older
WeKan of the screenshot this was Board hamburger menu / Custom Fields.)

<img src="https://wekan.fi/custom-field-1.png" width="50%" alt="Custom Field Step 1" />

**2) Create a field:** click **+** (**Create Field**) under the section's
fields, fill in **Name** and **Type**, the type's settings and the
checkboxes, and click **Save**.

- **Type** is one of **Text**, **Number**, **Date**, **Dropdown List**,
  **Dropdown (multi-select)**, **Checkbox**, **Currency** and **String
  Template**. It cannot be changed after the field is created.
- **Currency** asks for a **Currency Code**; **Dropdown List** and the
  multi-select for their **List Options** (press Enter to add more);
  **String Template** for a **Format** and a **Separator** (below).
- **Show this field on card**, **Add field to new cards**, **Add field to all
  cards** and **Show field label on minicard** decide where the field appears;
  **Show sum of fields at top of list** is offered for Number and Currency
  fields.
- **Only on these card kinds** limits the field to Story or Task cards (none
  ticked: every card).
- A board admin also sees **Visible only to board admins** and **Read-only:
  every member sees the value, only board admins change it**
  ([Admin only and display order](Custom-Field-Admin-Only-And-Order.md)).

<img src="https://wekan.fi/custom-field-2.png" width="50%" alt="Custom Field Step 1" />

**3) Add it to a card:** open the card and click the hamburger at the end of
its **Custom Fields** heading. The **Edit custom fields** popup lists every
custom field of the board, ticked when it is on this card. (In the older
screenshot: Card Details hamburger menu / Edit custom fields.)

<img src="https://wekan.fi/custom-field-3.png" width="100%" alt="Custom Field Step 1" />

**4) Click your custom field's name** to put it on the card (click again to
take it off). The pencil beside it edits the field; **Create Field** and
**Link fields to another card** are at the bottom of the popup.

<img src="https://wekan.fi/custom-field-4.png" width="100%" alt="Custom Field Step 1" />

**5) Set its value:** click the field on the card (its title or its value)
and enter or choose the value, then **Save**.

<img src="https://wekan.fi/custom-field-5.png" width="100%" alt="Custom Field Step 1" />

**6) The custom field is shown at the minicard and the card details.**

<img src="https://wekan.fi/custom-field-6.png" width="100%" alt="Custom Field Step 1" />

**Editing or deleting a field:** in Card Settings' Custom Fields, the field's
hamburger opens its edit form, with **Save** and **Delete**; in the card's
Edit custom fields popup, its pencil does the same.

## How the numbers are calculated

- **Sum at top of list** (`sumCustomFieldValues` and `numberFieldStats` in
  [models/lib/customFieldsSum.js](../../../../models/lib/customFieldsSum.js),
  shown by [client/components/lists/listHeader.js](../../../../client/components/lists/listHeader.js)):
  for every Number field with **Show sum of fields at top of list**, the
  values on the list's cards that are not archived (per swimlane when the
  list is shown in swimlanes) are added up and shown as **∑ N**. Only Number
  fields are summed: the checkbox is also offered for a Currency field, but
  the list header reads only `type: 'number'`. A card without the field or
  with an empty value adds 0; a text value is read as a number with a comma
  or a dot as the decimal mark, and one that is not a number is skipped. The
  badge's tooltip adds the smallest and largest value and how many of the
  list's cards have a value, as `(min–max, count/total)`.
- **Date fields** with `showSumAtTopOfList` (the form does not offer the
  checkbox for a Date field; it can be set through the REST API) show the
  earliest and latest date on the list's cards instead of a sum
  (`dateFieldRange`), as one date when they are the same.
- **Currency** values are formatted with the browser's `Intl.NumberFormat` in
  the field's currency.
- **String Template** regular expressions: the pattern is at most 200
  characters and the value at most 10,000, and on the server it runs with a
  50 ms time limit
  ([models/lib/customFieldStringTemplate.js](../../../../models/lib/customFieldStringTemplate.js),
  `server/lib/boundedRegex.js`).
- **Display order**: a new field's `sort` is the number of fields the board
  already has, so it goes last ([Admin only and display order](Custom-Field-Admin-Only-And-Order.md)).

## How it works in WeKan

- Definitions are the `customFields` collection
  ([models/customFields.js](../../../../models/customFields.js)): `boardIds`,
  `name`, `type`, `settings` (`currencyCode`, `dropdownItems`,
  `stringtemplateFormat`, `stringtemplateSeparator`), `showOnCard`,
  `automaticallyOnCard`, `alwaysOnCard`, `showLabelOnMiniCard`, `cardKinds`,
  `showSumAtTopOfList`, `readOnly`, `adminOnly` and `sort`. Its REST API and
  server hooks are in
  [server/models/customFields.js](../../../../server/models/customFields.js);
  every writing REST handler needs board write access.
- A card's values are `cards.customFields`, a list of `{ _id, value }`;
  [models/lib/customFieldsWD.js](../../../../models/lib/customFieldsWD.js)
  joins them with the definitions of the card's current board, in display
  order, and skips values whose definition is not on that board.
- The edit form is `createCustomFieldPopup` in
  [client/components/sidebar/sidebarCustomFields.jade](../../../../client/components/sidebar/sidebarCustomFields.jade);
  Card Settings' Custom Fields section is
  [models/lib/cardSettingsCustomFields.js](../../../../models/lib/cardSettingsCustomFields.js);
  the card's popup and value editors are
  [client/components/cards/cardCustomFields.jade](../../../../client/components/cards/cardCustomFields.jade).
- Tests: `tests/customFieldsWD.test.cjs`, `tests/customFieldsSum.test.cjs`,
  `tests/customFieldStringTemplate.test.cjs`,
  `tests/cardSettingsCustomFields.test.cjs`,
  `tests/customFieldInteraction.test.cjs`,
  `tests/restCustomFieldUpdate.test.cjs`, `tests/restCustomFieldDelete.test.cjs`
  and the browser tests `tests/playwright/specs/rest-custom-field-update.e2e.js`,
  `rest-custom-field-delete.e2e.js`, `rest-dropdown-item-update.e2e.js` and
  `minicard-filled-custom-fields-6811.e2e.js`.

### String Template variables

A String Template formats each nonempty value entered on the card, then joins
those results using the field's separator. The same format appears on minicards
and in card details. Available variables are:

| Variable | Value |
| --- | --- |
| `%{value}` | The current item entered in this custom field |
| `%{card.title}` | Card title |
| `%{board.title}` | Board title |
| `%{list.title}` | List title |
| `%{swimlane.title}` | Swimlane title |

Names are case-insensitive. The spelling `{%card.title}` (percent sign inside
the braces) also works. Titles and formats update while the card is open.
Linked cards use their source card's context, just as they use its custom-field
values. Unknown variables or unavailable context remain literal text. These
variables do not expose arbitrary document properties or other custom fields.

Append `|urlencode` to encode a value as a URL parameter. For example, a label
printer link can use this format:

```text
[Print label](https://printer.example/print?label=%{value|urlencode}&card=%{card.title|urlencode}&lane=%{swimlane.title|urlencode})
```

Spaces, Unicode and characters such as `&`, `#` and `?` are encoded within each
parameter, rather than changing the URL's structure. The normal Markdown viewer
still handles links and sanitization. Variable contents are substituted once;
text inside a card title is never evaluated as another template.

The existing regular-expression replacement applies to the current item and
can be mixed with the variables:

```text
${"regex":"^([A-Z]{2})-(.*)$","flags":"i","replace":"$1 / $2"}
```

Invalid regex definitions remain visible instead of preventing card rendering.
This is the Custom Fields String Template feature requested in
[#3815](https://github.com/wekan/wekan/issues/3815); Rules action templates use
their separate `{card}`, `{board}` and other rule variables.

To copy field values between two cards, for example from each worker's card
to a main card on another board, see
[Linked custom fields](Linked-Custom-Fields.md).

## Commits

 - [REST renaming of dropdown options fixed](https://github.com/wekan/wekan/commit/00b0431685c20a35b7bebf5a59b9f2e6c8399836)
 - [deleting a dropdown item no longer acknowledges missing options](https://github.com/wekan/wekan/commit/cefb6771cbde23a468526448256f182309c49bdd)
 - [deleting a custom field no longer acknowledges missing records](https://github.com/wekan/wekan/commit/2733c8ba65342dfb0bdfbbddff03f366ac8756b5)
 - [partial REST custom-field updates fixed](https://github.com/wekan/wekan/commit/a81ec6ecdfea8a0b0709d7c0cd463cfd051ca80f)
 - [Card Settings: two panes, custom fields managed in them](https://github.com/wekan/wekan/commit/2bd5d1180a24bde1fb30acfe75617bb4c68f864e)
 - [Card Settings / Custom Fields: Create Field and Link fields as forms in the pane](https://github.com/wekan/wekan/commit/f33987931f1f4ffa0a3d1fc9c7e609e315bf2e7e)
 - [Story and Task cards, with custom fields of their own](https://github.com/wekan/wekan/commit/0d77882c3bba856a5ea1248dfddbf73bda24ef49)
 - [read-only custom fields that every member sees and only admins set](https://github.com/wekan/wekan/commit/87ae8895c30c0c46f336d0783ec452230b1ba724)
 - [a date custom field named in its tooltip](https://github.com/wekan/wekan/commit/a69b214ba362f4d9ed3603491b56a1895378e0e2)
 - [card context and URL encoding in String Templates](https://github.com/wekan/wekan/commit/c8e89bd582db91968811598cea6fd690b58acfb2)
 - [a String Template regex can no longer stop the server (ReDoS)](https://github.com/wekan/wekan/commit/c2905e17ce71b676012731c82e59cd08afc07776)
 - [list-header summary with min/max and a date-field range](https://github.com/wekan/wekan/commit/453b309c72069ab6428b88f76a28d65fc306674f)
 - [the Admin only flag](https://github.com/wekan/wekan/commit/76dcb6575aebd8f597ceb56b6bcc3edc02237251)
 - [a multi-select dropdown type](https://github.com/wekan/wekan/commit/d5700f5c395f1f30ec69042562ac427aadc1d10e)
 - [a user-settable display order, by drag and drop](https://github.com/wekan/wekan/commit/0c6901f3a9eda2efd7e53c85d262add49fb53135)
 - [copy controls on every custom field](https://github.com/wekan/wekan/commit/ad9300297f69031155762e174e6bb828f5a4dc75)
 - [card and minicard visibility separated](https://github.com/wekan/wekan/commit/1d4ffd4080d95acae6b01a44906fddc67861aede)
 - [custom-field interactions and deleted-field exports fixed](https://github.com/wekan/wekan/commit/a7879012c92a22e3c73c1ad580b48035a1c3bbba)
 - [the Custom Fields popup shows a new field, with the pencil beside the name](https://github.com/wekan/wekan/commit/67b91c850433ed04569734ff749c759ac557ac81)
 - [everything about custom fields on the section that shows them](https://github.com/wekan/wekan/commit/e612fdfee9a6d5cdbc9475dcc7705b21de7bf531)
 - [a number field no longer shows NaN when cleared](https://github.com/wekan/wekan/commit/98315c26cd02b2b81a9734b413be25f2e80f9561)
 - [read-only board members can no longer write custom fields through the REST API](https://github.com/wekan/wekan/commit/70db04a93fedabe40331f21f86e6bdc91625914e)
 - [sum of cards at the top of a list](https://github.com/wekan/wekan/commit/8626b466b830adf6c671211bbd61b53b96ac5a49)
 - [String Template custom field type](https://github.com/wekan/wekan/commit/b8dc7ff18ecea2afe7268cdcbb698c2c6ffea00b)
 - [option to add a custom field to all cards](https://github.com/wekan/wekan/commit/74d93a6adce66f28c9f31901c32f0d80845a8187)
 - [Currency custom field type](https://github.com/wekan/wekan/commit/3cf6ed916f4fd4c8e6e826ed4af1c2dd4c965110)
 - [custom fields upgrade](https://github.com/wekan/wekan/commit/a82aa87850b9bfbab503b1f07dd6b7542a20c2f4)
 - [dropdown items](https://github.com/wekan/wekan/commit/3753337d60e17e5e72ec071aa4a1b28e36297d15)
 - [number and date fields](https://github.com/wekan/wekan/commit/8b16955cc27b29ae507be084adccc4fad61b05ef)
 - [custom fields creation UI and model, first version](https://github.com/wekan/wekan/commit/ade3c02122d262c72bd7c4fd1cbcab8e136184ba)
