/**
 * WeKan schema migration v8.43 — mongosh script
 *
 * Run with:
 *   mongosh --port 27017 --file migrate-schema-v843.js
 *
 * Idempotent: safe to run multiple times.
 * Applies to: FerretDB (via MongoDB wire protocol) or plain MongoDB.
 *
 * What it does:
 *   1. Ensures every list has a non-empty swimlaneId.
 *   2. Ensures every card has a non-empty swimlaneId and a valid listId.
 *   3. Creates a "Rescued Data" swimlane for each board that has orphaned
 *      entities (lists or cards without a valid swimlaneId/listId).
 *   4. Marks each board with migrationVersion: 843 once upgraded.
 *   5. Converts cfs.attachments.filerecord documents to the Meteor-Files
 *      (ostrio:files) schema inside the attachments collection.
 *   6. Converts cfs.avatars.filerecord documents similarly.
 *   7. Writes a completion marker to _wekan_migration.
 */

// ── Connect to the wekan database ──────────────────────────────────────────
const db = db.getSiblingDB('wekan');
const SCHEMA_VER = 843;

// ── Idempotency check ──────────────────────────────────────────────────────
const marker = db.getCollection('_wekan_migration').findOne({ _id: 'schema_v843' });
if (marker && marker.completedAt) {
    print('Schema v8.43 already applied at ' + marker.completedAt + ' — skipping.');
    quit(0);
}

print('=== Applying WeKan schema v8.43 ===');

// ── 1. Build per-board default-swimlane map ────────────────────────────────
print('Step 1: Building default swimlane map...');
const defaultSwimlaneId = {};   // boardId → first swimlaneId
db.swimlanes.find({ archived: false }, { _id: 1, boardId: 1, sort: 1 })
    .sort({ sort: 1 })
    .forEach(sw => {
        const bid = String(sw.boardId);
        if (!defaultSwimlaneId[bid]) defaultSwimlaneId[bid] = String(sw._id);
    });

// ── 2. Ensure each board that has entities has at least one swimlane ───────
print('Step 2: Creating default swimlanes for boards that have none...');
db.boards.find({}).forEach(board => {
    const boardId = String(board._id);
    if (db.swimlanes.countDocuments({ boardId }) === 0) {
        const newId = new ObjectId();
        db.swimlanes.insertOne({
            _id:        newId,
            title:      'Default',
            boardId,
            archived:   false,
            sort:       0,
            type:       'swimlane',
            createdAt:  new Date(),
            modifiedAt: new Date(),
            updatedAt:  new Date(),
        });
        defaultSwimlaneId[boardId] = String(newId);
        print('  Created default swimlane for board ' + boardId);
    }
});

// ── 3. Build list → swimlaneId map ────────────────────────────────────────
print('Step 3: Building list → swimlane map...');
const listSwimlaneMap = {};  // listId → swimlaneId
db.lists.find({}, { _id: 1, swimlaneId: 1 }).forEach(ls => {
    listSwimlaneMap[String(ls._id)] = ls.swimlaneId || '';
});

// ── 4. Ensure all lists have a swimlaneId ─────────────────────────────────
print('Step 4: Patching lists without swimlaneId...');
let listFixed = 0;
db.lists.find({ $or: [{ swimlaneId: { $exists: false } }, { swimlaneId: '' }, { swimlaneId: null }] })
    .forEach(list => {
        const bid = String(list.boardId);
        const sid = defaultSwimlaneId[bid] || '';
        if (!sid) return;
        db.lists.updateOne({ _id: list._id }, { $set: { swimlaneId: sid } });
        listSwimlaneMap[String(list._id)] = sid;
        listFixed++;
    });
print('  Lists patched: ' + listFixed);

// ── 5. Ensure all cards have a swimlaneId and a valid listId ──────────────
print('Step 5: Patching cards without swimlaneId or with invalid listId...');
const allListIds = new Set(db.lists.find({}, { _id: 1 }).map(l => String(l._id)));
// First list per board for orphan fallback
const firstListByBoard = {};
db.lists.find({}, { _id: 1, boardId: 1, swimlaneId: 1 }).sort({ sort: 1 }).forEach(l => {
    if (!firstListByBoard[l.boardId]) firstListByBoard[l.boardId] = l;
});

let cardFixed = 0;
let cardOrphaned = 0;
// Boards that need a "Rescued Data" swimlane
const rescuedSwimlanes = {};

