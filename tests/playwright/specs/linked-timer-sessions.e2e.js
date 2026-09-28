'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');
for (const type of ['cardType-linkedCard', 'cardType-linkedBoard']) {
  test(`${type} keeps live timer state local and credits the current source total`, async ({ boardPage: page, board }) => {
    page.on('pageerror', error => console.log('TIMER PAGE ERROR', error.message));
    const cards = db.find('cards', { boardId: board.boardId });
    const [wrapper, source] = cards;
    db.updateOne('boards', { _id: board.boardId }, { $set: { allowsFlowtime: true, allowsPomodoro: true, spentTime: 4 } });
    db.updateOne('cards', { _id: source._id }, { $set: { spentTime: 4 } });
    db.updateOne('cards', { _id: wrapper._id }, { $set: { type, linkedId: type === 'cardType-linkedCard' ? source._id : board.boardId, spentTime: 999 } });
    const total = () => type === 'cardType-linkedCard' ? db.getCard(source._id).spentTime : db.findOne('boards', { _id: board.boardId }).spentTime;
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/${wrapper._id}`);
    await page.locator('.js-start-flow').click();
    await expect.poll(() => !!db.getCard(wrapper._id).flowStartAt).toBe(true);
    expect(db.getCard(source._id).flowStartAt).toBeFalsy();
    await page.locator('.js-add-flow-interruption').click();
    await expect.poll(() => db.getCard(wrapper._id).flowInterruptions).toBe(1);
    // Accelerate the persisted clock, rather than waiting an hour in the test.
    db.updateOne('cards', { _id: wrapper._id }, { $set: { flowStartAt: new Date(Date.now() - 3600000) } });
    await expect(page.locator('.flow-elapsed')).toHaveText(/01:00:/);
    await page.locator('.js-stop-flow').click();
    await expect.poll(() => db.getCard(wrapper._id).flowStartAt).toBeFalsy();
    expect(total()).toBeGreaterThanOrEqual(5); expect(total()).toBeLessThan(5.1);
    await page.locator('.js-pomodoro-work-minutes').fill('30');
    await page.locator('.js-start-pomodoro').click();
    await expect.poll(() => db.getCard(wrapper._id).pomodoroPhase).toBe('work');
    expect(db.getCard(source._id).pomodoroStartAt).toBeFalsy();
    db.updateOne('cards', { _id: wrapper._id }, { $set: { pomodoroStartAt: new Date(Date.now() - 31 * 60000) } });
    await expect.poll(() => db.getCard(wrapper._id).pomodoroPhase).toBe('break');
    expect(total()).toBeGreaterThanOrEqual(5.5); expect(total()).toBeLessThan(5.6);
    const beforeBreakStop = total();
    await page.locator('.js-stop-pomodoro').click();
    await expect.poll(() => db.getCard(wrapper._id).pomodoroStartAt).toBeFalsy();
    expect(total()).toBe(beforeBreakStop);
    expect(db.getCard(wrapper._id).spentTime).toBe(999);
  });
}
