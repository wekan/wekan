import { ReactiveCache } from '/imports/reactiveCache';
const Papa = require('papaparse');
const { buildCsvCardRow } = require('./lib/exporterCsvRow');
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
  }

  async build() {
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
    result.users = (await ReactiveCache.getUsers(byUserIds, userFields))
      .map((user) => {
        // user avatar is stored as a relative url, we export absolute
        if ((user.profile || {}).avatarUrl) {
          user.profile.avatarUrl = FlowRouter.url(user.profile.avatarUrl);
        }
        return user;
      });
    return result;
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

  async canExport(user) {
    const board = await ReactiveCache.getBoard(this._boardId);
    return board && board.isVisibleBy(user);
  }
}