function getOrCreateRescuedSwimlane(boardId) {
    if (rescuedSwimlanes[boardId]) return rescuedSwimlanes[boardId];
    let sw = db.swimlanes.findOne({ boardId, title: /rescued.*data/i });
    if (!sw) {
        const id = new ObjectId();
        db.swimlanes.insertOne({
            _id:        id,
            title:      'Rescued Data (Missing Swimlane)',
            boardId,
            archived:   false,
            sort:       9999999,
            type:       'swimlane',
            color:      'red',
            createdAt:  new Date(),
            modifiedAt: new Date(),
            updatedAt:  new Date(),
        });
        // Also create a list inside that swimlane for the orphaned cards
        const listId = new ObjectId();
        db.lists.insertOne({
            _id:        listId,
            title:      'Rescued Cards',
            boardId,
            swimlaneId: String(id),
            archived:   false,
            sort:       0,
            type:       'list',
            createdAt:  new Date(),
            modifiedAt: new Date(),
            updatedAt:  new Date(),
        });
        rescuedSwimlanes[boardId] = { swimlaneId: String(id), listId: String(listId) };
    } else {
        // Find or create rescue list
        let rescList = db.lists.findOne({ boardId, swimlaneId: String(sw._id), title: /rescued/i });
        if (!rescList) {
            const listId = new ObjectId();
            db.lists.insertOne({
                _id: listId, title: 'Rescued Cards', boardId,
                swimlaneId: String(sw._id), archived: false, sort: 0,
                type: 'list', createdAt: new Date(), modifiedAt: new Date(), updatedAt: new Date(),
            });
            rescuedSwimlanes[boardId] = { swimlaneId: String(sw._id), listId: String(listId) };
        } else {
            rescuedSwimlanes[boardId] = { swimlaneId: String(sw._id), listId: String(rescList._id) };
        }
    }
    return rescuedSwimlanes[boardId];
}

db.cards.find({}).forEach(card => {
    const bid  = String(card.boardId);
    const lid  = String(card.listId  || '');
    const sid  = String(card.swimlaneId || '');
    let newSid = sid;
    let newLid = lid;
    let changed = false;

    // Fix missing swimlaneId
    if (!newSid) {
        if (lid && listSwimlaneMap[lid]) {
            newSid = listSwimlaneMap[lid];
        } else {
            newSid = defaultSwimlaneId[bid] || '';
        }
        changed = true;
    }

    // Fix invalid listId (points to a list that doesn't exist)
    if (lid && !allListIds.has(lid)) {
        const rescued = getOrCreateRescuedSwimlane(bid);
        newLid = rescued.listId;
        newSid = rescued.swimlaneId;
        changed = true;
        cardOrphaned++;
    }

    // Fix missing listId
    if (!newLid && firstListByBoard[bid]) {
        const fl = firstListByBoard[bid];
        newLid = String(fl._id);
        newSid = fl.swimlaneId || newSid;
        changed = true;
    }

    if (changed) {
        db.cards.updateOne({ _id: card._id }, { $set: { swimlaneId: newSid, listId: newLid } });
        cardFixed++;
    }
});
print('  Cards patched: ' + cardFixed + ' (' + cardOrphaned + ' orphaned → Rescued Data swimlane)');

// ── 6. Stamp boards with migrationVersion ─────────────────────────────────
print('Step 6: Stamping boards with migrationVersion ' + SCHEMA_VER + '...');
db.boards.updateMany(
    { migrationVersion: { $lt: SCHEMA_VER } },
    { $set: { migrationVersion: SCHEMA_VER, comprehensiveMigrationCompleted: true, fixMissingListsCompleted: true } }
);
db.boards.updateMany(
    { migrationVersion: { $exists: false } },
    { $set: { migrationVersion: SCHEMA_VER, comprehensiveMigrationCompleted: true, fixMissingListsCompleted: true } }
);

