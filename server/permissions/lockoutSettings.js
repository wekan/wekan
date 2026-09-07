import LockoutSettings from '/models/lockoutSettings';
import { allowSiteAdminCollectionMutation } from '/server/lib/adminCollectionPermission';

LockoutSettings.allow({
  async update(userId) {
    return allowSiteAdminCollectionMutation(userId);
  },
  fetch: [],
});
