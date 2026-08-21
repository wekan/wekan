import { Meteor } from 'meteor/meteor';
import { tripCanary } from '/server/lib/canary';

// Organization and Team configuration is instance/tenant administration data.
// Client-side collection mutations are therefore site-admin only; scoped writes
// run through server methods that enforce their own tenant/admin contract.
//
// TenantBleed (GHSA-p4cq-83j9-7g73): Org and Team previously also allowed any
// authenticated user to mutate a document whose _id equalled their user id.
// A document id is not an authorization relationship.
export async function allowSiteAdminCollectionMutation(userId) {
  if (!userId) return false;
  const user = await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1 },
  });
  if (user?.isAdmin) return true;
  if (user) {
    tripCanary('tenant.mutate-without-admin', { userId });
  }
  return false;
}