// ── 7. Convert CollectionFS attachment records → Meteor-Files format ────────
print('Step 7: Converting cfs.attachments.filerecord → attachments (Meteor-Files)...');
let cfsAttachConverted = 0;
if (db.getCollectionNames().includes('cfs.attachments.filerecord')) {
    db.getCollection('cfs.attachments.filerecord').find({}).forEach(record => {
        // Skip if already in new attachments collection
        if (db.attachments.findOne({ _id: record._id })) return;

        const original = record.original || {};
        const meta     = record.meta     || {};
        const now      = new Date();

        db.attachments.insertOne({
            _id:        record._id,
            name:       original.name || record.filename || String(record._id),
            size:       original.size || 0,
            type:       original.type || 'application/octet-stream',
            extension:  (original.name || '').split('.').pop() || '',
            extensionWithDot: (original.name || '').includes('.')
                ? '.' + (original.name || '').split('.').pop() : '',
            meta: {
                boardId:         meta.boardId    || '',
                cardId:          meta.cardId     || '',
                listId:          meta.listId     || '',
                swimlaneId:      meta.swimlaneId || '',
                userId:          meta.userId     || '',
                source:          'cfs-migration',
                cfsOriginalId:   String(record._id),
                originalFilename: original.name || '',
            },
            path:          '',  // set later by GridFS→filesystem migration
            versions:      { original: { path: '', size: original.size || 0,
                                         type: original.type || 'application/octet-stream',
                                         storage: 'fs' } },
            userId:        meta.userId || '',
            uploadedAt:    record.uploadedAt || record.createdAt || now,
            uploadedAtOstrio: record.uploadedAt || record.createdAt || now,
            updatedAt:     now,
            public:        false,
            collectionName: 'attachments',
        });
        cfsAttachConverted++;
    });
}
print('  CFS attachments converted: ' + cfsAttachConverted);

// ── 8. Convert CollectionFS avatar records → Meteor-Files format ────────────
print('Step 8: Converting cfs.avatars.filerecord → avatars (Meteor-Files)...');
let cfsAvatarConverted = 0;
if (db.getCollectionNames().includes('cfs.avatars.filerecord')) {
    db.getCollection('cfs.avatars.filerecord').find({}).forEach(record => {
        if (db.avatars.findOne({ _id: record._id })) return;

        const original = record.original || {};
        const now      = new Date();

        db.avatars.insertOne({
            _id:        record._id,
            name:       original.name || String(record._id),
            size:       original.size || 0,
            type:       original.type || 'image/jpeg',
            extension:  (original.name || '').split('.').pop() || '',
            extensionWithDot: (original.name || '').includes('.')
                ? '.' + (original.name || '').split('.').pop() : '',
            meta: {
                source:          'cfs-migration',
                cfsOriginalId:   String(record._id),
                originalFilename: original.name || '',
            },
            path:          '',
            versions:      { original: { path: '', size: original.size || 0,
                                         type: original.type || 'image/jpeg',
                                         storage: 'fs' } },
            userId:        record.userId || record.meta && record.meta.userId || '',
            uploadedAt:    record.uploadedAt || record.createdAt || now,
            uploadedAtOstrio: record.uploadedAt || record.createdAt || now,
            updatedAt:     now,
            public:        false,
            collectionName: 'avatars',
        });
        cfsAvatarConverted++;
    });
}
print('  CFS avatars converted: ' + cfsAvatarConverted);

// ── 9. Fix all existing attachment/avatar path references ──────────────────
// Normalise legacy /cfs/files/... URLs to /cdn/storage/... in all card fields
print('Step 9: Normalising legacy file URL references in cards...');
let urlsFixed = 0;
db.cards.find({ coverId: /^\/cfs\/files\// }).forEach(card => {
    const newId = card.coverId.replace(/^.*\/([^/]+)$/, '$1').replace(/\?.*$/, '');
    db.cards.updateOne({ _id: card._id }, { $set: { coverId: newId } });
    urlsFixed++;
});
print('  Card coverIds normalised: ' + urlsFixed);

// ── 10. Write completion marker ────────────────────────────────────────────
db.getCollection('_wekan_migration').replaceOne(
    { _id: 'schema_v843' },
    {
        _id:           'schema_v843',
        schemaVersion: SCHEMA_VER,
        completedAt:   new Date(),
        stats: {
            listsPatched:          listFixed,
            cardsPatched:          cardFixed,
            cardsOrphaned:         cardOrphaned,
            cfsAttachmentsConverted: cfsAttachConverted,
            cfsAvatarsConverted:   cfsAvatarConverted,
            urlsNormalised:        urlsFixed,
        },
    },
    { upsert: true }
);

print('');
print('=== Schema v8.43 migration complete ===');
print('  Lists patched:       ' + listFixed);
print('  Cards patched:       ' + cardFixed);
print('  Cards rescued:       ' + cardOrphaned);
print('  CFS attach conv:     ' + cfsAttachConverted);
print('  CFS avatar conv:     ' + cfsAvatarConverted);
print('  URLs normalised:     ' + urlsFixed);
