import {
  recoveryReportCountForAdmin,
  recoveryReportForAdmin,
} from '/server/lib/recoveryReport';

// Admin Panel / Problems / Recovery (#6492). Lists the recovery/remediation audit
// events newest-first, with the same server-side search + pagination as the other
// admin reports.
//
// Readiness is signalled UP FRONT and the page is streamed with this.added (the same
// pattern that keeps the Files report from hanging on FerretDB's OpLog), and the page
// is read directly from the recoveryEvents collection so it always resolves.

Meteor.publish('recoveryReport', async function recoveryReport(searchTerm = '', status = 'all', limit, skip = 0) {
  check(searchTerm, Match.OneOf(String, null, undefined));
  check(status, Match.Where(value => ['all', 'done', 'failed', 'deleted'].includes(value)));
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));

  this.ready();

  try {
    const { rows: docs } = await recoveryReportForAdmin(this.userId, {
      search: searchTerm || '', status, limit, skip: skip || 0,
    });

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
  async getRecoveryReportCount(searchTerm = '', status = 'all') {
    check(searchTerm, Match.OneOf(String, null, undefined));
    check(status, Match.Where(value => ['all', 'done', 'failed', 'deleted'].includes(value)));

    return recoveryReportCountForAdmin(this.userId, searchTerm || '', status);
  },
});
