# Wekan Persistence Architecture Improvements

## Changes Implemented

This document describes the architectural improvements made to Wekan's persistence layer to ensure proper separation between board-level data and per-user UI preferences.

---

## 1. Removed Board-Level UI State (✅ COMPLETED)

### 1.1 Collapsed State Removed from Schemas

**Changes:**
- ❌ Removed `collapsed` field from Swimlanes schema ([models/swimlanes.js](models/swimlanes.js))
- ❌ Removed `collapsed` field from Lists schema ([models/lists.js](models/lists.js))
- ❌ Removed `collapse()` mutation from Swimlanes
- ❌ Removed collapsed field from REST API `PUT /api/boards/:boardId/lists/:listId`

**Rationale:**
Collapsed state is a per-user UI preference and should never be stored at the board level. This prevents conflicts where one user collapses a swimlane/list and affects all other users.

**Migration:**
- Existing board-level `collapsed` values will be ignored
- Users' personal collapse preferences are stored in `profile.collapsedSwimlanes` and `profile.collapsedLists`
- For non-logged-in users, collapse state is stored in localStorage and cookies

---

## 2. LocalStorage Validation & Cleanup (✅ COMPLETED)

### 2.1 New Validation Utility

**File:** [client/lib/localStorageValidator.js](client/lib/localStorageValidator.js)

**Features:**
- ✅ Validates all numbers (swimlane heights, list widths) are within valid ranges
- ✅ Validates all booleans (collapse states) are actual boolean values
- ✅ Removes corrupted or invalid data
- ✅ Limits stored data to prevent localStorage bloat:
  - Maximum 50 boards per key
  - Maximum 100 items per board
- ✅ Auto-cleanup on app startup (once per day)
- ✅ Validation ranges:
  - List widths: 100-1000 pixels
  - Swimlane heights: -1 (auto) or 50-2000 pixels
  - Collapsed states: boolean only

**Usage:**
```javascript
import { validateAndCleanLocalStorage, shouldRunCleanup } from '/client/lib/localStorageValidator';

// Auto-runs on startup
Meteor.startup(() => {
  if (shouldRunCleanup()) {
    validateAndCleanLocalStorage();
  }
});
```

### 2.2 Updated User Storage Methods

**File:** [models/lib/userStorageHelpers.js](models/lib/userStorageHelpers.js)

**Functions:**
- `getValidatedNumber(key, boardId, itemId, defaultValue, min, max)` - Get with validation
- `setValidatedNumber(key, boardId, itemId, value, min, max)` - Set with validation
- `getValidatedBoolean(key, boardId, itemId, defaultValue)` - Get boolean
- `setValidatedBoolean(key, boardId, itemId, value)` - Set boolean

**Validation Applied To:**
- `wekan-list-widths` - List column widths
- `wekan-list-constraints` - List max-width constraints
- `wekan-swimlane-heights` - Swimlane row heights
- `wekan-collapsed-lists` - List collapse states
- `wekan-collapsed-swimlanes` - Swimlane collapse states

---

## 3. Per-User Position History System (✅ COMPLETED)

### 3.1 New Collection: UserPositionHistory

**File:** [models/userPositionHistory.js](models/userPositionHistory.js)

**Purpose:**
Track all position changes (moves, reorders) per user with full undo/redo support.

**Schema Fields:**
- `userId` - User who made the change
- `boardId` - Board where change occurred
- `entityType` - Type: 'swimlane', 'list', 'card', 'checklist', 'checklistItem'
- `entityId` - ID of the moved entity
- `actionType` - Type: 'move', 'create', 'delete', 'restore', 'archive'
- `previousState` - Complete state before change (blackbox object)
- `newState` - Complete state after change (blackbox object)
- `previousSort`, `newSort` - Sort positions
- `previousSwimlaneId`, `newSwimlaneId` - Swimlane changes
- `previousListId`, `newListId` - List changes
- `previousBoardId`, `newBoardId` - Board changes
- `isCheckpoint` - User-marked savepoint
- `checkpointName` - Name for the savepoint
- `batchId` - Group related changes together
- `createdAt` - Timestamp

