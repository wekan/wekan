Template.boardMenuPopup.events({
  'click .js-rename-board': Popup.open('boardChangeTitle'),
  'click .js-open-archives'() {
    Sidebar.setView('archives');
    Popup.close();
  },
  'click .js-change-board-color': Popup.open('boardChangeColor'),
  'click .js-change-language': Popup.open('changeLanguage'),
  'click .js-archive-board ': Popup.afterConfirm('archiveBoard', function() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    currentBoard.archive();
    // XXX We should have some kind of notification on top of the page to
    // confirm that the board was successfully archived.
    FlowRouter.go('home');
  }),
  'click .js-clone-template': Popup.open('cloneBoardTemplate'),
});

Template.boardChangeTitlePopup.events({
  submit(evt, tpl) {
    const newTitle = tpl.$('.js-board-name').val().trim();
    const newDesc = tpl.$('.js-board-desc').val().trim();
    if (newTitle) {
      this.rename(newTitle);
      this.setDesciption(newDesc);
      Popup.close();
    }
    evt.preventDefault();
  },
});

BlazeComponent.extendComponent({
  template() {
    return 'headerBoard';
  },

  isStarred() {
    const boardId = Session.get('currentBoard');
    const user = Meteor.user();
    return user && user.hasStarred(boardId);
  },

  // Only show the star counter if the number of star is greater than 2
  showStarCounter() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard && currentBoard.stars >= 2;
  },

  events() {
    return [{
      'click .js-edit-board-title': Popup.open('boardChangeTitle'),
      'click .js-star-board'() {
        Meteor.user().toggleBoardStar(Session.get('currentBoard'));
      },
      'click .js-open-board-menu': Popup.open('boardMenu'),
      'click .js-change-visibility': Popup.open('boardChangeVisibility'),
      'click .js-open-filter-view'() {
        Sidebar.setView('filter');
      },
      'click .js-filter-reset'(evt) {
        evt.stopPropagation();
        Sidebar.setView();
        Filter.reset();
      },
      'click .js-multiselection-activate'() {
        const currentCard = Session.get('currentCard');
        MultiSelection.activate();
        if (currentCard) {
          MultiSelection.add(currentCard);
        }
      },
      'click .js-multiselection-reset'(evt) {
        evt.stopPropagation();
        MultiSelection.disable();
      },
    }];
  },
}).register('headerBoard');

BlazeComponent.extendComponent({
  template() {
    return 'boardChangeColorPopup';
  },

  backgroundColors() {
    return Boards.simpleSchema()._schema.color.allowedValues;
  },

  isSelected() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard.color === this.currentData().toString();
  },

  events() {
    return [{
      'click .js-select-background'(evt) {
        const currentBoard = Boards.findOne(Session.get('currentBoard'));
        const newColor = this.currentData().toString();
        currentBoard.setColor(newColor);
        evt.preventDefault();
      },
    }];
  },
}).register('boardChangeColorPopup');

BlazeComponent.extendComponent({
  template() {
    return 'createBoardPopup';
  },

  onCreated() {
    this.visibilityMenuIsOpen = new ReactiveVar(false);
    this.visibility = new ReactiveVar('private');
  },

  visibilityCheck() {
    return this.currentData() === this.visibility.get();
  },

  setVisibility(visibility) {
    this.visibility.set(visibility);
    this.visibilityMenuIsOpen.set(false);
  },

  toggleVisibilityMenu() {
    this.visibilityMenuIsOpen.set(!this.visibilityMenuIsOpen.get());
  },

  onSubmit(evt) {
    evt.preventDefault();
    const title = this.find('.js-new-board-title').value;
    const visibility = this.visibility.get();

    const boardId = Boards.insert({
      title,
      permission: visibility,
    });

    Utils.goBoardId(boardId);

    // Immediately star boards crated with the headerbar popup.
    Meteor.user().toggleBoardStar(boardId);
  },

  events() {
    return [{
      'click .js-select-visibility'() {
        this.setVisibility(this.currentData());
      },
      'click .js-change-visibility': this.toggleVisibilityMenu,
      'click .js-import': Popup.open('boardImportBoard'),
      submit: this.onSubmit,
    }];
  },
}).register('createBoardPopup');

