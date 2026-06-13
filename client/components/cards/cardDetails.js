import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import {
  setupDatePicker,
  datePickerRendered,
  datePickerHelpers,
  datePickerEvents,
} from '/client/lib/datepicker';
import {
  formatDateTime,
  formatDate,
  formatTime,
  getISOWeek,
  isValidDate,
  isBefore,
  isAfter,
  isSame,
  add,
  subtract,
  startOf,
  endOf,
  format,
  parseDate,
  now,
  createDate,
  fromNow,
  calendar
} from '/imports/lib/dateUtils';
import Cards from '/models/cards';
import Boards from '/models/boards';
import Checklists from '/models/checklists';
import Integrations from '/models/integrations';
import Users from '/models/users';
import Lists from '/models/lists';
import CardComments from '/models/cardComments';
import { ALLOWED_COLORS } from '/config/const';
import { uniqBy } from '/imports/lib/collectionHelpers';
import { UserAvatar } from '../users/userAvatar';
import { Filter } from '/client/lib/filter';
import { BoardSwimlaneListCardDialog } from '/client/lib/dialogWithBoardSwimlaneListCard';
import { handleFileUpload } from './attachments';
import { InfiniteScrolling } from '/client/lib/infiniteScrolling';
import {
  getCurrentCardIdFromContext,
  getCurrentCardFromContext,
} from '/client/lib/currentCard';
import uploadProgressManager from '../../lib/uploadProgressManager';
import { CSSEvents } from '/client/lib/cssEvents';
import { UnsavedEdits } from '/client/lib/unsavedEdits';
import { EscapeActions } from '/client/lib/escapeActions';
import { MultiSelection } from '/client/lib/multiSelection';
import { Utils } from '/client/lib/utils';
import { ReactiveVar } from 'meteor/reactive-var';
import autosize from 'autosize';

// Id of the location currently being edited in the cardLocationsPopup; null
// when adding a new location.
const editingLocationId = new ReactiveVar(null);

// Parse coordinates (and, when present, a place name / address) out of a map
// link from common providers: Google Maps, OpenStreetMap, Bing Maps, Apple Maps
// and generic `?q=lat,lon` / `?ll=lat,lon` links. Returns whatever it can find
// as { latitude, longitude, name, address }.
function parseMapLink(url) {
  const result = {};
  if (!url) return result;
  const s = String(url).trim();

  let lat;
  let lon;
  const setCoords = (la, lo) => {
    if (lat !== undefined) return;
    const a = parseFloat(la);
    const o = parseFloat(lo);
    if (!isNaN(a) && !isNaN(o) && Math.abs(a) <= 90 && Math.abs(o) <= 180) {
      lat = a;
      lon = o;
    }
  };

  const N = '(-?\\d+(?:\\.\\d+)?)';
  let m;
  // Google Maps place marker in the data part: !3d<lat>!4d<lon> (most precise).
  if ((m = s.match(new RegExp(`!3d${N}!4d${N}`)))) setCoords(m[1], m[2]);
  // Google Maps view/place: @<lat>,<lon>
  if ((m = s.match(new RegExp(`@${N},${N}`)))) setCoords(m[1], m[2]);
  // OpenStreetMap marker: ?mlat=..&mlon=..
  if ((m = s.match(new RegExp(`[?&#]mlat=${N}`)))) {
    const mlon = s.match(new RegExp(`[?&#]mlon=${N}`));
    if (mlon) setCoords(m[1], mlon[1]);
  }
  // OpenStreetMap map hash: #map=z/lat/lon
  if ((m = s.match(new RegExp(`[#&]map=\\d+(?:\\.\\d+)?/${N}/${N}`)))) setCoords(m[1], m[2]);
  // Bing Maps: cp=lat~lon
  if ((m = s.match(new RegExp(`[?&]cp=${N}~${N}`)))) setCoords(m[1], m[2]);
  // Apple Maps and generic ll=lat,lon
  if ((m = s.match(new RegExp(`[?&]ll=${N},${N}`)))) setCoords(m[1], m[2]);
  // Generic q=lat,lon (Google/Apple query form)
  if ((m = s.match(new RegExp(`[?&]q=${N},${N}`)))) setCoords(m[1], m[2]);
  // Generic center=lat,lon
  if ((m = s.match(new RegExp(`[?&]center=${N},${N}`)))) setCoords(m[1], m[2]);

  if (lat !== undefined) {
    result.latitude = lat;
    result.longitude = lon;
  }

  const decode = (raw) => {
    try {
      return decodeURIComponent(raw.replace(/\+/g, ' ')).trim();
    } catch (e) {
      return raw.replace(/\+/g, ' ').trim();
    }
  };
  const isCoordText = (t) => /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(t);

  // Place name from Google Maps /place/<Name>/
  if ((m = s.match(/\/place\/([^/@?]+)/))) {
    const name = decode(m[1]);
    if (name && !isCoordText(name)) result.name = name;
  }
  // Address from a textual q=/query=/destination= parameter.
  if ((m = s.match(/[?&](?:q|query|destination)=([^&]+)/))) {
    const q = decode(m[1]);
    if (q && !isCoordText(q)) result.address = q;
  }

  return result;
}

// Build an "open in map" link for the given provider and coordinates. Mirrors
// the providers offered in the location popup's "Open map links at" selector.
function mapLinkFor(provider, lat, lon) {
  switch (provider) {
    case 'google':
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    case 'bing':
      return `https://www.bing.com/maps?cp=${lat}~${lon}&lvl=16`;
    case 'apple':
      return `https://maps.apple.com/?ll=${lat},${lon}`;
    case 'openstreetmap':
    default:
      return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
  }
}

// SubsManager removed for Meteor 3 migration
const { calculateIndexData } = Utils;

function getCardId() {
  return getCurrentCardIdFromContext();
}

function getBoardBodyInstance() {
  const boardBodyEl = document.querySelector('.board-body');
  if (boardBodyEl) {
    const view = Blaze.getView(boardBodyEl);
    if (view && view.templateInstance) return view.templateInstance();
  }
  return null;
}

function getCardDetailsElement(cardId) {
  if (!cardId) {
    return null;
  }

  const cardDetailsElements = document.querySelectorAll('.js-card-details');
  for (const element of cardDetailsElements) {
    if (Blaze.getData(element)?._id === cardId) {
      return element;
    }
  }

  return null;
}

Template.cardDetails.onCreated(function () {
  this.currentBoard = Utils.getCurrentBoard();
  this.isLoaded = new ReactiveVar(false);
  this.infiniteScrolling = new InfiniteScrolling();

  const boardBody = getBoardBodyInstance();
  if (boardBody !== null) {
    // Only show overlay in mobile mode, not in desktop mode
    const isMobile = Utils.getMobileMode();
    if (isMobile) {
      boardBody.showOverlay.set(true);
    }
    boardBody.mouseHasEnterCardDetails = false;
  }

  this.calculateNextPeak = () => {
    const cardElement = this.find('.js-card-details');
    if (cardElement) {
      const altitude = cardElement.scrollHeight;
      this.infiniteScrolling.setNextPeak(altitude);
    }
  };

  this.reachNextPeak = () => {
    const activitiesEl = this.find('.activities');
    if (activitiesEl) {
      const view = Blaze.getView(activitiesEl);
      if (view && view.templateInstance) {
        const activitiesTpl = view.templateInstance();
        if (activitiesTpl && activitiesTpl.loadNextPage) {
          activitiesTpl.loadNextPage();
        }
      }
    }
  };

  Meteor.subscribe('unsaved-edits');

  // Surface legacy CollectionFS attachments for the current board so they show
  // up in the card's attachment gallery and can be read in place (without
  // migrating them to Meteor-Files first).
  this.autorun(() => {
    const board = Utils.getCurrentBoard();
    if (board && board._id) {
      Meteor.subscribe('legacyBoardAttachments', board._id);
    }
  });
});