**Key Features:**
- ✅ Automatic tracking of all card movements
- ✅ Per-user isolation (users only see their own history)
- ✅ Checkpoint/savepoint system for marking important states
- ✅ Batch operations support (group related changes)
- ✅ Auto-cleanup (keeps last 1000 entries per user per board)
- ✅ Checkpoints are never deleted
- ✅ Full undo capability if entity still exists

**Helpers:**
- `getDescription()` - Human-readable change description
- `canUndo()` - Check if change can be undone
- `undo()` - Reverse the change

**Indexes:**
```javascript
{ userId: 1, boardId: 1, createdAt: -1 }
{ userId: 1, entityType: 1, entityId: 1 }
{ userId: 1, isCheckpoint: 1 }
{ batchId: 1 }
{ createdAt: 1 }
```

### 3.2 Meteor Methods for History Management

**Available Methods:**

```javascript
// Create a checkpoint/savepoint
Meteor.call('userPositionHistory.createCheckpoint', boardId, checkpointName);

// Undo a specific change
Meteor.call('userPositionHistory.undo', historyId);

// Get recent changes
Meteor.call('userPositionHistory.getRecent', boardId, limit);

// Get all checkpoints
Meteor.call('userPositionHistory.getCheckpoints', boardId);

// Restore to a checkpoint (undo all changes after it)
Meteor.call('userPositionHistory.restoreToCheckpoint', checkpointId);
```

### 3.3 Automatic Tracking Integration

**Card Moves:** [models/cards.js](models/cards.js)

The `card.move()` method now automatically tracks changes:

```javascript
// Capture previous state
const previousState = {
  boardId: this.boardId,
  swimlaneId: this.swimlaneId,
  listId: this.listId,
  sort: this.sort,
};

// After update, track in history
UserPositionHistory.trackChange({
  userId: Meteor.userId(),
  boardId: this.boardId,
  entityType: 'card',
  entityId: this._id,
  actionType: 'move',
  previousState,
  newState: { boardId, swimlaneId, listId, sort },
});
```

**TODO:** Add similar tracking for:
- List reordering
- Swimlane reordering
- Checklist/item reordering

---

## 4. SwimlaneId Validation & Rescue (✅ COMPLETED)

### 4.1 Migration: Ensure Valid Swimlane IDs

**File:** [server/migrations/ensureValidSwimlaneIds.js](server/migrations/ensureValidSwimlaneIds.js)

**Purpose:**
Ensure all cards and lists have valid swimlaneId references, rescuing orphaned data.

**Operations:**
1. **Fix Cards Without SwimlaneId**
   - Finds cards with missing/null/empty swimlaneId
   - Assigns to board's default swimlane
   - Creates default swimlane if none exists

2. **Fix Lists Without SwimlaneId**
   - Finds lists with missing swimlaneId
   - Sets to empty string (for backward compatibility)

3. **Rescue Orphaned Cards**
   - Finds cards where swimlaneId points to deleted swimlane
   - Creates "Rescued Data (Missing Swimlane)" swimlane (red color, at end)
   - Moves orphaned cards there
   - Logs activity for transparency

4. **Add Validation Hooks**
   - `Cards.before.insert` - Auto-assign default swimlaneId
   - `Cards.before.update` - Prevent swimlaneId removal
   - Ensures swimlaneId is ALWAYS saved

**Migration Tracking:**
Stored in `migrations` collection:
```javascript
{
  name: 'ensure-valid-swimlane-ids',
  version: 1,
  completedAt: Date,
  results: {
    cardsFixed: Number,
    listsFixed: Number,
    cardsRescued: Number,
  }
}
```

---

## 5. TODO: Undo/Redo UI (⏳ IN PROGRESS)

### 5.1 Planned UI Components

**Board Toolbar:**
- [ ] Undo button (with keyboard shortcut Ctrl+Z)
- [ ] Redo button (with keyboard shortcut Ctrl+Shift+Z)
- [ ] History dropdown showing recent changes
- [ ] "Create Checkpoint" button

