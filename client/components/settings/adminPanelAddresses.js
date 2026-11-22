// Admin Panel / Settings / Privacy and security / Allowed addresses
// (models/lib/adminPanelAddresses.js). The list is read and saved through
// site-admin methods, never published: it describes the admins' network.
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';

const { normalizeAllowedAddresses, addressAllowed } = require('/models/lib/adminPanelAddresses');

// Would this list lock the saver out? The rule the server applies when it
// refuses to save it.
function locksOut(text, yourAddress) {
  let list;
  try { list = normalizeAllowedAddresses(text); } catch (e) { return false; }
  return list.length > 0 && !addressAllowed(yourAddress, list);
}

Template.adminPanelAllowedAddresses.onCreated(function () {
  this.config = new ReactiveVar({ addresses: [], source: 'settings', yourAddress: '' });
  this.text = new ReactiveVar(null);
  this.status = new ReactiveVar('');
  Meteor.call('getAdminPanelAllowedAddresses', (error, config) => {
    if (!error && config) this.config.set(config);
  });
});

Template.adminPanelAllowedAddresses.helpers({
  addressesText() { return (Template.instance().config.get().addresses || []).join('\n'); },
  yourAddress() { return Template.instance().config.get().yourAddress || ''; },
  fromEnvironment() { return Template.instance().config.get().source !== 'settings'; },
  lockout() {
    const tpl = Template.instance();
    const text = tpl.text.get();
    return text !== null && locksOut(text, tpl.config.get().yourAddress);
  },
  status() { return Template.instance().status.get(); },
});

Template.adminPanelAllowedAddresses.events({
  'input .js-admin-panel-addresses-text'(event, tpl) {
    tpl.status.set('');
    tpl.text.set(event.currentTarget.value);
  },
  'submit .js-admin-panel-addresses'(event, tpl) {
    event.preventDefault();
    const value = String(event.currentTarget.elements.addresses.value || '');
    Meteor.call('saveAdminPanelAllowedAddresses', value, (error, result) => {
      if (error) {
        tpl.status.set(error.error === 'admin-panel-address-lockout'
          ? TAPi18n.__('cloud-allowed-addresses-lockout', { address: tpl.config.get().yourAddress })
          : (error.reason || error.message));
        return;
      }
      tpl.config.set({ ...tpl.config.get(), addresses: result.addresses });
      tpl.text.set(null);
      tpl.status.set(TAPi18n.__('feature-saved'));
    });
  },
});

Template.adminPanelAddressRefused.onCreated(function () {
  this.state = new ReactiveVar({ refused: false });
  Meteor.call('adminPanelAddressStatus', (error, state) => {
    if (!error && state) this.state.set(state);
  });
});

Template.adminPanelAddressRefused.helpers({
  refused() { return Template.instance().state.get().refused === true; },
  yourAddress() { return Template.instance().state.get().yourAddress || ''; },
});