Template.cardDetails.onRendered(function () {
  // A reactive re-render (e.g. a card moving between the inline swimlane render
  // and the draggable openCards popup) can create and then remove this instance
  // within the same flush. If our DOM range is already gone, calling this.$()
  // below throws "Can't select in removed DomRange", so bail out early.
  if (this.view && this.view.isDestroyed) return;
  this.calculateNextPeak();
  if (Meteor.settings.public.CARD_OPENED_WEBHOOK_ENABLED) {
    // Send Webhook but not create Activities records ---
    const card = Template.currentData();
    const userId = Meteor.userId();
    const params = {
      userId,
      cardId: card._id,
      boardId: card.boardId,
      listId: card.listId,
      user: ReactiveCache.getCurrentUser().username,
      url: '',
    };

    const integrations = ReactiveCache.getIntegrations({
      boardId: { $in: [card.boardId, Integrations.Const.GLOBAL_WEBHOOK_ID] },
      enabled: true,
      activities: { $in: ['CardDetailsRendered', 'all'] },
    });

    if (integrations.length > 0) {
      integrations.forEach((integration) => {
        Meteor.call(
          'outgoingWebhooks',
          integration,
          'CardSelected',
          params,
          () => { },
        );
      });
    }
    //-------------
  }

  const $checklistsDom = this.$('.card-checklist-items');

  $checklistsDom.sortable({
    tolerance: 'pointer',
    helper: 'clone',
    handle: '.checklist-title',
    items: '.js-checklist',
    placeholder: 'checklist placeholder',
    distance: 7,
    start(evt, ui) {
      ui.placeholder.height(ui.helper.height());
      EscapeActions.clickExecute(evt.target, 'inlinedForm');
    },
    stop(evt, ui) {
      let prevChecklist = ui.item.prev('.js-checklist').get(0);
      if (prevChecklist) {
        prevChecklist = Blaze.getData(prevChecklist).checklist;
      }
      let nextChecklist = ui.item.next('.js-checklist').get(0);
      if (nextChecklist) {
        nextChecklist = Blaze.getData(nextChecklist).checklist;
      }
      const sortIndex = calculateIndexData(prevChecklist, nextChecklist, 1);

      $checklistsDom.sortable('cancel');
      const checklist = Blaze.getData(ui.item.get(0)).checklist;

      Checklists.update(checklist._id, {
        $set: {
          sort: sortIndex.base,
        },
      });
    },
  });

  const $subtasksDom = this.$('.card-subtasks-items');

  $subtasksDom.sortable({
    tolerance: 'pointer',
    helper: 'clone',
    handle: '.subtask-title',
    items: '.js-subtasks',
    placeholder: 'subtasks placeholder',
    distance: 7,
    start(evt, ui) {
      ui.placeholder.height(ui.helper.height());
      EscapeActions.executeUpTo('popup-close');
    },
    stop(evt, ui) {
      let prevSubtask = ui.item.prev('.js-subtasks').get(0);
      if (prevSubtask) {
        prevSubtask = Blaze.getData(prevSubtask).subtask;
      }
      let nextSubtask = ui.item.next('.js-subtasks').get(0);
      if (nextSubtask) {
        nextSubtask = Blaze.getData(nextSubtask).subtask;
      }
      const sortIndex = calculateIndexData(prevSubtask, nextSubtask, 1);

      $subtasksDom.sortable('cancel');
      const subtask = Blaze.getData(ui.item.get(0)).subtask;

      Cards.updateAsync(subtask._id, {
        $set: {
          sort: sortIndex.base,
        },
      });
    },
  });

  function userIsMember() {
    return ReactiveCache.getCurrentUser()?.isBoardMember();
  }

  // Disable sorting if the current user is not a board member
  this.autorun(() => {
    const disabled = !userIsMember();
    if (
      $checklistsDom.data('uiSortable') ||
      $checklistsDom.data('sortable')
    ) {
      $checklistsDom.sortable('option', 'disabled', disabled);
      if (Utils.isTouchScreenOrShowDesktopDragHandles()) {
        $checklistsDom.sortable({ handle: '.checklist-handle' });
      }
    }
    if ($subtasksDom.data('uiSortable') || $subtasksDom.data('sortable')) {
      $subtasksDom.sortable('option', 'disabled', disabled);
    }
  });
});

Template.cardDetails.onDestroyed(function () {
  const boardBody = getBoardBodyInstance();
  if (boardBody === null) return;
  boardBody.showOverlay.set(false);
});

Template.cardDetails.helpers({
  isWatching() {
    const card = Template.currentData();
    if (!card || typeof card.findWatcher !== 'function') return false;
    return card.findWatcher(Meteor.userId());
  },

  // Returns the card's locations (multiple supported), each enriched with the
  // coordinate flag and OpenStreetMap link used by the template.
  getLocations() {
    const card = Template.currentData();
    if (!card || !card.getLocations) return [];
    const user = ReactiveCache.getCurrentUser();
    const provider = user ? user.getMapProvider() : 'openstreetmap';
    return card.getLocations().map(loc => {
      const hasCoordinates =
        typeof loc.latitude === 'number' && typeof loc.longitude === 'number';
      const mapUrl = hasCoordinates
        ? mapLinkFor(provider, loc.latitude, loc.longitude)
        : '';
      return { ...loc, hasCoordinates, mapUrl };
    });
  },

  customFieldsGrid() {
    return ReactiveCache.getCurrentUser().hasCustomFieldsGrid();
  },

  cardMaximized() {
    const currentUser = ReactiveCache.getCurrentUser();
    const maximized = currentUser
      ? currentUser.hasCardMaximized()
      : window.localStorage.getItem('cardMaximized') === 'true';
    return !Utils.getPopupCardId() && maximized;
  },

  showActivities() {
    const card = Template.currentData();
    return card && card.showActivities;
  },

  cardCollapsed() {
    const user = ReactiveCache.getCurrentUser();
    if (user && user.profile) {
      return !!user.profile.cardCollapsed;
    }
    if (Users.getPublicCardCollapsed) {
      const stored = Users.getPublicCardCollapsed();
      if (typeof stored === 'boolean') return stored;
    }
    return false;
  },

  presentParentTask() {
    const tpl = Template.instance();
    let result = tpl.currentBoard.presentParentTask;
    if (result === null || result === undefined) {
      result = 'no-parent';
    }
    return result;
  },

  linkForCard() {
    const card = Template.currentData();
    let result = '#';
    if (card) {
      const board = ReactiveCache.getBoard(card.boardId);
      if (board) {
        result = FlowRouter.path('card', {
          boardId: card.boardId,
          slug: board.slug,
          cardId: card._id,
        });
      }
    }
    return result;
  },

  showVotingButtons() {
    const card = Template.currentData();
    return (
      (currentUser.isBoardMember() ||
        (currentUser && card.voteAllowNonBoardMembers())) &&
      !card.expiredVote()
    );
  },

  showPlanningPokerButtons() {
    const card = Template.currentData();
    return (
      (currentUser.isBoardMember() ||
        (currentUser && card.pokerAllowNonBoardMembers())) &&
      !card.expiredPoker()
    );
  },

  isVerticalScrollbars() {
    const user = ReactiveCache.getCurrentUser();
    return user && user.isVerticalScrollbars();
  },

  currentSwimlaneListsSorted() {
    const card = Template.currentData();
    if (!card || !card.boardId) return [];
    const board = ReactiveCache.getBoard(card.boardId);
    if (!board) return [];
    const swimlaneId = card.swimlaneId;
    const selector = { boardId: card.boardId, archived: false };
    if (swimlaneId) {
      const defaultSwimlane = board.getDefaultSwimline && board.getDefaultSwimline();
      if (defaultSwimlane && defaultSwimlane._id === swimlaneId) {
        selector.swimlaneId = { $in: [swimlaneId, null, ''] };
      } else {
        selector.swimlaneId = swimlaneId;
      }
    }
    return ReactiveCache.getLists(selector, { sort: { sort: 1 } });
  },

  isCurrentListId(listId) {
    let data = Template.currentData();
    if (!data || typeof data.listId === 'undefined') {
      data = Template.parentData(1);
    }
    if (!data || typeof data.listId === 'undefined') return false;
    return data.listId == listId;
  },

  isLoaded() {
    return Template.instance().isLoaded;
  },
});