**History Sidebar:**
- [ ] List of recent changes with descriptions
- [ ] Visual timeline
- [ ] Checkpoint markers
- [ ] "Restore to This Point" buttons
- [ ] Search/filter history

### 5.2 Keyboard Shortcuts

```javascript
// To implement in client/lib/keyboard.js
Mousetrap.bind('ctrl+z', () => {
  // Undo last change
});

Mousetrap.bind('ctrl+shift+z', () => {
  // Redo last undone change
});

Mousetrap.bind('ctrl+shift+s', () => {
  // Create checkpoint
});
```

---

## 6. TODO: Search History Feature (⏳ NOT STARTED)

### 6.1 Requirements

Per the user request:
> "For board-level data, for each field (like description, comments etc) at Search All Boards have translatable options to also search from history of boards where user is member of board"

### 6.2 Proposed Implementation

**New Collection: FieldHistory**
```javascript
{
  boardId: String,
  entityType: String, // 'card', 'list', 'swimlane', 'board'
  entityId: String,
  fieldName: String, // 'description', 'title', 'comments', etc.
  previousValue: String,
  newValue: String,
  changedBy: String, // userId
  changedAt: Date,
}
```

**Search Enhancement:**
- Add "Include History" checkbox to Search All Boards
- Search not just current field values, but also historical values
- Show results with indicator: "Found in history (changed 2 days ago)"
- Allow filtering by:
  - Current values only
  - Historical values only
  - Both current and historical

**Translatable Field Options:**
```javascript
const searchableFieldsI18n = {
  'card-title': 'search-card-titles',
  'card-description': 'search-card-descriptions',
  'card-comments': 'search-card-comments',
  'list-title': 'search-list-titles',
  'swimlane-title': 'search-swimlane-titles',
  'board-title': 'search-board-titles',
  // Add i18n keys for each searchable field
};
```

### 6.3 Storage Considerations

**Challenge:** Field history can grow very large

**Solutions:**
1. Only track fields explicitly marked for history
2. Limit history depth (e.g., last 100 changes per field)
3. Auto-delete history older than X months (configurable)
4. Option to disable per board

**Suggested Settings:**
```javascript
{
  enableFieldHistory: true,
  trackedFields: ['description', 'title', 'comments'],
  historyRetentionDays: 90,
  maxHistoryPerField: 100,
}
```

---

## 7. Data Validation Summary

### 7.1 Validation Applied

| Data Type | Storage | Validation | Range/Type |
|-----------|---------|------------|------------|
| List Width | localStorage + profile | Number | 100-1000 px |
| List Constraint | localStorage + profile | Number | 100-1000 px |
| Swimlane Height | localStorage + profile | Number | -1 (auto) or 50-2000 px |
| Collapsed Lists | localStorage + profile | Boolean | true/false |
| Collapsed Swimlanes | localStorage + profile | Boolean | true/false |
| SwimlaneId | MongoDB (cards) | String (required) | Valid ObjectId |
| SwimlaneId | MongoDB (lists) | String (optional) | Valid ObjectId or '' |

### 7.2 Auto-Cleanup Rules

**LocalStorage:**
- Corrupted data → Removed
- Invalid types → Removed
- Out-of-range values → Removed
- Excess boards (>50) → Oldest removed
- Excess items per board (>100) → Oldest removed
- Cleanup frequency → Daily (if needed)

**UserPositionHistory:**
- Keeps last 1000 entries per user per board
- Checkpoints never deleted
- Cleanup frequency → Daily
- Old entries (beyond 1000) → Deleted

---

## 8. Migration Guide

### 8.1 For Existing Installations

**Automatic Migrations:**
1. ✅ `ensureValidSwimlaneIds` - Runs automatically on server start
2. ✅ LocalStorage cleanup - Runs automatically on client start (once/day)

**Manual Actions Required:**
- None - all migrations are automatic

### 8.2 For Developers

**When Adding New Per-User Preferences:**

1. Add field to user profile schema:
```javascript
'profile.myNewPreference': {
  type: Object,
  optional: true,
  blackbox: true,
}
```

2. Add validation function:
```javascript
function validateMyNewPreference(data) {
  // Validate structure
  // Return cleaned data
}
```

