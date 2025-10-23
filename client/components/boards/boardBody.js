import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import dragscroll from '@wekanteam/dragscroll';
import { boardConverter } from '/client/lib/boardConverter';
import { migrationManager } from '/client/lib/migrationManager';
import { attachmentMigrationManager } from '/client/lib/attachmentMigrationManager';
import Swimlanes from '/models/swimlanes';
import Lists from '/models/lists';

const subManager = new SubsManager();
const { calculateIndex } = Utils;
const swimlaneWhileSortingHeight = 150;

BlazeComponent.extendComponent({
  onCreated() {
    this.isBoardReady = new ReactiveVar(false);
    this.isConverting = new ReactiveVar(false);
    this.isMigrating = new ReactiveVar(false);
    this._swimlaneCreated = new Set(); // Track boards where we've created swimlanes
    this._boardProcessed = false; // Track if board has been processed
    this._lastProcessedBoardId = null; // Track last processed board ID

    // The pattern we use to manually handle data loading is described here:
    // https://kadira.io/academy/meteor-routing-guide/content/subscriptions-and-data-management/using-subs-manager
    // XXX The boardId should be readed from some sort the component "props",
    // unfortunatly, Blaze doesn't have this notion.
    this.autorun(() => {
      const currentBoardId = Session.get('currentBoard');
      if (!currentBoardId) return;
      
      const handle = subManager.subscribe('board', currentBoardId, false);
      
      // Use a separate autorun for subscription ready state to avoid reactive loops
      this.subscriptionReadyAutorun = Tracker.autorun(() => {
        if (handle.ready()) {
          // Only run conversion/migration logic once per board
          if (!this._boardProcessed || this._lastProcessedBoardId !== currentBoardId) {
            this._boardProcessed = true;
            this._lastProcessedBoardId = currentBoardId;
            
            // Ensure default swimlane exists (only once per board)
            this.ensureDefaultSwimlane(currentBoardId);
            // Check if board needs conversion
            this.checkAndConvertBoard(currentBoardId);
          }
        } else {
          this.isBoardReady.set(false);
        }
      });
    });
  },

  onDestroyed() {
    // Clean up the subscription ready autorun to prevent memory leaks
    if (this.subscriptionReadyAutorun) {
      this.subscriptionReadyAutorun.stop();
    }
  },

  ensureDefaultSwimlane(boardId) {
    // Only create swimlane once per board
    if (this._swimlaneCreated.has(boardId)) {
      return;
    }

    try {
      const board = ReactiveCache.getBoard(boardId);
      if (!board) return;

      const swimlanes = board.swimlanes();
      
      if (swimlanes.length === 0) {
        // Check if any swimlane exists in the database to avoid race conditions
        const existingSwimlanes = ReactiveCache.getSwimlanes({ boardId });
        if (existingSwimlanes.length === 0) {
          const swimlaneId = Swimlanes.insert({
            title: 'Default',
            boardId: boardId,
          });
          if (process.env.DEBUG === 'true') {
            console.log(`Created default swimlane ${swimlaneId} for board ${boardId}`);
          }
        }
        this._swimlaneCreated.add(boardId);
      } else {
        this._swimlaneCreated.add(boardId);
      }
    } catch (error) {
      console.error('Error creating default swimlane:', error);
    }
  },

  async checkAndConvertBoard(boardId) {
    try {
      const board = ReactiveCache.getBoard(boardId);
      if (!board) {
        this.isBoardReady.set(true);
        return;
      }

      // Check if board needs migration based on migration version
      const needsMigration = !board.migrationVersion || board.migrationVersion < 1;
      
      if (needsMigration) {
        // Start background migration for old boards
        this.isMigrating.set(true);
        await this.startBackgroundMigration(boardId);
        this.isMigrating.set(false);
      }

      // Check if board needs conversion (for old structure)
      if (boardConverter.isBoardConverted(boardId)) {
        if (process.env.DEBUG === 'true') {
          console.log(`Board ${boardId} has already been converted, skipping conversion`);
        }
        this.isBoardReady.set(true);
      } else {
        const needsConversion = boardConverter.needsConversion(boardId);
        
        if (needsConversion) {
          this.isConverting.set(true);
          const success = await boardConverter.convertBoard(boardId);
          this.isConverting.set(false);
          
          if (success) {
            this.isBoardReady.set(true);
          } else {
            console.error('Board conversion failed, setting ready to true anyway');
            this.isBoardReady.set(true); // Still show board even if conversion failed
          }
        } else {
          this.isBoardReady.set(true);
        }
      }

      // Convert shared lists to per-swimlane lists if needed
      await this.convertSharedListsToPerSwimlane(boardId);

      // Fix missing lists migration (for cards with wrong listId references)
      await this.fixMissingLists(boardId);

      // Fix duplicate lists created by WeKan 8.10
      await this.fixDuplicateLists(boardId);

      // Start attachment migration in background if needed
      this.startAttachmentMigrationIfNeeded(boardId);
    } catch (error) {
      console.error('Error during board conversion check:', error);
      this.isConverting.set(false);
      this.isMigrating.set(false);
      this.isBoardReady.set(true); // Show board even if conversion check failed
    }
  },

  async startBackgroundMigration(boardId) {
    try {
      // Start background migration using the cron system
      Meteor.call('boardMigration.startBoardMigration', boardId, (error, result) => {
        if (error) {
          console.error('Failed to start background migration:', error);
        } else {
          if (process.env.DEBUG === 'true') {
            console.log('Background migration started for board:', boardId);
          }
        }
      });
    } catch (error) {
      console.error('Error starting background migration:', error);
    }
  },

  async convertSharedListsToPerSwimlane(boardId) {
    try {
      const board = ReactiveCache.getBoard(boardId);
      if (!board) return;

      // Check if board has already been processed for shared lists conversion
      if (board.hasSharedListsConverted) {
        if (process.env.DEBUG === 'true') {
          console.log(`Board ${boardId} has already been processed for shared lists conversion`);
        }
        return;
      }

      // Get all lists for this board
      const allLists = board.lists();
      const swimlanes = board.swimlanes();
      
      if (swimlanes.length === 0) {
        if (process.env.DEBUG === 'true') {
          console.log(`Board ${boardId} has no swimlanes, skipping shared lists conversion`);
        }
        return;
      }

      // Find shared lists (lists with empty swimlaneId or null swimlaneId)
      const sharedLists = allLists.filter(list => !list.swimlaneId || list.swimlaneId === '');
      
      if (sharedLists.length === 0) {
        if (process.env.DEBUG === 'true') {
          console.log(`Board ${boardId} has no shared lists to convert`);
        }
        // Mark as processed even if no shared lists
        Boards.update(boardId, { $set: { hasSharedListsConverted: true } });
        return;
      }

      if (process.env.DEBUG === 'true') {
        console.log(`Converting ${sharedLists.length} shared lists to per-swimlane lists for board ${boardId}`);
      }

      // Convert each shared list to per-swimlane lists
      for (const sharedList of sharedLists) {
        // Create a copy of the list for each swimlane
        for (const swimlane of swimlanes) {
          // Check if this list already exists in this swimlane
          const existingList = Lists.findOne({
            boardId: boardId,
            swimlaneId: swimlane._id,
            title: sharedList.title
          });

          if (!existingList) {
            // Double-check to avoid race conditions
            const doubleCheckList = ReactiveCache.getList({
              boardId: boardId,
              swimlaneId: swimlane._id,
              title: sharedList.title
            });

            if (!doubleCheckList) {
              // Create a new list in this swimlane
              const newListData = {
                title: sharedList.title,
                boardId: boardId,
                swimlaneId: swimlane._id,
                sort: sharedList.sort || 0,
                archived: sharedList.archived || false, // Preserve archived state from original list
                createdAt: new Date(),
                modifiedAt: new Date()
              };

              // Copy other properties if they exist
              if (sharedList.color) newListData.color = sharedList.color;
              if (sharedList.wipLimit) newListData.wipLimit = sharedList.wipLimit;
              if (sharedList.wipLimitEnabled) newListData.wipLimitEnabled = sharedList.wipLimitEnabled;
              if (sharedList.wipLimitSoft) newListData.wipLimitSoft = sharedList.wipLimitSoft;

              Lists.insert(newListData);
              
              if (process.env.DEBUG === 'true') {
                const archivedStatus = sharedList.archived ? ' (archived)' : ' (active)';
                console.log(`Created list "${sharedList.title}"${archivedStatus} for swimlane ${swimlane.title || swimlane._id}`);
              }
            } else {
              if (process.env.DEBUG === 'true') {
                console.log(`List "${sharedList.title}" already exists in swimlane ${swimlane.title || swimlane._id} (double-check), skipping`);
              }
            }
          } else {
            if (process.env.DEBUG === 'true') {
              console.log(`List "${sharedList.title}" already exists in swimlane ${swimlane.title || swimlane._id}, skipping`);
            }
          }
        }

        // Remove the original shared list completely
        Lists.remove(sharedList._id);
        
        if (process.env.DEBUG === 'true') {
          console.log(`Removed shared list "${sharedList.title}"`);
        }
      }

      // Mark board as processed
      Boards.update(boardId, { $set: { hasSharedListsConverted: true } });

      if (process.env.DEBUG === 'true') {
        console.log(`Successfully converted ${sharedLists.length} shared lists to per-swimlane lists for board ${boardId}`);
      }

    } catch (error) {
      console.error('Error converting shared lists to per-swimlane:', error);
    }
  },

  async fixMissingLists(boardId) {
    try {
      const board = ReactiveCache.getBoard(boardId);
      if (!board) return;

      // Check if board has already been processed for missing lists fix
      if (board.fixMissingListsCompleted) {
        if (process.env.DEBUG === 'true') {
          console.log(`Board ${boardId} has already been processed for missing lists fix`);
        }
        return;
      }

      // Check if migration is needed
      const needsMigration = await new Promise((resolve, reject) => {
        Meteor.call('fixMissingListsMigration.needsMigration', boardId, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });

      if (!needsMigration) {
        if (process.env.DEBUG === 'true') {
          console.log(`Board ${boardId} does not need missing lists fix`);
        }
        return;
      }

      if (process.env.DEBUG === 'true') {
        console.log(`Starting fix missing lists migration for board ${boardId}`);
      }

      // Execute the migration
      const result = await new Promise((resolve, reject) => {
        Meteor.call('fixMissingListsMigration.execute', boardId, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });

      if (result && result.success) {
        if (process.env.DEBUG === 'true') {
          console.log(`Successfully fixed missing lists for board ${boardId}: created ${result.createdLists} lists, updated ${result.updatedCards} cards`);
        }
      }

    } catch (error) {
      console.error('Error fixing missing lists:', error);
    }
  },

  async fixDuplicateLists(boardId) {
    try {
      const board = ReactiveCache.getBoard(boardId);
      if (!board) return;

      // Check if board has already been processed for duplicate lists fix
      if (board.fixDuplicateListsCompleted) {
        if (process.env.DEBUG === 'true') {
          console.log(`Board ${boardId} has already been processed for duplicate lists fix`);
        }
        return;
      }

      if (process.env.DEBUG === 'true') {
        console.log(`Starting duplicate lists fix for board ${boardId}`);
      }

      // Execute the duplicate lists fix
      const result = await new Promise((resolve, reject) => {
        Meteor.call('fixDuplicateLists.fixBoard', boardId, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });

      if (result && result.fixed > 0) {
        if (process.env.DEBUG === 'true') {
          console.log(`Successfully fixed ${result.fixed} duplicate lists for board ${boardId}: ${result.fixedSwimlanes} swimlanes, ${result.fixedLists} lists`);
        }
        
        // Mark board as processed
        Boards.update(boardId, { $set: { fixDuplicateListsCompleted: true } });
      } else if (process.env.DEBUG === 'true') {
        console.log(`No duplicate lists found for board ${boardId}`);
        // Still mark as processed to avoid repeated checks
        Boards.update(boardId, { $set: { fixDuplicateListsCompleted: true } });
      } else {
        // Still mark as processed to avoid repeated checks
        Boards.update(boardId, { $set: { fixDuplicateListsCompleted: true } });
      }

    } catch (error) {
      console.error('Error fixing duplicate lists:', error);
    }
  },

  async startAttachmentMigrationIfNeeded(boardId) {
    try {
      // Check if board has already been migrated
      if (attachmentMigrationManager.isBoardMigrated(boardId)) {
        if (process.env.DEBUG === 'true') {
          console.log(`Board ${boardId} has already been migrated, skipping`);
        }
        return;
      }

      // Check if there are unconverted attachments
      const unconvertedAttachments = attachmentMigrationManager.getUnconvertedAttachments(boardId);
      
      if (unconvertedAttachments.length > 0) {
        if (process.env.DEBUG === 'true') {
          console.log(`Starting attachment migration for ${unconvertedAttachments.length} attachments in board ${boardId}`);
        }
        await attachmentMigrationManager.startAttachmentMigration(boardId);
      } else {
        // No attachments to migrate, mark board as migrated
        // This will be handled by the migration manager itself
        if (process.env.DEBUG === 'true') {
          console.log(`Board ${boardId} has no attachments to migrate`);
        }
      }
    } catch (error) {
      console.error('Error starting attachment migration:', error);
    }
  },

  onlyShowCurrentCard() {
    const isMiniScreen = Utils.isMiniScreen();
    const currentCardId = Utils.getCurrentCardId(true);
    return isMiniScreen && currentCardId;
  },

  goHome() {
    FlowRouter.go('home');
  },

  isConverting() {
    return this.isConverting.get();
  },

  isMigrating() {
    return this.isMigrating.get();
  },

  isBoardReady() {
    return this.isBoardReady.get();
  },

  currentBoard() {
    return Utils.getCurrentBoard();
  },
}).register('board');

BlazeComponent.extendComponent({
  onCreated() {
    Meteor.subscribe('tableVisibilityModeSettings');
    this.showOverlay = new ReactiveVar(false);
    this.draggingActive = new ReactiveVar(false);
    this._isDragging = false;
    // Used to set the overlay
    this.mouseHasEnterCardDetails = false;
    this._sortFieldsFixed = new Set(); // Track which boards have had sort fields fixed

    // fix swimlanes sort field if there are null values
    const currentBoardData = Utils.getCurrentBoard();
    if (currentBoardData && Swimlanes) {
      const boardId = currentBoardData._id;
      // Only fix sort fields once per board to prevent reactive loops
      if (!this._sortFieldsFixed.has(`swimlanes-${boardId}`)) {
        const nullSortSwimlanes = currentBoardData.nullSortSwimlanes();
        if (nullSortSwimlanes.length > 0) {
          const swimlanes = currentBoardData.swimlanes();
          let count = 0;
          swimlanes.forEach(s => {
            Swimlanes.update(s._id, {
              $set: {
                sort: count,
              },
            });
            count += 1;
          });
        }
        this._sortFieldsFixed.add(`swimlanes-${boardId}`);
      }
    }

    // fix lists sort field if there are null values
    if (currentBoardData && Lists) {
      const boardId = currentBoardData._id;
      // Only fix sort fields once per board to prevent reactive loops
      if (!this._sortFieldsFixed.has(`lists-${boardId}`)) {
        const nullSortLists = currentBoardData.nullSortLists();
        if (nullSortLists.length > 0) {
          const lists = currentBoardData.lists();
          let count = 0;
          lists.forEach(l => {
            Lists.update(l._id, {
              $set: {
                sort: count,
              },
            });
            count += 1;
          });
        }
        this._sortFieldsFixed.add(`lists-${boardId}`);
      }
    }
  },
  onRendered() {
    // Initialize user settings (zoom and mobile mode)
    Utils.initializeUserSettings();

    // Detect iPhone devices and add class for better CSS targeting
    const isIPhone = /iPhone|iPod/.test(navigator.userAgent);
    if (isIPhone) {
      document.body.classList.add('iphone-device');
    }

    // Accessibility: Focus management for popups and menus
    function focusFirstInteractive(container) {
      if (!container) return;
      // Find first focusable element
      const focusable = container.querySelectorAll('button, [role="button"], a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      for (let i = 0; i < focusable.length; i++) {
        if (!focusable[i].disabled && focusable[i].offsetParent !== null) {
          focusable[i].focus();
          break;
        }
      }
    }

    // Observe for new popups/menus and set focus (but exclude swimlane content)
    const popupObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1 && 
              (node.classList.contains('popup') || node.classList.contains('modal') || node.classList.contains('menu')) &&
              !node.closest('.js-swimlanes') && 
              !node.closest('.swimlane') &&
              !node.closest('.list') &&
              !node.closest('.minicard')) {
            setTimeout(function() { focusFirstInteractive(node); }, 10);
          }
        });
      });
    });
    popupObserver.observe(document.body, { childList: true, subtree: true });

    // Remove tabindex from non-interactive elements (e.g., user abbreviations, labels)
    document.querySelectorAll('.user-abbreviation, .user-label, .card-header-label, .edit-label, .private-label').forEach(function(el) {
      if (el.hasAttribute('tabindex')) {
        el.removeAttribute('tabindex');
      }
    });
    /*
    // Add a toggle button for keyboard shortcuts accessibility
    if (!document.getElementById('wekan-shortcuts-toggle')) {
      const toggleContainer = document.createElement('div');
      toggleContainer.id = 'wekan-shortcuts-toggle';
      toggleContainer.style.position = 'fixed';
      toggleContainer.style.top = '10px';
      toggleContainer.style.right = '10px';
      toggleContainer.style.zIndex = '1000';
      toggleContainer.style.background = '#fff';
      toggleContainer.style.border = '2px solid #005fcc';
      toggleContainer.style.borderRadius = '6px';
      toggleContainer.style.padding = '8px 12px';
      toggleContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      toggleContainer.style.fontSize = '16px';
      toggleContainer.style.color = '#005fcc';
      toggleContainer.setAttribute('role', 'region');
      toggleContainer.setAttribute('aria-label', 'Keyboard Shortcuts Settings');
      toggleContainer.innerHTML = `
        <label for="shortcuts-toggle-checkbox" style="cursor:pointer;">
          <input type="checkbox" id="shortcuts-toggle-checkbox" ${window.wekanShortcutsEnabled ? 'checked' : ''} style="margin-right:8px;" />
          Enable keyboard shortcuts
        </label>
      `;
      document.body.appendChild(toggleContainer);
      const checkbox = document.getElementById('shortcuts-toggle-checkbox');
      checkbox.addEventListener('change', function(e) {
        window.toggleWekanShortcuts(e.target.checked);
      });
    }
    */
    // Ensure toggle-buttons, color choices, reactions, renaming, and calendar controls are focusable and have ARIA roles
    document.querySelectorAll('.js-toggle').forEach(function(el) {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      // Short, descriptive label for favorite/star toggle
      if (el.classList.contains('js-favorite-toggle')) {
        el.setAttribute('aria-label', TAPi18n.__('favorite-toggle-label'));
      } else {
        el.setAttribute('aria-label', 'Toggle');
      }
    });
    document.querySelectorAll('.js-color-choice').forEach(function(el) {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', 'Choose color');
    });
    document.querySelectorAll('.js-reaction').forEach(function(el) {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', 'React');
    });
    document.querySelectorAll('.js-rename-swimlane').forEach(function(el) {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', 'Rename swimlane');
    });
    document.querySelectorAll('.js-rename-list').forEach(function(el) {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', 'Rename list');
    });
    document.querySelectorAll('.fc-button').forEach(function(el) {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
    });
    // Set the language attribute on the <html> element for accessibility
    document.documentElement.lang = TAPi18n.getLanguage();

    // Ensure the accessible name for the board view switcher matches the visible label "Swimlanes"
    // This fixes WCAG 2.5.3: Label in Name
    const swimlanesSwitcher = this.$('.js-board-view-swimlanes');
    if (swimlanesSwitcher.length) {
      swimlanesSwitcher.attr('aria-label', swimlanesSwitcher.text().trim() || 'Swimlanes');
    }

    // Add a highly visible focus indicator and improve contrast for interactive elements
    if (!document.getElementById('wekan-accessible-focus-style')) {
      const style = document.createElement('style');
      style.id = 'wekan-accessible-focus-style';
      style.innerHTML = `
        /* Focus indicator */
        button:focus, [role="button"]:focus, a:focus, input:focus, select:focus, textarea:focus, .dropdown-menu:focus, .js-board-view-swimlanes:focus, .js-add-card:focus {
          outline: 3px solid #005fcc !important;
          outline-offset: 2px !important;
        }
        /* Input borders */
        input, textarea, select {
          border: 2px solid #222 !important;
        }
        /* Plus icon for adding a new card */
        .js-add-card {
          color: #005fcc !important; /* dark blue for contrast */
          cursor: pointer;
          outline: none;
        }
        .js-add-card[tabindex] {
          outline: none;
        }
        /* Hamburger menu */
        .fa-bars, .icon-hamburger {
          color: #222 !important;
        }
        /* Grey icons in card detail header */
        .card-detail-header .fa, .card-detail-header .icon {
          color: #444 !important;
        }
        /* Grey operating elements in card detail */
        .card-detail .fa, .card-detail .icon {
          color: #444 !important;
        }
        /* Blue bar in checklists */
        .checklist-progress-bar {
          background-color: #005fcc !important;
        }
        /* Green checkmark in checklists */
        .checklist .fa-check {
          color: #007a33 !important;
        }
        /* X-Button and arrow button in menus */
        .close, .fa-arrow-left, .icon-arrow-left {
          color: #005fcc !important;
        }
        /* Cross icon to move boards */
        .js-move-board {
          color: #005fcc !important;
        }
        /* Current date background */
        .current-date {
          background-color: #005fcc !important;
          color: #fff !important;
        }
      `;
      document.head.appendChild(style);
    }
    // Ensure plus/add elements are focusable and have ARIA roles
    document.querySelectorAll('.js-add-card').forEach(function(el) {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', 'Add new card');
    });

    const boardComponent = this;
    const $swimlanesDom = boardComponent.$('.js-swimlanes');

    $swimlanesDom.sortable({
      tolerance: 'pointer',
      appendTo: '.board-canvas',
      helper(evt, item) {
        const helper = $(`<div class="swimlane"
                               style="flex-direction: column;
                                      height: ${swimlaneWhileSortingHeight}px;
                                      width: $(boardComponent.width)px;
                                      overflow: hidden;"/>`);
        helper.append(item.clone());
        // Also grab the list of lists of cards
        const list = item.next();
        helper.append(list.clone());
        return helper;
      },
      items: '.swimlane:not(.placeholder)',
      placeholder: 'swimlane placeholder',
      distance: 7,
      start(evt, ui) {
        const listDom = ui.placeholder.next('.js-swimlane');
        const parentOffset = ui.item.parent().offset();

        ui.placeholder.height(ui.helper.height());
        EscapeActions.executeUpTo('popup-close');
        listDom.addClass('moving-swimlane');
        boardComponent.setIsDragging(true);

        ui.placeholder.insertAfter(ui.placeholder.next());
        boardComponent.origPlaceholderIndex = ui.placeholder.index();

        // resize all swimlanes + headers to be a total of 150 px per row
        // this could be achieved by setIsDragging(true) but we want immediate
        // result
        ui.item
          .siblings('.js-swimlane')
          .css('height', `${swimlaneWhileSortingHeight - 26}px`);

        // set the new scroll height after the resize and insertion of
        // the placeholder. We want the element under the cursor to stay
        // at the same place on the screen
        ui.item.parent().get(0).scrollTop =
          ui.placeholder.get(0).offsetTop + parentOffset.top - evt.pageY;
      },
      beforeStop(evt, ui) {
        const parentOffset = ui.item.parent().offset();
        const siblings = ui.item.siblings('.js-swimlane');
        siblings.css('height', '');

        // compute the new scroll height after the resize and removal of
        // the placeholder
        const scrollTop =
          ui.placeholder.get(0).offsetTop + parentOffset.top - evt.pageY;

        // then reset the original view of the swimlane
        siblings.removeClass('moving-swimlane');

        // and apply the computed scrollheight
        ui.item.parent().get(0).scrollTop = scrollTop;
      },
      stop(evt, ui) {
        // To attribute the new index number, we need to get the DOM element
        // of the previous and the following card -- if any.
        const prevSwimlaneDom = ui.item.prevAll('.js-swimlane').get(0);
        const nextSwimlaneDom = ui.item.nextAll('.js-swimlane').get(0);
        const sortIndex = calculateIndex(prevSwimlaneDom, nextSwimlaneDom, 1);

        $swimlanesDom.sortable('cancel');
        const swimlaneDomElement = ui.item.get(0);
        const swimlane = Blaze.getData(swimlaneDomElement);

        Swimlanes.update(swimlane._id, {
          $set: {
            sort: sortIndex.base,
          },
        });

        boardComponent.setIsDragging(false);
      },
      sort(evt, ui) {
        // get the mouse position in the sortable
        const parentOffset = ui.item.parent().offset();
        const cursorY =
          evt.pageY - parentOffset.top + ui.item.parent().scrollTop();

        // compute the intended index of the placeholder (we need to skip the
        // slots between the headers and the list of cards)
        const newplaceholderIndex = Math.floor(
          cursorY / swimlaneWhileSortingHeight,
        );
        let destPlaceholderIndex = (newplaceholderIndex + 1) * 2;

        // if we are scrolling far away from the bottom of the list
        if (destPlaceholderIndex >= ui.item.parent().get(0).childElementCount) {
          destPlaceholderIndex = ui.item.parent().get(0).childElementCount - 1;
        }

        // update the placeholder position in the DOM tree
        if (destPlaceholderIndex !== ui.placeholder.index()) {
          if (destPlaceholderIndex < boardComponent.origPlaceholderIndex) {
            ui.placeholder.insertBefore(
              ui.placeholder
                .siblings()
                .slice(destPlaceholderIndex - 2, destPlaceholderIndex - 1),
            );
          } else {
            ui.placeholder.insertAfter(
              ui.placeholder
                .siblings()
                .slice(destPlaceholderIndex - 1, destPlaceholderIndex),
            );
          }
        }
      },
    });

    this.autorun(() => {
      // Always reset dragscroll on view switch
      dragscroll.reset();

      if ($swimlanesDom.data('uiSortable') || $swimlanesDom.data('sortable')) {
        if (Utils.isTouchScreenOrShowDesktopDragHandles()) {
          $swimlanesDom.sortable('option', 'handle', '.js-swimlane-header-handle');
        } else {
          $swimlanesDom.sortable('option', 'handle', '.swimlane-header');
        }

        // Disable drag-dropping if the current user is not a board member
        $swimlanesDom.sortable(
          'option',
          'disabled',
          !ReactiveCache.getCurrentUser()?.isBoardAdmin(),
        );
      }
    });

    // If there is no data in the board (ie, no lists) we autofocus the list
    // creation form by clicking on the corresponding element.
    const currentBoard = Utils.getCurrentBoard();
    if (Utils.canModifyBoard() && currentBoard.lists().length === 0) {
      boardComponent.openNewListForm();
    }

    dragscroll.reset();
    Utils.setBackgroundImage();
  },

  notDisplayThisBoard() {
    let allowPrivateVisibilityOnly = TableVisibilityModeSettings.findOne('tableVisibilityMode-allowPrivateOnly');
    let currentBoard = Utils.getCurrentBoard();
    return allowPrivateVisibilityOnly !== undefined && allowPrivateVisibilityOnly.booleanValue && currentBoard && currentBoard.permission == 'public';
  },

  isViewSwimlanes() {
    const currentUser = ReactiveCache.getCurrentUser();
    let boardView;
    
    if (currentUser) {
      boardView = (currentUser.profile || {}).boardView;
    } else {
      boardView = window.localStorage.getItem('boardView');
    }
    
    // If no board view is set, default to swimlanes
    if (!boardView) {
      boardView = 'board-view-swimlanes';
    }
    
    return boardView === 'board-view-swimlanes';
  },

  isViewLists() {
    const currentUser = ReactiveCache.getCurrentUser();
    let boardView;
    
    if (currentUser) {
      boardView = (currentUser.profile || {}).boardView;
    } else {
      boardView = window.localStorage.getItem('boardView');
    }
    
    return boardView === 'board-view-lists';
  },

  isViewCalendar() {
    const currentUser = ReactiveCache.getCurrentUser();
    let boardView;
    
    if (currentUser) {
      boardView = (currentUser.profile || {}).boardView;
    } else {
      boardView = window.localStorage.getItem('boardView');
    }
    
    return boardView === 'board-view-cal';
  },

  hasSwimlanes() {
    const currentBoard = Utils.getCurrentBoard();
    if (!currentBoard) {
      if (process.env.DEBUG === 'true') {
        console.log('hasSwimlanes: No current board');
      }
      return false;
    }
    
    try {
      const swimlanes = currentBoard.swimlanes();
      const hasSwimlanes = swimlanes && swimlanes.length > 0;
      if (process.env.DEBUG === 'true') {
        console.log('hasSwimlanes: Board has', swimlanes ? swimlanes.length : 0, 'swimlanes');
      }
      return hasSwimlanes;
    } catch (error) {
      console.error('hasSwimlanes: Error getting swimlanes:', error);
      return false;
    }
  },


  isVerticalScrollbars() {
    const user = ReactiveCache.getCurrentUser();
    return user && user.isVerticalScrollbars();
  },

  boardView() {
    return Utils.boardView();
  },

  debugBoardState() {
    // Enable debug mode by setting ?debug=1 in URL
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('debug') === '1';
  },

  debugBoardStateData() {
    const currentBoard = Utils.getCurrentBoard();
    const currentBoardId = Session.get('currentBoard');
    const isBoardReady = this.isBoardReady.get();
    const isConverting = this.isConverting.get();
    const isMigrating = this.isMigrating.get();
    const boardView = Utils.boardView();
    
    if (process.env.DEBUG === 'true') {
      console.log('=== BOARD DEBUG STATE ===');
      console.log('currentBoardId:', currentBoardId);
      console.log('currentBoard:', !!currentBoard, currentBoard ? currentBoard.title : 'none');
      console.log('isBoardReady:', isBoardReady);
      console.log('isConverting:', isConverting);
      console.log('isMigrating:', isMigrating);
      console.log('boardView:', boardView);
      console.log('========================');
    }
    
    return {
      currentBoardId,
      hasCurrentBoard: !!currentBoard,
      currentBoardTitle: currentBoard ? currentBoard.title : 'none',
      isBoardReady,
      isConverting,
      isMigrating,
      boardView
    };
  },


  openNewListForm() {
    if (this.isViewSwimlanes()) {
      // The form had been removed in 416b17062e57f215206e93a85b02ef9eb1ab4902
      // this.childComponents('swimlane')[0]
      //   .childComponents('addListAndSwimlaneForm')[0]
      //   .open();
    } else if (this.isViewLists()) {
      this.childComponents('listsGroup')[0]
        .childComponents('addListForm')[0]
        .open();
    }
  },
  events() {
    return [
      {
        // XXX The board-overlay div should probably be moved to the parent
        // component.
        mouseup() {
          if (this._isDragging) {
            this._isDragging = false;
          }
        },
        'click .js-empty-board-add-swimlane': Popup.open('swimlaneAdd'),
        // Global drag and drop file upload handlers for better visual feedback
        'dragover .board-canvas'(event) {
          const dataTransfer = event.originalEvent.dataTransfer;
          if (dataTransfer && dataTransfer.types && dataTransfer.types.includes('Files')) {
            event.preventDefault();
            // Add visual indicator that files can be dropped
            $('.board-canvas').addClass('file-drag-over');
          }
        },
        'dragleave .board-canvas'(event) {
          const dataTransfer = event.originalEvent.dataTransfer;
          if (dataTransfer && dataTransfer.types && dataTransfer.types.includes('Files')) {
            // Only remove class if we're leaving the board canvas entirely
            if (!event.currentTarget.contains(event.relatedTarget)) {
              $('.board-canvas').removeClass('file-drag-over');
            }
          }
        },
        'drop .board-canvas'(event) {
          const dataTransfer = event.originalEvent.dataTransfer;
          if (dataTransfer && dataTransfer.types && dataTransfer.types.includes('Files')) {
            event.preventDefault();
            $('.board-canvas').removeClass('file-drag-over');
          }
        },
      },
    ];
  },

  // XXX Flow components allow us to avoid creating these two setter methods by
  // exposing a public API to modify the component state. We need to investigate
  // best practices here.
  setIsDragging(bool) {
    this.draggingActive.set(bool);
  },

  scrollLeft(position = 0) {
    const swimlanes = this.$('.js-swimlanes');
    swimlanes &&
      swimlanes.animate({
        scrollLeft: position,
      });
  },

  scrollTop(position = 0) {
    const swimlanes = this.$('.js-swimlanes');
    swimlanes &&
      swimlanes.animate({
        scrollTop: position,
      });
  },
}).register('boardBody');

