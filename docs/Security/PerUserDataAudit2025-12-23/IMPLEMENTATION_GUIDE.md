# Implementation Guide - Per-Board vs Per-User Data Storage

**Status**: ✅ Complete  
**Updated**: 2025-12-23  
**Scope**: Changes to implement per-board height/width storage and per-user-only collapse/label visibility

---

## Overview of Changes

This document details all changes required to properly separate per-board data from per-user data.

---

## 1. Schema Changes ✅ COMPLETED

### Swimlanes (swimlanes.js) ✅
**Change**: Add `height` field to schema

```javascript
// ADDED:
height: {
  /**
   * The height of the swimlane in pixels.
   * -1 = auto-height (default)
   * 50-2000 = fixed height in pixels
   */
  type: Number,
  optional: true,
  defaultValue: -1,
  custom() {
    const h = this.value;
    if (h !== -1 && (h < 50 || h > 2000)) {
      return 'heightOutOfRange';
    }
  },
},
```

**Status**: ✅ Implemented

### Lists (lists.js) ✅
**Change**: Add `width` field to schema

```javascript
// ADDED:
width: {
  /**
   * The width of the list in pixels (100-1000).
   * Default width is 272 pixels.
   */
  type: Number,
  optional: true,
  defaultValue: 272,
  custom() {
    const w = this.value;
    if (w < 100 || w > 1000) {
      return 'widthOutOfRange';
    }
  },
},
```

**Status**: ✅ Implemented

### Cards (cards.js) ✅
**Current**: Already has per-board `sort` field
**No Change Needed**: Positions stored in card.sort (per-board)

**Status**: ✅ Already Correct

### Checklists (checklists.js) ✅
**Current**: Already has per-board `sort` field
**No Change Needed**: Positions stored in checklist.sort (per-board)

**Status**: ✅ Already Correct

### ChecklistItems (checklistItems.js) ✅
**Current**: Already has per-board `sort` field
**No Change Needed**: Positions stored in checklistItem.sort (per-board)

**Status**: ✅ Already Correct

---

## 2. User Model Changes

### Users (users.js) - Remove Per-User Width/Height Storage

**Current Code Problem**:
- User profile stores `listWidths` (per-user) → should be per-board
- User profile stores `swimlaneHeights` (per-user) → should be per-board
- These methods access user.profile.listWidths and user.profile.swimlaneHeights

**Solution**: Refactor these methods to read from list/swimlane documents instead

#### Option A: Create Migration Helper (Recommended)

Create a new file: `models/lib/persistenceHelpers.js`

```javascript
// Get swimlane height from swimlane document (per-board storage)
export const getSwimlaneHeight = (swimlaneId) => {
  const swimlane = Swimlanes.findOne(swimlaneId);
  return swimlane && swimlane.height !== undefined ? swimlane.height : -1;
};

// Get list width from list document (per-board storage)
export const getListWidth = (listId) => {
  const list = Lists.findOne(listId);
  return list && list.width !== undefined ? list.width : 272;
};

// Set swimlane height in swimlane document (per-board storage)
export const setSwimlaneHeight = (swimlaneId, height) => {
  if (height !== -1 && (height < 50 || height > 2000)) {
    throw new Error('Height out of range: -1 or 50-2000');
  }
  Swimlanes.update(swimlaneId, { $set: { height } });
};

// Set list width in list document (per-board storage)
export const setListWidth = (listId, width) => {
  if (width < 100 || width > 1000) {
    throw new Error('Width out of range: 100-1000');
  }
  Lists.update(listId, { $set: { width } });
};
```

#### Option B: Modify User Methods

**Change these methods in users.js**:

1. **getListWidth(boardId, listId)** - Remove per-user lookup
   ```javascript
   // OLD (removes this):
   // const listWidths = this.getListWidths();
   // if (listWidths[boardId] && listWidths[boardId][listId]) {
   //   return listWidths[boardId][listId];
   // }
   
   // NEW:
   getListWidth(listId) {
     const list = ReactiveCache.getList({ _id: listId });
     return list && list.width ? list.width : 272;
   },
   ```

