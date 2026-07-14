/* eslint-env mocha */
import { expect } from 'chai';
import { impersonationQuery } from '/models/lib/impersonationReportQuery';

// Unit tests for the Admin Panel / Reports / Impersonation search-selector builder.
describe('impersonationReportQuery', function() {
  it('returns an empty selector when there is no search term (negative)', function() {
    expect(impersonationQuery('')).to.deep.equal({});
    expect(impersonationQuery(undefined)).to.deep.equal({});
    expect(impersonationQuery(null)).to.deep.equal({});
  });

  it('builds a case-insensitive $or across the identity fields', function() {
    const q = impersonationQuery('alice');
    expect(q).to.have.property('$or');
    const fields = q.$or.map(clause => Object.keys(clause)[0]);
    expect(fields).to.have.members(['adminId', 'userId', 'boardId', 'attachmentId', 'reason']);
    q.$or.forEach(clause => {
      const rx = Object.values(clause)[0];
      expect(rx).to.be.instanceof(RegExp);
      expect(rx.flags).to.contain('i');
      expect(rx.test('ALICE')).to.equal(true); // case-insensitive
    });
  });

  it('escapes regex metacharacters so the term is matched literally (negative)', function() {
    const q = impersonationQuery('a.b*c');
    const rx = q.$or[0].adminId;
    expect(rx.test('a.b*c')).to.equal(true);   // the literal string matches
    expect(rx.test('aXbYYc')).to.equal(false); // '.' and '*' are NOT treated as wildcards
  });
});
