const orgsPerPage = 25;
const teamsPerPage = 25;
const usersPerPage = 25;

BlazeComponent.extendComponent({
  mixins() {
    return [Mixins.InfiniteScrolling];
  },
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.orgSetting = new ReactiveVar(true);
    this.teamSetting = new ReactiveVar(true);
    this.peopleSetting = new ReactiveVar(true);
    this.findOrgsOptions = new ReactiveVar({});
    this.findTeamsOptions = new ReactiveVar({});
    this.findUsersOptions = new ReactiveVar({});
    this.numberOrgs = new ReactiveVar(0);
    this.numberTeams = new ReactiveVar(0);
    this.numberPeople = new ReactiveVar(0);

    this.page = new ReactiveVar(1);
    this.loadNextPageLocked = false;
    this.callFirstWith(null, 'resetNextPeak');
    this.autorun(() => {
      const limitOrgs = this.page.get() * orgsPerPage;
      const limitTeams = this.page.get() * teamsPerPage;
      const limitUsers = this.page.get() * usersPerPage;

      this.subscribe('org', this.findOrgsOptions.get(), limitOrgs, () => {
        this.loadNextPageLocked = false;
        const nextPeakBefore = this.callFirstWith(null, 'getNextPeak');
        this.calculateNextPeak();
        const nextPeakAfter = this.callFirstWith(null, 'getNextPeak');
        if (nextPeakBefore === nextPeakAfter) {
          this.callFirstWith(null, 'resetNextPeak');
        }
      });

      this.subscribe('team', this.findTeamsOptions.get(), limitTeams, () => {
        this.loadNextPageLocked = false;
        const nextPeakBefore = this.callFirstWith(null, 'getNextPeak');
        this.calculateNextPeak();
        const nextPeakAfter = this.callFirstWith(null, 'getNextPeak');
        if (nextPeakBefore === nextPeakAfter) {
          this.callFirstWith(null, 'resetNextPeak');
        }
      });

      this.subscribe('people', this.findUsersOptions.get(), limitUsers, () => {
        this.loadNextPageLocked = false;
        const nextPeakBefore = this.callFirstWith(null, 'getNextPeak');
        this.calculateNextPeak();
        const nextPeakAfter = this.callFirstWith(null, 'getNextPeak');
        if (nextPeakBefore === nextPeakAfter) {
          this.callFirstWith(null, 'resetNextPeak');
        }
      });
    });
  },
  events() {
    return [
      {
        'click #searchOrgButton'() {
          this.filterOrg();
        },
        'keydown #searchOrgInput'(event) {
          if (event.keyCode === 13 && !event.shiftKey) {
            this.filterOrg();
          }
        },
        'click #searchTeamButton'() {
          this.filterTeam();
        },
        'keydown #searchTeamInput'(event) {
          if (event.keyCode === 13 && !event.shiftKey) {
            this.filterTeam();
          }
        },
        'click #searchButton'() {
          this.filterPeople();
        },
        'keydown #searchInput'(event) {
          if (event.keyCode === 13 && !event.shiftKey) {
            this.filterPeople();
          }
        },
        'click #newOrgButton'() {
          Popup.open('newOrg');
        },
        'click #newTeamButton'() {
          Popup.open('newTeam');
        },
        'click #newUserButton'() {
          Popup.open('newUser');
        },
        'click a.js-org-menu': this.switchMenu,
        'click a.js-team-menu': this.switchMenu,
        'click a.js-people-menu': this.switchMenu,
      },
    ];
  },
  filterPeople() {
    const value = $('#searchInput')
      .first()
      .val();
    if (value === '') {
      this.findUsersOptions.set({});
    } else {
      const regex = new RegExp(value, 'i');
      this.findUsersOptions.set({
        $or: [
          { username: regex },
          { 'profile.fullname': regex },
          { 'emails.address': regex },
        ],
      });
    }
  },
  loadNextPage() {
    if (this.loadNextPageLocked === false) {
      this.page.set(this.page.get() + 1);
      this.loadNextPageLocked = true;
    }
  },
  calculateNextPeak() {
    const element = this.find('.main-body');
    if (element) {
      const altitude = element.scrollHeight;
      this.callFirstWith(this, 'setNextPeak', altitude);
    }
  },
  reachNextPeak() {
    this.loadNextPage();
  },
  setError(error) {
    this.error.set(error);
  },
  setLoading(w) {
    this.loading.set(w);
  },
  orgList() {
    const orgs = Org.find(this.findOrgsOptions.get(), {
      fields: { _id: true },
    });
    this.numberOrgs.set(orgs.count(false));
    return orgs;
  },
  teamList() {
    const teams = Team.find(this.findTeamsOptions.get(), {
      fields: { _id: true },
    });
    this.numberTeams.set(team.count(false));
    return teams;
  },
  peopleList() {
    const users = Users.find(this.findUsersOptions.get(), {
      fields: { _id: true },
    });
    this.numberPeople.set(users.count(false));
    return users;
  },
  orgNumber() {
    return this.numberOrgs.get();
  },
  teamNumber() {
    return this.numberTeams.get();
  },
  peopleNumber() {
    return this.numberPeople.get();
  },
  switchMenu(event) {
    const target = $(event.target);
    if (!target.hasClass('active')) {
      $('.side-menu li.active').removeClass('active');
      target.parent().addClass('active');
      const targetID = target.data('id');
      this.orgSetting.set('org-setting' === targetID);
      this.teamSetting.set('team-setting' === targetID);
      this.peopleSetting.set('people-setting' === targetID);
    }
  },
}).register('people');

