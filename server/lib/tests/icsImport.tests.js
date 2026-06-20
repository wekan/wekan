/* eslint-env mocha */
import { expect } from 'chai';
import { parseIcs, icsEventToCard, icsToCards } from '../icsImport';

// Small helpers for building .ics fixtures. Lines are joined with CRLF, which
// is what real-world .ics files (including Google Calendar exports) use.
function ics(...lines) {
  return lines.join('\r\n');
}

describe('icsImport', function() {
  describe(parseIcs.name, function() {
    it('parses a single event with summary, description and date-time', function() {
      const text = ics(
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        'UID:abc-123',
        'SUMMARY:Team meeting',
        'DESCRIPTION:Discuss roadmap',
        'DTSTART:20260101T090000Z',
        'DTEND:20260101T100000Z',
        'END:VEVENT',
        'END:VCALENDAR',
      );

      const events = parseIcs(text);
      expect(events).to.have.lengthOf(1);
      const ev = events[0];
      expect(ev.uid).to.equal('abc-123');
      expect(ev.summary).to.equal('Team meeting');
      expect(ev.description).to.equal('Discuss roadmap');
      expect(ev.start).to.be.instanceOf(Date);
      expect(ev.start.toISOString()).to.equal('2026-01-01T09:00:00.000Z');
      expect(ev.end.toISOString()).to.equal('2026-01-01T10:00:00.000Z');
    });

    it('parses multiple events', function() {
      const text = ics(
        'BEGIN:VCALENDAR',
        'BEGIN:VEVENT',
        'SUMMARY:First',
        'DTSTART:20260101T090000Z',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'SUMMARY:Second',
        'DTSTART:20260202T120000Z',
        'END:VEVENT',
        'END:VCALENDAR',
      );

      const events = parseIcs(text);
      expect(events).to.have.lengthOf(2);
      expect(events[0].summary).to.equal('First');
      expect(events[1].summary).to.equal('Second');
    });

    it('parses an all-day date (YYYYMMDD) as UTC midnight', function() {
      const text = ics(
        'BEGIN:VEVENT',
        'SUMMARY:Holiday',
        'DTSTART;VALUE=DATE:20261225',
        'DTEND;VALUE=DATE:20261226',
        'END:VEVENT',
      );

      const events = parseIcs(text);
      expect(events).to.have.lengthOf(1);
      expect(events[0].start.toISOString()).to.equal('2026-12-25T00:00:00.000Z');
      expect(events[0].end.toISOString()).to.equal('2026-12-26T00:00:00.000Z');
    });

    it('distinguishes date vs date-time (Z) forms', function() {
      const text = ics(
        'BEGIN:VEVENT',
        'DTSTART:20260301',
        'DTEND:20260301T133000Z',
        'END:VEVENT',
      );

      const events = parseIcs(text);
      expect(events[0].start.toISOString()).to.equal('2026-03-01T00:00:00.000Z');
      expect(events[0].end.toISOString()).to.equal('2026-03-01T13:30:00.000Z');
    });

    it('unfolds RFC5545 folded lines (leading space or tab)', function() {
      const text = ics(
        'BEGIN:VEVENT',
        'SUMMARY:A very long summary that has been',
        '  folded across two lines',
        'DESCRIPTION:line one part',
        '\tjoined with a tab',
        'DTSTART:20260101T090000Z',
        'END:VEVENT',
      );

      const events = parseIcs(text);
      expect(events[0].summary).to.equal(
        'A very long summary that has been folded across two lines',
      );
      expect(events[0].description).to.equal('line one partjoined with a tab');
    });

    it('unescapes escaped commas, semicolons and newlines in TEXT values', function() {
      const text = ics(
        'BEGIN:VEVENT',
        'SUMMARY:Lunch\\, then meeting\\; bring notes',
        'DESCRIPTION:Line1\\nLine2\\NLine3',
        'END:VEVENT',
      );

      const events = parseIcs(text);
      expect(events[0].summary).to.equal('Lunch, then meeting; bring notes');
      expect(events[0].description).to.equal('Line1\nLine2\nLine3');
    });

    it('ignores properties outside a VEVENT block', function() {
      const text = ics(
        'BEGIN:VCALENDAR',
        'SUMMARY:should be ignored',
        'BEGIN:VEVENT',
        'SUMMARY:kept',
        'END:VEVENT',
        'END:VCALENDAR',
      );

      const events = parseIcs(text);
      expect(events).to.have.lengthOf(1);
      expect(events[0].summary).to.equal('kept');
    });

    it('returns [] for empty input', function() {
      expect(parseIcs('')).to.deep.equal([]);
      expect(parseIcs(null)).to.deep.equal([]);
      expect(parseIcs(undefined)).to.deep.equal([]);
    });

    it('returns [] for garbage input', function() {
      expect(parseIcs('this is not an ics file at all')).to.deep.equal([]);
      expect(parseIcs('{"json": true}')).to.deep.equal([]);
    });

    it('leaves dates null when DTSTART/DTEND are missing or malformed', function() {
      const text = ics(
        'BEGIN:VEVENT',
        'SUMMARY:No dates',
        'DTSTART:not-a-date',
        'END:VEVENT',
      );
      const events = parseIcs(text);
      expect(events[0].start).to.equal(null);
      expect(events[0].end).to.equal(null);
    });
  });

  describe(icsEventToCard.name, function() {
    it('maps event fields to a WeKan card shape', function() {
      const start = new Date('2026-01-01T09:00:00.000Z');
      const end = new Date('2026-01-01T10:00:00.000Z');
      const card = icsEventToCard(
        { summary: 'Title', description: 'Desc', start, end, uid: 'x' },
        { boardId: 'b1', listId: 'l1', swimlaneId: 's1' },
      );
      expect(card).to.deep.equal({
        title: 'Title',
        description: 'Desc',
        startAt: start,
        dueAt: end,
        boardId: 'b1',
        listId: 'l1',
        swimlaneId: 's1',
      });
    });

    it('falls back dueAt to start when there is no end', function() {
      const start = new Date('2026-01-01T09:00:00.000Z');
      const card = icsEventToCard({ summary: 'T', start, end: null });
      expect(card.dueAt).to.equal(start);
      expect(card.startAt).to.equal(start);
    });

    it('produces empty strings and null dates for an empty event', function() {
      const card = icsEventToCard({});
      expect(card.title).to.equal('');
      expect(card.description).to.equal('');
      expect(card.startAt).to.equal(null);
      expect(card.dueAt).to.equal(null);
    });

    it('tolerates being called with no event', function() {
      const card = icsEventToCard(undefined);
      expect(card.title).to.equal('');
      expect(card.dueAt).to.equal(null);
    });
  });

  describe(icsToCards.name, function() {
    it('parses and maps in one step', function() {
      const text = ics(
        'BEGIN:VEVENT',
        'SUMMARY:Card A',
        'DTSTART:20260101T090000Z',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'SUMMARY:Card B',
        'DTSTART:20260202T090000Z',
        'DTEND:20260202T100000Z',
        'END:VEVENT',
      );

      const cards = icsToCards(text, { boardId: 'b1', listId: 'l1', swimlaneId: 's1' });
      expect(cards).to.have.lengthOf(2);
      expect(cards[0].title).to.equal('Card A');
      // No DTEND -> dueAt falls back to start.
      expect(cards[0].dueAt).to.deep.equal(cards[0].startAt);
      expect(cards[1].title).to.equal('Card B');
      expect(cards[1].dueAt.toISOString()).to.equal('2026-02-02T10:00:00.000Z');
      expect(cards[1].boardId).to.equal('b1');
    });

    it('returns [] for empty/garbage input', function() {
      expect(icsToCards('')).to.deep.equal([]);
      expect(icsToCards('garbage')).to.deep.equal([]);
    });
  });
});
