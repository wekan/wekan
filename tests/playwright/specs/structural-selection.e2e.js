'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
function checklist(board, card, title) {
  const id = db.uid('check');
  db.insertOne('checklists', { _id: id, cardId: card._id, boardId: board.boardId, title, sort: 0, showChecklistAtMinicard: true, createdAt: new Date() });
  const itemId = db.uid('item');
  db.insertOne('checklistItems', { _id: itemId, cardId: card._id, boardId: board.boardId, checklistId: id, title: `${title} item`, sort: 0, isFinished: false });
  return { id, itemId };
}
async function move(page, board, selection, target) {
  return page.evaluate(async args => {
    try { return { result: await Meteor.callAsync('moveBoardObjects', ...args) }; }
    catch (error) { return { error: error.error, reason: error.reason }; }
  }, [board.boardId, selection, target]);
}
test('mixed checklist and loose item create one card; selected descendants move once', async ({ boardPage: page, board }) => {
  const a = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const b = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
  const first = checklist(board, a, 'Whole checklist'), loose = checklist(board, b, 'Loose');
  const count = db.countDocuments('cards', { boardId: board.boardId });
  const result = await move(page, board, [{ kind: 'checklist', id: first.id }, { kind: 'item', id: first.itemId }, { kind: 'item', id: loose.itemId }], { boardId: board.boardId, swimlaneId: board.swimlaneId, listId: board.listIds[2] });
  expect(result.error, JSON.stringify(result)).toBeUndefined();
  expect(result.result.moved).toBe(2);
  expect(db.countDocuments('cards', { boardId: board.boardId })).toBe(count + 1);
  for (const id of [first.itemId, loose.itemId]) expect(db.findOne('checklistItems', { _id: id }).cardId).toBe(result.result.cardId);
  expect(db.findOne('checklists', { _id: first.id }).cardId).toBe(result.result.cardId);
});
test('reject foreign selections, moving targets and inaccessible destinations before writes', async ({ boardPage: page, board, user2 }) => {
  const other = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['Private']] });
  const a = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  try {
    const denied = await move(page, board, [{ kind: 'card', id: a._id }], { boardId: other.boardId, swimlaneId: other.swimlaneId, listId: other.listIds[0] });
    expect(denied.error).toBe('not-authorized');
    const foreign = db.findOne('cards', { boardId: other.boardId });
    const target = { boardId: board.boardId, swimlaneId: board.swimlaneId, listId: board.listIds[1] };
    expect((await move(page, board, [{ kind: 'card', id: a._id }, { kind: 'card', id: foreign._id }], target)).error).toBe('invalid-selection');
    expect((await move(page, board, [{ kind: 'list', id: board.listIds[1] }], target)).error).toBe('invalid-destination');
    expect(db.findOne('cards', { _id: a._id }).listId).toBe(a.listId);
  } finally { db.cleanup({ boardIds: [other.boardId] }); }
});
test('mixed list, card and checklist move across boards at the selected position', async ({ boardPage: page, board, user }) => {
  const other = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['Anchor']] });
  const a = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const b = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
  const c = db.findOne('cards', { boardId: board.boardId, title: 'Gamma Card' });
  const check = checklist(board, c, 'Separate tasks');
  const anchor = db.findOne('cards', { boardId: other.boardId });
  try {
    const result = await move(page, board, [{ kind: 'list', id: board.listIds[0] }, { kind: 'card', id: a._id }, { kind: 'card', id: b._id }, { kind: 'checklist', id: check.id }], { boardId: other.boardId, swimlaneId: other.swimlaneId, listId: other.listIds[0], cardId: anchor._id, position: 'before' });
    expect(result.error, JSON.stringify(result)).toBeUndefined();
    expect(result.result.moved).toBe(3);
    expect(db.findOne('cards', { _id: a._id }).listId).toBe(board.listIds[0]);
    for (const id of [a._id, b._id]) expect(db.findOne('cards', { _id: id }).boardId).toBe(other.boardId);
    expect(db.findOne('cards', { _id: b._id }).sort).toBeLessThan(db.findOne('cards', { _id: anchor._id }).sort);
    expect(db.findOne('checklistItems', { _id: check.itemId }).cardId).toBe(anchor._id);
  } finally { db.cleanup({ boardIds: [other.boardId] }); }
});
for (const handles of [false, true]) test(`mixed checklist drag across swimlanes (handles ${handles})`, async ({ boardPage: page, board, user }) => {
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.showDesktopDragHandles': handles } });
  const laneId = db.uid('lane'), listId = db.uid('list');
  db.insertOne('swimlanes', { ...db.findOne('swimlanes', { _id: board.swimlaneId }), _id: laneId, title: 'Destination lane', sort: 1 });
  db.insertOne('lists', { ...db.findOne('lists', { _id: board.listIds[2] }), _id: listId, swimlaneId: laneId });
  await page.setViewportSize({ width: 1500, height: 1300 });
  const a = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const b = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
  const whole = checklist(board, a, 'Drag checklist'), loose = checklist(board, b, 'Loose tasks');
  await page.reload();
  await page.locator('.js-multiselection-activate').click();
  for (const kind of ['list', 'swimlane', 'checklist', 'item']) {
    const checkbox = page.locator(`.js-structural-selection[data-kind="${kind}"]`).first();
    await expect(checkbox).toBeVisible();
    const box = await checkbox.boundingBox();
    expect(Math.abs(box.width - box.height)).toBeLessThan(1);
  }
  for (const [kind, id] of [['checklist', whole.id], ['item', loose.itemId]]) {
    const checkbox = page.locator(`.js-structural-selection[data-kind="${kind}"][data-id="${id}"]`);
    await checkbox.click(); await expect(checkbox).toHaveAttribute('aria-checked', 'true');
  }
  const start = await page.locator('.minicard-checklist').filter({ hasText: 'Drag checklist' }).locator('.checklist-title').boundingBox();
  const target = await page.locator(`#js-list-${listId} .list-header`).boundingBox();
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 30 });
  await page.mouse.up();
  await expect.poll(() => db.findOne('checklists', { _id: whole.id }).cardId).not.toBe(a._id);
  const cardId = db.findOne('checklists', { _id: whole.id }).cardId;
  expect(db.findOne('checklistItems', { _id: loose.itemId }).cardId).toBe(cardId);
  expect(db.findOne('cards', { _id: cardId }).listId).toBe(listId);
  expect(db.findOne('cards', { _id: cardId }).swimlaneId).toBe(laneId);
});
test('moving a swimlane preserves nested lists and cards and leaves a source lane', async ({ boardPage: page, board, user }) => {
  const other = db.seedBoard({ ownerId: user.id });
  const a = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  try {
    const result = await move(page, board, [{ kind: 'swimlane', id: board.swimlaneId }, { kind: 'list', id: board.listIds[0] }, { kind: 'card', id: a._id }], { boardId: other.boardId, swimlaneId: other.swimlaneId, position: 'after' });
    expect(result.error, JSON.stringify(result)).toBeUndefined();
    expect(result.result.moved).toBe(1);
    expect(db.findOne('cards', { _id: a._id }).swimlaneId).toBe(board.swimlaneId);
    expect(db.findOne('cards', { _id: a._id }).boardId).toBe(other.boardId);
    expect(db.findOne('lists', { _id: board.listIds[0] }).boardId).toBe(other.boardId);
    expect(db.countDocuments('swimlanes', { boardId: board.boardId, archived: false })).toBeGreaterThan(0);
    expect(db.findOne('swimlanes', { _id: board.swimlaneId }).sort).toBeGreaterThan(db.findOne('swimlanes', { _id: other.swimlaneId }).sort);
  } finally { db.cleanup({ boardIds: [other.boardId] }); }
});
test('mixed selection popup selects another board and exact card position', async ({ boardPage: page, board, user }) => {
  const other = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['Anchor']] });
  const a = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const b = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
  const check = checklist(board, a, 'Popup tasks');
  try {
    await page.reload();
    await page.locator('.js-multiselection-activate').click();
    await page.locator(`.js-structural-selection[data-kind="checklist"][data-id="${check.id}"]`).click();
    await page.locator(`#js-list-${board.listIds[1]} .js-toggle-multi-selection`).click();
    await page.locator('.js-move-selection').click();
    const field = key => page.locator(`.js-object-destination[data-field="${key}"]`);
    await field('boardId').selectOption(other.boardId);
    await expect(field('swimlaneId').locator(`option[value="${other.swimlaneId}"]`)).toHaveCount(1);
    await field('swimlaneId').selectOption(other.swimlaneId);
    await expect(field('listId').locator(`option[value="${other.listIds[0]}"]`)).toHaveCount(1);
    await field('listId').selectOption(other.listIds[0]);
    const anchor = db.findOne('cards', { boardId: other.boardId });
    await expect(field('cardId').locator(`option[value="${anchor._id}"]`)).toHaveCount(1);
    await field('cardId').selectOption(anchor._id);
    await page.locator('.js-object-position').selectOption('after');
    await page.locator('.js-move-objects').click();
    await expect.poll(() => db.findOne('cards', { _id: b._id }).boardId).toBe(other.boardId);
    expect(db.findOne('cards', { _id: b._id }).sort).toBeGreaterThan(db.findOne('cards', { _id: anchor._id }).sort);
    expect(db.findOne('checklists', { _id: check.id }).cardId).toBe(anchor._id);
  } finally { db.cleanup({ boardIds: [other.boardId] }); }
});
test('read-only members cannot use mixed moves or see selection checkboxes', async ({ boardPage: page, board, user }) => {
  const a = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { members: [{ userId: user.id, isActive: true, isAdmin: false, isReadOnly: true }] } });
  await page.reload();
  const result = await move(page, board, [{ kind: 'card', id: a._id }], { boardId: board.boardId, swimlaneId: board.swimlaneId, listId: board.listIds[1] });
  expect(result.error).toBe('not-authorized');
  expect(db.findOne('cards', { _id: a._id }).listId).toBe(a.listId);
  await expect(page.locator('.js-structural-selection')).toHaveCount(0);
});
for (const collapsed of ['list', 'shared-list', 'card', 'checklist', 'swimlane']) {
  test(`mixed drag resolves the correct collapsed ${collapsed} destination`, async ({ boardPage: page, board }) => {
    await page.setViewportSize({ width: 1500, height: 1500 });
    const a = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    const b = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
    const source = checklist(board, a, 'Folded source'), loose = checklist(board, b, 'Selected loose');
    const laneId = db.uid('lane'), listId = db.uid('list'), cardId = db.uid('card');
    const neighborId = db.uid('lane');
    const lane = db.findOne('swimlanes', { _id: board.swimlaneId });
    db.insertOne('swimlanes', { ...lane, _id: neighborId, title: 'Collapsed neighbor', sort: 1 });
    db.insertOne('swimlanes', { ...lane, _id: laneId, title: 'Collapsed target', sort: 2 });
    db.insertOne('lists', { ...db.findOne('lists', { _id: board.listIds[2] }), _id: listId, swimlaneId: collapsed === 'shared-list' ? '' : laneId });
    const targetCard = { ...a, _id: cardId, listId, swimlaneId: laneId, title: 'Destination card' };
    db.insertOne('cards', targetCard);
    const targetCheck = checklist(board, targetCard, 'Destination checklist');
    await page.reload();
    const laneHeader = title => page.locator('.js-swimlane-header').filter({ hasText: title });
    await laneHeader('Collapsed neighbor').locator('.js-collapse-swimlane').click();
    await expect(page.locator(`#swimlane-${neighborId}`)).toHaveCount(0);
    const targetList = page.locator(`#swimlane-${laneId} #js-list-${listId}`);
    const targetMini = targetList.locator('.js-minicard');
    if (['list', 'shared-list'].includes(collapsed)) await targetList.locator('.js-collapse').click();
    if (collapsed === 'card') await targetMini.locator('.js-collapse-minicard').click();
    if (collapsed === 'checklist') await targetMini.locator('.js-collapse-checklist').click();
    if (collapsed === 'swimlane') await laneHeader('Collapsed target').locator('.js-collapse-swimlane').click();
    if (collapsed === 'swimlane') await expect(page.locator(`#swimlane-${laneId}`)).toHaveCount(0);
    if (['list', 'shared-list'].includes(collapsed)) await expect(targetList).toHaveClass(/list-collapsed/);
    if (collapsed === 'card') await expect(targetMini.locator('.minicard')).toHaveClass(/minicard-collapsed/);
    if (collapsed === 'checklist') await expect(targetMini.locator('.js-checklist-items')).toHaveCount(0);
    await page.locator('.js-multiselection-activate').click();
    for (const [kind, id] of [['checklist', source.id], ['item', loose.itemId]]) {
      await page.locator(`.js-structural-selection[data-kind="${kind}"][data-id="${id}"]`).click();
    }
    // Hidden selected descendants must remain in the group when their UI folds.
    const sourceCheck = page.locator('.minicard-checklist').filter({ hasText: 'Folded source' });
    await sourceCheck.locator('.js-collapse-checklist').click();
    await page.locator('.minicard-checklist').filter({ hasText: 'Selected loose' }).locator('.js-collapse-checklist').click();
    await expect(sourceCheck.locator('.js-checklist-items')).toHaveCount(0);
    await expect(page.locator('.minicard-checklist').filter({ hasText: 'Selected loose' }).locator('.js-checklist-items')).toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath('collapsed-selection.png') });
    const from = await sourceCheck.locator('.checklist-title').boundingBox();
    const target = collapsed === 'swimlane' ? laneHeader('Collapsed target') : ['list', 'shared-list'].includes(collapsed) ? targetList.locator('.list-header') : collapsed === 'card' ? targetMini.locator('.minicard-title') : targetMini.locator('.checklist-title');
    const to = await target.boundingBox();
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 30 });
    await page.mouse.up();
    if (collapsed === 'swimlane') {
      // A lane alone does not identify a list: ask for that missing parent,
      // retaining the actual dropped-on lane rather than guessing a neighbor.
      const field = key => page.locator(`.js-object-destination[data-field="${key}"]`);
      await expect(field('swimlaneId')).toHaveValue(laneId);
      expect(db.findOne('checklists', { _id: source.id }).cardId).toBe(a._id);
      await field('listId').selectOption(listId);
      await page.locator('.js-move-objects').click();
    }
    await expect.poll(() => db.findOne('checklists', { _id: source.id }).cardId).not.toBe(a._id);
    const movedCardId = db.findOne('checklists', { _id: source.id }).cardId;
    const movedCard = db.findOne('cards', { _id: movedCardId });
    expect(movedCard.listId).toBe(listId);
    expect(movedCard.swimlaneId).toBe(laneId);
    expect(db.findOne('checklistItems', { _id: loose.itemId }).cardId).toBe(movedCardId);
    if (['card', 'checklist'].includes(collapsed)) expect(movedCardId).toBe(cardId);
    if (collapsed === 'checklist') expect(db.findOne('checklistItems', { _id: loose.itemId }).checklistId).toBe(targetCheck.id);
    expect(db.findOne('cards', { _id: a._id }).listId).toBe(board.listIds[0]);
    expect(db.findOne('cards', { _id: b._id }).listId).toBe(board.listIds[1]);
    await page.reload();
    expect(db.findOne('checklists', { _id: source.id }).cardId).toBe(movedCardId);
  });
}
for (const kind of ['list', 'swimlane', 'card']) {
  test(`drag a collapsed selected ${kind} together with an independent checklist item`, async ({ boardPage: page, board }) => {
    await page.setViewportSize({ width: 1500, height: 1700 });
    const original = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    const loose = checklist(board, original, 'Independent item');
    const lane = db.findOne('swimlanes', { _id: board.swimlaneId });
    const list = db.findOne('lists', { _id: board.listIds[0] });
    const sourceLane = db.uid('lane'), destinationLane = db.uid('lane');
    const sourceList = db.uid('list'), destinationList = db.uid('list'), sourceCard = db.uid('card');
    db.insertMany('swimlanes', [{ ...lane, _id: sourceLane, title: 'Fold source', sort: 1 }, { ...lane, _id: destinationLane, title: 'Drop target', sort: 2 }]);
    db.insertMany('lists', [{ ...list, _id: sourceList, swimlaneId: sourceLane }, { ...list, _id: destinationList, swimlaneId: destinationLane }]);
    db.insertOne('cards', { ...original, _id: sourceCard, listId: sourceList, swimlaneId: sourceLane, title: 'Folded card' });
    await page.reload();
    await page.locator('.js-multiselection-activate').click();
    const header = page.locator('.js-swimlane-header').filter({ hasText: 'Fold source' });
    const listNode = page.locator(`#js-list-${sourceList}`), mini = listNode.locator('.js-minicard');
    if (kind === 'card') await mini.locator('.js-collapse-minicard').click();
    if (kind === 'list') await listNode.locator('.js-collapse').click();
    if (kind === 'swimlane') await header.locator('.js-collapse-swimlane').click();
    if (kind === 'card') await mini.locator('.js-toggle-multi-selection').click();
    else await page.locator(`.js-structural-selection[data-kind="${kind}"][data-id="${kind === 'list' ? sourceList : sourceLane}"]`).click();
    await page.locator(`.js-structural-selection[data-kind="item"][data-id="${loose.itemId}"]`).click();
    if (kind === 'list') await expect(listNode).toHaveClass(/list-collapsed/);
    if (kind === 'swimlane') await expect(page.locator(`#swimlane-${sourceLane}`)).toHaveCount(0);
    if (kind === 'card') await expect(mini.locator('.minicard')).toHaveClass(/minicard-collapsed/);
    const handle = kind === 'card' ? mini.locator('.minicard-title') : kind === 'list' ? listNode.locator('.list-header-name') : header;
    const from = await handle.boundingBox(), to = await page.locator(`#js-list-${destinationList} .list-header`).boundingBox();
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height - 2, { steps: 30 });
    await page.mouse.up();
    await expect.poll(() => db.findOne('checklistItems', { _id: loose.itemId }).cardId).not.toBe(original._id);
    const newCard = db.findOne('cards', { _id: db.findOne('checklistItems', { _id: loose.itemId }).cardId });
    expect(newCard.listId).toBe(destinationList);
    expect(newCard.swimlaneId).toBe(destinationLane);
    const moved = db.findOne('cards', { _id: sourceCard });
    expect(moved.listId).toBe(kind === 'card' ? destinationList : sourceList);
    expect(moved.swimlaneId).toBe(kind === 'swimlane' ? sourceLane : destinationLane);
    if (kind === 'swimlane') expect(db.findOne('swimlanes', { _id: sourceLane }).sort).toBeGreaterThan(db.findOne('swimlanes', { _id: destinationLane }).sort);
  });
}