Template.orgRow.helpers({
  orgData() {
    const orgCollection = this.esSearch ? ESSearchResults : Org;
    return orgCollection.findOne(this.orgId);
  },
});

Template.teamRow.helpers({
  teamData() {
    const teamCollection = this.esSearch ? ESSearchResults : Team;
    return teamCollection.findOne(this.teamId);
  },
});

Template.peopleRow.helpers({
  userData() {
    const userCollection = this.esSearch ? ESSearchResults : Users;
    return userCollection.findOne(this.userId);
  },
});

Template.editUserPopup.onCreated(function() {
  this.authenticationMethods = new ReactiveVar([]);
  this.errorMessage = new ReactiveVar('');

  Meteor.call('getAuthenticationsEnabled', (_, result) => {
    if (result) {
      // TODO : add a management of different languages
      // (ex {value: ldap, text: TAPi18n.__('ldap', {}, T9n.getLanguage() || 'en')})
      this.authenticationMethods.set([
        { value: 'password' },
        // Gets only the authentication methods availables
        ...Object.entries(result)
          .filter(e => e[1])
          .map(e => ({ value: e[0] })),
      ]);
    }
  });
});

Template.editOrgPopup.helpers({
  org() {
    return Org.findOne(this.orgId);
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

Template.editTeamPopup.helpers({
  team() {
    return Team.findOne(this.teamId);
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

Template.editUserPopup.helpers({
  user() {
    return Users.findOne(this.userId);
  },
  authentications() {
    return Template.instance().authenticationMethods.get();
  },
  isSelected(match) {
    const userId = Template.instance().data.userId;
    const selected = Users.findOne(userId).authenticationMethod;
    return selected === match;
  },
  isLdap() {
    const userId = Template.instance().data.userId;
    const selected = Users.findOne(userId).authenticationMethod;
    return selected === 'ldap';
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

Template.newOrgPopup.onCreated(function() {
  this.errorMessage = new ReactiveVar('');
});

Template.newTeamPopup.onCreated(function() {
  this.errorMessage = new ReactiveVar('');
});

Template.newUserPopup.onCreated(function() {
  this.authenticationMethods = new ReactiveVar([]);
  this.errorMessage = new ReactiveVar('');

  Meteor.call('getAuthenticationsEnabled', (_, result) => {
    if (result) {
      // TODO : add a management of different languages
      // (ex {value: ldap, text: TAPi18n.__('ldap', {}, T9n.getLanguage() || 'en')})
      this.authenticationMethods.set([
        { value: 'password' },
        // Gets only the authentication methods availables
        ...Object.entries(result)
          .filter(e => e[1])
          .map(e => ({ value: e[0] })),
      ]);
    }
  });
});

Template.newOrgPopup.helpers({
  org() {
    return Org.findOne(this.orgId);
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

Template.newTeamPopup.helpers({
  team() {
    return Team.findOne(this.teamId);
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

Template.newUserPopup.helpers({
  user() {
    return Users.findOne(this.userId);
  },
  authentications() {
    return Template.instance().authenticationMethods.get();
  },
  isSelected(match) {
    const userId = Template.instance().data.userId;
    const selected = Users.findOne(userId).authenticationMethod;
    return selected === match;
  },
  isLdap() {
    const userId = Template.instance().data.userId;
    const selected = Users.findOne(userId).authenticationMethod;
    return selected === 'ldap';
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

BlazeComponent.extendComponent({
  onCreated() {},
  org() {
    return Org.findOne(this.orgId);
  },
  events() {
    return [
      {
        'click a.edit-org': Popup.open('editOrg'),
        'click a.more-settings-org': Popup.open('settingsOrg'),
      },
    ];
  },
}).register('orgRow');

BlazeComponent.extendComponent({
  onCreated() {},
  team() {
    return Team.findOne(this.teamId);
  },
  events() {
    return [
      {
        'click a.edit-team': Popup.open('editTeam'),
        'click a.more-settings-team': Popup.open('settingsTeam'),
      },
    ];
  },
}).register('teamRow');

BlazeComponent.extendComponent({
  onCreated() {},
  user() {
    return Users.findOne(this.userId);
  },
  events() {
    return [
      {
        'click a.edit-user': Popup.open('editUser'),
        'click a.more-settings-user': Popup.open('settingsUser'),
      },
    ];
  },
}).register('peopleRow');

BlazeComponent.extendComponent({
  events() {
    return [
      {
        'click a.new-org': Popup.open('newOrg'),
      },
    ];
  },
}).register('newOrgRow');

BlazeComponent.extendComponent({
  events() {
    return [
      {
        'click a.new-team': Popup.open('newTeam'),
      },
    ];
  },
}).register('newTeamRow');

BlazeComponent.extendComponent({
  events() {
    return [
      {
        'click a.new-user': Popup.open('newUser'),
      },
    ];
  },
}).register('newUserRow');

Template.editOrgPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const org = Orgs.findOne(this.orgId);

    const orgDisplayName = templateInstance
      .find('.js-orgDisplayName')
      .value.trim();
    const orgDesc = templateInstance.find('.js-orgDesc').value.trim();
    const orgShortName = templateInstance.find('.js-orgShortName').value.trim();
    const orgWebsite = templateInstance.find('.js-orgWebsite').value.trim();
    const orgIsActive = templateInstance.find('.js-org-isactive').value.trim();

    const isChangeOrgDisplayName = orgDisplayName !== org.orgDisplayName;
    const isChangeOrgDesc = orgDesc !== org.orgDesc;
    const isChangeOrgShortName = orgShortName !== org.orgShortName;
    const isChangeOrgWebsite = orgWebsite !== org.orgWebsite;
    const isChangeOrgIsActive = orgIsActive !== org.orgIsActive;

    if (isChangeOrgDisplayName) {
      Meteor.call('setOrgDisplayName', org, orgDisplayName);
    }

    if (isChangeOrgDesc) {
      Meteor.call('setOrgDesc', org, orgDesc);
    }

    if (isChangeOrgShortName) {
      Meteor.call('setOrgShortName', org, orgShortName);
    }

    if (isChangeOrgIsActive) {
      Meteor.call('setOrgIsActive', org, orgIsActive);
    }

    Popup.close();
  },
});

Template.editTeamPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const team = Teams.findOne(this.teamId);

    const teamDisplayName = templateInstance
      .find('.js-teamDisplayName')
      .value.trim();
    const teamDesc = templateInstance.find('.js-teamDesc').value.trim();
    const teamShortName = templateInstance
      .find('.js-teamShortName')
      .value.trim();
    const teamWebsite = templateInstance.find('.js-teamWebsite').value.trim();
    const teamIsActive = templateInstance
      .find('.js-team-isactive')
      .value.trim();

    const isChangeTeamDisplayName = teamDisplayName !== team.teamDisplayName;
    const isChangeTeamDesc = teamDesc !== team.teamDesc;
    const isChangeTeamShortName = teamShortName !== team.teamShortName;
    const isChangeTeamWebsite = teamWebsite !== team.teamWebsite;
    const isChangeTeamIsActive = teamIsActive !== team.teamIsActive;

    if (isChangeTeamDisplayName) {
      Meteor.call('setTeamDisplayName', team, teamDisplayName);
    }

    if (isChangeTeamDesc) {
      Meteor.call('setTeamDesc', team, teamDesc);
    }

    if (isChangeTeamShortName) {
      Meteor.call('setTeamShortName', team, teamShortName);
    }

    if (isChangeTeamIsActive) {
      Meteor.call('setTeamIsActive', team, teamIsActive);
    }

    Popup.close();
  },
});

Template.editUserPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const user = Users.findOne(this.userId);
    const username = templateInstance.find('.js-profile-username').value.trim();
    const fullname = templateInstance.find('.js-profile-fullname').value.trim();
    const initials = templateInstance.find('.js-profile-initials').value.trim();
    const password = templateInstance.find('.js-profile-password').value;
    const isAdmin = templateInstance.find('.js-profile-isadmin').value.trim();
    const isActive = templateInstance.find('.js-profile-isactive').value.trim();
    const email = templateInstance.find('.js-profile-email').value.trim();
    const verified = templateInstance
      .find('.js-profile-email-verified')
      .value.trim();
    const authentication = templateInstance
      .find('.js-authenticationMethod')
      .value.trim();
    const importUsernames = templateInstance
      .find('.js-import-usernames')
      .value.trim();

    const isChangePassword = password.length > 0;
    const isChangeUserName = username !== user.username;
    const isChangeInitials = initials.length > 0;
    const isChangeEmailVerified = verified !== user.emails[0].verified;

    // If previously email address has not been set, it is undefined,
    // check for undefined, and allow adding email address.
    const isChangeEmail =
      email.toLowerCase() !==
      (typeof user.emails !== 'undefined'
        ? user.emails[0].address.toLowerCase()
        : false);

    Users.update(this.userId, {
      $set: {
        'profile.fullname': fullname,
        isAdmin: isAdmin === 'true',
        loginDisabled: isActive === 'true',
        authenticationMethod: authentication,
        importUsernames: Users.parseImportUsernames(importUsernames),
      },
    });

    if (isChangePassword) {
      Meteor.call('setPassword', password, this.userId);
    }

    if (isChangeEmailVerified) {
      Meteor.call('setEmailVerified', email, verified === 'true', this.userId);
    }

    if (isChangeInitials) {
      Meteor.call('setInitials', initials, this.userId);
    }

    if (isChangeUserName && isChangeEmail) {
      Meteor.call(
        'setUsernameAndEmail',
        username,
        email.toLowerCase(),
        this.userId,
        function(error) {
          const usernameMessageElement = templateInstance.$('.username-taken');
          const emailMessageElement = templateInstance.$('.email-taken');
          if (error) {
            const errorElement = error.error;
            if (errorElement === 'username-already-taken') {
              usernameMessageElement.show();
              emailMessageElement.hide();
            } else if (errorElement === 'email-already-taken') {
              usernameMessageElement.hide();
              emailMessageElement.show();
            }
          } else {
            usernameMessageElement.hide();
            emailMessageElement.hide();
            Popup.close();
          }
        },
      );
    } else if (isChangeUserName) {
      Meteor.call('setUsername', username, this.userId, function(error) {
        const usernameMessageElement = templateInstance.$('.username-taken');
        if (error) {
          const errorElement = error.error;
          if (errorElement === 'username-already-taken') {
            usernameMessageElement.show();
          }
        } else {
          usernameMessageElement.hide();
          Popup.close();
        }
      });
    } else if (isChangeEmail) {
      Meteor.call('setEmail', email.toLowerCase(), this.userId, function(
        error,
      ) {
        const emailMessageElement = templateInstance.$('.email-taken');
        if (error) {
          const errorElement = error.error;
          if (errorElement === 'email-already-taken') {
            emailMessageElement.show();
          }
        } else {
          emailMessageElement.hide();
          Popup.close();
        }
      });
    } else Popup.close();
  },
});

Template.newOrgPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const orgDisplayName = templateInstance
      .find('.js-orgDisplayName')
      .value.trim();
    const orgDesc = templateInstance.find('.js-orgDesc').value.trim();
    const orgShortName = templateInstance.find('.js-orgShortName').value.trim();
    const orgWebsite = templateInstance.find('.js-orgWebsite').value.trim();
    const orgIsActive = templateInstance.find('.js-org-isactive').value.trim();

    Meteor.call(
      'setCreateOrg',
      orgDisplayName,
      orgDesc,
      orgShortName,
      orgWebsite,
      orgIsActive,
    );
    Popup.close();
  },
});

Template.newTeamPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const teamDisplayName = templateInstance
      .find('.js-teamDisplayName')
      .value.trim();
    const teamDesc = templateInstance.find('.js-teamDesc').value.trim();
    const teamShortName = templateInstance
      .find('.js-teamShortName')
      .value.trim();
    const teamWebsite = templateInstance.find('.js-teamWebsite').value.trim();
    const teamIsActive = templateInstance
      .find('.js-team-isactive')
      .value.trim();

    Meteor.call(
      'setCreateTeam',
      teamDisplayName,
      teamDesc,
      teamShortName,
      teamWebsite,
      teamIsActive,
    );
    Popup.close();
  },
});

Template.newUserPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const fullname = templateInstance.find('.js-profile-fullname').value.trim();
    const username = templateInstance.find('.js-profile-username').value.trim();
    const initials = templateInstance.find('.js-profile-initials').value.trim();
    const password = templateInstance.find('.js-profile-password').value;
    const isAdmin = templateInstance.find('.js-profile-isadmin').value.trim();
    const isActive = templateInstance.find('.js-profile-isactive').value.trim();
    const email = templateInstance.find('.js-profile-email').value.trim();
    const importUsernames = Users.parseImportUsernames(
      templateInstance.find('.js-import-usernames').value,
    );

    Meteor.call(
      'setCreateUser',
      fullname,
      username,
      initials,
      password,
      isAdmin,
      isActive,
      email.toLowerCase(),
      importUsernames,
      function(error) {
        const usernameMessageElement = templateInstance.$('.username-taken');
        const emailMessageElement = templateInstance.$('.email-taken');
        if (error) {
          const errorElement = error.error;
          if (errorElement === 'username-already-taken') {
            usernameMessageElement.show();
            emailMessageElement.hide();
          } else if (errorElement === 'email-already-taken') {
            usernameMessageElement.hide();
            emailMessageElement.show();
          }
        } else {
          usernameMessageElement.hide();
          emailMessageElement.hide();
          Popup.close();
        }
      },
    );
    Popup.close();
  },
});

