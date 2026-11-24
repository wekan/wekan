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
    return $set.version;
  },
  async saveLegalContacts(form) {
    check(form, FORM);
    await assertSiteAdmin(this.userId);
    await LegalPages.upsertAsync({ _id: 'contacts' }, { $set: { ...contactsUpdate(form), modifiedAt: new Date() } });
    return true;
  },
});
