# Per-User Data Audit 2025-12-23 - Complete Documentation Index

**Last Updated**: 2025-12-23  
**Status**: ✅ Current (All data persistence architecture up-to-date)  
**Scope**: Swimlanes, Lists, Cards, Checklists, ChecklistItems - positions, widths, heights, colors, titles

---

## 📋 Documentation Overview

This folder contains the complete, current documentation for Wekan's data persistence architecture as of December 23, 2025.

**Key Change**: Swimlane height and list width are now **per-board** (stored in documents, shared with all users), not per-user.

---

## 📚 Documents (Read In This Order)

### 1. **[CURRENT_STATUS.md](CURRENT_STATUS.md)** 🟢 START HERE
**Purpose**: Quick status overview of what's been done and what's pending  
**Read Time**: 5 minutes  
**Contains**:
- Key decision on data classification
- What's completed vs pending
- Before/after examples
- Testing requirements
- Integration phases

**Best For**: Getting current status quickly

---

### 2. **[DATA_PERSISTENCE_ARCHITECTURE.md](DATA_PERSISTENCE_ARCHITECTURE.md)** 📖 REFERENCE
**Purpose**: Complete architecture specification  
**Read Time**: 15 minutes  
**Contains**:
- Full data classification matrix (per-board vs per-user)
- Where each field is stored
- MongoDB schema definitions
- Cookie/localStorage for public users
- Data flow diagrams
- Validation rules
- Security implications
- Testing checklist

**Best For**: Understanding the complete system

---

### 3. **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** 🛠️ DOING THE WORK
**Purpose**: Step-by-step implementation instructions  
**Read Time**: 20 minutes  
**Contains**:
- Changes already completed ✅
- Changes still needed ⏳
- Code examples for refactoring
- Migration script template
- Testing checklist
- Rollback plan
- Files modified reference

**Best For**: Implementing the remaining phases

---

### 4. **[SCHEMA_CHANGES_VERIFICATION.md](SCHEMA_CHANGES_VERIFICATION.md)** ✅ VERIFICATION
**Purpose**: Verification that schema changes are correct  
**Read Time**: 10 minutes  
**Contains**:
- Exact fields added (with line numbers)
- Validation rule verification
- Data type classification
- Migration path status
- Code review checklist
- Integration notes

**Best For**: Verifying all changes are correct

---

### 5. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** ⚡ QUICK LOOKUP
**Purpose**: Quick reference for key information  
**Read Time**: 3 minutes  
**Contains**:
- What changed (removed/added/kept)
- How it works (per-user vs per-board)
- Troubleshooting
- Performance notes
- Which files to know about

**Best For**: Quick lookups and troubleshooting

---

## 🎯 At a Glance

### The Core Change

**BEFORE** (Mixed/Wrong):
- Swimlane height: Stored per-user in user.profile
- List width: Stored per-user in user.profile
- Cards could look different dimensions for different users

**NOW** (Correct):
- Swimlane height: Stored per-board in swimlane document
- List width: Stored per-board in list document  
- All users see same dimensions (shared layout)
- Only collapse state is per-user (private preference)

---

### What's Per-Board ✅ (ALL Users See Same)

```
Swimlane:
  - title, color, height, sort, archived

List:
  - title, color, width, sort, archived, wipLimit, starred

Card:
  - title, color, description, swimlaneId, listId, sort, archived

Checklist:
  - title, sort, hideCheckedItems, hideAllItems

ChecklistItem:
  - title, sort, isFinished
```

### What's Per-User 🔒 (Only YOU See Yours)

```
User Preferences:
  - collapsedSwimlanes[boardId][swimlaneId] (true/false)
  - collapsedLists[boardId][listId] (true/false)
  - hideMiniCardLabelText[boardId] (true/false)
```

---

## ✅ Completed (Phase 1)

- [x] **Schema Addition**
  - Added `swimlanes.height` field (default: -1, range: -1 or 50-2000)
  - Added `lists.width` field (default: 272, range: 100-1000)
  - Both with validation and backward compatibility

- [x] **Documentation**
  - Complete architecture specification
  - Implementation guide with code examples
  - Migration script template
  - Verification checklist

- [x] **Verification**
  - Schema changes verified correct
  - Validation logic reviewed
  - Code samples provided
  - Testing plans documented

---

## ⏳ Pending (Phase 2-4)

- [ ] **User Model Refactoring** (Phase 2)
  - Refactor user methods to read heights/widths from documents
  - Remove per-user storage from user.profile
  - Update user schema definition

- [ ] **Data Migration** (Phase 3)
  - Create migration script (template in IMPLEMENTATION_GUIDE.md)
  - Migrate existing per-user data to per-board
  - Track migration status
  - Verify no data loss

- [ ] **UI Integration** (Phase 4)
  - Update client code
  - Update Meteor methods
  - Update subscriptions
  - Test with multiple users

---

## 📊 Data Classification Summary

### Per-Board (Shared with All Users)
| Data | Current | New |
|------|---------|-----|
| Swimlane height | ❌ Per-user (wrong) | ✅ Per-board (correct) |
| List width | ❌ Per-user (wrong) | ✅ Per-board (correct) |
| Card position | ✅ Per-board | ✅ Per-board |
| Checklist position | ✅ Per-board | ✅ Per-board |
| ChecklistItem position | ✅ Per-board | ✅ Per-board |

### Per-User (Private to You)
| Data | Current | New |
|------|---------|-----|
| Collapse swimlane | ✅ Per-user | ✅ Per-user |
| Collapse list | ✅ Per-user | ✅ Per-user |
| Hide label text | ✅ Per-user | ✅ Per-user |

