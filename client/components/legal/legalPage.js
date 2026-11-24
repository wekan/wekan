import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
// Its own templates: Admin Panel / Settings / Legal pages imports this file
// for legalLabel, and may run before the client's template imports do.
import './legalPage.jade';

// The published legal pages and the filled contacts, fetched once per page
// view from getLegalPages (server/methods/legalPages.js), which answers for
// signed-out visitors too.
const LABEL_KEYS = {
  privacy: 'privacy-notice', terms: 'terms-of-use', cookies: 'cookie-notice', imprint: 'imprint',
  name: 'imprint-name', legalForm: 'imprint-legal-form', representative: 'imprint-representative',
  address: 'imprint-address', email: 'email', phoneOrForm: 'imprint-phone-or-form', register: 'imprint-register',
  registerNumber: 'imprint-register-number', vatId: 'imprint-vat-id', supervisoryAuthority: 'imprint-supervisory-authority',
  professionalRules: 'imprint-professional-rules', mediaDisclosure: 'imprint-media-disclosure',
  privacyContact: 'privacy-contact', dpoContact: 'dpo-contact', euRepresentative: 'eu-representative',
  securityContact: 'security-contact',
};
export const legalLabel = key => TAPi18n.__(LABEL_KEYS[key] || key);

const cache = new ReactiveVar(null);
let asked = false;
export function legalPages() {
  if (!asked) {
    asked = true;
    Meteor.call('getLegalPages', (error, result) => cache.set(error ? { pages: [], contacts: [] } : result));
  }
  return cache.get();
}

Template.legalPage.helpers({
  loading() { return legalPages() === null; },
  page() {
    const id = Session.get('legalPage');
    return ((legalPages() || {}).pages || []).find(p => p._id === id) || null;
  },
  pageTitle() {
    const id = Session.get('legalPage');
    const page = ((legalPages() || {}).pages || []).find(p => p._id === id);
    return (page && page.title) || legalLabel(id);
  },
  isPrivacy() { return Session.get('legalPage') === 'privacy'; },
  contacts() { return (legalPages() || {}).contacts || []; },
  fieldLabel(key) { return legalLabel(key); },
});

Template.legalPageLinks.helpers({
  links() {
    return ((legalPages() || {}).pages || []).map(p => ({ _id: p._id, label: p.title || legalLabel(p._id) }));
  },
});
