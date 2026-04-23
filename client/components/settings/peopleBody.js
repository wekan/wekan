import { ReactiveCache } from '/imports/reactiveCache';
import { avatarUpdateCounter } from '/client/components/users/avatarUpdateCounter';
import { InfiniteScrolling } from '/client/lib/infiniteScrolling';
import LockoutSettings from '/models/lockoutSettings';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import Org from '/models/org';
import Team from '/models/team';
import Users from '/models/users';

const orgsPerPage = 25;
const teamsPerPage = 25;
const usersPerPage = 25;
let userOrgsTeamsAction = ""; //poosible actions 'addOrg', 'addTeam', 'removeOrg' or 'removeTeam' when adding or modifying a user
let selectedUserChkBoxUserIds = [];

Template.people.onCreated(function () {
  this.infiniteScrolling = new InfiniteScrolling();

  this.error = new ReactiveVar('');
  this.loading = new ReactiveVar(false);
  this.orgSetting = new ReactiveVar(true);
  this.teamSetting = new ReactiveVar(false);
  this.peopleSetting = new ReactiveVar(false);
  this.lockedUsersSetting = new ReactiveVar(false);
  this.findOrgsOptions = new ReactiveVar({});
  this.findTeamsOptions = new ReactiveVar({});
  this.findUsersOptions = new ReactiveVar({});
  this.numberOrgs = new ReactiveVar(0);
  this.numberTeams = new ReactiveVar(0);
  this.numberPeople = new ReactiveVar(0);
  this.userFilterType = new ReactiveVar('all');
  this.peoplePage = new ReactiveVar(1);
  this.orgPage = new ReactiveVar(1);
  this.teamPage = new ReactiveVar(1);

  this.page = new ReactiveVar(1);
  this.loadNextPageLocked = false;
  this.infiniteScrolling.resetNextPeak();

  this.refreshUsersCount = () => {
    const query = this.findUsersOptions.get();
    Meteor.call('getUsersCollectionCount', query, (error, count) => {
      if (error) {
        console.error('Failed to load users collection count:', error);
        return;
      }
      const total = count || 0;
      const totalPages = Math.max(1, Math.ceil(total / usersPerPage));
      if (this.peoplePage.get() > totalPages) {
        this.peoplePage.set(totalPages);
      }
      this.numberPeople.set(total);
    });
  };

  this.refreshOrgsCount = () => {
    const query = this.findOrgsOptions.get();
    Meteor.call('getOrgsCollectionCount', query, (error, count) => {
      if (error) {
        console.error('Failed to load orgs collection count:', error);
        return;
      }
      const total = count || 0;
      const totalPages = Math.max(1, Math.ceil(total / orgsPerPage));
      if (this.orgPage.get() > totalPages) {
        this.orgPage.set(totalPages);
      }
      this.numberOrgs.set(total);
    });
  };

  this.refreshTeamsCount = () => {
    const query = this.findTeamsOptions.get();
    Meteor.call('getTeamsCollectionCount', query, (error, count) => {
      if (error) {
        console.error('Failed to load teams collection count:', error);
        return;
      }
      const total = count || 0;
      const totalPages = Math.max(1, Math.ceil(total / teamsPerPage));
      if (this.teamPage.get() > totalPages) {
        this.teamPage.set(totalPages);
      }
      this.numberTeams.set(total);
    });
  };

  this.calculateNextPeak = () => {
    const element = this.find('.main-body');
    if (element) {
      const altitude = element.scrollHeight;
      this.infiniteScrolling.setNextPeak(altitude);
    }
  };

  this.loadNextPage = () => {
    if (this.loadNextPageLocked === false) {
      this.page.set(this.page.get() + 1);
      this.loadNextPageLocked = true;
    }
  };

  this.filterOrg = () => {
    const value = $('#searchOrgInput').first().val();
    if (value !== '') {
      const regex = new RegExp(value, 'i');
      this.findOrgsOptions.set({
        $or: [
          { orgDisplayName: regex },
          { orgShortName: regex },
        ],
      });
    } else {
      this.findOrgsOptions.set({});
    }
    this.orgPage.set(1);
    this.refreshOrgsCount();
  };

  this.filterTeam = () => {
    const value = $('#searchTeamInput').first().val();
    if (value !== '') {
      const regex = new RegExp(value, 'i');
      this.findTeamsOptions.set({
        $or: [
          { teamDisplayName: regex },
          { teamShortName: regex },
        ],
      });
    } else {
      this.findTeamsOptions.set({});
    }
    this.teamPage.set(1);
    this.refreshTeamsCount();
  };

  this.filterPeople = () => {
    const value = $('#searchInput').first().val();
    const filterType = this.userFilterType.get();
    const currentTime = Number(new Date());

    let query = {};

    // Apply text search filter if there's a search value
    if (value !== '') {
      const regex = new RegExp(value, 'i');
      query = {
        $or: [
          { username: regex },
          { 'profile.fullname': regex },
          { 'emails.address': regex },
        ],
      };
    }

    // Apply filter based on selected option
    switch (filterType) {
      case 'locked':
        // Show only locked users
        query['services.accounts-lockout.unlockTime'] = { $gt: currentTime };
        break;
      case 'active':
        // Show only active users (loginDisabled is false or undefined)
        query['loginDisabled'] = { $ne: true };
        break;
      case 'inactive':
        // Show only inactive users (loginDisabled is true)
        query['loginDisabled'] = true;
        break;
      case 'admin':
        // Show only admin users (isAdmin is true)
        query['isAdmin'] = true;
        break;
      case 'all':
      default:
        // Show all users, no additional filter
        break;
    }

    this.findUsersOptions.set(query);
    this.peoplePage.set(1);
  };

  this.switchMenu = (event) => {
    const target = $(event.currentTarget);
    if (!target.hasClass('active')) {
      $('.side-menu li.active').removeClass('active');
      target.closest('li').addClass('active');
      const targetID = target.data('id');
      this.orgSetting.set('org-setting' === targetID);
      this.teamSetting.set('team-setting' === targetID);
      this.peopleSetting.set('people-setting' === targetID);
      this.lockedUsersSetting.set('locked-users-setting' === targetID);

      // When switching to locked users tab, refresh the locked users list
      if ('locked-users-setting' === targetID) {
        // Find the lockedUsersGeneral component and call refreshLockedUsers
        const lockedUsersComponent = Blaze.getView($('.main-body')[0])._templateInstance;
        if (lockedUsersComponent && lockedUsersComponent.refreshLockedUsers) {
          lockedUsersComponent.refreshLockedUsers();
        }
      }
    }
  };

  this.autorun(() => {
    const limitOrgs = orgsPerPage;
    const skipOrgs = (this.orgPage.get() - 1) * orgsPerPage;
    const limitTeams = teamsPerPage;
    const skipTeams = (this.teamPage.get() - 1) * teamsPerPage;
    const limitUsers = usersPerPage;
    const skipUsers = (this.peoplePage.get() - 1) * usersPerPage;

    this.subscribe('org', this.findOrgsOptions.get(), limitOrgs, skipOrgs, () => {
      this.loadNextPageLocked = false;
      const nextPeakBefore = this.infiniteScrolling.getNextPeak();
      this.calculateNextPeak();
      const nextPeakAfter = this.infiniteScrolling.getNextPeak();
      if (nextPeakBefore === nextPeakAfter) {
        this.infiniteScrolling.resetNextPeak();
      }
      this.refreshOrgsCount();
    });

    this.subscribe('team', this.findTeamsOptions.get(), limitTeams, skipTeams, () => {
      this.loadNextPageLocked = false;
      const nextPeakBefore = this.infiniteScrolling.getNextPeak();
      this.calculateNextPeak();
      const nextPeakAfter = this.infiniteScrolling.getNextPeak();
      if (nextPeakBefore === nextPeakAfter) {
        this.infiniteScrolling.resetNextPeak();
      }
      this.refreshTeamsCount();
    });

    this.subscribe('people', this.findUsersOptions.get(), limitUsers, skipUsers, () => {
      this.loadNextPageLocked = false;
      const nextPeakBefore = this.infiniteScrolling.getNextPeak();
      this.calculateNextPeak();
      const nextPeakAfter = this.infiniteScrolling.getNextPeak();
      if (nextPeakBefore === nextPeakAfter) {
        this.infiniteScrolling.resetNextPeak();
      }

      this.refreshUsersCount();
    });
  });
});

