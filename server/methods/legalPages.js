// Legal pages and privacy contacts (docs/Compliance/README.md WP-6).
//
//   getLegalPages()                 anybody, signed in or not: the published
//                                   pages and the filled contacts only
//   getLegalPagesForAdmin()         a site administrator: everything, to edit
//   saveLegalPage(page, form)       a site administrator; audited
//   saveLegalContacts(form)         a site administrator; audited
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import LegalPages from '/models/legalPages';

const { PAGES, publicPage, publicContacts, pageUpdate, contactsUpdate } = require('/models/lib/legalPages');
const { isSiteAdmin } = require('/models/lib/tenantAdmin');

async function assertSiteAdmin(userId) {
  const user = userId ? await ReactiveCache.getUser(userId) : null;
  if (!user || user.loginDisabled || !isSiteAdmin(user)) throw new Meteor.Error('not-authorized');
}

const FORM = Match.ObjectIncluding({});

Meteor.methods({
  // The sign-up form's minimum age (REGISTRATION_MINIMUM_AGE), 0 when unset;
  // asked by anybody, signed in or not, like the legal pages.
  getRegistrationMinimumAge() {
    return require('/models/lib/registrationAge').minimumAge({ REGISTRATION_MINIMUM_AGE: process.env.REGISTRATION_MINIMUM_AGE });
  },
  async getLegalPages() {
    const docs = await LegalPages.find({ _id: { $in: [...PAGES, 'contacts'] } }).fetchAsync();
    return {
      pages: docs.map(publicPage).filter(Boolean),
      contacts: publicContacts(docs.find(d => d._id === 'contacts')),
    };
  },
  async getLegalPagesForAdmin() {
    await assertSiteAdmin(this.userId);
    return LegalPages.find({ _id: { $in: [...PAGES, 'contacts'] } }).fetchAsync();
  },
  async saveLegalPage(page, form) {
    check(page, String);
    check(form, FORM);
    await assertSiteAdmin(this.userId);
    if (!PAGES.includes(page)) throw new Meteor.Error('legal-page-unknown');
    const current = (await LegalPages.findOneAsync(page)) || { _id: page };
    const $set = { ...pageUpdate(current, form), modifiedAt: new Date(), modifiedBy: this.userId };
    await LegalPages.upsertAsync({ _id: page }, { $set });
    // Requiring acceptance, or a new version of a page that requires it,
    // applies at once on this server (WP-8, server/requireLegalAcceptance.js).
    await require('/server/requireLegalAcceptance').refreshRequiredAcceptances();
    return $set.version;
  },
  async saveLegalContacts(form) {
    check(form, FORM);
    await assertSiteAdmin(this.userId);
    await LegalPages.upsertAsync({ _id: 'contacts' }, { $set: { ...contactsUpdate(form), modifiedAt: new Date() } });
    return true;
  },
});

// The records of processing draft (row 2.2, models/lib/ropaDraft.js): the
// inventory, the retention values set on this server and the outside services
// it really uses. Read here, because only the server knows its environment.
Meteor.methods({
  async getRopaDraft() {
    await assertSiteAdmin(this.userId);
    const { INVENTORY } = require('/models/lib/personalDataInventory');
    const values = {};
    for (const e of INVENTORY) {
      const env = e.retention && e.retention.env;
      if (env && /^[A-Z0-9_]+$/.test(env) && process.env[env] !== undefined) values[env] = String(process.env[env]).slice(0, 40);
    }
    const Settings = require('/models/settings').default;
    const setting = (await Settings.findOneAsync({}, { fields: { activityPubEnabled: 1 } })) || {};
    let storage = {};
    try {
      storage = (await require('/models/attachmentStorageSettings').default.findOneAsync({}, { fields: { defaultStorage: 1 } })) || {};
    } catch (e) { storage = {}; }
    const Integrations = require('/models/integrations').default;
    const services = {
      pwnedPasswords: require('/server/lib/passwordPolicy').currentPasswordPolicy().checkPwned === true,
      defaultAvatar: !!String(process.env.DEFAULT_AVATAR_URL || '').trim(),
      mail: !!String(process.env.MAIL_URL || '').trim(),
      objectStorage: ['s3', 'azure', 'gcs', 'webdav'].includes(storage.defaultStorage),
      webhooks: !!(await Integrations.findOneAsync({ enabled: true }, { fields: { _id: 1 } })),
      activityPub: setting.activityPubEnabled === true,
    };
    return require('/models/lib/ropaDraft').ropaDraft({ values, services });
  },
});

// The retention overview of Admin Panel / Settings / Legal pages (WP-7): every
// collection the inventory says holds personal data, how long it is kept by
// default, the setting that limits it and the value that setting has on this
// server. Read here because only the server knows its environment.
Meteor.methods({
  async getRetentionOverview() {
    await assertSiteAdmin(this.userId);
    const { INVENTORY } = require('/models/lib/personalDataInventory');
    return INVENTORY
      .filter(e => !(e.categories.length === 1 && e.categories[0] === 'none'))
      .map(e => {
        const env = e.retention && e.retention.env;
        const set = env && /^[A-Z0-9_]+$/.test(env) ? process.env[env] : undefined;
        return {
          collection: e.collection,
          categories: e.categories.join(', '),
          purpose: e.purpose,
          retention: (e.retention && e.retention.default) || '',
          env: env || '',
          value: set === undefined || set === '' ? '' : String(set).slice(0, 40),
        };
      });
  },
});
