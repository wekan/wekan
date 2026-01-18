import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import PositionHistory from '/models/positionHistory';
import Swimlanes from '/models/swimlanes';
import Lists from '/models/lists';
import Cards from '/models/cards';
import { ReactiveCache } from '/imports/reactiveCache';

/**
 * Server-side methods for position history tracking
 */
Meteor.methods({
  /**
   * Track original position for a swimlane
   */
  'positionHistory.trackSwimlane'(swimlaneId) {
    check(swimlaneId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    
    const swimlane = Swimlanes.findOne(swimlaneId);
    if (!swimlane) {
      throw new Meteor.Error('swimlane-not-found', 'Swimlane not found');
    }
    
    const board = ReactiveCache.getBoard(swimlane.boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }
    
    return swimlane.trackOriginalPosition();
  },

  /**
   * Track original position for a list
   */
  'positionHistory.trackList'(listId) {
    check(listId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    
    const list = Lists.findOne(listId);
    if (!list) {
      throw new Meteor.Error('list-not-found', 'List not found');
    }
    
    const board = ReactiveCache.getBoard(list.boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }
    
    return list.trackOriginalPosition();
  },

  /**
   * Track original position for a card
   */
  'positionHistory.trackCard'(cardId) {
    check(cardId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    
    const card = Cards.findOne(cardId);
    if (!card) {
      throw new Meteor.Error('card-not-found', 'Card not found');
    }
    
    const board = ReactiveCache.getBoard(card.boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }
    
    return card.trackOriginalPosition();
  },

  /**
   * Get original position for a swimlane
   */
  'positionHistory.getSwimlaneOriginalPosition'(swimlaneId) {
    check(swimlaneId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    
    const swimlane = Swimlanes.findOne(swimlaneId);
    if (!swimlane) {
      throw new Meteor.Error('swimlane-not-found', 'Swimlane not found');
    }
    
    const board = ReactiveCache.getBoard(swimlane.boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }
    
    return swimlane.getOriginalPosition();
  },

  /**
   * Get original position for a list
   */
  'positionHistory.getListOriginalPosition'(listId) {
    check(listId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    
    const list = Lists.findOne(listId);
    if (!list) {
      throw new Meteor.Error('list-not-found', 'List not found');
    }
    
    const board = ReactiveCache.getBoard(list.boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }
    
    return list.getOriginalPosition();
  },

  /**
   * Get original position for a card
   */
  'positionHistory.getCardOriginalPosition'(cardId) {
    check(cardId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    
    const card = Cards.findOne(cardId);
    if (!card) {
      throw new Meteor.Error('card-not-found', 'Card not found');
    }
    
    const board = ReactiveCache.getBoard(card.boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }
    
    return card.getOriginalPosition();
  },

  /**
   * Check if a swimlane has moved from its original position
   */
  'positionHistory.hasSwimlaneMoved'(swimlaneId) {
    check(swimlaneId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    
    const swimlane = Swimlanes.findOne(swimlaneId);
    if (!swimlane) {
      throw new Meteor.Error('swimlane-not-found', 'Swimlane not found');
    }
    
    const board = ReactiveCache.getBoard(swimlane.boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }
    
    return swimlane.hasMovedFromOriginalPosition();
  },

  /**
   * Check if a list has moved from its original position
   */
  'positionHistory.hasListMoved'(listId) {
    check(listId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    
    const list = Lists.findOne(listId);
    if (!list) {
      throw new Meteor.Error('list-not-found', 'List not found');
    }
    
    const board = ReactiveCache.getBoard(list.boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }
    
    return list.hasMovedFromOriginalPosition();
  },

  /**
   * Check if a card has moved from its original position
   */
  'positionHistory.hasCardMoved'(cardId) {
    check(cardId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    
    const card = Cards.findOne(cardId);
    if (!card) {
      throw new Meteor.Error('card-not-found', 'Card not found');
    }
    
    const board = ReactiveCache.getBoard(card.boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }
    
    return card.hasMovedFromOriginalPosition();
  },

  /**
   * Get original position description for a swimlane
   */
  'positionHistory.getSwimlaneDescription'(swimlaneId) {
    check(swimlaneId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    
    const swimlane = Swimlanes.findOne(swimlaneId);
    if (!swimlane) {
      throw new Meteor.Error('swimlane-not-found', 'Swimlane not found');
    }
    
    const board = ReactiveCache.getBoard(swimlane.boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }
    
    return swimlane.getOriginalPositionDescription();
  },

  /**
   * Get original position description for a list
   */
  'positionHistory.getListDescription'(listId) {
    check(listId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    
    const list = Lists.findOne(listId);
    if (!list) {
      throw new Meteor.Error('list-not-found', 'List not found');
    }
    
    const board = ReactiveCache.getBoard(list.boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }
    
    return list.getOriginalPositionDescription();
  },

  /**
   * Get original position description for a card
   */
  'positionHistory.getCardDescription'(cardId) {
    check(cardId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    
    const card = Cards.findOne(cardId);
    if (!card) {
      throw new Meteor.Error('card-not-found', 'Card not found');
    }
    
    const board = ReactiveCache.getBoard(card.boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }
    
    return card.getOriginalPositionDescription();
  },

  /**
   * Get all position history for a board
   */
  'positionHistory.getBoardHistory'(boardId) {
    check(boardId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    
    const board = ReactiveCache.getBoard(boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }
    
    return PositionHistory.find({
      boardId: boardId,
    }, {
      sort: { createdAt: -1 }
    }).fetch();
  },

  /**
   * Get position history by entity type for a board
   */
  'positionHistory.getBoardHistoryByType'(boardId, entityType) {
    check(boardId, String);
    check(entityType, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    
    const board = ReactiveCache.getBoard(boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }
    
    if (!['swimlane', 'list', 'card'].includes(entityType)) {
      throw new Meteor.Error('invalid-entity-type', 'Entity type must be swimlane, list, or card');
    }
    
    return PositionHistory.find({
      boardId: boardId,
      entityType: entityType,
    }, {
      sort: { createdAt: -1 }
    }).fetch();
  },
});
