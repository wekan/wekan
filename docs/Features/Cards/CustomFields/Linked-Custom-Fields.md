# Linked custom fields

A card's custom fields can be linked to another card's, on the same board or
on another board. When a linked field's value changes, the field with the same
name on the other card gets the same value. This is for the case in
[#5681](https://github.com/wekan/wekan/issues/5681): every worker has their own
card to work with, and a "main" card on another board combines what they
enter.

Example: board **test1** has the card "Test card1" with the custom fields
*Operation* and *Status*. Board **test2** has the card "Test card1 -
Processing" with *Operation*, *Status* and *Remarks*. After linking the two
cards, *Operation* and *Status* go from one card to the other; *Remarks* stays
the main card's own, because the first card has no field of that name.

This is not the same as a [linked card](../Linked-Cards.md), which shows ONE
card in a second place. Here there are two cards, each with its own title,
members, checklists and other fields, and only the custom field values are
shared.

## Linking two cards

1. Open the card and click the hamburger at the end of the **Custom Fields**
   heading.
2. Click **Link fields to another card**.
3. Paste the other card's link (the card menu's **Copy card link** gives one),
   or type part of a card title of this board and pick the card.
4. Choose the **Direction**:
   - **Both ways** - a change on either card goes to the other.
   - **One way** - a change on this card goes to the main card. Changes made
     on the main card stay there.
5. Click **Link fields**.

The list in the same pop-up shows every linked card with the names of the
fields that match, the direction, and an **Unlink** button. Linking fills the
matching fields that are still empty on the receiving card; it never
overwrites a value that is already there. After that, every change is carried
over.

## Which fields are linked

- Fields match by **name**, ignoring upper/lower case and spaces at the ends,
  and only when they have the **same type**. A currency field matches only a
  field with the same currency.
- A field must be on **both cards**. Add the field to a card (Custom Fields
  hamburger) to include it in the link.
- A **dropdown** value goes over by the name of the selected item: the other
  field needs an item with the same name. When it has none, the value is not
  carried. A multi-select is carried only when every selected item exists on
  the other side, so a two-way link cannot erase an item one side lacks.
- Clearing a value clears it on the other card. Taking a field off a card is
  not carried.
- When two fields on one card have the same name, that name is ambiguous and
  is not linked.
- **Admin only** fields are never linked, in either direction: their values
  would otherwise become visible to members who may not see them.
- A **read only** field receives values only when the person who made the link
  is an admin of that board - the same rule as editing it by hand.

## Where changes come from

Every way of changing a value is carried over: the card details, the custom
field methods, the REST API (`PUT /api/boards/.../cards/:cardId` with
`customFields`, and `POST .../customFields/:customFieldId`), rules, and imports
into an existing card.

The copy is written on the server, as the person who made the link, through the
ordinary card update. It is therefore in the receiving card's activities and
History like any other change.

## Loops and chains

- A value is written only when it differs from the value already there.
- A change never comes back to a card it has already been written to, so a
  two-way link does not bounce a value back and forth, and a ring of links
  (A - B - C - A) stops after one round.
- A change travels along at most 5 links in a row and makes at most 50 card
  writes in total.
- A card can be linked to at most 20 cards.

## Who may link, and when a link stops

- Linking and unlinking need edit rights on **both** cards. A card you cannot
  see is answered as "Card not found". When the other card has been deleted,
  or no longer holds its side of the link, unlinking needs edit rights only on
  this card.
- A link keeps working only while the person who made it can still read and
  edit both cards. When they lose access to either card - removed from the
  board, made read-only, or no longer assigned on an assigned-only board - the
  link is **paused** and the pop-up says so. It works again when the access
  comes back, or another member who can edit both cards can unlink it and link
  the cards again in their own name.
- An archived card neither sends nor receives values. Restoring it resumes the
  link.
- Deleting a card removes its links from the cards it was linked to. A copy of
  a card starts without links.
- Links are stored on both cards (`customFieldLinks`) and are written only by
  the server methods `linkCardCustomFields` and `unlinkCardCustomFields`. A
  client that tries to write the field directly is refused, and the attempt is
  shown in Admin Panel -> Problems (canary `card.field-link-direct`).
