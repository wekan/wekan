import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import Actions from '/models/actions';
import Activities from '/models/activities';
import Attachments from '/models/attachments';
import Boards from '/models/boards';
import { BOARD_COLORS, CARD_COLORS, SWIMLANE_COLORS } from '/models/metadata/colors';
import Users from '/models/users';
import { generateUniversalAttachmentUrl } from '/models/lib/universalUrlGenerator';
import { planImportedBoardMember } from '/models/lib/importedBoardMemberPlan';
import { importedCardDates } from '/models/lib/importedCardDates';
import {
  getImportExportSecuritySettings,
  anonymizedUserWord,
  buildUserAnonymizationMap,
  anonymizeUserDoc,
  anonymizeBoardTextInPlace,
} from '/models/lib/importExportSecurity';
import CardComments from '/models/cardComments';
import Cards from '/models/cards';
import ChecklistItems from '/models/checklistItems';
import Checklists from '/models/checklists';
import CustomFields from './customFields';
import Lists from '/models/lists';
import Rules from '/models/rules';
import Swimlanes from '/models/swimlanes';
import Triggers from '/models/triggers';
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
import getSlug from 'limax';
import { validateAttachmentUrl } from './lib/attachmentUrlValidation';

const DateString = Match.Where(function(dateAsString) {
  check(dateAsString, String);
  return isValidDate(new Date(dateAsString));
});

export class WekanCreator {
  constructor(data) {
    // we log current date, to use the same timestamp for all our actions.
    // this helps to retrieve all elements performed by the same import.
    this._nowDate = new Date();
    // The object creation dates, indexed by Wekan id
    // (so we only parse actions once!)
    this.createdAt = {
      board: null,
      cards: {},
      lists: {},
      swimlanes: {},
      customFields: {},
    };
    // The object creator Wekan Id, indexed by the object Wekan id
    // (so we only parse actions once!)
    this.createdBy = {
      cards: {}, // only cards have a field for that
    };

    // Map of labels Wekan ID => Wekan ID
    this.labels = {};
    // Map of swimlanes Wekan ID => Wekan ID
    this.swimlanes = {};
    // Map of lists Wekan ID => Wekan ID
    this.lists = {};
    // Map of cards Wekan ID => Wekan ID
    this.cards = {};
    // Map of custom fields Wekan ID => Wekan ID
    this.customFields = {};
    // Map of comments Wekan ID => Wekan ID
    this.commentIds = {};
    // Map of attachments Wekan ID => Wekan ID
    this.attachmentIds = {};
    // Map of checklists Wekan ID => Wekan ID
    this.checklists = {};
    // Map of checklistItems Wekan ID => Wekan ID
    this.checklistItems = {};
    // The comments, indexed by Wekan card id (to map when importing cards)
    this.comments = {};
    // Map of rules Wekan ID => Wekan ID
    this.rules = {};
    // the members, indexed by Wekan member id => Wekan user ID
    this.members = data.membersMapping ? data.membersMapping : {};
    // Map of triggers Wekan ID => Wekan ID
    this.triggers = {};
    // Map of actions Wekan ID => Wekan ID
    this.actions = {};

    // maps a wekanCardId to an array of wekanAttachments
    this.attachments = {};

    // default swimlane id created during import if necessary
    this._defaultSwimlaneId = null;

    // first list created during import, used as a fallback target for cards
    // whose listId points at a list missing from the export (dangling ref)
    this._defaultListId = null;

    // Normalize possible exported id fields: some exports may use `id` instead of `_id`.
    // Ensure every item we rely on has an `_id` so mappings work consistently.
    const normalizeIds = arr => {
      if (!arr) return;
      arr.forEach(item => {
        if (item && item.id && !item._id) {
          item._id = item.id;
        }
      });
    };

    normalizeIds(data.lists);
    normalizeIds(data.cards);
    normalizeIds(data.swimlanes);
    normalizeIds(data.checklists);
    normalizeIds(data.checklistItems);
    normalizeIds(data.triggers);
    normalizeIds(data.actions);
    normalizeIds(data.labels);
    normalizeIds(data.customFields);
    normalizeIds(data.comments);
    normalizeIds(data.activities);
    normalizeIds(data.rules);
  }

  /**
   * If dateString is provided,
   * return the Date it represents.
   * If not, will return the date when it was first called.
   * This is useful for us, as we want all import operations to
   * have the exact same date for easier later retrieval.
   *
   * @param {String} dateString a properly formatted Date
   */
  _now(dateString) {
    if (dateString) {
      return new Date(dateString);
    }
    if (!this._nowDate) {
      this._nowDate = new Date();
    }
    return this._nowDate;
  }

  /**
   * if wekanUserId is provided and we have a mapping,
   * return it.
   * Otherwise return current logged user.
   * @param wekanUserId
   * @private
   */
  _user(wekanUserId) {
    if (wekanUserId && this.members[wekanUserId]) {
      return this.members[wekanUserId];
    }
    return Meteor.userId();
  }

  checkActivities(wekanActivities) {
    check(wekanActivities, [
      Match.ObjectIncluding({
        activityType: String,
        createdAt: DateString,
      }),
    ]);
    // XXX we could perform more thorough checks based on action type
  }

  checkBoard(wekanBoard) {
    check(
      wekanBoard,
      Match.ObjectIncluding({
        archived: Boolean,
        title: String,
        // XXX refine control by validating 'color' against a list of
        // allowed values (is it worth the maintenance?)
        color: String,
        permission: Match.Where(value => {
          return ['private', 'public'].indexOf(value) >= 0;
        }),
      }),
    );
  }

  checkCards(wekanCards) {
    check(wekanCards, [
      Match.ObjectIncluding({
        archived: Boolean,
        dateLastActivity: DateString,
        labelIds: [String],
        title: String,
        sort: Number,
      }),
    ]);
  }