Template.cardDetails.events({
  [`${CSSEvents.transitionend} .js-card-details`](event, tpl) {
    tpl.isLoaded.set(true);
  },
  [`${CSSEvents.animationend} .js-card-details`](event, tpl) {
    tpl.isLoaded.set(true);
  },
  'scroll .js-card-details'(event, tpl) {
    tpl.infiniteScrolling.checkScrollPosition(event.currentTarget, () => {
      tpl.reachNextPeak();
    });
  },
  'click .js-card-collapse-toggle'(event, tpl) {
    const user = ReactiveCache.getCurrentUser();
    const currentState = user && user.profile ? !!user.profile.cardCollapsed : !!Users.getPublicCardCollapsed();
    if (user) {
      Meteor.call('setCardCollapsed', !currentState);
    } else if (Users.setPublicCardCollapsed) {
      Users.setPublicCardCollapsed(!currentState);
    }
  },
  'mousedown .js-card-drag-handle'(event) {
    event.preventDefault();
    const $card = $(event.target).closest('.card-details');
    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = $card.offset().left;
    const startTop = $card.offset().top;

    const onMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      $card.css({
        left: startLeft + deltaX + 'px',
        top: startTop + deltaY + 'px'
      });
    };

    const onMouseUp = () => {
      $(document).off('mousemove', onMouseMove);
      $(document).off('mouseup', onMouseUp);
    };

    $(document).on('mousemove', onMouseMove);
    $(document).on('mouseup', onMouseUp);
  },
  'mousedown .js-card-title-drag-handle'(event) {
    // Allow dragging from title for ReadOnly users
    // Don't interfere with text selection
    if (event.target.tagName === 'A' || $(event.target).closest('a').length > 0) {
      return; // Don't drag if clicking on links
    }

    event.preventDefault();
    const $card = $(event.target).closest('.card-details');
    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = $card.offset().left;
    const startTop = $card.offset().top;

    const onMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      $card.css({
        left: startLeft + deltaX + 'px',
        top: startTop + deltaY + 'px'
      });
    };

    const onMouseUp = () => {
      $(document).off('mousemove', onMouseMove);
      $(document).off('mouseup', onMouseUp);
    };

    $(document).on('mousemove', onMouseMove);
    $(document).on('mouseup', onMouseUp);
  },
  'click .js-close-card-details'(event) {
    event.preventDefault();
    event.stopPropagation();

    // Resolve card context defensively because cardDetails can be rendered
    // from several parents (board, popup, gantt, etc.).
    const card = getCurrentCardFromContext({ ignorePopupCard: true }) || Template.currentData();
    const cardId = card?._id;
    const boardId = card?.boardId || Session.get('currentBoard') || Utils.getCurrentBoardId();

    // Desktop-sized layout uses the openCards session list.
    if (!Utils.isMiniScreen()) {
      if (cardId) {
        const openCards = Session.get('openCards') || [];
        const nextOpenCards = openCards.filter((id) => id !== cardId);
        Session.set('openCards', nextOpenCards);

        if (Session.get('currentCard') === cardId) {
          Session.set('currentCard', null);
        }

        const route = FlowRouter.current();
        const routeCardId = route?.params?.cardId;
        if (routeCardId === cardId && boardId) {
          Utils.goBoardId(boardId);
          return;
        }
      }
      return;
    }

    // Mini-screen/card-route flow: clear active card state and go back to board.
    Session.set('currentCard', null);
    Session.delete('popupCardId');
    Session.delete('popupCardBoardId');

    if (boardId) {
      Utils.goBoardId(boardId);
    }
  },
  'click .js-copy-link'(event, tpl) {
    event.preventDefault();
    const card = Template.currentData();
    const url = card.absoluteUrl();
    const promise = Utils.copyTextToClipboard(url);

    const $tooltip = tpl.$('.card-details-header .copied-tooltip');
    Utils.showCopied(promise, $tooltip);
  },
  'change .js-date-format-selector'(event) {
    const dateFormat = event.target.value;
    if (Meteor.userId()) {
      Meteor.call('changeDateFormat', dateFormat);
    } else {
      window.localStorage.setItem('dateFormat', dateFormat);
    }
  },
  'click .js-open-card-details-menu': Popup.open('cardDetailsActions'),
  // Mobile: switch to desktop popup view (maximize)
  'click .js-mobile-switch-to-desktop'(event) {
    event.preventDefault();
    // Switch global mode to desktop so the card appears as desktop popup
    Utils.setMobileMode(false);
  },
  'click .js-card-zoom-in'(event) {
    event.preventDefault();
    const current = Utils.getCardZoom();
    const newZoom = Math.min(3.0, current + 0.1);
    Utils.setCardZoom(newZoom);
  },
  'click .js-card-zoom-out'(event) {
    event.preventDefault();
    const current = Utils.getCardZoom();
    const newZoom = Math.max(0.5, current - 0.1);
    Utils.setCardZoom(newZoom);
  },
  'click .js-card-mobile-desktop-toggle'(event) {
    event.preventDefault();
    const currentMode = Utils.getMobileMode();
    Utils.setMobileMode(!currentMode);
  },
  async 'submit .js-card-description'(event, tpl) {
    event.preventDefault();
    const description = tpl.find('.js-new-description-input').value;
    const card = Template.currentData();
    await card.setDescription(description);
  },
  async 'submit .js-card-details-title'(event, tpl) {
    event.preventDefault();
    const titleInput = tpl.find('.js-edit-card-title');
    const title = titleInput ? titleInput.value.trim() : '';
    const card = Template.currentData();
    if (title) {
      await card.setTitle(title);
    } else {
      await card.setTitle('');
    }
  },
  'submit .js-card-details-assigner'(event, tpl) {
    event.preventDefault();
    const assignerInput = tpl.find('.js-edit-card-assigner');
    const assigner = assignerInput ? assignerInput.value.trim() : '';
    const card = Template.currentData();
    if (assigner) {
      card.setAssignedBy(assigner);
    } else {
      card.setAssignedBy('');
    }
  },
  'submit .js-card-details-requester'(event, tpl) {
    event.preventDefault();
    const requesterInput = tpl.find('.js-edit-card-requester');
    const requester = requesterInput ? requesterInput.value.trim() : '';
    const card = Template.currentData();
    if (requester) {
      card.setRequestedBy(requester);
    } else {
      card.setRequestedBy('');
    }
  },
  'keydown input.js-edit-card-sort'(evt, tpl) {
    // enter = save
    if (evt.keyCode === 13) {
      tpl.find('button[type=submit]').click();
    }
  },
  async 'submit .js-card-details-sort'(event, tpl) {
    event.preventDefault();
    const sortInput = tpl.find('.js-edit-card-sort');
    const sort = parseFloat(sortInput ? sortInput.value.trim() : '');
    if (!Number.isNaN(sort)) {
      let card = Template.currentData();
      await card.move(card.boardId, card.swimlaneId, card.listId, sort);
    }
  },
  async 'change .js-select-card-details-lists'(event, tpl) {
    const listId = event.target.value;
    let card = Template.currentData();

    const minOrder = await card.getMinSort(listId, card.swimlaneId);
    await card.move(card.boardId, card.swimlaneId, listId, minOrder - 1);
  },
  'click .js-go-to-linked-card'() {
    const card = Template.currentData();
    Utils.goCardId(card.linkedId);
  },
  'click .js-member': Popup.open('cardMember'),
  'click .js-add-members': Popup.open('cardMembers'),
  'click .js-assignee': Popup.open('cardAssignee'),
  'click .js-add-assignees': Popup.open('cardAssignees'),
  'click .js-add-labels': Popup.open('cardLabels'),
  'click .js-add-stickers': Popup.open('cardStickers'),
  'click .js-remove-sticker'(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!Utils.canModifyCard()) return;
    const index = parseInt(event.currentTarget.dataset.index, 10);
    const card = Template.currentData();
    if (card && !Number.isNaN(index)) {
      card.removeStickerAt(index);
    }
  },
  'click .js-add-location'(event) {
    event.preventDefault();
    if (!Utils.canModifyCard()) return;
    const card = Template.currentData();
    editingLocationId.set(null);
    Popup.open('cardLocations')(event, {
      dataContextIfCurrentDataIsUndefined: card,
    });
  },
  'click .js-edit-location'(event) {
    // Let the "Open in map" link work without also opening the edit popup.
    if ($(event.target).closest('a.card-location-map').length) return;
    event.preventDefault();
    if (!Utils.canModifyCard()) return;
    const card = Template.currentData();
    editingLocationId.set(event.currentTarget.dataset.locationId || null);
    Popup.open('cardLocations')(event, {
      dataContextIfCurrentDataIsUndefined: card,
    });
  },
  'click .js-remove-location'(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!Utils.canModifyCard()) return;
    const locationId = event.currentTarget.dataset.locationId;
    const card = Template.currentData();
    if (card && locationId) {
      card.removeLocation(locationId);
    }
  },
  'click .js-received-date': Popup.open('editCardReceivedDate'),
  'click .js-start-date': Popup.open('editCardStartDate'),
  'click .js-due-date': Popup.open('editCardDueDate'),
  'click .js-toggle-due-complete'(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!Utils.canModifyCard()) return;
    const card = Template.currentData();
    card.setDueComplete(!card.getDueComplete());
  },
  'click .js-end-date': Popup.open('editCardEndDate'),
  'click .js-show-positive-votes': Popup.open('positiveVoteMembers'),
  'click .js-show-negative-votes': Popup.open('negativeVoteMembers'),
  'click .js-custom-fields': Popup.open('cardCustomFields'),
  'mouseenter .js-card-details'(event, tpl) {
    const boardBody = getBoardBodyInstance(tpl);
    if (boardBody === null) return;
    boardBody.showOverlay.set(true);
    boardBody.mouseHasEnterCardDetails = true;
  },
  'mousedown .js-card-details'() {
    Session.set('cardDetailsIsDragging', false);
    Session.set('cardDetailsIsMouseDown', true);
  },
  'mousemove .js-card-details'() {
    if (Session.get('cardDetailsIsMouseDown')) {
      Session.set('cardDetailsIsDragging', true);
    }
  },
  'mouseup .js-card-details'() {
    Session.set('cardDetailsIsDragging', false);
    Session.set('cardDetailsIsMouseDown', false);
  },
  async 'click #toggleHideCheckedChecklistItems'() {
    const card = Template.currentData();
    await card.toggleHideCheckedChecklistItems();
  },
  async 'change #toggleShowActivitiesCard'() {
    const card = Template.currentData();
    await card.toggleShowActivities();
  },
  'click #toggleCustomFieldsGridButton'() {
    Meteor.call('toggleCustomFieldsGrid');
  },
  'click .js-maximize-card-details'() {
    if (Meteor.userId()) {
      Meteor.call('toggleCardMaximized');
    } else {
      window.localStorage.setItem('cardMaximized', 'true');
    }
    autosize($('.card-details'));
  },
  'click .js-minimize-card-details'() {
    if (Meteor.userId()) {
      Meteor.call('toggleCardMaximized');
    } else {
      window.localStorage.setItem('cardMaximized', 'false');
    }
    autosize($('.card-details'));
  },
  'click .js-vote'(e) {
    const card = Template.currentData();
    const forIt = $(e.target).hasClass('js-vote-positive');
    let newState = null;
    if (
      card.voteState() === null ||
      (card.voteState() === false && forIt) ||
      (card.voteState() === true && !forIt)
    ) {
      newState = forIt;
    }
    // Use secure server method; direct client updates to vote are blocked
    Meteor.call('cards.vote', card._id, newState);
  },
  'click .js-poker'(e) {
    const card = Template.currentData();
    let newState = null;
    if ($(e.target).hasClass('js-poker-vote-one')) {
      newState = 'one';
      Meteor.call('cards.pokerVote', card._id, newState);
    }
    if ($(e.target).hasClass('js-poker-vote-two')) {
      newState = 'two';
      Meteor.call('cards.pokerVote', card._id, newState);
    }
    if ($(e.target).hasClass('js-poker-vote-three')) {
      newState = 'three';
      Meteor.call('cards.pokerVote', card._id, newState);
    }
    if ($(e.target).hasClass('js-poker-vote-five')) {
      newState = 'five';
      Meteor.call('cards.pokerVote', card._id, newState);
    }
    if ($(e.target).hasClass('js-poker-vote-eight')) {
      newState = 'eight';
      Meteor.call('cards.pokerVote', card._id, newState);
    }
    if ($(e.target).hasClass('js-poker-vote-thirteen')) {
      newState = 'thirteen';
      Meteor.call('cards.pokerVote', card._id, newState);
    }
    if ($(e.target).hasClass('js-poker-vote-twenty')) {
      newState = 'twenty';
      Meteor.call('cards.pokerVote', card._id, newState);
    }
    if ($(e.target).hasClass('js-poker-vote-forty')) {
      newState = 'forty';
      Meteor.call('cards.pokerVote', card._id, newState);
    }
    if ($(e.target).hasClass('js-poker-vote-one-hundred')) {
      newState = 'oneHundred';
      Meteor.call('cards.pokerVote', card._id, newState);
    }
    if ($(e.target).hasClass('js-poker-vote-unsure')) {
      newState = 'unsure';
      Meteor.call('cards.pokerVote', card._id, newState);
    }
  },
  'click .js-poker-finish'(e) {
    if ($(e.target).hasClass('js-poker-finish')) {
      e.preventDefault();
      const card = Template.currentData();
      const now = new Date();
      Meteor.call('cards.setPokerEnd', card._id, now);
    }
  },
  'click .js-poker-replay'(e) {
    if ($(e.target).hasClass('js-poker-replay')) {
      e.preventDefault();
      const currentCard = Template.currentData();
      Meteor.call('cards.replayPoker', currentCard._id);
      Meteor.call('cards.unsetPokerEnd', currentCard._id);
      Meteor.call('cards.unsetPokerEstimation', currentCard._id);
    }
  },
  'click .js-poker-estimation'(event, tpl) {
    event.preventDefault();
    const card = Template.currentData();
    const ruleTitle = tpl.find('#pokerEstimation').value;
    if (ruleTitle !== undefined && ruleTitle !== '') {
      tpl.find('#pokerEstimation').value = '';

      if (ruleTitle) {
        Meteor.call('cards.setPokerEstimation', card._id, parseInt(ruleTitle, 10));
      } else {
        Meteor.call('cards.unsetPokerEstimation', card._id);
      }
    }
  },
  // Drag and drop file upload handlers
  'dragover .js-card-details'(event) {
    // Only prevent default for file drags to avoid interfering with other drag operations
    const dataTransfer = event.originalEvent.dataTransfer;
    if (dataTransfer && dataTransfer.types && dataTransfer.types.includes('Files')) {
      event.preventDefault();
      event.stopPropagation();
    }
  },
  'dragenter .js-card-details'(event) {
    const dataTransfer = event.originalEvent.dataTransfer;
    if (dataTransfer && dataTransfer.types && dataTransfer.types.includes('Files')) {
      event.preventDefault();
      event.stopPropagation();
      const card = Template.currentData();
      const board = card.board();
      // Only allow drag-and-drop if user can modify card and board allows attachments
      if (Utils.canModifyCard() && board && board.allowsAttachments) {
        $(event.currentTarget).addClass('is-dragging-over');
      }
    }
  },
  'dragleave .js-card-details'(event) {
    const dataTransfer = event.originalEvent.dataTransfer;
    if (dataTransfer && dataTransfer.types && dataTransfer.types.includes('Files')) {
      event.preventDefault();
      event.stopPropagation();
      $(event.currentTarget).removeClass('is-dragging-over');
    }
  },
  'drop .js-card-details'(event) {
    const dataTransfer = event.originalEvent.dataTransfer;
    if (dataTransfer && dataTransfer.types && dataTransfer.types.includes('Files')) {
      event.preventDefault();
      event.stopPropagation();
      $(event.currentTarget).removeClass('is-dragging-over');

      const card = Template.currentData();
      const board = card.board();

      // Check permissions
      if (!Utils.canModifyCard() || !board || !board.allowsAttachments) {
        return;
      }

      // Check if this is a file drop (not a checklist item reorder)
      if (!dataTransfer.files || dataTransfer.files.length === 0) {
        return;
      }

      const files = dataTransfer.files;
      if (files && files.length > 0) {
        handleFileUpload(card, files);
      }
    }
  },
});

