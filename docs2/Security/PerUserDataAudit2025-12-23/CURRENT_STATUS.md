# Per-User Data Audit - Current Status Summary

**Last Updated**: 2025-12-23  
**Status**: ✅ Architecture Finalized  
**Scope**: All data persistence related to swimlanes, lists, cards, checklists, checklistItems

---

## Key Decision: Data Classification

The system now enforces clear separation:

### ✅ Per-Board Data (MongoDB Documents)
Stored in swimlane/list/card/checklist/checklistItem documents. **All users see the same value.**

| Entity | Properties | Where Stored |
|--------|-----------|-------------|
| Swimlane | title, color, height, sort, archived | swimlanes.js document |
| List | title, color, width, sort, archived, wipLimit, starred | lists.js document |
| Card | title, color, description, swimlaneId, listId, sort, archived | cards.js document |
| Checklist | title, sort, hideCheckedItems, hideAllItems | checklists.js document |
| ChecklistItem | title, sort, isFinished | checklistItems.js document |

### 🔒 Per-User Data (User Profile + Cookies)
Stored in user.profile or cookies. **Each user has their own value, not visible to others.**

| Entity | Properties | Where Stored |
|--------|-----------|-------------|
| User | collapsedSwimlanes | user.profile.collapsedSwimlanes[boardId][swimlaneId] |
| User | collapsedLists | user.profile.collapsedLists[boardId][listId] |
| User | hideMiniCardLabelText | user.profile.hideMiniCardLabelText[boardId] |
| Public User | collapsedSwimlanes | Cookie: wekan-collapsed-swimlanes |
| Public User | collapsedLists | Cookie: wekan-collapsed-lists |

---

## Changes Implemented ✅

### 1. Schema Changes (swimlanes.js, lists.js) ✅ DONE

**Swimlanes**: Added `height` field
```javascript
height: {
  type: Number,
  optional: true,
  defaultValue: -1,  // -1 = auto-height, 50-2000 = fixed
  custom() {
    const h = this.value;
    if (h !== -1 && (h < 50 || h > 2000)) {
      return 'heightOutOfRange';
    }
  },
}
```

**Lists**: Added `width` field
```javascript
width: {
  type: Number,
  optional: true,
  defaultValue: 272,  // 100-1000 pixels
  custom() {
    const w = this.value;
    if (w < 100 || w > 1000) {
      return 'widthOutOfRange';
    }
  },
}
```

**Status**: ✅ Implemented in swimlanes.js and lists.js

### 2. Card Position Storage (cards.js) ✅ ALREADY CORRECT

Cards already store position per-board:
- `sort` field: decimal number determining order (shared)
- `swimlaneId`: which swimlane (shared)
- `listId`: which list (shared)

**Status**: ✅ No changes needed

### 3. Checklist Position Storage (checklists.js) ✅ ALREADY CORRECT

Checklists already store position per-board:
- `sort` field: decimal number determining order (shared)
- `hideCheckedChecklistItems`: per-board setting
- `hideAllChecklistItems`: per-board setting

**Status**: ✅ No changes needed

### 4. ChecklistItem Position Storage (checklistItems.js) ✅ ALREADY CORRECT

ChecklistItems already store position per-board:
- `sort` field: decimal number determining order (shared)

**Status**: ✅ No changes needed

---

## Changes Not Yet Implemented

### 1. User Model Refactoring (users.js) ⏳ TODO

**Current State**: Users.js still has per-user width/height methods that read from user.profile:
- `getListWidth(boardId, listId)` - reads user.profile.listWidths
- `getSwimlaneHeight(boardId, swimlaneId)` - reads user.profile.swimlaneHeights
- `setListWidth(boardId, listId, width)` - writes to user.profile.listWidths
- `setSwimlaneHeight(boardId, swimlaneId, height)` - writes to user.profile.swimlaneHeights

**Required Change**: 
- Remove per-user width/height storage from user.profile
- Refactor methods to read from list/swimlane documents instead
- Remove from user schema definition

**Status**: ⏳ Pending - See IMPLEMENTATION_GUIDE.md for details

### 2. Migration Script ⏳ TODO

**Current State**: No migration exists to move existing per-user data to per-board

**Required**: 
- Create `server/migrations/migrateToPerBoardStorage.js`
- Migrate user.profile.swimlaneHeights → swimlane.height
- Migrate user.profile.listWidths → list.width
- Remove old fields from user profiles
- Track migration status

**Status**: ⏳ Pending - Template available in IMPLEMENTATION_GUIDE.md

---

## Data Examples

### Before (Mixed Per-User/Per-Board - WRONG)
```javascript
// Swimlane document (per-board)
{
  _id: 'swim123',
  title: 'Development',
  boardId: 'board123',
  // height stored in user profile (per-user) - WRONG!
}

// User A profile (per-user)
{
  _id: 'userA',
  profile: {
    swimlaneHeights: {
      'board123': {
        'swim123': 300  // Only User A sees 300px height
      }
    }
  }
}

// User B profile (per-user)
{
  _id: 'userB',
  profile: {
    swimlaneHeights: {
      'board123': {
        'swim123': 400  // Only User B sees 400px height
      }
    }
  }
}
```