  checkLabels(wekanLabels) {
    check(wekanLabels, [
      Match.ObjectIncluding({
        // XXX refine control by validating 'color' against a list of allowed
        // values (is it worth the maintenance?)
        color: String,
      }),
    ]);
  }

  checkLists(wekanLists) {
    check(wekanLists, [
      Match.ObjectIncluding({
        archived: Boolean,
        title: String,
      }),
    ]);
  }

  checkSwimlanes(wekanSwimlanes) {
    check(wekanSwimlanes, [
      Match.ObjectIncluding({
        archived: Boolean,
        title: String,
      }),
    ]);
  }

  checkChecklists(wekanChecklists) {
    check(wekanChecklists, [
      Match.ObjectIncluding({
        cardId: String,
        title: String,
      }),
    ]);
  }

  checkChecklistItems(wekanChecklistItems) {
    check(wekanChecklistItems, [
      Match.ObjectIncluding({
        cardId: String,
        title: String,
      }),
    ]);
  }

  checkRules(wekanRules) {
    check(wekanRules, [
      Match.ObjectIncluding({
        triggerId: String,
        actionId: String,
        title: String,
      }),
    ]);
  }

  checkTriggers(wekanTriggers) {
    // XXX More check based on trigger type
    check(wekanTriggers, [
      Match.ObjectIncluding({
        activityType: String,
        desc: String,
      }),
    ]);
  }

  async getMembersToMap(data) {
    // we will work on the list itself (an ordered array of objects) when a
    // mapping is done, we add a 'wekan' field to the object representing the
    // imported member
    const membersToMap = data.members || [];
    const users = data.users || [];
    // auto-map based on username
    const mappable = [];
    for (const importedMember of membersToMap) {
      importedMember.id = importedMember.userId;
      delete importedMember.userId;
      const user = users.filter(user => {
        return user._id === importedMember.id;
      })[0];
      // Skip dangling user references (e.g. a board member whose account was
      // deleted): the export only includes users that still exist, so `user`
      // can be undefined here. Dereferencing it would throw and abort import.
      if (!user) {
        continue;
      }
      if (user.profile && user.profile.fullname) {
        importedMember.fullName = user.profile.fullname;
      }
      importedMember.username = user.username;
      const wekanUser = await ReactiveCache.getUser({ username: importedMember.username });
      if (wekanUser) {
        importedMember.wekanId = wekanUser._id;
      }
      mappable.push(importedMember);
    }
    return mappable;
  }

  checkActions(wekanActions) {
    // XXX More check based on action type
    check(wekanActions, [
      Match.ObjectIncluding({
        actionType: String,
        desc: String,
      }),
    ]);
  }

  // You must call parseActions before calling this one.
  async createBoardAndLabels(boardToImport) {
    const boardToCreate = {
      archived: boardToImport.archived,
      // Imported exports may carry a non-WeKan/legacy color (e.g. Trello's
      // 'bgnone'); fall back to the default so collection2 validation does not
      // reject the whole board insert.
      color: BOARD_COLORS.includes(boardToImport.color)
        ? boardToImport.color
        : BOARD_COLORS[0],
      // very old boards won't have a creation activity so no creation date
      createdAt: this._now(boardToImport.createdAt),
      labels: [],
      members: [
        {
          userId: Meteor.userId(),
          wekanId: Meteor.userId(),
          isActive: true,
          isAdmin: true,
          isNoComments: false,
          isCommentOnly: false,
          swimlaneId: false,
        },
      ],
      presentParentTask: boardToImport.presentParentTask,
      // #3392: carry over the "Red Strings" dependency-overlay toggle.
      showDependencies: boardToImport.showDependencies || false,
      // #6409: carry over the board's list-width scope (Shared vs Personal) and
      // the shared auto-width mode so imported boards keep the same behaviour.
      // Per-list widths themselves are restored from each list's `width` in
      // createLists().
      allowsPersonalListWidth: !!boardToImport.allowsPersonalListWidth,
      autoWidth: !!boardToImport.autoWidth,
      // Standalone Export has modifiedAt missing, adding modifiedAt to fix it
      modifiedAt: this._now(boardToImport.modifiedAt),
      permission: boardToImport.permission,
      slug: getSlug(boardToImport.title) || 'board',
      stars: 0,
      title: await Boards.uniqueTitle(boardToImport.title),
    };
    // Carry over an external background image URL. Stored backgrounds (with a
    // backgroundImageId) are re-created and re-pointed in recreateBackgrounds().
    if (boardToImport.backgroundImageURL && !boardToImport.backgroundImageId) {
      boardToCreate.backgroundImageURL = boardToImport.backgroundImageURL;
    }
    // now add other members. Without an explicit (deliberate, later) mapping we keep
    // each ORIGINAL member: the placeholder created in createPlaceholderUsers reuses the
    // original _id, so use wekanId if a mapping exists, else the original id. Imported
    // members are added inactive and non-admin so they are visible in the board's member
    // list but hold no permissions until reconciled — a wrong/auto mapping must never
    // silently grant board access. The importer stays the sole active admin.
    if (boardToImport.members) {
      const importerId = Meteor.userId();
      boardToImport.members.forEach(wekanMember => {
        const entry = planImportedBoardMember(wekanMember, importerId);
        if (entry && !boardToCreate.members.some(member => member.wekanId === entry.wekanId)) {
          boardToCreate.members.push(entry);
        }
      });
    }

    if (boardToImport.labels) {
      boardToImport.labels.forEach(label => {
        const labelToCreate = {
          _id: Random.id(6),
          color: label.color,
          name: label.name,
        };
        // We need to remember them by Wekan ID, as this is the only ref we have
        // when importing cards.
        this.labels[label._id] = labelToCreate._id;
        boardToCreate.labels.push(labelToCreate);
      });
    }

    const boardId = await Boards.direct.insertAsync(boardToCreate);
    await Boards.direct.updateAsync(boardId, {
      $set: {
        modifiedAt: this._now(),
      },
    });
    // log activity
    await Activities.direct.insertAsync({
      activityType: 'importBoard',
      boardId,
      createdAt: this._now(),
      source: {
        id: boardToImport.id,
        system: 'Wekan',
      },
      // We attribute the import to current user,
      // not the author from the original object.
      userId: this._user(),
    });
    return boardId;
  }