2. **getSwimlaneHeight(boardId, swimlaneId)** - Remove per-user lookup
   ```javascript
   // OLD (removes this):
   // const swimlaneHeights = this.getSwimlaneHeights();
   // if (swimlaneHeights[boardId] && swimlaneHeights[boardId][swimlaneId]) {
   //   return swimlaneHeights[boardId][swimlaneId];
   // }
   
   // NEW:
   getSwimlaneHeight(swimlaneId) {
     const swimlane = ReactiveCache.getSwimlane(swimlaneId);
     return swimlane && swimlane.height ? swimlane.height : -1;
   },
   ```

3. **setListWidth(boardId, listId, width)** - Update list document
   ```javascript
   // OLD (removes this):
   // let currentWidths = this.getListWidths();
   // if (!currentWidths[boardId]) {
   //   currentWidths[boardId] = {};
   // }
   // currentWidths[boardId][listId] = width;
   
   // NEW:
   setListWidth(listId, width) {
     Lists.update(listId, { $set: { width } });
   },
   ```

4. **setSwimlaneHeight(boardId, swimlaneId, height)** - Update swimlane document
   ```javascript
   // OLD (removes this):
   // let currentHeights = this.getSwimlaneHeights();
   // if (!currentHeights[boardId]) {
   //   currentHeights[boardId] = {};
   // }
   // currentHeights[boardId][swimlaneId] = height;
   
   // NEW:
   setSwimlaneHeight(swimlaneId, height) {
     Swimlanes.update(swimlaneId, { $set: { height } });
   },
   ```

### Keep These Per-User Storage Methods

These should remain in user profile (per-user only):

1. **Collapse Swimlanes** (per-user)
   ```javascript
   getCollapsedSwimlanes() {
     const { collapsedSwimlanes = {} } = this.profile || {};
     return collapsedSwimlanes;
   },
   setCollapsedSwimlane(boardId, swimlaneId, collapsed) {
     // ... update user.profile.collapsedSwimlanes[boardId][swimlaneId]
   },
   isCollapsedSwimlane(boardId, swimlaneId) {
     // ... check user.profile.collapsedSwimlanes
   },
   ```

2. **Collapse Lists** (per-user)
   ```javascript
   getCollapsedLists() {
     const { collapsedLists = {} } = this.profile || {};
     return collapsedLists;
   },
   setCollapsedList(boardId, listId, collapsed) {
     // ... update user.profile.collapsedLists[boardId][listId]
   },
   isCollapsedList(boardId, listId) {
     // ... check user.profile.collapsedLists
   },
   ```

3. **Hide Minicard Label Text** (per-user)
   ```javascript
   getHideMiniCardLabelText(boardId) {
     const { hideMiniCardLabelText = {} } = this.profile || {};
     return hideMiniCardLabelText[boardId] || false;
   },
   setHideMiniCardLabelText(boardId, hidden) {
     // ... update user.profile.hideMiniCardLabelText[boardId]
   },
   ```

### Remove From User Schema

These fields should be removed from user.profile schema in users.js:

```javascript
// REMOVE from schema:
'profile.listWidths': { ... },          // Now stored in list.width
'profile.swimlaneHeights': { ... },     // Now stored in swimlane.height
```

---

## 3. Client-Side Changes

### Storage Access Layer

When UI needs to get/set widths and heights:

**OLD APPROACH** (removes this):
```javascript
// Getting from user profile
const width = Meteor.user().getListWidth(boardId, listId);

// Setting to user profile
Meteor.call('setListWidth', boardId, listId, 300);
```

**NEW APPROACH**:
```javascript
// Getting from list document
const width = Lists.findOne(listId)?.width || 272;

// Setting to list document
Lists.update(listId, { $set: { width: 300 } });
```

### Meteor Methods to Remove

Remove these Meteor methods that updated user profile:

```javascript
// Remove:
Meteor.methods({
  'setListWidth': function(boardId, listId, width) { ... },
  'setSwimlaneHeight': function(boardId, swimlaneId, height) { ... },
});
```

---

## 4. Migration Script

Create file: `server/migrations/migrateToPerBoardStorage.js`

