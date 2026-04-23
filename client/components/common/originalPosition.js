import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';

/**
 * Component to display original position information for swimlanes, lists, and cards
 */

Template.originalPosition.onCreated(function () {
  this.originalPosition = new ReactiveVar(null);
  this.isLoading = new ReactiveVar(false);
  this.hasMoved = new ReactiveVar(false);

  const tpl = this;

  function loadOriginalPosition(entityId, entityType) {
    tpl.isLoading.set(true);

    const methodName = `positionHistory.get${entityType.charAt(0).toUpperCase() + entityType.slice(1)}OriginalPosition`;

    Meteor.call(methodName, entityId, (error, result) => {
      tpl.isLoading.set(false);
      if (error) {
        console.error('Error loading original position:', error);
        tpl.originalPosition.set(null);
      } else {
        tpl.originalPosition.set(result);

        // Check if the entity has moved
        const movedMethodName = `positionHistory.has${entityType.charAt(0).toUpperCase() + entityType.slice(1)}Moved`;
        Meteor.call(movedMethodName, entityId, (movedError, movedResult) => {
          if (!movedError) {
            tpl.hasMoved.set(movedResult);
          }
        });
      }
    });
  }

  this.autorun(() => {
    const data = Template.currentData();
    if (data && data.entityId && data.entityType) {
      loadOriginalPosition(data.entityId, data.entityType);
    }
  });
});

Template.originalPosition.helpers({
  getOriginalPosition() {
    return Template.instance().originalPosition.get();
  },

  isLoading() {
    return Template.instance().isLoading.get();
  },

  hasMovedFromOriginal() {
    return Template.instance().hasMoved.get();
  },

  getOriginalPositionDescription() {
    const position = Template.instance().originalPosition.get();
    if (!position) return 'No original position data';

    if (position.originalPosition) {
      const data = Template.currentData();
      const entityType = data.entityType;
      let description = `Original position: ${position.originalPosition.sort || 0}`;

      if (entityType === 'list' && position.originalSwimlaneId) {
        description += ` in swimlane ${position.originalSwimlaneId}`;
      } else if (entityType === 'card') {
        if (position.originalSwimlaneId) {
          description += ` in swimlane ${position.originalSwimlaneId}`;
        }
        if (position.originalListId) {
          description += ` in list ${position.originalListId}`;
        }
      }

      return description;
    }

    return 'No original position data';
  },

  getOriginalTitle() {
    const position = Template.instance().originalPosition.get();
    return position ? position.originalTitle : '';
  },

  showOriginalPosition() {
    return Template.instance().originalPosition.get() !== null;
  },
});