3. Add localStorage support:
```javascript
getMyNewPreferenceFromStorage(boardId, itemId) {
  if (this._id) {
    return this.getMyNewPreference(boardId, itemId);
  }
  return getValidatedData('wekan-my-preference', validators.myPreference);
}
```

4. Add to cleanup routine in `localStorageValidator.js`

---

## 9. Testing Checklist

### 9.1 Manual Testing

- [ ] Collapse swimlane → Reload → Should remain collapsed (logged-in)
- [ ] Collapse list → Reload → Should remain collapsed (logged-in)
- [ ] Resize list width → Reload → Should maintain width (logged-in)
- [ ] Resize swimlane height → Reload → Should maintain height (logged-in)
- [ ] Logout → Collapse swimlane → Reload → Should remain collapsed (cookies)
- [ ] Move card → Check UserPositionHistory created
- [ ] Move card → Click undo → Card returns to original position
- [ ] Create checkpoint → Move cards → Restore to checkpoint → Cards return
- [ ] Corrupted localStorage → Should be cleaned on next startup
- [ ] Card without swimlaneId → Should be rescued to rescue swimlane

### 9.2 Automated Testing

**Unit Tests Needed:**
- [ ] `localStorageValidator.js` - All validation functions
- [ ] `userStorageHelpers.js` - Get/set functions
- [ ] `userPositionHistory.js` - Undo logic
- [ ] `ensureValidSwimlaneIds.js` - Migration logic

**Integration Tests Needed:**
- [ ] Card move triggers history entry
- [ ] Undo actually reverses move
- [ ] Checkpoint restore works correctly
- [ ] localStorage validation on startup
- [ ] Rescue migration creates rescue swimlane

---

## 10. Performance Considerations

### 10.1 Indexes Added

```javascript
// UserPositionHistory
{ userId: 1, boardId: 1, createdAt: -1 }
{ userId: 1, entityType: 1, entityId: 1 }
{ userId: 1, isCheckpoint: 1 }
{ batchId: 1 }
{ createdAt: 1 }
```

### 10.2 Query Optimization

- UserPositionHistory queries limited to 100 results max
- Auto-cleanup prevents unbounded growth
- Checkpoints indexed separately for fast retrieval

### 10.3 localStorage Limits

- Maximum 50 boards per key (prevents quota exceeded)
- Maximum 100 items per board
- Daily cleanup of excess data

---

## 11. Security Considerations

### 11.1 User Isolation

- ✅ UserPositionHistory isolated per-user (userId filter on all queries)
- ✅ Users can only undo their own changes
- ✅ Checkpoints are per-user
- ✅ History never shared between users

### 11.2 Validation

- ✅ All localStorage data validated before use
- ✅ Number ranges enforced
- ✅ Type checking on all inputs
- ✅ Invalid data rejected (not just sanitized)

### 11.3 Authorization

- ✅ Must be board member to create history entries
- ✅ Must be board member to undo changes
- ✅ Cannot undo other users' changes

---

## 12. Future Enhancements

### 12.1 Planned Features

1. **Field-Level History**
   - Track changes to card descriptions, titles, comments
   - Search across historical values
   - "What was this card's description last week?"

2. **Collaborative Undo**
   - See other users' recent changes
   - Undo with conflict resolution
   - Merge strategies for simultaneous changes

3. **Export History**
   - Export position history to CSV/JSON
   - Audit trail for compliance
   - Analytics on card movement patterns

4. **Visual Timeline**
   - Interactive timeline of board changes
   - Playback mode to see board evolution
   - Heatmap of frequently moved cards

### 12.2 Optimization Opportunities

1. **Batch Operations**
   - Group multiple card moves into single history entry
   - Reduce database writes

2. **Compression**
   - Compress old history entries
   - Store diffs instead of full states

3. **Archival**
   - Move very old history to separate collection
   - Keep last N months in hot storage

---

## Document History

- **Created**: 2025-12-23
- **Last Updated**: 2025-12-23
- **Status**: Implementation In Progress
- **Completed**: Sections 1-4
- **In Progress**: Section 5-6
- **Planned**: Section 6.1-6.3