  /**
   * Create the Wekan cards corresponding to the supplied Wekan cards,
   * as well as all linked data: activities, comments, and attachments
   * @param wekanCards
   * @param boardId
   * @returns {Array}
   */
  async createCards(wekanCards, boardId) {
    const result = [];
    // .direct.insertAsync below bypasses the before.insert hook that normally
    // assigns cardNumber, so we must handle the number ourselves: preserve the
    // number from the export when present, otherwise allocate a fresh one.
    const boardObj = await ReactiveCache.getBoard(boardId);
    for (const card of wekanCards) {
      // A card whose listId points at a list missing from the export (a
      // dangling reference) would otherwise be inserted with an undefined
      // listId and never render. Fall back to the first imported list, and if
      // the export had no lists at all, create one default list to hold them.
      let listId = this.lists[card.listId] || this._defaultListId;
      if (!listId) {
        listId = await this._createDefaultList(boardId);
      }
      // #1992: restore every card date carried in the export. createdAt
      // prefers the export's createCard activity but falls back to the
      // card's own createdAt (Sandstorm and old/pruned exports have no
      // createCard activity, which used to reset the creation date to the
      // import time); receivedAt and endAt were previously dropped entirely.
      const cardDates = importedCardDates(
        card,
        this.createdAt.cards[card._id],
        this._now(),
      );
      const cardToCreate = {
        archived: card.archived,
        boardId,
        cardNumber: card.cardNumber || (await boardObj.getNextCardNumber()),
        createdAt: cardDates.createdAt,
        dateLastActivity: this._now(),
        description: card.description,
        listId,
        swimlaneId: this.swimlanes[card.swimlaneId] || this._defaultSwimlaneId,
        sort: card.sort,
        title: card.title,
        // we attribute the card to its creator if available: the createCard
        // activity's author when present, else the userId stored on the
        // exported card itself (again, Sandstorm/old exports lack activities).
        userId: this._user(this.createdBy.cards[card._id] || card.userId),
        isOvertime: card.isOvertime || false,
        receivedAt: cardDates.receivedAt,
        startAt: cardDates.startAt,
        dueAt: cardDates.dueAt,
        endAt: cardDates.endAt,
        spentTime: card.spentTime || null,
      };
      // add labels
      if (card.labelIds) {
        cardToCreate.labelIds = card.labelIds.map(wekanId => {
          return this.labels[wekanId];
        });
      }
      // add members {
      if (card.members) {
        const wekanMembers = [];
        // we can't just map, as some members may not have been mapped
        card.members.forEach(sourceMemberId => {
          if (this.members[sourceMemberId]) {
            const wekanId = this.members[sourceMemberId];
            // we may map multiple Wekan members to the same wekan user
            // in which case we risk adding the same user multiple times
            if (!wekanMembers.find(wId => wId === wekanId)) {
              wekanMembers.push(wekanId);
            }
          }
          return true;
        });
        if (wekanMembers.length > 0) {
          cardToCreate.members = wekanMembers;
        }
      }
      // add assignees
      if (card.assignees) {
        const wekanAssignees = [];
        // we can't just map, as some members may not have been mapped
        card.assignees.forEach(sourceMemberId => {
          if (this.members[sourceMemberId]) {
            const wekanId = this.members[sourceMemberId];
            // we may map multiple Wekan members to the same wekan user
            // in which case we risk adding the same user multiple times
            if (!wekanAssignees.find(wId => wId === wekanId)) {
              wekanAssignees.push(wekanId);
            }
          }
          return true;
        });
        if (wekanAssignees.length > 0) {
          cardToCreate.assignees = wekanAssignees;
        }
      }
      // set color (only if it is a recognized card color, so an out-of-range
      // value from a foreign/old export cannot fail collection2 validation)
      if (card.color && CARD_COLORS.includes(card.color)) {
        cardToCreate.color = card.color;
      }

      // add custom fields
      if (card.customFields) {
        cardToCreate.customFields = card.customFields.map(field => {
          return {
            _id: this.customFields[field._id],
            value: field.value,
          };
        });
      }

      // insert card
      const cardId = await Cards.direct.insertAsync(cardToCreate);
      // keep track of Wekan id => Wekan id
      this.cards[card._id] = cardId;
      // // log activity
      // Activities.direct.insert({
      //   activityType: 'importCard',
      //   boardId,
      //   cardId,
      //   createdAt: this._now(),
      //   listId: cardToCreate.listId,
      //   source: {
      //     id: card._id,
      //     system: 'Wekan',
      //   },
      //   // we attribute the import to current user,
      //   // not the author of the original card
      //   userId: this._user(),
      // });
      // add comments
      const comments = this.comments[card._id];
      if (comments) {
        for (const comment of comments) {
          const commentToCreate = {
            boardId,
            cardId,
            createdAt: this._now(comment.createdAt),
            text: comment.text,
            // we attribute the comment to the original author, default to current user
            userId: this._user(comment.userId),
          };
          // dateLastActivity will be set from activity insert, no need to
          // update it ourselves
          const commentId = await CardComments.direct.insertAsync(commentToCreate);
          this.commentIds[comment._id] = commentId;
          // Activities.direct.insert({
          //   activityType: 'addComment',
          //   boardId: commentToCreate.boardId,
          //   cardId: commentToCreate.cardId,
          //   commentId,
          //   createdAt: this._now(commentToCreate.createdAt),
          //   // we attribute the addComment (not the import)
          //   // to the original author - it is needed by some UI elements.
          //   userId: commentToCreate.userId,
          // });
        }
      }
      const attachments = this.attachments[card._id];
      const wekanCoverId = card.coverId;
      if (attachments && Meteor.isServer) {
        for (const att of attachments) {
          const meta = { boardId, cardId, source: 'import' };
          const setCover = async newId => {
            if (!newId) return;
            this.attachmentIds[att._id] = newId;
            if (wekanCoverId === att._id) {
              await Cards.direct.updateAsync(cardId, {
                $set: { coverId: newId },
              });
            }
          };
          try {
            if (att.file) {
              // WeKan exports embed attachment bytes as base64. Insert them
              // with the server-side Meteor-Files API writeAsync (insertAsync
              // is client-only; the older Attachments.insert(..., cb, true) call
              // was a no-op on Meteor 3), so exported attachments now import.
              const buffer = Buffer.from(att.file, 'base64');
              const fileRef = await Attachments.writeAsync(
                buffer,
                {
                  fileName: att.name || 'attachment',
                  type: att.type || 'application/octet-stream',
                  userId: this._user(att.userId),
                  meta,
                },
                true,
              );
              await setCover(fileRef && fileRef._id);
            } else if (att.url) {
              const validation = await validateAttachmentUrl(att.url);
              if (!validation.valid) {
                if (process.env.DEBUG === 'true') {
                  console.warn(
                    'Blocked attachment URL during Wekan import:',
                    validation.reason,
                    att.url,
                  );
                }
                // Skip just this attachment (a bare return would abort
                // importing all remaining cards).
                continue;
              }
              const fileRef = await Attachments.loadAsync(
                att.url,
                { meta, fileName: att.name },
                true,
              );
              await setCover(fileRef && fileRef._id);
            }
          } catch (e) {
            if (process.env.DEBUG === 'true') {
              console.warn('Failed to import WeKan attachment', att.name, e && e.message);
            }
            // One failed attachment must not abort the whole import.
          }
        }
      }
      result.push(cardId);
    }
    return result;
  }

