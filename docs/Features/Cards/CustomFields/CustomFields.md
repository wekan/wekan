[Custom Fields issue](https://github.com/wekan/wekan/issues/807)

## To translators, about the word Custom

See other feature for description of Custom [Customize Translations](../../Translations/Customize-Translations.md)

## 1) Click: Board hamburger menu / Custom Fields

<img src="https://wekan.fi/custom-field-1.png" width="50%" alt="Custom Field Step 1" />

## 2) Click: Create Field, add details and Save

<img src="https://wekan.fi/custom-field-2.png" width="50%" alt="Custom Field Step 1" />

## 3) Click: Card Details hamburger menu / Edit custom fields

<img src="https://wekan.fi/custom-field-3.png" width="100%" alt="Custom Field Step 1" />

## 4) Click: Your Custom Field name to insert it to Card

<img src="https://wekan.fi/custom-field-4.png" width="100%" alt="Custom Field Step 1" />

## 5) Click: Your selection from your Custom Field

<img src="https://wekan.fi/custom-field-5.png" width="100%" alt="Custom Field Step 1" />

## 6) Custom Field is shown at Minicard and Card Details

<img src="https://wekan.fi/custom-field-6.png" width="100%" alt="Custom Field Step 1" />

## String Template variables

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