Template.cardDetails.helpers({
  isPopup() {
    let ret = !!Utils.getPopupCardId();
    return ret;
  },
  isDateFormat(format) {
    const currentUser = ReactiveCache.getCurrentUser();
    if (!currentUser) {
      const stored = window.localStorage.getItem('dateFormat') || 'YYYY-MM-DD';
      return format === stored;
    }
    return currentUser.getDateFormat() === format;
  },
  // Upload progress helpers
  hasActiveUploads() {
    return uploadProgressManager.hasActiveUploads(this._id);
  },
  uploads() {
    return uploadProgressManager.getUploadsForCard(this._id);
  },
  uploadCount() {
    return uploadProgressManager.getUploadCountForCard(this._id);
  }
});
Template.cardDetailsPopup.onDestroyed(() => {
  Session.delete('popupCardId');
  Session.delete('popupCardBoardId');
});
Template.cardDetailsPopup.helpers({
  popupCard() {
    const ret = Utils.getPopupCard();
    return ret;
  },
});

// Ordered list of Excel export field keys and their i18n label keys.
// Must match ALL_FIELDS in models/server/ExporterExcelCard.js.
const EXCEL_EXPORT_FIELDS = [
  { field: 'labels',      label: 'labels' },
  { field: 'people',      label: 'export-card-field-people' },
  { field: 'board-info',  label: 'export-card-field-board-info' },
  { field: 'dates',       label: 'export-card-field-dates' },
  { field: 'description', label: 'description' },
  { field: 'checklists',  label: 'checklists' },
  { field: 'subtasks',    label: 'export-card-subtasks' },
  { field: 'comments',    label: 'comments' },
  { field: 'attachments', label: 'export-card-attachments' },
];

Template.exportCardPopup.onCreated(function () {
  // Track which Excel sections the user wants to include (all on by default)
  const initial = {};
  EXCEL_EXPORT_FIELDS.forEach(({ field }) => { initial[field] = true; });
  this.excelFields = new ReactiveDict(initial);
});

Template.exportCardPopup.helpers({
  exportUrlCardPDF() {
    const card = getCurrentCardFromContext({ ignorePopupCard: true }) || this;
    const params = {
      boardId: card.boardId || Session.get('currentBoard'),
      listId: card.listId,
      cardId: card._id || card.cardId,
    };
    return FlowRouter.path(
      '/api/boards/:boardId/lists/:listId/cards/:cardId/exportPDF',
      params,
      { authToken: Accounts._storedLoginToken() },
    );
  },
  exportFilenameCardPDF() {
    const card = getCurrentCardFromContext({ ignorePopupCard: true }) || this;
    return `${String(card.title || 'export-card')
      .replace(/[^a-z0-9._-]+/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'export-card'}.pdf`;
  },
  // Returns the field list with current checked state — reactive
  excelExportFields() {
    const instance = Template.instance();
    return EXCEL_EXPORT_FIELDS.map(f => ({
      field:   f.field,
      label:   f.label,
      checked: instance.excelFields.get(f.field),
    }));
  },
  exportUrlCardExcel() {
    const instance = Template.instance();
    const card = getCurrentCardFromContext({ ignorePopupCard: true }) || this;
    const params = {
      boardId: card.boardId || Session.get('currentBoard'),
      listId:  card.listId,
      cardId:  card._id || card.cardId,
    };
    const selectedFields = EXCEL_EXPORT_FIELDS
      .map(f => f.field)
      .filter(f => instance.excelFields.get(f));
    return FlowRouter.path(
      '/api/boards/:boardId/lists/:listId/cards/:cardId/exportExcel',
      params,
      { authToken: Accounts._storedLoginToken(), fields: selectedFields.join(','), lang: TAPi18n.getLanguage() },
    );
  },
  exportFilenameCardExcel() {
    const card = getCurrentCardFromContext({ ignorePopupCard: true }) || this;
    return `${String(card.title || 'export-card')
      .replace(/[^a-z0-9._-]+/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'export-card'}.xlsx`;
  },
});

Template.exportCardPopup.events({
  'click .js-excel-field-toggle'(event, instance) {
    event.preventDefault();
    const field = event.currentTarget.dataset.field;
    instance.excelFields.set(field, !instance.excelFields.get(field));
  },
});

// only allow number input
Template.editCardSortOrderForm.onRendered(function () {
  this.$('input').on("keypress paste", function (event) {
    let keyCode = event.keyCode;
    let charCode = String.fromCharCode(keyCode);
    let regex = new RegExp('[-0-9.]');
    let ret = regex.test(charCode);
    // only working here, defining in events() doesn't handle the return value correctly
    return ret;
  });
});

