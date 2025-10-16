import { ReactiveCache } from '/imports/reactiveCache';

/**
 * PositionHistory collection to track original positions of swimlanes, lists, and cards
 * before the list naming feature was added in commit 719ef87efceacfe91461a8eeca7cf74d11f4cc0a
 */
PositionHistory = new Mongo.Collection('positionHistory');

PositionHistory.attachSchema(
  new SimpleSchema({
    boardId: {
      /**
       * The board ID this position history belongs to
       */
      type: String,
    },
    entityType: {
      /**
       * Type of entity: 'swimlane', 'list', or 'card'
       */
      type: String,
      allowedValues: ['swimlane', 'list', 'card'],
    },
    entityId: {
      /**
       * The ID of the entity (swimlane, list, or card)
       */
      type: String,
    },
    originalPosition: {
      /**
       * The original position data before any changes
       */
      type: Object,
      blackbox: true,
    },
    originalSwimlaneId: {
      /**
       * The original swimlane ID (for lists and cards)
       */
      type: String,
      optional: true,
    },
    originalListId: {
      /**
       * The original list ID (for cards)
       */
      type: String,
      optional: true,
    },
    originalTitle: {
      /**
       * The original title before any changes
       */
      type: String,
      optional: true,
    },
    createdAt: {
      /**
       * When this position history was created
       */
      type: Date,
      autoValue() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return { $setOnInsert: new Date() };
        } else {
          this.unset();
        }
      },
    },
    updatedAt: {
      /**
       * When this position history was last updated
       */
      type: Date,
      autoValue() {
        if (this.isUpdate || this.isUpsert || this.isInsert) {
          return new Date();
        } else {
          this.unset();
        }
      },
    },
  }),
);

PositionHistory.helpers({
  /**
   * Get the original position data
   */
  getOriginalPosition() {
    return this.originalPosition;
  },

  /**
   * Get the original title
   */
  getOriginalTitle() {
    return this.originalTitle || '';
  },

  /**
   * Get the original swimlane ID
   */
  getOriginalSwimlaneId() {
    return this.originalSwimlaneId;
  },

  /**
   * Get the original list ID
   */
  getOriginalListId() {
    return this.originalListId;
  },

  /**
   * Check if this entity has been moved from its original position
   */
  hasMoved() {
    if (this.entityType === 'swimlane') {
      return this.originalPosition.sort !== undefined;
    } else if (this.entityType === 'list') {
      return this.originalPosition.sort !== undefined || 
             this.originalSwimlaneId !== this.entityId;
    } else if (this.entityType === 'card') {
      return this.originalPosition.sort !== undefined ||
             this.originalSwimlaneId !== this.entityId ||
             this.originalListId !== this.entityId;
    }
    return false;
  },

  /**
   * Get a human-readable description of the original position
   */
  getOriginalPositionDescription() {
    const position = this.originalPosition;
    if (!position) return 'Unknown position';

    if (this.entityType === 'swimlane') {
      return `Original position: ${position.sort || 0}`;
    } else if (this.entityType === 'list') {
      const swimlaneInfo = this.originalSwimlaneId ? 
        ` in swimlane ${this.originalSwimlaneId}` : 
        ' in default swimlane';
      return `Original position: ${position.sort || 0}${swimlaneInfo}`;
    } else if (this.entityType === 'card') {
      const swimlaneInfo = this.originalSwimlaneId ? 
        ` in swimlane ${this.originalSwimlaneId}` : 
        ' in default swimlane';
      const listInfo = this.originalListId ? 
        ` in list ${this.originalListId}` : 
        '';
      return `Original position: ${position.sort || 0}${swimlaneInfo}${listInfo}`;
    }
    return 'Unknown position';
  }
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    PositionHistory._collection.createIndex({ boardId: 1, entityType: 1, entityId: 1 });
    PositionHistory._collection.createIndex({ boardId: 1, entityType: 1 });
    PositionHistory._collection.createIndex({ createdAt: -1 });
  });
}

export default PositionHistory;
