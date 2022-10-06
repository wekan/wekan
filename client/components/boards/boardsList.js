import { TAPi18n } from '/imports/i18n';

const subManager = new SubsManager();

Template.boardList.helpers({
  currentSetting() {
    return Settings.findOne();
  },
  hideCardCounterList() {
    return Utils.isMiniScreen() && Session.get('currentBoard');
  },
  hideBoardMemberList() {
    return Utils.isMiniScreen() && Session.get('currentBoard');
  },
})

Template.boardListHeaderBar.events({
  'click .js-open-archived-board'() {
    Modal.open('archivedBoards');
  },
});

Template.boardListHeaderBar.helpers({
  title() {
    //if (FlowRouter.getRouteName() === 'template-container') {
    //  return 'template-container';
    //} else {
    return FlowRouter.getRouteName() === 'home' ? 'my-boards' : 'public';
    //}
  },
  templatesBoardId() {
    return Meteor.user() && Meteor.user().getTemplatesBoardId();
  },
  templatesBoardSlug() {
    return Meteor.user() && Meteor.user().getTemplatesBoardSlug();
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    Meteor.subscribe('setting');
    Meteor.subscribe('tableVisibilityModeSettings');
    let currUser = Meteor.user();
    let userLanguage;
    if (currUser && currUser.profile) {
      userLanguage = currUser.profile.language
    }
    if (userLanguage) {
      TAPi18n.setLanguage(userLanguage);
    }
  },

  onRendered() {
    const itemsSelector = '.js-board:not(.placeholder)';

    const $boards = this.$('.js-boards');
    $boards.sortable({
      connectWith: '.js-boards',
      tolerance: 'pointer',
      appendTo: '.board-list',
      helper: 'clone',
      distance: 7,
      items: itemsSelector,
      placeholder: 'board-wrapper placeholder',
      start(evt, ui) {
        ui.helper.css('z-index', 1000);
        ui.placeholder.height(ui.helper.height());
        EscapeActions.executeUpTo('popup-close');
      },
      stop(evt, ui) {
        // To attribute the new index number, we need to get the DOM element
        // of the previous and the following card -- if any.
        const prevBoardDom = ui.item.prev('.js-board').get(0);
        const nextBoardBom = ui.item.next('.js-board').get(0);
        const sortIndex = Utils.calculateIndex(prevBoardDom, nextBoardBom, 1);

        const boardDomElement = ui.item.get(0);
        const board = Blaze.getData(boardDomElement);
        // Normally the jquery-ui sortable library moves the dragged DOM element
        // to its new position, which disrupts Blaze reactive updates mechanism
        // (especially when we move the last card of a list, or when multiple
        // users move some cards at the same time). To prevent these UX glitches
        // we ask sortable to gracefully cancel the move, and to put back the
        // DOM in its initial state. The card move is then handled reactively by
        // Blaze with the below query.
        $boards.sortable('cancel');

        board.move(sortIndex.base);
      },
    });

    // Disable drag-dropping if the current user is not a board member or is comment only
    this.autorun(() => {
      if (Utils.isTouchScreenOrShowDesktopDragHandles()) {
        $boards.sortable({
          handle: '.board-handle',
        });
      }
    });
  },
  userHasTeams() {
    if (Meteor.user() != null && Meteor.user().teams && Meteor.user().teams.length > 0)
      return true;
    else
      return false;
  },
  teamsDatas() {
    if (Meteor.user().teams)
      return Meteor.user().teams.sort((a, b) => a.teamDisplayName.localeCompare(b.teamDisplayName));
    else
      return [];
  },
  userHasOrgs() {
    if (Meteor.user() != null && Meteor.user().orgs && Meteor.user().orgs.length > 0)
      return true;
    else
      return false;
  },
  /*
    userHasTemplates(){
      if(Meteor.user() != null && Meteor.user().orgs && Meteor.user().orgs.length > 0)
        return true;
      else
        return false;
    },
  */
  orgsDatas() {
    if (Meteor.user().orgs)
      return Meteor.user().orgs.sort((a, b) => a.orgDisplayName.localeCompare(b.orgDisplayName));
    else
      return [];
  },
  userHasOrgsOrTeams() {
    let boolUserHasOrgs;
    if (Meteor.user() != null && Meteor.user().orgs && Meteor.user().orgs.length > 0)
      boolUserHasOrgs = true;
    else
      boolUserHasOrgs = false;

    let boolUserHasTeams;
    if (Meteor.user() != null && Meteor.user().teams && Meteor.user().teams.length > 0)
      boolUserHasTeams = true;
    else
      boolUserHasTeams = false;

    return (boolUserHasOrgs || boolUserHasTeams);
  },
  boards() {
    let query = {
      // { type: 'board' },
      // { type: { $in: ['board','template-container'] } },
      $and: [
        { archived: false },
        { type: { $in: ['board', 'template-container'] } },
        { $or: [] },
        { title: { $not: { $regex: /^\^.*\^$/ } } }
      ]
    };

    let allowPrivateVisibilityOnly = TableVisibilityModeSettings.findOne('tableVisibilityMode-allowPrivateOnly');

    if (FlowRouter.getRouteName() === 'home') {
      query.$and[2].$or.push({ 'members.userId': Meteor.userId() });

      if (allowPrivateVisibilityOnly !== undefined && allowPrivateVisibilityOnly.booleanValue) {
        query.$and.push({ 'permission': 'private' });
      }
      const currUser = Users.findOne(Meteor.userId());

      // const currUser = Users.findOne(Meteor.userId(), {
      //   fields: {
      //     orgs: 1,
      //     teams: 1,
      //   },
      // });

      let orgIdsUserBelongs = currUser !== undefined && currUser.teams !== 'undefined' ? currUser.orgIdsUserBelongs() : '';
      if (orgIdsUserBelongs && orgIdsUserBelongs != '') {
        let orgsIds = orgIdsUserBelongs.split(',');
        // for(let i = 0; i < orgsIds.length; i++){
        //   query.$and[2].$or.push({'orgs.orgId': orgsIds[i]});
        // }

        //query.$and[2].$or.push({'orgs': {$elemMatch : {orgId: orgsIds[0]}}});
        query.$and[2].$or.push({ 'orgs.orgId': { $in: orgsIds } });
      }

      let teamIdsUserBelongs = currUser !== undefined && currUser.teams !== 'undefined' ? currUser.teamIdsUserBelongs() : '';
      if (teamIdsUserBelongs && teamIdsUserBelongs != '') {
        let teamsIds = teamIdsUserBelongs.split(',');
        // for(let i = 0; i < teamsIds.length; i++){
        //   query.$or[2].$or.push({'teams.teamId': teamsIds[i]});
        // }
        //query.$and[2].$or.push({'teams': { $elemMatch : {teamId: teamsIds[0]}}});
        query.$and[2].$or.push({ 'teams.teamId': { $in: teamsIds } });
      }
    }
    else if (allowPrivateVisibilityOnly !== undefined && !allowPrivateVisibilityOnly.booleanValue) {
      query = {
        archived: false,
        //type: { $in: ['board','template-container'] },
        type: 'board',
        permission: 'public',
      };
    }

    return Boards.find(query, {
      sort: { sort: 1 /* boards default sorting */ },
    });
  },
  boardLists(boardId) {
    let boardLists = [];
    const lists = Lists.find({ 'boardId': boardId, 'archived': false },{sort: ['sort','asc']});
    lists.forEach(list => {
      let cardCount = Cards.find({ 'boardId': boardId, 'listId': list._id }).count()
      boardLists.push(`${list.title}: ${cardCount}`);
    });
    return boardLists
  },

  boardMembers(boardId) {
    let boardMembers = [];
    const lists = Boards.findOne({ '_id': boardId })
    let members = lists.members
    members.forEach(member => {
      boardMembers.push(member.userId);
    });
    return boardMembers
  },

  isStarred() {
    const user = Meteor.user();
    return user && user.hasStarred(this.currentData()._id);
  },
  isAdministrable() {
    const user = Meteor.user();
    return user && user.isBoardAdmin(this.currentData()._id);
  },

  hasOvertimeCards() {
    subManager.subscribe('board', this.currentData()._id, false);
    return this.currentData().hasOvertimeCards();
  },

  hasSpentTimeCards() {
    subManager.subscribe('board', this.currentData()._id, false);
    return this.currentData().hasSpentTimeCards();
  },

  isInvited() {
    const user = Meteor.user();
    return user && user.isInvitedTo(this.currentData()._id);
  },

  events() {
    return [
      {
        'click .js-add-board': Popup.open('createBoard'),
        'click .js-star-board'(evt) {
          const boardId = this.currentData()._id;
          Meteor.user().toggleBoardStar(boardId);
          evt.preventDefault();
        },
        'click .js-clone-board'(evt) {
          let title = getSlug(Boards.findOne(this.currentData()._id).title) || 'cloned-board';
          Meteor.call(
            'copyBoard',
            this.currentData()._id,
            {
              sort: Boards.find({ archived: false }).count(),
              type: 'board',
              title: Boards.findOne(this.currentData()._id).title,
            },
            (err, res) => {
              if (err) {
                console.error(err);
              } else {
                Session.set('fromBoard', null);
                subManager.subscribe('board', res, false);
                FlowRouter.go('board', {
                  id: res,
                  slug: title,
                });
              }
            },
          );
          evt.preventDefault();
        },
        'click .js-archive-board'(evt) {
          const boardId = this.currentData()._id;
          Meteor.call('archiveBoard', boardId);
          evt.preventDefault();
        },
        'click .js-accept-invite'() {
          const boardId = this.currentData()._id;
          Meteor.call('acceptInvite', boardId);
        },
        'click .js-decline-invite'() {
          const boardId = this.currentData()._id;
          Meteor.call('quitBoard', boardId, (err, ret) => {
            if (!err && ret) {
              Meteor.call('acceptInvite', boardId);
              FlowRouter.go('home');
            }
          });
        },
        'click #resetBtn'(event) {
          let allBoards = document.getElementsByClassName("js-board");
          let currBoard;
          for (let i = 0; i < allBoards.length; i++) {
            currBoard = allBoards[i];
            currBoard.style.display = "block";
          }
        },
        'click #filterBtn'(event) {
          event.preventDefault();
          let selectedTeams = document.querySelectorAll('#jsAllBoardTeams option:checked');
          let selectedTeamsValues = Array.from(selectedTeams).map(function (elt) { return elt.value });
          let index = selectedTeamsValues.indexOf("-1");
          if (index > -1) {
            selectedTeamsValues.splice(index, 1);
          }

          let selectedOrgs = document.querySelectorAll('#jsAllBoardOrgs option:checked');
          let selectedOrgsValues = Array.from(selectedOrgs).map(function (elt) { return elt.value });
          index = selectedOrgsValues.indexOf("-1");
          if (index > -1) {
            selectedOrgsValues.splice(index, 1);
          }

          if (selectedTeamsValues.length > 0 || selectedOrgsValues.length > 0) {
            const query = {
              $and: [
                { archived: false },
                { type: 'board' },
                { $or: [] }
              ]
            };
            if (selectedTeamsValues.length > 0) {
              query.$and[2].$or.push({ 'teams.teamId': { $in: selectedTeamsValues } });
            }
            if (selectedOrgsValues.length > 0) {
              query.$and[2].$or.push({ 'orgs.orgId': { $in: selectedOrgsValues } });
            }

            let filteredBoards = Boards.find(query, {}).fetch();
            let allBoards = document.getElementsByClassName("js-board");
            let currBoard;
            if (filteredBoards.length > 0) {
              let currBoardId;
              let found;
              for (let i = 0; i < allBoards.length; i++) {
                currBoard = allBoards[i];
                currBoardId = currBoard.classList[0];
                found = filteredBoards.find(function (board) {
                  return board._id == currBoardId;
                });

                if (found !== undefined)
                  currBoard.style.display = "block";
                else
                  currBoard.style.display = "none";
              }
            }
            else {
              for (let i = 0; i < allBoards.length; i++) {
                currBoard = allBoards[i];
                currBoard.style.display = "none";
              }
            }
          }
        },
      },
    ];
  },
}).register('boardList');
