Boards = new Mongo.Collection('boards');

Boards.attachSchema(new SimpleSchema({
  title: {
    type: String,
  },
  slug: {
    type: String,
  },
  archived: {
    type: Boolean,
  },
  createdAt: {
    type: Date,
    denyUpdate: true,
  },
  // XXX Inconsistent field naming
  modifiedAt: {
    type: Date,
    denyInsert: true,
    optional: true,
  },
  // De-normalized number of users that have starred this board
  stars: {
    type: Number,
  },
  // De-normalized label system
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
  'members.$.userId': {
    type: String,
  },
  'members.$.isAdmin': {
    type: Boolean,
  },
  'members.$.isActive': {
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
  },
}));


Boards.helpers({
  isPublic() {
    return this.permission === 'public';
  },

  lists() {
    return Lists.find({ boardId: this._id, archived: false },
                                                          { sort: { sort: 1 }});
  },

  activities() {
    return Activities.find({ boardId: this._id }, { sort: { createdAt: -1 }});
  },

  activeMembers() {
    return _.where(this.members, {isActive: true});
  },

  getLabel(name, color) {
    return _.findWhere(this.labels, { name, color });
  },

  labelIndex(labelId) {
    return _.indexOf(_.pluck(this.labels, '_id'), labelId);
  },

  memberIndex(memberId) {
    return _.indexOf(_.pluck(this.members, 'userId'), memberId);
  },

  absoluteUrl() {
    return FlowRouter.path('board', { id: this._id, slug: this.slug });
  },

  colorClass() {
    return `board-color-${this.color}`;
  },

  // XXX currently mutations return no value so we have an issue when using addLabel in import
  // XXX waiting on https://github.com/mquandalle/meteor-collection-mutations/issues/1 to remove...
  pushLabel(name, color) {
    const _id = Random.id(6);
    Boards.direct.update(this._id, { $push: {labels: { _id, name, color }}});
    return _id;
  },
});

Boards.mutations({
  archive() {
    return { $set: { archived: true }};
  },

  restore() {
    return { $set: { archived: false }};
  },

  rename(title) {
    return { $set: { title }};
  },

  setColor(color) {
    return { $set: { color }};
  },

  setVisibility(visibility) {
    return { $set: { permission: visibility }};
  },

  addLabel(name, color) {
    // If label with the same name and color already exists we don't want to
    // create another one because they would be indistinguishable in the UI
    // (they would still have different `_id` but that is not exposed to the
    // user).
    if (!this.getLabel(name, color)) {
      const _id = Random.id(6);
      return { $push: {labels: { _id, name, color }}};
    }
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
  },

  removeLabel(labelId) {
    return { $pull: { labels: { _id: labelId }}};
  },

  addMember(memberId) {
    const memberIndex = this.memberIndex(memberId);
    if (memberIndex === -1) {
      return {
        $push: {
          members: {
            userId: memberId,
            isAdmin: false,
            isActive: true,
          },
        },
      };
    } else {
      return {
        $set: {
          [`members.${memberIndex}.isActive`]: true,
          [`members.${memberIndex}.isAdmin`]: false,
        },
      };
    }
  },

  removeMember(memberId) {
    const memberIndex = this.memberIndex(memberId);

    return {
      $set: {
        [`members.${memberIndex}.isActive`]: false,
      },
    };
  },

  setMemberPermission(memberId, isAdmin) {
    const memberIndex = this.memberIndex(memberId);

    return {
      $set: {
        [`members.${memberIndex}.isAdmin`]: isAdmin,
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
      const nbAdmins = _.filter(doc.members, (member) => {
        return member.isAdmin;
      }).length;
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
}

Boards.before.insert((userId, doc) => {
  // XXX We need to improve slug management. Only the id should be necessary
  // to identify a board in the code.
  // XXX If the board title is updated, the slug should also be updated.
  // In some cases (Chinese and Japanese for instance) the `getSlug` function
  // return an empty string. This is causes bugs in our application so we set
  // a default slug in this case.
  doc.slug = doc.slug || getSlug(doc.title) || 'board';
  doc.createdAt = new Date();
  doc.archived = false;
  doc.members = doc.members || [{
    userId,
    isAdmin: true,
    isActive: true,
  }];
  doc.stars = 0;
  doc.color = Boards.simpleSchema()._schema.color.allowedValues[0];

  // Handle labels
  const colors = Boards.simpleSchema()._schema['labels.$.color'].allowedValues;
  const defaultLabelsColors = _.clone(colors).splice(0, 6);
  doc.labels = defaultLabelsColors.map((color) => {
    return {
      color,
      _id: Random.id(6),
      name: '',
    };
  });
});

Boards.before.update((userId, doc, fieldNames, modifier) => {
  modifier.$set = modifier.$set || {};
  modifier.$set.modifiedAt = new Date();
});

if (Meteor.isServer) {
  // Let MongoDB ensure that a member is not included twice in the same board
  Meteor.startup(() => {
    Boards._collection._ensureIndex({
      _id: 1,
      'members.userId': 1,
    }, { unique: true });
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
      !modifier.$pull.labels._id)
      return;

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

  // Add a new activity if we add or remove a member to the board
  Boards.after.update((userId, doc, fieldNames, modifier) => {
    if (!_.contains(fieldNames, 'members'))
      return;

    let memberId;

    // Say hello to the new member
    if (modifier.$push && modifier.$push.members) {
      memberId = modifier.$push.members.userId;
      Activities.insert({
        userId,
        memberId,
        type: 'member',
        activityType: 'addBoardMember',
        boardId: doc._id,
      });
    }

    // Say goodbye to the former member
    if (modifier.$pull && modifier.$pull.members) {
      memberId = modifier.$pull.members.userId;
      Activities.insert({
        userId,
        memberId,
        type: 'member',
        activityType: 'removeBoardMember',
        boardId: doc._id,
      });
    }
  });
}
