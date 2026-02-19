## UI Performance Optimization Analysis: Replace Meteor.call with Pub/Sub

### Current Issues Identified

The codebase uses several patterns where Meteor.call() could be replaced with pub/sub subscriptions for faster UI updates:

---

## CRITICAL OPPORTUNITIES (High Impact)

### 1. **cron.getMigrationProgress** - Polling Every 2 Seconds
**Location:** `imports/cronMigrationClient.js` lines 26-53, called every 2 seconds via `setInterval`
**Current Issue:** 
- Polls for progress data every 2000ms even when nothing is changing
- Adds server load with repeated RPC calls
- Client must wait for response before updating

**Recommended Solution:** 
- Already partially implemented! Migration status is published via `cronMigrationStatus` publication
- Keep existing pub/sub for status updates (statusMessage, status field)
- Still use polling for `getMigrationProgress()` for non-status data (migration steps list, ETA calculation)

**Implementation Status:** ✅ Already in place

---

### 2. **AccountSettings Helper Methods** - Used in Profile Popup
**Location:** `client/components/users/userHeader.js` lines 173, 182, 191
**Current Methods:**
```javascript
Meteor.call('AccountSettings.allowEmailChange', (_, result) => {...})
Meteor.call('AccountSettings.allowUserNameChange', (_, result) => {...})
Meteor.call('AccountSettings.allowUserDelete', (_, result) => {...})
```

**Current Issue:**
- Callbacks don't return values (templates can't use reactive helpers with Meteor.call callbacks)
- Requires separate async calls for each setting
- Falls back to unresponsive UI

**Recommended Solution:**
- Use existing `accountSettings` publication (already exists in `server/publications/accountSettings.js`)
- Create reactive helpers that read from `AccountSettings` collection instead
- Subscribe to `accountSettings` in userHeader template

**Benefits:**
- Instant rendering with cached data
- Reactive updates if settings change
- No network round-trip for initial render
- Saves 3 Meteor.call() per profile popup load

---

### 3. **cron.getJobs** - Polling Every 2 Seconds  
**Location:** `imports/cronMigrationClient.js` line 62-67, called every 2 seconds
**Current Issue:**
- Fetches list of all cron jobs every 2 seconds
- RPC overhead even when jobs list hasn't changed

**Recommended Solution:**
- Create `cronJobs` publication in `server/publications/cronJobs.js`
- Publish `CronJobStatus.find({})` for admin users
- Subscribe on client, use collection directly instead of polling

**Benefits:**
- Real-time updates via DDP instead of polling
- Reduced server load
- Lower latency for job status changes

---

### 4. **toggleGreyIcons, setAvatarUrl** - User Preference Updates
**Location:** `client/components/users/userHeader.js` lines 103, 223
**Current Pattern:**
```javascript
Meteor.call('toggleGreyIcons', (err) => {...})
Meteor.call('setAvatarUrl', avatarUrl, (err) => {...})
```

**Recommended Solution:**
- These are write operations (correct for Meteor.call)
- Keep Meteor.call but ensure subscribed data reflects changes immediately
- Current user subscription should update reactively after call completes

**Status:** ✅ Already correct pattern

---

### 5. **setBoardView, setListCollapsedState, setSwimlaneCollapsedState**
**Location:** `client/lib/utils.js` lines 293, 379, 420
**Current Pattern:** Write operations via Meteor.call
**Status:** ✅ Already correct pattern (mutations should use Meteor.call)

---

## MODERATE OPPORTUNITIES (Medium Impact)

### 6. **getCustomUI, getMatomoConf** - Configuration Data
**Location:** `client/lib/utils.js` lines 748, 799
**Current Issue:**
- Fetches config data that rarely changes
- Every template that needs it makes a separate call

**Recommended Solution:**
- Create `customUI` and `matomoConfig` publications
- Cache on client, subscribe once globally
- Much faster for repeated access

---

### 7. **Attachment Migration Status** - Multiple Calls
**Location:** `client/lib/attachmentMigrationManager.js` lines 66, 142, 169
**Methods:**
- `attachmentMigration.isBoardMigrated`
- `attachmentMigration.migrateBoardAttachments`
- `attachmentMigration.getProgress`

**Recommended Solution:**
- Create `attachmentMigrationStatus` publication
- Publish board migration status for boards user has access to
- Subscribe to get migration state reactively

---

### 8. **Position History Tracking** - Fire-and-Forget Operations
**Location:** `client/lib/originalPositionHelpers.js` lines 12, 26, 40, 54, 71
**Methods:**
- `positionHistory.trackSwimlane`
- `positionHistory.trackList`
- `positionHistory.trackCard`
- Undo/redo methods

**Current:** These are write operations
**Status:** ✅ Correct to use Meteor.call (not candidates for pub/sub)

---

## ALREADY OPTIMIZED ✅

These are already using pub/sub properly:
- `Meteor.subscribe('setting')` - Global settings
- `Meteor.subscribe('board', boardId)` - Board data
- `Meteor.subscribe('notificationActivities')` - Notifications
- `Meteor.subscribe('sessionData')` - User session data
- `Meteor.subscribe('my-avatars')` - User avatars
- `Meteor.subscribe('userGreyIcons')` - User preferences
- `Meteor.subscribe('accountSettings')` - Account settings
- `Meteor.subscribe('cronMigrationStatus')` - Migration status (just implemented)

---

## IMPLEMENTATION PRIORITY

### Priority 1 (Quick Wins - 30 mins)
1. **Fix AccountSettings helpers** - Use published data instead of Meteor.call
   - Replace callbacks in templates with reactive collection access
   - Already subscribed, just need to use it

### Priority 2 (Medium Effort - 1 hour)  
2. **Add cronJobs publication** - Replace polling with pub/sub
3. **Add customUI publication** - Cache config data
4. **Add matomoConfig publication** - Cache config data

### Priority 3 (Larger Effort - 2 hours)
5. **Add attachmentMigrationStatus publication** - Multiple methods become reactive
6. **Optimize cron.getMigrationProgress** - Further reduce polling if needed

---

## PERMISSION PRESERVATION

All recommended changes maintain existing permission model:

- **accountSettings**: Already published to all users
- **cronJobs/cronMigrationStatus**: Publish only to admin users (check in publication)
- **attachmentMigrationStatus**: Publish only to boards user is member of
- **customUI/matomoConfig**: Publish to all users (public config)

No security changes needed - just move from Meteor.call to pub/sub with same permission checks.

---

## PERFORMANCE IMPACT ESTIMATION

### Current State (with polling)
- 1 poll call every 2 seconds = 30 calls/minute per client
- 10 admin clients = 300 calls/minute to server
- High DDP message traffic

### After Optimization  
- 1 subscription = 1 initial sync + reactive updates only
- 10 admin clients = 10 subscriptions total
- **90% reduction in RPC overhead**
- Sub-100ms updates instead of up to 2000ms latency