---

## 🔍 Quick Facts

- **Total Files Modified So Far**: 2 (swimlanes.js, lists.js)
- **Total Files Documented**: 5 markdown files
- **Schema Fields Added**: 2 (height, width)
- **Validation Rules Added**: 2 (heightOutOfRange, widthOutOfRange)
- **Per-Board Data Types**: 5 entity types × multiple fields
- **Per-User Data Types**: 3 preference types
- **Backward Compatibility**: ✅ Yes (both fields optional)
- **Data Loss Risk**: ✅ None (old data preserved until migration)

---

## 🚀 How to Use This Documentation

### For Developers Joining Now

1. Read **[CURRENT_STATUS.md](CURRENT_STATUS.md)** - 5 min overview
2. Skim **[DATA_PERSISTENCE_ARCHITECTURE.md](DATA_PERSISTENCE_ARCHITECTURE.md)** - understand the system
3. Reference **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - when doing Phase 2

### For Reviewing Changes

1. Read **[SCHEMA_CHANGES_VERIFICATION.md](SCHEMA_CHANGES_VERIFICATION.md)** - verify what was done
2. Check actual files: swimlanes.js, lists.js
3. Approve or request changes

### For Implementing Remaining Work

1. **Phase 2 (User Refactoring)**: See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) Section 2
2. **Phase 3 (Migration)**: Use template in [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) Section 4
3. **Phase 4 (UI)**: See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) Section 3

### For Troubleshooting

- Quick answers: **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)**
- Detailed reference: **[DATA_PERSISTENCE_ARCHITECTURE.md](DATA_PERSISTENCE_ARCHITECTURE.md)**

---

## 📞 Questions Answered

### "What data is per-board?"
See **[DATA_PERSISTENCE_ARCHITECTURE.md](DATA_PERSISTENCE_ARCHITECTURE.md)** Section: Data Classification Matrix

### "What data is per-user?"
See **[DATA_PERSISTENCE_ARCHITECTURE.md](DATA_PERSISTENCE_ARCHITECTURE.md)** Section: Data Classification Matrix

### "Where is swimlane height stored?"
- **New**: In swimlane document (per-board)
- **Old**: In user.profile (per-user) - being replaced
- See **[SCHEMA_CHANGES_VERIFICATION.md](SCHEMA_CHANGES_VERIFICATION.md)** for verification

### "Where is list width stored?"
- **New**: In list document (per-board)
- **Old**: In user.profile (per-user) - being replaced
- See **[SCHEMA_CHANGES_VERIFICATION.md](SCHEMA_CHANGES_VERIFICATION.md)** for verification

### "How do I migrate old data?"
See **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** Section 4 for migration script template

### "What should I do next?"
See **[CURRENT_STATUS.md](CURRENT_STATUS.md)** Section: Integration Path → Phase 2

### "Is there a migration risk?"
No - see **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** Section 7: Rollback Plan

### "Are there validation rules?"
Yes - see **[DATA_PERSISTENCE_ARCHITECTURE.md](DATA_PERSISTENCE_ARCHITECTURE.md)** Section: Validation Rules

---

## 🔄 Document Update Schedule

| Document | Last Updated | Next Review |
|----------|--------------|-------------|
| [CURRENT_STATUS.md](CURRENT_STATUS.md) | 2025-12-23 | After Phase 2 |
| [DATA_PERSISTENCE_ARCHITECTURE.md](DATA_PERSISTENCE_ARCHITECTURE.md) | 2025-12-23 | If architecture changes |
| [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) | 2025-12-23 | After Phase 2 complete |
| [SCHEMA_CHANGES_VERIFICATION.md](SCHEMA_CHANGES_VERIFICATION.md) | 2025-12-23 | After Phase 2 complete |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | 2025-12-23 | After Phase 3 complete |

---

## ✨ Key Achievements

✅ **Clear Architecture**: Swimlane height and list width are now definitively per-board  
✅ **Schema Validation**: Both fields have custom validation functions  
✅ **Documentation**: 5 comprehensive documents covering all aspects  
✅ **Backward Compatible**: Old data preserved, transition safe  
✅ **Implementation Ready**: Code examples and migration scripts provided  
✅ **Future-Proof**: Clear path for remaining phases  

---

## 📝 Notes

- All data classification decisions made with input from security audit
- Per-board height/width means better collaboration (shared layout)
- Per-user collapse/visibility means better individual workflow
- Migration can happen at any time with no user downtime
- Testing templates provided for all phases

---

## 📍 File Location Reference

All files are in: `/home/wekan/repos/wekan/docs/Security/PerUserDataAudit2025-12-23/`

```
PerUserDataAudit2025-12-23/
├── CURRENT_STATUS.md                          ← Start here
├── DATA_PERSISTENCE_ARCHITECTURE.md           ← Complete spec
├── IMPLEMENTATION_GUIDE.md                    ← How to implement
├── SCHEMA_CHANGES_VERIFICATION.md             ← Verification
├── QUICK_REFERENCE.md                         ← Quick lookup
├── README.md                                  ← This file
├── QUICK_REFERENCE.md                         ← Previous doc
├── ARCHITECTURE_IMPROVEMENTS.md               ← From Phase 1
├── PERSISTENCE_AUDIT.md                       ← Initial audit
├── IMPLEMENTATION_SUMMARY.md                  ← Phase 1 summary
├── FIXES_CHECKLIST.md                         ← Bug fixes
└── Plan.txt                                   ← Original plan
```

---

**Status**: ✅ COMPLETE AND CURRENT  
**Last Review**: 2025-12-23  
**Next Phase**: User Model Refactoring (Phase 2)