BlazeComponent.extendComponent({
  template() {
    return 'boardChangeVisibilityPopup';
  },

  visibilityCheck() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return this.currentData() === currentBoard.permission;
  },

  selectBoardVisibility() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    const visibility = this.currentData();
    currentBoard.setVisibility(visibility);
    Popup.close();
  },

  events() {
    return [{
      'click .js-select-visibility': this.selectBoardVisibility,
    }];
  },
}).register('boardChangeVisibilityPopup');

BlazeComponent.extendComponent({
  template() {
    return 'cloneBoardTemplatePopup';
  },

  boards() {
    return Boards.find({
      archived: false,
      'members.userId': Meteor.userId(),
    }, {
      sort: ['title'],
    });
  },

  currentBoardId() {
    return Session.get('currentBoard');
  },

  copyLabels(to, labels) {
    if(to.labels) {
      // reuse if same
      to.labels.forEach((label) => {
        if(!_.findWhere(labels, {name:label.name, color:label.color})) {
          to.removeLabel(label._id);
        }
      });
    }
    if (labels) {
      labels.forEach((label) => {
        to.addLabel(label.name, label.color);
      });
    }
  },

  copyMembers(to, members) {
    if(to.members) {
      // reuse if same
      to.members.forEach((member) => {
        if(member.userId !== Meteor.userId()) {
          if(!_.findWhere(members, {userId:member.userId})) {
            to.removeMember(member.userId);
          }
        }
      });
    }
    if (members){
      members.forEach((member) => {
        if(member.userId !== Meteor.userId()) {
          to.addMember(member.userId);
          to.setMemberPermission(member.userId, member.isAdmin);
        }
      });
    }
  },

  copyLists(to, lists) {
    // skip archived lists from source
    const otherLists = [];
    lists.forEach((list) => {
      if(!list.archived) otherLists.push(list);
    });
    let i = 0;
    // we reuse and rename the existing lists, and archive the rest
    const myLists = Lists.find({boardId: to._id}, { sort: ['sort'] }).fetch();
    myLists.forEach((list) => {
      if(list.archived) return;
      if(i < otherLists.length) {
        const other = otherLists[i++];
        Lists.update(list._id, {
          $set: {
            title: other.title,
            sort: other.sort,
            status: other.status,
          },
        });
      } else {
        list.archive();
      }
    });
    // if not enough, create new lists
    while(i < otherLists.length) {
      const other = otherLists[i++];
      Lists.insert({
        boardId: Session.get('currentBoard'),
        title: other.title,
        sort: other.sort,
        status: other.status,
      });
    }
  },

  cloneTemplate(fromId, callback) {
    const toId = Session.get('currentBoard');
    new SubsManager().subscribe('board', toId);
    new SubsManager().subscribe('board', fromId);
    // after subscribe, the data may sync in a while, so we check after some delay
    const self = this;
    let loopMax = 60;
    (function checkDataLoop() {
      const lists = Lists.find({boardId: fromId}).fetch();
      if (lists.length > 0) {
        const to = Boards.findOne(toId);
        const from = Boards.findOne(fromId);
        self.copyLabels(to, from.labels);
        self.copyMembers(to, from.members);
        self.copyLists(to, lists);
        to.updateDataMapping(from.dataMapping);
        callback();
      } else if(--loopMax > 0) {
        window.setTimeout(checkDataLoop, 50);
      }
    })();
  },

  events() {
    return [{
      'click .js-clone-from-board'(evt, tpl) {
        const fromId = $(evt.currentTarget).attr('id').trim();
        if(fromId) {
          Popup.afterConfirm('confirmCloneTemplate', () => {
            this.cloneTemplate(fromId, () => {
              Popup.close();
            });
          }).call(this, evt, tpl);
        }
      },
    }];
  },
}).register('cloneBoardTemplatePopup');