Template.people.helpers({
  loading() {
    return Template.instance().loading;
  },
  orgSetting() {
    return Template.instance().orgSetting;
  },
  teamSetting() {
    return Template.instance().teamSetting;
  },
  peopleSetting() {
    return Template.instance().peopleSetting;
  },
  lockedUsersSetting() {
    return Template.instance().lockedUsersSetting;
  },
  orgList() {
    const tpl = Template.instance();
    const page = tpl.orgPage.get();
    const skipOrgs = (page - 1) * orgsPerPage;
    const orgs = Org.find(tpl.findOrgsOptions.get(), {
      sort: { orgDisplayName: 1 },
      skip: skipOrgs,
      limit: orgsPerPage,
      fields: {
        _id: 1,
        orgDisplayName: 1,
        orgDesc: 1,
        orgShortName: 1,
        orgWebsite: 1,
        createdAt: 1,
        orgIsActive: 1,
      },
    }).fetch();
    return orgs;
  },
  teamList() {
    const tpl = Template.instance();
    const page = tpl.teamPage.get();
    const skipTeams = (page - 1) * teamsPerPage;
    const teams = Team.find(tpl.findTeamsOptions.get(), {
      sort: { teamDisplayName: 1 },
      skip: skipTeams,
      limit: teamsPerPage,
      fields: {
        _id: 1,
        teamDisplayName: 1,
        teamDesc: 1,
        teamShortName: 1,
        teamWebsite: 1,
        createdAt: 1,
        teamIsActive: 1,
      },
    }).fetch();
    return teams;
  },
  peopleList() {
    const tpl = Template.instance();
    const page = tpl.peoplePage.get();
    const skipUsers = (page - 1) * usersPerPage;
    const users = Users.find(tpl.findUsersOptions.get(), {
      sort: { username: 1 },
      skip: skipUsers,
      limit: usersPerPage,
      fields: {
        _id: 1,
        username: 1,
        emails: 1,
        isAdmin: 1,
        createdAt: 1,
        loginDisabled: 1,
        services: 1,
      },
    }).fetch();
    return users;
  },
  orgNumber() {
    return Template.instance().numberOrgs.get();
  },
  teamNumber() {
    return Template.instance().numberTeams.get();
  },
  peopleNumber() {
    return Template.instance().numberPeople.get();
  },
  peopleCurrentPage() {
    return Template.instance().peoplePage.get();
  },
  peopleTotalPages() {
    const totalUsers = Template.instance().numberPeople.get() || 0;
    return Math.max(1, Math.ceil(totalUsers / usersPerPage));
  },
  hasPeoplePrevPage() {
    return Template.instance().peoplePage.get() > 1;
  },
  hasPeopleNextPage() {
    const tpl = Template.instance();
    const totalUsers = tpl.numberPeople.get() || 0;
    const totalPages = Math.max(1, Math.ceil(totalUsers / usersPerPage));
    return tpl.peoplePage.get() < totalPages;
  },
  orgCurrentPage() {
    return Template.instance().orgPage.get();
  },
  orgTotalPages() {
    const totalOrgs = Template.instance().numberOrgs.get() || 0;
    return Math.max(1, Math.ceil(totalOrgs / orgsPerPage));
  },
  hasOrgPrevPage() {
    return Template.instance().orgPage.get() > 1;
  },
  hasOrgNextPage() {
    const tpl = Template.instance();
    const totalOrgs = tpl.numberOrgs.get() || 0;
    const totalPages = Math.max(1, Math.ceil(totalOrgs / orgsPerPage));
    return tpl.orgPage.get() < totalPages;
  },
  teamCurrentPage() {
    return Template.instance().teamPage.get();
  },
  teamTotalPages() {
    const totalTeams = Template.instance().numberTeams.get() || 0;
    return Math.max(1, Math.ceil(totalTeams / teamsPerPage));
  },
  hasTeamPrevPage() {
    return Template.instance().teamPage.get() > 1;
  },
  hasTeamNextPage() {
    const tpl = Template.instance();
    const totalTeams = tpl.numberTeams.get() || 0;
    const totalPages = Math.max(1, Math.ceil(totalTeams / teamsPerPage));
    return tpl.teamPage.get() < totalPages;
  },
});

