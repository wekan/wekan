import { ReactiveCache } from '/imports/reactiveCache';
const Papa = require('papaparse');
const { buildCsvCardRow } = require('./lib/exporterCsvRow');
const { encodeAligned, encodeFinal } = require('./lib/base64Chunk');
const {
  getImportExportSecuritySettings,
  assertExportEnabled,
  anonymizedUserWord,
  buildUserAnonymizationMap,
  anonymizeUserDoc,
  anonymizeBoardTextInPlace,
} = require('./lib/importExportSecurity');
import { TAPi18n } from '/imports/i18n';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { 
  formatDateTime, 
  formatDate, 
  formatTime, 
  getISOWeek, 
  isValidDate, 
  isBefore, 
  isAfter, 
  isSame, 
  add, 
  subtract, 
  startOf, 
  endOf, 
  format, 
  parseDate, 
  now, 
  createDate, 
  fromNow, 
  calendar 
} from '/imports/lib/dateUtils';

//const stringify = require('csv-stringify');

//const stringify = require('csv-stringify');

// Write a chunk to the HTTP response, pausing on backpressure. #6480: the naive
// `res.once('drain', resolve); res.once('error', reject)` leaks one 'error'
// listener on the ServerResponse per backpressured write (the 'drain' listener
// self-removes when it fires, but the paired 'error' listener never does), which
// on a large export raised Node's "MaxListenersExceededWarning: 11 error
// listeners added to [ServerResponse]" and left listeners accumulating for the
// life of the socket. Always remove BOTH listeners once either settles.
export function writeWithBackpressure(res, str) {
  return new Promise((resolve, reject) => {
    if (res.write(str)) {
      resolve();
      return;
    }
    const cleanup = () => {
      res.removeListener('drain', onDrain);
      res.removeListener('error', onError);
    };
    const onDrain = () => { cleanup(); resolve(); };
    const onError = err => { cleanup(); reject(err); };
    res.once('drain', onDrain);
    res.once('error', onError);
  });
}

// exporter maybe is broken since Gridfs introduced, add fs and path
export class Exporter {
  constructor(boardId, attachmentId, options = {}) {
    this._boardId = boardId;
    this._attachmentId = attachmentId;
    // #5870: when true, board export omits the base64-encoded attachment file
    // data (metadata is still exported). This lets very large boards export
    // without overflowing V8's max string length in JSON.stringify or loading
    // every attachment buffer into memory at once. Default false (full export).
    this._excludeAttachments = options.excludeAttachments === true;
    // Language used for the anonymized user placeholder word ("user" -> user1,
    // "käyttäjä" -> käyttäjä1). Defaults to English when the caller cannot supply
    // the exporting user's language.
    this._userLanguage = options.userLanguage || 'en';
  }

