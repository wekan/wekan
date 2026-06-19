'use strict';

/**
 * Spec 33 — #5850 domain-based board sharing
 *
 * A board can be shared with one or more email-address domains: every user
 * whose primary email is in one of the board's active domains gets access.
 * This exercises the methods/helpers that back that feature directly:
 *  - setBoardDomains(boardDomainsArray, currBoardId) — board-admin gated; takes
 *    an array of { domain, isActive } objects, trims + lowercases each domain,
 *    de-duplicates, and rejects (throws 'invalid-domain') any entry that does
 *    not look like a domain (empty, no '.', contains '@' or whitespace).
 *  - getDomainsWithUserCounts() — admin-only; returns [{ domain, count }] with
 *    each user counted once by their primary email's domain.
 *  - board.domains visibility — a board whose active domains include a user's
 *    emailDomains() is returned to that user in All Boards.
 *
 * The seeded board's owner is a board member with isAdmin: true, so the board
 * owner is a board admin and may call setBoardDomains.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

function callMethod(page, name, ...args) {
  return page.evaluate(
    ({ name, args }) =>
      new Promise(resolve => {
        Meteor.call(name, ...args, (err, res) =>
          resolve(err ? { error: err.reason || err.error || err.message } : { result: res ?? null }),
        );
      }),
    { name, args },
  );
}

test.describe('#5850 domain-based board sharing', () => {
  test('setBoardDomains stores normalized, validated, de-duplicated domains', async ({ page, user }) => {
    // Board owned by `user`; the seeded owner member is isAdmin: true, so `user`
    // is a board admin and may call setBoardDomains.
    const board = db.seedBoard({ ownerId: user.id, title: db.uid('DomainBoard') });
    try {
      await loginWithToken(page, user.id, user.token);

      // 'Example.COM' and 'example.com' normalise to the same domain and must be
      // de-duplicated down to a single lowercased active entry.
      const ok = await callMethod(page, 'setBoardDomains', [
        { domain: 'Example.COM', isActive: true },
        { domain: 'example.com', isActive: true },
      ], board.boardId);
      expect(ok.error).toBeUndefined();

      const stored = db.findOne('boards', { _id: board.boardId });
      expect(Array.isArray(stored.domains)).toBe(true);
      expect(stored.domains.length).toBe(1);
      expect(stored.domains[0].domain).toBe('example.com');
      expect(stored.domains[0].isActive).toBe(true);

      // An entry that is not a valid domain (whitespace / no dot in a usable
      // form) is rejected: setBoardDomains throws and leaves the prior value.
      const bad = await callMethod(page, 'setBoardDomains', [
        { domain: 'bad domain', isActive: true },
      ], board.boardId);
      expect(bad.error).toBeTruthy();

      // The invalid call did not overwrite the previously stored domains.
      const after = db.findOne('boards', { _id: board.boardId });
      expect(after.domains.length).toBe(1);
      expect(after.domains[0].domain).toBe('example.com');
      expect(after.domains.some(d => d.domain.indexOf(' ') >= 0)).toBe(false);
    } finally {
      db.cleanup({ boardIds: [board.boardId] });
    }
  });

  test('getDomainsWithUserCounts returns per-domain counts (admin only)', async ({ page, adminUser }) => {
    const domainA = `${db.uid('co').toLowerCase()}.com`;
    const domainB = `${db.uid('co').toLowerCase()}.com`;
    // Two users whose primary email is in domainA, one in domainB.
    const u1 = db.seedUser();
    const u2 = db.seedUser();
    const u3 = db.seedUser();
    const nonAdmin = db.seedUser();
    try {
      db.updateOne('users', { _id: u1.id }, { $set: { 'emails.0.address': `a1@${domainA}`, 'emails.0.verified': true } });
      db.updateOne('users', { _id: u2.id }, { $set: { 'emails.0.address': `a2@${domainA}`, 'emails.0.verified': true } });
      db.updateOne('users', { _id: u3.id }, { $set: { 'emails.0.address': `b1@${domainB}`, 'emails.0.verified': true } });

      await loginWithToken(page, adminUser.id, adminUser.token);

      const r = await callMethod(page, 'getDomainsWithUserCounts');
      expect(r.error).toBeUndefined();
      const byDomain = Object.fromEntries((r.result || []).map(e => [e.domain, e.count]));
      expect(byDomain[domainA]).toBe(2);
      expect(byDomain[domainB]).toBe(1);

      // Non-admin call is rejected (not-authorized).
      await loginWithToken(page, nonAdmin.id, nonAdmin.token);
      const denied = await callMethod(page, 'getDomainsWithUserCounts');
      expect(denied.error).toBeTruthy();
    } finally {
      db.cleanup({ userIds: [u1.id, u2.id, u3.id, nonAdmin.id] });
    }
  });

  test('a board shared with a user\'s email domain is visible to that user', async ({ page, adminUser, user }) => {
    // The board is owned by `adminUser` (someone else) and `user` is NOT a
    // member. It is shared only via its domains list, which we set to `user`'s
    // primary email domain — so it must appear in `user`'s All Boards.
    const domain = `${db.uid('share').toLowerCase()}.com`;
    const title = db.uid('SharedByDomain');
    const board = db.seedBoard({ ownerId: adminUser.id, title });
    try {
      // Put `user` on the shared domain and share the board with that domain.
      db.updateOne('users', { _id: user.id }, {
        $set: { 'emails.0.address': `member@${domain}`, 'emails.0.verified': true },
      });
      db.updateOne('boards', { _id: board.boardId }, {
        $set: { domains: [{ domain, isActive: true }] },
      });

      // Sanity at the data layer: the board's active domain matches the user's
      // emailDomains() (this is exactly the predicate the visibility selector in
      // models/boards.js uses).
      const u = db.findOne('users', { _id: user.id });
      const userDomain = (u.emails[0].address.split('@')[1] || '').toLowerCase();
      const b = db.findOne('boards', { _id: board.boardId });
      expect(b.domains.some(d => d.isActive && d.domain === userDomain)).toBe(true);

      // Now assert it through the UI: `user` (not a board member) sees the board
      // in All Boards purely because of the domain match. We open the "Remaining"
      // sub-view (/remaining) because the default All Boards view is "Starred",
      // which only lists starred boards; a domain-shared board the user has not
      // starred and not assigned to a workspace appears under Remaining.
      await loginWithToken(page, user.id, user.token);
      await page.goto(`${process.env.WEKAN_BASE_URL || 'http://localhost:3000'}/remaining`, { waitUntil: 'commit' });

      const titleVisible = await page
        .locator('.board-list-item-name', { hasText: title })
        .first()
        .waitFor({ timeout: 20_000 })
        .then(() => true)
        .catch(() => false);
      expect(titleVisible).toBe(true);
    } finally {
      db.cleanup({ boardIds: [board.boardId] });
    }
  });
});
