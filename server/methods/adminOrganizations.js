import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import {
  deleteOrganizationForAdmin,
  setBoardMembersSameOrgForAdmin,
} from '/server/lib/adminOrganizations';

Meteor.methods({
  async setBoardMembersSameOrg(value) {
    check(value, Boolean);
    return setBoardMembersSameOrgForAdmin(this.userId, value);
  },
  async deleteOrganization(orgId) {
    check(orgId, String);
    return deleteOrganizationForAdmin(this.userId, orgId);
  },
});
