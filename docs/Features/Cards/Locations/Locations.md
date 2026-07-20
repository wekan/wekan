# Card Locations

A card can have **multiple locations**, similar to how it can have multiple members.

## Location section on the card

The card detail shows a **Location** section (after Labels and Stickers) listing each
location with its:

- name,
- address,
- and an OpenStreetMap link.

Use the **Add location** button to add more, and the edit / remove buttons on each
location to change or delete it. A single location imported from Trello keeps working
and is shown in the same list.

## Detecting a location from a map link

The Add/Edit location popup can detect a location from any map link — Google Maps,
OpenStreetMap, Bing Maps, Apple Maps, or generic `?q=` / `?ll=` links:

1. Paste the map link.
2. Press **Detect**.
3. The latitude, longitude and (when present) the place name/address are filled in
   automatically.

## Choosing which map service to open

The popup has an **Open map links at** setting, saved to your user profile, that
controls which map service the location "Open in map" links use:

- OpenStreetMap (default)
- Google Maps
- Bing Maps
- Apple Maps

## REST API

Locations are set through the card edit endpoint
(`PUT /api/boards/:boardId/lists/:listId/cards/:cardId`) with a `locations` array
of `{ name, address, latitude, longitude }`:

```bash
python3 api.py setcardlocations BOARDID LISTID CARDID \
  '[{"name":"HQ","address":"Helsinki","latitude":60.17,"longitude":24.94}]'
```

## Related

- [Cards](../Cards.md)
- [Migrating from Trello](../../../ImportExport/trello/Migrating-from-Trello.md)