  /**
   * Create the Wekan custom fields corresponding to the supplied Wekan
   * custom fields.
   * @param wekanCustomFields
   * @param boardId
   */
  async createCustomFields(wekanCustomFields, boardId) {
    for (const field of wekanCustomFields) {
      const fieldToCreate = {
        boardIds: [boardId],
        name: field.name,
        type: field.type,
        settings: field.settings,
        showOnCard: field.showOnCard,
        showLabelOnMiniCard: field.showLabelOnMiniCard,
        automaticallyOnCard: field.automaticallyOnCard,
        alwaysOnCard: field.alwaysOnCard,
        //use date "now" if now created at date is provided (e.g. for very old boards)
        createdAt: this._now(this.createdAt.customFields[field._id]),
        modifiedAt: field.modifiedAt,
      };
      //insert copy of custom field
      const fieldId = await CustomFields.direct.insertAsync(fieldToCreate);
      //set modified date to now
      await CustomFields.direct.updateAsync(fieldId, {
        $set: {
          modifiedAt: this._now(),
        },
      });
      //store mapping of old id to new id
      this.customFields[field._id] = fieldId;
    }
  }

  // Create labels if they do not exist and load this.labels.
  createLabels(wekanLabels, board) {
    wekanLabels.forEach(label => {
      const color = label.color;
      const name = label.name;
      const existingLabel = board.getLabel(name, color);
      if (existingLabel) {
        this.labels[label.id] = existingLabel._id;
      } else {
        const idLabelCreated = board.pushLabel(name, color);
        this.labels[label.id] = idLabelCreated;
      }
    });
  }

  // Create a single fallback list for cards that have no valid list to live
  // in (export contained no lists, or only dangling listId references).
  async _createDefaultList(boardId) {
    const listId = await Lists.direct.insertAsync({
      archived: false,
      boardId,
      createdAt: this._now(),
      title: 'Default',
      sort: 0,
    });
    await Lists.direct.updateAsync(listId, {
      $set: { updatedAt: this._now() },
    });
    this._defaultListId = listId;
    return listId;
  }

  async createLists(wekanLists, boardId) {
    for (const [listIndex, list] of wekanLists.entries()) {
      const listToCreate = {
        archived: list.archived,
        boardId,
        // We are being defensing here by providing a default date (now) if the
        // creation date wasn't found on the action log. This happen on old
        // Wekan boards (eg from 2013) that didn't log the 'createList' action
        // we require.
        createdAt: this._now(this.createdAt.lists[list.id]),
        title: list.title,
        sort: list.sort ? list.sort : listIndex,
      };
      // #6409: preserve per-list settings that are shared across the board.
      if (typeof list.width === 'number' && list.width >= 100 && list.width <= 1000) {
        listToCreate.width = list.width;
      }
      if (list.color) {
        listToCreate.color = list.color;
      }
      if (typeof list.collapsed === 'boolean') {
        listToCreate.collapsed = list.collapsed;
      }
      const listId = await Lists.direct.insertAsync(listToCreate);
      await Lists.direct.updateAsync(listId, {
        $set: {
          updatedAt: this._now(),
        },
      });
      this.lists[list._id] = listId;
      if (!this._defaultListId) {
        this._defaultListId = listId;
      }
      // // log activity
      // Activities.direct.insert({
      //   activityType: 'importList',
      //   boardId,
      //   createdAt: this._now(),
      //   listId,
      //   source: {
      //     id: list._id,
      //     system: 'Wekan',
      //   },
      //   // We attribute the import to current user,
      //   // not the creator of the original object
      //   userId: this._user(),
      // });
    }
  }

