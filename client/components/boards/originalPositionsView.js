import { BlazeComponent } from 'meteor/peerlibrary:blaze-components';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import './originalPositionsView.html';

/**
 * Component to display original positions for all entities on a board
 */
class OriginalPositionsViewComponent extends BlazeComponent {
  onCreated() {
    super.onCreated();
    this.showOriginalPositions = new ReactiveVar(false);
    this.boardHistory = new ReactiveVar([]);
    this.isLoading = new ReactiveVar(false);
    this.filterType = new ReactiveVar('all'); // 'all', 'swimlane', 'list', 'card'
  }

  onRendered() {
    super.onRendered();
    this.loadBoardHistory();
  }

  loadBoardHistory() {
    const boardId = Session.get('currentBoard');
    if (!boardId) return;

    this.isLoading.set(true);

    Meteor.call('positionHistory.getBoardHistory', boardId, (error, result) => {
      this.isLoading.set(false);
      if (error) {
        console.error('Error loading board history:', error);
        this.boardHistory.set([]);
      } else {
        this.boardHistory.set(result);
      }
    });
  }

  toggleOriginalPositions() {
    this.showOriginalPositions.set(!this.showOriginalPositions.get());
  }

  isShowingOriginalPositions() {
    return this.showOriginalPositions.get();
  }

  isLoading() {
    return this.isLoading.get();
  }

  getBoardHistory() {
    return this.boardHistory.get();
  }

  getFilteredHistory() {
    const history = this.getBoardHistory();
    const filterType = this.filterType.get();

    if (filterType === 'all') {
      return history;
    }

    return history.filter(item => item.entityType === filterType);
  }

  getSwimlanesHistory() {
    return this.getBoardHistory().filter(item => item.entityType === 'swimlane');
  }

  getListsHistory() {
    return this.getBoardHistory().filter(item => item.entityType === 'list');
  }

  getCardsHistory() {
    return this.getBoardHistory().filter(item => item.entityType === 'card');
  }

  setFilterType(type) {
    this.filterType.set(type);
  }

  getFilterType() {
    return this.filterType.get();
  }

  getEntityDisplayName(entity) {
    const position = entity.originalPosition || {};
    return position.title || `Entity ${entity.entityId}`;
  }

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
  }

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
  }

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
  }

  formatDate(date) {
    return new Date(date).toLocaleString();
  }

  refreshHistory() {
    this.loadBoardHistory();
  }
}

OriginalPositionsViewComponent.register('originalPositionsView');

export default OriginalPositionsViewComponent;
