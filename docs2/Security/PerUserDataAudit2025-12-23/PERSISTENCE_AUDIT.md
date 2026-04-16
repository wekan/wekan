# Wekan Persistence Audit Report

## Overview
This document audits the persistence mechanisms for Wekan board data, including swimlanes, lists, cards, checklists, and their properties (order, color, background, titles, etc.), as well as per-user settings.

---

## 1. BOARD-LEVEL PERSISTENCE (Persisted Across All Users)

### 1.1 Swimlanes

**Collection**: `swimlanes` ([models/swimlanes.js](models/swimlanes.js))

**Persisted Fields**:
- ✅ `title` - Swimlane title (via `rename()` mutation)
- ✅ `sort` - Swimlane ordering/position (decimal number)
- ✅ `color` - Swimlane color (via `setColor()` mutation)
- ✅ `collapsed` - Swimlane collapsed state (via `collapse()` mutation) **⚠️ See note below**
- ✅ `archived` - Swimlane archived status

**Persistence Mechanism**:
- Direct MongoDB updates via `Swimlanes.update()` and `Swimlanes.direct.update()`
- Automatic timestamps: `updatedAt`, `modifiedAt` fields
- Activity tracking for title changes and archive/restore operations

**Issues Found**:
- ⚠️ **ISSUE**: `collapsed` field in swimlanes.js line 127 is set to `defaultValue: false` but the `isCollapsed()` helper (line 251-263) checks for per-user stored values. This creates a mismatch between board-level and per-user storage.

---

### 1.2 Lists

**Collection**: `lists` ([models/lists.js](models/lists.js))

**Persisted Fields**:
- ✅ `title` - List title
- ✅ `sort` - List ordering/position (decimal number)
- ✅ `color` - List color
- ✅ `collapsed` - List collapsed state (board-wide via REST API line 768-775) **⚠️ See note below**
- ✅ `starred` - List starred status
- ✅ `wipLimit` - WIP limit configuration
- ✅ `archived` - List archived status

**Persistence Mechanism**:
- Direct MongoDB updates via `Lists.update()` and `Lists.direct.update()`
- Automatic timestamps: `updatedAt`, `modifiedAt`
- Activity tracking for title changes, archive/restore

**Issues Found**:
- ⚠️ **ISSUE**: Similar to swimlanes, `collapsed` field (line 147) defaults to `false` but the `isCollapsed()` helper (line 303-311) also checks for per-user stored values. The REST API allows board-level collapsed state updates (line 768-775), but client also stores per-user via `getCollapsedListFromStorage()`.
- ⚠️ **ISSUE**: The `swimlaneId` field is part of the list (line 48), but `draggableLists()` method (line 275) filters by board only, suggesting lists are shared across swimlanes rather than per-swimlane.

---

### 1.3 Cards

**Collection**: `cards` ([models/cards.js](models/cards.js))

**Persisted Fields**:
- ✅ `title` - Card title
- ✅ `sort` - Card ordering/position within list
- ✅ `color` - Card color (via `setColor()` mutation, line 2268)
- ✅ `boardId`, `swimlaneId`, `listId` - Card location
- ✅ `archived` - Card archived status
- ✅ `description` - Card description
- ✅ Custom fields, labels, members, assignees, etc.

**Persistence Mechanism**:
- `move()` method (line 2063+) handles reordering and moving cards across swimlanes/lists/boards
- Automatic timestamp updates via `modifiedAt`, `dateLastActivity`
- Activity tracking for moves, title changes, etc.
- Attachment metadata updated alongside card moves (line 2101-2115)

**Issues Found**:
- ✅ **OK**: Order/sort persistence working correctly via card.move() and card.moveOptionalArgs()
- ✅ **OK**: Color persistence working correctly
- ✅ **OK**: Title changes persisted automatically

---

### 1.4 Checklists

**Collection**: `checklists` ([models/checklists.js](models/checklists.js))

**Persisted Fields**:
- ✅ `title` - Checklist title (via `setTitle()` mutation)
- ✅ `sort` - Checklist ordering (decimal number)
- ✅ `hideCheckedChecklistItems` - Toggle for hiding checked items
- ✅ `hideAllChecklistItems` - Toggle for hiding all items