Template.people.events({
  'scroll .main-body'(event, tpl) {
    if (tpl.peopleSetting.get()) {
      return;
    }
    tpl.infiniteScrolling.checkScrollPosition(event.currentTarget, () => {
      tpl.loadNextPage();
    });
  },
  'click #searchOrgButton'(event, tpl) {
    tpl.filterOrg();
  },
  'keydown #searchOrgInput'(event, tpl) {
    if (event.keyCode === 13 && !event.shiftKey) {
      tpl.filterOrg();
    }
  },
  'click #searchTeamButton'(event, tpl) {
    tpl.filterTeam();
  },
  'keydown #searchTeamInput'(event, tpl) {
    if (event.keyCode === 13 && !event.shiftKey) {
      tpl.filterTeam();
    }
  },
  'click #searchButton'(event, tpl) {
    tpl.filterPeople();
  },
  'click #addOrRemoveTeam'(){
    document.getElementById("divAddOrRemoveTeamContainer").style.display = 'block';
  },
  'keydown #searchInput'(event, tpl) {
    if (event.keyCode === 13 && !event.shiftKey) {
      tpl.filterPeople();
    }
  },
  'change #userFilterSelect'(event, tpl) {
    const filterType = $(event.target).val();
    tpl.userFilterType.set(filterType);
    tpl.filterPeople();
  },
  'click .js-people-prev-page'(event, tpl) {
    event.preventDefault();
    const current = tpl.peoplePage.get();
    if (current > 1) {
      tpl.peoplePage.set(current - 1);
    }
  },
  'click .js-people-next-page'(event, tpl) {
    event.preventDefault();
    const totalUsers = tpl.numberPeople.get() || 0;
    const totalPages = Math.max(1, Math.ceil(totalUsers / usersPerPage));
    const current = tpl.peoplePage.get();
    if (current < totalPages) {
      tpl.peoplePage.set(current + 1);
    }
  },
  'click .js-org-prev-page'(event, tpl) {
    event.preventDefault();
    const current = tpl.orgPage.get();
    if (current > 1) {
      tpl.orgPage.set(current - 1);
    }
  },
  'click .js-org-next-page'(event, tpl) {
    event.preventDefault();
    const totalOrgs = tpl.numberOrgs.get() || 0;
    const totalPages = Math.max(1, Math.ceil(totalOrgs / orgsPerPage));
    const current = tpl.orgPage.get();
    if (current < totalPages) {
      tpl.orgPage.set(current + 1);
    }
  },
  'click .js-team-prev-page'(event, tpl) {
    event.preventDefault();
    const current = tpl.teamPage.get();
    if (current > 1) {
      tpl.teamPage.set(current - 1);
    }
  },
  'click .js-team-next-page'(event, tpl) {
    event.preventDefault();
    const totalTeams = tpl.numberTeams.get() || 0;
    const totalPages = Math.max(1, Math.ceil(totalTeams / teamsPerPage));
    const current = tpl.teamPage.get();
    if (current < totalPages) {
      tpl.teamPage.set(current + 1);
    }
  },
  'click #unlockAllUsers'(event) {
    event.preventDefault();
    if (confirm(TAPi18n.__('accounts-lockout-confirm-unlock-all'))) {
      Meteor.call('unlockAllUsers', (error) => {
        if (error) {
          console.error('Error unlocking all users:', error);
        } else {
          // Show a brief success message
          const message = document.createElement('div');
          message.className = 'unlock-all-success';
          message.textContent = TAPi18n.__('accounts-lockout-all-users-unlocked');
          document.body.appendChild(message);

          // Remove the message after a short delay
          setTimeout(() => {
            if (message.parentNode) {
              message.parentNode.removeChild(message);
            }
          }, 3000);
        }
      });
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
  'click a.js-org-menu'(event, tpl) {
    tpl.switchMenu(event);
    tpl.orgPage.set(1);
    tpl.refreshOrgsCount();
  },
  'click a.js-team-menu'(event, tpl) {
    tpl.switchMenu(event);
    tpl.teamPage.set(1);
    tpl.refreshTeamsCount();
  },
  'click a.js-people-menu'(event, tpl) {
    tpl.switchMenu(event);
    tpl.peoplePage.set(1);
    tpl.refreshUsersCount();
  },
  'click a.js-locked-users-menu'(event, tpl) {
    tpl.switchMenu(event);
  },
});

Template.orgRow.helpers({
  orgData() {
    return this.org || ReactiveCache.getOrg(this.orgId);
  },
});

Template.teamRow.helpers({
  teamData() {
    return this.team || ReactiveCache.getTeam(this.teamId);
  },
});

Template.peopleRow.helpers({
  userData() {
    // Depend on global avatar update counter to reactively update when avatars change
    avatarUpdateCounter.get();
    // Get the user ID from either this._id or this.user._id
    let userId;
    if (this.user && this.user._id) {
      userId = this.user._id;
    } else if (this._id) {
      userId = this._id;
    }
    // Always fetch from ReactiveCache to ensure latest data
    if (userId) {
      return ReactiveCache.getUser(userId);
    }
    return this.user || this;
  },
  hasAvatarUrl() {
    // Depend on global avatar update counter to reactively update when avatars change
    avatarUpdateCounter.get();
    // Get the user ID from either this._id or this.user._id
    let userId;
    if (this.user && this.user._id) {
      userId = this.user._id;
    } else if (this._id) {
      userId = this._id;
    }
    let user;
    if (userId) {
      user = ReactiveCache.getUser(userId);
    } else {
      user = this.user || this;
    }
    if (!user || !user.profile) return false;
    return !!user.profile.avatarUrl;
  },
  isUserLocked() {
    const user = this.user || ReactiveCache.getUser(this.userId);
    if (!user) return false;

    // Check if user has accounts-lockout with unlockTime property
    if (user.services &&
        user.services['accounts-lockout'] &&
        user.services['accounts-lockout'].unlockTime) {

      // Check if unlockTime is in the future
      const currentTime = Number(new Date());
      return user.services['accounts-lockout'].unlockTime > currentTime;
    }

    return false;
  }
});

// Initialize filter dropdown
Template.people.rendered = function() {
  const template = this;

  // Set the initial value of the dropdown
  Tracker.afterFlush(function() {
    if (template.findAll('#userFilterSelect').length) {
      $('#userFilterSelect').val('all');
    }
  });
};

Template.editUserPopup.onCreated(function () {
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
          .filter((e) => e[1])
          .map((e) => ({ value: e[0] })),
      ]);
    }
  });
});

