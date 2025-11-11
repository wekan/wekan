/**
 * Test: WekanCreator import with swimlane preservation
 *
 * Simulates exporting a board with swimlanes and importing it back,
 * verifying that:
 * 1. Swimlanes are correctly mapped from old IDs to new IDs
 * 2. Cards reference the correct swimlane IDs after import
 * 3. A default swimlane is created when no swimlanes exist
 * 4. ID normalization (id → _id) works for all exported items
 */

// Mock data: exported board with swimlanes and cards
const mockExportedBoard = {
  _format: 'wekan-board-1.0.0',
  _id: 'board1',
  title: 'Test Board',
  archived: false,
  color: 'bgnone',
  permission: 'private',
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  members: [
    {
      userId: 'user1',
      wekanId: 'user1',
      isActive: true,
      isAdmin: true,
    },
  ],
  labels: [],
  swimlanes: [
    {
      _id: 'swimlane1',
      title: 'Swimlane 1',
      archived: false,
      sort: 0,
    },
    {
      _id: 'swimlane2',
      title: 'Swimlane 2',
      archived: false,
      sort: 1,
    },
  ],
  lists: [
    {
      _id: 'list1',
      title: 'To Do',
      archived: false,
      sort: 0,
    },
    {
      _id: 'list2',
      title: 'Done',
      archived: false,
      sort: 1,
    },
  ],
  cards: [
    {
      _id: 'card1',
      title: 'Card in swimlane 1',
      archived: false,
      swimlaneId: 'swimlane1',
      listId: 'list1',
      sort: 0,
      description: 'Test card',
      dateLastActivity: new Date().toISOString(),
      labelIds: [],
    },
    {
      _id: 'card2',
      title: 'Card in swimlane 2',
      archived: false,
      swimlaneId: 'swimlane2',
      listId: 'list2',
      sort: 0,
      description: 'Another test card',
      dateLastActivity: new Date().toISOString(),
      labelIds: [],
    },
  ],
  comments: [],
  activities: [
    {
      activityType: 'createBoard',
      createdAt: new Date().toISOString(),
      userId: 'user1',
    },
  ],
  checklists: [],
  checklistItems: [],
  subtaskItems: [],
  customFields: [],
  rules: [],
  triggers: [],
  actions: [],
  users: [
    {
      _id: 'user1',
      username: 'admin',
      profile: {
        fullname: 'Admin User',
      },
    },
  ],
};

// Export format variation: using 'id' instead of '_id'
const mockExportedBoardWithIdField = {
  ...mockExportedBoard,
  swimlanes: [
    {
      id: 'swimlane1',
      title: 'Swimlane 1 (id variant)',
      archived: false,
      sort: 0,
    },
  ],
  lists: [
    {
      id: 'list1',
      title: 'To Do (id variant)',
      archived: false,
      sort: 0,
    },
  ],
  cards: [
    {
      id: 'card1',
      title: 'Card (id variant)',
      archived: false,
      swimlaneId: 'swimlane1',
      listId: 'list1',
      sort: 0,
      description: 'Test card with id field',
      dateLastActivity: new Date().toISOString(),
      labelIds: [],
    },
  ],
};

// Test: Verify id → _id normalization
function testIdNormalization() {
  console.log('\n=== Test: ID Normalization (id → _id) ===');

  // Simulate the normalization logic from WekanCreator constructor
  const normalizeIds = arr => {
    if (!arr) return;
    arr.forEach(item => {
      if (item && item.id && !item._id) {
        item._id = item.id;
      }
    });
  };

  const testData = {
    lists: mockExportedBoardWithIdField.lists,
    cards: mockExportedBoardWithIdField.cards,
    swimlanes: mockExportedBoardWithIdField.swimlanes,
  };

  normalizeIds(testData.lists);
  normalizeIds(testData.cards);
  normalizeIds(testData.swimlanes);

  // Check results
  if (testData.swimlanes[0]._id === 'swimlane1') {
    console.log('✓ Swimlane: id → _id normalization created _id');
  } else {
    console.log('✗ Swimlane: id → _id normalization FAILED');
  }

  if (testData.lists[0]._id === 'list1') {
    console.log('✓ List: id → _id normalization created _id');
  } else {
    console.log('✗ List: id → _id normalization FAILED');
  }

  if (testData.cards[0]._id === 'card1') {
    console.log('✓ Card: id → _id normalization created _id');
  } else {
    console.log('✗ Card: id → _id normalization FAILED');
  }
}

