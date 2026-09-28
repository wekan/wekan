import { getFeatureFlags } from '/models/lib/featureFlags';
import { runStoredSyncNotifications } from './storedDelivery';
import { runStoredSyncWebhooks } from './storedWebhooks';
import { runStoredSyncRules } from './storedRulePlans';
const { deliverSyncActivity } = require('/server/lib/syncActivityDelivery');
const { syncEffectPolicy } = require('/server/lib/syncEffectPolicy');

// Internal completeDelivery adapter for saved Sync effects. The default rules
// stage supports durable email and saved no-op selections. Unsupported pending
// actions fail preflight; ordinary executeRules is never used as a fallback.
// Manual/cron activation still requires other actions and History coordination.
export function runStoredSyncActivityDelivery({ effectId, activity, policy, assertCurrent, rules = runStoredSyncRules }) {
  return deliverSyncActivity({ effectId, activity, policy, assertCurrent, rules,
    readPolicy: async () => syncEffectPolicy(getFeatureFlags()),
    notifications: runStoredSyncNotifications, webhooks: runStoredSyncWebhooks });
}
