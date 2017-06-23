const DateString = Match.Where(function (dateAsString) {
  check(dateAsString, String);
  return moment(dateAsString, moment.ISO_8601).isValid();
});

class TrelloCreator {
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
    // Map of lists Trello ID => Wekan ID
    this.lists = {};
    // Map of cards Trello ID => Wekan ID
    this.cards = {};
    // The comments, indexed by Trello card id (to map when importing cards)
    this.comments = {};
    // the members, indexed by Trello member id => Wekan user ID
    this.members = data.membersMapping ? data.membersMapping : {};

    // maps a trelloCardId to an array of trelloAttachments
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
   * if trelloUserId is provided and we have a mapping,
   * return it.
   * Otherwise return current logged user.
   * @param trelloUserId
   * @private
     */
  _user(trelloUserId) {
    if(trelloUserId && this.members[trelloUserId]) {
      return this.members[trelloUserId];
    }
    return Meteor.userId();
  }

  checkActions(trelloActions) {
    check(trelloActions, [Match.ObjectIncluding({
      data: Object,
      date: DateString,
      type: String,
    })]);
    // XXX we could perform more thorough checks based on action type
  }

  checkBoard(trelloBoard) {
    check(trelloBoard, Match.ObjectIncluding({
      closed: Boolean,
      name: String,
      prefs: Match.ObjectIncluding({
        // XXX refine control by validating 'background' against a list of
        // allowed values (is it worth the maintenance?)
        background: String,
        permissionLevel: Match.Where((value) => {
          return ['org', 'private', 'public'].indexOf(value)>= 0;
        }),
      }),
    }));
  }

  checkCards(trelloCards) {
    check(trelloCards, [Match.ObjectIncluding({
      closed: Boolean,
      dateLastActivity: DateString,
      desc: String,
      idLabels: [String],
      idMembers: [String],
      name: String,
      pos: Number,
    })]);
  }

  checkLabels(trelloLabels) {
    check(trelloLabels, [Match.ObjectIncluding({
      // XXX refine control by validating 'color' against a list of allowed
      // values (is it worth the maintenance?)
      color: String,
      name: String,
    })]);
  }

  checkLists(trelloLists) {
    check(trelloLists, [Match.ObjectIncluding({
      closed: Boolean,
      name: String,
    })]);
  }

  checkChecklists(trelloChecklists) {
    check(trelloChecklists, [Match.ObjectIncluding({
      idBoard: String,
      idCard: String,
      name: String,
      checkItems: [Match.ObjectIncluding({
        state: String,
        name: String,
      })],
    })]);
  }

