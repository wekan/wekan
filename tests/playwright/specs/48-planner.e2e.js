'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test.describe('Personal Planner', () => {
  test('keeps slots personal, preserves dueAt, and supports focus/range UI', async ({
    page,
    user,
    user2,
    board,
  }) => {
    const cardId = db.findCardIdByTitle({
      boardId: board.boardId,
      title: 'Alpha Card',
    });
    const dueAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    db.updateOne('cards', { _id: cardId }, {
      $set: { dueAt, assignees: [user.id] },
    });

    await loginWithToken(page, user2.id, user2.token);
    const denied = await page.evaluate(
      args => Meteor.callAsync(
        'planner.assignCardSlot',
        args.cardId,
        new Date(args.startsAt),
        60,
      ).then(() => 'allowed').catch(error => error.error || error.reason),
      {
        cardId,
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    );
    expect(denied).toBe('not-authorized');

    await loginWithToken(page, user.id, user.token);
    await page.goto(`${BASE_URL}/planner`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /Planner|Lịch cá nhân/ }))
      .toBeVisible({ timeout: 15_000 });
    const card = page.locator('.planner-card', { hasText: 'Alpha Card' }).first();
    await expect(card).toBeVisible();
    await page.evaluate(id => {
      const cardElement = document.querySelector(
        `.planner-card[data-card-id="${id}"]`,
      );
      const slotElement = document.querySelector('.planner-time-slot');
      const dataTransfer = new DataTransfer();
      cardElement.dispatchEvent(new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      }));
      slotElement.dispatchEvent(new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      }));
      slotElement.dispatchEvent(new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      }));
    }, cardId);
    await expect(page.getByText(/scheduled without changing|không đổi ngày đến hạn/i))
      .toBeVisible();

    const storedCard = db.findOne('cards', { _id: cardId });
    expect(new Date(storedCard.dueAt).toISOString()).toBe(dueAt.toISOString());
    await expect.poll(() => {
      const storedUser = db.findOne('users', { _id: user.id });
      return storedUser?.profile?.plannerCardSlots?.[cardId];
    }).toBeTruthy();

    await page.locator('.js-planner-focus-title').fill('Planner E2E focus');
    await page.locator('.js-planner-focus-start').fill(
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    );
    await page.locator('.js-planner-focus-duration').fill('90');
    await page.locator('.js-planner-focus-form button[type="submit"]').click();
    await expect(page.getByText('Planner E2E focus')).toBeVisible();

    await page.locator('.js-planner-range[data-range="7"]').click();
    await expect(page.locator('.planner-days')).toHaveClass(/is-range-7/);
    await expect(page.locator('.js-planner-board')).toBeVisible();

    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    const mobileLayout = await page.locator('.planner-days').evaluate(element => {
      const firstDay = element.querySelector('.planner-day');
      const style = getComputedStyle(element);
      return {
        dayCount: element.querySelectorAll('.planner-day').length,
        display: style.display,
        overflowX: style.overflowX,
        firstDayWidth: firstDay.getBoundingClientRect().width,
      };
    });
    expect(mobileLayout.dayCount).toBe(7);
    expect(mobileLayout.display).toBe('flex');
    expect(mobileLayout.overflowX).toBe('auto');
    expect(mobileLayout.firstDayWidth).toBeLessThan(360);
  });
});
