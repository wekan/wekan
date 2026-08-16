import { ReactiveVar } from 'meteor/reactive-var';
import { selectedMapProvider } from '/client/components/main/mapProvider';

const { mapLinkFor } = require('/models/lib/mapLink');

// The behaviour every table page shares, on the template that draws them all.
//
// WHY IT IS HERE. The markup lives in tablePage.jade, so a click on a cell in
// ANY report - Problems, Offices, People - happens inside this template. Three
// report templates had their own identical copy of the "clicking a user opens
// the Edit user popup" handler, because each was written where its own page
// was; a Blaze event bubbles through the template hierarchy, so one handler
// here reaches all of them and a fourth report gets it for free.
//
// What does NOT belong here is anything a page owns: search, paging and loading
// differ per report (each has its own state and its own method), so they stay
// with their page.

Template.tablePage.events({
  // A user cell: the same "Edit user" popup Admin Panel / People opens, from
  // whichever table the avatar or initials were clicked in.
  'click .js-table-page-edit-user'(event) {
    event.preventDefault();
    const userId = event.currentTarget.getAttribute('data-user-id');
    if (userId) {
      Popup.open('editUser').call({ userId }, event);
    }
  },

  // A location cell: which map to open it at. The cell itself stays SHORT -
  // "London", with the country's flag - because the table is wide and the
  // detail belongs behind the click, not in the row.
  'click .js-table-page-map'(event) {
    event.preventDefault();
    const el = event.currentTarget;
    const latitude = parseFloat(el.getAttribute('data-latitude'));
    const longitude = parseFloat(el.getAttribute('data-longitude'));
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    // titleKey, not a new `tablePageMapPopup-title`: a popup with no title
    // renders with no header and so no close button
    // (tests/popupTitles.test.cjs), and this popup IS "Open map links at" -
    // the phrase the card's chooser is already labelled with, in every
    // language WeKan has.
    Popup.open('tablePageMap', { titleKey: 'location-open-map-at' }).call({
      latitude,
      longitude,
      label: el.getAttribute('data-label') || '',
    }, event);
  },
});

// The map popup: where this is, and which map to open it at.
//
// It is the map half of the card's location popup and nothing else. A card's
// popup also EDITS the location - name, address, latitude, longitude, delete -
// and none of that applies here: an office's location arrived in a CDN header,
// WeKan did not ask for it and cannot correct it. So the two share the provider
// chooser (+mapProviderSelect) and diverge where they genuinely differ.
Template.tablePageMapPopup.onCreated(function () {
  // Re-read on every change of the select, so the link below it follows the
  // choice before it is saved. Choosing a provider and finding the link still
  // pointing at the old one reads as a broken popup.
  this.provider = new ReactiveVar(selectedMapProvider(null));
  this.savedMsg = new ReactiveVar('');
});

Template.tablePageMapPopup.helpers({
  label() {
    return (Template.currentData() || {}).label || '';
  },
  coordinates() {
    const data = Template.currentData() || {};
    if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return '';
    // Six decimals is about 10 cm, which is more than a city-level header can
    // possibly justify and still short enough to read.
    return `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`;
  },
  mapUrl() {
    const data = Template.currentData() || {};
    const tmpl = Template.instance();
    if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return '';
    return mapLinkFor(tmpl.provider.get(), data.latitude, data.longitude);
  },
  savedMessage() {
    return Template.instance().savedMsg.get();
  },
});

Template.tablePageMapPopup.events({
  'change .js-map-provider'(event, tmpl) {
    tmpl.provider.set(event.currentTarget.value || 'openstreetmap');
    tmpl.savedMsg.set('');
  },
  // Saving is optional: the link above works with the selection whether or not
  // it is kept. Saving makes it the default for cards too, because it is the
  // one `profile.mapProvider` both read.
  'click .js-save-map-provider'(event, tmpl) {
    event.preventDefault();
    Meteor.call('setMapProvider', selectedMapProvider(tmpl), err => {
      tmpl.savedMsg.set(TAPi18n.__(err ? 'server-error' : 'map-provider-saved'));
    });
  },
});