### After (Correct Per-Board/Per-User Separation)
```javascript
// Swimlane document (per-board - ALL USERS SEE THIS)
{
  _id: 'swim123',
  title: 'Development',
  boardId: 'board123',
  height: 300  // All users see 300px height
}

// User A profile (per-user - only User A's preferences)
{
  _id: 'userA',
  profile: {
    collapsedSwimlanes: {
      'board123': {
        'swim123': false  // User A: swimlane not collapsed
      }
    },
    collapsedLists: { ... },
    hideMiniCardLabelText: { ... }
    // height and width REMOVED - now in documents
  }
}

// User B profile (per-user - only User B's preferences)
{
  _id: 'userB',
  profile: {
    collapsedSwimlanes: {
      'board123': {
        'swim123': true  // User B: swimlane is collapsed
      }
    },
    collapsedLists: { ... },
    hideMiniCardLabelText: { ... }
    // height and width REMOVED - now in documents
  }
}
```

---

## Testing Evidence Required

### Before Starting UI Integration

1. **Schema Validation**
   - [ ] Swimlane with height = -1 → accepts
   - [ ] Swimlane with height = 100 → accepts
   - [ ] Swimlane with height = 25 → rejects (< 50)
   - [ ] Swimlane with height = 3000 → rejects (> 2000)

2. **Data Retrieval**
   - [ ] `Swimlanes.findOne('swim123').height` returns correct value
   - [ ] `Lists.findOne('list456').width` returns correct value
   - [ ] Default values used when not set

3. **Data Updates**
   - [ ] `Swimlanes.update('swim123', { $set: { height: 500 } })` succeeds
   - [ ] `Lists.update('list456', { $set: { width: 400 } })` succeeds

4. **Per-User Isolation**
   - [ ] User A collapses swimlane → User B's collapse status unchanged
   - [ ] User A hides labels → User B's visibility unchanged

---

## Integration Path

### Phase 1: ✅ Schema Definition (DONE)
- Added `height` to Swimlanes
- Added `width` to Lists
- Both with validation (custom functions)

### Phase 2: ⏳ User Model Refactoring (NEXT)
- Update user methods to read from documents
- Remove per-user storage from user.profile
- Create migration script

### Phase 3: ⏳ UI Integration (AFTER Phase 2)
- Update client code to use new storage locations
- Update Meteor methods to update documents
- Update subscriptions if needed

### Phase 4: ⏳ Testing & Deployment (FINAL)
- Run automated tests
- Manual testing with multiple users
- Deploy with data migration

---

## Backward Compatibility

### For Existing Installations
- Old `user.profile.swimlaneHeights` data will be preserved until migration
- Old `user.profile.listWidths` data will be preserved until migration
- New code can read from either location during transition
- Migration script handles moving data safely

### For New Installations
- Only per-board storage will be used
- User.profile will only contain per-user settings
- No legacy data to migrate

---

## File Reference

| Document | Purpose |
|----------|---------|
| [DATA_PERSISTENCE_ARCHITECTURE.md](DATA_PERSISTENCE_ARCHITECTURE.md) | Complete architecture specification |
| [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) | Step-by-step implementation instructions |
| [models/swimlanes.js](../../../models/swimlanes.js) | Swimlane model with new height field |
| [models/lists.js](../../../models/lists.js) | List model with new width field |

---

## Quick Reference: What Changed?

### New Behavior
- **Swimlane Height**: Now stored in swimlane document (per-board)
- **List Width**: Now stored in list document (per-board)
- **Card Positions**: Always been in card document (per-board) ✅
- **Collapse States**: Remain in user.profile (per-user) ✅
- **Label Visibility**: Remains in user.profile (per-user) ✅

### Old Behavior (Being Removed)
- ❌ Swimlane Height: Was in user.profile (per-user)
- ❌ List Width: Was in user.profile (per-user)

### No Change (Already Correct)
- ✅ Card Positions: In card document (per-board)
- ✅ Checklist Positions: In checklist document (per-board)
- ✅ Collapse States: In user.profile (per-user)

---

## Success Criteria

After all phases complete:

1. ✅ All swimlane heights stored in swimlane documents
2. ✅ All list widths stored in list documents
3. ✅ All positions stored in swimlane/list/card/checklist/checklistItem documents
4. ✅ Only collapse states and label visibility in user profiles
5. ✅ No duplicate storage of widths/heights
6. ✅ All users see same dimensions for swimlanes/lists
7. ✅ Each user has independent collapse preferences
8. ✅ Data validates against range constraints

---

**Status**: ✅ Phase 1 Complete, Awaiting Phase 2

