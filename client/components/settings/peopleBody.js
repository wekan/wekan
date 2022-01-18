const orgsPerPage = 25;
const teamsPerPage = 25;
const usersPerPage = 25;
let userOrgsTeamsAction = ""; //poosible actions 'addOrg', 'addTeam', 'removeOrg' or 'removeTeam' when adding or modifying a user
let selectedUserChkBoxUserIds = [];

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
        'click #addOrRemoveTeam'(){
          document.getElementById("divAddOrRemoveTeamContainer").style.display = 'block';
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
    const value = $('#searchInput').first().val();
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
      sort: { orgDisplayName: 1 },
      fields: { _id: true },
    });
    this.numberOrgs.set(orgs.count(false));
    return orgs;
  },
  teamList() {
    const teams = Team.find(this.findTeamsOptions.get(), {
      sort: { teamDisplayName: 1 },
      fields: { _id: true },
    });
    this.numberTeams.set(teams.count(false));
    return teams;
  },
  peopleList() {
    const users = Users.find(this.findUsersOptions.get(), {
      sort: { username: 1 },
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
  orgsDatas() {
    return Org.find({}, {sort: { orgDisplayName: 1 }});
  },
  teamsDatas() {
    return Team.find({}, {sort: { teamDisplayName: 1 }});
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
  orgsDatas() {
    return Org.find({}, {sort: { orgDisplayName: 1 }});
  },
  teamsDatas() {
    return Team.find({}, {sort: { teamDisplayName: 1 }});
  },
  isSelected(match) {
    const userId = Template.instance().data.userId;
    if(userId){
      const selected = Users.findOne(userId).authenticationMethod;
      return selected === match;
    }
    else{
      false;
    }
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
      },
    ];
  },
}).register('peopleRow');

BlazeComponent.extendComponent({
  onCreated() {},
  teamsDatas() {
    return Team.find({}, {sort: { teamDisplayName: 1 }});
  },
  events() {
    return [
      {
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
              currentUser = Users.findOne(selectedUserChkBoxUserIds[i]);
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
              currentUser = Users.findOne(selectedUserChkBoxUserIds[i]);
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
      },
    ];
  },
}).register('modifyTeamsUsers');

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

BlazeComponent.extendComponent({
  events() {
    return [
      {
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
      },
    ];
  },
}).register('selectAllUser');

Template.editOrgPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const org = Org.findOne(this.orgId);

    const orgDisplayName = templateInstance
      .find('.js-orgDisplayName')
      .value.trim();
    const orgDesc = templateInstance.find('.js-orgDesc').value.trim();
    const orgShortName = templateInstance.find('.js-orgShortName').value.trim();
    const orgWebsite = templateInstance.find('.js-orgWebsite').value.trim();
    const orgIsActive = templateInstance.find('.js-org-isactive').value.trim() == 'true';

    const isChangeOrgDisplayName = orgDisplayName !== org.orgDisplayName;
    const isChangeOrgDesc = orgDesc !== org.orgDesc;
    const isChangeOrgShortName = orgShortName !== org.orgShortName;
    const isChangeOrgWebsite = orgWebsite !== org.orgWebsite;
    const isChangeOrgIsActive = orgIsActive !== org.orgIsActive;

    if (
      isChangeOrgDisplayName ||
      isChangeOrgDesc ||
      isChangeOrgShortName ||
      isChangeOrgWebsite ||
      isChangeOrgIsActive
    ) {
      Meteor.call(
        'setOrgAllFields',
        org,
        orgDisplayName,
        orgDesc,
        orgShortName,
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
    const team = Team.findOne(this.teamId);

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
    const user = Users.findOne(this.userId);
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

    Users.update(this.userId, {
      $set: {
        'profile.fullname': fullname,
        isAdmin: isAdmin === 'true',
        loginDisabled: isActive === 'true',
        authenticationMethod: authentication,
        importUsernames: Users.parseImportUsernames(importUsernames),
      },
    });

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

    Users.update(this.userId, {
      $set:{
        teams: userTms
      }
    });

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

    Users.update(this.userId, {
      $set:{
        orgs: userOrganizations
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

UpdateUserOrgsOrTeamsElement = function(isNewUser = false){
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
    const orgWebsite = templateInstance.find('.js-orgWebsite').value.trim();
    const orgIsActive =
      templateInstance.find('.js-org-isactive').value.trim() == 'true';

    Meteor.call(
      'setCreateOrg',
      orgDisplayName,
      orgDesc,
      orgShortName,
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
    if(Users.find({"orgs.orgId": this.orgId}).count() > 0)
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
    if(Users.find({"teams.teamId": this.teamId}).count() > 0)
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

    Meteor.call('impersonate', this.userId, (err) => {
      if (!err) {
        FlowRouter.go('/');
        Meteor.connection.setUserId(this.userId);
      }
    });
  },
  'click #deleteButton'(event) {
    event.preventDefault();
    Users.remove(this.userId);
    /*
    // Delete user is enabled, but you should remove user from all boards
    // before deleting user, because there is possibility of leaving empty user avatars
    // to boards. You can remove non-existing user ids manually from database,
    // if that happens.
    //. See:
    // - wekan/client/components/settings/peopleBody.jade deleteButton
    // - wekan/client/components/settings/peopleBody.js deleteButton
    // - wekan/client/components/sidebar/sidebar.js Popup.afterConfirm('removeMember'
    //   that does now remove member from board, card members and assignees correctly,
    //   but that should be used to remove user from all boards similarly
    // - wekan/models/users.js Delete is not enabled
    //
    //
    */
    Popup.back();
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
