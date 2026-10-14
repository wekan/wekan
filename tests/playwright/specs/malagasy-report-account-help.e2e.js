'use strict';
const { test, expect } = require('../fixtures');
const strings = require('../../../imports/i18n/data/mg.i18n.json');
for (const [slug, key, essential] of [
  ['aging-wip', 'agingWip', 'dimy farafahakeliny'],
  ['blocker-analysis', 'blockerAnalysis', 'Isaina misaraka ny antony mifanindry'],
  ['monte-carlo', 'monteCarlo', 'tsy antoka izany'],
  ['process-behavior', 'processBehavior', 'roa farafahakeliny'],
  ['size-cycle-time', 'sizeCycleTime', 'daty tsy manan-kery'],
]) {
  test(`Malagasy ${slug} explains methodology and limits`, async ({ boardPage: page }) => {
    await page.evaluate(() => Meteor.callAsync('setLanguage', 'mg'));
    await page.locator('.js-toggle-board-view').first().click();
    await expect(page.locator(`.pop-over .js-open-${slug}-view`)).toContainText(strings[`board-view-${slug}`]);
    await page.locator(`.pop-over .js-open-${slug}-view`).click();
    const note = page.locator('.chart-view-content .chart-method-note');
    await expect(note).toHaveText(strings[`flow-note-${key}`]);
    await expect(note).toContainText(essential);
    await expect(note).not.toContainText(/→|≥|≤|✓|MR̄/);
  });
}
test('Malagasy account anonymization explains permanent effects', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'mg');
    Popup.close();
    Popup.open('userAnonymize')({ currentTarget: document.body, target: document.body, preventDefault() {} });
  });
  const popup = page.locator('.js-pop-over');
  await expect(popup.locator('.header-title')).toHaveText(strings['anonymize-account']);
  for (const text of ['sakanana ny fidirana', 'mitazona ny tantarany', 'Tsy azo foanana']) await expect(popup).toContainText(text);
  await expect(popup).not.toContainText('fanondranana');
  await page.evaluate(() => Popup.close());
});


test('Malagasy time adjustments explain corrections and attribution limits', async ({ boardPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'mg'));
  await page.locator('.js-toggle-board-view').first().click();
  await page.locator('.pop-over .js-open-time-view').click();
  const section = page.locator('.time-adjustments');
  await expect(section).toContainText(strings['time-adjustments']);
  await expect(section.locator(':scope > p')).toHaveText(strings['time-adjustment-note']);
  await expect(section).toContainText('Tsy fotoam-piasana tsirairay ireo');
  await expect(section).toContainText('Fanitsiana ny sanda miiba');
  await expect(section).not.toContainText('Δ');
});

test('Malagasy card recurrence is distinct from resetting a card', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'mg');
    Popup.close();
    Popup.open('cardRecurrenceInterval')({
      currentTarget: document.body, target: document.body, preventDefault() {},
    });
  });
  const popup = page.locator('.js-pop-over');
  await expect(popup.locator('.header-title')).toHaveText('Fiverimberenan’ny karatra');
  await expect(popup.locator('[data-interval="none"]')).toContainText('tsy miverimberina ho azy ny karatra');
  await expect(popup).not.toContainText('voalohany');
  await page.evaluate(() => Popup.close());
});

test('Malagasy move reason is explicitly optional and header toggle retains its scope', async ({ boardPage: page, board }) => {
  const db = require('../helpers/db');
  const source = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  await page.evaluate(async source => {
    await Meteor.callAsync('setLanguage', 'mg');
    Popup.close();
    Popup.open('moveCard', { dataContext: source })({
      currentTarget: document.body, target: document.body, preventDefault() {},
    });
  }, source);
  const label = page.locator('label[for="move-card-reason"]');
  await expect(label).toHaveText('Antony famindrana (tsy voatery)');
  await expect(label).not.toContainText('Famaritana');
  await expect(page.locator('#move-card-reason')).toBeEmpty();
  await page.evaluate(() => Popup.close());
  await expect(page.locator('.js-toggle-header-icons-collapsed')).toHaveAttribute('title', strings['toggle-header-icons-collapsed']);
});
