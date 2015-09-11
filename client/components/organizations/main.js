
var subManager = new SubsManager();

BlazeComponent.extendComponent({
  template: function() {
    return 'organization';
  },
  onCreated: function() {
    var self = this;
    self.isOrgReady = new ReactiveVar(false);

    // The pattern we use to manually handle data loading is described here:
    // https://kadira.io/academy/meteor-routing-guide/content/subscriptions-and-data-management/using-subs-manager
    // XXX The boardId should be readed from some sort the component "props",
    // unfortunatly, Blaze dsubscribesn't have this notion.
    self.autorun(function() {
      var handle = subManager.subscribe('organization', Session.get('currentOrganizationShortName'));
      self.isOrgReady.set(handle.ready());
    });

  },
  events: function(){
    return [{
        'click .js-manage-org-members': Popup.open('addOrgMember')

      }];
  },

}).register('organization');

var getMemberIndex = function(org, searchId) {
  for (var i = 0; i < org.members.length; i++) {
    if (org.members[i].userId === searchId)
      return i;
  }
  throw new Meteor.Error('Member not found');
};
BlazeComponent.extendComponent({
  template: function() {
    return 'userCard';
  },
  user: function() {
    return Users.findOne(this.currentData().user.userId
      );
  },
  userData: function() {
    return Users.findOne(this.currentData().user.userId
      );
  },
  orgData:function() {
    return Organizations.findOne({shortName: Session.get('currentOrganizationShortName')});
  },
  isLastMember: function() {
    if (! (this.userData()&&this.userData().isOrganizationMember()))
      return false;
    var currentOrganization = Organizations.findOne({shortName: Session.get('currentOrganizationShortName')});
    var nbMembers = currentOrganization.members.length;
    return nbMembers === 1;
  },
  isLastAdmin: function() {
    if (! (this.userData()&&this.userData().isOrganizationAdmin()))
      return false;
    var currentOrganization = Organizations.findOne({shortName: Session.get('currentOrganizationShortName')});
    var nbAdmins = _.where(currentOrganization.members, { isAdmin: true }).length;
    return nbAdmins === 1;
  },
  isCurrentUser: function(){
    return Meteor.userId() === this.currentData().user.userId;
  },
  memberType: function(){
    if( this.currentData().user.isAdmin )
      return "admin";
    else
      return "member";
  },
  events: function(){
    return [{
        'click .js-change-org-role:not(.disabled)': Popup.open('changeOrgPermission'),
        'click .js-remove-or-deactivate:not(.disabled)': Popup.afterConfirm('removeOrgMember', function() {
          var currentOrganization = Organizations.findOne({shortName: Session.get('currentOrganizationShortName')});
          var memberIndex = getMemberIndex(currentOrganization, this.currentData().user._id);
          var setQuery = {};
          setQuery[['members', memberIndex, 'isActive'].join('.')] = false;
          Organizations.update(currentOrganization._id, { $set: setQuery });
          Popup.close();
        })
      }];
  },


}).register('userCard');


Template.addOrgMemberPopup.helpers({
  userData: function() {
    var user = Users.findOne(this._id);
    return user;
  },
  isOrganizationMember: function() {
    var user = Users.findOne(this._id);
    return user && user.isOrganizationMember();
  }
});

Template.addOrgMemberPopup.events({
  'click .pop-over-member-list li:not(.disabled)': function() {
    var userId = this._id;
    var currentOrganization = Organizations.findOne({shortName: Session.get('currentOrganizationShortName')});
    var currentMembersIds = _.pluck(currentOrganization.members, 'userId');
    if (currentMembersIds.indexOf(userId) === -1) {
      Organizations.update(currentOrganization._id, {
        $push: {
          members: {
            userId: userId,
            isAdmin: false,
            isActive: true
          }
        }
      });
    } else {
      var memberIndex = getMemberIndex(currentBoard, userId);
      var setQuery = {};
      setQuery[['members', memberIndex, 'isActive'].join('.')] = true;
      Organizations.update(currentOrganization._id, { $set: setQuery });
    }
    Popup.close();
  }
});

Template.addOrgMemberPopup.onRendered(function() {
  this.find('.js-search-member input').focus();
});

Template.removeOrgMemberPopup.helpers({
  userData: function() {
    return Users.findOne(this.user.userId
      );
  }
});


Template.changeOrgPermissionPopup.events({
  'click .js-set-admin, click .js-set-normal': function(event) {
    var currentOrganization = Organizations.findOne({shortName: Session.get('currentOrganizationShortName')});
    var memberIndex = getMemberIndex(currentOrganization, this.user.userId);
    var isAdmin = $(event.currentTarget).hasClass('js-set-admin');
    var setQuery = {};
    setQuery[['members', memberIndex, 'isAdmin'].join('.')] = isAdmin;
    Organizations.update(currentOrganization._id, {
      $set: setQuery
    });
    Popup.back(1);
  }
});

Template.changeOrgPermissionPopup.helpers({
  userData: function() {
    return Users.findOne(this.user.userId
      );
  },
  isAdmin: function() {
    var user = Users.findOne(this.user.userId);
    return user.isOrganizationAdmin();
  },
  isLastAdmin: function() {
    var user = Users.findOne(this.user.userId);
    if (! user.isOrganizationAdmin())
      return false;
    var currentOrganization = Organizations.findOne({shortName: Session.get('currentOrganizationShortName')});
    var nbAdmins = _.where(currentOrganization.members, { isAdmin: true }).length;
    return nbAdmins === 1;
  }
});





