import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import getSlug from 'limax';

const subManager = new SubsManager();

Template.boardList.helpers({
  hideCardCounterList() {
    /* Bug Board icons random dance https://github.com/wekan/wekan/issues/4214
       return Utils.isMiniScreen() && Session.get('currentBoard'); */
    return true;
  },
  hideBoardMemberList() {
    /* Bug Board icons random dance https://github.com/wekan/wekan/issues/4214
       return Utils.isMiniScreen() && Session.get('currentBoard'); */
    return true;
  },
  BoardMultiSelection() {
    return BoardMultiSelection;
  },
});

Template.boardListHeaderBar.events({
  'click .js-open-archived-board'() {
    Modal.open('archivedBoards');
  },
});

Template.boardList.events({});

Template.boardListHeaderBar.helpers({
  title() {
    //if (FlowRouter.getRouteName() === 'template-container') {
    //  return 'template-container';
    //} else {
    return FlowRouter.getRouteName() === 'home' ? 'my-boards' : 'public';
    //}
  },
  templatesBoardId() {
    return ReactiveCache.getCurrentUser()?.getTemplatesBoardId();
  },
  templatesBoardSlug() {
    return ReactiveCache.getCurrentUser()?.getTemplatesBoardSlug();
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    Meteor.subscribe('setting');
    Meteor.subscribe('tableVisibilityModeSettings');
    this.selectedMenu = new ReactiveVar('starred');
    this.selectedWorkspaceIdVar = new ReactiveVar(null);
    this.workspacesTreeVar = new ReactiveVar([]);
    let currUser = ReactiveCache.getCurrentUser();
    let userLanguage;
    if (currUser && currUser.profile) {
      userLanguage = currUser.profile.language;
    }
    if (userLanguage) {
      TAPi18n.setLanguage(userLanguage);
    }
    // Load workspaces tree reactively
    this.autorun(() => {
      const u = ReactiveCache.getCurrentUser();
      const tree = (u && u.profile && u.profile.boardWorkspacesTree) || [];
      this.workspacesTreeVar.set(tree);
    });
  },

  reorderWorkspaces(draggedSpaceId, targetSpaceId) {
    const tree = this.workspacesTreeVar.get();

    // Helper to remove a space from tree
    const removeSpace = (nodes, id) => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === id) {
          const removed = nodes.splice(i, 1)[0];
          return { tree: nodes, removed };
        }
        if (nodes[i].children) {
          const result = removeSpace(nodes[i].children, id);
          if (result.removed) {
            return { tree: nodes, removed: result.removed };
          }
        }
      }
      return { tree: nodes, removed: null };
    };

    // Helper to insert a space after target
    const insertAfter = (nodes, targetId, spaceToInsert) => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === targetId) {
          nodes.splice(i + 1, 0, spaceToInsert);
          return true;
        }
        if (nodes[i].children) {
          if (insertAfter(nodes[i].children, targetId, spaceToInsert)) {
            return true;
          }
        }
      }
      return false;
    };

    // Clone the tree
    const newTree = EJSON.clone(tree);

    // Remove the dragged space
    const { tree: treeAfterRemoval, removed } = removeSpace(newTree, draggedSpaceId);

    if (removed) {
      // Insert after target
      insertAfter(treeAfterRemoval, targetSpaceId, removed);

      // Save the new tree
      Meteor.call('setWorkspacesTree', treeAfterRemoval, (err) => {
        if (err) console.error(err);
      });
    }
  },

  onRendered() {
    // jQuery sortable is disabled in favor of HTML5 drag-and-drop for space management
    // The old sortable code has been removed to prevent conflicts

    // #FIXME OLD SORTABLE CODE - WILL BE DISABLED
    //
    // const itemsSelector = '.js-board';

    // const $boards = this.$('.js-boards');
    // $boards.sortable({
    //   connectWith: '.js-boards',
    //   tolerance: 'pointer',
    //   appendTo: '.board-list',
    //   helper: 'clone',
    //   distance: 7,
    //   items: itemsSelector,
    //   placeholder: 'board-wrapper placeholder',
    //   start(evt, ui) {
    //     ui.helper.css('z-index', 1000);
    //     ui.placeholder.height(ui.helper.height());
    //     EscapeActions.executeUpTo('popup-close');
    //   },
    //   async stop(evt, ui) {
    //     const prevBoardDom = ui.item.prev('.js-board').get(0);
    //     const nextBoardDom = ui.item.next('.js-board').get(0);
    //     const sortIndex = Utils.calculateIndex(prevBoardDom, nextBoardDom, 1);

    //     const boardDomElement = ui.item.get(0);
    //     const board = Blaze.getData(boardDomElement);
    //     $boards.sortable('cancel');
    //     const currentUser = ReactiveCache.getCurrentUser();
    //     if (currentUser && typeof currentUser.setBoardSortIndex === 'function') {
    //       await currentUser.setBoardSortIndex(board._id, sortIndex.base);
    //     }
    //   },
    // });
  },
  userHasTeams() {
    if (ReactiveCache.getCurrentUser()?.teams?.length > 0) return true;
    else return false;
  },
  teamsDatas() {
    const teams = ReactiveCache.getCurrentUser()?.teams;
    if (teams)
      return teams.sort((a, b) =>
        a.teamDisplayName.localeCompare(b.teamDisplayName),
      );
    else return [];
  },
  userHasOrgs() {
    if (ReactiveCache.getCurrentUser()?.orgs?.length > 0) return true;
    else return false;
  },
  orgsDatas() {
    const orgs = ReactiveCache.getCurrentUser()?.orgs;
    if (orgs)
      return orgs.sort((a, b) =>
        a.orgDisplayName.localeCompare(b.orgDisplayName),
      );
    else return [];
  },
  userHasOrgsOrTeams() {
    const ret = this.userHasOrgs() || this.userHasTeams();
    return ret;
  },
  currentMenuPath() {
    try {
      const selectedMenuVar = this.selectedMenu;
      if (!selectedMenuVar || typeof selectedMenuVar.get !== 'function') {
        return { icon: '🗂️', text: 'Workspaces' };
      }
      const sel = selectedMenuVar.get();
      const currentUser = ReactiveCache.getCurrentUser();

      // Helper function to safely get translation or fallback
      const safeTranslate = (key, fallback) => {
        try {
          return TAPi18n.__(key) || fallback;
        } catch (e) {
          return fallback;
        }
      };

      // Helper to find space by id in tree
      const findSpaceById = (nodes, targetId, path = []) => {
        if (!nodes || !Array.isArray(nodes)) return null;
        for (const node of nodes) {
          if (node.id === targetId) {
            return [...path, node];
          }
          if (node.children && node.children.length > 0) {
            const result = findSpaceById(node.children, targetId, [
              ...path,
              node,
            ]);
            if (result) return result;
          }
        }
        return null;
      };

      if (sel === 'starred') {
        return { icon: '⭐', text: safeTranslate('allboards.starred', 'Starred') };
      } else if (sel === 'templates') {
        return { icon: '📋', text: safeTranslate('allboards.templates', 'Templates') };
      } else if (sel === 'remaining') {
        return { icon: '📂', text: safeTranslate('allboards.remaining', 'Remaining') };
      } else {
        // sel is a workspaceId, build path
        if (!this.workspacesTreeVar || typeof this.workspacesTreeVar.get !== 'function') {
          return { icon: '🗂️', text: safeTranslate('allboards.workspaces', 'Workspaces') };
        }
        const tree = this.workspacesTreeVar.get();
        const spacePath = findSpaceById(tree, sel);
        if (spacePath && spacePath.length > 0) {
          const pathText = spacePath.map((s) => s.name).join(' / ');
          return {
            icon: '🗂️',
            text: `${safeTranslate('allboards.workspaces', 'Workspaces')} / ${pathText}`,
          };
        }
        return { icon: '🗂️', text: safeTranslate('allboards.workspaces', 'Workspaces') };
      }
    } catch (error) {
      console.error('Error in currentMenuPath:', error);
      return { icon: '🗂️', text: 'Workspaces' };
    }
  },
  boards() {
    let query = {
      $and: [
        { archived: false },
        { type: { $in: ['board', 'template-container'] } },
        { title: { $not: { $regex: /^\^.*\^$/ } } },
      ],
    };
    const membershipOrs = [];

    let allowPrivateVisibilityOnly = TableVisibilityModeSettings.findOne(
      'tableVisibilityMode-allowPrivateOnly',
    );

    if (FlowRouter.getRouteName() === 'home') {
      membershipOrs.push({ 'members.userId': Meteor.userId() });

      if (
        allowPrivateVisibilityOnly !== undefined &&
        allowPrivateVisibilityOnly.booleanValue
      ) {
        query.$and.push({ permission: 'private' });
      }
      const currUser = ReactiveCache.getCurrentUser();

      let orgIdsUserBelongs = currUser?.orgIdsUserBelongs() || '';
      if (orgIdsUserBelongs) {
        let orgsIds = orgIdsUserBelongs.split(',');
        // for(let i = 0; i < orgsIds.length; i++){
        //   query.$and[2].$or.push({'orgs.orgId': orgsIds[i]});
        // }

        //query.$and[2].$or.push({'orgs': {$elemMatch : {orgId: orgsIds[0]}}});
        membershipOrs.push({ 'orgs.orgId': { $in: orgsIds } });
      }

      let teamIdsUserBelongs = currUser?.teamIdsUserBelongs() || '';
      if (teamIdsUserBelongs) {
        let teamsIds = teamIdsUserBelongs.split(',');
        // for(let i = 0; i < teamsIds.length; i++){
        //   query.$or[2].$or.push({'teams.teamId': teamsIds[i]});
        // }
        //query.$and[2].$or.push({'teams': { $elemMatch : {teamId: teamsIds[0]}}});
        membershipOrs.push({ 'teams.teamId': { $in: teamsIds } });
      }
      if (membershipOrs.length) {
        query.$and.splice(2, 0, { $or: membershipOrs });
      }
    } else if (
      allowPrivateVisibilityOnly !== undefined &&
      !allowPrivateVisibilityOnly.booleanValue
    ) {
      query = {
        archived: false,
        //type: { $in: ['board','template-container'] },
        type: 'board',
        permission: 'public',
      };
    }

    const boards = ReactiveCache.getBoards(query, {});
    const currentUser = ReactiveCache.getCurrentUser();
    let list = boards;
    // Apply left menu filtering
    const sel = this.selectedMenu.get();
    const assignments =
      (currentUser &&
        currentUser.profile &&
        currentUser.profile.boardWorkspaceAssignments) ||
      {};
    if (sel === 'starred') {
      list = list.filter((b) => currentUser && currentUser.hasStarred(b._id));
    } else if (sel === 'templates') {
      list = list.filter((b) => b.type === 'template-container');
    } else if (sel === 'remaining') {
      // Show boards not in any workspace AND not templates
      // Keep starred boards visible in Remaining too
      list = list.filter(
        (b) => !assignments[b._id] && b.type !== 'template-container',
      );
    } else {
      // assume sel is a workspaceId
      // Keep starred boards visible in their workspace too
      list = list.filter((b) => assignments[b._id] === sel);
    }

    if (currentUser && typeof currentUser.sortBoardsForUser === 'function') {
      return currentUser.sortBoardsForUser(list);
    }
    return list
      .slice()
      .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  },
  boardLists(boardId) {
    /* Bug Board icons random dance https://github.com/wekan/wekan/issues/4214
    const lists = ReactiveCache.getLists({ 'boardId': boardId, 'archived': false },{sort: ['sort','asc']});
    const ret = lists.map(list => {
      let cardCount = ReactiveCache.getCards({ 'boardId': boardId, 'listId': list._id }).length;
      return `${list.title}: ${cardCountcardCount}`;
    });
    return ret;
    */
    return [];
  },

  boardMembers(boardId) {
    /* Bug Board icons random dance https://github.com/wekan/wekan/issues/4214
    const lists = ReactiveCache.getBoard(boardId)
    const boardMembers = lists?.members.map(member => member.userId);
    return boardMembers;
    */
    return [];
  },

  isStarred() {
    const user = ReactiveCache.getCurrentUser();
    return user && user.hasStarred(this.currentData()._id);
  },
  isAdministrable() {
    const user = ReactiveCache.getCurrentUser();
    return user && user.isBoardAdmin(this.currentData()._id);
  },

  hasOvertimeCards() {
    return this.currentData().hasOvertimeCards();
  },

  hasSpentTimeCards() {
    return this.currentData().hasSpentTimeCards();
  },

  isInvited() {
    const user = ReactiveCache.getCurrentUser();
    return user && user.isInvitedTo(this.currentData()._id);
  },

  events() {
    return [
      {
        'click .js-select-menu'(evt) {
          const type = evt.currentTarget.getAttribute('data-type');
          this.selectedWorkspaceIdVar.set(null);
          this.selectedMenu.set(type);
        },
        'click .js-select-workspace'(evt) {
          const id = evt.currentTarget.getAttribute('data-id');
          this.selectedWorkspaceIdVar.set(id);
          this.selectedMenu.set(id);
        },
        'click .js-add-workspace'(evt) {
          evt.preventDefault();
          const name = prompt(
            TAPi18n.__('allboards.add-workspace-prompt') || 'New Space name',
          );
          if (name && name.trim()) {
            Meteor.call(
              'createWorkspace',
              { parentId: null, name: name.trim() },
              (err, res) => {
                if (err) console.error(err);
              },
            );
          }
        },
        'click .js-add-board'(evt) {
          // Store the currently selected workspace/menu for board creation
          const selectedWorkspaceId = this.selectedWorkspaceIdVar.get();
          const selectedMenu = this.selectedMenu.get();

          if (selectedWorkspaceId) {
            Session.set('createBoardInWorkspace', selectedWorkspaceId);
          } else {
            Session.set('createBoardInWorkspace', null);
          }

          // Open different popup based on context
          if (selectedMenu === 'templates') {
            Popup.open('createTemplateContainer')(evt);
          } else {
            Popup.open('createBoard')(evt);
          }
        },
        'click .js-star-board'(evt) {
          evt.preventDefault();
          evt.stopPropagation();
          const boardId = this.currentData()._id;
          if (boardId) {
            Meteor.call('toggleBoardStar', boardId);
          }
        },
        // HTML5 DnD from boards to spaces
        'dragstart .js-board'(evt) {
          const boardId = this.currentData()._id;

          // Support multi-drag
          if (
            BoardMultiSelection.isActive() &&
            BoardMultiSelection.isSelected(boardId)
          ) {
            const selectedIds = BoardMultiSelection.getSelectedBoardIds();
            try {
              evt.originalEvent.dataTransfer.setData(
                'text/plain',
                JSON.stringify(selectedIds),
              );
              evt.originalEvent.dataTransfer.setData(
                'application/x-board-multi',
                'true',
              );
            } catch (e) {}
          } else {
            try {
              evt.originalEvent.dataTransfer.setData('text/plain', boardId);
            } catch (e) {}
          }
        },
        'click .js-clone-board'(evt) {
          if (confirm(TAPi18n.__('duplicate-board-confirm'))) {
            let title =
              getSlug(ReactiveCache.getBoard(this.currentData()._id).title) ||
              'cloned-board';
            Meteor.call(
              'copyBoard',
              this.currentData()._id,
              {
                sort: ReactiveCache.getBoards({ archived: false }).length,
                type: 'board',
                title: ReactiveCache.getBoard(this.currentData()._id).title,
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
          }
        },
        'click .js-archive-board'(evt) {
          if (confirm(TAPi18n.__('archive-board-confirm'))) {
            const boardId = this.currentData()._id;
            Meteor.call('archiveBoard', boardId);
            evt.preventDefault();
          }
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
        'click .js-multiselection-activate'(evt) {
          evt.preventDefault();
          if (BoardMultiSelection.isActive()) {
            BoardMultiSelection.disable();
          } else {
            BoardMultiSelection.activate();
            Popup.open('multiselectionHint', { showHeader: false })(evt);
          }
        },
        'click .js-multiselection-reset'(evt) {
          evt.preventDefault();
          BoardMultiSelection.disable();
          Popup.close();
        },
        'click .js-toggle-board-multi-selection'(evt) {
          evt.preventDefault();
          evt.stopPropagation();
          const boardId = this.currentData()._id;
          BoardMultiSelection.toogle(boardId);
        },
        'click .js-archive-selected-boards'(evt) {
          evt.preventDefault();
          const selectedBoards = BoardMultiSelection.getSelectedBoardIds();
          if (
            selectedBoards.length > 0 &&
            confirm(TAPi18n.__('archive-board-confirm'))
          ) {
            selectedBoards.forEach((boardId) => {
              Meteor.call('archiveBoard', boardId);
            });
            BoardMultiSelection.reset();
          }
        },
        'click .js-duplicate-selected-boards'(evt) {
          evt.preventDefault();
          const selectedBoards = BoardMultiSelection.getSelectedBoardIds();
          if (
            selectedBoards.length > 0 &&
            confirm(TAPi18n.__('duplicate-board-confirm'))
          ) {
            selectedBoards.forEach((boardId) => {
              const board = ReactiveCache.getBoard(boardId);
              if (board) {
                Meteor.call(
                  'copyBoard',
                  boardId,
                  {
                    sort: ReactiveCache.getBoards({ archived: false }).length,
                    type: 'board',
                    title: board.title,
                  },
                  (err, res) => {
                    if (err) console.error(err);
                  },
                );
              }
            });
            BoardMultiSelection.reset();
          }
        },
        'click #resetBtn'(event) {
          let allBoards = document.getElementsByClassName('js-board');
          let currBoard;
          for (let i = 0; i < allBoards.length; i++) {
            currBoard = allBoards[i];
            currBoard.style.display = 'block';
          }
        },
        'click #filterBtn'(event) {
          event.preventDefault();
          let selectedTeams = document.querySelectorAll(
            '#jsAllBoardTeams option:checked',
          );
          let selectedTeamsValues = Array.from(selectedTeams).map(
            function (elt) {
              return elt.value;
            },
          );
          let index = selectedTeamsValues.indexOf('-1');
          if (index > -1) {
            selectedTeamsValues.splice(index, 1);
          }

          let selectedOrgs = document.querySelectorAll(
            '#jsAllBoardOrgs option:checked',
          );
          let selectedOrgsValues = Array.from(selectedOrgs).map(function (elt) {
            return elt.value;
          });
          index = selectedOrgsValues.indexOf('-1');
          if (index > -1) {
            selectedOrgsValues.splice(index, 1);
          }

          if (selectedTeamsValues.length > 0 || selectedOrgsValues.length > 0) {
            const query = {
              $and: [{ archived: false }, { type: 'board' }],
            };
            const ors = [];
            if (selectedTeamsValues.length > 0) {
              ors.push({ 'teams.teamId': { $in: selectedTeamsValues } });
            }
            if (selectedOrgsValues.length > 0) {
              ors.push({ 'orgs.orgId': { $in: selectedOrgsValues } });
            }
            if (ors.length) {
              query.$and.push({ $or: ors });
            }

            let filteredBoards = ReactiveCache.getBoards(query, {});
            let allBoards = document.getElementsByClassName('js-board');
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

                if (found !== undefined) currBoard.style.display = 'block';
                else currBoard.style.display = 'none';
              }
            } else {
              for (let i = 0; i < allBoards.length; i++) {
                currBoard = allBoards[i];
                currBoard.style.display = 'none';
              }
            }
          }
        },
        'click .js-edit-workspace'(evt) {
          evt.preventDefault();
          evt.stopPropagation();
          const workspaceId = evt.currentTarget.getAttribute('data-id');

          // Find the space in the tree
          const findSpace = (nodes, id) => {
            for (const node of nodes) {
              if (node.id === id) return node;
              if (node.children) {
                const found = findSpace(node.children, id);
                if (found) return found;
              }
            }
            return null;
          };

          const tree = this.workspacesTreeVar.get();
          const space = findSpace(tree, workspaceId);

          if (space) {
            const newName = prompt(
              TAPi18n.__('allboards.edit-workspace-name') || 'Space name:',
              space.name,
            );
            const newIcon = prompt(
              TAPi18n.__('allboards.edit-workspace-icon') ||
                'Space icon (markdown):',
              space.icon || '📁',
            );

            if (newName !== null && newName.trim()) {
              // Update space in tree
              const updateSpaceInTree = (nodes, id, updates) => {
                return nodes.map((node) => {
                  if (node.id === id) {
                    return { ...node, ...updates };
                  }
                  if (node.children) {
                    return {
                      ...node,
                      children: updateSpaceInTree(node.children, id, updates),
                    };
                  }
                  return node;
                });
              };

              const updatedTree = updateSpaceInTree(tree, workspaceId, {
                name: newName.trim(),
                icon: newIcon || '📁',
              });


              Meteor.call('setWorkspacesTree', updatedTree, (err) => {
                if (err) console.error(err);
              });
            }
          }
        },
        'click .js-add-subworkspace'(evt) {
          evt.preventDefault();
          evt.stopPropagation();
          const parentId = evt.currentTarget.getAttribute('data-id');
          const name = prompt(
            TAPi18n.__('allboards.add-subworkspace-prompt') || 'Subspace name:',
          );

          if (name && name.trim()) {
            Meteor.call(
              'createWorkspace',
              { parentId, name: name.trim() },
              (err) => {
                if (err) console.error(err);
              },
            );
          }
        },
        'dragstart .workspace-node'(evt) {
          const workspaceId =
            evt.currentTarget.getAttribute('data-workspace-id');
          evt.originalEvent.dataTransfer.effectAllowed = 'move';
          evt.originalEvent.dataTransfer.setData(
            'application/x-workspace-id',
            workspaceId,
          );

          // Create a better drag image
          const dragImage = evt.currentTarget.cloneNode(true);
          dragImage.style.position = 'absolute';
          dragImage.style.top = '-9999px';
          dragImage.style.opacity = '0.8';
          document.body.appendChild(dragImage);
          evt.originalEvent.dataTransfer.setDragImage(dragImage, 0, 0);
          setTimeout(() => document.body.removeChild(dragImage), 0);

          evt.currentTarget.classList.add('dragging');
        },
        'dragend .workspace-node'(evt) {
          evt.currentTarget.classList.remove('dragging');
          document.querySelectorAll('.workspace-node').forEach((el) => {
            el.classList.remove('drag-over');
          });
        },
        'dragover .workspace-node'(evt) {
          evt.preventDefault();
          evt.stopPropagation();

          const draggingEl = document.querySelector('.workspace-node.dragging');
          const targetEl = evt.currentTarget;

          // Allow dropping boards on any space
          // Or allow dropping spaces on other spaces (but not on itself or descendants)
          if (
            !draggingEl ||
            (targetEl !== draggingEl && !draggingEl.contains(targetEl))
          ) {
            evt.originalEvent.dataTransfer.dropEffect = 'move';
            targetEl.classList.add('drag-over');
          }
        },
        'dragleave .workspace-node'(evt) {
          evt.currentTarget.classList.remove('drag-over');
        },
        'drop .workspace-node'(evt) {
          evt.preventDefault();
          evt.stopPropagation();

          const targetEl = evt.currentTarget;
          targetEl.classList.remove('drag-over');

          // Check what's being dropped - board or workspace
          const draggedWorkspaceId = evt.originalEvent.dataTransfer.getData(
            'application/x-workspace-id',
          );
          const isMultiBoard = evt.originalEvent.dataTransfer.getData(
            'application/x-board-multi',
          );
          const boardData =
            evt.originalEvent.dataTransfer.getData('text/plain');

          if (draggedWorkspaceId && !boardData) {
            // This is a workspace reorder operation
            const targetWorkspaceId =
              targetEl.getAttribute('data-workspace-id');

            if (draggedWorkspaceId !== targetWorkspaceId) {
              this.reorderWorkspaces(draggedWorkspaceId, targetWorkspaceId);
            }
          } else if (boardData) {
            // This is a board assignment operation
            // Get the workspace ID directly from the dropped workspace-node's data-workspace-id attribute
            const workspaceId = targetEl.getAttribute('data-workspace-id');


            if (workspaceId) {
              if (isMultiBoard) {
                // Multi-board drag
                try {
                  const boardIds = JSON.parse(boardData);
                  boardIds.forEach((boardId) => {
                    Meteor.call('assignBoardToWorkspace', boardId, workspaceId);
                  });
                } catch (e) {
                  // Error parsing multi-board data
                }
              } else {
                // Single board drag
                Meteor.call('assignBoardToWorkspace', boardData, workspaceId);
              }
            }
          }
        },
        'dragover .js-select-menu'(evt) {
          evt.preventDefault();
          evt.stopPropagation();


          const menuType = evt.currentTarget.getAttribute('data-type');
          // Only allow drop on "remaining" menu to unassign boards from spaces
          if (menuType === 'remaining') {
            evt.originalEvent.dataTransfer.dropEffect = 'move';
            evt.currentTarget.classList.add('drag-over');
          }
        },
        'dragleave .js-select-menu'(evt) {
          evt.currentTarget.classList.remove('drag-over');
        },
        'drop .js-select-menu'(evt) {
          evt.preventDefault();
          evt.stopPropagation();


          const menuType = evt.currentTarget.getAttribute('data-type');
          evt.currentTarget.classList.remove('drag-over');


          // Only handle drops on "remaining" menu
          if (menuType !== 'remaining') return;

          const isMultiBoard = evt.originalEvent.dataTransfer.getData(
            'application/x-board-multi',
          );
          const boardData =
            evt.originalEvent.dataTransfer.getData('text/plain');

          if (boardData) {
            if (isMultiBoard) {
              // Multi-board drag - unassign all from workspaces
              try {
                const boardIds = JSON.parse(boardData);
                boardIds.forEach((boardId) => {
                  Meteor.call('unassignBoardFromWorkspace', boardId);
                });
              } catch (e) {
                // Error parsing multi-board data
              }
            } else {
              // Single board drag - unassign from workspace
              Meteor.call('unassignBoardFromWorkspace', boardData);
            }
          }
        },
      },
    ];
  },
  // Helpers for templates
  workspacesTree() {
    return this.workspacesTreeVar.get();
  },
  selectedWorkspaceId() {
    return this.selectedWorkspaceIdVar.get();
  },
  isSelectedMenu(type) {
    return this.selectedMenu.get() === type;
  },
  isSpaceSelected(id) {
    return this.selectedWorkspaceIdVar.get() === id;
  },
  menuItemCount(type) {
    const currentUser = ReactiveCache.getCurrentUser();
    const assignments =
      (currentUser &&
        currentUser.profile &&
        currentUser.profile.boardWorkspaceAssignments) ||
      {};

    // Get all boards for counting
    let query = {
      $and: [
        { archived: false },
        { type: { $in: ['board', 'template-container'] } },
        { $or: [{ 'members.userId': Meteor.userId() }] },
        { title: { $not: { $regex: /^\^.*\^$/ } } },
      ],
    };
    const allBoards = ReactiveCache.getBoards(query, {});


    if (type === 'starred') {
      return allBoards.filter(
        (b) => currentUser && currentUser.hasStarred(b._id),
      ).length;
    } else if (type === 'templates') {
      return allBoards.filter((b) => b.type === 'template-container').length;
    } else if (type === 'remaining') {
      // Count boards not in any workspace AND not templates
      // Include starred boards (they appear in both Starred and Remaining)
      return allBoards.filter(
        (b) => !assignments[b._id] && b.type !== 'template-container',
      ).length;
    }
    return 0;
  },
  workspaceCount(workspaceId) {
    const currentUser = ReactiveCache.getCurrentUser();
    const assignments =
      (currentUser &&
        currentUser.profile &&
        currentUser.profile.boardWorkspaceAssignments) ||
      {};

    // Get all boards for counting
    let query = {
      $and: [
        { archived: false },
        { type: { $in: ['board', 'template-container'] } },
        { $or: [{ 'members.userId': Meteor.userId() }] },
        { title: { $not: { $regex: /^\^.*\^$/ } } },
      ],
    };
    const allBoards = ReactiveCache.getBoards(query, {});

    // Count boards directly assigned to this space (not including children)
    return allBoards.filter((b) => assignments[b._id] === workspaceId).length;
  },
  canModifyBoards() {
    const currentUser = ReactiveCache.getCurrentUser();
    return currentUser && !currentUser.isCommentOnly();
  },
  hasBoardsSelected() {
    return BoardMultiSelection.count() > 0;
  },
}).register('boardList');