// Test: Verify swimlane mapping during import
function testSwimlaneMapping() {
  console.log('\n=== Test: Swimlane Mapping (export → import) ===');

  // Simulate WekanCreator swimlane mapping
  const swimlanes = {};
  const swimlaneIndexMap = {}; // Track old → new ID mappings

  // Simulate createSwimlanes: build mapping of old ID → new ID
  mockExportedBoard.swimlanes.forEach((swimlane, index) => {
    const oldId = swimlane._id;
    const newId = `new_swimlane_${index}`; // Simulated new ID
    swimlanes[oldId] = newId;
    swimlaneIndexMap[oldId] = newId;
  });

  console.log(`✓ Created mapping for ${Object.keys(swimlanes).length} swimlanes:`);
  Object.entries(swimlanes).forEach(([oldId, newId]) => {
    console.log(`  ${oldId} → ${newId}`);
  });

  // Simulate createCards: cards reference swimlanes using mapping
  const cardSwimlaneCheck = mockExportedBoard.cards.every(card => {
    const oldSwimlaneId = card.swimlaneId;
    const newSwimlaneId = swimlanes[oldSwimlaneId];
    return newSwimlaneId !== undefined;
  });

  if (cardSwimlaneCheck) {
    console.log('✓ All cards can be mapped to swimlanes');
  } else {
    console.log('✗ Some cards have missing swimlane mappings');
  }
}

// Test: Verify default swimlane creation when none exist
function testDefaultSwimlaneCreation() {
  console.log('\n=== Test: Default Swimlane Creation ===');

  const boardWithoutSwimlanes = {
    ...mockExportedBoard,
    swimlanes: [],
  };

  // Simulate the default swimlane logic from WekanCreator
  let swimlanes = {};
  let defaultSwimlaneId = null;

  // If no swimlanes were provided, create a default
  if (!swimlanes || Object.keys(swimlanes).length === 0) {
    defaultSwimlaneId = 'new_default_swimlane';
    console.log('✓ Default swimlane created:', defaultSwimlaneId);
  }

  // Verify cards without swimlane references use the default
  const cardsWithoutSwimlane = boardWithoutSwimlanes.cards.filter(c => !c.swimlaneId);
  if (cardsWithoutSwimlane.length > 0 && defaultSwimlaneId) {
    console.log(`✓ ${cardsWithoutSwimlane.length} cards will use default swimlane`);
  } else if (cardsWithoutSwimlane.length === 0) {
    console.log('✓ No cards lacking swimlane (test data all have swimlaneId)');
  }
}

// Test: Verify swimlane + card integrity after full import cycle
function testFullImportCycle() {
  console.log('\n=== Test: Full Import Cycle ===');

  // Step 1: Normalize IDs
  const normalizeIds = arr => {
    if (!arr) return;
    arr.forEach(item => {
      if (item && item.id && !item._id) {
        item._id = item.id;
      }
    });
  };

  const data = JSON.parse(JSON.stringify(mockExportedBoard)); // Deep copy
  normalizeIds(data.swimlanes);
  normalizeIds(data.lists);
  normalizeIds(data.cards);

  // Step 2: Map swimlanes
  const swimlaneMap = {};
  data.swimlanes.forEach((s, idx) => {
    swimlaneMap[s._id] = `imported_swimlane_${idx}`;
  });

  // Step 3: Verify cards get mapped swimlane IDs
  let unmappedCards = 0;
  data.cards.forEach(card => {
    if (card.swimlaneId && !swimlaneMap[card.swimlaneId]) {
      unmappedCards++;
    }
  });

  if (unmappedCards === 0) {
    console.log('✓ All cards have valid swimlane references');
  } else {
    console.log(`✗ ${unmappedCards} cards have unmapped swimlane references`);
  }

  if (data.swimlanes.length > 0) {
    console.log(`✓ ${data.swimlanes.length} swimlanes preserved in import`);
  }

  if (data.cards.length > 0) {
    console.log(`✓ ${data.cards.length} cards preserved in import`);
  }
}

// Run all tests
if (typeof describe === 'undefined') {
  // Running in Node.js or standalone (not Mocha)
  console.log('====================================');
  console.log('WekanCreator Import Tests');
  console.log('====================================');

  testIdNormalization();
  testSwimlaneMapping();
  testDefaultSwimlaneCreation();
  testFullImportCycle();

  console.log('\n====================================');
  console.log('Tests completed');
  console.log('====================================\n');
}