Template.editOrgPopup.helpers({
  org() {
    return ReactiveCache.getOrg(this.orgId);
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

Template.editTeamPopup.helpers({
  team() {
    return ReactiveCache.getTeam(this.teamId);
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

Template.editUserPopup.helpers({
  user() {
    return ReactiveCache.getUser(this.userId);
  },
  authentications() {
    return Template.instance().authenticationMethods.get();
  },
  orgsDatas() {
    const ret = ReactiveCache.getOrgs({}, {sort: { orgDisplayName: 1 }});
    return ret;
  },
  teamsDatas() {
    const ret = ReactiveCache.getTeams({}, {sort: { teamDisplayName: 1 }});
    return ret;
  },
  isSelected(match) {
    const userId = Template.instance().data.userId;
    const selected = ReactiveCache.getUser(userId).authenticationMethod;
    return selected === match;
  },
  isLdap() {
    const userId = Template.instance().data.userId;
    const selected = ReactiveCache.getUser(userId).authenticationMethod;
    return selected === 'ldap';
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

Template.newOrgPopup.onCreated(function () {
  this.errorMessage = new ReactiveVar('');
});

Template.newTeamPopup.onCreated(function () {
  this.errorMessage = new ReactiveVar('');
});

Template.newUserPopup.onCreated(function () {
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
          .filter((e) => e[1])
          .map((e) => ({ value: e[0] })),
      ]);
    }
  });
});

Template.newOrgPopup.helpers({
  org() {
    return ReactiveCache.getOrg(this.orgId);
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

Template.newTeamPopup.helpers({
  team() {
    return ReactiveCache.getTeam(this.teamId);
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

Template.newUserPopup.helpers({
  user() {
    return ReactiveCache.getUser(this.userId);
  },
  authentications() {
    return Template.instance().authenticationMethods.get();
  },
  orgsDatas() {
    const ret = ReactiveCache.getOrgs({}, {sort: { orgDisplayName: 1 }});
    return ret;
  },
  teamsDatas() {
    const ret = ReactiveCache.getTeams({}, {sort: { teamDisplayName: 1 }});
    return ret;
  },
  isSelected(match) {
    const userId = Template.instance().data.userId;
    if(userId){
      const selected = ReactiveCache.getUser(userId).authenticationMethod;
      return selected === match;
    }
    else{
      false;
    }
  },
  isLdap() {
    const userId = Template.instance().data.userId;
    const selected = ReactiveCache.getUser(userId).authenticationMethod;
    return selected === 'ldap';
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

Template.orgRow.events({
  'click a.edit-org': Popup.open('editOrg'),
  'click a.more-settings-org': Popup.open('settingsOrg'),
});

Template.teamRow.events({
  'click a.edit-team': Popup.open('editTeam'),
  'click a.more-settings-team': Popup.open('settingsTeam'),
});

Template.peopleRow.events({
  'click a.edit-user'(event) {
    // Get the user ID from the data attribute
    const userId = event.currentTarget.getAttribute('data-user-id');
    if (userId) {
      Popup.open('editUser').call({ userId: userId }, event);
    }
  },
  'click a.more-settings-user'(event) {
    // Get the user ID from the data attribute
    const userId = event.currentTarget.getAttribute('data-user-id');
    if (userId) {
      Popup.open('settingsUser').call({ userId: userId }, event);
    }
  },
  'click .selectUserChkBox': function(ev){
      if(ev.currentTarget){
        if(ev.currentTarget.checked){
          if(!selectedUserChkBoxUserIds.includes(ev.currentTarget.id)){
            selectedUserChkBoxUserIds.push(ev.currentTarget.id);
          }
        }
        else{
          if(selectedUserChkBoxUserIds.includes(ev.currentTarget.id)){
            let index = selectedUserChkBoxUserIds.indexOf(ev.currentTarget.id);
            if(index > -1)
              selectedUserChkBoxUserIds.splice(index, 1);
          }
        }
      }
      if(selectedUserChkBoxUserIds.length > 0)
        document.getElementById("divAddOrRemoveTeam").style.display = 'block';
      else
        document.getElementById("divAddOrRemoveTeam").style.display = 'none';
  },
  'click .js-toggle-active-status': function(ev) {
      ev.preventDefault();
      const userId = this.userId || this.user?._id;
      const user = ReactiveCache.getUser(userId);

      if (!user) return;

      // Toggle loginDisabled status
      const isActive = !(user.loginDisabled === true);

      // Update the user's active status
      Users.update(userId, {
        $set: {
          loginDisabled: isActive
        }
      });
  },
  'click .js-toggle-lock-status': function(ev){
      ev.preventDefault();
      const userId = this.userId || this.user?._id;
      const user = ReactiveCache.getUser(userId);

      if (!user) return;

      // Check if user is currently locked
      const isLocked = user.services &&
          user.services['accounts-lockout'] &&
          user.services['accounts-lockout'].unlockTime &&
          user.services['accounts-lockout'].unlockTime > Number(new Date());

      if (isLocked) {
        // Unlock the user
        Meteor.call('unlockUser', userId, (error) => {
          if (error) {
            console.error('Error unlocking user:', error);
          }
        });
      } else {
        // Lock the user - this is optional, you may want to only allow unlocking
        // If you want to implement locking too, you would need a server method for it
        // For now, we'll leave this as a no-op
      }
  },
  'click a.js-edit-people-avatar'(event) {
    // Extract the user ID from the data attribute
    const userId = event.currentTarget.getAttribute('data-user-id');
    if (userId) {
      // Get the user from cache to pass correct context
      const user = ReactiveCache.getUser(userId);
      if (user) {
        // Call Popup.open with the correct user data context
        Popup.open('adminChangeAvatar').call({ _id: userId, user: user }, event);
      }
    }
  },
});

Template.modifyTeamsUsers.helpers({
  teamsDatas() {
    const ret = ReactiveCache.getTeams({}, {sort: { teamDisplayName: 1 }});
    return ret;
  },
});

Template.modifyTeamsUsers.events({
  'click #cancelBtn': function(){
    let selectedElt = document.getElementById("jsteamsUser");
    document.getElementById("divAddOrRemoveTeamContainer").style.display = 'none';
  },
  'click #addTeamBtn': function(){
    let selectedElt;
    let selectedEltValue;
    let selectedEltValueId;
    let userTms = [];
    let currentUser;
    let currUserTeamIndex;

    selectedElt = document.getElementById("jsteamsUser");
    selectedEltValue = selectedElt.options[selectedElt.selectedIndex].text;
    selectedEltValueId = selectedElt.options[selectedElt.selectedIndex].value;

    if(document.getElementById('addAction').checked){
      for(let i = 0; i < selectedUserChkBoxUserIds.length; i++){
        currentUser = ReactiveCache.getUser(selectedUserChkBoxUserIds[i]);
        userTms = currentUser.teams;
        if(userTms == undefined || userTms.length == 0){
          userTms = [];
          userTms.push({
            "teamId": selectedEltValueId,
            "teamDisplayName": selectedEltValue,
          })
        }
        else if(userTms.length > 0)
        {
          currUserTeamIndex = userTms.findIndex(function(t){ return t.teamId == selectedEltValueId});
          if(currUserTeamIndex == -1){
            userTms.push({
              "teamId": selectedEltValueId,
              "teamDisplayName": selectedEltValue,
            });
          }
        }

        Users.update(selectedUserChkBoxUserIds[i], {
          $set:{
            teams: userTms
          }
        });
      }
    }
    else{
      for(let i = 0; i < selectedUserChkBoxUserIds.length; i++){
        currentUser = ReactiveCache.getUser(selectedUserChkBoxUserIds[i]);
        userTms = currentUser.teams;
        if(userTms !== undefined || userTms.length > 0)
        {
          currUserTeamIndex = userTms.findIndex(function(t){ return t.teamId == selectedEltValueId});
          if(currUserTeamIndex != -1){
            userTms.splice(currUserTeamIndex, 1);
          }
        }

        Users.update(selectedUserChkBoxUserIds[i], {
          $set:{
            teams: userTms
          }
        });
      }
    }

    document.getElementById("divAddOrRemoveTeamContainer").style.display = 'none';
  },
});

Template.newOrgRow.events({
  'click a.new-org': Popup.open('newOrg'),
});

Template.newTeamRow.events({
  'click a.new-team': Popup.open('newTeam'),
});

Template.newUserRow.events({
  'click a.new-user': Popup.open('newUser'),
});

Template.selectAllUser.events({
  'click .allUserChkBox': function(ev){
    selectedUserChkBoxUserIds = [];
    const checkboxes = document.getElementsByClassName("selectUserChkBox");
    if(ev.currentTarget){
      if(ev.currentTarget.checked){
        for (let i=0; i<checkboxes.length; i++) {
          if (!checkboxes[i].disabled) {
           selectedUserChkBoxUserIds.push(checkboxes[i].id);
           checkboxes[i].checked = true;
          }
       }
      }
      else{
        for (let i=0; i<checkboxes.length; i++) {
          if (!checkboxes[i].disabled) {
           checkboxes[i].checked = false;
          }
       }
      }
    }

    if(selectedUserChkBoxUserIds.length > 0)
      document.getElementById("divAddOrRemoveTeam").style.display = 'block';
    else
      document.getElementById("divAddOrRemoveTeam").style.display = 'none';
  },
});

Template.editOrgPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const org = ReactiveCache.getOrg(this.orgId);

    const orgDisplayName = templateInstance
      .find('.js-orgDisplayName')
      .value.trim();
    const orgDesc = templateInstance.find('.js-orgDesc').value.trim();
    const orgShortName = templateInstance.find('.js-orgShortName').value.trim();
    const orgAutoAddUsersWithDomainName = templateInstance.find('.js-orgAutoAddUsersWithDomainName').value.trim();
    const orgWebsite = templateInstance.find('.js-orgWebsite').value.trim();
    const orgIsActive = templateInstance.find('.js-org-isactive').value.trim() == 'true';

    const isChangeOrgDisplayName = orgDisplayName !== org.orgDisplayName;
    const isChangeOrgDesc = orgDesc !== org.orgDesc;
    const isChangeOrgShortName = orgShortName !== org.orgShortName;
    const isChangeOrgAutoAddUsersWithDomainName = orgAutoAddUsersWithDomainName !== org.orgAutoAddUsersWithDomainName;
    const isChangeOrgWebsite = orgWebsite !== org.orgWebsite;
    const isChangeOrgIsActive = orgIsActive !== org.orgIsActive;

    if (
      isChangeOrgDisplayName ||
      isChangeOrgDesc ||
      isChangeOrgShortName ||
      isChangeOrgAutoAddUsersWithDomainName ||
      isChangeOrgWebsite ||
      isChangeOrgIsActive
    ) {
      Meteor.call(
        'setOrgAllFields',
        org,
        orgDisplayName,
        orgDesc,
        orgShortName,
        orgAutoAddUsersWithDomainName,
        orgWebsite,
        orgIsActive,
      );
    }

    Popup.back();
  },
});

Template.editTeamPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const team = ReactiveCache.getTeam(this.teamId);

    const teamDisplayName = templateInstance
      .find('.js-teamDisplayName')
      .value.trim();
    const teamDesc = templateInstance.find('.js-teamDesc').value.trim();
    const teamShortName = templateInstance
      .find('.js-teamShortName')
      .value.trim();
    const teamWebsite = templateInstance.find('.js-teamWebsite').value.trim();
    const teamIsActive =
      templateInstance.find('.js-team-isactive').value.trim() == 'true';

    const isChangeTeamDisplayName = teamDisplayName !== team.teamDisplayName;
    const isChangeTeamDesc = teamDesc !== team.teamDesc;
    const isChangeTeamShortName = teamShortName !== team.teamShortName;
    const isChangeTeamWebsite = teamWebsite !== team.teamWebsite;
    const isChangeTeamIsActive = teamIsActive !== team.teamIsActive;

    if (
      isChangeTeamDisplayName ||
      isChangeTeamDesc ||
      isChangeTeamShortName ||
      isChangeTeamWebsite ||
      isChangeTeamIsActive
    ) {
      Meteor.call(
        'setTeamAllFields',
        team,
        teamDisplayName,
        teamDesc,
        teamShortName,
        teamWebsite,
        teamIsActive,
      );
    }

    Popup.back();
  },
});

Template.editUserPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const user = ReactiveCache.getUser(this.userId);
    const username = templateInstance.find('.js-profile-username').value.trim();
    const fullname = templateInstance.find('.js-profile-fullname').value.trim();
    const initials = templateInstance.find('.js-profile-initials').value.trim();
    const password = templateInstance.find('.js-profile-password').value;
    const isAdmin = templateInstance.find('.js-profile-isadmin').value.trim();
    const isActive = templateInstance.find('.js-profile-isactive').value.trim();
    const email = templateInstance.find('.js-profile-email').value.trim();
    const verified = templateInstance.find('.js-profile-email-verified').value.trim();
    const authentication = templateInstance.find('.js-authenticationMethod').value.trim();
    const importUsernames = templateInstance.find('.js-import-usernames').value.trim();
    const userOrgs = templateInstance.find('.js-userOrgs').value.trim();
    const userOrgsIds = templateInstance.find('.js-userOrgIds').value.trim();
    const userTeams = templateInstance.find('.js-userteams').value.trim();
    const userTeamsIds = templateInstance.find('.js-userteamIds').value.trim();

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

    // Build user teams list
    let userTeamsList = userTeams.split(",");
    let userTeamsIdsList = userTeamsIds.split(",");
    let userTms = [];
    if(userTeams != ''){
      for(let i = 0; i < userTeamsList.length; i++){
        userTms.push({
          "teamId": userTeamsIdsList[i],
          "teamDisplayName": userTeamsList[i],
        })
      }
    }

    // Build user orgs list
    let userOrgsList = userOrgs.split(",");
    let userOrgsIdsList = userOrgsIds.split(",");
    let userOrganizations = [];
    if(userOrgs != ''){
      for(let i = 0; i < userOrgsList.length; i++){
        userOrganizations.push({
          "orgId": userOrgsIdsList[i],
          "orgDisplayName": userOrgsList[i],
        })
      }
    }

    // Update user via Meteor method (for admin to edit other users)
    const updateData = {
      fullname: fullname,
      isAdmin: isAdmin === 'true',
      loginDisabled: isActive === 'true',
      authenticationMethod: authentication,
      importUsernames: Users.parseImportUsernames(importUsernames),
      teams: userTms,
      orgs: userOrganizations,
    };

    Meteor.call('editUser', this.userId, updateData, (error) => {
      if (error) {
        console.error('Error updating user:', error);
      }
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
        function (error) {
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
            Popup.back();
          }
        },
      );
    } else if (isChangeUserName) {
      Meteor.call('setUsername', username, this.userId, function (error) {
        const usernameMessageElement = templateInstance.$('.username-taken');
        if (error) {
          const errorElement = error.error;
          if (errorElement === 'username-already-taken') {
            usernameMessageElement.show();
          }
        } else {
          usernameMessageElement.hide();
          Popup.back();
        }
      });
    } else if (isChangeEmail) {
      Meteor.call(
        'setEmail',
        email.toLowerCase(),
        this.userId,
        function (error) {
          const emailMessageElement = templateInstance.$('.email-taken');
          if (error) {
            const errorElement = error.error;
            if (errorElement === 'email-already-taken') {
              emailMessageElement.show();
            }
          } else {
            emailMessageElement.hide();
            Popup.back();
          }
        },
      );
    } else Popup.back();
  },
  'click #addUserOrg'(event) {
    event.preventDefault();

    userOrgsTeamsAction = "addOrg";
    document.getElementById("jsOrgs").style.display = 'block';
    document.getElementById("jsTeams").style.display = 'none';
  },
  'click #removeUserOrg'(event) {
    event.preventDefault();

    userOrgsTeamsAction = "removeOrg";
    document.getElementById("jsOrgs").style.display = 'block';
    document.getElementById("jsTeams").style.display = 'none';
  },
  'click #addUserTeam'(event) {
    event.preventDefault();

    userOrgsTeamsAction = "addTeam";
    document.getElementById("jsTeams").style.display = 'block';
    document.getElementById("jsOrgs").style.display = 'none';
  },
  'click #removeUserTeam'(event) {
    event.preventDefault();

    userOrgsTeamsAction = "removeTeam";
    document.getElementById("jsTeams").style.display = 'block';
    document.getElementById("jsOrgs").style.display = 'none';
  },
  'change #jsOrgs'(event) {
    event.preventDefault();
    UpdateUserOrgsOrTeamsElement();
  },
  'change #jsTeams'(event) {
    event.preventDefault();
    UpdateUserOrgsOrTeamsElement();
  },
});

const UpdateUserOrgsOrTeamsElement = function(isNewUser = false){
  let selectedElt;
  let selectedEltValue;
  let selectedEltValueId;
  let inputElt;
  let inputEltId;
  let lstInputValues = [];
  let lstInputValuesIds = [];
  let index;
  let indexId;
  switch(userOrgsTeamsAction)
  {
    case "addOrg":
    case "removeOrg":
      inputElt = !isNewUser ? document.getElementById("jsUserOrgsInPut") : document.getElementById("jsUserOrgsInPutNewUser");
      inputEltId = !isNewUser ? document.getElementById("jsUserOrgIdsInPut") : document.getElementById("jsUserOrgIdsInPutNewUser");
      selectedElt = !isNewUser ? document.getElementById("jsOrgs") : document.getElementById("jsOrgsNewUser");
      break;
    case "addTeam":
    case "removeTeam":
      inputElt = !isNewUser ? document.getElementById("jsUserTeamsInPut") : document.getElementById("jsUserTeamsInPutNewUser");
      inputEltId = !isNewUser ? document.getElementById("jsUserTeamIdsInPut") : document.getElementById("jsUserTeamIdsInPutNewUser");
      selectedElt = !isNewUser ? document.getElementById("jsTeams") : document.getElementById("jsTeamsNewUser");
      break;
    default:
      break;
  }
  selectedEltValue = selectedElt.options[selectedElt.selectedIndex].text;
  selectedEltValueId = selectedElt.options[selectedElt.selectedIndex].value;
  lstInputValues = inputElt.value.trim().split(",");
  if(lstInputValues.length == 1 && lstInputValues[0] == ''){
    lstInputValues = [];
  }
  lstInputValuesIds = inputEltId.value.trim().split(",");
  if(lstInputValuesIds.length == 1 && lstInputValuesIds[0] == ''){
    lstInputValuesIds = [];
  }
  index = lstInputValues.indexOf(selectedEltValue);
  indexId = lstInputValuesIds.indexOf(selectedEltValueId);
  if(userOrgsTeamsAction == "addOrg" || userOrgsTeamsAction == "addTeam"){
    if(index <= -1 && selectedEltValueId != "-1"){
      lstInputValues.push(selectedEltValue);
    }

    if(indexId <= -1 && selectedEltValueId != "-1"){
      lstInputValuesIds.push(selectedEltValueId);
    }
  }
  else{
    if(index > -1 && selectedEltValueId != "-1"){
      lstInputValues.splice(index, 1);
    }

    if(indexId > -1 && selectedEltValueId != "-1"){
      lstInputValuesIds.splice(indexId, 1);
    }
  }

  if(lstInputValues.length > 0){
    inputElt.value = lstInputValues.join(",");
  }
  else{
    inputElt.value = "";
  }

  if(lstInputValuesIds.length > 0){
    inputEltId.value = lstInputValuesIds.join(",");
  }
  else{
    inputEltId.value = "";
  }
  selectedElt.value = "-1";
  selectedElt.style.display = "none";
}

Template.newOrgPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const orgDisplayName = templateInstance
      .find('.js-orgDisplayName')
      .value.trim();
    const orgDesc = templateInstance.find('.js-orgDesc').value.trim();
    const orgShortName = templateInstance.find('.js-orgShortName').value.trim();
    const orgAutoAddUsersWithDomainName = templateInstance.find('.js-orgAutoAddUsersWithDomainName').value.trim();
    const orgWebsite = templateInstance.find('.js-orgWebsite').value.trim();
    const orgIsActive =
      templateInstance.find('.js-org-isactive').value.trim() == 'true';

    Meteor.call(
      'setCreateOrg',
      orgDisplayName,
      orgDesc,
      orgShortName,
      orgAutoAddUsersWithDomainName,
      orgWebsite,
      orgIsActive,
    );
    Popup.back();
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
    const teamIsActive =
      templateInstance.find('.js-team-isactive').value.trim() == 'true';

    Meteor.call(
      'setCreateTeam',
      teamDisplayName,
      teamDesc,
      teamShortName,
      teamWebsite,
      teamIsActive,
    );
    Popup.back();
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
    const userOrgs = templateInstance.find('.js-userOrgsNewUser').value.trim();
    const userOrgsIds = templateInstance.find('.js-userOrgIdsNewUser').value.trim();
    const userTeams = templateInstance.find('.js-userteamsNewUser').value.trim();
    const userTeamsIds = templateInstance.find('.js-userteamIdsNewUser').value.trim();

    let userTeamsList = userTeams.split(",");
    let userTeamsIdsList = userTeamsIds.split(",");
    let userTms = [];
    for(let i = 0; i < userTeamsList.length; i++){
      if(!!userTeamsIdsList[i] && !!userTeamsList[i]) {
        userTms.push({
          "teamId": userTeamsIdsList[i],
          "teamDisplayName": userTeamsList[i],
        })
      }
    }

    let userOrgsList = userOrgs.split(",");
    let userOrgsIdsList = userOrgsIds.split(",");
    let userOrganizations = [];
    for(let i = 0; i < userOrgsList.length; i++){
      if(!!userOrgsIdsList[i] && !!userOrgsList[i]) {
        userOrganizations.push({
          "orgId": userOrgsIdsList[i],
          "orgDisplayName": userOrgsList[i],
        })
      }
    }

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
      userOrganizations,
      userTms,
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
          Popup.back();
        }
      },
    );
    Popup.back();
  },
  'click #addUserOrgNewUser'(event) {
    event.preventDefault();

    userOrgsTeamsAction = "addOrg";
    document.getElementById("jsOrgsNewUser").style.display = 'block';
    document.getElementById("jsTeamsNewUser").style.display = 'none';
  },
  'click #removeUserOrgNewUser'(event) {
    event.preventDefault();

    userOrgsTeamsAction = "removeOrg";
    document.getElementById("jsOrgsNewUser").style.display = 'block';
    document.getElementById("jsTeamsNewUser").style.display = 'none';
  },
  'click #addUserTeamNewUser'(event) {
    event.preventDefault();

    userOrgsTeamsAction = "addTeam";
    document.getElementById("jsTeamsNewUser").style.display = 'block';
    document.getElementById("jsOrgsNewUser").style.display = 'none';
  },
  'click #removeUserTeamNewUser'(event) {
    event.preventDefault();

    userOrgsTeamsAction = "removeTeam";
    document.getElementById("jsTeamsNewUser").style.display = 'block';
    document.getElementById("jsOrgsNewUser").style.display = 'none';
  },
  'change #jsOrgsNewUser'(event) {
    event.preventDefault();
    UpdateUserOrgsOrTeamsElement(true);
  },
  'change #jsTeamsNewUser'(event) {
    event.preventDefault();
    UpdateUserOrgsOrTeamsElement(true);
  },
});

