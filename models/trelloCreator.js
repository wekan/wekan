import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Activities from '/models/activities';
import Attachments from '/models/attachments';
import Boards from '/models/boards';
import Users from '/models/users';
import { generateUniversalAttachmentUrl } from '/models/lib/universalUrlGenerator';
import { BOARD_COLORS, CARD_COLORS } from '/models/metadata/colors';
import { trelloStickerToFa, trelloStickerHighlight } from '/models/metadata/stickers';
import CardComments from '/models/cardComments';
import Cards from '/models/cards';
import ChecklistItems from '/models/checklistItems';
import Checklists from '/models/checklists';
import CustomFields from './customFields';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
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

export class TrelloCreator {
  constructor(data) {
    // we log current date, to use the same timestamp for all our actions.
    // this helps to retrieve all elements performed by the same import.
    this._nowDate = new Date();
    // The object creation dates, indexed by Trello id
    // (so we only parse actions once!)
    this.createdAt = {
      board: null,
      cards: {},
      lists: {},
    };
    // The object creator Trello Id, indexed by the object Trello id
    // (so we only parse actions once!)
    this.createdBy = {
      cards: {}, // only cards have a field for that
    };

    // Map of labels Trello ID => Wekan ID
    this.labels = {};
    // Default swimlane
    this.swimlane = null;
    // Map of lists Trello ID => Wekan ID
    this.lists = {};
    // Map of cards Trello ID => Wekan ID
    this.cards = {};
    // Map of attachments Wekan ID => Wekan ID
    this.attachmentIds = {};
    // Map of checklists Wekan ID => Wekan ID
    this.checklists = {};
    // The comments, indexed by Trello card id (to map when importing cards)
    this.comments = {};
    // the members, indexed by Trello member id => Wekan user ID
    this.members = data.membersMapping ? data.membersMapping : {};

    // maps a trelloCardId to an array of trelloAttachments
    this.attachments = {};

    this.customFields = {};
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
   * if trelloUserId is provided and we have a mapping,
   * return it.
   * Otherwise return current logged user.
   * @param trelloUserId
   * @private
   */
  _user(trelloUserId) {
    if (trelloUserId && this.members[trelloUserId]) {
      return this.members[trelloUserId];
    }
    return Meteor.userId();
  }

  checkActions(trelloActions) {
    check(trelloActions, [
      Match.ObjectIncluding({
        data: Object,
        date: DateString,
        type: String,
      }),
    ]);
    // XXX we could perform more thorough checks based on action type
  }

  checkBoard(trelloBoard) {
    check(
      trelloBoard,
      Match.ObjectIncluding({
        // closed: Boolean,  // issue #3840, should import closed Trello boards
        name: String,
        prefs: Match.ObjectIncluding({
          // XXX refine control by validating 'background' against a list of
          // allowed values (is it worth the maintenance?)
          background: String,
          permissionLevel: Match.Where(value => {
            return ['org', 'private', 'public'].indexOf(value) >= 0;
          }),
        }),
      }),
    );
  }

  checkCards(trelloCards) {
    check(trelloCards, [
      Match.ObjectIncluding({
        closed: Boolean,
        dateLastActivity: DateString,
        desc: String,
        idLabels: [String],
        idMembers: [String],
        name: String,
        pos: Number,
      }),
    ]);
  }

  checkLabels(trelloLabels) {
    check(trelloLabels, [
      Match.ObjectIncluding({
        // XXX refine control by validating 'color' against a list of allowed
        // values (is it worth the maintenance?)
        name: String,
      }),
    ]);
  }

  checkLists(trelloLists) {
    check(trelloLists, [
      Match.ObjectIncluding({
        closed: Boolean,
        name: String,
      }),
    ]);
  }

  checkChecklists(trelloChecklists) {
    check(trelloChecklists, [
      Match.ObjectIncluding({
        idBoard: String,
        idCard: String,
        name: String,
        checkItems: [
          Match.ObjectIncluding({
            state: String,
            name: String,
          }),
        ],
      }),
    ]);
  }

  // You must call parseActions before calling this one.
  async createBoardAndLabels(trelloBoard) {
    let color = 'blue';
    if (this.getColor(trelloBoard.prefs.background) !== undefined) {
      color = this.getColor(trelloBoard.prefs.background);
    }

    const boardToCreate = {
      archived: trelloBoard.closed,
      color: color,
      // very old boards won't have a creation activity so no creation date
      createdAt: this._now(this.createdAt.board),
      labels: [],
      customFields: [],
      members: [
        {
          userId: Meteor.userId(),
          isAdmin: true,
          isActive: true,
          isNoComments: false,
          isCommentOnly: false,
          swimlaneId: false,
        },
      ],
      permission: this.getPermission(trelloBoard.prefs.permissionLevel),
      slug: getSlug(trelloBoard.name) || 'board',
      stars: 0,
      title: await Boards.uniqueTitle(trelloBoard.name),
    };
    // Import the board background image. When Trello uses an image background,
    // prefs.backgroundImage is a public URL (and prefs.backgroundImageScaled
    // holds scaled variants); Wekan references it directly via
    // backgroundImageURL. A solid-color background is already covered by
    // `color` above.
    const prefs = trelloBoard.prefs || {};
    const scaled = Array.isArray(prefs.backgroundImageScaled)
      ? prefs.backgroundImageScaled
      : [];
    const bgImage =
      prefs.backgroundImage ||
      (scaled.length && scaled[scaled.length - 1] && scaled[scaled.length - 1].url);
    if (bgImage && /^https?:\/\//i.test(bgImage)) {
      boardToCreate.backgroundImageURL = bgImage;
    }
    // now add other members
    if (trelloBoard.memberships) {
      trelloBoard.memberships.forEach(trelloMembership => {
        const trelloId = trelloMembership.idMember;
        // do we have a mapping?
        if (this.members[trelloId]) {
          const wekanId = this.members[trelloId];
          // do we already have it in our list?
          const wekanMember = boardToCreate.members.find(
            wekanMember => wekanMember.userId === wekanId,
          );
          if (wekanMember) {
            // we're already mapped, but maybe with lower rights
            if (!wekanMember.isAdmin) {
              wekanMember.isAdmin = this.getAdmin(trelloMembership.memberType);
            }
          } else {
            boardToCreate.members.push({
              userId: wekanId,
              isAdmin: this.getAdmin(trelloMembership.memberType),
              isActive: true,
              isNoComments: false,
              isCommentOnly: false,
              swimlaneId: false,
            });
          }
        }
      });
    }
    if (trelloBoard.labels) {
      trelloBoard.labels.forEach(label => {
        const labelToCreate = {
          _id: Random.id(6),
          color: this.mapToWekanColor(label.color) || 'black',
          name: label.name,
        };
        // We need to remember them by Trello ID, as this is the only ref we have
        // when importing cards.
        this.labels[label.id] = labelToCreate._id;
        boardToCreate.labels.push(labelToCreate);
      });
    }
    const boardId = await Boards.direct.insertAsync(boardToCreate);
    await Boards.direct.updateAsync(boardId, { $set: { modifiedAt: this._now() } });
    // log activity
    await Activities.direct.insertAsync({
      activityType: 'importBoard',
      boardId,
      createdAt: this._now(),
      source: {
        id: trelloBoard.id,
        system: 'Trello',
        // XSS fix (reported by meifukun): only persist an http(s) source URL.
        // trelloBoard.url is attacker-controlled (a javascript: URL in the
        // imported board), and the activity sidebar renders it as a link — so a
        // hostile scheme must never reach the database (defence in depth with the
        // render-time scheme check in activities.js).
        url: /^https?:\/\//i.test(String(trelloBoard.url || '')) ? trelloBoard.url : undefined,
      },
      // We attribute the import to current user,
      // not the author from the original object.
      userId: this._user(),
    });
    if (trelloBoard.customFields) {
      for (const field of trelloBoard.customFields) {
        const fieldToCreate = {
          // trelloId: field.id,
          name: field.name,
          showOnCard: field.display.cardFront,
          showLabelOnMiniCard: field.display.cardFront,
          automaticallyOnCard: true,
          alwaysOnCard: false,
          type: field.type,
          boardIds: [boardId],
          settings: {},
        };

        if (field.type === 'list') {
          fieldToCreate.type = 'dropdown';
          fieldToCreate.settings = {
            dropdownItems: field.options.map(opt => {
              return {
                _id: opt.id,
                name: opt.value.text,
              };
            }),
          };
        }

        // We need to remember them by Trello ID, as this is the only ref we have
        // when importing cards.
        this.customFields[field.id] = await CustomFields.direct.insertAsync(fieldToCreate);
      }
    }

    // Store the board background image as a board-level Attachment (in the
    // default attachments storage), served by the same /cdn/storage/attachments
    // route as every other attachment. The bytes are downloaded server-side by
    // the live API import (which has credentials) and injected as
    // trelloBoard.backgroundFile. If there are no bytes (offline JSON import),
    // the backgroundImageURL set above keeps Trello's public URL as a fallback.
    if (
      trelloBoard.backgroundFile &&
      trelloBoard.backgroundFile.file &&
      Meteor.isServer
    ) {
      try {
        const bf = trelloBoard.backgroundFile;
        const buffer = Buffer.from(bf.file, 'base64');
        const fileRef = await Attachments.writeAsync(
          buffer,
          {
            fileName: bf.name || 'trello-background.jpg',
            type: bf.type || 'image/jpeg',
            userId: this._user(),
            meta: { boardId, source: 'board-background' },
          },
          true,
        );
        if (fileRef && fileRef._id) {
          await Boards.direct.updateAsync(boardId, {
            $set: {
              backgroundImageId: fileRef._id,
              backgroundImageURL: generateUniversalAttachmentUrl(fileRef._id),
            },
          });
        }
      } catch (e) {
        if (process.env.DEBUG === 'true') {
          console.warn('Failed to store Trello board background', e && e.message);
        }
      }
    }
    return boardId;
  }

  /**
   * Create the Wekan cards corresponding to the supplied Trello cards,
   * as well as all linked data: activities, comments, and attachments
   * @param trelloCards
   * @param boardId
   * @returns {Array}
   */
  async createCards(trelloCards, boardId) {
    const result = [];
    // .direct.insertAsync below bypasses the before.insert hook that assigns
    // cardNumber, so handle it here. Prefer Trello's own short card number
    // (idShort, the #N shown in Trello), falling back to a freshly allocated
    // one. Without this every imported card defaults to #0.
    const boardObj = await ReactiveCache.getBoard(boardId);
    for (const card of trelloCards) {
      const cardToCreate = {
        archived: card.closed,
        boardId,
        cardNumber: card.idShort || (await boardObj.getNextCardNumber()),
        // very old boards won't have a creation activity so no creation date
        createdAt: this._now(this.createdAt.cards[card.id]),
        dateLastActivity: this._now(),
        description: card.desc,
        listId: this.lists[card.idList],
        swimlaneId: this.swimlane,
        sort: card.pos,
        title: card.name,
        // we attribute the card to its creator if available
        userId: this._user(this.createdBy.cards[card.id]),
        dueAt: card.due ? this._now(card.due) : null,
        // Trello marks a due date complete with a checkbox on the card front
        dueComplete: card.dueComplete || false,
      };
      // card cover: Trello stores it as card.cover = { color, idAttachment, ... }.
      // A color cover maps to the Wekan card color; an attachment cover is
      // resolved to coverId in the attachment loop below.
      if (card.cover && card.cover.color) {
        const coverColor = this.mapToWekanColor(card.cover.color);
        if (coverColor) {
          cardToCreate.color = coverColor;
        }
      }
      // location (Trello map power-up): address / coordinates / location name
      if (card.locationName) {
        cardToCreate.locationName = card.locationName;
      }
      if (card.address) {
        cardToCreate.locationAddress = card.address;
      }
      if (card.coordinates) {
        if (typeof card.coordinates.latitude === 'number') {
          cardToCreate.locationLatitude = card.coordinates.latitude;
        }
        if (typeof card.coordinates.longitude === 'number') {
          cardToCreate.locationLongitude = card.coordinates.longitude;
        }
      }
      // stickers: Trello card.stickers[] = { image, top, left, zIndex, ... }
      // where `image` is the sticker name (built-in/premium packs) or a custom
      // sticker id (uploaded packs). Map to a similar Font Awesome icon, and
      // keep the original name for the tooltip.
      if (card.stickers && card.stickers.length > 0) {
        cardToCreate.stickers = card.stickers.map((sticker, index) => {
          const stickerData = {
            icon: this.getStickerIcon(sticker.image),
            name: this.stickerLabel(sticker.image),
            position: typeof sticker.zIndex === 'number' ? sticker.zIndex : index,
          };
          const highlight = trelloStickerHighlight(sticker.image);
          if (highlight) stickerData.highlight = highlight;
          return stickerData;
        });
      }
      // add labels
      if (card.idLabels) {
        cardToCreate.labelIds = card.idLabels.map(trelloId => {
          return this.labels[trelloId];
        });
      }
      // add members {
      if (card.idMembers) {
        const wekanMembers = [];
        // we can't just map, as some members may not have been mapped
        card.idMembers.forEach(trelloId => {
          if (this.members[trelloId]) {
            const wekanId = this.members[trelloId];
            // we may map multiple Trello members to the same wekan user
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
      // add vote
      if (card.idMembersVoted) {
        // Trello only know's positive votes
        const positiveVotes = [];
        card.idMembersVoted.forEach(trelloId => {
          if (this.members[trelloId]) {
            const wekanId = this.members[trelloId];
            // we may map multiple Trello members to the same wekan user
            // in which case we risk adding the same user multiple times
            if (!positiveVotes.find(wId => wId === wekanId)) {
              positiveVotes.push(wekanId);
            }
          }
          return true;
        });
        if (positiveVotes.length > 0) {
          cardToCreate.vote = {
            question: cardToCreate.title,
            public: true,
            positive: positiveVotes,
          };
        }
      }

      if (card.customFieldItems) {
        cardToCreate.customFields = [];
        card.customFieldItems.forEach(item => {
          const custom = {
            _id: this.customFields[item.idCustomField],
          };
          if (item.idValue) {
            custom.value = item.idValue;
          } else if (item.value.hasOwnProperty('checked')) {
            custom.value = item.value.checked === 'true';
          } else if (item.value.hasOwnProperty('text')) {
            custom.value = item.value.text;
          } else if (item.value.hasOwnProperty('date')) {
            custom.value = item.value.date;
          } else if (item.value.hasOwnProperty('number')) {
            custom.value = item.value.number;
          }
          cardToCreate.customFields.push(custom);
        });
      }

      // insert card
      const cardId = await Cards.direct.insertAsync(cardToCreate);
      // keep track of Trello id => Wekan id
      this.cards[card.id] = cardId;
      // log activity
      // Activities.direct.insert({
      //   activityType: 'importCard',
      //   boardId,
      //   cardId,
      //   createdAt: this._now(),
      //   listId: cardToCreate.listId,
      //   source: {
      //     id: card.id,
      //     system: 'Trello',
      //     url: card.url,
      //   },
      //   // we attribute the import to current user,
      //   // not the author of the original card
      //   userId: this._user(),
      // });
      // add comments
      const comments = this.comments[card.id];
      if (comments) {
        for (const comment of comments) {
          const commentToCreate = {
            boardId,
            cardId,
            createdAt: this._now(comment.date),
            text: comment.data.text,
            // we attribute the comment to the original author, default to current user
            userId: this._user(comment.idMemberCreator),
          };
          // dateLastActivity will be set from activity insert, no need to
          // update it ourselves
          const commentId = await CardComments.direct.insertAsync(commentToCreate);
          // We need to keep adding comment activities this way with Trello
          // because it doesn't provide a comment ID
          await Activities.direct.insertAsync({
            activityType: 'addComment',
            boardId: commentToCreate.boardId,
            cardId: commentToCreate.cardId,
            commentId,
            createdAt: this._now(comment.date),
            // we attribute the addComment (not the import)
            // to the original author - it is needed by some UI elements.
            userId: commentToCreate.userId,
          });
        }
      }
      // Gather this card's attachments from BOTH the addAttachmentToCard
      // actions (this.attachments) and the card.attachments[] array present in
      // newer Trello exports, de-duplicated by Trello attachment id. `file`
      // (base64) is injected client-side when a matching file was found in the
      // uploaded attachments ZIP (the offline TCAD download).
      const mergedAttachments = [];
      const attachmentsById = new Map();
      const pushAttachment = raw => {
        if (!raw) return;
        const id = raw.id || raw._id || `__noid_${mergedAttachments.length}`;
        const norm = {
          id: raw.id || raw._id,
          name: raw.name || raw.fileName || '',
          fileName: raw.fileName || raw.name || '',
          url: raw.url || '',
          type: raw.mimeType || raw.type || undefined,
          userId: raw.idMemberCreator || raw.userId,
          file: raw.file,
        };
        const existing = attachmentsById.get(id);
        if (existing) {
          // Same attachment seen in both actions and card.attachments[].
          // Fill in whichever copy carries the bytes / url / type.
          if (!existing.file && norm.file) existing.file = norm.file;
          if (!existing.url && norm.url) existing.url = norm.url;
          if (!existing.type && norm.type) existing.type = norm.type;
          return;
        }
        attachmentsById.set(id, norm);
        mergedAttachments.push(norm);
      };
      (this.attachments[card.id] || []).forEach(pushAttachment);
      (card.attachments || []).forEach(pushAttachment);

      const trelloCoverId =
        card.idAttachmentCover || (card.cover && card.cover.idAttachment);

      if (mergedAttachments.length && Meteor.isServer) {
        // Trello "link attachments" (where the attachment name is the URL
        // itself) are not real files. Collect them here and append them to the
        // card description below, instead of trying to download them.
        const links = [];
        for (const att of mergedAttachments) {
          // attached link, not a file
          if (att.name && att.name === att.url) {
            links.push(att.url);
            continue;
          }
          const meta = { boardId, cardId, source: 'import' };
          const setCover = async newId => {
            if (!newId) return;
            this.attachmentIds[att.id] = newId;
            if (trelloCoverId && trelloCoverId === att.id) {
              await Cards.direct.updateAsync(cardId, {
                $set: { coverId: newId },
              });
            }
          };
          try {
            if (att.file) {
              // Bytes already provided from the uploaded attachments ZIP.
              // Insert them directly instead of downloading the
              // OAuth-protected Trello URL. writeAsync is the server-side
              // Meteor-Files API (insertAsync is client-only).
              const buffer = Buffer.from(att.file, 'base64');
              const fileRef = await Attachments.writeAsync(
                buffer,
                {
                  fileName: att.fileName || att.name || 'attachment',
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
                    'Blocked attachment URL during Trello import:',
                    validation.reason,
                    att.url,
                  );
                }
                // Skip just this attachment; a blocked URL must not abort the
                // whole import.
                continue;
              }
              // Best effort: works for publicly reachable URLs. Trello-hosted
              // uploads require OAuth and should instead be supplied via the
              // attachments ZIP (offline) or downloaded server-side in the
              // live Trello API import.
              const fileRef = await Attachments.loadAsync(
                att.url,
                { meta, fileName: att.fileName || att.name },
                true,
              );
              await setCover(fileRef && fileRef._id);
            }
          } catch (e) {
            if (process.env.DEBUG === 'true') {
              console.warn(
                'Failed to import Trello attachment',
                att.name,
                e && e.message,
              );
            }
            // Never let one failed attachment abort the whole import.
          }
        }

        if (links.length) {
          let desc = (cardToCreate.description || '').trim();
          if (desc) {
            desc += '\n\n';
          }
          desc += `## ${TAPi18n.__('links-heading')}\n`;
          links.forEach(link => {
            desc += `* ${link}\n`;
          });
          await Cards.direct.updateAsync(cardId, {
            $set: {
              description: desc,
            },
          });
        }
      }
      result.push(cardId);
    }
    return result;
  }

  // Create labels if they do not exist and load this.labels.
  createLabels(trelloLabels, board) {
    trelloLabels.forEach(label => {
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

  async createLists(trelloLists, boardId) {
    for (const list of trelloLists) {
      const listToCreate = {
        archived: list.closed,
        boardId,
        // Attach the list to the imported board's default swimlane so it shows
        // in Swimlane View (a list appears under a swimlane only when its
        // swimlaneId matches that swimlane or is empty). createSwimlanes runs
        // before createLists, so this.swimlane is set.
        swimlaneId: this.swimlane,
        // We are being defensing here by providing a default date (now) if the
        // creation date wasn't found on the action log. This happen on old
        // Trello boards (eg from 2013) that didn't log the 'createList' action
        // we require.
        createdAt: this._now(this.createdAt.lists[list.id]),
        title: list.name,
        sort: list.pos,
      };
      const listId = await Lists.direct.insertAsync(listToCreate);
      await Lists.direct.updateAsync(listId, { $set: { updatedAt: this._now() } });
      this.lists[list.id] = listId;
      // log activity
      // Activities.direct.insert({
      //   activityType: 'importList',
      //   boardId,
      //   createdAt: this._now(),
      //   listId,
      //   source: {
      //     id: list.id,
      //     system: 'Trello',
      //   },
      //   // We attribute the import to current user,
      //   // not the creator of the original object
      //   userId: this._user(),
      // });
    }
  }

  async createSwimlanes(boardId) {
    const swimlaneToCreate = {
      archived: false,
      boardId,
      // We are being defensing here by providing a default date (now) if the
      // creation date wasn't found on the action log. This happen on old
      // Wekan boards (eg from 2013) that didn't log the 'createList' action
      // we require.
      createdAt: this._now(),
      title: 'Default',
      sort: 1,
    };
    const swimlaneId = await Swimlanes.direct.insertAsync(swimlaneToCreate);
    await Swimlanes.direct.updateAsync(swimlaneId, { $set: { updatedAt: this._now() } });
    this.swimlane = swimlaneId;
  }

  async createChecklists(trelloChecklists, boardId) {
    for (const checklist of trelloChecklists) {
      if (this.cards[checklist.idCard]) {
        // Create the checklist
        const checklistToCreate = {
          cardId: this.cards[checklist.idCard],
          // Denormalized boardId; .direct.insert bypasses the before.insert hook
          // that would otherwise derive it, so set it explicitly here.
          boardId,
          title: checklist.name,
          createdAt: this._now(),
          sort: checklist.pos,
        };
        const checklistId = await Checklists.direct.insertAsync(checklistToCreate);
        // keep track of Trello id => Wekan id
        this.checklists[checklist.id] = checklistId;
        // Now add the items to the checklistItems
        let counter = 0;
        for (const item of checklist.checkItems) {
          counter++;
          const checklistItemTocreate = {
            _id: checklistId + counter,
            title: item.name,
            checklistId: this.checklists[checklist.id],
            cardId: this.cards[checklist.idCard],
            boardId,
            sort: item.pos,
            isFinished: item.state === 'complete',
          };
          await ChecklistItems.direct.insertAsync(checklistItemTocreate);
        }
      }
    }
  }

  getAdmin(trelloMemberType) {
    return trelloMemberType === 'admin';
  }

  getStickerIcon(trelloStickerName) {
    // Map a Trello sticker name to a similar WeKan card sticker icon (Font
    // Awesome v4 name, rendered as `i.fa.fa-<name>`). Handles built-in and
    // named premium packs via models/metadata/stickers.js.
    return trelloStickerToFa(trelloStickerName);
  }

  // A readable tooltip for an imported sticker. For named stickers (taco-love,
  // globe, …) this humanises the name; custom uploaded stickers only have an
  // opaque id, so fall back to a generic label rather than showing the id.
  stickerLabel(trelloStickerName) {
    const raw = String(trelloStickerName || '').trim();
    if (!raw) return 'sticker';
    // Long hex/base-id strings (custom uploaded stickers) aren't descriptive.
    if (/^[0-9a-f]{16,}$/i.test(raw) || /^[A-Za-z0-9_-]{20,}$/.test(raw)) {
      return 'custom sticker';
    }
    // Trello's named premium packs are renamed: taco => mascot, pete => computer
    // (e.g. "pete-ghost" => "computer ghost"). The highlight style (underline /
    // round ring) is applied separately via trelloStickerHighlight().
    return raw
      .replace(/[-_]+/g, ' ')
      .replace(/\btaco\b/gi, 'mascot')
      .replace(/\bpete\b/gi, 'computer')
      .trim();
  }

  // Map a Trello label/cover color to a valid WeKan card/label color
  // (CARD_COLORS === LABEL_COLORS === ALLOWED_COLORS). Trello uses base colors
  // that WeKan also has (green, blue, red, …) plus `_light`/`_dark` variants
  // (e.g. `purple_light`) that WeKan does not, so strip the variant suffix.
  // Returns null when there is no valid mapping.
  mapToWekanColor(trelloColor) {
    if (!trelloColor) return null;
    const base = String(trelloColor).split('_')[0];
    return CARD_COLORS.includes(base) ? base : null;
  }

  getColor(trelloColorCode) {
    // trello color name => wekan color
    const mapColors = {
      blue: 'belize',
      orange: 'pumpkin',
      green: 'nephritis',
      red: 'pomegranate',
      purple: 'wisteria',
      pink: 'moderatepink',
      lime: 'limegreen',
      sky: 'strongcyan',
      grey: 'midnight',
    };
    const wekanColor = mapColors[trelloColorCode];
    return wekanColor || BOARD_COLORS[0];
  }

  getPermission(trelloPermissionCode) {
    if (trelloPermissionCode === 'public') {
      return 'public';
    }
    // Wekan does NOT have organization level, so we default both 'private' and
    // 'org' to private.
    return 'private';
  }

  parseActions(trelloActions) {
    trelloActions.forEach(action => {
      if (action.type === 'addAttachmentToCard') {
        // We have to be cautious, because the attachment could have been removed later.
        // In that case Trello still reports its addition, but removes its 'url' field.
        // So we test for that
        const trelloAttachment = action.data.attachment;
        // We need the idMemberCreator
        trelloAttachment.idMemberCreator = action.idMemberCreator;
        if (trelloAttachment.url) {
          // we cannot actually create the Wekan attachment, because we don't yet
          // have the cards to attach it to, so we store it in the instance variable.
          const trelloCardId = action.data.card.id;
          if (!this.attachments[trelloCardId]) {
            this.attachments[trelloCardId] = [];
          }
          this.attachments[trelloCardId].push(trelloAttachment);
        }
      } else if (action.type === 'commentCard') {
        const id = action.data.card.id;
        if (this.comments[id]) {
          this.comments[id].push(action);
        } else {
          this.comments[id] = [action];
        }
      } else if (action.type === 'createBoard') {
        this.createdAt.board = action.date;
      } else if (action.type === 'createCard') {
        const cardId = action.data.card.id;
        this.createdAt.cards[cardId] = action.date;
        this.createdBy.cards[cardId] = action.idMemberCreator;
      } else if (action.type === 'createList') {
        const listId = action.data.list.id;
        this.createdAt.lists[listId] = action.date;
      }
    });
  }

  async importActions(actions, boardId) {
    for (const action of actions) {
      switch (action.type) {
        // Board related actions
        // TODO: addBoardMember, removeBoardMember
        case 'createBoard': {
          await Activities.direct.insertAsync({
            userId: this._user(action.idMemberCreator),
            type: 'board',
            activityTypeId: boardId,
            activityType: 'createBoard',
            boardId,
            createdAt: this._now(action.date),
          });
          break;
        }
        // List related activities
        // TODO: removeList, archivedList
        case 'createList': {
          await Activities.direct.insertAsync({
            userId: this._user(action.idMemberCreator),
            type: 'list',
            activityType: 'createList',
            listId: this.lists[action.data.list.id],
            boardId,
            createdAt: this._now(action.date),
          });
          break;
        }
        // Card related activities
        // TODO: archivedCard, restoredCard, joinMember, unjoinMember
        case 'createCard': {
          await Activities.direct.insertAsync({
            userId: this._user(action.idMemberCreator),
            activityType: 'createCard',
            listId: this.lists[action.data.list.id],
            cardId: this.cards[action.data.card.id],
            boardId,
            createdAt: this._now(action.date),
          });
          break;
        }
        case 'updateCard': {
          if (action.data.old.idList) {
            await Activities.direct.insertAsync({
              userId: this._user(action.idMemberCreator),
              oldListId: this.lists[action.data.old.idList],
              activityType: 'moveCard',
              listId: this.lists[action.data.listAfter.id],
              cardId: this.cards[action.data.card.id],
              boardId,
              createdAt: this._now(action.date),
            });
          }
          break;
        }
        // Comment related activities
        // Trello doesn't export the comment id
        // Attachment related activities
        case 'addAttachmentToCard': {
          await Activities.direct.insertAsync({
            userId: this._user(action.idMemberCreator),
            type: 'card',
            activityType: 'addAttachment',
            attachmentId: this.attachmentIds[action.data.attachment.id],
            cardId: this.cards[action.data.card.id],
            boardId,
            createdAt: this._now(action.date),
          });
          break;
        }
        // Checklist related activities
        case 'addChecklistToCard': {
          await Activities.direct.insertAsync({
            userId: this._user(action.idMemberCreator),
            activityType: 'addChecklist',
            cardId: this.cards[action.data.card.id],
            checklistId: this.checklists[action.data.checklist.id],
            boardId,
            createdAt: this._now(action.date),
          });
          break;
        }
      }
      // Trello doesn't have an add checklist item action
    }
  }

  check(board) {
    try {
      // check(data, {
      //   membersMapping: Match.Optional(Object),
      // });
      this.checkActions(board.actions);
      this.checkBoard(board);
      this.checkLabels(board.labels);
      this.checkLists(board.lists);
      this.checkCards(board.cards);
      this.checkChecklists(board.checklists);
    } catch (e) {
      throw new Meteor.Error('error-json-schema');
    }
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
    this.parseActions(board.actions);
    const boardId = await this.createBoardAndLabels(board);
    // Create the default swimlane first so lists can be attached to it (see
    // createLists): a list shows under a swimlane in Swimlane View only when its
    // swimlaneId matches that swimlane (or is empty).
    await this.createSwimlanes(boardId);
    await this.createLists(board.lists, boardId);
    await this.createCards(board.cards, boardId);
    await this.createChecklists(board.checklists, boardId);
    await this.importActions(board.actions, boardId);
    await this.recordImportedUsernames(board, boardId);
    // XXX add members
    return boardId;
  }

  // Keep the original Trello usernames so user mapping can happen later:
  // members that were mapped to a WeKan user get the Trello username added to
  // that user's importUsernames (so future imports auto-map); members that were
  // not mapped have their username stored on the board's importUsernames, where
  // an admin can later assign them to a real user via the People panel.
  async recordImportedUsernames(board, boardId) {
    if (!Meteor.isServer) return;
    const unmapped = [];
    for (const member of board.members || []) {
      if (!member.username) continue;
      const wekanId = this.members[member.id];
      if (wekanId) {
        await Users.updateAsync(wekanId, {
          $addToSet: { importUsernames: member.username },
        });
      } else if (!unmapped.includes(member.username)) {
        unmapped.push(member.username);
      }
    }
    if (unmapped.length) {
      await Boards.direct.updateAsync(boardId, {
        $addToSet: { importUsernames: { $each: unmapped } },
      });
    }
  }
}