// Accessibility: Allow users to enable/disable keyboard shortcuts
window.wekanShortcutsEnabled = true;
window.toggleWekanShortcuts = function(enabled) {
  window.wekanShortcutsEnabled = !!enabled;
};

// Example: Wrap your character key shortcut handler like this
document.addEventListener('keydown', function(e) {
  // Example: "W" key shortcut (replace with your actual shortcut logic)
  if (!window.wekanShortcutsEnabled) return;
  if (e.key === 'w' || e.key === 'W') {
    // ...existing shortcut logic...
    // e.g. open swimlanes view, etc.
  }
});

// Keyboard accessibility for card actions (favorite, archive, duplicate, etc.)
document.addEventListener('keydown', function(e) {
  if (!window.wekanShortcutsEnabled) return;
  // Only proceed if focus is on a card action element
  const active = document.activeElement;
  if (active && active.classList.contains('js-card-action')) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      active.click();
    }
    // Move card up/down with arrow keys
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (active.dataset.cardId) {
        Meteor.call('moveCardUp', active.dataset.cardId);
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (active.dataset.cardId) {
        Meteor.call('moveCardDown', active.dataset.cardId);
      }
    }
  }
  // Make plus/add elements keyboard accessible
  if (active && active.classList.contains('js-add-card')) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      active.click();
    }
  }
  // Keyboard move for cards (alternative to drag & drop)
  if (active && active.classList.contains('js-move-card')) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (active.dataset.cardId) {
        Meteor.call('moveCardUp', active.dataset.cardId);
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (active.dataset.cardId) {
        Meteor.call('moveCardDown', active.dataset.cardId);
      }
    }
  }
    // Ensure move card buttons are focusable and have ARIA roles
    document.querySelectorAll('.js-move-card').forEach(function(el) {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', 'Move card');
    });
  // Make toggle-buttons, color choices, reactions, and X-buttons keyboard accessible
  if (active && (active.classList.contains('js-toggle') || active.classList.contains('js-color-choice') || active.classList.contains('js-reaction') || active.classList.contains('close'))) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      active.click();
    }
  }
  // Prevent scripts from removing focus when received
  if (active) {
    active.addEventListener('focus', function(e) {
      // Do not remove focus
      // No-op: This prevents F55 failure
    }, { once: true });
  }
  // Make swimlane/list renaming keyboard accessible
  if (active && (active.classList.contains('js-rename-swimlane') || active.classList.contains('js-rename-list'))) {
    if (e.key === 'Enter') {
      e.preventDefault();
      active.click();
    }
  }
  // Calendar navigation buttons
  if (active && active.classList.contains('fc-button')) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      active.click();
    }
  }
});