// inlinedCardDescription extends the normal inlinedForm to support UnsavedEdits
// draft feature for card descriptions.
Template.inlinedCardDescription.onCreated(function () {
  this.isOpen = new ReactiveVar(false);

  this._getUnsavedEditKey = () => ({
    fieldName: 'cardDescription',
    docId: getCardId(),
  });

  this._getValue = () => {
    const input = this.find('textarea,input[type=text]');
    return this.isOpen.get() && input && input.value.replaceAll(/[ \f\r\t\v]+$/gm, '');
  };

  this._close = (isReset = false) => {
    if (this.isOpen.get() && !isReset) {
      const draft = (this._getValue() || '').trim();
      const card = getCurrentCardFromContext();
      if (card && draft !== card.getDescription()) {
        UnsavedEdits.set(this._getUnsavedEditKey(), this._getValue());
      }
    }
    this.isOpen.set(false);
  };

  this._reset = () => {
    UnsavedEdits.reset(this._getUnsavedEditKey());
    this._close(true);
  };
});

Template.inlinedCardDescription.helpers({
  isOpen() {
    return Template.instance().isOpen;
  },
});

Template.inlinedCardDescription.events({
  'click .js-close-inlined-form'(evt, tpl) {
    tpl._reset();
  },
  'click .js-open-inlined-form'(evt, tpl) {
    evt.preventDefault();
    EscapeActions.clickExecute(evt.target, 'inlinedForm');
    tpl.isOpen.set(true);
  },
  'keydown form textarea'(evt, tpl) {
    if (evt.keyCode === 13 && (evt.metaKey || evt.ctrlKey)) {
      tpl.find('button[type=submit]').click();
    }
  },
  submit(evt, tpl) {
    const data = Template.currentData();
    if (data.autoclose !== false) {
      Tracker.afterFlush(() => {
        tpl._close();
      });
    }
  },
});

Template.cardDetailsActionsPopup.helpers({
  isWatching() {
    if (!this || typeof this.findWatcher !== 'function') return false;
    return this.findWatcher(Meteor.userId());
  },

  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },

  showListOnMinicard() {
    return this.showListOnMinicard;
  },
});

Template.cardDetailsActionsPopup.events({
  'click .js-export-card': Popup.open('exportCard'),
  'click .js-members': Popup.open('cardMembers'),
  'click .js-assignees': Popup.open('cardAssignees'),
  'click .js-attachments': Popup.open('cardAttachments'),
  'click .js-start-voting': Popup.open('cardStartVoting'),
  'click .js-start-planning-poker': Popup.open('cardStartPlanningPoker'),
  'click .js-custom-fields': Popup.open('cardCustomFields'),
  'click .js-received-date': Popup.open('editCardReceivedDate'),
  'click .js-start-date': Popup.open('editCardStartDate'),
  'click .js-due-date': Popup.open('editCardDueDate'),
  'click .js-end-date': Popup.open('editCardEndDate'),
  'click .js-spent-time': Popup.open('editCardSpentTime'),
  'click .js-move-card': Popup.open('moveCard'),
  'click .js-copy-card': Popup.open('copyCard'),
  'click .js-convert-checklist-item-to-card': Popup.open('convertChecklistItemToCard'),
  'click .js-copy-checklist-cards': Popup.open('copyManyCards'),
  'click .js-set-card-color': Popup.open('setCardColor'),
  async 'click .js-move-card-to-top'(event) {
    event.preventDefault();
    const card = Cards.findOne(getCardId());
    if (!card) return;
    const minOrder = await card.getMinSort() || 0;
    await card.move(card.boardId, card.swimlaneId, card.listId, minOrder - 1);
    Popup.back();
  },
  async 'click .js-move-card-to-bottom'(event) {
    event.preventDefault();
    const card = Cards.findOne(getCardId());
    if (!card) return;
    const maxOrder = await card.getMaxSort() || 0;
    await card.move(card.boardId, card.swimlaneId, card.listId, maxOrder + 1);
    Popup.back();
  },
  'click .js-archive': Popup.afterConfirm('cardArchive', async function () {
    const card = Cards.findOne(getCardId());
    Popup.close();
    if (!card) return;
    await card.archive();
    Utils.goBoardId(card.boardId);
  }),
  'click .js-more': Popup.open('cardMore'),
  'click .js-toggle-watch-card'() {
    const currentCard = Cards.findOne(getCardId());
    if (!currentCard) return;
    const level = currentCard.findWatcher(Meteor.userId()) ? null : 'watching';
    Meteor.call('watch', 'card', currentCard._id, level, (err, ret) => {
      if (!err && ret) Popup.close();
    });
  },
  'click .js-toggle-show-list-on-minicard'() {
    const currentCard = Cards.findOne(getCardId());
    if (!currentCard) return;
    const newValue = !currentCard.showListOnMinicard;
    Cards.update(currentCard._id, { $set: { showListOnMinicard: newValue } });
    Popup.close();
  },
});

Template.editCardTitleForm.onRendered(function () {
  autosize(this.$('textarea.js-edit-card-title'));
});

Template.editCardTitleForm.events({
  'click a.fa.fa-copy'(event, tpl) {
    const $editor = tpl.$('textarea');
    const promise = Utils.copyTextToClipboard($editor[0].value);

    const $tooltip = tpl.$('.copied-tooltip');
    Utils.showCopied(promise, $tooltip);
  },
  'keydown .js-edit-card-title'(event) {
    // If enter key was pressed, submit the data
    // Unless the shift key is also being pressed
    if (event.keyCode === 13 && !event.shiftKey) {
      $('.js-submit-edit-card-title-form').click();
    }
  },
});

Template.cardMembersPopup.onCreated(function () {
  let currBoard = Utils.getCurrentBoard();
  let members = currBoard.activeMembers();
  this.members = new ReactiveVar(members);
});

Template.cardMembersPopup.events({
  'click .js-select-member'(event) {
    const card = getCurrentCardFromContext();
    if (!card) return;
    const memberId = this.userId;
    card.toggleMember(memberId);
    event.preventDefault();
  },
  'keyup .card-members-filter'(event) {
    const members = filterMembers(event.target.value);
    Template.instance().members.set(members);
  }
});

Template.cardMembersPopup.helpers({
  isCardMember() {
    const card = getCurrentCardFromContext();
    if (!card) return false;
    const cardMembers = card.getMembers();

    return (cardMembers || []).includes(this.userId);
  },

  members() {
    const members = Template.instance().members.get();
    const uniqueMembers = uniqBy(members, 'userId');
    return [...uniqueMembers].sort((a, b) => {
      const userA = ReactiveCache.getUser(a.userId);
      const userB = ReactiveCache.getUser(b.userId);
      const nameA = userA ? userA.profile.fullname : '';
      const nameB = userB ? userB.profile.fullname : '';
      return nameA.localeCompare(nameB);
    });
  },
  userData() {
    return ReactiveCache.getUser(this.userId);
  },
});

// Popup that adds or edits a single card location (name, address, latitude,
// longitude). Cards can hold multiple locations, like members.
Template.cardLocationsPopup.onCreated(function () {
  const data = Template.currentData();
  this.cardId = data && data._id;
  this.detectMsg = new ReactiveVar('');
  this.mapSavedMsg = new ReactiveVar('');
});

Template.cardLocationsPopup.helpers({
  location() {
    const tpl = Template.instance();
    const card = ReactiveCache.getCard(tpl.cardId);
    const id = editingLocationId.get();
    if (card && id) {
      const found = card.getLocations().find(loc => loc._id === id);
      if (found) return found;
    }
    return {};
  },
  detectMessage() {
    return Template.instance().detectMsg.get();
  },
  isMapProvider(provider) {
    const user = ReactiveCache.getCurrentUser();
    const current = user ? user.getMapProvider() : 'openstreetmap';
    return current === provider;
  },
  mapSavedMessage() {
    return Template.instance().mapSavedMsg.get();
  },
});

Template.cardLocationsPopup.events({
  'click .js-detect-location'(event) {
    event.preventDefault();
    const tpl = Template.instance();
    const linkInput = tpl.find('.js-location-map-link');
    const parsed = parseMapLink(linkInput ? linkInput.value : '');
    let filled = false;
    if (typeof parsed.latitude === 'number') {
      tpl.find('.js-location-latitude').value = parsed.latitude;
      tpl.find('.js-location-longitude').value = parsed.longitude;
      filled = true;
    }
    if (parsed.name) {
      tpl.find('.js-location-name').value = parsed.name;
      filled = true;
    }
    if (parsed.address) {
      tpl.find('.js-location-address').value = parsed.address;
      filled = true;
    }
    tpl.detectMsg.set(
      TAPi18n.__(filled ? 'location-detect-done' : 'location-detect-none'),
    );
  },
  'submit .js-card-location-form'(event) {
    event.preventDefault();
    const tpl = Template.instance();
    const card = ReactiveCache.getCard(tpl.cardId);
    if (!card) {
      Popup.back();
      return;
    }
    const name = tpl.find('.js-location-name').value.trim();
    const address = tpl.find('.js-location-address').value.trim();
    const latRaw = tpl.find('.js-location-latitude').value.trim();
    const lonRaw = tpl.find('.js-location-longitude').value.trim();
    const latitude = latRaw === '' ? undefined : parseFloat(latRaw);
    const longitude = lonRaw === '' ? undefined : parseFloat(lonRaw);
    const data = { name, address, latitude, longitude };
    const id = editingLocationId.get();
    if (id) {
      card.updateLocation(id, data);
    } else {
      card.addLocation(data);
    }
    Popup.back();
  },
  'click .js-delete-location'(event) {
    event.preventDefault();
    const tpl = Template.instance();
    const card = ReactiveCache.getCard(tpl.cardId);
    const id = editingLocationId.get();
    if (card && id) {
      card.removeLocation(id);
    }
    Popup.back();
  },
  'click .js-save-map-provider'(event) {
    event.preventDefault();
    const tpl = Template.instance();
    const select = tpl.find('.js-map-provider');
    const provider = select ? select.value : 'openstreetmap';
    Meteor.call('setMapProvider', provider, err => {
      tpl.mapSavedMsg.set(
        TAPi18n.__(err ? 'server-error' : 'map-provider-saved'),
      );
    });
  },
});