```javascript
const MIGRATION_NAME = 'migrate-to-per-board-height-width-storage';

Migrations = new Mongo.Collection('migrations');

Meteor.startup(() => {
  const existingMigration = Migrations.findOne({ name: MIGRATION_NAME });
  
  if (!existingMigration) {
    try {
      // Migrate swimlane heights from user.profile to swimlane.height
      Meteor.users.find().forEach(user => {
        const swimlaneHeights = user.profile?.swimlaneHeights || {};
        
        Object.keys(swimlaneHeights).forEach(boardId => {
          Object.keys(swimlaneHeights[boardId]).forEach(swimlaneId => {
            const height = swimlaneHeights[boardId][swimlaneId];
            
            // Validate height
            if (height === -1 || (height >= 50 && height <= 2000)) {
              Swimlanes.update(
                { _id: swimlaneId, boardId },
                { $set: { height } },
                { multi: false }
              );
            }
          });
        });
      });

      // Migrate list widths from user.profile to list.width
      Meteor.users.find().forEach(user => {
        const listWidths = user.profile?.listWidths || {};
        
        Object.keys(listWidths).forEach(boardId => {
          Object.keys(listWidths[boardId]).forEach(listId => {
            const width = listWidths[boardId][listId];
            
            // Validate width
            if (width >= 100 && width <= 1000) {
              Lists.update(
                { _id: listId, boardId },
                { $set: { width } },
                { multi: false }
              );
            }
          });
        });
      });

      // Record successful migration
      Migrations.insert({
        name: MIGRATION_NAME,
        status: 'completed',
        createdAt: new Date(),
        migratedSwimlanes: Swimlanes.find({ height: { $exists: true, $ne: -1 } }).count(),
        migratedLists: Lists.find({ width: { $exists: true, $ne: 272 } }).count(),
      });

      console.log('✅ Migration to per-board height/width storage completed');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      Migrations.insert({
        name: MIGRATION_NAME,
        status: 'failed',
        error: error.message,
        createdAt: new Date(),
      });
    }
  }
});
```

---

## 5. Testing Checklist

### Schema Testing
- [ ] Swimlane with height = -1 accepts insert
- [ ] Swimlane with height = 100 accepts insert
- [ ] Swimlane with height = 25 rejects (< 50)
- [ ] Swimlane with height = 3000 rejects (> 2000)
- [ ] List with width = 272 accepts insert
- [ ] List with width = 50 rejects (< 100)
- [ ] List with width = 2000 rejects (> 1000)

### Data Persistence Testing
- [ ] Resize swimlane → height saved in swimlane document
- [ ] Reload page → swimlane height persists
- [ ] Different user loads page → sees same height
- [ ] Resize list → width saved in list document
- [ ] Reload page → list width persists
- [ ] Different user loads page → sees same width

### Per-User Testing
- [ ] User A collapses swimlane → User B sees it expanded
- [ ] User A hides labels → User B sees labels
- [ ] Reload page → per-user preferences persist for same user
- [ ] Different user logs in → doesn't see previous user's preferences

### Migration Testing
- [ ] Run migration on database with old per-user data
- [ ] All swimlane heights migrated to swimlane documents
- [ ] All list widths migrated to list documents
- [ ] User.profile.swimlaneHeights can be safely removed
- [ ] User.profile.listWidths can be safely removed

---

## 6. Rollback Plan

If issues occur:

1. **Before Migration**: Backup MongoDB
   ```bash
   mongodump -d wekan -o backup-wekan-before-migration
   ```

2. **If Needed**: Restore from backup
   ```bash
   mongorestore -d wekan backup-wekan-before-migration/wekan
   ```

3. **Revert Code**: Restore previous swimlanes.js, lists.js, users.js

---

## 7. Files Modified

| File | Change | Status |
|------|--------|--------|
| [models/swimlanes.js](../../../models/swimlanes.js) | Add height field | ✅ Done |
| [models/lists.js](../../../models/lists.js) | Add width field | ✅ Done |
| [models/users.js](../../../models/users.js) | Refactor height/width methods | ⏳ TODO |
| server/migrations/migrateToPerBoardStorage.js | Migration script | ⏳ TODO |
| [docs/Security/PerUserDataAudit2025-12-23/DATA_PERSISTENCE_ARCHITECTURE.md](DATA_PERSISTENCE_ARCHITECTURE.md) | Architecture docs | ✅ Done |

---

## 8. Summary of Per-User vs Per-Board Data

### ✅ Per-Board Data (All Users See Same Value)
- Swimlane height
- List width
- Card position (sort)
- Checklist position (sort)
- ChecklistItem position (sort)
- All titles, colors, descriptions

### 🔒 Per-User Data (Only That User Sees Their Value)
- Collapse state (swimlane, list, card)
- Hide minicard label text visibility
- Stored in user.profile or cookie

---

**Status**: ✅ Architecture and schema changes complete  
**Next**: Refactor user methods and run migration