  async createSwimlanes(wekanSwimlanes, boardId) {
    // If no swimlanes provided, create a default so cards still render
    if (!wekanSwimlanes || wekanSwimlanes.length === 0) {
      const swimlaneToCreate = {
        archived: false,
        boardId,
        createdAt: this._now(),
        title: 'Default',
        sort: 0,
      };
      const created = await Swimlanes.direct.insertAsync(swimlaneToCreate);
      await Swimlanes.direct.updateAsync(created, {
        $set: {
          updatedAt: this._now(),
        },
      });
      this._defaultSwimlaneId = created;
      return;
    }

    for (const [swimlaneIndex, swimlane] of wekanSwimlanes.entries()) {
      const swimlaneToCreate = {
        archived: swimlane.archived,
        boardId,
        // We are being defensing here by providing a default date (now) if the
        // creation date wasn't found on the action log. This happen on old
        // Wekan boards (eg from 2013) that didn't log the 'createList' action
        // we require.
        createdAt: this._now(this.createdAt.swimlanes[swimlane._id]),
        title: swimlane.title,
        sort: swimlane.sort ? swimlane.sort : swimlaneIndex,
      };
      // set color (only if it is a recognized swimlane color, so an out-of-range
      // value from a foreign/old export cannot fail collection2 validation)
      if (swimlane.color && SWIMLANE_COLORS.includes(swimlane.color)) {
        swimlaneToCreate.color = swimlane.color;
      }
      const swimlaneId = await Swimlanes.direct.insertAsync(swimlaneToCreate);
      await Swimlanes.direct.updateAsync(swimlaneId, {
        $set: {
          updatedAt: this._now(),
        },
      });
      this.swimlanes[swimlane._id] = swimlaneId;
      if (!this._defaultSwimlaneId) {
        this._defaultSwimlaneId = swimlaneId;
      }
    }
  }

  async createSubtasks(wekanCards) {
    for (const card of wekanCards) {
      // get new id of card (in created / new board)
      const cardIdInNewBoard = this.cards[card._id];

      //If there is a mapped parent card, use the mapped card
      //  this means, the card and parent were in the same source board
      //If there is no mapped parent card, use the original parent id,
      //  this should handle cases where source and parent are in different boards
      //  Note: This can only handle board cloning (within the same wekan instance).
      //        When importing boards between instances the IDs are definitely
      //        lost if source and parent are two different boards
      //        This is not the place to fix it, the entire subtask system needs to be rethought there.
      const parentIdInNewBoard = this.cards[card.parentId]
        ? this.cards[card.parentId]
        : card.parentId;

      //if the parent card exists, proceed
      if (await ReactiveCache.getCard(parentIdInNewBoard)) {
        //set parent id of the card in the new board to the new id of the parent
        await Cards.direct.updateAsync(cardIdInNewBoard, {
          $set: {
            parentId: parentIdInNewBoard,
          },
        });
      }
    }
  }

  // #3392: PI Program Board "Red Strings". Remap each card's cardDependencies
  // from the source card ids to the newly-created card ids, dropping any whose
  // target card was not part of the imported board.
  async createCardDependencies(wekanCards) {
    for (const card of wekanCards) {
      if (!card.cardDependencies || card.cardDependencies.length === 0) {
        continue;
      }
      const newCardId = this.cards[card._id];
      if (!newCardId) {
        continue;
      }
      const remapped = card.cardDependencies
        .map(dep => {
          // Tolerate legacy bare-string entries as well as { cardId, ... }.
          const oldDepId = typeof dep === 'string' ? dep : dep.cardId;
          const newDepId = this.cards[oldDepId];
          if (!newDepId) return null;
          return typeof dep === 'string'
            ? { cardId: newDepId }
            : { ...dep, cardId: newDepId };
        })
        .filter(Boolean);
      if (remapped.length > 0) {
        await Cards.direct.updateAsync(newCardId, {
          $set: { cardDependencies: remapped },
        });
      }
    }
  }

  async createChecklists(wekanChecklists, boardId) {
    const result = [];
    for (const [checklistIndex, checklist] of wekanChecklists.entries()) {
      // Skip orphaned checklists whose card is missing from the export.
      // Otherwise the checklist would be created with an undefined cardId and
      // be unreachable (the same guard createChecklistItems already applies).
      if (!this.cards[checklist.cardId]) {
        continue;
      }
      // Create the checklist
      const checklistToCreate = {
        cardId: this.cards[checklist.cardId],
        // Denormalized boardId; .direct.insert bypasses the before.insert hook
        // that would otherwise derive it, so set it explicitly here.
        boardId,
        title: checklist.title,
        createdAt: checklist.createdAt,
        sort: checklist.sort ? checklist.sort : checklistIndex,
      };
      const checklistId = await Checklists.direct.insertAsync(checklistToCreate);
      this.checklists[checklist._id] = checklistId;
      result.push(checklistId);
    }
    return result;
  }

  async createTriggers(wekanTriggers, boardId) {
    for (const trigger of wekanTriggers) {
      if (trigger.hasOwnProperty('labelId')) {
        trigger.labelId = this.labels[trigger.labelId];
      }
      if (trigger.hasOwnProperty('memberId')) {
        trigger.memberId = this.members[trigger.memberId];
      }
      trigger.boardId = boardId;
      const oldId = trigger._id;
      delete trigger._id;
      this.triggers[oldId] = await Triggers.direct.insertAsync(trigger);
    }
  }

