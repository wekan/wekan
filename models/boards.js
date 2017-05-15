Boards = new Mongo.Collection('boards');

Boards.attachSchema(new SimpleSchema({
  title: {
    type: String,
  },
  slug: {
    type: String,
    autoValue() { // eslint-disable-line consistent-return
      // XXX We need to improve slug management. Only the id should be necessary
      // to identify a board in the code.
      // XXX If the board title is updated, the slug should also be updated.
      // In some cases (Chinese and Japanese for instance) the `getSlug` function
      // return an empty string. This is causes bugs in our application so we set
      // a default slug in this case.
      if (this.isInsert && !this.isSet) {
        let slug = 'board';
        const title = this.field('title');
        if (title.isSet) {
          slug = getSlug(title.value) || slug;
        }
        return slug;
      }
    },
  },
  archived: {
    type: Boolean,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        return false;
      }
    },
  },
  createdAt: {
    type: Date,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert) {
        return new Date();
      } else {
        this.unset();
      }
    },
  },
  // XXX Inconsistent field naming
  modifiedAt: {
    type: Date,
    optional: true,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isUpdate) {
        return new Date();
      } else {
        this.unset();
      }
    },
  },
  // De-normalized number of users that have starred this board
  stars: {
    type: Number,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert) {
        return 0;
      }
    },
  },
  // De-normalized label system
  'labels': {
    type: [Object],
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        const colors = Boards.simpleSchema()._schema['labels.$.color'].allowedValues;
        const defaultLabelsColors = _.clone(colors).splice(0, 6);
        return defaultLabelsColors.map((color) => ({
          color,
          _id: Random.id(6),
          name: '',
        }));
      }
    },
  },
  'labels.$._id': {
    // We don't specify that this field must be unique in the board because that
    // will cause performance penalties and is not necessary since this field is
    // always set on the server.
    // XXX Actually if we create a new label, the `_id` is set on the client
    // without being overwritten by the server, could it be a problem?
    type: String,
  },
  'labels.$.name': {
    type: String,
    optional: true,
  },
  'labels.$.color': {
    type: String,
    allowedValues: [
      'green', 'yellow', 'orange', 'red', 'purple',
      'blue', 'sky', 'lime', 'pink', 'black',
    ],
  },
  // XXX We might want to maintain more informations under the member sub-
  // documents like de-normalized meta-data (the date the member joined the
  // board, the number of contributions, etc.).
  'members': {
    type: [Object],
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        return [{
          userId: this.userId,
          isAdmin: true,
          isActive: true,
          isCommentOnly: false,
        }];
      }
    },
  },
  'members.$.userId': {
    type: String,
  },
  'members.$.isAdmin': {
    type: Boolean,
  },
  'members.$.isActive': {
    type: Boolean,
  },
  'members.$.isCommentOnly': {
    type: Boolean,
  },
  permission: {
    type: String,
    allowedValues: ['public', 'private'],
  },
  color: {
    type: String,
    allowedValues: [
      'belize',
      'nephritis',
      'pomegranate',
      'pumpkin',
      'wisteria',
      'midnight',
    ],
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        return Boards.simpleSchema()._schema.color.allowedValues[0];
      }
    },
  },
  description: {
    type: String,
    optional: true,
  },
}));


Boards.helpers({
  /**
   * Is supplied user authorized to view this board?
   */
  isVisibleBy(user) {
    if (this.isPublic()) {
      // public boards are visible to everyone
      return true;
    } else {
      // otherwise you have to be logged-in and active member
      return user && this.isActiveMember(user._id);
    }
  },

  /**
   * Is the user one of the active members of the board?
   *
   * @param userId
   * @returns {boolean} the member that matches, or undefined/false
   */
  isActiveMember(userId) {
    if (userId) {
      return this.members.find((member) => (member.userId === userId && member.isActive));
    } else {
      return false;
    }
  },

  isPublic() {
    return this.permission === 'public';
  },

  lists() {
    return Lists.find({ boardId: this._id, archived: false }, { sort: { sort: 1 } });
  },

  activities() {
    return Activities.find({ boardId: this._id }, { sort: { createdAt: -1 } });
  },

  activeMembers() {
    return _.where(this.members, { isActive: true });
  },

  activeAdmins() {
    return _.where(this.members, { isActive: true, isAdmin: true });
  },

  memberUsers() {
    return Users.find({ _id: { $in: _.pluck(this.members, 'userId') } });
  },

  getLabel(name, color) {
    return _.findWhere(this.labels, { name, color });
  },

  labelIndex(labelId) {
    return _.pluck(this.labels, '_id').indexOf(labelId);
  },

  memberIndex(memberId) {
    return _.pluck(this.members, 'userId').indexOf(memberId);
  },

  hasMember(memberId) {
    return !!_.findWhere(this.members, { userId: memberId, isActive: true });
  },

  hasAdmin(memberId) {
    return !!_.findWhere(this.members, { userId: memberId, isActive: true, isAdmin: true });
  },

  hasCommentOnly(memberId) {
    return !!_.findWhere(this.members, { userId: memberId, isActive: true, isAdmin: false, isCommentOnly: true });
  },

  absoluteUrl() {
    return FlowRouter.url('board', { id: this._id, slug: this.slug });
  },

  colorClass() {
    return `board-color-${this.color}`;
  },

  // XXX currently mutations return no value so we have an issue when using addLabel in import
  // XXX waiting on https://github.com/mquandalle/meteor-collection-mutations/issues/1 to remove...
  pushLabel(name, color) {
    const _id = Random.id(6);
    Boards.direct.update(this._id, { $push: { labels: { _id, name, color } } });
    return _id;
  },
});

