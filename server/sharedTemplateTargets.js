import { ReactiveCache } from '/imports/reactiveCache';
import Org from '/models/org';
import Team from '/models/team';

// #5850: drag-to-share drop targets. The org/team publications are admin-only,
// so a non-admin member cannot read the per-org/team `orgSharedTemplates` /
// `teamSharedTemplates` flag client-side. This method returns just the user's
// own orgs/teams that have the flag set (plus their email domains, which have
// no per-record flag), so boardsList.js can gate the drop targets on it.
Meteor.methods({
  async getMyShareableGroups() {
    if (!this.userId) {
      throw new Meteor.Error('not-logged-in');
    }

    const user = ReactiveCache.getUser(this.userId);
    const result = { orgs: [], teams: [], domains: [] };
    if (!user) {
      return result;
    }

    const orgIds = (user.orgs || []).map(o => o.orgId).filter(Boolean);
    const teamIds = (user.teams || []).map(t => t.teamId).filter(Boolean);

    if (orgIds.length) {
      const orgs = await Org.find(
        { _id: { $in: orgIds }, orgSharedTemplates: true },
        { fields: { orgDisplayName: 1 } },
      ).fetchAsync();
      result.orgs = orgs.map(o => ({
        type: 'org',
        id: o._id,
        name: o.orgDisplayName,
      }));
    }

    if (teamIds.length) {
      const teams = await Team.find(
        { _id: { $in: teamIds }, teamSharedTemplates: true },
        { fields: { teamDisplayName: 1 } },
      ).fetchAsync();
      result.teams = teams.map(t => ({
        type: 'team',
        id: t._id,
        name: t.teamDisplayName,
      }));
    }

    // Domains have no per-record flag; include the user's email domains.
    const domains = [];
    (user.emails || []).forEach((email) => {
      const addr = (email && email.address) || '';
      const at = addr.lastIndexOf('@');
      if (at !== -1) {
        const domain = addr.slice(at + 1).toLowerCase().trim();
        if (domain && !domains.includes(domain)) {
          domains.push(domain);
        }
      }
    });
    result.domains = domains.map(d => ({ type: 'domain', id: d, name: d }));

    return result;
  },
});
