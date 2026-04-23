# Wekan Persistence Improvements - Quick Reference

## What Was Changed?

### ❌ Removed
- Board-level `collapsed` field from Swimlanes
- Board-level `collapsed` field from Lists
- REST API endpoint for updating list `collapsed` status
- `collapse()` mutation from Swimlanes

### ✅ Added
- Per-user position history with undo/redo
- LocalStorage validation and cleanup
- SwimlaneId validation migration
- Checkpoint/savepoint system for position history
- Enhanced data validation for all UI preferences

---

## How It Works

### Per-User Settings (Your Preferences)
These are NOW per-user and persisted:
- ✅ Swimlane collapse state
- ✅ List collapse state
- ✅ List width
- ✅ Swimlane height

**Where it's stored:**
- Logged-in users: `user.profile`
- Non-logged-in users: Browser localStorage
- Validated & cleaned automatically

### Position History (Card Movements)
Every time you move a card:
- Automatically tracked in `userPositionHistory` collection
- Stored with previous and new position
- Can be undone with `Meteor.call('userPositionHistory.undo', historyId)`
- Checkpoints can be created with `Meteor.call('userPositionHistory.createCheckpoint', boardId, name)`

### Data Validation
All UI preference data is validated:
- List widths: 100-1000 pixels
- Swimlane heights: -1 (auto) or 50-2000 pixels
- Corrupted data: automatically removed
- Invalid data: rejected on write

---

## For Users

### What Changed?
- Your collapse preferences are now **private to you** (not shared with others)
- They persist across page reloads
- They work even if not logged in (saved in browser)
- Invalid data is automatically cleaned up

### What You Can Do (Coming Soon)
- Undo/redo card movements
- Create savepoints of board state
- Restore to previous savepoints
- Use Ctrl+Z to undo

---

## For Developers

### New Collections

**UserPositionHistory**
```javascript
{
  userId: String,
  boardId: String,
  entityType: 'card' | 'list' | 'swimlane' | 'checklist' | 'checklistItem',
  entityId: String,
  actionType: 'move' | 'create' | 'delete',
  previousState: Object,
  newState: Object,
  isCheckpoint: Boolean,
  checkpointName: String,
  createdAt: Date
}
```

### New Meteor Methods

```javascript
// Create a checkpoint
Meteor.call('userPositionHistory.createCheckpoint', boardId, 'name');

// Undo a change
Meteor.call('userPositionHistory.undo', historyId);

// Get recent history
Meteor.call('userPositionHistory.getRecent', boardId, 50, (err, result) => {
  // result is array of history entries
});

// Get checkpoints
Meteor.call('userPositionHistory.getCheckpoints', boardId, (err, checkpoints) => {
  // result is array of checkpoints
});

// Restore to checkpoint
Meteor.call('userPositionHistory.restoreToCheckpoint', checkpointId);
```

### Updated Models

**cards.js**
- `move()` now automatically tracks changes
- Uses `UserPositionHistory.trackChange()`

**swimlanes.js**
- `collapsed` field removed (use profile.collapsedSwimlanes)
- `collapse()` mutation removed

**lists.js**
- `collapsed` field removed (use profile.collapsedLists)
- Removed from REST API

**users.js**
- Enhanced `getListWidthFromStorage()` with validation
- Enhanced `setSwimlaneHeightToStorage()` with validation
- Added automatic cleanup of invalid data

### New Files

```
client/lib/localStorageValidator.js
  - validateAndCleanLocalStorage()
  - shouldRunCleanup()
  - getValidatedLocalStorageData()
  - setValidatedLocalStorageData()
  - validators object with all validation functions

models/lib/userStorageHelpers.js
  - getValidatedNumber()
  - setValidatedNumber()
  - getValidatedBoolean()
  - setValidatedBoolean()

models/userPositionHistory.js
  - UserPositionHistory collection
  - Helpers: getDescription(), canUndo(), undo()
  - Meteor methods for interaction

server/migrations/ensureValidSwimlaneIds.js
  - Runs automatically on startup
  - Fixes cards/lists without swimlaneId
  - Rescues orphaned data
```

---

## Migration Details

### Automatic Migration: ensureValidSwimlaneIds

Runs on server startup:

1. **Finds cards without swimlaneId**
   - Assigns them to default swimlane

2. **Finds orphaned cards**
   - SwimlaneId points to deleted swimlane
   - Moves them to "Rescued Data" swimlane