Template.settingsOrgPopup.events({
  'click #deleteButton'(event) {
    event.preventDefault();
    if (ReactiveCache.getUsers({"orgs.orgId": this.orgId}).length > 0)
    {
      let orgClassList = document.getElementById("deleteOrgWarningMessage").classList;
      if(orgClassList.contains('hide'))
      {
        orgClassList.remove('hide');
        document.getElementById("deleteOrgWarningMessage").style.color = "red";
      }
      return;
    }
    Org.remove(this.orgId);
    Popup.back();
  }
});

Template.settingsTeamPopup.events({
  'click #deleteButton'(event) {
    event.preventDefault();
    if (ReactiveCache.getUsers({"teams.teamId": this.teamId}).length > 0)
    {
      let teamClassList = document.getElementById("deleteTeamWarningMessage").classList;
      if(teamClassList.contains('hide'))
      {
        teamClassList.remove('hide');
        document.getElementById("deleteTeamWarningMessage").style.color = "red";
      }
      return;
    }
    Team.remove(this.teamId);
    Popup.back();
  }
});

Template.settingsUserPopup.events({
  'click .impersonate-user'(event) {
    event.preventDefault();
    const userId = this.userId || this.user?._id;

    Meteor.call('impersonate', userId, (err) => {
      if (!err) {
        // Meteor.connection.setUserId() triggers automatic cache invalidation
        // No need to manually invalidate - let Meteor handle the user data refresh
        Meteor.connection.setUserId(userId);
        FlowRouter.go('/');
      }
    });
  },
  'click #deleteButton'(event) {
    event.preventDefault();
    const userId = this.userId || this.user?._id;

    // Use secure server method instead of direct client-side removal
    Meteor.call('removeUser', userId, (error, result) => {
      if (error) {
        if (process.env.DEBUG === 'true') {
          console.error('Error removing user:', error);
        }
        // Show error message to user
        if (error.error === 'not-authorized') {
          alert('You are not authorized to delete this user.');
        } else if (error.error === 'user-not-found') {
          alert('User not found.');
        } else if (error.error === 'not-authorized' && error.reason === 'Cannot delete the last administrator') {
          alert('Cannot delete the last administrator.');
        } else {
          alert('Error deleting user: ' + error.reason);
        }
      } else {
        if (process.env.DEBUG === 'true') {
          console.log('User deleted successfully:', result);
        }
        Popup.back();
      }
    });
  },
});

Template.settingsUserPopup.helpers({
  user() {
    const userId = this.userId || this.user?._id;
    return ReactiveCache.getUser(userId);
  },
  authentications() {
    return Template.instance().authenticationMethods.get();
  },
  isSelected(match) {
    const userId = Template.instance().data.userId || Template.instance().data.user?._id;
    const user = ReactiveCache.getUser(userId);
    if (!user) return false;
    const selected = user.authenticationMethod;
    return selected === match;
  },
  isLdap() {
    const userId = Template.instance().data.userId || Template.instance().data.user?._id;
    const user = ReactiveCache.getUser(userId);
    if (!user) return false;
    const selected = user.authenticationMethod;
    return selected === 'ldap';
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});
