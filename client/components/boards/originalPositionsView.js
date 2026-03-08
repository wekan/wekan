import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';

/**
 * Component to display original positions for all entities on a board
 */

Template.originalPositionsView.onCreated(function () {
  this.showOriginalPositions = new ReactiveVar(false);
  this.boardHistory = new ReactiveVar([]);
  this.isLoading = new ReactiveVar(false);
  this.filterType = new ReactiveVar('all'); // 'all', 'swimlane', 'list', 'card'

  const tpl = this;

  this.loadBoardHistory = function () {
    const boardId = Session.get('currentBoard');
    if (!boardId) return;

    tpl.isLoading.set(true);

    Meteor.call('positionHistory.getBoardHistory', boardId, (error, result) => {
      tpl.isLoading.set(false);
      if (error) {
        console.error('Error loading board history:', error);
        tpl.boardHistory.set([]);
      } else {
        tpl.boardHistory.set(result);
      }
    });
  };
});

Template.originalPositionsView.onRendered(function () {
  this.loadBoardHistory();
});

Template.originalPositionsView.helpers({
  isShowingOriginalPositions() {
    return Template.instance().showOriginalPositions.get();
  },

  isLoading() {
    return Template.instance().isLoading.get();
  },

  getBoardHistory() {
    return Template.instance().boardHistory.get();
  },

  getFilteredHistory() {
    const tpl = Template.instance();
    const history = tpl.boardHistory.get();
    const filterType = tpl.filterType.get();

    if (filterType === 'all') {
      return history;
    }

    return history.filter(item => item.entityType === filterType);
  },

  isFilterType(type) {
    return Template.instance().filterType.get() === type;
  },

  getEntityDisplayName(entity) {
    const position = entity.originalPosition || {};
    return position.title || `Entity ${entity.entityId}`;
  },

  getEntityOriginalPositionDescription(entity) {
    const position = entity.originalPosition || {};
    let description = `Position: ${position.sort || 0}`;

    if (entity.entityType === 'list' && entity.originalSwimlaneId) {
      description += ` in swimlane ${entity.originalSwimlaneId}`;
    } else if (entity.entityType === 'card') {
      if (entity.originalSwimlaneId) {
        description += ` in swimlane ${entity.originalSwimlaneId}`;
      }
      if (entity.originalListId) {
        description += ` in list ${entity.originalListId}`;
      }
    }

    return description;
  },

  getEntityTypeIcon(entityType) {
    switch (entityType) {
      case 'swimlane':
        return 'fa-bars';
      case 'list':
        return 'fa-columns';
      case 'card':
        return 'fa-sticky-note';
      default:
        return 'fa-question';
    }
  },

  getEntityTypeLabel(entityType) {
    switch (entityType) {
      case 'swimlane':
        return 'Swimlane';
      case 'list':
        return 'List';
      case 'card':
        return 'Card';
      default:
        return 'Unknown';
    }
  },

  formatDate(date) {
    return new Date(date).toLocaleString();
  },
});

Template.originalPositionsView.events({
  'click .js-toggle-original-positions'(evt, tpl) {
    tpl.showOriginalPositions.set(!tpl.showOriginalPositions.get());
  },

  'click .js-refresh-history'(evt, tpl) {
    tpl.loadBoardHistory();
  },

  'click .js-filter-type'(evt, tpl) {
    const type = evt.currentTarget.dataset.filterType;
    tpl.filterType.set(type);
  },
});
