# Map view

## What it is

The Map view (#3256) shows the board's cards as markers on an image the board
admin uploads - a floor plan, a site map or a drawing. It is for work that
happens in places: rooms of a building, machines on a factory floor, plots of a
site. Each card is put where it belongs on the image, and clicking a marker
opens the card.

## Read more

- [Floor plan](https://en.wikipedia.org/wiki/Floor_plan) at Wikipedia - the
  kind of image the view is made for.
- [Image map](https://en.wikipedia.org/wiki/Image_map) at Wikipedia - clickable
  places on an image, which is what the markers are.
- WeKan: [Board Settings → Board View](../../Board-Sidebar/Board-Settings/Board-View.md),
  [Admin Panel → Settings → Features](../../Admin-Panel/Settings/Features.md),
  [Attachments](../../Cards/Attachments/README.md).

## How to use it

**Open it.** Board header → **Board View** → **Map** (in the menu's **Board**
group). A site admin can turn it off with "Map view" in
[Admin Panel → Settings → Features](../../Admin-Panel/Settings/Features.md).

**The map image.** Until there is one, the view says so: "This board has no
map image yet."

1. As a board admin, open the Map view.
2. Click **Upload a map image** and choose a PNG, JPEG, GIF or WebP file.
3. To take it off again, click **Remove the map image**; the cards keep their
   places for the next image.

Every member of the board can see the image, assigned-only members included.
A failed upload shows a translated error under the button.

**Cards on the map.**

- A marker has the colour of the card's first label, the card number when the
  board numbers its cards, and the title as its tooltip. Click it to open the
  card.
- Those who may change the board see **Not on the map**: the cards without a
  place. Drag one onto the map, or choose it and click where it belongs. Drag a
  marker to move it. When every card has a place the list says "Every card is
  on the map."

## How the numbers are calculated

From [models/lib/boardMap.js](../../../../models/lib/boardMap.js):

- A place is stored on the card as a percentage of the image's width and height
  (`mapX`, `mapY`), so it stays right when the image is shown at another size.
- **Percent from a click or drop** = `(pointer x - image left) / image width ×
  100`, and the same for y with top and height.
- **Clamping and rounding**: every coordinate is clamped to 0-100 and rounded
  to two decimals. A value that is not a number (or is empty) means "not
  placed"; `null` is not taken as 0, so an unplaced card is never put in the
  top-left corner.
- **Placed** = both `mapX` and `mapY` are valid. Placing with an invalid
  coordinate removes the place instead.
- **The marker text** is the card number (when the board numbers cards),
  otherwise empty; the colour is the first of the card's labels that still
  exists on the board.
- **Which cards**: the board's cards that are not archived and not template
  cards, in their board order.

## How it works in WeKan

- **View**:
  [client/components/boards/mapView.jade](../../../../client/components/boards/mapView.jade),
  [.js](../../../../client/components/boards/mapView.js) and
  [.css](../../../../client/components/boards/mapView.css). The view is marked
  `nodragscroll`, so the board's drag-to-scroll does not cancel a drag onto
  the map.
- **Pure module**: [models/lib/boardMap.js](../../../../models/lib/boardMap.js)
  (`clampPercent`, `percentFromPoint`, `isPlaced`, `mapMarker`), with no
  Meteor code.
- **Data**: the image is a board-level attachment (`meta.source` `board-map`),
  uploaded the way board backgrounds are; its id is the board's
  `mapImageAttachmentId`, set and removed with `setMapImage()` in
  [models/boards.js](../../../../models/boards.js). A card's place is written
  with `setMapPosition()` and removed with `clearMapPosition()` in
  [models/cards.js](../../../../models/cards.js).
- **Permissions**: the upload and remove buttons are shown to board admins;
  **Not on the map**, dragging and placing are offered when
  `Utils.canModifyBoard()` allows it, and the writes go through the board's
  and card's own update rules like any other change.
- **Menu and feature switch**: `board-view-map` in
  [models/lib/boardViewSettings.js](../../../../models/lib/boardViewSettings.js),
  feature `views-map` in
  [models/lib/instanceFeatures.js](../../../../models/lib/instanceFeatures.js).
- **Tests**: [tests/boardMap.test.cjs](../../../../tests/boardMap.test.cjs),
  [tests/playwright/specs/map-view.e2e.js](../../../../tests/playwright/specs/map-view.e2e.js).

## Commits

 - [A failed map image upload is reported in the reader's language](https://github.com/wekan/wekan/commit/0fff9d4828660666c1af0c9ffd48c7eea8aee1bd)
 - [Optional features: a site admin can turn the Map view off](https://github.com/wekan/wekan/commit/18d57b2b8f789b11409afbd485cff139adeb3095)
 - [The Map board view: cards as markers on an uploaded image](https://github.com/wekan/wekan/commit/3d891ace09d88fa6723ef556c343fdcfeb72e87b)