  async createActions(wekanActions, boardId) {
    for (const action of wekanActions) {
      if (action.hasOwnProperty('labelId')) {
        action.labelId = this.labels[action.labelId];
      }
      if (action.hasOwnProperty('memberId')) {
        action.memberId = this.members[action.memberId];
      }
      action.boardId = boardId;
      const oldId = action._id;
      delete action._id;
      this.actions[oldId] = await Actions.direct.insertAsync(action);
    }
  }

  async createRules(wekanRules, boardId) {
    for (const rule of wekanRules) {
      // Create the rule
      rule.boardId = boardId;
      rule.triggerId = this.triggers[rule.triggerId];
      rule.actionId = this.actions[rule.actionId];
      delete rule._id;
      await Rules.direct.insertAsync(rule);
    }
  }

  async createChecklistItems(wekanChecklistItems, boardId) {
    for (const [checklistitemIndex, checklistitem] of wekanChecklistItems.entries()) {
      //Check if the checklist for this item (still) exists
      //If a checklist was deleted, but items remain, the import would error out here
      //Leading to no further checklist items being imported
      if (this.checklists[checklistitem.checklistId]) {
        // Create the checklistItem
        const checklistItemTocreate = {
          title: checklistitem.title,
          checklistId: this.checklists[checklistitem.checklistId],
          cardId: this.cards[checklistitem.cardId],
          boardId,
          sort: checklistitem.sort ? checklistitem.sort : checklistitemIndex,
          isFinished: checklistitem.isFinished,
        };

        const checklistItemId = await ChecklistItems.direct.insertAsync(
          checklistItemTocreate,
        );
        this.checklistItems[checklistitem._id] = checklistItemId;
      }
    }
  }

  parseActivities(wekanBoard) {
    wekanBoard.activities.forEach(activity => {
      switch (activity.activityType) {
        case 'addAttachment': {
          // We have to be cautious, because the attachment could have been removed later.
          // In that case Wekan still reports its addition, but removes its 'url' field.
          // So we test for that
          const wekanAttachment = wekanBoard.attachments.filter(attachment => {
            return attachment._id === activity.attachmentId;
          })[0];

          if (typeof wekanAttachment !== 'undefined' && wekanAttachment) {
            if (wekanAttachment.url || wekanAttachment.file) {
              // we cannot actually create the Wekan attachment, because we don't yet
              // have the cards to attach it to, so we store it in the instance variable.
              const wekanCardId = activity.cardId;
              if (!this.attachments[wekanCardId]) {
                this.attachments[wekanCardId] = [];
              }
              this.attachments[wekanCardId].push(wekanAttachment);
            }
          }
          break;
        }
        case 'addComment': {
          const wekanComment = wekanBoard.comments.filter(comment => {
            return comment._id === activity.commentId;
          })[0];
          const id = activity.cardId;
          if (!this.comments[id]) {
            this.comments[id] = [];
          }
          this.comments[id].push(wekanComment);
          break;
        }
        case 'createBoard': {
          this.createdAt.board = activity.createdAt;
          break;
        }
        case 'createCard': {
          const cardId = activity.cardId;
          this.createdAt.cards[cardId] = activity.createdAt;
          this.createdBy.cards[cardId] = activity.userId;
          break;
        }
        case 'createList': {
          const listId = activity.listId;
          this.createdAt.lists[listId] = activity.createdAt;
          break;
        }
        case 'createSwimlane': {
          const swimlaneId = activity.swimlaneId;
          this.createdAt.swimlanes[swimlaneId] = activity.createdAt;
          break;
        }
        case 'createCustomField': {
          const customFieldId = activity.customFieldId;
          this.createdAt.customFields[customFieldId] = activity.createdAt;
          break;
        }
      }
    });
  }

  async importActivities(activities, boardId) {
    for (const activity of activities) {
      switch (activity.activityType) {
        // Board related activities
        // TODO: addBoardMember, removeBoardMember
        case 'createBoard': {
          await Activities.direct.insertAsync({
            userId: this._user(activity.userId),
            type: 'board',
            activityTypeId: boardId,
            activityType: activity.activityType,
            boardId,
            createdAt: this._now(activity.createdAt),
          });
          break;
        }
        // List related activities
        // TODO: removeList, archivedList
        case 'createList': {
          await Activities.direct.insertAsync({
            userId: this._user(activity.userId),
            type: 'list',
            activityType: activity.activityType,
            listId: this.lists[activity.listId],
            boardId,
            createdAt: this._now(activity.createdAt),
          });
          break;
        }
        // Card related activities
        // TODO: archivedCard, restoredCard, joinMember, unjoinMember
        case 'createCard': {
          await Activities.direct.insertAsync({
            userId: this._user(activity.userId),
            activityType: activity.activityType,
            listId: this.lists[activity.listId],
            cardId: this.cards[activity.cardId],
            boardId,
            createdAt: this._now(activity.createdAt),
          });
          break;
        }
        case 'moveCard': {
          await Activities.direct.insertAsync({
            userId: this._user(activity.userId),
            oldListId: this.lists[activity.oldListId],
            activityType: activity.activityType,
            listId: this.lists[activity.listId],
            cardId: this.cards[activity.cardId],
            boardId,
            createdAt: this._now(activity.createdAt),
          });
          break;
        }
        // Comment related activities
        case 'addComment': {
          await Activities.direct.insertAsync({
            userId: this._user(activity.userId),
            activityType: activity.activityType,
            cardId: this.cards[activity.cardId],
            commentId: this.commentIds[activity.commentId],
            boardId,
            createdAt: this._now(activity.createdAt),
          });
          break;
        }
        // Attachment related activities
        case 'addAttachment': {
          await Activities.direct.insertAsync({
            userId: this._user(activity.userId),
            type: 'card',
            activityType: activity.activityType,
            attachmentId: this.attachmentIds[activity.attachmentId],
            cardId: this.cards[activity.cardId],
            boardId,
            createdAt: this._now(activity.createdAt),
          });
          break;
        }
        // Checklist related activities
        case 'addChecklist': {
          await Activities.direct.insertAsync({
            userId: this._user(activity.userId),
            activityType: activity.activityType,
            cardId: this.cards[activity.cardId],
            checklistId: this.checklists[activity.checklistId],
            boardId,
            createdAt: this._now(activity.createdAt),
          });
          break;
        }
        case 'addChecklistItem': {
          await Activities.direct.insertAsync({
            userId: this._user(activity.userId),
            activityType: activity.activityType,
            cardId: this.cards[activity.cardId],
            checklistId: this.checklists[activity.checklistId],
            checklistItemId: activity.checklistItemId.replace(
              activity.checklistId,
              this.checklists[activity.checklistId],
            ),
            boardId,
            createdAt: this._now(activity.createdAt),
          });
          break;
        }
      }
    }
  }

