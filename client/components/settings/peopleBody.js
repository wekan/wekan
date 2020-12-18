const usersPerPage = 25;

BlazeComponent.extendComponent({
  mixins() {
    return [Mixins.InfiniteScrolling];
  },
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.people = new ReactiveVar(true);
    this.findUsersOptions = new ReactiveVar({});
    this.number = new ReactiveVar(0);

    this.page = new ReactiveVar(1);
    this.loadNextPageLocked = false;
    this.callFirstWith(null, 'resetNextPeak');
    this.autorun(() => {
      const limit = this.page.get() * usersPerPage;

      this.subscribe('people', this.findUsersOptions.get(), limit, () => {
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
        'click #searchButton'() {
          this.filterPeople();
        },
        'keydown #searchInput'(event) {
          if (event.keyCode === 13 && !event.shiftKey) {
            this.filterPeople();
          }
        },
        'click #newUserButton'() {
          Popup.open('newUser');
        },
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
  peopleList() {
    const users = Users.find(this.findUsersOptions.get(), {
      fields: { _id: true },
    });
    this.number.set(users.count(false));
    return users;
  },
  peopleNumber() {
    return this.number.get();
  },
}).register('people');

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

Template.newUserPopup.helpers({
  //user() {
  //  return Users.findOne(this.userId);
  //},
  authentications() {
    return Template.instance().authenticationMethods.get();
  },
  //isSelected(match) {
  //  const userId = Template.instance().data.userId;
  //  const selected = Users.findOne(userId).authenticationMethod;
  //  return selected === match;
  //},
  //isLdap() {
  //  const userId = Template.instance().data.userId;
  //  const selected = Users.findOne(userId).authenticationMethod;
  //  return selected === 'ldap';
  //},
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

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
        'click a.new-user': Popup.open('newUser'),
      },
    ];
  },
}).register('newUserRow');

Template.editUserPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const user = Users.findOne(this.userId);
    const fullname = templateInstance.find('.js-profile-fullname').value.trim();
    const username = templateInstance.find('.js-profile-username').value.trim();
    const password = templateInstance.find('.js-profile-password').value;
    const isAdmin = templateInstance.find('.js-profile-isadmin').value.trim();
    const isActive = templateInstance.find('.js-profile-isactive').value.trim();
    const email = templateInstance.find('.js-profile-email').value.trim();
    const authentication = templateInstance
      .find('.js-authenticationMethod')
      .value.trim();

    const isChangePassword = password.length > 0;
    const isChangeUserName = username !== user.username;

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
      },
    });

    if (isChangePassword) {
      Meteor.call('setPassword', password, this.userId);
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

Template.newUserPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const fullname = templateInstance.find('.js-profile-fullname').value.trim();
    const username = templateInstance.find('.js-profile-username').value.trim();
    const password = templateInstance.find('.js-profile-password').value;
    const isAdmin = templateInstance.find('.js-profile-isadmin').value.trim();
    const isActive = templateInstance.find('.js-profile-isactive').value.trim();
    const email = templateInstance.find('.js-profile-email').value.trim();

    Meteor.call(
      'setCreateUser',
      fullname,
      username,
      password,
      isAdmin,
      isActive,
      email.toLowerCase(),
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
