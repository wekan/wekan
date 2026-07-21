import RecoveryEvents from '/models/recoveryEvents';
import { recoveryReportQuery } from '/models/lib/recoveryReportQuery';

// Admin Panel / Problems / Recovery (#6492). Lists the recovery/remediation audit
// events newest-first, with the same server-side search + pagination as the other
// admin reports.
//
// Readiness is signalled UP FRONT and the page is streamed with this.added (the same
// pattern that keeps the Files report from hanging on FerretDB's OpLog), and the page
// is read directly from the recoveryEvents collection so it always resolves.

Meteor.publish('recoveryReport', async function recoveryReport(searchTerm = '', limit, skip = 0) {
  check(searchTerm, Match.OneOf(String, null, undefined));
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));

  this.ready();

  try {
    const user = this.userId && (await Meteor.users.findOneAsync(this.userId));
    if (!user || !user.isAdmin) {
      return;
    }

    const cursor = RecoveryEvents.find(recoveryReportQuery(searchTerm), {
      sort: { createdAt: -1 },
      limit,
      skip: skip || 0,
    });

    const docs =
      typeof cursor.fetchAsync === 'function' ? await cursor.fetchAsync() : cursor.fetch();

    for (const doc of docs || []) {
      const { _id, ...fields } = doc;
      this.added('recoveryEvents', _id, fields);
    }
  } catch (e) {
    if (process.env.DEBUG === 'true') {
      // eslint-disable-next-line no-console
      console.error('recoveryReport publish failed:', e && e.message);
    }
  }
});

Meteor.methods({
  async getRecoveryReportCount(searchTerm = '') {
    check(searchTerm, Match.OneOf(String, null, undefined));

    const user = await Meteor.userAsync();
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized');
    }

    const cursor = RecoveryEvents.find(recoveryReportQuery(searchTerm));
    return typeof cursor.countAsync === 'function' ? await cursor.countAsync() : cursor.count();
  },
});