  //check(board) {
  check() {
    //try {
    // check(data, {
    //   membersMapping: Match.Optional(Object),
    // });
    // this.checkActivities(board.activities);
    // this.checkBoard(board);
    // this.checkLabels(board.labels);
    // this.checkLists(board.lists);
    // this.checkSwimlanes(board.swimlanes);
    // this.checkCards(board.cards);
    //this.checkChecklists(board.checklists);
    // this.checkRules(board.rules);
    // this.checkActions(board.actions);
    //this.checkTriggers(board.triggers);
    //this.checkChecklistItems(board.checklistItems);
    //} catch (e) {
    //  throw new Meteor.Error('error-json-schema');
    // }
  }

  async create(board, currentBoardId) {
    // TODO : Make isSandstorm variable global
    const isSandstorm =
      Meteor.settings &&
      Meteor.settings.public &&
      Meteor.settings.public.sandstorm;
    if (isSandstorm && currentBoardId) {
      const currentBoard = await ReactiveCache.getBoard(currentBoardId);
      await currentBoard.archive();
    }
    // Admin Panel / Features / Security: scrub the incoming board data BEFORE any
    // placeholder user, card or comment is created, so every downstream step reads
    // already-anonymized / avatar-free data.
    await this.applyImportSecurity(board);
    // Preserve the ORIGINAL members instead of mapping them onto existing accounts at
    // import time (a wrong mapping attaches the wrong person and can leak board
    // permissions). This creates an inert placeholder user for each original member,
    // reusing the original _id so every card/comment/activity reference resolves to the
    // right person, and restores their avatar. Deliberate mapping/merging to real
    // accounts (and LDAP reconciliation) happens later, not here.
    await this.createPlaceholderUsers(board);
    this.parseActivities(board);
    const boardId = await this.createBoardAndLabels(board);
    await this.createLists(board.lists, boardId);
    await this.createSwimlanes(board.swimlanes, boardId);
    await this.createCustomFields(board.customFields, boardId);
    await this.createCards(board.cards, boardId);
    await this.createSubtasks(board.cards);
    await this.createCardDependencies(board.cards);
    await this.createChecklists(board.checklists, boardId);
    await this.createChecklistItems(board.checklistItems, boardId);
    await this.importActivities(board.activities, boardId);
    await this.createTriggers(board.triggers, boardId);
    await this.createActions(board.actions, boardId);
    await this.createRules(board.rules, boardId);
    await this.recordImportedUsernames(board, boardId);
    await this.recreateBackgrounds(board, boardId);
    // XXX add members
    return boardId;
  }

  // Re-create the board's background images, which are exported as board-level
  // attachments (meta.source === 'board-background', no cardId), as new
  // board-level Attachments for the imported board, and re-point the active
  // background (backgroundImageId) to the new attachment id.
  async recreateBackgrounds(board, boardId) {
    if (!Meteor.isServer) return;
    const backgrounds = (board.attachments || []).filter(
      att => att && att.source === 'board-background' && att.file && !att.cardId,
    );
    if (!backgrounds.length) return;
    const idMap = {};
    for (const bg of backgrounds) {
      try {
        const buffer = Buffer.from(bg.file, 'base64');
        const fileRef = await Attachments.writeAsync(
          buffer,
          {
            fileName: bg.name || 'background',
            type: bg.type || 'image/jpeg',
            userId: this._user(),
            meta: { boardId, source: 'board-background' },
          },
          true,
        );
        if (fileRef && fileRef._id && bg._id) {
          idMap[bg._id] = fileRef._id;
        }
      } catch (e) {
        if (process.env.DEBUG === 'true') {
          console.warn('Failed to import board background', bg.name, e && e.message);
        }
      }
    }
    // Re-point the active background to the new attachment id.
    const activeNewId = board.backgroundImageId && idMap[board.backgroundImageId];
    if (activeNewId) {
      await Boards.direct.updateAsync(boardId, {
        $set: {
          backgroundImageId: activeNewId,
          backgroundImageURL: generateUniversalAttachmentUrl(activeNewId),
        },
      });
    }
  }

  // Keep the original imported usernames so user mapping can happen later:
  // members mapped to a WeKan user get the imported username added to that
  // user's importUsernames (so future imports auto-map); unmapped members'
  // usernames are stored on the board's importUsernames for an admin to assign
  // to real users later via the People panel.
  // Pick a free username: keep the original if it is not taken, else suffix it so we
  // never rename/steal a different existing account's username. The placeholder still
  // keeps the original _id, so member references resolve to it regardless of username.
  async _uniquePlaceholderUsername(base) {
    const name = (String(base || '').trim()) || 'imported';
    let candidate = name;
    let n = 0;
    // eslint-disable-next-line no-await-in-loop
    while (await Meteor.users.findOneAsync({ username: candidate }, { fields: { _id: 1 } })) {
      n += 1;
      candidate = `${name}-${n}`;
    }
    return candidate;
  }

