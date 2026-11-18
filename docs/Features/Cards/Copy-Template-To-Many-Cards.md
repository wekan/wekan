# Card menu / Copy Template to Many Cards

Card menu (☰ in the opened card's header, **Card Actions**) → **Copy
Template to Many Cards** makes several copies of this card at once, each
with its own title and description (`copyManyCardsPopup` in
`client/components/cards/cardDetails.jade`).

## Who sees it

The same users as [Copy Card](Copy-Card.md): the menu offers its moving and
copying entries to them (`cardMenuWrites`), and they are not a **Worker**.

## The popup

The text box, labelled **Destination Card Titles and Descriptions in this
JSON format**, is prefilled with an example:

```json
[ {"title": "First card title", "description":"First card description"},
  {"title":"Second card title","description":"Second card description"},
  {"title":"Last card title","description":"Last card description"} ]
```

Replace it with one object per card to create. Below it is the same
destination picker as [Move Card](Move-Card.md): board, swimlane, list,
a card and **Above selected card** / **Below selected card**, and **Done**.

## What happens

- The text is parsed as JSON. Text that is not valid JSON creates nothing,
  and the error is shown in the popup.
- For each object, the `copyCard` server method copies this card with the
  object's `title` and `description` (with the same checks as Copy Card),
  then places it. With **Below selected card**, each copy goes below the
  previous one, so they keep the order of the text.
- With no card chosen, each copy goes to the bottom of the list.
- On a filtered board, each copy is added to the filter's exceptions.