**Persistence Mechanism**:
- Direct MongoDB updates via `Checklists.update()`
- Automatic timestamps: `createdAt`, `modifiedAt`
- Activity tracking for creation and removal

---

### 1.5 Checklist Items

**Collection**: `checklistItems` ([models/checklistItems.js](models/checklistItems.js))

**Persisted Fields**:
- ✅ `title` - Item text (via `setTitle()` mutation)
- ✅ `sort` - Item ordering within checklist (decimal number)
- ✅ `isFinished` - Item completion status (via `check()`, `uncheck()`, `toggleItem()` mutations)

**Persistence Mechanism**:
- `move()` mutation (line 159-168) handles reordering within checklists
- Direct MongoDB updates via `ChecklistItems.update()`
- Automatic timestamps: `createdAt`, `modifiedAt`
- Activity tracking for item creation/removal and completion state changes

**Issue Found**:
- ✅ **OK**: Item order and completion status persist correctly

---

### 1.6 Position History Tracking

**Collection**: `positionHistory` ([models/positionHistory.js](models/positionHistory.js))

**Purpose**: Tracks original positions of swimlanes, lists, and cards before changes

**Features**:
- ✅ Stores original `sort` position
- ✅ Stores original titles
- ✅ Supports swimlanes, lists, and cards
- ✅ Provides helpers to check if entity moved from original position

**Implementation Notes**:
- Swimlanes track position automatically on insert (swimlanes.js line 387-393)
- Lists track position automatically on insert (lists.js line 487+)
- Can detect moves via `hasMoved()` and `hasMovedFromOriginalPosition()` helpers

---

## 2. PER-USER SETTINGS (NOT Persisted Across Boards)

### 2.1 Per-Board, Per-User Settings

**Storage**: User `profile` subdocuments ([models/users.js](models/users.js))

#### A. List Widths
- **Field**: `profile.listWidths` (line 527)
- **Structure**: `listWidths[boardId][listId] = width`
- **Persistence**: Via `setListWidth()` mutation (line 1834)
- **Retrieval**: `getListWidth()`, `getListWidthFromStorage()` (line 1288-1313)
- **Constraints**: Also stored in `profile.listConstraints`
- ✅ **Status**: Working correctly

#### B. Swimlane Heights
- **Field**: `profile.swimlaneHeights` (searchable in line 1047+)
- **Structure**: `swimlaneHeights[boardId][swimlaneId] = height`
- **Persistence**: Via `setSwimlaneHeight()` mutation (line 1878)
- **Retrieval**: `getSwimlaneHeight()`, `getSwimlaneHeightFromStorage()` (line 1050-1080)
- ✅ **Status**: Working correctly

#### C. Collapsed Swimlanes (Per-User)
- **Field**: `profile.collapsedSwimlanes` (line 1900)
- **Structure**: `collapsedSwimlanes[boardId][swimlaneId] = boolean`
- **Persistence**: Via `setCollapsedSwimlane()` mutation (line 1900-1906)
- **Retrieval**: `getCollapsedSwimlaneFromStorage()` (swimlanes.js line 251-263)
- **Client-Side Fallback**: `Users.getPublicCollapsedSwimlane()` for public/non-logged-in users (users.js line 60-73)
- ✅ **Status**: Working correctly for logged-in users

#### D. Collapsed Lists (Per-User)
- **Field**: `profile.collapsedLists` (line 1893)
- **Structure**: `collapsedLists[boardId][listId] = boolean`
- **Persistence**: Via `setCollapsedList()` mutation (line 1893-1899)
- **Retrieval**: `getCollapsedListFromStorage()` (lists.js line 303-311)
- **Client-Side Fallback**: `Users.getPublicCollapsedList()` for public users (users.js line 44-52)
- ✅ **Status**: Working correctly for logged-in users