Boards.mutations({
  archive() {
    return { $set: { archived: true } };
  },

  restore() {
    return { $set: { archived: false } };
  },

  rename(title) {
    return { $set: { title } };
  },

  setDescription(description) {
    return { $set: { description } };
  },

  setColor(color) {
    return { $set: { color } };
  },

  setVisibility(visibility) {
    return { $set: { permission: visibility } };
  },

  addLabel(name, color) {
    // If label with the same name and color already exists we don't want to
    // create another one because they would be indistinguishable in the UI
    // (they would still have different `_id` but that is not exposed to the
    // user).
    if (!this.getLabel(name, color)) {
      const _id = Random.id(6);
      return { $push: { labels: { _id, name, color } } };
    }
    return {};
  },

  editLabel(labelId, name, color) {
    if (!this.getLabel(name, color)) {
      const labelIndex = this.labelIndex(labelId);
      return {
        $set: {
          [`labels.${labelIndex}.name`]: name,
          [`labels.${labelIndex}.color`]: color,
        },
      };
    }
    return {};
  },

  removeLabel(labelId) {
    return { $pull: { labels: { _id: labelId } } };
  },

  addMember(memberId) {
    const memberIndex = this.memberIndex(memberId);
    if (memberIndex >= 0) {
      return {
        $set: {
          [`members.${memberIndex}.isActive`]: true,
        },
      };
    }

    return {
      $push: {
        members: {
          userId: memberId,
          isAdmin: false,
          isActive: true,
          isCommentOnly: false,
        },
      },
    };
  },

  removeMember(memberId) {
    const memberIndex = this.memberIndex(memberId);

    // we do not allow the only one admin to be removed
    const allowRemove = (!this.members[memberIndex].isAdmin) || (this.activeAdmins().length > 1);
    if (!allowRemove) {
      return {
        $set: {
          [`members.${memberIndex}.isActive`]: true,
        },
      };
    }

    return {
      $set: {
        [`members.${memberIndex}.isActive`]: false,
        [`members.${memberIndex}.isAdmin`]: false,
      },
    };
  },

  setMemberPermission(memberId, isAdmin, isCommentOnly) {
    const memberIndex = this.memberIndex(memberId);

    // do not allow change permission of self
    if (memberId === Meteor.userId()) {
      isAdmin = this.members[memberIndex].isAdmin;
    }

    return {
      $set: {
        [`members.${memberIndex}.isAdmin`]: isAdmin,
        [`members.${memberIndex}.isCommentOnly`]: isCommentOnly,
      },
    };
  },
});

if (Meteor.isServer) {
  Boards.allow({
    insert: Meteor.userId,
    update: allowIsBoardAdmin,
    remove: allowIsBoardAdmin,
    fetch: ['members'],
  });

  // The number of users that have starred this board is managed by trusted code
  // and the user is not allowed to update it
  Boards.deny({
    update(userId, board, fieldNames) {
      return _.contains(fieldNames, 'stars');
    },
    fetch: [],
  });

  // We can't remove a member if it is the last administrator
  Boards.deny({
    update(userId, doc, fieldNames, modifier) {
      if (!_.contains(fieldNames, 'members'))
        return false;

      // We only care in case of a $pull operation, ie remove a member
      if (!_.isObject(modifier.$pull && modifier.$pull.members))
        return false;

      // If there is more than one admin, it's ok to remove anyone
      const nbAdmins = _.where(doc.members, { isActive: true, isAdmin: true }).length;
      if (nbAdmins > 1)
        return false;

      // If all the previous conditions were verified, we can't remove
      // a user if it's an admin
      const removedMemberId = modifier.$pull.members.userId;
      return Boolean(_.findWhere(doc.members, {
        userId: removedMemberId,
        isAdmin: true,
      }));
    },
    fetch: ['members'],
  });

  Meteor.methods({
    quitBoard(boardId) {
      check(boardId, String);
      const board = Boards.findOne(boardId);
      if (board) {
        const userId = Meteor.userId();
        const index = board.memberIndex(userId);
        if (index >= 0) {
          board.removeMember(userId);
          return true;
        } else throw new Meteor.Error('error-board-notAMember');
      } else throw new Meteor.Error('error-board-doesNotExist');
    },
  });
}