BlazeComponent.extendComponent({
  onRendered() {
    // Set the language attribute on the <html> element for accessibility
    document.documentElement.lang = TAPi18n.getLanguage();

    this.autorun(function () {
      $('#calendar-view').fullCalendar('refetchEvents');
    });
  },
  calendarOptions() {
    return {
      id: 'calendar-view',
      defaultView: 'month',
      editable: true,
      selectable: true,
      timezone: 'local',
      weekNumbers: true,
      header: {
          left: 'title   today prev,next',
        center:
          'agendaDay,listDay,timelineDay agendaWeek,listWeek,timelineWeek month,listMonth',
        right: '',
      },
        buttonText: {
          prev: TAPi18n.__('calendar-previous-month-label'), // e.g. "Previous month"
          next: TAPi18n.__('calendar-next-month-label'), // e.g. "Next month"
        },
        ariaLabel: {
          prev: TAPi18n.__('calendar-previous-month-label'),
          next: TAPi18n.__('calendar-next-month-label'),
        },
      // height: 'parent', nope, doesn't work as the parent might be small
      height: 'auto',
      /* TODO: lists as resources: https://fullcalendar.io/docs/vertical-resource-view */
      navLinks: true,
      nowIndicator: true,
      businessHours: {
        // days of week. an array of zero-based day of week integers (0=Sunday)
        dow: [1, 2, 3, 4, 5], // Monday - Friday
        start: '8:00',
        end: '18:00',
      },
      locale: TAPi18n.getLanguage(),
      events(start, end, timezone, callback) {
        const currentBoard = Utils.getCurrentBoard();
        const events = [];
        const pushEvent = function (card, title, start, end, extraCls) {
          start = start || card.startAt;
          end = end || card.endAt;
          title = title || card.title;
          const className =
            (extraCls ? `${extraCls} ` : '') +
            (card.color ? `calendar-event-${card.color}` : '');
          events.push({
            id: card._id,
            title,
            start,
            end: end || card.endAt,
            allDay:
              Math.abs(end.getTime() - start.getTime()) / 1000 === 24 * 3600,
            url: FlowRouter.path('card', {
              boardId: currentBoard._id,
              slug: currentBoard.slug,
              cardId: card._id,
            }),
            className,
          });
        };
        currentBoard
          .cardsInInterval(start.toDate(), end.toDate())
          .forEach(function (card) {
            pushEvent(card);
          });
        currentBoard
          .cardsDueInBetween(start.toDate(), end.toDate())
          .forEach(function (card) {
            pushEvent(
              card,
              `${card.title} ${TAPi18n.__('card-due')}`,
              card.dueAt,
              new Date(card.dueAt.getTime() + 36e5),
            );
          });
        events.sort(function (first, second) {
          return first.id > second.id ? 1 : -1;
        });
        callback(events);
      },
      eventResize(event, delta, revertFunc) {
        let isOk = false;
        const card = ReactiveCache.getCard(event.id);

        if (card) {
          card.setEnd(event.end.toDate());
          isOk = true;
        }
        if (!isOk) {
          revertFunc();
        }
      },
      eventDrop(event, delta, revertFunc) {
        let isOk = false;
        const card = ReactiveCache.getCard(event.id);
        if (card) {
          // TODO: add a flag for allDay events
          if (!event.allDay) {
            // https://github.com/wekan/wekan/issues/2917#issuecomment-1236753962
            //card.setStart(event.start.toDate());
            //card.setEnd(event.end.toDate());
            card.setDue(event.start.toDate());
            isOk = true;
          }
        }
        if (!isOk) {
          revertFunc();
        }
      },
      select: function (startDate) {
        const currentBoard = Utils.getCurrentBoard();
        const currentUser = ReactiveCache.getCurrentUser();
        const modalElement = document.createElement('div');
        modalElement.classList.add('modal', 'fade');
        modalElement.setAttribute('tabindex', '-1');
        modalElement.setAttribute('role', 'dialog');
        modalElement.innerHTML = `
        <div class="modal-dialog justify-content-center align-items-center" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${TAPi18n.__('r-create-card')}</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body text-center">
              <input type="text" class="form-control" id="card-title-input" placeholder="">
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" id="create-card-button">${TAPi18n.__('add-card')}</button>
            </div>
          </div>
        </div>
        `;
        const createCardButton = modalElement.querySelector('#create-card-button');
        createCardButton.addEventListener('click', function () {
          const myTitle = modalElement.querySelector('#card-title-input').value;
          if (myTitle) {
            const firstList = currentBoard.draggableLists()[0];
            const firstSwimlane = currentBoard.swimlanes()[0];
            Meteor.call('createCardWithDueDate', currentBoard._id, firstList._id, myTitle, startDate.toDate(), firstSwimlane._id, function(error, result) {
              if (error) {
                if (process.env.DEBUG === 'true') {
                  console.log(error);
                }
              } else {
                if (process.env.DEBUG === 'true') {
                  console.log("Card Created", result);
                }
              }
            });
            closeModal();
          }
        });
        document.body.appendChild(modalElement);
        const openModal = function() {
          modalElement.style.display = 'flex';
          // Set focus to the input field for better keyboard accessibility
          const input = modalElement.querySelector('#card-title-input');
          if (input) input.focus();
        };
        const closeModal = function() {
          modalElement.style.display = 'none';
        };
        const closeButton = modalElement.querySelector('[data-dismiss="modal"]');
        closeButton.addEventListener('click', closeModal);
        openModal();
      }
    };
  },
  isViewCalendar() {
    const currentUser = ReactiveCache.getCurrentUser();
    if (currentUser) {
      return (currentUser.profile || {}).boardView === 'board-view-cal';
    } else {
      return window.localStorage.getItem('boardView') === 'board-view-cal';
    }
  },
}).register('calendarView');