const filterMembers = (filterTerm) => {
  let currBoard = Utils.getCurrentBoard();
  let members = currBoard.activeMembers();

  if (filterTerm) {
    const searchTerm = filterTerm.toLowerCase();
    members = members
      .map(member => ({
        member,
        user: ReactiveCache.getUser(member.userId)
      }))
      .filter(({ user }) => {
        // Check if user data is available
        if (!user || !user.profile) {
          return false;
        }
        const fullname = (user.profile.fullname || '').toLowerCase();
        const username = (user.username || '').toLowerCase();
        return fullname.indexOf(searchTerm) !== -1 || username.indexOf(searchTerm) !== -1;
      })
      .map(({ member }) => member);
  }
  return members;
}

Template.editCardRequesterForm.onRendered(function () {
  autosize(this.$('.js-edit-card-requester'));
});

Template.editCardRequesterForm.events({
  'keydown .js-edit-card-requester'(event) {
    // If enter key was pressed, submit the data
    if (event.keyCode === 13) {
      $('.js-submit-edit-card-requester-form').click();
    }
  },
});

Template.editCardAssignerForm.onRendered(function () {
  autosize(this.$('.js-edit-card-assigner'));
});

Template.editCardAssignerForm.events({
  'keydown .js-edit-card-assigner'(event) {
    // If enter key was pressed, submit the data
    if (event.keyCode === 13) {
      $('.js-submit-edit-card-assigner-form').click();
    }
  },
});

/**
 * Helper: register standard board/swimlane/list/card dialog helpers and events
 * for a template that uses BoardSwimlaneListCardDialog.
 */
function registerCardDialogTemplate(templateName) {
  Template[templateName].helpers({
    boards() {
      return Template.instance().dialog.boards();
    },
    swimlanes() {
      return Template.instance().dialog.swimlanes();
    },
    lists() {
      return Template.instance().dialog.lists();
    },
    cards() {
      return Template.instance().dialog.cards();
    },
    isDialogOptionBoardId(boardId) {
      return Template.instance().dialog.isDialogOptionBoardId(boardId);
    },
    isDialogOptionSwimlaneId(swimlaneId) {
      return Template.instance().dialog.isDialogOptionSwimlaneId(swimlaneId);
    },
    isDialogOptionListId(listId) {
      return Template.instance().dialog.isDialogOptionListId(listId);
    },
    isDialogOptionCardId(cardId) {
      return Template.instance().dialog.isDialogOptionCardId(cardId);
    },
    isTitleDefault(title) {
      return Template.instance().dialog.isTitleDefault(title);
    },
  });

  Template[templateName].events({
    async 'click .js-done'(event, tpl) {
      const dialog = tpl.dialog;
      const boardSelect = tpl.$('.js-select-boards')[0];
      const boardId = boardSelect?.options[boardSelect?.selectedIndex]?.value;

      const listSelect = tpl.$('.js-select-lists')[0];
      const listId = listSelect?.options[listSelect?.selectedIndex]?.value;

      const swimlaneSelect = tpl.$('.js-select-swimlanes')[0];
      const swimlaneId = swimlaneSelect?.options[swimlaneSelect?.selectedIndex]?.value;

      const cardSelect = tpl.$('.js-select-cards')[0];
      const cardId = cardSelect?.options?.length > 0
        ? cardSelect.options[cardSelect.selectedIndex].value
        : null;

      const options = { boardId, swimlaneId, listId, cardId };
      try {
        await dialog.setDone(cardId, options);
      } catch (e) {
        console.error('Error in card dialog operation:', e);
      }
      Popup.back(2);
    },
    'change .js-select-boards'(event, tpl) {
      tpl.dialog.getBoardData($(event.currentTarget).val());
    },
    'change .js-select-swimlanes'(event, tpl) {
      tpl.dialog.selectedSwimlaneId.set($(event.currentTarget).val());
      tpl.dialog.setFirstListId();
    },
    'change .js-select-lists'(event, tpl) {
      tpl.dialog.selectedListId.set($(event.currentTarget).val());
      if (tpl.dialog.selectedCardId) {
        tpl.dialog.selectedCardId.set('');
      }
    },
    'change .js-select-cards'(event, tpl) {
      if (tpl.dialog.selectedCardId) {
        tpl.dialog.selectedCardId.set($(event.currentTarget).val());
      }
    },
  });
}

/** Move Card Dialog */
Template.moveCardPopup.onCreated(function () {
  this.dialog = new BoardSwimlaneListCardDialog(this, {
    getDialogOptions() {
      return ReactiveCache.getCurrentUser().getMoveAndCopyDialogOptions();
    },
    async setDone(cardId, options) {
      const tpl = Template.instance();
      const title = tpl.$('#move-card-title').val().trim();
      const position = tpl.$('input[name="position"]:checked').val();

      ReactiveCache.getCurrentUser().setMoveAndCopyDialogOption(this.currentBoardId, options);
      const card = Template.currentData();
      let sortIndex = 0;

      if (cardId) {
        const targetCard = ReactiveCache.getCard(cardId);
        if (targetCard) {
          const targetSort = targetCard.sort || 0;
          if (position === 'above') {
            sortIndex = targetSort - 0.5;
          } else {
            sortIndex = targetSort + 0.5;
          }
        }
      } else {
        const maxSort = await card.getMaxSort(options.listId, options.swimlaneId);
        sortIndex = (typeof maxSort === 'number' && !Number.isNaN(maxSort)) ? maxSort + 1 : 0;
      }

      await card.move(options.boardId, options.swimlaneId, options.listId, sortIndex);
      if (title && title !== card.title) {
        await card.setTitle(title);
      }
    },
  });
});
registerCardDialogTemplate('moveCardPopup');

/** Copy Card Dialog */
Template.copyCardPopup.onCreated(function () {
  this.dialog = new BoardSwimlaneListCardDialog(this, {
    getDialogOptions() {
      return ReactiveCache.getCurrentUser().getMoveAndCopyDialogOptions();
    },
    async setDone(cardId, options) {
      const tpl = Template.instance();
      const textarea = tpl.$('#copy-card-title');
      const title = textarea.val().trim();
      const position = tpl.$('input[name="position"]:checked').val();

      ReactiveCache.getCurrentUser().setMoveAndCopyDialogOption(this.currentBoardId, options);
      const card = Template.currentData();

      if (title) {
        const newCardId = await Meteor.callAsync('copyCard', card._id, options.boardId, options.swimlaneId, options.listId, true, {title: title});

        if (newCardId) {
          const newCard = ReactiveCache.getCard(newCardId);
          if (newCard) {
            let sortIndex = 0;

            if (cardId) {
              const targetCard = ReactiveCache.getCard(cardId);
              if (targetCard) {
                const targetSort = targetCard.sort || 0;
                if (position === 'above') {
                  sortIndex = targetSort - 0.5;
                } else {
                  sortIndex = targetSort + 0.5;
                }
              }
            } else {
              const maxSort = await newCard.getMaxSort(options.listId, options.swimlaneId);
              sortIndex = (typeof maxSort === 'number' && !Number.isNaN(maxSort)) ? maxSort + 1 : 0;
            }

            await newCard.move(options.boardId, options.swimlaneId, options.listId, sortIndex);
          }
        }

        // In case the filter is active we need to add the newly inserted card in
        // the list of exceptions -- cards that are not filtered. Otherwise the
        // card will disappear instantly.
        // See https://github.com/wekan/wekan/issues/80
        Filter.addException(newCardId);
      }
    },
  });
});
registerCardDialogTemplate('copyCardPopup');

/** Convert Checklist-Item to card dialog */
Template.convertChecklistItemToCardPopup.onCreated(function () {
  this.dialog = new BoardSwimlaneListCardDialog(this, {
    getDialogOptions() {
      return ReactiveCache.getCurrentUser().getMoveAndCopyDialogOptions();
    },
    async setDone(cardId, options) {
      const tpl = Template.instance();
      const textarea = tpl.$('#copy-card-title');
      const title = textarea.val().trim();
      const position = tpl.$('input[name="position"]:checked').val();

      ReactiveCache.getCurrentUser().setMoveAndCopyDialogOption(this.currentBoardId, options);
      const card = Template.currentData();

      if (title) {
        const _id = Cards.insert({
          title: title,
          listId: options.listId,
          boardId: options.boardId,
          swimlaneId: options.swimlaneId,
          sort: 0,
        });
        const newCard = ReactiveCache.getCard(_id);

        let sortIndex = 0;
        if (cardId) {
          const targetCard = ReactiveCache.getCard(cardId);
          if (targetCard) {
            const targetSort = targetCard.sort || 0;
            if (position === 'above') {
              sortIndex = targetSort - 0.5;
            } else {
              sortIndex = targetSort + 0.5;
            }
          }
        } else {
          const maxSort = await newCard.getMaxSort(options.listId, options.swimlaneId);
          sortIndex = (typeof maxSort === 'number' && !Number.isNaN(maxSort)) ? maxSort + 1 : 0;
        }

        await newCard.move(options.boardId, options.swimlaneId, options.listId, sortIndex);

        Filter.addException(_id);
      }
    },
  });
});
registerCardDialogTemplate('convertChecklistItemToCardPopup');