  // You must call parseActions before calling this one.
  createBoardAndLabels(trelloBoard) {
    const boardToCreate = {
      archived: trelloBoard.closed,
      color: this.getColor(trelloBoard.prefs.background),
      // very old boards won't have a creation activity so no creation date
      createdAt: this._now(this.createdAt.board),
      labels: [],
      members: [{
        userId: Meteor.userId(),
        isAdmin: true,
        isActive: true,
        isCommentOnly: false,
      }],
      permission: this.getPermission(trelloBoard.prefs.permissionLevel),
      slug: getSlug(trelloBoard.name) || 'board',
      stars: 0,
      title: trelloBoard.name,
    };
    // now add other members
    if(trelloBoard.memberships) {
      trelloBoard.memberships.forEach((trelloMembership) => {
        const trelloId = trelloMembership.idMember;
        // do we have a mapping?
        if(this.members[trelloId]) {
          const wekanId = this.members[trelloId];
          // do we already have it in our list?
          const wekanMember = boardToCreate.members.find((wekanMember) => wekanMember.userId === wekanId);
          if(wekanMember) {
            // we're already mapped, but maybe with lower rights
            if(!wekanMember.isAdmin) {
              wekanMember.isAdmin = this.getAdmin(trelloMembership.memberType);
            }
          } else {
            boardToCreate.members.push({
              userId: wekanId,
              isAdmin: this.getAdmin(trelloMembership.memberType),
              isActive: true,
              isCommentOnly: false,
            });
          }
        }
      });
    }
    trelloBoard.labels.forEach((label) => {
      const labelToCreate = {
        _id: Random.id(6),
        color: label.color,
        name: label.name,
      };
      // We need to remember them by Trello ID, as this is the only ref we have
      // when importing cards.
      this.labels[label.id] = labelToCreate._id;
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
        id: trelloBoard.id,
        system: 'Trello',
        url: trelloBoard.url,
      },
      // We attribute the import to current user,
      // not the author from the original object.
      userId: this._user(),
    });
    return boardId;
  }

  /**
   * Create the Wekan cards corresponding to the supplied Trello cards,
   * as well as all linked data: activities, comments, and attachments
   * @param trelloCards
   * @param boardId
   * @returns {Array}
   */
  createCards(trelloCards, boardId) {
    const result = [];
    trelloCards.forEach((card) => {
      const cardToCreate = {
        archived: card.closed,
        boardId,
        // very old boards won't have a creation activity so no creation date
        createdAt: this._now(this.createdAt.cards[card.id]),
        dateLastActivity: this._now(),
        description: card.desc,
        listId: this.lists[card.idList],
        sort: card.pos,
        title: card.name,
        // we attribute the card to its creator if available
        userId: this._user(this.createdBy.cards[card.id]),
      };
      // add labels
      if (card.idLabels) {
        cardToCreate.labelIds = card.idLabels.map((trelloId) => {
          return this.labels[trelloId];
        });
      }
      // add members {
      if(card.idMembers) {
        const wekanMembers = [];
        // we can't just map, as some members may not have been mapped
        card.idMembers.forEach((trelloId) => {
          if(this.members[trelloId]) {
            const wekanId = this.members[trelloId];
            // we may map multiple Trello members to the same wekan user
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
      // keep track of Trello id => WeKan id
      this.cards[card.id] = cardId;
      // log activity
      Activities.direct.insert({
        activityType: 'importCard',
        boardId,
        cardId,
        createdAt: this._now(),
        listId: cardToCreate.listId,
        source: {
          id: card.id,
          system: 'Trello',
          url: card.url,
        },
        // we attribute the import to current user,
        // not the author of the original card
        userId: this._user(),
      });
      // add comments
      const comments = this.comments[card.id];
      if (comments) {
        comments.forEach((comment) => {
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
          const commentId = CardComments.direct.insert(commentToCreate);
          Activities.direct.insert({
            activityType: 'addComment',
            boardId: commentToCreate.boardId,
            cardId: commentToCreate.cardId,
            commentId,
            createdAt: this._now(commentToCreate.createdAt),
            // we attribute the addComment (not the import)
            // to the original author - it is needed by some UI elements.
            userId: commentToCreate.userId,
          });
        });
      }
      const attachments = this.attachments[card.id];
      const trelloCoverId = card.idAttachmentCover;
      if (attachments) {
        attachments.forEach((att) => {
          const file = new FS.File();
          // Simulating file.attachData on the client generates multiple errors
          // - HEAD returns null, which causes exception down the line
          // - the template then tries to display the url to the attachment which causes other errors
          // so we make it server only, and let UI catch up once it is done, forget about latency comp.
          if(Meteor.isServer) {
            file.attachData(att.url, function (error) {
              file.boardId = boardId;
              file.cardId = cardId;
              if (error) {
                throw(error);
              } else {
                const wekanAtt = Attachments.insert(file, () => {
                  // we do nothing
                });
                //
                if(trelloCoverId === att.id) {
                  Cards.direct.update(cardId, { $set: {coverId: wekanAtt._id}});
                }
              }
            });
          }
          // todo XXX set cover - if need be
        });
      }
      result.push(cardId);
    });
    return result;
  }

  // Create labels if they do not exist and load this.labels.
  createLabels(trelloLabels, board) {
    trelloLabels.forEach((label) => {
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

  createLists(trelloLists, boardId) {
    trelloLists.forEach((list) => {
      const listToCreate = {
        archived: list.closed,
        boardId,
        // We are being defensing here by providing a default date (now) if the
        // creation date wasn't found on the action log. This happen on old
        // Trello boards (eg from 2013) that didn't log the 'createList' action
        // we require.
        createdAt: this._now(this.createdAt.lists[list.id]),
        title: list.name,
      };
      const listId = Lists.direct.insert(listToCreate);
      Lists.direct.update(listId, {$set: {'updatedAt': this._now()}});
      this.lists[list.id] = listId;
      // log activity
      Activities.direct.insert({
        activityType: 'importList',
        boardId,
        createdAt: this._now(),
        listId,
        source: {
          id: list.id,
          system: 'Trello',
        },
        // We attribute the import to current user,
        // not the creator of the original object
        userId: this._user(),
      });
    });
  }

  createChecklists(trelloChecklists) {
    trelloChecklists.forEach((checklist) => {
      // Create the checklist
      const checklistToCreate = {
        cardId: this.cards[checklist.idCard],
        title: checklist.name,
        createdAt: this._now(),
      };
      const checklistId = Checklists.direct.insert(checklistToCreate);
      // Now add the items to the checklist
      const itemsToCreate = [];
      checklist.checkItems.forEach((item) => {
        itemsToCreate.push({
          _id: checklistId + itemsToCreate.length,
          title: item.name,
          isFinished: item.state === 'complete',
        });
      });
      Checklists.direct.update(checklistId, {$set: {items: itemsToCreate}});
    });
  }

  getAdmin(trelloMemberType) {
    return trelloMemberType === 'admin';
  }

  getColor(trelloColorCode) {
    // trello color name => wekan color
    const mapColors = {
      'blue': 'belize',
      'orange': 'pumpkin',
      'green': 'nephritis',
      'red': 'pomegranate',
      'purple': 'wisteria',
      'pink': 'pomegranate',
      'lime': 'nephritis',
      'sky': 'belize',
      'grey': 'midnight',
    };
    const wekanColor = mapColors[trelloColorCode];
    return wekanColor || Boards.simpleSchema()._schema.color.allowedValues[0];
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
    trelloActions.forEach((action) => {
      if (action.type === 'addAttachmentToCard') {
        // We have to be cautious, because the attachment could have been removed later.
        // In that case Trello still reports its addition, but removes its 'url' field.
        // So we test for that
        const trelloAttachment = action.data.attachment;
        if(trelloAttachment.url) {
          // we cannot actually create the Wekan attachment, because we don't yet
          // have the cards to attach it to, so we store it in the instance variable.
          const trelloCardId = action.data.card.id;
          if(!this.attachments[trelloCardId]) {
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
}

Meteor.methods({
  importTrelloBoard(trelloBoard, data) {
    const trelloCreator = new TrelloCreator(data);

    // 1. check all parameters are ok from a syntax point of view
    try {
      check(data, {
        membersMapping: Match.Optional(Object),
      });
      trelloCreator.checkActions(trelloBoard.actions);
      trelloCreator.checkBoard(trelloBoard);
      trelloCreator.checkLabels(trelloBoard.labels);
      trelloCreator.checkLists(trelloBoard.lists);
      trelloCreator.checkCards(trelloBoard.cards);
      trelloCreator.checkChecklists(trelloBoard.checklists);
    } catch (e) {
      throw new Meteor.Error('error-json-schema');
    }

    // 2. check parameters are ok from a business point of view (exist &
    // authorized) nothing to check, everyone can import boards in their account

    // 3. create all elements
    trelloCreator.parseActions(trelloBoard.actions);
    const boardId = trelloCreator.createBoardAndLabels(trelloBoard);
    trelloCreator.createLists(trelloBoard.lists, boardId);
    trelloCreator.createCards(trelloBoard.cards, boardId);
    trelloCreator.createChecklists(trelloBoard.checklists);
    // XXX add members
    return boardId;
  },
});
