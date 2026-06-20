/* eslint-env mocha */
import { expect } from 'chai';
import {
  announcementVersion,
  shouldShowAnnouncement,
} from '../announcementVisibility';

/**
 * Unit tests for per-user announcement dismissal logic (#6051).
 *
 * The pure helpers decide whether the global announcement banner should be
 * shown to a given user, based on the global "enabled" toggle and the version
 * the user has previously dismissed. The version is a stable fingerprint of the
 * announcement identity + text, so editing the announcement changes the version
 * and the banner reappears for everyone.
 */
describe('announcement dismissal (#6051)', function() {
  describe('announcementVersion', function() {
    it('returns null for missing announcement or missing _id', function() {
      expect(announcementVersion(null)).to.equal(null);
      expect(announcementVersion(undefined)).to.equal(null);
      expect(announcementVersion({})).to.equal(null);
      expect(announcementVersion({ body: 'hi' })).to.equal(null);
    });

    it('is stable for the same id + text', function() {
      const a = { _id: 'abc', title: 'T', body: 'Hello world' };
      const b = { _id: 'abc', title: 'T', body: 'Hello world' };
      expect(announcementVersion(a)).to.equal(announcementVersion(b));
    });

    it('changes when the body text changes', function() {
      const before = announcementVersion({ _id: 'abc', body: 'Old message' });
      const after = announcementVersion({ _id: 'abc', body: 'New message' });
      expect(before).to.not.equal(after);
    });

    it('changes when the title changes', function() {
      const before = announcementVersion({ _id: 'abc', title: 'A', body: 'x' });
      const after = announcementVersion({ _id: 'abc', title: 'B', body: 'x' });
      expect(before).to.not.equal(after);
    });

    it('differs for different ids with identical text', function() {
      const a = announcementVersion({ _id: 'id1', body: 'same' });
      const b = announcementVersion({ _id: 'id2', body: 'same' });
      expect(a).to.not.equal(b);
    });
  });

  describe('shouldShowAnnouncement', function() {
    const version = announcementVersion({ _id: 'abc', body: 'Hello' });

    it('is shown when enabled and the user has not dismissed it', function() {
      expect(
        shouldShowAnnouncement({
          enabled: true,
          version,
          dismissedVersion: null,
        }),
      ).to.equal(true);
    });

    it('is hidden when the user dismissed this exact version', function() {
      expect(
        shouldShowAnnouncement({
          enabled: true,
          version,
          dismissedVersion: version,
        }),
      ).to.equal(false);
    });

    it('is shown again once the announcement version changes', function() {
      const dismissedVersion = version;
      const newVersion = announcementVersion({ _id: 'abc', body: 'Updated' });
      expect(newVersion).to.not.equal(dismissedVersion);
      expect(
        shouldShowAnnouncement({
          enabled: true,
          version: newVersion,
          dismissedVersion,
        }),
      ).to.equal(true);
    });

    it('is hidden when the global announcement is disabled', function() {
      expect(
        shouldShowAnnouncement({
          enabled: false,
          version,
          dismissedVersion: null,
        }),
      ).to.equal(false);
    });

    it('is hidden when there is no usable version', function() {
      expect(
        shouldShowAnnouncement({
          enabled: true,
          version: null,
          dismissedVersion: null,
        }),
      ).to.equal(false);
    });
  });
});