/** Copy many cards dialog */
Template.copyManyCardsPopup.onCreated(function () {
  this.dialog = new BoardSwimlaneListCardDialog(this, {
    getDialogOptions() {
      return ReactiveCache.getCurrentUser().getMoveAndCopyDialogOptions();
    },
    async setDone(cardId, options) {
      const tpl = Template.instance();
      const textarea = tpl.$('#copy-card-title');
      const title = textarea.val().trim();
      const position = tpl.$('input[name="position"]:checked').val();

      ReactiveCache.getCurrentUser().setMoveAndCopyDialogOption(this.currentBoardId, options);
      const card = Template.currentData();

      if (title) {
        const titleList = JSON.parse(title);
        for (const obj of titleList) {
          const newCardId = await Meteor.callAsync('copyCard', card._id, options.boardId, options.swimlaneId, options.listId, false, {title: obj.title, description: obj.description});

          if (newCardId) {
            const newCard = ReactiveCache.getCard(newCardId);
            let sortIndex = 0;

            if (cardId) {
              const targetCard = ReactiveCache.getCard(cardId);
              if (targetCard) {
                const targetSort = targetCard.sort || 0;
                if (position === 'above') {
                  sortIndex = targetSort - 0.5;
                } else {
                  sortIndex = targetSort + 0.5;
                }
              }
            } else {
              const maxSort = await newCard.getMaxSort(options.listId, options.swimlaneId);
              sortIndex = (typeof maxSort === 'number' && !Number.isNaN(maxSort)) ? maxSort + 1 : 0;
            }

            await newCard.move(options.boardId, options.swimlaneId, options.listId, sortIndex);
          }

          // In case the filter is active we need to add the newly inserted card in
          // the list of exceptions -- cards that are not filtered. Otherwise the
          // card will disappear instantly.
          // See https://github.com/wekan/wekan/issues/80
          Filter.addException(newCardId);
        }
      }
    },
  });
});
registerCardDialogTemplate('copyManyCardsPopup');

Template.setCardColorPopup.onCreated(function () {
  const cardId = getCardId();
  this.currentCard = Cards.findOne(cardId);
  this.currentColor = new ReactiveVar(this.currentCard?.color);
});

Template.setCardColorPopup.helpers({
  colors() {
    return ALLOWED_COLORS.map((color) => ({ color, name: '' }));
  },

  isSelected(color) {
    const tpl = Template.instance();
    if (tpl.currentColor.get() === null) {
      return color === 'white';
    }
    return tpl.currentColor.get() === color;
  },
});

Template.setCardColorPopup.events({
  'click .js-palette-color'(event, tpl) {
    const paletteData = Blaze.getData(event.currentTarget);
    tpl.currentColor.set(paletteData?.color);
  },
  async 'click .js-submit'(event, tpl) {
    event.preventDefault();
    const card = Cards.findOne(getCardId());
    if (!card) return;
    await card.setColor(tpl.currentColor.get());
    Popup.back();
  },
  async 'click .js-remove-color'(event) {
    event.preventDefault();
    const card = Cards.findOne(getCardId());
    if (!card) return;
    await card.setColor(null);
    Popup.back();
  },
});

Template.setSelectionColorPopup.onCreated(function () {
  const selectedCards = ReactiveCache.getCards(MultiSelection.getMongoSelector());
  const uniqueColors = [...new Set(selectedCards.map(card => card.color || null))];
  this.currentColor = new ReactiveVar(uniqueColors.length === 1 ? uniqueColors[0] : null);
});

Template.setSelectionColorPopup.helpers({
  colors() {
    return ALLOWED_COLORS.map((color) => ({ color, name: '' }));
  },

  isSelected(color) {
    return Template.instance().currentColor.get() === color;
  },
});

Template.setSelectionColorPopup.events({
  'click .js-palette-color'(event, tpl) {
    // Extract color from class name like "card-details-red"
    const classes = $(event.currentTarget).attr('class').split(' ');
    const colorClass = classes.find(cls => cls.startsWith('card-details-'));
    const color = colorClass ? colorClass.replace('card-details-', '') : null;
    tpl.currentColor.set(color);
  },
  async 'submit form.edit-label'(event, tpl) {
    event.preventDefault();
    const color = tpl.currentColor.get();
    try {
      for (const card of ReactiveCache.getCards(MultiSelection.getMongoSelector())) {
        await card.setColor(color);
      }
      Popup.back();
    } catch (error) {
      alert(error?.reason || error?.message || 'Failed to save selection color');
    }
  },
  async 'click .js-submit'(event, tpl) {
    event.preventDefault();
    await tpl.$('form.edit-label').trigger('submit');
  },
  async 'click .js-remove-color'(event, tpl) {
    event.preventDefault();
    try {
      for (const card of ReactiveCache.getCards(MultiSelection.getMongoSelector())) {
        await card.setColor(null);
      }
      Popup.back();
    } catch (error) {
      alert(error?.reason || error?.message || 'Failed to unset selection color');
    }
  },
});

Template.cardMorePopup.onCreated(function () {
  const cardId = getCardId();
  this.currentCard = Cards.findOne(cardId);
  this.parentBoard = new ReactiveVar(null);
  this.parentCard = this.currentCard?.parentCard();
  if (this.parentCard) {
    const list = $('.js-field-parent-card');
    list.val(this.parentCard._id);
    this.parentBoard.set(this.parentCard.board()._id);
  } else {
    this.parentBoard.set(null);
  }

  this.setParentCardId = (cardId) => {
    if (cardId) {
      this.parentCard = ReactiveCache.getCard(cardId);
    } else {
      this.parentCard = null;
    }
    const card = Cards.findOne(getCardId());
    if (card) card.setParentId(cardId);
  };
});

Template.cardMorePopup.helpers({
  boards() {
    const ret = ReactiveCache.getBoards(
      {
        archived: false,
        'members.userId': Meteor.userId(),
        _id: { $ne: ReactiveCache.getCurrentUser().getTemplatesBoardId() },
      },
      {
        sort: { sort: 1 /* boards default sorting */ },
      },
    );
    return ret;
  },

  cards() {
    const tpl = Template.instance();
    const currentId = getCardId();
    if (tpl.parentBoard.get()) {
      const ret = ReactiveCache.getCards({
        boardId: tpl.parentBoard.get(),
        _id: { $ne: currentId },
      });
      return ret;
    } else {
      return [];
    }
  },

  isParentBoard() {
    const tpl = Template.instance();
    const board = Template.currentData();
    if (tpl.parentBoard.get()) {
      return board._id === tpl.parentBoard.get();
    }
    return false;
  },

  isParentCard() {
    const tpl = Template.instance();
    const card = Template.currentData();
    if (tpl.parentCard) {
      return card._id === tpl.parentCard;
    }
    return false;
  },
});

Template.cardMorePopup.events({
  'click .js-copy-card-link-to-clipboard'(event, tpl) {
    const promise = Utils.copyTextToClipboard(location.origin + document.getElementById('cardURL').value);

    const $tooltip = tpl.$('.copied-tooltip');
    Utils.showCopied(promise, $tooltip);
  },
  'click .js-delete': Popup.afterConfirm('cardDelete', function () {
    const card = Cards.findOne(getCardId());
    Popup.close();
    if (!card) return;
    // verify that there are no linked cards
    if (ReactiveCache.getCards({ linkedId: card._id }).length === 0) {
      Cards.remove(card._id);
    } else {
      // TODO: Maybe later we can list where the linked cards are.
      // Now here is popup with a hint that the card cannot be deleted
      // as there are linked cards.
      // Related:
      //   client/components/lists/listHeader.js about line 248
      //   https://github.com/wekan/wekan/issues/2785
      const message = `${TAPi18n.__(
        'delete-linked-card-before-this-card',
      )} linkedId: ${card._id
        } at client/components/cards/cardDetails.js and https://github.com/wekan/wekan/issues/2785`;
      alert(message);
    }
    Utils.goBoardId(card.boardId);
  }),
  'change .js-field-parent-board'(event, tpl) {
    const selection = $(event.currentTarget).val();
    const list = $('.js-field-parent-card');
    if (selection === 'none') {
      tpl.parentBoard.set(null);
    } else {
      Meteor.subscribe('board', $(event.currentTarget).val(), false);
      tpl.parentBoard.set(selection);
      list.prop('disabled', false);
    }
    tpl.setParentCardId(null);
  },
  'change .js-field-parent-card'(event, tpl) {
    const selection = $(event.currentTarget).val();
    tpl.setParentCardId(selection);
  },
});

Template.cardStartVotingPopup.onCreated(function () {
  const cardId = getCardId();
  this.currentCard = Cards.findOne(cardId);
  this.voteQuestion = new ReactiveVar(this.currentCard?.voteQuestion);
});

Template.cardStartVotingPopup.helpers({
  getVoteQuestion() {
    const card = Cards.findOne(getCardId());
    return card && card.getVoteQuestion ? card.getVoteQuestion() : null;
  },
  votePublic() {
    const card = Cards.findOne(getCardId());
    return card && card.votePublic ? card.votePublic() : false;
  },
  voteAllowNonBoardMembers() {
    const card = Cards.findOne(getCardId());
    return card && card.voteAllowNonBoardMembers ? card.voteAllowNonBoardMembers() : false;
  },
  getVoteEnd() {
    const card = Cards.findOne(getCardId());
    return card && card.getVoteEnd ? card.getVoteEnd() : null;
  },
});