if (Meteor.isServer) {
  // Let MongoDB ensure that a member is not included twice in the same board
  Meteor.startup(() => {
    Boards._collection._ensureIndex({
      _id: 1,
      'members.userId': 1,
    }, { unique: true });
    Boards._collection._ensureIndex({ 'members.userId': 1 });
  });

  // Genesis: the first activity of the newly created board
  Boards.after.insert((userId, doc) => {
    Activities.insert({
      userId,
      type: 'board',
      activityTypeId: doc._id,
      activityType: 'createBoard',
      boardId: doc._id,
    });
  });

  // If the user remove one label from a board, we cant to remove reference of
  // this label in any card of this board.
  Boards.after.update((userId, doc, fieldNames, modifier) => {
    if (!_.contains(fieldNames, 'labels') ||
      !modifier.$pull ||
      !modifier.$pull.labels ||
      !modifier.$pull.labels._id) {
      return;
    }

    const removedLabelId = modifier.$pull.labels._id;
    Cards.update(
      { boardId: doc._id },
      {
        $pull: {
          labelIds: removedLabelId,
        },
      },
      { multi: true }
    );
  });

  const foreachRemovedMember = (doc, modifier, callback) => {
    Object.keys(modifier).forEach((set) => {
      if (modifier[set] !== false) {
        return;
      }

      const parts = set.split('.');
      if (parts.length === 3 && parts[0] === 'members' && parts[2] === 'isActive') {
        callback(doc.members[parts[1]].userId);
      }
    });
  };

  // Remove a member from all objects of the board before leaving the board
  Boards.before.update((userId, doc, fieldNames, modifier) => {
    if (!_.contains(fieldNames, 'members')) {
      return;
    }

    if (modifier.$set) {
      const boardId = doc._id;
      foreachRemovedMember(doc, modifier.$set, (memberId) => {
        Cards.update(
          { boardId },
          {
            $pull: {
              members: memberId,
              watchers: memberId,
            },
          },
          { multi: true }
        );

        Lists.update(
          { boardId },
          {
            $pull: {
              watchers: memberId,
            },
          },
          { multi: true }
        );

        const board = Boards._transform(doc);
        board.setWatcher(memberId, false);

        // Remove board from users starred list
        if (!board.isPublic()) {
          Users.update(
            memberId,
            {
              $pull: {
                'profile.starredBoards': boardId,
              },
            }
          );
        }
      });
    }
  });

  // Add a new activity if we add or remove a member to the board
  Boards.after.update((userId, doc, fieldNames, modifier) => {
    if (!_.contains(fieldNames, 'members')) {
      return;
    }

    // Say hello to the new member
    if (modifier.$push && modifier.$push.members) {
      const memberId = modifier.$push.members.userId;
      Activities.insert({
        userId,
        memberId,
        type: 'member',
        activityType: 'addBoardMember',
        boardId: doc._id,
      });
    }

    // Say goodbye to the former member
    if (modifier.$set) {
      foreachRemovedMember(doc, modifier.$set, (memberId) => {
        Activities.insert({
          userId,
          memberId,
          type: 'member',
          activityType: 'removeBoardMember',
          boardId: doc._id,
        });
      });
    }
  });
}

//BOARDS REST API
if (Meteor.isServer) {
  JsonRoutes.add('GET', '/api/user/boards', function (req, res, next) {
    Authentication.checkLoggedIn(req.userId);

    const data = Boards.find({
        archived: false,
        'members.userId': req.userId,
        }, {
        sort: ['title'],
      }).map(function(board) {
        return {
          _id: board._id,
          title: board.title
        }
    });

    JsonRoutes.sendResult(res, {code: 200, data});
  });

  JsonRoutes.add('GET', '/api/boards', function (req, res, next) {
    Authentication.checkUserId(req.userId);
    JsonRoutes.sendResult(res, {
      code: 200,
      data: Boards.find({ permission: 'public' }).map(function (doc) {
        return {
          _id: doc._id,
          title: doc.title,
        };
      }),
    });
  });

  JsonRoutes.add('GET', '/api/boards/:id', function (req, res, next) {
    const id = req.params.id;
    Authentication.checkBoardAccess( req.userId, id);

    JsonRoutes.sendResult(res, {
      code: 200,
      data: Boards.findOne({ _id: id }),
    });
  });

  JsonRoutes.add('POST', '/api/boards', function (req, res, next) {
    Authentication.checkUserId( req.userId);
    const id = Boards.insert({
      title: req.body.title,
      members: [
        {
          userId: req.body.owner,
          isAdmin: true,
          isActive: true,
          isCommentOnly: false,
        },
      ],
      permission: 'public',
      color: 'belize',
    });
    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: id,
      },
    });
  });

  JsonRoutes.add('DELETE', '/api/boards/:id', function (req, res, next) {
    Authentication.checkUserId( req.userId);
    const id = req.params.id;
    Boards.remove({ _id: id });
    JsonRoutes.sendResult(res, {
      code: 200,
      data:{
        _id: id,
      },
    });
  });
}