3. **Adds validation hooks**
   - Prevents swimlaneId removal
   - Auto-assigns on card creation

**Tracking:**
```javascript
Migrations.findOne({ name: 'ensure-valid-swimlane-ids' })
// Shows results of migration
```

---

## Data Examples

### Before (Broken)
```javascript
// Swimlane with board-level collapse
{
  _id: 'swim123',
  title: 'Development',
  collapsed: true  // ❌ Shared with all users!
}

// Card without swimlaneId
{
  _id: 'card456',
  title: 'Fix bug',
  swimlaneId: undefined  // ❌ No swimlane!
}
```

### After (Fixed)
```javascript
// Swimlane - no collapsed field
{
  _id: 'swim123',
  title: 'Development',
  // collapsed: removed ✅
}

// User's profile - has per-user settings
{
  _id: 'user789',
  profile: {
    collapsedSwimlanes: {
      'board123': {
        'swim123': true  // ✅ Per-user!
      }
    },
    listWidths: {
      'board123': {
        'list456': 300  // ✅ Per-user!
      }
    }
  }
}

// Card with swimlaneId
{
  _id: 'card456',
  title: 'Fix bug',
  swimlaneId: 'swim123'  // ✅ Always set!
}

// Position history entry
{
  _id: 'hist789',
  userId: 'user789',
  boardId: 'board123',
  entityType: 'card',
  entityId: 'card456',
  actionType: 'move',
  previousState: { swimlaneId: 'swim123', listId: 'list456', sort: 1 },
  newState: { swimlaneId: 'swim123', listId: 'list789', sort: 2 },
  createdAt: ISODate('2025-12-23T07:00:00Z')
}
```

---

## Troubleshooting

### Q: My collapse state isn't persisting
**A:** Make sure you're using the new per-user settings methods:
```javascript
user.setCollapsedSwimlane(boardId, swimlaneId, true);
user.getCollapsedSwimlaneFromStorage(boardId, swimlaneId);
```

### Q: I see "Rescued Data" swimlane with orphaned cards
**A:** Migration found cards pointing to deleted swimlanes. They're safe in the rescue swimlane. You can move them to proper swimlanes.

### Q: localStorage is being cleared
**A:** That's intentional - we only keep valid data. Invalid/corrupted data is removed automatically during daily cleanup.

### Q: How do I create a checkpoint?
**A:** Use the Meteor method:
```javascript
Meteor.call('userPositionHistory.createCheckpoint', boardId, 'Before big changes');
```

### Q: How do I undo a card move?
**A:** Use the Meteor method:
```javascript
Meteor.call('userPositionHistory.undo', historyEntryId);
```

---

## Performance Notes

### Storage
- localStorage: Max 50 boards, max 100 items per board
- UserPositionHistory: Max 1000 entries per user per board
- Auto-cleanup: Runs daily

### Queries
- Limited to 100 results per query
- Indexed by userId, boardId, createdAt
- Fast checkpoint retrieval

### Validation
- Runs on startup (once per day)
- Only validates if needed
- Removes excess data automatically

---

## What's Next?

### Coming Soon
- [ ] Undo/redo buttons in UI
- [ ] History sidebar
- [ ] Keyboard shortcuts (Ctrl+Z)
- [ ] Checkpoint UI

### Future
- [ ] Field-level history (description, comments)
- [ ] Search across historical values
- [ ] Visual timeline
- [ ] Collaborative undo

---

## Files to Know

| File | Purpose |
|------|---------|
| [models/userPositionHistory.js](models/userPositionHistory.js) | Position history collection |
| [client/lib/localStorageValidator.js](client/lib/localStorageValidator.js) | Data validation |
| [server/migrations/ensureValidSwimlaneIds.js](server/migrations/ensureValidSwimlaneIds.js) | Automatic migration |
| [models/swimlanes.js](models/swimlanes.js) | Swimlane model |
| [models/lists.js](models/lists.js) | List model |
| [models/cards.js](models/cards.js) | Card model with tracking |

---

## Questions?

See detailed documentation:
- [ARCHITECTURE_IMPROVEMENTS.md](ARCHITECTURE_IMPROVEMENTS.md) - Complete guide
- [PERSISTENCE_AUDIT.md](PERSISTENCE_AUDIT.md) - System audit
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Implementation details
- [FIXES_CHECKLIST.md](FIXES_CHECKLIST.md) - What was fixed

---

**Status**: ✅ Ready for use  
**Last Updated**: 2025-12-23

