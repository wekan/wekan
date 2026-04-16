# Original Positions Tracking Feature

This feature allows users to see the original positions of swimlanes, lists, and cards before the list naming feature was added in commit [719ef87efceacfe91461a8eeca7cf74d11f4cc0a](https://github.com/wekan/wekan/commit/719ef87efceacfe91461a8eeca7cf74d11f4cc0a).

## Overview

The original positions tracking system automatically captures and stores the initial positions of all board entities (swimlanes, lists, and cards) when they are created. This allows users to:

- View the original position of any entity
- See if an entity has moved from its original position
- Track the original title before any changes
- View a complete history of original positions for a board

## Features

### 1. Automatic Position Tracking
- **Swimlanes**: Tracks original sort position and title
- **Lists**: Tracks original sort position, title, and swimlane assignment
- **Cards**: Tracks original sort position, title, swimlane, and list assignment

### 2. Database Schema
The system uses a new `PositionHistory` collection with the following structure:
```javascript
{
  boardId: String,           // Board ID
  entityType: String,        // 'swimlane', 'list', or 'card'
  entityId: String,          // Entity ID
  originalPosition: Object,  // Original position data
  originalSwimlaneId: String, // Original swimlane (for lists/cards)
  originalListId: String,    // Original list (for cards)
  originalTitle: String,     // Original title
  createdAt: Date,          // When tracked
  updatedAt: Date           // Last updated
}
```

### 3. UI Components

#### Individual Entity Display
- Shows original position information for individual swimlanes, lists, or cards
- Indicates if the entity has moved from its original position
- Displays original title if different from current title

#### Board-Level View
- Complete overview of all original positions on a board
- Filter by entity type (swimlanes, lists, cards)
- Search and sort functionality
- Export capabilities

## Usage

### 1. Automatic Tracking
Position tracking happens automatically when entities are created. No manual intervention required.

### 2. Viewing Original Positions

#### In Templates
```html
<!-- Show original position for a swimlane -->
{{> originalPosition entityId=swimlane._id entityType="swimlane"}}

<!-- Show original position for a list -->
{{> originalPosition entityId=list._id entityType="list"}}

<!-- Show original position for a card -->
{{> originalPosition entityId=card._id entityType="card"}}
```

#### In JavaScript
```javascript
import { addOriginalPositionToSwimlane, addOriginalPositionToList, addOriginalPositionToCard } from '/client/lib/originalPositionHelpers';

// Track original position for a swimlane
addOriginalPositionToSwimlane(swimlaneId);

// Track original position for a list
addOriginalPositionToList(listId);

// Track original position for a card
addOriginalPositionToCard(cardId);
```

### 3. Server Methods

#### Track Original Positions
```javascript
// Track swimlane
Meteor.call('positionHistory.trackSwimlane', swimlaneId);

// Track list
Meteor.call('positionHistory.trackList', listId);

// Track card
Meteor.call('positionHistory.trackCard', cardId);
```

#### Get Original Position Data
```javascript
// Get swimlane original position
Meteor.call('positionHistory.getSwimlaneOriginalPosition', swimlaneId);

// Get list original position
Meteor.call('positionHistory.getListOriginalPosition', listId);

// Get card original position
Meteor.call('positionHistory.getCardOriginalPosition', cardId);
```

#### Check if Entity Has Moved
```javascript
// Check if swimlane has moved
Meteor.call('positionHistory.hasSwimlaneMoved', swimlaneId);

// Check if list has moved
Meteor.call('positionHistory.hasListMoved', listId);

// Check if card has moved
Meteor.call('positionHistory.hasCardMoved', cardId);
```

#### Get Board History
```javascript
// Get all position history for a board
Meteor.call('positionHistory.getBoardHistory', boardId);

// Get position history by entity type
Meteor.call('positionHistory.getBoardHistoryByType', boardId, 'swimlane');
Meteor.call('positionHistory.getBoardHistoryByType', boardId, 'list');
Meteor.call('positionHistory.getBoardHistoryByType', boardId, 'card');
```

## Integration Examples

### 1. Add to Swimlane Template
```html
<template name="swimlane">
  <div class="swimlane">
    <!-- Existing swimlane content -->
    
    <!-- Add original position info -->
    {{> originalPosition entityId=_id entityType="swimlane"}}
  </div>
</template>
```

### 2. Add to List Template
```html
<template name="list">
  <div class="list">
    <!-- Existing list content -->
    
    <!-- Add original position info -->
    {{> originalPosition entityId=_id entityType="list"}}
  </div>
</template>
```

### 3. Add to Card Template
```html
<template name="card">
  <div class="card">
    <!-- Existing card content -->
    
    <!-- Add original position info -->
    {{> originalPosition entityId=_id entityType="card"}}
  </div>
</template>
```

### 4. Add Board-Level View
```html
<template name="board">
  <div class="board">
    <!-- Existing board content -->
    
    <!-- Add original positions view -->
    {{> originalPositionsView}}
  </div>
</template>
```

## Configuration

### 1. Enable/Disable Tracking
Position tracking is enabled by default. To disable it, comment out the tracking hooks in the model files:

```javascript
// In models/swimlanes.js, models/lists.js, models/cards.js
// Comment out the tracking hooks:
/*
Meteor.setTimeout(() => {
  const entity = Collection.findOne(doc._id);
  if (entity) {
    entity.trackOriginalPosition();
  }
}, 100);
*/
```

### 2. Customize Display
Modify the CSS files to customize the appearance:
- `client/components/common/originalPosition.css`
- `client/components/boards/originalPositionsView.css`

## Database Migration

No database migration is required. The system automatically creates the `PositionHistory` collection when first used.

## Performance Considerations

- Position tracking adds minimal overhead to entity creation
- Original position data is only stored once per entity
- Database indexes are created for efficient querying
- UI components use reactive data for real-time updates

## Troubleshooting

### 1. Original Position Not Showing
- Check if the entity has been created after the feature was implemented
- Verify that the position tracking hooks are enabled
- Check browser console for any JavaScript errors

### 2. Performance Issues
- Ensure database indexes are created (happens automatically on startup)
- Consider limiting the number of entities displayed in the board view
- Use the filter functionality to reduce the number of displayed items

### 3. Data Inconsistencies
- Original position data is only captured when entities are created
- Existing entities will not have original position data
- Use the refresh functionality to re-scan the board

## Future Enhancements

- Export original position data to CSV/JSON
- Bulk operations for managing original positions
- Integration with board templates
- Advanced filtering and search capabilities
- Position change notifications
- Historical position timeline view

## Support

For issues or questions about the original positions tracking feature, please:
1. Check the browser console for errors
2. Verify that all required files are present
3. Test with a new board to ensure the feature works correctly
4. Report issues with detailed error messages and steps to reproduce
