import { BlazeComponent } from 'meteor/peerlibrary:blaze-components';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import './originalPosition.html';

/**
 * Component to display original position information for swimlanes, lists, and cards
 */
class OriginalPositionComponent extends BlazeComponent {
  onCreated() {
    super.onCreated();
    this.originalPosition = new ReactiveVar(null);
    this.isLoading = new ReactiveVar(false);
    this.hasMoved = new ReactiveVar(false);
    
    this.autorun(() => {
      const data = this.data();
      if (data && data.entityId && data.entityType) {
        this.loadOriginalPosition(data.entityId, data.entityType);
      }
    });
  }

  loadOriginalPosition(entityId, entityType) {
    this.isLoading.set(true);
    
    const methodName = `positionHistory.get${entityType.charAt(0).toUpperCase() + entityType.slice(1)}OriginalPosition`;
    
    Meteor.call(methodName, entityId, (error, result) => {
      this.isLoading.set(false);
      if (error) {
        console.error('Error loading original position:', error);
        this.originalPosition.set(null);
      } else {
        this.originalPosition.set(result);
        
        // Check if the entity has moved
        const movedMethodName = `positionHistory.has${entityType.charAt(0).toUpperCase() + entityType.slice(1)}Moved`;
        Meteor.call(movedMethodName, entityId, (movedError, movedResult) => {
          if (!movedError) {
            this.hasMoved.set(movedResult);
          }
        });
      }
    });
  }

  getOriginalPosition() {
    return this.originalPosition.get();
  }

  isLoading() {
    return this.isLoading.get();
  }

  hasMovedFromOriginal() {
    return this.hasMoved.get();
  }

  getOriginalPositionDescription() {
    const position = this.getOriginalPosition();
    if (!position) return 'No original position data';
    
    if (position.originalPosition) {
      const entityType = this.data().entityType;
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
  }

  getOriginalTitle() {
    const position = this.getOriginalPosition();
    return position ? position.originalTitle : '';
  }

  showOriginalPosition() {
    return this.getOriginalPosition() !== null;
  }
}

OriginalPositionComponent.register('originalPosition');

export default OriginalPositionComponent;
