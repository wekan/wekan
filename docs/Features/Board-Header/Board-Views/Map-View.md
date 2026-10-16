# Map view

Board header → **Board View** → **Map** (#3256). The board's cards as markers on
an image the board admin uploads - a floor plan, a site map or a drawing. A site
admin can turn it off with "Map view" in Admin Panel / Settings / Visibility /
Features.

## The map image

Until there is one, the view says so. A board admin uploads it with **Upload a
map image** (PNG, JPEG, GIF or WebP) and can take it off again with **Remove the
map image**; the cards keep their places for the next image. Every member of
the board can see the image, assigned-only members included.

## Cards on the map

- A marker has the colour of the card's first label, the card number when the
  board numbers its cards, and the title as its tooltip. Click it to open the
  card.
- Those who may change the board see **Not on the map**: the cards without a
  place. Drag one onto the map, or choose it and click where it belongs. Drag a
  marker to move it.
- A place is stored on the card as a percentage of the image's width and height
  (`mapX`, `mapY`), so it stays right when the image is shown at another size.

## Implementation

`client/components/boards/mapView.jade`, `.js` and `.css`;
`models/lib/boardMap.js`; the board's `mapImageAttachmentId` and
`setMapImage()`, the card's `setMapPosition()` and `clearMapPosition()`. Tests:
`tests/boardMap.test.cjs`, `tests/playwright/specs/map-view.e2e.js`.