#### E. Card Collapsed State (Global Per-User)
- **Field**: `profile.cardCollapsed` (line 267)
- **Persistence**: Via `setCardCollapsed()` method (line 2088-2091)
- **Retrieval**: `cardCollapsed()` helper in cardDetails.js (line 100-107)
- **Client-Side Fallback**: `Users.getPublicCardCollapsed()` for public users (users.js line 80-85)
- ✅ **Status**: Working correctly (applies to all boards for a user)

#### F. Card Maximized State (Global Per-User)
- **Field**: `profile.cardMaximized` (line 260)
- **Persistence**: Via `toggleCardMaximized()` mutation (line 1720-1726)
- **Retrieval**: `hasCardMaximized()` helper (line 1194-1196)
- ✅ **Status**: Working correctly

#### G. Board Workspace Trees (Global Per-User)
- **Field**: `profile.boardWorkspacesTree` (line 1981-2026)
- **Purpose**: Stores nested workspace structure for organizing boards
- **Persistence**: Via `setWorkspacesTree()` method (line 1995-2000)
- ✅ **Status**: Working correctly

#### H. Board Workspace Assignments (Global Per-User)
- **Field**: `profile.boardWorkspaceAssignments` (line 2002-2011)
- **Purpose**: Maps each board to a workspace ID
- **Persistence**: Via `assignBoardToWorkspace()` and `unassignBoardFromWorkspace()` methods
- ✅ **Status**: Working correctly

#### I. All Boards Workspaces Setting
- **Field**: `profile.boardView` (line 1807)
- **Persistence**: Via `setBoardView()` method (line 1805-1809)
- **Description**: Per-user preference for "All Boards" view style
- ✅ **Status**: Working correctly

---

### 2.2 Client-Side Storage (Non-Logged-In Users)

**Storage Methods**:
1. **Cookies** (via `readCookieMap()`/`writeCookieMap()`):
   - `wekan-collapsed-lists` - Collapsed list states (users.js line 44-58)
   - `wekan-collapsed-swimlanes` - Collapsed swimlane states

2. **localStorage**:
   - `wekan-list-widths` - List widths (getListWidthFromStorage, line 1316-1327)
   - `wekan-swimlane-heights` - Swimlane heights (setSwimlaneHeightToStorage, line 1100-1123)

**Coverage**:
- ✅ Collapse status for lists and swimlanes
- ✅ Width constraints for lists
- ✅ Height constraints for swimlanes
- ❌ Card collapsed state (only via cookies, fallback available)

---

## 3. CRITICAL FINDINGS & ISSUES

### 3.1 HIGH PRIORITY ISSUES

#### Issue #1: Collapsed State Inconsistency (Swimlanes)
**Severity**: HIGH  
**Location**: [models/swimlanes.js](models/swimlanes.js) lines 127, 251-263

**Problem**:
- The swimlane schema defines `collapsed` as a board-level field (defaults to false)
- But the `isCollapsed()` helper prioritizes per-user stored values from the user profile
- This creates confusion: is collapsed state board-wide or per-user?

**Expected Behavior**: Per-user settings should be stored in `profile.collapsedSwimlanes`, not in the swimlane document itself.

**Recommendation**:
```javascript
// CURRENT (WRONG):
collapsed: {
  type: Boolean,
  defaultValue: false,  // Board-wide field
},

// SUGGESTED (CORRECT):
// Remove 'collapsed' from swimlane schema
// Only store per-user state in profile.collapsedSwimlanes
```

---

#### Issue #2: Collapsed State Inconsistency (Lists)
**Severity**: HIGH  
**Location**: [models/lists.js](models/lists.js) lines 147, 303-311

**Problem**:
- Similar to swimlanes, lists have a board-level `collapsed` field
- REST API allows updating this field (line 768-775)
- But `isCollapsed()` helper checks per-user values first
- Migrations copy `collapsed` status between lists (fixMissingListsMigration.js line 165)

**Recommendation**: Clarify whether collapsed state should be:
1. **Option A**: Board-level only (remove per-user override)
2. **Option B**: Per-user only (remove board-level field)
3. **Option C**: Hybrid with clear precedence rules

---

#### Issue #3: Swimlane/List Organization Model Unclear
**Severity**: MEDIUM  
**Location**: [models/lists.js](models/lists.js) lines 48, 201-230, 275

