import { getFeatureFlags } from '/models/lib/featureFlags';
import { runStoredSyncNotifications } from './storedDelivery';
import { runStoredSyncWebhooks } from './storedWebhooks';
const { deliverSyncActivity } = require('/server/lib/syncActivityDelivery');
const { syncEffectPolicy } = require('/server/lib/syncEffectPolicy');

// Internal completeDelivery adapter for saved Sync effects. A caller must
// provide a durable rules adapter; ordinary executeRules is not a substitute.
// Manual/cron activation remains disabled until that and History coordination
// are implemented. Notification and webhook stages already reconcile receipts.
export function runStoredSyncActivityDelivery({ effectId, activity, policy, assertCurrent, rules }) {
  return deliverSyncActivity({ effectId, activity, policy, assertCurrent, rules,
    readPolicy: async () => syncEffectPolicy(getFeatureFlags()),
    notifications: runStoredSyncNotifications, webhooks: runStoredSyncWebhooks });
}