  async build() {
    await assertExportEnabled();
    const fs = Npm.require('fs');
    const os = Npm.require('os');
    const path = Npm.require('path');

    const byBoard = { boardId: this._boardId };
    // Attachments store the board id under `meta.boardId`, unlike lists,
    // swimlanes, cards and rules which keep a flat `boardId`.
    const byBoardAttachment = { 'meta.boardId': this._boardId };
    const byBoardNoLinked = {
      boardId: this._boardId,
      linkedId: { $in: ['', null] },
    };
    // we do not want to retrieve boardId in related elements
    const noBoardId = {
      fields: {
        boardId: 0,
      },
    };
    const result = {
      _format: 'wekan-board-1.0.0',
    };
    Object.assign(
      result,
      await ReactiveCache.getBoard(this._boardId, {
        fields: {
          stars: 0,
        },
      }),
    );

    // [Old] for attachments we only export IDs and absolute url to original doc
    // [New] Encode attachment to base64

    const getBase64Data = function (doc, callback) {
      let buffer = Buffer.allocUnsafe(0);
      buffer.fill(0);

      // callback has the form function (err, res) {}
      const tmpFile = path.join(
        os.tmpdir(),
        `tmpexport${process.pid}${Math.random()}`,
      );
      const tmpWriteable = fs.createWriteStream(tmpFile);
      const readStream = fs.createReadStream(doc.versions.original.path);
      readStream.on('data', function (chunk) {
        buffer = Buffer.concat([buffer, chunk]);
      });

      readStream.on('error', function () {
        callback(null, null);
      });
      readStream.on('end', function () {
        // done
        fs.unlink(tmpFile, () => {
          //ignored
        });

        callback(null, buffer.toString('base64'));
      });
      readStream.pipe(tmpWriteable);
    };
    const getBase64DataAsync = (doc) => new Promise((resolve, reject) => {
      getBase64Data(doc, (err, res) => err ? reject(err) : resolve(res));
    });
    const byBoardAndAttachment = this._attachmentId
      ? { 'meta.boardId': this._boardId, _id: this._attachmentId }
      : byBoardAttachment;
    const attachmentDocs = await ReactiveCache.getAttachments(byBoardAndAttachment);
    result.attachments = [];
    for (const attachment of attachmentDocs) {
      const attachmentExport = {
        _id: attachment._id,
        cardId: attachment.meta.cardId,
        // `source` distinguishes board-level backgrounds ('board-background')
        // from card attachments on import.
        source: attachment.meta.source,
        //url: FlowRouter.url(attachment.url()),
        name: attachment.name,
        type: attachment.type,
      };
      // #5870: only base64-encode the file when not excluding attachments. The
      // single-attachment path below always includes the file (used to export
      // one attachment), so it is unaffected by this board-level option.
      if (!this._excludeAttachments || this._attachmentId) {
        attachmentExport.file = await getBase64DataAsync(attachment);
      }
      result.attachments.push(attachmentExport);
    }
    //When has a especific valid attachment return the single element
    if (this._attachmentId) {
      return result.attachments.length > 0 ? result.attachments[0] : {};
    }

    result.lists = await ReactiveCache.getLists(byBoard, noBoardId);
    result.cards = await ReactiveCache.getCards(byBoardNoLinked, noBoardId);
    result.swimlanes = await ReactiveCache.getSwimlanes(byBoard, noBoardId);
    result.customFields = await ReactiveCache.getCustomFields(
      { boardIds: this._boardId },
      { fields: { boardIds: 0 } },
    );
    const cardIds = result.cards.map(card => card._id);
    result.comments = await ReactiveCache.getCardComments(
      { cardId: { $in: cardIds } },
      noBoardId,
    );
    result.activities = await ReactiveCache.getActivities(
      {
        $or: [{ boardId: this._boardId }, { cardId: { $in: cardIds } }],
      },
      noBoardId,
    );
    result.rules = await ReactiveCache.getRules(byBoard, noBoardId);
    result.checklists = [];
    result.checklistItems = [];
    result.subtaskItems = [];
    result.triggers = [];
    result.actions = [];
    for (const card of result.cards) {
      result.checklists.push(
        ...await ReactiveCache.getChecklists({
          cardId: card._id,
        }),
      );
      result.checklistItems.push(
        ...await ReactiveCache.getChecklistItems({
          cardId: card._id,
        }),
      );
      result.subtaskItems.push(
        ...await ReactiveCache.getCards({
          parentId: card._id,
        }),
      );
    }
    for (const rule of result.rules) {
      result.triggers.push(
        ...await ReactiveCache.getTriggers(
          {
            _id: rule.triggerId,
          },
          noBoardId,
        ),
      );
      result.actions.push(
        ...await ReactiveCache.getActions(
          {
            _id: rule.actionId,
          },
          noBoardId,
        ),
      );
    }

    // we also have to export some user data - as the other elements only
    // include id but we have to be careful:
    // 1- only exports users that are linked somehow to that board
    // 2- do not export any sensitive information
    const users = {};
    result.members.forEach((member) => {
      users[member.userId] = true;
    });
    result.lists.forEach((list) => {
      users[list.userId] = true;
    });
    result.cards.forEach((card) => {
      users[card.userId] = true;
      if (card.members) {
        card.members.forEach((memberId) => {
          users[memberId] = true;
        });
      }
    });
    result.comments.forEach((comment) => {
      users[comment.userId] = true;
    });
    result.activities.forEach((activity) => {
      users[activity.userId] = true;
    });
    result.checklists.forEach((checklist) => {
      users[checklist.userId] = true;
    });
    const byUserIds = {
      _id: {
        $in: Object.getOwnPropertyNames(users),
      },
    };
    // we use whitelist to be sure we do not expose inadvertently
    // some secret fields that gets added to User later.
    const userFields = {
      fields: {
        _id: 1,
        username: 1,
        'profile.fullname': 1,
        'profile.initials': 1,
        'profile.avatarUrl': 1,
      },
    };
    // Export the original members with their username + fullname + initials + avatar,
    // but NEVER any secret (the whitelist above already excludes passwords, emails and
    // services). For each member whose avatar is a LOCAL WeKan file, embed the file
    // itself as base64 so the original picture round-trips through export/import without
    // the identity provider — this reads a local file (no outbound fetch), so it works
    // inside a Sandstorm grain too, letting a board with many already-stored avatars be
    // exported and re-imported with every member's picture intact.
    const security = await getImportExportSecuritySettings();
    const usersRaw = await ReactiveCache.getUsers(byUserIds, userFields);
    result.users = [];
    for (const user of usersRaw) {
      if (security.disableExportAvatars) {
        // Admin Panel / Features / Security: never carry avatars out of WeKan.
        if (user.profile) delete user.profile.avatarUrl;
      } else {
        const localUrl = ((user.profile || {}).avatarUrl) || '';
        const m = localUrl.match(/\/(?:cdn\/storage\/avatars|cfs\/files\/avatars)\/([^/?#]+)/);
        if (m && m[1]) {
          const avatar = await ReactiveCache.getAvatar(m[1]);
          if (avatar && avatar.versions && avatar.versions.original && avatar.versions.original.path) {
            const file = await getBase64DataAsync(avatar);
            if (file) {
              user.profile = user.profile || {};
              user.profile.avatarFile = file;
              user.profile.avatarFileName = avatar.name;
              user.profile.avatarFileType = avatar.type;
            }
          }
        }
        // user avatar is stored as a relative url, we export absolute (kept as a fallback
        // reference; the embedded avatarFile above is the authoritative copy on import).
        if ((user.profile || {}).avatarUrl) {
          user.profile.avatarUrl = FlowRouter.url(user.profile.avatarUrl);
        }
      }
      result.users.push(user);
    }
    if (security.anonymizeExportUsers) {
      // Replace every exported user's identity (username/fullname/initials, and any
      // avatar) with counter placeholders, and rewrite @username mentions + the
      // requestedBy/assignedBy free-text fields in card and comment content.
      const word = anonymizedUserWord(this._userLanguage);
      const map = buildUserAnonymizationMap(result.users, word);
      result.users.forEach(u => anonymizeUserDoc(u, map));
      anonymizeBoardTextInPlace(result, map.byUsername);
    }
    return result;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Streaming board export.
  //
  // build() assembles the ENTIRE board — every card, comment, activity,
  // checklist, and base64-encoded attachment — into one object and then
  // JSON.stringify's it. For a board with thousands of cards or a multi-GB
  // attachment that peaks at gigabytes of RAM and can blow V8's max string
  // length. buildStream() instead writes the same JSON document straight to the
  // HTTP response, a document at a time from raw Mongo cursors, and encodes each
  // attachment file to base64 in 3-byte-aligned chunks — so peak memory stays
  // flat regardless of board size. The output is byte-for-byte the same shape
  // build() produces (same `_format`, same keys), so import round-trips.
  //
  // Only used for the full board export (no single-attachment id); the
  // single-attachment path stays on build() since it returns one small object.
  // ───────────────────────────────────────────────────────────────────────────
  async buildStream(res) {
    await assertExportEnabled();
    const fs = Npm.require('fs');
    // Static requires only — Meteor's bundler cannot resolve a dynamic
    // require(`/models/${name}`) path.
    const cardsRaw = require('/models/cards').default.rawCollection();
    const listsRaw = require('/models/lists').default.rawCollection();
    const swimlanesRaw = require('/models/swimlanes').default.rawCollection();
    const customFieldsRaw = require('/models/customFields').default.rawCollection();
    const cardCommentsRaw = require('/models/cardComments').default.rawCollection();
    const activitiesRaw = require('/models/activities').default.rawCollection();
    const checklistsRaw = require('/models/checklists').default.rawCollection();
    const checklistItemsRaw = require('/models/checklistItems').default.rawCollection();
    const rulesRaw = require('/models/rules').default.rawCollection();
    const triggersRaw = require('/models/triggers').default.rawCollection();
    const actionsRaw = require('/models/actions').default.rawCollection();
    const usersRaw = require('/models/users').default.rawCollection();
    const attachmentsRaw = require('/models/attachments').default.collection.rawCollection();

    // write-with-backpressure: pause when the socket buffer is full.
    const w = str => writeWithBackpressure(res, str);

    const noBoardId = { projection: { boardId: 0 } };
    const boardId = this._boardId;
    const userIds = new Set();
    const cardIds = [];

    const security = await getImportExportSecuritySettings();

    // Anonymization pre-scan: card/comment text is streamed BEFORE the users[]
    // array, so to rewrite @username mentions we must know the anonymized labels
    // up front. Collect every referenced userId (small projections only, so peak
    // memory stays bounded — attachments are never loaded here), then build the
    // same deterministic map the users[] emission uses at the end.
    let anonMap = null;
    if (security.anonymizeExportUsers) {
      const preUserIds = new Set();
      const board0 = await ReactiveCache.getBoard(boardId, { fields: { members: 1 } });
      (board0.members || []).forEach(m => preUserIds.add(m.userId));
      const preCardIds = [];
      for await (const d of cardsRaw.find({ boardId, linkedId: { $in: ['', null] } }, { projection: { _id: 1, userId: 1, members: 1 } })) {
        preCardIds.push(d._id);
        if (d.userId) preUserIds.add(d.userId);
        (d.members || []).forEach(id => preUserIds.add(id));
      }
      for await (const d of listsRaw.find({ boardId }, { projection: { userId: 1 } })) { if (d.userId) preUserIds.add(d.userId); }
      for await (const d of cardCommentsRaw.find({ cardId: { $in: preCardIds } }, { projection: { userId: 1 } })) { if (d.userId) preUserIds.add(d.userId); }
      for await (const d of activitiesRaw.find({ $or: [{ boardId }, { cardId: { $in: preCardIds } }] }, { projection: { userId: 1, memberId: 1 } })) { if (d.userId) preUserIds.add(d.userId); if (d.memberId) preUserIds.add(d.memberId); }
      for await (const d of checklistsRaw.find({ cardId: { $in: preCardIds } }, { projection: { userId: 1 } })) { if (d.userId) preUserIds.add(d.userId); }
      const preUsers = await usersRaw
        .find({ _id: { $in: Array.from(preUserIds).filter(Boolean) } }, { projection: { _id: 1, username: 1 } })
        .toArray();
      anonMap = buildUserAnonymizationMap(preUsers, anonymizedUserWord(this._userLanguage));
    }

    // Stream one collection's docs out as a JSON array value `"key":[ … ]`.
    const streamArray = async (key, rawColl, selector, options = noBoardId, onDoc) => {
      await w(`,${JSON.stringify(key)}:[`);
      const cursor = rawColl.find(selector, options);
      let i = 0;
      for await (const doc of cursor) {
        if (onDoc) onDoc(doc);
        await w((i++ ? ',' : '') + JSON.stringify(doc));
      }
      await w(']');
      return i;
    };

    // Open the object with the board's own fields + _format (board data is small).
    const board = await ReactiveCache.getBoard(boardId, { fields: { stars: 0 } });
    (board.members || []).forEach(m => userIds.add(m.userId));
    const boardJson = JSON.stringify({ _format: 'wekan-board-1.0.0', ...board });
    await w(boardJson.slice(0, -1)); // drop the trailing '}' to keep the object open

    // Attachments — file bytes streamed as base64 in aligned chunks.
    await w(`,"attachments":[`);
    {
      const cursor = attachmentsRaw.find({ 'meta.boardId': boardId });
      let i = 0;
      for await (const att of cursor) {
        const head = {
          _id: att._id,
          cardId: att.meta && att.meta.cardId,
          source: att.meta && att.meta.source,
          name: att.name,
          type: att.type,
        };
        // Open this attachment object; append "file" streamed if included.
        const headJson = JSON.stringify(head);
        await w((i++ ? ',' : '') + (this._excludeAttachments ? headJson : headJson.slice(0, -1)));
        if (!this._excludeAttachments) {
          await w(',"file":"');
          const filePath = att.versions && att.versions.original && att.versions.original.path;
          if (filePath && fs.existsSync(filePath)) {
            await new Promise((resolve, reject) => {
              const rs = fs.createReadStream(filePath);
              let leftover = Buffer.alloc(0);
              rs.on('data', chunk => {
                rs.pause();
                // Emit the 3-byte-aligned base64 prefix; carry 0-2 bytes over.
                const r = encodeAligned(leftover, chunk);
                leftover = r.leftover;
                (r.piece ? w(r.piece) : Promise.resolve()).then(() => rs.resume(), reject);
              });
              rs.on('end', () => {
                const tail = encodeFinal(leftover);
                (tail ? w(tail) : Promise.resolve()).then(resolve, reject);
              });
              rs.on('error', reject);
            });
          }
          await w('"}');
        }
      }
    }
    await w(']');

    // Lists / swimlanes / custom fields (bounded, but streamed uniformly).
    await streamArray('lists', listsRaw, { boardId }, noBoardId, d => userIds.add(d.userId));
    await streamArray('swimlanes', swimlanesRaw, { boardId });
    await streamArray('customFields', customFieldsRaw, { boardIds: boardId }, { projection: { boardIds: 0 } });

    // Cards (non-linked, like build()) — collect ids + userIds as we go, and
    // (when anonymizing) rewrite @mentions + requestedBy/assignedBy in each card.
    await streamArray('cards', cardsRaw, { boardId, linkedId: { $in: ['', null] } }, noBoardId, d => {
      cardIds.push(d._id);
      userIds.add(d.userId);
      (d.members || []).forEach(id => userIds.add(id));
      if (anonMap) anonymizeBoardTextInPlace({ cards: [d] }, anonMap.byUsername);
    });

    // Everything keyed by the card ids we just streamed.
    await streamArray('comments', cardCommentsRaw, { cardId: { $in: cardIds } }, noBoardId, d => {
      userIds.add(d.userId);
      if (anonMap) anonymizeBoardTextInPlace({ comments: [d] }, anonMap.byUsername);
    });
    await streamArray('activities', activitiesRaw, { $or: [{ boardId }, { cardId: { $in: cardIds } }] }, noBoardId, d => userIds.add(d.userId));
    await streamArray('checklists', checklistsRaw, { cardId: { $in: cardIds } }, {}, d => userIds.add(d.userId));
    await streamArray('checklistItems', checklistItemsRaw, { cardId: { $in: cardIds } }, {});
    await streamArray('subtaskItems', cardsRaw, { parentId: { $in: cardIds } }, {});

    // Rules + their triggers/actions.
    const ruleTriggerIds = [];
    const ruleActionIds = [];
    await streamArray('rules', rulesRaw, { boardId }, noBoardId, d => { if (d.triggerId) ruleTriggerIds.push(d.triggerId); if (d.actionId) ruleActionIds.push(d.actionId); });
    await streamArray('triggers', triggersRaw, { _id: { $in: ruleTriggerIds } }, noBoardId);
    await streamArray('actions', actionsRaw, { _id: { $in: ruleActionIds } }, noBoardId);

    // Users last, once every referenced id has been collected. Only safe fields
    // (username, fullname, initials, avatarUrl) — never passwords, emails or services.
    // Each member whose avatar is a LOCAL WeKan file also carries the file itself as
    // base64, so the original picture round-trips through export/import (and, since it
    // reads a local file with no outbound fetch, works inside a Sandstorm grain).
    await w(`,"users":[`);
    {
      const avatarsRaw = require('/models/avatars').default.collection.rawCollection();
      const cursor = usersRaw.find(
        { _id: { $in: Array.from(userIds).filter(Boolean) } },
        { projection: { _id: 1, username: 1, 'profile.fullname': 1, 'profile.initials': 1, 'profile.avatarUrl': 1 } },
      );
      let i = 0;
      for await (const user of cursor) {
        if (security.disableExportAvatars) {
          // Admin Panel / Features / Security: never carry avatars out of WeKan.
          if (user.profile) delete user.profile.avatarUrl;
        } else {
          const localUrl = (user.profile && user.profile.avatarUrl) || '';
          const m = localUrl.match(/\/(?:cdn\/storage\/avatars|cfs\/files\/avatars)\/([^/?#]+)/);
          if (m && m[1]) {
            const avatar = await avatarsRaw.findOne({ _id: m[1] });
            const p = avatar && avatar.versions && avatar.versions.original && avatar.versions.original.path;
            if (p) {
              try {
                const buf = fs.readFileSync(p);
                user.profile = user.profile || {};
                user.profile.avatarFile = buf.toString('base64');
                user.profile.avatarFileName = avatar.name;
                user.profile.avatarFileType = avatar.type;
              } catch (e) { /* unreadable avatar file — export URL only */ }
            }
          }
          if (user.profile && user.profile.avatarUrl) {
            user.profile.avatarUrl = FlowRouter.url(user.profile.avatarUrl);
          }
        }
        // Anonymize identity (and drop any avatar) using the pre-scan map.
        if (anonMap) anonymizeUserDoc(user, anonMap);
        await w((i++ ? ',' : '') + JSON.stringify(user));
      }
    }
    await w(']');

    await w('}'); // close the board object
  }

  async buildCsv(userDelimiter = ',', userLanguage='en') {
    const result = await this.build();
    const columnHeaders = [];
    const cardRows = [];

    const papaconfig = {
      quotes: true,
      quoteChar: '"',
      escapeChar: '"',
      delimiter: userDelimiter,
      header: true,
      newline: "\r\n",
      skipEmptyLines: false,
      escapeFormulae: true,
    };

    columnHeaders.push(
      TAPi18n.__('title','',userLanguage),
      TAPi18n.__('description','',userLanguage),
      TAPi18n.__('list','',userLanguage),
      TAPi18n.__('swimlane','',userLanguage),
      TAPi18n.__('owner','',userLanguage),
      TAPi18n.__('requested-by','',userLanguage),
      TAPi18n.__('assigned-by','',userLanguage),
      TAPi18n.__('members','',userLanguage),
      TAPi18n.__('assignee','',userLanguage),
      TAPi18n.__('labels','',userLanguage),
      TAPi18n.__('card-start','',userLanguage),
      TAPi18n.__('card-due','',userLanguage),
      TAPi18n.__('card-end','',userLanguage),
      TAPi18n.__('overtime-hours','',userLanguage),
      TAPi18n.__('spent-time-hours','',userLanguage),
      TAPi18n.__('createdAt','',userLanguage),
      TAPi18n.__('last-modified-at','',userLanguage),
      TAPi18n.__('last-activity','',userLanguage),
      TAPi18n.__('voting','',userLanguage),
      TAPi18n.__('archived','',userLanguage),
    );
    const customFieldMap = {};
    let i = 0;
    result.customFields.forEach((customField) => {
      customFieldMap[customField._id] = {
        position: i,
        type: customField.type,
      };
      if (customField.type === 'dropdown') {
        let options = '';
        customField.settings.dropdownItems.forEach((item) => {
          options = options === '' ? item.name : `${`${options}/${item.name}`}`;
        });
        columnHeaders.push(
          `CustomField-${customField.name}-${customField.type}-${options}`,
        );
      } else if (customField.type === 'currency') {
        columnHeaders.push(
          `CustomField-${customField.name}-${customField.type}-${customField.settings.currencyCode}`,
        );
      } else {
        columnHeaders.push(
          `CustomField-${customField.name}-${customField.type}`,
        );
      }
      i++;
    });
    //cardRows.push([[columnHeaders]]);
    cardRows.push(columnHeaders);

    result.cards.forEach((card) => {
      // #5604: build the row via a null-safe helper so a card that references a
      // deleted list/swimlane/owner/member/assignee/label/customField exports a
      // blank cell instead of crashing the whole export with
      // "Cannot read property 'title' of undefined".
      const currentRow = buildCsvCardRow(card, result, customFieldMap);
      //cardRows.push([[currentRow]]);
      cardRows.push(currentRow);
    });

    return Papa.unparse(cardRows, papaconfig);
  }

  // Streaming CSV/TSV export. buildCsv() calls build(), which loads the ENTIRE
  // board — including every base64 attachment — into memory just to emit card
  // rows. buildCsvStream() instead keeps only the small lookup tables (lists,
  // swimlanes, custom fields, labels, referenced users) in memory and streams
  // the cards from a raw cursor, writing one CSV row at a time to `res`. Two
  // cheap passes over the card cursor: pass 1 collects referenced user ids
  // (strings only), pass 2 writes rows. Output matches buildCsv() exactly.
  async buildCsvStream(res, userDelimiter = ',', userLanguage = 'en') {
    const cardsRaw = require('/models/cards').default.rawCollection();
    const cardSelector = { boardId: this._boardId, linkedId: { $in: ['', null] } };

    const board = await ReactiveCache.getBoard(this._boardId);
    const lookup = {
      lists: await ReactiveCache.getLists({ boardId: this._boardId }),
      swimlanes: await ReactiveCache.getSwimlanes({ boardId: this._boardId }),
      customFields: await ReactiveCache.getCustomFields({ boardIds: this._boardId }),
      labels: (board && board.labels) || [],
      users: [],
    };

    const papaconfig = {
      quotes: true, quoteChar: '"', escapeChar: '"', delimiter: userDelimiter,
      header: false, newline: '\r\n', skipEmptyLines: false, escapeFormulae: true,
    };
    const w = str => writeWithBackpressure(res, str);
    const writeRow = row => w(Papa.unparse([row], papaconfig) + papaconfig.newline);

    // Header row + custom-field columns (same order as buildCsv).
    const columnHeaders = [
      'title','description','list','swimlane','owner','requested-by','assigned-by',
      'members','assignee','labels','card-start','card-due','card-end','overtime-hours',
      'spent-time-hours','createdAt','last-modified-at','last-activity','voting','archived',
    ].map(k => TAPi18n.__(k, '', userLanguage));
    const customFieldMap = {};
    lookup.customFields.forEach((cf, i) => {
      customFieldMap[cf._id] = { position: i, type: cf.type };
      if (cf.type === 'dropdown') {
        let options = '';
        cf.settings.dropdownItems.forEach(item => { options = options === '' ? item.name : `${options}/${item.name}`; });
        columnHeaders.push(`CustomField-${cf.name}-${cf.type}-${options}`);
      } else if (cf.type === 'currency') {
        columnHeaders.push(`CustomField-${cf.name}-${cf.type}-${cf.settings.currencyCode}`);
      } else {
        columnHeaders.push(`CustomField-${cf.name}-${cf.type}`);
      }
    });
    await writeRow(columnHeaders);

    // Pass 1 — collect referenced user ids (ids only, cheap).
    const userIds = new Set();
    {
      const cursor = cardsRaw.find(cardSelector, { projection: { userId: 1, members: 1, assignees: 1, vote: 1 } });
      for await (const c of cursor) {
        if (c.userId) userIds.add(c.userId);
        (c.members || []).forEach(id => userIds.add(id));
        (c.assignees || []).forEach(id => userIds.add(id));
        if (c.vote) { (c.vote.positive || []).forEach(id => userIds.add(id)); (c.vote.negative || []).forEach(id => userIds.add(id)); }
      }
    }
    lookup.users = await ReactiveCache.getUsers(
      { _id: { $in: Array.from(userIds).filter(Boolean) } },
      { fields: { _id: 1, username: 1 } },
    );

    // Pass 2 — stream one row per card.
    {
      const cursor = cardsRaw.find(cardSelector);
      for await (const card of cursor) {
        await writeRow(buildCsvCardRow(card, lookup, customFieldMap));
      }
    }
  }

  async canExport(user) {
    const board = await ReactiveCache.getBoard(this._boardId);
    return board && board.isVisibleBy(user);
  }
}
