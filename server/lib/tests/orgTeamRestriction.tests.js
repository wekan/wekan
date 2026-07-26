/* eslint-env mocha */
import { expect } from 'chai';
import { boardMemberRestriction, canAddUserToBoard } from '../orgTeamRestriction';

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

    // The restriction is one setting per kind now - Organizations and Teams each
    // carry their own checkbox, in the pane they are about.
    it('with only the Organization restriction, a shared Team is not enough', function() {
      expect(
        canAddUserToBoard({
          restrictOrgEnabled: true,
          adderOrgs: ['orgA'],
          adderTeams: ['teamShared'],
          candidateOrgs: ['orgB'],
          candidateTeams: ['teamShared'],
        }),
      ).to.equal(false);
      expect(
        canAddUserToBoard({
          restrictOrgEnabled: true,
          adderOrgs: ['orgShared'],
          adderTeams: [],
          candidateOrgs: ['orgShared'],
          candidateTeams: [],
        }),
      ).to.equal(true);
    });

    it('with only the Team restriction, a shared Organization is not enough', function() {
      expect(
        canAddUserToBoard({
          restrictTeamEnabled: true,
          adderOrgs: ['orgShared'],
          adderTeams: ['teamA'],
          candidateOrgs: ['orgShared'],
          candidateTeams: ['teamB'],
        }),
      ).to.equal(false);
      expect(
        canAddUserToBoard({
          restrictTeamEnabled: true,
          adderOrgs: [],
          adderTeams: ['teamShared'],
          candidateOrgs: [],
          candidateTeams: ['teamShared'],
        }),
      ).to.equal(true);
    });

    it('with both enabled, either a shared Org or a shared Team is enough', function() {
      const both = {
        restrictOrgEnabled: true,
        restrictTeamEnabled: true,
        adderOrgs: ['orgA'],
        adderTeams: ['teamShared'],
        candidateOrgs: ['orgB'],
        candidateTeams: ['teamShared'],
      };
      expect(canAddUserToBoard(both)).to.equal(true);
      // ...which is exactly what the single setting it replaces did.
      expect(
        canAddUserToBoard({ ...both, restrictOrgEnabled: false, restrictTeamEnabled: false,
          restrictEnabled: true }),
      ).to.equal(true);
    });

    it('neither enabled is unrestricted', function() {
      expect(
        canAddUserToBoard({
          restrictOrgEnabled: false,
          restrictTeamEnabled: false,
          adderOrgs: ['orgA'],
          adderTeams: ['teamA'],
          candidateOrgs: ['orgB'],
          candidateTeams: ['teamB'],
        }),
      ).to.equal(true);
    });
  });

  describe(boardMemberRestriction.name, function() {
    it('reads the two settings', function() {
      expect(boardMemberRestriction({ boardMembersFromSameOrgOnly: true }))
        .to.deep.equal({ org: true, team: false });
      expect(boardMemberRestriction({ boardMembersFromSameTeamOnly: true }))
        .to.deep.equal({ org: false, team: true });
    });

    it('an install still on the old single setting keeps its rule', function() {
      // Both kinds allowed, which is what "same Organization OR Team" meant - so an
      // upgrade that has not run the migration yet behaves identically.
      expect(boardMemberRestriction({ boardMembersFromSameOrgOrTeamOnly: true }))
        .to.deep.equal({ org: true, team: true });
    });

    it('no setting document, or none of the fields, is unrestricted', function() {
      expect(boardMemberRestriction(undefined)).to.deep.equal({ org: false, team: false });
      expect(boardMemberRestriction({})).to.deep.equal({ org: false, team: false });
    });
  });
});
