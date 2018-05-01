const DateString = Match.Where(function (dateAsString) {
  check(dateAsString, String);
  return moment(dateAsString, moment.ISO_8601).isValid();
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
    // the members, indexed by Wekan member id => Wekan user ID
    this.members = data.membersMapping ? data.membersMapping : {};

    // maps a wekanCardId to an array of wekanAttachments
    this.attachments = {};
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
    if(dateString) {
      return new Date(dateString);
    }
    if(!this._nowDate) {
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
    if(wekanUserId && this.members[wekanUserId]) {
      return this.members[wekanUserId];
    }
    return Meteor.userId();
  }

  checkActivities(wekanActivities) {
    check(wekanActivities, [Match.ObjectIncluding({
      activityType: String,
      createdAt: DateString,
    })]);
    // XXX we could perform more thorough checks based on action type
  }

  checkBoard(wekanBoard) {
    check(wekanBoard, Match.ObjectIncluding({
      archived: Boolean,
      title: String,
      // XXX refine control by validating 'color' against a list of
      // allowed values (is it worth the maintenance?)
      color: String,
      permission: Match.Where((value) => {
        return ['private', 'public'].indexOf(value)>= 0;
      }),
    }));
  }

  checkCards(wekanCards) {
    check(wekanCards, [Match.ObjectIncluding({
      archived: Boolean,
      dateLastActivity: DateString,
      labelIds: [String],
      title: String,
      sort: Number,
    })]);
  }

  checkLabels(wekanLabels) {
    check(wekanLabels, [Match.ObjectIncluding({
      // XXX refine control by validating 'color' against a list of allowed
      // values (is it worth the maintenance?)
      color: String,
    })]);
  }

  checkLists(wekanLists) {
    check(wekanLists, [Match.ObjectIncluding({
      archived: Boolean,
      title: String,
    })]);
  }

  checkSwimlanes(wekanSwimlanes) {
    check(wekanSwimlanes, [Match.ObjectIncluding({
      archived: Boolean,
      title: String,
    })]);
  }

  checkChecklists(wekanChecklists) {
    check(wekanChecklists, [Match.ObjectIncluding({
      cardId: String,
      title: String,
    })]);
  }

  checkChecklistItems(wekanChecklistItems) {
    check(wekanChecklistItems, [Match.ObjectIncluding({
      cardId: String,
      title: String,
    })]);
  }

  // You must call parseActions before calling this one.
  createBoardAndLabels(boardToImport) {
    const boardToCreate = {
      archived: boardToImport.archived,
      color: boardToImport.color,
      // very old boards won't have a creation activity so no creation date
      createdAt: this._now(boardToImport.createdAt),
      labels: [],
      members: [{
        userId: Meteor.userId(),
        wekanId: Meteor.userId(),
        isActive: true,
        isAdmin: true,
        isCommentOnly: false,
        swimlaneId: false,
      }],
      // Standalone Export has modifiedAt missing, adding modifiedAt to fix it
      modifiedAt: this._now(boardToImport.modifiedAt),
      permission: boardToImport.permission,
      slug: getSlug(boardToImport.title) || 'board',
      stars: 0,
      title: boardToImport.title,
    };
    // now add other members
    if(boardToImport.members) {
      boardToImport.members.forEach((wekanMember) => {
        // do we already have it in our list?
        if(!boardToCreate.members.some((member) => member.wekanId === wekanMember.wekanId))
          boardToCreate.members.push({
            ... wekanMember,
            userId: wekanMember.wekanId,
          });
      });
    }
    boardToImport.labels.forEach((label) => {
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
    const boardId = Boards.direct.insert(boardToCreate);
    Boards.direct.update(boardId, {$set: {modifiedAt: this._now()}});
    // log activity
    Activities.direct.insert({
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
  createCards(wekanCards, boardId) {
    const result = [];
    wekanCards.forEach((card) => {
      const cardToCreate = {
        archived: card.archived,
        boardId,
        // very old boards won't have a creation activity so no creation date
        createdAt: this._now(this.createdAt.cards[card._id]),
        dateLastActivity: this._now(),
        description: card.description,
        listId: this.lists[card.listId],
        swimlaneId: this.swimlanes[card.swimlaneId],
        sort: card.sort,
        title: card.title,
        // we attribute the card to its creator if available
        userId: this._user(this.createdBy.cards[card._id]),
        isOvertime: card.isOvertime || false,
        startAt: card.startAt ? this._now(card.startAt) : null,
        dueAt: card.dueAt ? this._now(card.dueAt) : null,
        spentTime: card.spentTime || null,
      };
      // add labels
      if (card.labelIds) {
        cardToCreate.labelIds = card.labelIds.map((wekanId) => {
          return this.labels[wekanId];
        });
      }
      // add members {
      if(card.members) {
        const wekanMembers = [];
        // we can't just map, as some members may not have been mapped
        card.members.forEach((sourceMemberId) => {
          if(this.members[sourceMemberId]) {
            const wekanId = this.members[sourceMemberId];
            // we may map multiple Wekan members to the same wekan user
            // in which case we risk adding the same user multiple times
            if(!wekanMembers.find((wId) => wId === wekanId)){
              wekanMembers.push(wekanId);
            }
          }
          return true;
        });
        if(wekanMembers.length>0) {
          cardToCreate.members = wekanMembers;
        }
      }
      // insert card
      const cardId = Cards.direct.insert(cardToCreate);
      // keep track of Wekan id => WeKan id
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
        comments.forEach((comment) => {
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
          const commentId = CardComments.direct.insert(commentToCreate);
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
        });
      }
      const attachments = this.attachments[card._id];
      const wekanCoverId = card.coverId;
      if (attachments) {
        attachments.forEach((att) => {
          const file = new FS.File();
          // Simulating file.attachData on the client generates multiple errors
          // - HEAD returns null, which causes exception down the line
          // - the template then tries to display the url to the attachment which causes other errors
          // so we make it server only, and let UI catch up once it is done, forget about latency comp.
          const self = this;
          if(Meteor.isServer) {
            if (att.url) {
              file.attachData(att.url, function (error) {
                file.boardId = boardId;
                file.cardId = cardId;
                file.userId = self._user(att.userId);
                // The field source will only be used to prevent adding
                // attachments' related activities automatically
                file.source = 'import';
                if (error) {
                  throw(error);
                } else {
                  const wekanAtt = Attachments.insert(file, () => {
                    // we do nothing
                  });
                  self.attachmentIds[att._id] = wekanAtt._id;
                  //
                  if(wekanCoverId === att._id) {
                    Cards.direct.update(cardId, { $set: {coverId: wekanAtt._id}});
                  }
                }
              });
            } else if (att.file) {
              file.attachData(new Buffer(att.file, 'base64'), {type: att.type}, (error) => {
                file.name(att.name);
                file.boardId = boardId;
                file.cardId = cardId;
                file.userId = self._user(att.userId);
                // The field source will only be used to prevent adding
                // attachments' related activities automatically
                file.source = 'import';
                if (error) {
                  throw(error);
                } else {
                  const wekanAtt = Attachments.insert(file, () => {
                    // we do nothing
                  });
                  this.attachmentIds[att._id] = wekanAtt._id;
                  //
                  if(wekanCoverId === att._id) {
                    Cards.direct.update(cardId, { $set: {coverId: wekanAtt._id}});
                  }
                }
              });
            }
          }
          // todo XXX set cover - if need be
        });
      }
      result.push(cardId);
    });
    return result;
  }

  // Create labels if they do not exist and load this.labels.
  createLabels(wekanLabels, board) {
    wekanLabels.forEach((label) => {
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

  createLists(wekanLists, boardId) {
    wekanLists.forEach((list, listIndex) => {
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
      const listId = Lists.direct.insert(listToCreate);
      Lists.direct.update(listId, {$set: {'updatedAt': this._now()}});
      this.lists[list._id] = listId;
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
    });
  }

  createSwimlanes(wekanSwimlanes, boardId) {
    wekanSwimlanes.forEach((swimlane, swimlaneIndex) => {
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
      const swimlaneId = Swimlanes.direct.insert(swimlaneToCreate);
      Swimlanes.direct.update(swimlaneId, {$set: {'updatedAt': this._now()}});
      this.swimlanes[swimlane._id] = swimlaneId;
    });
  }

  createChecklists(wekanChecklists) {
    const result = [];
    wekanChecklists.forEach((checklist, checklistIndex) => {
      // Create the checklist
      const checklistToCreate = {
        cardId: this.cards[checklist.cardId],
        title: checklist.title,
        createdAt: checklist.createdAt,
        sort: checklist.sort ? checklist.sort : checklistIndex,
      };
      const checklistId = Checklists.direct.insert(checklistToCreate);
      this.checklists[checklist._id] = checklistId;
      result.push(checklistId);
    });
    return result;
  }

  createChecklistItems(wekanChecklistItems) {
    wekanChecklistItems.forEach((checklistitem, checklistitemIndex) => {
      // Create the checklistItem
      const checklistItemTocreate = {
        title: checklistitem.title,
        checklistId: this.checklists[checklistitem.checklistId],
        cardId: this.cards[checklistitem.cardId],
        sort: checklistitem.sort ? checklistitem.sort : checklistitemIndex,
        isFinished: checklistitem.isFinished,
      };
      const checklistItemId = ChecklistItems.direct.insert(checklistItemTocreate);
      this.checklistItems[checklistitem._id] = checklistItemId;
    });
  }

  parseActivities(wekanBoard) {
    wekanBoard.activities.forEach((activity) => {
      switch (activity.activityType) {
      case 'addAttachment': {
        // We have to be cautious, because the attachment could have been removed later.
        // In that case Wekan still reports its addition, but removes its 'url' field.
        // So we test for that
        const wekanAttachment = wekanBoard.attachments.filter((attachment) => {
          return attachment._id === activity.attachmentId;
        })[0];

        if ( typeof wekanAttachment !== 'undefined' && wekanAttachment ) {
          if(wekanAttachment.url || wekanAttachment.file) {
          // we cannot actually create the Wekan attachment, because we don't yet
          // have the cards to attach it to, so we store it in the instance variable.
            const wekanCardId = activity.cardId;
            if(!this.attachments[wekanCardId]) {
              this.attachments[wekanCardId] = [];
            }
            this.attachments[wekanCardId].push(wekanAttachment);
          }
        }
        break;
      }
      case 'addComment': {
        const wekanComment = wekanBoard.comments.filter((comment) => {
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
      }}
    });
  }

  importActivities(activities, boardId) {
    activities.forEach((activity) => {
      switch (activity.activityType) {
      // Board related activities
      // TODO: addBoardMember, removeBoardMember
      case 'createBoard': {
        Activities.direct.insert({
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
        Activities.direct.insert({
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
        Activities.direct.insert({
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
        Activities.direct.insert({
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
        Activities.direct.insert({
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
        Activities.direct.insert({
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
        Activities.direct.insert({
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
        Activities.direct.insert({
          userId: this._user(activity.userId),
          activityType: activity.activityType,
          cardId: this.cards[activity.cardId],
          checklistId: this.checklists[activity.checklistId],
          checklistItemId: activity.checklistItemId.replace(
            activity.checklistId,
            this.checklists[activity.checklistId]),
          boardId,
          createdAt: this._now(activity.createdAt),
        });
        break;
      }}
    });
  }

  check(board) {
    try {
      // check(data, {
      //   membersMapping: Match.Optional(Object),
      // });
      this.checkActivities(board.activities);
      this.checkBoard(board);
      this.checkLabels(board.labels);
      this.checkLists(board.lists);
      this.checkSwimlanes(board.swimlanes);
      this.checkCards(board.cards);
      this.checkChecklists(board.checklists);
      this.checkChecklistItems(board.checklistItems);
    } catch (e) {
      throw new Meteor.Error('error-json-schema');
    }
  }

  create(board, currentBoardId) {
    // TODO : Make isSandstorm variable global
    const isSandstorm = Meteor.settings && Meteor.settings.public &&
      Meteor.settings.public.sandstorm;
    if (isSandstorm && currentBoardId) {
      const currentBoard = Boards.findOne(currentBoardId);
      currentBoard.archive();
    }
    this.parseActivities(board);
    const boardId = this.createBoardAndLabels(board);
    this.createLists(board.lists, boardId);
    this.createSwimlanes(board.swimlanes, boardId);
    this.createCards(board.cards, boardId);
    this.createChecklists(board.checklists);
    this.createChecklistItems(board.checklistItems);
    this.importActivities(board.activities, boardId);
    // XXX add members
    return boardId;
  }
}
