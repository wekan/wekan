# Card Locations

## What it is

A card can have **multiple locations**, similar to how it can have multiple
members: the places the work happens, such as a customer's office, a site or a
venue. Each location has a name, an address and, when known, its latitude and
longitude, with an **Open in map** link to the map service you choose. A map
link pasted into the popup is read for its coordinates, so nobody has to type
them.

## Read more

- Wikipedia: [Geographic coordinate system](https://en.wikipedia.org/wiki/Geographic_coordinate_system),
  [World Geodetic System](https://en.wikipedia.org/wiki/World_Geodetic_System)
  (WGS-84, the coordinates WeKan stores),
  [Restrictions on geographic data in China](https://en.wikipedia.org/wiki/Restrictions_on_geographic_data_in_China)
  (why Baidu and Amap coordinates are converted),
  [Web mapping](https://en.wikipedia.org/wiki/Web_mapping) and
  [OpenStreetMap](https://en.wikipedia.org/wiki/OpenStreetMap).
- [OpenStreetMap](https://www.openstreetmap.org/), the default map service.
- In WeKan: [Cards](../README.md),
  [Migrating from Trello](../../Board-Sidebar/Board-Settings/Import-Export/Trello/trello/Migrating-from-Trello.md)
  and [Board Settings / Card](../../Board-Sidebar/Board-Settings/Card.md).

## How to use it

### Location section on the card

The card detail shows a **Location** section (after Labels and Stickers) listing each
location with its:

- name,
- address,
- and an **Open in map** link (when it has coordinates), to the map service
  chosen under **Open map links at** - OpenStreetMap unless you chose another.

Use the **Add location** button to add more, and the edit / remove buttons on each
location to change or delete it. A single location imported from Trello keeps working
and is shown in the same list.

**Add a location:**

1. Open the card and click **Add location** (+) in the **Location** section.
2. Fill in **Location name**, **Address**, **Latitude** and **Longitude**, or
   detect them from a map link (below).
3. Click **Save**.

**Edit or delete one:** click the location's name or address to open the same
popup, change it and click **Save**, or click **Delete**. The × beside a
location removes it at once.

### Detecting a location from a map link

The Add/Edit location popup can detect a location from any map link (**Detect
location from any map link**): Google Maps, Bing Maps, Apple Maps, Waze,
OpenStreetMap, HERE WeGo, Yandex Maps, Mapy.cz, 2GIS, Baidu Maps, Amap
(Gaode), generic `?q=` / `?ll=` / `?center=` links, or a bare `latitude,
longitude` pair:

1. Paste the map link.
2. Press **Detect**.
3. The latitude, longitude and (when present) the place name/address are filled in
   automatically. **Filled in the detected location details below.** confirms
   it; **Could not detect a location from this link.** says nothing was found.

### Choosing which map service to open

The popup has an **Open map links at** setting, saved to your user profile with
its own **Save** button, that controls which map service the location "Open in
map" links use. The same choice is used by Admin Panel / Problems / Offices:

- **USA:** Google Maps, Bing Maps, Apple Maps, Waze
- **Europe:** OpenStreetMap (default), HERE WeGo, Yandex Maps, Mapy.cz, 2GIS
- **Asia:** Baidu Maps, Amap (Gaode)

### Showing it

Board sidebar (hamburger menu) → **Board Settings** → **Card**, row
**Location**: *Show on Card* draws the section (`allowsLocation`), *Show on
Minicard* draws each location's name (or address) on the minicard
(`allowsLocationOnMinicard`, off by default).

### REST API

Locations are set through the card edit endpoint
(`PUT /api/boards/:boardId/lists/:listId/cards/:cardId`) with a `locations` array
of `{ name, address, latitude, longitude }`:

```bash
python3 api.py setcardlocations BOARDID LISTID CARDID \
  '[{"name":"HQ","address":"Helsinki","latitude":60.17,"longitude":24.94}]'
```

The array replaces the card's locations; an entry without an `_id` gets one,
and form-encoded coordinates are turned into numbers.

## How the numbers are calculated

- **Coordinates** are stored as WGS-84 decimal degrees. A detected pair is
  accepted only when the latitude is within ±90 and the longitude within ±180;
  the first pattern that matches wins, the provider-specific ones first,
  because Yandex, Mapy.cz, 2GIS and Amap put the longitude first.
- **Baidu Maps and Amap** use offset datums: Baidu BD-09 and Amap GCJ-02.
  Inside mainland China (latitude 0.8293-55.8271, longitude 72.004-137.8347)
  a link's coordinates are converted to WGS-84 when detected, and back when
  the Open in map link is built (the "eviltransform" algorithm with the
  Krasovsky 1940 ellipsoid; the reverse is 10 fixed-point iterations to about
  1e-9 degrees). Outside that box nothing is converted.
- **Map zoom** in the built links is 16 (OpenStreetMap, Bing, HERE, Yandex,
  Mapy.cz).
- A card has as many locations as you add; there is no limit of its own.

## How it works in WeKan

- The card's `locations` array of `{ _id, name, address, latitude?,
  longitude? }` in [models/cards.js](../../../../models/cards.js), with
  `getLocations`, `addLocation`, `updateLocation` and `removeLocation`. The
  legacy flat `locationName` / `locationAddress` / `locationLatitude` /
  `locationLongitude` fields (a Trello import) are shown as one entry and moved
  into `locations` on the first change (`_migrateLegacyLocation`).
- The section and the `cardLocationsPopup` are in
  [client/components/cards/cardDetails.jade](../../../../client/components/cards/cardDetails.jade);
  `parseMapLink` and the popup's events are in
  [cardDetails.js](../../../../client/components/cards/cardDetails.js).
- [models/lib/mapLink.js](../../../../models/lib/mapLink.js) - `mapLinkFor` and
  the `GCJ` datum conversions; the chooser is `mapProviderSelect` in
  [client/components/main/mapProvider.jade](../../../../client/components/main/mapProvider.jade),
  saved by the `setMapProvider` method in
  [server/models/users.js](../../../../server/models/users.js) to
  `profile.mapProvider`, which accepts only the eleven providers.
- REST: the `locations` branch of the card edit endpoint in
  [server/models/cards.js](../../../../server/models/cards.js); the client
  command is `setcardlocations` in [api.py](../../../../api.py).
- Tests: [tests/cardLocationRemoval.test.cjs](../../../../tests/cardLocationRemoval.test.cjs),
  [tests/trelloImport.maplink.test.js](../../../../tests/trelloImport.maplink.test.js)
  and [tests/tablePageMapPopup.test.cjs](../../../../tests/tablePageMapPopup.test.cjs).

## Related

- [Cards](../README.md)
- [Migrating from Trello](../../Board-Sidebar/Board-Settings/Import-Export/Trello/trello/Migrating-from-Trello.md)

## Commits

 - [Location in Board Settings / Card can be shown on the minicard too](https://github.com/wekan/wekan/commit/79b44675464d829b8b9ac05d01ec0aad2a8423b0)
 - [Location has its own Board Settings / Card toggle](https://github.com/wekan/wekan/commit/970213010013529150101d3fd6c59f33eab542d4)
 - [The location remove button works again](https://github.com/wekan/wekan/commit/7dd3673c5f066aa3205abd673743278279f4a470)
 - [The map chooser moves to one place, shared with the Admin Panel](https://github.com/wekan/wekan/commit/ebe985d4532fd06daab507f443cbb35d96b381eb)
 - [Locations set through the REST API](https://github.com/wekan/wekan/commit/f0bce67a3bf301c21ded3eb97e84a3be0010290f)
 - [Detect a location from a map link of many providers, and choose the map service](https://github.com/wekan/wekan/commit/e63c5b112d517b259fdc5347444914b9d86fd71f)
 - [Several locations per card, and Trello's location imported](https://github.com/wekan/wekan/commit/899617bd4d83905df05fd8aab1d26630e676fee5)
