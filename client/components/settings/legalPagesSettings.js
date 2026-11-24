import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
import { legalLabel } from '/client/components/legal/legalPage';

const { PAGES, IMPRINT_FIELDS, CONTACT_FIELDS } = require('/models/lib/legalPages');
const { draftPrivacyNotice, inventoryRows } = require('/models/lib/privacyNoticeDraft');

Template.legalPagesSettings.onCreated(function () {
  this.docs = new ReactiveVar(null);
  this.message = new ReactiveVar('');
  this.reload = () => Meteor.call('getLegalPagesForAdmin', (error, docs) => {
    if (error) this.message.set(error.reason || error.message);
    this.docs.set(error ? [] : docs);
  });
  this.reload();
});

Template.legalPagesSettings.helpers({
  loading() { return Template.instance().docs.get() === null; },
  message() { return Template.instance().message.get(); },
  pages() {
    const docs = Template.instance().docs.get() || [];
    return PAGES.map(id => {
      const doc = docs.find(d => d._id === id) || { _id: id };
      return {
        ...doc,
        label: legalLabel(id),
        isImprint: id === 'imprint',
        isPrivacy: id === 'privacy',
        imprintFields: IMPRINT_FIELDS.map(key => ({ key, label: legalLabel(key), value: doc[key] || '' })),
      };
    });
  },
  inventory() { return inventoryRows(); },
  contactFields() {
    const doc = (Template.instance().docs.get() || []).find(d => d._id === 'contacts') || {};
    return CONTACT_FIELDS.map(key => ({ key, label: legalLabel(key), value: doc[key] || '' }));
  },
});

Template.legalPagesSettings.events({
  // The privacy notice's starting text, from what this WeKan really stores
  // (models/lib/privacyNoticeDraft.js). Only into an empty text: it never
  // replaces what the operator wrote.
  'click .js-legal-draft'(event) {
    event.preventDefault();
    const body = event.currentTarget.closest('.legal-page-editor').querySelector('.js-legal-body');
    if (!body.value.trim()) body.value = draftPrivacyNotice();
  },
  'click .js-legal-save'(event, tpl) {
    event.preventDefault();
    const section = event.currentTarget.closest('.legal-page-editor');
    const form = {
      enabled: section.querySelector('.js-legal-enabled').checked,
      title: section.querySelector('.js-legal-title').value,
      url: section.querySelector('.js-legal-url').value,
      body: section.querySelector('.js-legal-body').value,
    };
    section.querySelectorAll('.js-legal-field').forEach(input => { form[input.dataset.field] = input.value; });
    Meteor.call('saveLegalPage', section.dataset.page, form, error => {
      tpl.message.set(error ? (error.reason || error.message) : TAPi18n.__('feature-saved'));
      tpl.reload();
    });
  },
  'click .js-legal-contacts-save'(event, tpl) {
    event.preventDefault();
    const form = {};
    tpl.findAll('.js-legal-contact').forEach(input => { form[input.dataset.field] = input.value; });
    Meteor.call('saveLegalContacts', form, error => {
      tpl.message.set(error ? (error.reason || error.message) : TAPi18n.__('feature-saved'));
      tpl.reload();
    });
  },
});