  // Admin Panel / Features / Security: scrub the incoming board data in place.
  //  - disableImportAvatars: drop every avatar carried in board.users so no avatar
  //    is restored on import.
  //  - anonymizeImportUsers: replace each imported user's username/fullname/initials
  //    (and any avatar) with counter placeholders (user1, user2, ...) and rewrite
  //    @username mentions + requestedBy/assignedBy in the imported card/comment text.
  //    Because this runs before createPlaceholderUsers and member mapping, the
  //    imported board is fully anonymized: placeholders are named user1/user2 and no
  //    real account is auto-matched by the original username.
  // The placeholder word is translated to the importing user's language.
  async applyImportSecurity(board) {
    if (!Meteor.isServer) return;
    const security = await getImportExportSecuritySettings();
    const users = Array.isArray(board.users) ? board.users : [];

    if (security.disableImportAvatars) {
      users.forEach(u => {
        if (u && u.profile) {
          delete u.profile.avatarFile;
          delete u.profile.avatarFileName;
          delete u.profile.avatarFileType;
          delete u.profile.avatarUrl;
        }
      });
    }

    if (security.anonymizeImportUsers) {
      let language = 'en';
      try {
        const uid = Meteor.userId();
        if (uid) {
          const currentUser = await ReactiveCache.getUser(uid);
          language = (currentUser && currentUser.profile && currentUser.profile.language) || 'en';
        }
      } catch (e) { /* default to English */ }
      const map = buildUserAnonymizationMap(users, anonymizedUserWord(language));
      users.forEach(u => anonymizeUserDoc(u, map));
      anonymizeBoardTextInPlace(board, map.byUsername);
    }
  }

  // Create an inert placeholder user for each original member carried in board.users,
  // reusing the original _id so all references resolve, and populate this.members as an
  // identity map (id -> id) so _user() keeps the original person instead of collapsing
  // to the importer. Placeholders cannot log in (loginDisabled), are inactive until
  // reconciled (isActive:false), and carry no secrets. Their avatar file (embedded as
  // base64 by the exporter) is restored to files/avatars. Server-only; best-effort.
  async createPlaceholderUsers(board) {
    if (!Meteor.isServer) return;
    const users = Array.isArray(board.users) ? board.users : [];
    let localizeAvatarFromBuffer = null;
    try {
      ({ localizeAvatarFromBuffer } = await import('/server/lib/localizeAvatar'));
    } catch (e) { /* avatar restore unavailable; users still imported */ }

    for (const u of users) {
      if (!u || !u._id) continue;
      const profile = u.profile || {};
      let existing = await ReactiveCache.getUser(u._id);
      if (!existing) {
        const username = await this._uniquePlaceholderUsername(u.username || `imported-${u._id}`);
        try {
          // .direct bypasses the after.insert hooks (Sandstorm identity sync, the
          // disableRegistration/invitation-code gate) that would otherwise reject or
          // mis-handle a non-account placeholder.
          await Users.direct.insertAsync({
            _id: u._id,
            username,
            profile: {
              fullname: profile.fullname || '',
              initials: profile.initials || '',
            },
            authenticationMethod: 'imported',
            loginDisabled: true,
            isActive: false,
            importedFromBoardId: board._id || null,
            importedAt: new Date(),
            createdAt: new Date(),
            services: {},
          });
        } catch (e) {
          // _id/username race: another concurrent insert won — carry on and use it.
          if (process.env.DEBUG === 'true') console.warn('placeholder user insert:', u._id, e && e.message);
        }
      }

      // Restore the original avatar file (base64) into files/avatars and set a local
      // profile.avatarUrl, so the original member's picture shows and is exportable
      // again — works on Sandstorm too (writes a local file, no fetch).
      if (localizeAvatarFromBuffer && profile.avatarFile) {
        try {
          const buffer = Buffer.from(profile.avatarFile, 'base64');
          await localizeAvatarFromBuffer(u._id, buffer, {
            type: profile.avatarFileType || 'image/png',
            name: profile.avatarFileName || `${u._id}.png`,
          });
        } catch (e) {
          if (process.env.DEBUG === 'true') console.warn('placeholder avatar restore:', u._id, e && e.message);
        }
      }

      // Identity mapping: keep the original member (do NOT remap to the importer).
      this.members[u._id] = u._id;
    }
  }

  async recordImportedUsernames(board, boardId) {
    if (!Meteor.isServer) return;
    const usersById = {};
    (board.users || []).forEach(user => {
      usersById[user._id] = user;
    });
    const unmapped = [];
    for (const member of board.members || []) {
      // the client member mapper renames userId -> id before import
      const sourceId = member.id || member.userId;
      const sourceUser = usersById[sourceId];
      const username = (sourceUser && sourceUser.username) || member.username;
      if (!username) continue;
      const wekanId = this.members[sourceId];
      // Only record the imported username on a Wekan user that actually exists;
      // a stale/bogus mapping target is treated as unmapped. Use `.direct` so
      // this bookkeeping write bypasses collection2 validation and can never
      // abort the whole import.
      const mappedUser = wekanId ? await ReactiveCache.getUser(wekanId) : null;
      if (mappedUser) {
        await Users.direct.updateAsync(wekanId, {
          $addToSet: { importUsernames: username },
        });
      } else if (!unmapped.includes(username)) {
        unmapped.push(username);
      }
    }
    if (unmapped.length) {
      await Boards.direct.updateAsync(boardId, {
        $addToSet: { importUsernames: { $each: unmapped } },
      });
    }
  }
}