**Problem**:
- Lists have a `swimlaneId` field but `draggableLists()` filters by `boardId` only
- Some methods reference `myLists()` which filters by both `boardId` and `swimlaneId`
- Migrations suggest lists were transitioning from per-swimlane to shared-across-swimlane model

**Questions**:
- Are lists shared across all swimlanes or isolated to each swimlane?
- What happens when dragging a list to a different swimlane?

**Recommendation**: Document the intended architecture clearly.

---

### 3.2 MEDIUM PRIORITY ISSUES

#### Issue #4: Position History Only Tracks Original Position
**Severity**: MEDIUM  
**Location**: [models/positionHistory.js](models/positionHistory.js)

**Problem**:
- Position history tracks the *original* position when an entity is created
- It does NOT track subsequent moves/reorders
- Historical audit trail of all position changes is lost

**Impact**: Cannot determine full history of where a card/list was located over time

**Recommendation**: Consider extending to track all position changes with timestamps.

---

#### Issue #5: Card Collapsed State is Global Per-User, Not Per-Card
**Severity**: LOW  
**Location**: [models/users.js](models/users.js) line 267, users.js line 2088-2091

**Problem**:
- `profile.cardCollapsed` is a single boolean affecting all cards for a user
- It's not per-card or per-board, just a global toggle
- Name is misleading

**Recommendation**: Consider renaming to `cardDetailsCollapsedByDefault` or similar.

---

#### Issue #6: Public User Settings Storage Incomplete
**Severity**: MEDIUM  
**Location**: [models/users.js](models/users.js) lines 44-85

**Problem**:
- Cookie-based storage for public users only covers:
  - Collapsed lists
  - Collapsed swimlanes
- Missing storage for:
  - List widths
  - Swimlane heights
  - Card collapsed state

**Impact**: Public/non-logged-in users lose UI preferences on page reload

**Recommendation**: Implement localStorage storage for all per-user preferences.

---

### 3.3 VERIFICATION CHECKLIST

| Item | Status | Notes |
|------|--------|-------|
| Swimlane order persistence | ✅ | Via `sort` field, board-level |
| List order persistence | ✅ | Via `sort` field, board-level |
| Card order persistence | ✅ | Via `sort` field, card.move() |
| Checklist order persistence | ✅ | Via `sort` field |
| Checklist item order persistence | ✅ | Via `sort` field, ChecklistItems.move() |
| Swimlane color changes | ✅ | Via `setColor()` mutation |
| List color changes | ✅ | Via REST API or direct update |
| Card color changes | ✅ | Via `setColor()` mutation |
| Swimlane title changes | ✅ | Via `rename()` mutation, activity tracked |
| List title changes | ✅ | Via REST API or `rename()` mutation, activity tracked |
| Card title changes | ✅ | Via direct update, activity tracked |
| Checklist title changes | ✅ | Via `setTitle()` mutation |
| Checklist item title changes | ✅ | Via `setTitle()` mutation |
| Per-user list widths | ✅ | Via `profile.listWidths` |
| Per-user swimlane heights | ✅ | Via `profile.swimlaneHeights` |
| Per-user swimlane collapse state | ✅ | Via `profile.collapsedSwimlanes` |
| Per-user list collapse state | ✅ | Via `profile.collapsedLists` |
| Per-user card collapse state | ✅ | Via `profile.cardCollapsed` |
| Per-user board workspace organization | ✅ | Via `profile.boardWorkspacesTree` |
| Activity logging for changes | ✅ | Via Activities collection |

---

## 4. RECOMMENDATIONS

### 4.1 Immediate Actions

1. **Clarify Collapsed State Architecture**
   - Decide if collapsed state should be per-user or board-wide
   - Update swimlanes.js and lists.js schema accordingly
   - Update documentation

2. **Complete Public User Storage**
   - Implement localStorage for list widths/swimlane heights for non-logged-in users
   - Test persistence across page reloads

3. **Review Position History Usage**
   - Confirm if current position history implementation meets requirements
   - Consider extending to track all changes (not just original position)

### 4.2 Long-Term Improvements

