// Migration to fix due dates from v7.95 format to v8.20
// Issue: https://github.com/wekan/wekan/issues/6069

export default async function migrate() {
  console.log('=== Fixing v7.95 due date migration (Issue #6069) ===');
  
  // Get current user (assumes single user migration)
  const currentUser = await db.users.findOne({}, { _id: 1 });
  if (!currentUser) {
    console.error('ERROR: No users found. Please ensure at least one user exists.');
    return;
  }
  
  // Get default board for reference fixing
  const defaultBoard = await db.boards.findOne({ type: { $ne: "template-container" } });
  const defaultList = defaultBoard ? await db.lists.findOne({ boardId: defaultBoard._id }) : null;
  const defaultSwimlane = defaultBoard ? await db.swimlanes.findOne({ boardId: defaultBoard._id }) : null;
  
  // Fix cards with old dueDate format
  const cardsToFix = await db.cards.find({ dueDate: { $exists: true } }).toArray();
  console.log(`Found ${cardsToFix.length} cards to migrate`);
  
  let fixed = 0;
  for (const card of cardsToFix) {
    const updateDoc = {
      $rename: { "dueDate": "dueAt" },
      $set: {
        dueAt: new Date(card.dueDate),
        userId: currentUser._id,
        members: [currentUser._id],
        modifiedAt: new Date()
      }
    };
    
    // Fix invalid board reference
    const boardExists = await db.boards.findOne({ _id: card.boardId });
    if (!boardExists && defaultBoard) {
      updateDoc.$set.boardId = defaultBoard._id;
      if (defaultList) updateDoc.$set.listId = defaultList._id;
      if (defaultSwimlane) updateDoc.$set.swimlaneId = defaultSwimlane._id;
    }
    
    // Add swimlane if missing
    if (!card.swimlaneId && defaultSwimlane) {
      updateDoc.$set.swimlaneId = defaultSwimlane._id;
    }
    
    await db.cards.updateOne({ _id: card._id }, updateDoc);
    fixed++;
  }
  
  // Fix cards missing userId
  const cardsMissingUser = await db.cards.find({
    dueAt: { $exists: true },
    userId: { $exists: false }
  }).toArray();
  
  console.log(`Found ${cardsMissingUser.length} cards missing userId`);
  
  for (const card of cardsMissingUser) {
    await db.cards.updateOne(
      { _id: card._id },
      {
        $set: {
          userId: currentUser._id,
          members: [currentUser._id]
        }
      }
    );
  }
  
  const finalCount = await db.cards.countDocuments({
    dueAt: { $exists: true, $type: "date" },
    userId: { $exists: true }
  });
  
  console.log(`✅ Migration complete! ${finalCount} cards now have properly formatted due dates.`);
  console.log(`   Fixed ${fixed} cards with old dueDate format.`);
}
