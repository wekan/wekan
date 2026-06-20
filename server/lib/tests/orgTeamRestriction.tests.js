/* eslint-env mocha */
import { expect } from 'chai';
import { canAddUserToBoard } from '../orgTeamRestriction';

describe('orgTeamRestriction (#6116)', function() {
  describe(canAddUserToBoard.name, function() {
    it('allows when the restriction is disabled, even with no overlap', function() {
      expect(
        canAddUserToBoard({
          restrictEnabled: false,
          adderOrgs: ['orgA'],
          adderTeams: ['teamA'],
          candidateOrgs: ['orgB'],
          candidateTeams: ['teamB'],
        }),
      ).to.equal(true);
    });

    it('allows when disabled even with all-empty arrays', function() {
      expect(
        canAddUserToBoard({
          restrictEnabled: false,
          adderOrgs: [],
          adderTeams: [],
          candidateOrgs: [],
          candidateTeams: [],
        }),
      ).to.equal(true);
    });

    it('allows when enabled and a shared Organization exists', function() {
      expect(
        canAddUserToBoard({
          restrictEnabled: true,
          adderOrgs: ['orgX', 'orgShared'],
          adderTeams: ['teamA'],
          candidateOrgs: ['orgShared'],
          candidateTeams: ['teamB'],
        }),
      ).to.equal(true);
    });

    it('allows when enabled and a shared Team exists', function() {
      expect(
        canAddUserToBoard({
          restrictEnabled: true,
          adderOrgs: ['orgX'],
          adderTeams: ['teamShared', 'teamA'],
          candidateOrgs: ['orgY'],
          candidateTeams: ['teamShared'],
        }),
      ).to.equal(true);
    });

    it('denies when enabled and there is no Org or Team overlap', function() {
      expect(
        canAddUserToBoard({
          restrictEnabled: true,
          adderOrgs: ['orgA'],
          adderTeams: ['teamA'],
          candidateOrgs: ['orgB'],
          candidateTeams: ['teamB'],
        }),
      ).to.equal(false);
    });

    it('denies when enabled and arrays are empty', function() {
      expect(
        canAddUserToBoard({
          restrictEnabled: true,
          adderOrgs: [],
          adderTeams: [],
          candidateOrgs: [],
          candidateTeams: [],
        }),
      ).to.equal(false);
    });

    it('denies when enabled and the candidate has no orgs/teams', function() {
      expect(
        canAddUserToBoard({
          restrictEnabled: true,
          adderOrgs: ['orgA'],
          adderTeams: ['teamA'],
          candidateOrgs: [],
          candidateTeams: [],
        }),
      ).to.equal(false);
    });

    it('treats null/undefined arrays as empty (denies when enabled)', function() {
      expect(
        canAddUserToBoard({
          restrictEnabled: true,
          adderOrgs: undefined,
          adderTeams: null,
          candidateOrgs: undefined,
          candidateTeams: null,
        }),
      ).to.equal(false);
    });

    it('allows with null arrays when restriction is disabled', function() {
      expect(
        canAddUserToBoard({
          restrictEnabled: false,
        }),
      ).to.equal(true);
    });
  });
});