1. **Audit Trail Feature**
   - Extend position history to track all moves with timestamps
   - Enable board managers to see complete history of card/list movements

2. **Data Integrity Tests**
   - Add integration tests to verify:
     - Order is persisted correctly after drag-drop
     - Color changes persist across sessions
     - Per-user settings apply only to correct user
     - Per-user settings don't leak across boards

3. **Database Indexes**
   - Verify indexes exist for common queries:
     - `sort` fields for swimlanes, lists, cards, checklists
     - `boardId` fields for filtering

### 4.3 Code Quality Improvements

1. **Document Persistence Model**
   - Add clear comments explaining which fields are board-level vs. per-user
   - Document swimlane/list relationship model

2. **Consistent Naming**
   - Rename misleading field names (e.g., `cardCollapsed`)
   - Align method names with actual functionality

---

## 5. SUMMARY TABLE

### Board-Level Persistence (Shared Across Users)

| Entity | Field | Type | Persisted | Notes |
|--------|-------|------|-----------|-------|
| Swimlane | title | Text | ✅ | Via rename() |
| Swimlane | sort | Number | ✅ | For ordering |
| Swimlane | color | String | ✅ | Via setColor() |
| Swimlane | collapsed | Boolean | ⚠️ | **Issue #1**: Conflicts with per-user storage |
| Swimlane | archived | Boolean | ✅ | Via archive()/restore() |
| | | | | |
| List | title | Text | ✅ | Via rename() or REST |
| List | sort | Number | ✅ | For ordering |
| List | color | String | ✅ | Via REST or update |
| List | collapsed | Boolean | ⚠️ | **Issue #2**: Conflicts with per-user storage |
| List | starred | Boolean | ✅ | Via REST or update |
| List | wipLimit | Object | ✅ | Via REST or setWipLimit() |
| List | archived | Boolean | ✅ | Via archive() |
| | | | | |
| Card | title | Text | ✅ | Direct update |
| Card | sort | Number | ✅ | Via move() |
| Card | color | String | ✅ | Via setColor() |
| Card | boardId/swimlaneId/listId | String | ✅ | Via move() |
| Card | archived | Boolean | ✅ | Via archive() |
| Card | description | Text | ✅ | Direct update |
| Card | customFields | Array | ✅ | Direct update |
| | | | | |
| Checklist | title | Text | ✅ | Via setTitle() |
| Checklist | sort | Number | ✅ | Direct update |
| Checklist | hideCheckedChecklistItems | Boolean | ✅ | Via toggle mutation |
| Checklist | hideAllChecklistItems | Boolean | ✅ | Via toggle mutation |
| | | | | |
| ChecklistItem | title | Text | ✅ | Via setTitle() |
| ChecklistItem | sort | Number | ✅ | Via move() |
| ChecklistItem | isFinished | Boolean | ✅ | Via check/uncheck/toggle |

### Per-User Settings (NOT Persisted Across Boards)

| Setting | Storage | Scope | Notes |
|---------|---------|-------|-------|
| List Widths | profile.listWidths | Per-board, per-user | ✅ Working |
| Swimlane Heights | profile.swimlaneHeights | Per-board, per-user | ✅ Working |
| Collapsed Swimlanes | profile.collapsedSwimlanes | Per-board, per-user | ✅ Working |
| Collapsed Lists | profile.collapsedLists | Per-board, per-user | ✅ Working |
| Card Collapsed State | profile.cardCollapsed | Global per-user | ⚠️ Name misleading |
| Card Maximized State | profile.cardMaximized | Global per-user | ✅ Working |
| Board Workspaces | profile.boardWorkspacesTree | Global per-user | ✅ Working |
| Board Workspace Assignments | profile.boardWorkspaceAssignments | Global per-user | ✅ Working |
| Board View Style | profile.boardView | Global per-user | ✅ Working |

---

## Document History

- **Created**: 2025-12-23
- **Status**: Initial Audit Complete
- **Reviewed**: Swimlanes, Lists, Cards, Checklists, ChecklistItems, PositionHistory, Users
- **Next Review**: After addressing high-priority issues