Template.cardStartVotingPopup.events({
  'click .js-end-date': Popup.open('editVoteEndDate'),
  'submit .edit-vote-question'(evt) {
    evt.preventDefault();
    const card = Cards.findOne(getCardId());
    if (!card) return;
    const voteQuestion = evt.target.vote.value;
    const publicVote = $('#vote-public').hasClass('is-checked');
    const allowNonBoardMembers = $('#vote-allow-non-members').hasClass(
      'is-checked',
    );
    const endString = card.getVoteEnd();
    Meteor.call('cards.setVoteQuestion', card._id, voteQuestion, publicVote, allowNonBoardMembers);
    if (endString) {
      Meteor.call('cards.setVoteEnd', card._id, new Date(endString));
    }
    Popup.back();
  },
  'click .js-remove-vote': Popup.afterConfirm('deleteVote', function () {
    const card = Cards.findOne(getCardId());
    if (!card) return;
    Meteor.call('cards.unsetVote', card._id);
    Popup.back();
  }),
  'click a.js-toggle-vote-public'(event) {
    event.preventDefault();
    $('#vote-public').toggleClass('is-checked');
  },
  'click a.js-toggle-vote-allow-non-members'(event) {
    event.preventDefault();
    $('#vote-allow-non-members').toggleClass('is-checked');
  },
});

Template.positiveVoteMembersPopup.helpers({
  voteMemberPositive() {
    const card = Cards.findOne(getCardId());
    return card ? card.voteMemberPositive() : [];
  },
});

Template.negativeVoteMembersPopup.helpers({
  voteMemberNegative() {
    const card = Cards.findOne(getCardId());
    return card ? card.voteMemberNegative() : [];
  },
});

Template.cardDeletePopup.helpers({
  archived() {
    const card = Cards.findOne(getCardId());
    return card ? card.archived : false;
  },
});

Template.cardArchivePopup.helpers({
  archived() {
    const card = Cards.findOne(getCardId());
    return card ? card.archived : false;
  },
});

// editVoteEndDatePopup
Template.editVoteEndDatePopup.onCreated(function () {
  const card = Cards.findOne(getCardId());
  setupDatePicker(this, {
    defaultTime: formatDateTime(now()),
    initialDate: card?.getVoteEnd ? (card.getVoteEnd() || undefined) : undefined,
  });
});

Template.editVoteEndDatePopup.onRendered(function () {
  datePickerRendered(this);
});

Template.editVoteEndDatePopup.helpers(datePickerHelpers());

Template.editVoteEndDatePopup.events(datePickerEvents({
  storeDate(date) {
    Meteor.call('cards.setVoteEnd', this.datePicker.card._id, date);
  },
  deleteDate() {
    Meteor.call('cards.unsetVoteEnd', this.datePicker.card._id);
  },
}));

Template.cardStartPlanningPokerPopup.onCreated(function () {
  const cardId = getCardId();
  this.currentCard = Cards.findOne(cardId);
  this.pokerQuestion = new ReactiveVar(this.currentCard?.pokerQuestion);
});

Template.cardStartPlanningPokerPopup.helpers({
  getPokerQuestion() {
    const card = Cards.findOne(getCardId());
    return card && card.getPokerQuestion ? card.getPokerQuestion() : null;
  },
  pokerAllowNonBoardMembers() {
    const card = Cards.findOne(getCardId());
    return card && card.pokerAllowNonBoardMembers ? card.pokerAllowNonBoardMembers() : false;
  },
  getPokerEnd() {
    const card = Cards.findOne(getCardId());
    return card && card.getPokerEnd ? card.getPokerEnd() : null;
  },
});

Template.cardStartPlanningPokerPopup.events({
  'click .js-end-date': Popup.open('editPokerEndDate'),
  'submit .edit-poker-question'(evt) {
    evt.preventDefault();
    const card = Cards.findOne(getCardId());
    if (!card) return;
    const pokerQuestion = true;
    const allowNonBoardMembers = $('#poker-allow-non-members').hasClass(
      'is-checked',
    );
    const endString = card.getPokerEnd();

    Meteor.call('cards.setPokerQuestion', card._id, pokerQuestion, allowNonBoardMembers);
    if (endString) {
      Meteor.call('cards.setPokerEnd', card._id, new Date(endString));
    }
    Popup.back();
  },
  'click .js-remove-poker': Popup.afterConfirm('deletePoker', function () {
    const card = Cards.findOne(getCardId());
    if (!card) return;
    Meteor.call('cards.unsetPoker', card._id);
    Popup.back();
  }),
  'click a.js-toggle-poker-allow-non-members'(event) {
    event.preventDefault();
    $('#poker-allow-non-members').toggleClass('is-checked');
  },
});

// editPokerEndDatePopup
Template.editPokerEndDatePopup.onCreated(function () {
  const card = Cards.findOne(getCardId());
  setupDatePicker(this, {
    defaultTime: formatDateTime(now()),
    initialDate: card?.getPokerEnd ? (card.getPokerEnd() || undefined) : undefined,
  });
});

Template.editPokerEndDatePopup.onRendered(function () {
  datePickerRendered(this);
});

Template.editPokerEndDatePopup.helpers(datePickerHelpers());

Template.editPokerEndDatePopup.events(datePickerEvents({
  storeDate(date) {
    Meteor.call('cards.setPokerEnd', this.datePicker.card._id, date);
  },
  deleteDate() {
    Meteor.call('cards.unsetPokerEnd', this.datePicker.card._id);
  },
}));

// Close the card details pane by pressing escape
EscapeActions.register(
  'detailsPane',
  async () => {
    // if card description diverges from database due to editing
    // ask user whether changes should be applied
    if (ReactiveCache.getCurrentUser()) {
      if (ReactiveCache.getCurrentUser().profile.rescueCardDescription == true) {
        const currentCard = getCurrentCardFromContext();
        const cardDetailsElement = getCardDetailsElement(currentCard?._id);
        const currentDescription = cardDetailsElement?.querySelector(
          '.editor.js-new-description-input',
        );
        if (currentDescription?.value && currentCard && !(currentDescription.value === currentCard.getDescription())) {
          if (confirm(TAPi18n.__('rescue-card-description-dialogue'))) {
            await currentCard.setDescription(currentDescription.value);
            // Save it!
            console.log(currentDescription.value);
            console.log("current description", currentCard.getDescription());
          } else {
            // Do nothing!
            console.log('Description changes were not saved to the database.');
          }
        }
      }
    }
    if (Session.get('cardDetailsIsDragging')) {
      // Reset dragging status as the mouse landed outside the cardDetails template area and this will prevent a mousedown event from firing
      Session.set('cardDetailsIsDragging', false);
      Session.set('cardDetailsIsMouseDown', false);

    } else {
      // Trigger the close button so all close logic (openCards, routing, mini-screen) runs consistently
      $('.js-close-card-details').first().trigger('click');
    }
  },
  () => {
    return !Session.equals('currentCard', null);
  },
  {
    noClickEscapeOn: '.js-card-details,.board-sidebar,#header',
  },
);

Template.cardAssigneesPopup.onCreated(function () {
  let currBoard = Utils.getCurrentBoard();
  let members = currBoard.activeMembers();
  this.members = new ReactiveVar(members);
});

Template.cardAssigneesPopup.events({
  'click .js-select-assignee'(event) {
    const card = getCurrentCardFromContext();
    if (!card) return;
    const assigneeId = this.userId;
    card.toggleAssignee(assigneeId);
    event.preventDefault();
  },
  'keyup .card-assignees-filter'(event) {
    const members = filterMembers(event.target.value);
    Template.instance().members.set(members);
  },
});

Template.cardAssigneesPopup.helpers({
  isCardAssignee() {
    const card = getCurrentCardFromContext();
    if (!card) return false;
    const cardAssignees = card.getAssignees();

    return (cardAssignees || []).includes(this.userId);
  },

  members() {
    const members = Template.instance().members.get();
    const uniqueMembers = uniqBy(members, 'userId');
    return [...uniqueMembers].sort((a, b) => {
      const userA = ReactiveCache.getUser(a.userId);
      const userB = ReactiveCache.getUser(b.userId);
      const nameA = userA ? userA.profile.fullname : '';
      const nameB = userB ? userB.profile.fullname : '';
      return nameA.localeCompare(nameB);
    });
  },

  userData() {
    return ReactiveCache.getUser(this.userId);
  },
});

Template.cardAssigneePopup.helpers({
  userData() {
    return ReactiveCache.getUser(this.userId, {
      fields: {
        profile: 1,
        username: 1,
      },
    });
  },

  memberType() {
    const user = ReactiveCache.getUser(this.userId);
    return user && user.isBoardAdmin() ? 'admin' : 'normal';
  },

  isCardAssignee() {
    const card = getCurrentCardFromContext();
    if (!card) return false;
    const cardAssignees = card.getAssignees();

    return (cardAssignees || []).includes(this.userId);
  },

  user() {
    return ReactiveCache.getUser(this.userId);
  },
});

Template.cardAssigneePopup.events({
  'click .js-remove-assignee'() {
    ReactiveCache.getCard(this.cardId).unassignAssignee(this.userId);
    Popup.back();
  },
  'click .js-edit-profile': Popup.open('editProfile'),
});