Template.settingsUserPopup.events({
  'click .impersonate-user'(event) {
    event.preventDefault();

    Meteor.call('impersonate', this.userId, err => {
      if (!err) {
        FlowRouter.go('/');
        Meteor.connection.setUserId(this.userId);
      }
    });
  },
  'click #deleteButton'(event) {
    event.preventDefault();
    /*
    // Delete is not enabled yet, because it does leave empty user avatars
    // to boards: boards members, card members and assignees have
    // empty users. See:
    // - wekan/client/components/settings/peopleBody.jade deleteButton
    // - wekan/client/components/settings/peopleBody.js deleteButton
    // - wekan/client/components/sidebar/sidebar.js Popup.afterConfirm('removeMember'
    //   that does now remove member from board, card members and assignees correctly,
    //   but that should be used to remove user from all boards similarly
    // - wekan/models/users.js Delete is not enabled
    //
    //console.log('user id: ' + this.userId);
    //Popup.afterConfirm('userDelete', function(event) {
    //Boards.find({ members: this.userId }).forEach(board => {
    //  console.log('board id: ' + board._id);
      //Cards.find({ boardId: board._id, members: this.userId }).forEach(card => {
      //  card.unassignMember(this.userId);
      //});
      //Cards.find({ boardId: board._id, members: this.userId }).forEach(card => {
      //  card.unassignMember(this.userId);
      //});
      //Cards.find({ boardId: board._id, assignees: this.userId }).forEach(card => {
      //  card.unassignAssignee(this.userId);
      //});
      //Boards.findOne({ boardId: board._id }).removeMember(this.userId);
    //});
    //Users.remove(this.userId);
    */
    Popup.close();
  },
});

Template.settingsUserPopup.helpers({
  user() {
    return Users.findOne(this.userId);
  },
  authentications() {
    return Template.instance().authenticationMethods.get();
  },
  isSelected(match) {
    const userId = Template.instance().data.userId;
    const selected = Users.findOne(userId).authenticationMethod;
    return selected === match;
  },
  isLdap() {
    const userId = Template.instance().data.userId;
    const selected = Users.findOne(userId).authenticationMethod;
    return selected === 'ldap';
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});
