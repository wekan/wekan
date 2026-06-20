/* eslint-env mocha */
import { expect } from 'chai';
import { dueDateClass } from '/client/lib/dueDateColor';

/**
 * Unit tests for the due-date badge colour logic shared by the card-detail
 * badge (`cardDueDate`) and the minicard badge (`minicardDueDate`).
 *
 * Regression coverage for:
 *   - #6000: future due dates more than ~48h away must be grey ('not-due'),
 *     not amber ('due-soon').
 *   - #5965: the card detail and minicard must compute the SAME class for a
 *     given due date (this function is the single source of truth used by
 *     both views).
 */
describe('due date colour logic (dueDateClass)', function() {
  const HOUR = 1000 * 60 * 60;
  const DAY = HOUR * 24;
  const now = new Date('2026-06-20T12:00:00Z');

  describe('without an end date', function() {
    it('returns "overdue" for a due date in the past', function() {
      const due = new Date(now.getTime() - 2 * HOUR);
      expect(dueDateClass(due, now)).to.equal('overdue');
    });

    it('returns "overdue" for a due date several days in the past', function() {
      const due = new Date(now.getTime() - 5 * DAY);
      expect(dueDateClass(due, now)).to.equal('overdue');
    });

    it('returns "due-soon" for a due date within 48 hours', function() {
      const due = new Date(now.getTime() + 5 * HOUR);
      expect(dueDateClass(due, now)).to.equal('due-soon');
    });

    it('returns "due-soon" for a due date exactly 48 hours away', function() {
      const due = new Date(now.getTime() + 48 * HOUR);
      expect(dueDateClass(due, now)).to.equal('due-soon');
    });

    it('returns "not-due" for a due date 3 days in the future', function() {
      const due = new Date(now.getTime() + 3 * DAY);
      expect(dueDateClass(due, now)).to.equal('not-due');
    });

    it('returns "not-due" just past the 48 hour boundary (#6000 regression)', function() {
      const due = new Date(now.getTime() + 48 * HOUR + 60 * 1000);
      expect(dueDateClass(due, now)).to.equal('not-due');
    });
  });

  describe('with an end date', function() {
    it('returns "completed-early" when the end date is before the due date', function() {
      const due = new Date(now.getTime() + 3 * DAY);
      const end = new Date(now.getTime() + 1 * DAY);
      expect(dueDateClass(due, now, end)).to.equal('completed-early');
    });

    it('returns "completed" when the end date is on or after the due date', function() {
      const due = new Date(now.getTime() + 1 * DAY);
      const end = new Date(now.getTime() + 3 * DAY);
      expect(dueDateClass(due, now, end)).to.equal('completed');
    });
  });

  describe('view consistency (#5965)', function() {
    it('produces a single class regardless of which view calls it', function() {
      // The card detail and minicard call dueDateClass with the same args,
      // so the result is identical by construction.
      const due = new Date(now.getTime() - 1 * HOUR);
      const detailClass = dueDateClass(due, now);
      const minicardClass = dueDateClass(due, now);
      expect(detailClass).to.equal(minicardClass);
      expect(detailClass).to.equal('overdue');
    });
  });
});
