/* eslint-env mocha */
import { expect } from 'chai';
import {
  countDueDateChanges,
  DUE_DATE_ACTIVITY_TYPE,
} from '../dueDateEdits';

describe('dueDateEdits', function() {
  describe(countDueDateChanges.name, function() {
    it('counts only due-date-change activities', function() {
      const activities = [
        { activityType: DUE_DATE_ACTIVITY_TYPE },
        { activityType: DUE_DATE_ACTIVITY_TYPE },
        { activityType: DUE_DATE_ACTIVITY_TYPE },
      ];
      expect(countDueDateChanges(activities)).to.equal(3);
    });

    it('ignores non-due-date activities', function() {
      const activities = [
        { activityType: DUE_DATE_ACTIVITY_TYPE },
        { activityType: 'a-startAt' },
        { activityType: 'a-endAt' },
        { activityType: 'createCard' },
        { activityType: DUE_DATE_ACTIVITY_TYPE },
      ];
      expect(countDueDateChanges(activities)).to.equal(2);
    });

    it('returns 0 when there are no due-date activities', function() {
      const activities = [
        { activityType: 'a-startAt' },
        { activityType: 'createCard' },
      ];
      expect(countDueDateChanges(activities)).to.equal(0);
    });

    it('returns 0 for an empty array', function() {
      expect(countDueDateChanges([])).to.equal(0);
    });

    it('returns 0 for non-array input', function() {
      expect(countDueDateChanges(undefined)).to.equal(0);
      expect(countDueDateChanges(null)).to.equal(0);
      expect(countDueDateChanges({})).to.equal(0);
    });

    it('tolerates falsy / malformed entries', function() {
      const activities = [
        null,
        undefined,
        {},
        { activityType: DUE_DATE_ACTIVITY_TYPE },
      ];
      expect(countDueDateChanges(activities)).to.equal(1);
    });
  });
});
