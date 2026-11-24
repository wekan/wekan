import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
import { legalLabel } from '/client/components/legal/legalPage';
import './legalAcceptance.jade';

// WP-8 (models/lib/legalAcceptance.js): after signing in, ask whether this
// account still has to accept the terms or the privacy notice, and if so show
// nothing but legalAcceptanceRequired. Accepting reloads the page, because
// every subscription the server left empty meanwhile has to be made again.
let overlay = null;
const requirement = new ReactiveVar(null);

function closeOverlay() {
  if (!overlay) return;
  Blaze.remove(overlay.view);
  overlay.node.remove();
  overlay = null;
}

function openOverlay() {
  if (overlay) return;
  const node = document.createElement('div');
  document.body.appendChild(node);
  overlay = { node, view: Blaze.render(Template.legalAcceptanceRequired, node) };
}

Template.legalAcceptanceRequired.onCreated(function () {
  this.checked = new ReactiveVar([]);
  this.error = new ReactiveVar('');
});

Template.legalAcceptanceRequired.helpers({
  missing() {
    return ((requirement.get() || {}).missing || []).map(m => ({ ...m, label: legalLabel(m.page) }));
  },
  notAllChecked() {
    const missing = (requirement.get() || {}).missing || [];
    return Template.instance().checked.get().length < missing.length;
  },
  error() { return Template.instance().error.get(); },
});

Template.legalAcceptanceRequired.events({
  'change .js-legal-accept'(event, tpl) {
    tpl.checked.set(tpl.findAll('.js-legal-accept:checked').map(input => input.dataset.page));
  },
  'click .js-legal-accept-submit'(event, tpl) {
    const accepted = tpl.findAll('.js-legal-accept:checked')
      .map(input => ({ page: input.dataset.page, version: Number(input.dataset.version) }));
    Meteor.call('acceptLegalPages', accepted, error => {
      if (error) {
        // A page got a new version while it was open: show the new one.
        tpl.error.set(TAPi18n.__(error.error === 'legal-page-changed' ? 'legal-acceptance-changed' : 'error-notAuthorized'));
        Meteor.call('getLegalAcceptanceRequirement', (e, result) => { if (!e) requirement.set(result); });
        return;
      }
      window.location.reload();
    });
  },
  'click .js-legal-acceptance-logout'() {
    Meteor.logout(() => closeOverlay());
  },
});

// The sign-up checkbox: shown only while a page requires acceptance.
Template.legalAcceptanceSignup.onCreated(function () {
  this.required = new ReactiveVar(false);
  Meteor.call('getLegalAcceptanceRequirement', (error, result) => {
    if (!error && result) this.required.set(result.required === true);
  });
});

Template.legalAcceptanceSignup.helpers({
  required() { return Template.instance().required.get(); },
});

// The sign-up age confirmation: shown only while REGISTRATION_MINIMUM_AGE is set.
Template.registrationAgeSignup.onCreated(function () {
  this.age = new ReactiveVar(0);
  Meteor.call('getRegistrationMinimumAge', (error, age) => { if (!error) this.age.set(age || 0); });
});

Template.registrationAgeSignup.helpers({
  age() { return Template.instance().age.get(); },
});

Template.legalAcceptancesList.helpers({
  accepted() {
    const accepted = (requirement.get() || {}).accepted || {};
    return Object.keys(accepted).map(page => ({
      page,
      label: legalLabel(page),
      version: accepted[page].version,
      date: accepted[page].at ? new Date(accepted[page].at).toLocaleDateString() : '',
    }));
  },
});

// Member Settings / Privacy and my data reads the accepted versions fresh.
Template.legalAcceptancesList.onCreated(() => {
  Meteor.call('getLegalAcceptanceRequirement', (error, result) => { if (!error) requirement.set(result); });
});

Meteor.startup(() => {
  let askedFor = null;
  Tracker.autorun(() => {
    const userId = Meteor.userId();
    if (!userId) {
      askedFor = null;
      closeOverlay();
      return;
    }
    if (askedFor === userId) return;
    askedFor = userId;
    Meteor.call('getLegalAcceptanceRequirement', (error, result) => {
      if (error || !result || Meteor.userId() !== userId) return;
      requirement.set(result);
      if (result.missing && result.missing.length) openOverlay();
    });
  });
});
