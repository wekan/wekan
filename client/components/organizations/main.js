
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
        'click .js-manage-org-members': Popup.open('addOrgMember'),
        'click .js-edit-org': Popup.open('editOrgForm'),
        'click .js-org-send-invite': Popup.open('inviteEmailsForOrg'),

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
  canChangeRole(){
    if( this.isLastAdmin() || ! Meteor.user().isOrganizationAdmin() )
      return false;
    else
      return true;
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

BlazeComponent.extendComponent({
  template: function() {
    return 'editOrgFormPopup';
  },

  // Proxy
  open: function() {
    this.componentChildren('inlinedForm')[0].open();
  },

  onRendered() {
    let currentOrganization = Organizations.findOne({shortName: Session.get('currentOrganizationShortName')});
    if( currentOrganization ){
      this.find('.org-title-input').value = currentOrganization.title;
      this.find('.org-short-name-input').value = currentOrganization.shortName;
      this.find('.org-desc-input').value = currentOrganization.description;
      this.find('.org-title-input').focus();
    }
  },

  events: function() {
    return [{
      submit: function(evt) {
        evt.preventDefault();
        var title = this.find('.org-title-input');
        var shortName = this.find('.org-short-name-input');
        var desc = this.find('.org-desc-input');
        let currentOrganization = Organizations.findOne({shortName: Session.get('currentOrganizationShortName')});
        if( currentOrganization ){
          if ( $.trim(title.value) && $.trim(title.value)  !== currentOrganization.title )
            currentOrganization.setTitle($.trim(title.value));
          if ( $.trim(desc.value) && $.trim(desc.value)  !== currentOrganization.description )
            currentOrganization.setDescription($.trim(desc.value));
          if ( $.trim(shortName.value) && $.trim(shortName.value)  !== currentOrganization.shortName ){

            currentOrganization.setShortName($.trim(shortName.value));
            FlowRouter.go('/org/'+$.trim(shortName.value));
          }
        }
        
        title.value = '';
        title.focus();

        // support change shortName ?
        shortName.value = '';

        desc.value = '';
        Popup.close();
      }
    }];
  }
}).register('editOrgFormPopup');

Template.inviteEmailsForOrgPopup.events({
  submit(evt, tpl) {
    evt.preventDefault();
    const emails = $.trim(tpl.find('.js-invite-emails-input').value);
    
    const emailArray = emails.split(";");
    let currentOrganization = Organizations.findOne({shortName: Session.get('currentOrganizationShortName')});
        
    Meteor.call('enrollAccounts', emailArray, 'organization', currentOrganization._id, function (error, result){
      let notify;
    });
    Popup.back();
  },
});

