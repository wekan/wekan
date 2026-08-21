import Team from '/models/team';
import { allowSiteAdminCollectionMutation } from '/server/lib/adminCollectionPermission';

Team.allow({
  async insert(userId) {
    return allowSiteAdminCollectionMutation(userId);
  },
  async update(userId) {
    return allowSiteAdminCollectionMutation(userId);
  },
  async remove(userId) {
    return allowSiteAdminCollectionMutation(userId);
  },
  fetch: [],
});
