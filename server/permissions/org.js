import Org from '/models/org';
import { allowSiteAdminCollectionMutation } from '/server/lib/adminCollectionPermission';

Org.allow({
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
