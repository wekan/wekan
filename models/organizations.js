Organizations = new Mongo.Collection('organizations');

Organizations.attachSchema(new SimpleSchema({
  title: {
    type: String
  },
  shortName: {
    type: String,
    unique: true
  },
  description: {
    type: String
  },
  slug: {
    type: String
  },
  archived: {
    type: Boolean
  },
  createdAt: {
    type: Date,
    denyUpdate: true
  },
  // XXX Inconsistent field naming
  modifiedAt: {
    type: Date,
    denyInsert: true,
    optional: true
  },
  sort: {
    type: Number,
    decimal: true,
    // XXX We should probably provide a default
    optional: true
  },
  // XXX We might want to maintain more informations under the member sub-
  // documents like de-normalized meta-data (the date the member joined the
  // board, the number of contributions, etc.).
  'members.$.userId': {
    type: String
  },
  'members.$.isAdmin': {
    type: Boolean
  },
  'members.$.isActive': {
    type: Boolean
  },
  
  color: {
    type: String,
    allowedValues: [
    'nephritis', 'pomegranate', 'belize',
    'wisteria', 'midnight', 'pumpkin']
  }
}));

if (Meteor.isServer) {
  Organizations.allow({
    insert: Meteor.userId,
    update: allowIsOrgAdmin,
    remove: allowIsOrgAdmin,
    fetch: ['members']
  });

  // The number of users that have starred this board is managed by trusted code
  // and the user is not allowed to update it
  // Organizations.deny({
  //   update: function(userId, board, fieldNames) {
  //     return _.contains(fieldNames, 'stars');
  //   },
  //   fetch: []
  // });

  // We can't remove a member if it is the last administrator
  Organizations.deny({
    update: function(userId, doc, fieldNames, modifier) {
      if (! _.contains(fieldNames, 'members'))
        return false;

      // We only care in case of a $pull operation, ie remove a member
      if (! _.isObject(modifier.$pull && modifier.$pull.members))
        return false;

      // If there is more than one admin, it's ok to remove anyone
      var nbAdmins = _.filter(doc.members, function(member) {
        return member.isAdmin;
      }).length;
      if (nbAdmins > 1)
        return false;

      // If all the previous conditions were verified, we can't remove
      // a user if it's an admin
      var removedMemberId = modifier.$pull.members.userId;
      return !! _.findWhere(doc.members, {
        userId: removedMemberId,
        isAdmin: true,
      });
    },
    fetch: ['members'],
  });
}

Organizations.helpers({
  boards() {
    return Boards.find({ organizationId: this._id, archived: false },
                                                          { sort: { sort: 1 }});
  },
  
  activities() {
    return Activities.find({ organizationId: this._id }, { sort: { createdAt: -1 }});
  },
  absoluteUrl() {
    return Router.path('Org', { organizationId: this._id, slug: this.slug });
  },
  colorClass() {
    return 'org-color-' + this.color;
  },
  memberIndex(memberId) {
    return _.indexOf(_.pluck(this.members, 'userId'), memberId);
  },
});
Organizations.mutations({
  setTitle(title) {
    return { $set: { title }};
  },

  setDescription(description) {
    return { $set: { description }};
  },

  setShortName(shortName) {
    return { $set: { shortName }};
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
Organizations.before.insert(function(userId, doc) {
  // XXX We need to improve slug management. Only the id should be necessary
  // to identify a board in the code.
  // XXX If the board title is updated, the slug should also be updated.
  // In some cases (Chinese and Japanese for instance) the `getSlug` function
  // return an empty string. This is causes bugs in our application so we set
  // a default slug in this case.
  doc.slug = doc.slug || getSlug(doc.title) || 'organization';
  doc.createdAt = new Date();
  doc.archived = false;
  doc.members = [{
    userId,
    isAdmin: true,
    isActive: true,
  }];

  doc.color = Organizations.simpleSchema()._schema.color.allowedValues[0];

});

Organizations.before.update(function(userId, doc, fieldNames, modifier) {
  modifier.$set = modifier.$set || {};
  modifier.$set.modifiedAt = new Date();
});

if (Meteor.isServer) {
  // Let MongoDB ensure that a member is not included twice in the same board
  Meteor.startup(function() {
    Organizations._collection._ensureIndex({
      _id: 1,
      'members.userId': 1,
    }, { unique: true });
  });

  // Genesis: the first activity of the newly created board
  Organizations.after.insert(function(userId, doc) {
    Activities.insert({
      type: 'organization',
      activityTypeId: doc._id,
      activityType: 'createOrganization',
      organizationId: doc._id,
      userId,
    });
  });

  let getMemberIndex = function(org, searchId) {
    for (let i = 0; i < org.members.length; i++) {
      if (org.members[i].userId === searchId)
        return i;
    }
    throw new Meteor.Error('Member not found');
  };

  Organizations.after.update(function(userId, doc, fieldNames, modifier) {
    if (!_.contains(fieldNames, 'members') ||
      !modifier.$pull ||
      !modifier.$pull.members ||
      !modifier.$pull.members._id)
      return;
    const boards = Boards.find({organizationId: doc._id});
    for(let i=0; i<boards; i++) {
      const board = boards[i];
      const memberId = modifier.$pull.members.userId;
      let memberIndex = getMemberIndex(board, memberId);
      let setQuery = {};
      setQuery[['members', memberIndex, 'isActive'].join('.')] = false; 
      Boards.update({ _id: board._id }, { $set: setQuery });
    }

  });

  // Add a new activity if we add or remove a member to the board
  Organizations.after.update(function(userId, doc, fieldNames, modifier) {
    if (!_.contains(fieldNames, 'members'))
      return;

    let memberId;

    // Say hello to the new member
    if (modifier.$push && modifier.$push.members) {
      memberId = modifier.$push.members.userId;
      Activities.insert({
        type: 'member',
        activityType: 'addOrganizationMember',
        organizationId: doc._id,
        userId,
        memberId,
      });
    }

    // Say goodbye to the former member
    if (modifier.$pull && modifier.$pull.members) {
      memberId = modifier.$pull.members.userId;
      Activities.insert({
        type: 'member',
        activityType: 'removeOrganizationMember',
        organizationId: doc._id,
        userId,
        memberId,
      });
    }
  });
}
