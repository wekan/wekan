'use strict';
const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test('Southern Sotho titles distinguish card labels and account anonymization', async ({ boardPage: page, board }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'st'));
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const card = new CardPage(page);
  await card.waitForOpen();
  await card.openLabelSelector();
  const title = page.locator('.js-pop-over .header-title');
  await expect(title).toHaveText('Dileibole');
  await expect(title).not.toHaveText('Ditlhaku');
  // Render the confirmation only; never confirm the account mutation.
  await page.evaluate(() => {
    Popup.close();
    Popup.open('userAnonymize')({ currentTarget: document.body, target: document.body, preventDefault() {} });
  });
  await expect(title).toHaveText('Pata boitsebiso ba akhaonto');
  await expect(title).not.toContainText('kenngwang');
  const warning = page.locator('.js-pop-over');
  await expect(warning).toContainText('se thibela ho kena');
  await expect(warning).toContainText('di boloka nalane');
  await expect(warning).toContainText('e ke ke ya etsollwa');
  await expect(warning).not.toContainText('ho ntsha boto');

  await page.evaluate(() => Popup.close());
});


test('Southern Sotho archive help points to All Boards', async ({ boardPage: page }) => {
  await page.evaluate(() => {
    return Meteor.callAsync('setLanguage', 'st');
  });
  await page.evaluate(() => {
    Popup.open('archiveBoard')({ currentTarget: document.body, target: document.body, preventDefault() {} });
  });
  const popup = page.locator('.js-pop-over');
  await expect(popup).toContainText('Polokelo');
  await expect(popup).toContainText('leqepheng la Diboto tsohle');
  await expect(popup).not.toContainText('hloohong ya leqephe la lapeng');
  // Inspect the help without confirming the archive operation.
  await page.evaluate(() => Popup.close());
});


test('Southern Sotho card linking names the destination without claiming the current board', async ({ boardPage: page, board }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'st'));
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const card = new CardPage(page);
  await card.waitForOpen();
  await card.openActionsMenu();
  const action = page.locator('.js-pop-over .js-link-card-to-board');
  await expect(action).toHaveText('Hokela botong');
  await expect(action).not.toContainText('ena');
  await page.evaluate(() => Popup.close());
});


test('Southern Sotho card settings identify data fields', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'st');
    Popup.open('boardCardSettings').call({ currentData: () => ({}) }, { currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  // Board Settings / Card is Card Settings (cardSettingsInline): the pane's
  // "Card field order" heading went with the pane. What names the card's data
  // fields now is "Show" and its two sides, the sections' titles, and Card's
  // hamburger (whose "Show empty fields" was removed 2026-10-28; Ask for a
  // reason is what is left there) - each in Southern Sotho, and none calling
  // a data field "masimo" (farm fields).
  const popup = page.locator('.js-pop-over[data-popup="boardCardSettingsPopup"]');
  // Two panes since 2026-10-28 instead of a "Show" radio: each pane's title is
  // what the radio's option said.
  const sides = popup.locator('.card-settings-pane-title');
  await expect(sides.nth(0)).toHaveText('Bontsha kareteng e nyenyane');
  await expect(sides.nth(1)).toHaveText('Bontsha kareteng');
  const card = popup.locator('.js-card-settings-pane[data-side="card"]');
  await expect(card.locator('.js-card-settings-section[data-section="date"] .card-settings-inline-section-title')).toHaveText('Letsatsi');
  await expect(popup.locator('.js-card-settings-panes')).not.toContainText('masimo');
  await card.locator('.js-card-settings-section[data-section="card"] .js-open-card-settings-section-menu').click();
  // The hamburger opens under its line, inside the pane (no popup layer).
  const menu = card.locator('.js-card-settings-section[data-section="card"] .js-card-settings-panel');
  await expect(menu.locator('.js-ask-move-reason')).toBeVisible();
  await expect(menu).not.toContainText('masimo');
  await expect(menu.locator('.js-show-empty-card-fields')).toHaveCount(0);
  await page.evaluate(() => Popup.close());
});


test('Southern Sotho workflow format automatically detects rather than learns', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'st');
    Popup.open('rulesImportExport')({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  const option = page.locator('.js-pop-over .js-workflow-format option[value="auto"]');
  await expect(option).toHaveText('Lemoha ka boiketsetso');
  await expect(option).not.toContainText('Ithute');
  await expect(page.locator('.js-pop-over .js-rules-import-text')).toBeEmpty();
  await page.evaluate(() => Popup.close());
});


test('Southern Sotho due-card view translates the short personal filter', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'st');
    Popup.open('dueCardsViewChange')({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  const option = page.locator('.js-pop-over .js-due-cards-view-me');
  await expect(option).toHaveText('Nna');
  await expect(option).not.toHaveText('Me');
  await page.evaluate(() => Popup.close());
});


test('Southern Sotho checklist copying identifies the template source', async ({ boardPage: page, board }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'st'));
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const card = new CardPage(page);
  await card.waitForOpen();
  const action = card.root.locator('.js-copy-checklist-from-template');
  await expect(action).toHaveAttribute('title', 'Kopitsa lenane la tlhahlobo ho tswa thempleiteng');
  await action.click();
  const title = page.locator('.js-pop-over .header-title');
  await expect(title).toHaveText('Kopitsa lenane la tlhahlobo ho tswa thempleiteng');
  await expect(title).not.toContainText('Mohlala');
  // Inspect only; do not choose a template or copy its contents.
  await page.evaluate(() => Popup.close());
});


test('Southern Sotho card recurrence uses repetition rather than checklist reset', async ({ boardPage: page, board }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'st'));
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const card = new CardPage(page);
  await card.waitForOpen();
  await card.openActionsMenu();
  await page.locator('.js-pop-over .js-set-card-recurrence-interval').click();
  await expect(page.locator('.js-pop-over .header-title')).toHaveText('Ho ipheta ha karete');
  const off = page.locator('.js-pop-over .js-set-card-recurrence[data-interval="none"]');
  await expect(off).toContainText('karete ha e iphete ka boiketsetso');
  await expect(off).not.toContainText('setwe botjha');
  await page.evaluate(() => Popup.close());
});


test('Haitian account anonymization warns about permanent changes and retained history', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'ht');
    Popup.close();
    Popup.open('userAnonymize')({ currentTarget: document.body, target: document.body, preventDefault() {} });
  });
  const popup = page.locator('.js-pop-over');
  await expect(popup.locator('.header-title')).toHaveText('Rann kont lan anonim');
  await expect(popup).toContainText('non itilizatè a, non konplè li ak adrès imèl li pou tout tan');
  await expect(popup).toContainText('retire avatar la epi dezaktive koneksyon');
  await expect(popup).toContainText('tablo, kat ak kòmantè yo konsève istorik yo');
  await expect(popup).toContainText('toujou montre kont sa a, men li anonim');
  await expect(popup).toContainText('Aksyon sa a pa ka defèt.');
  await expect(popup).not.toContainText('Fichye ekspòte');
  await expect(popup).not.toContainText('Li dezaktive pa defo.');
  // Inspect the warning without confirming an account mutation.
  await page.evaluate(() => Popup.close());
});

test('Haitian card actions identify destination linking and creation from a card', async ({ boardPage: page, board }) => {
  const db = require('../helpers/db');
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'ht'));
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const card = new CardPage(page);
  await card.waitForOpen();
  await card.openActionsMenu();
  const action = page.locator('.js-pop-over .js-link-card-to-board');
  await expect(action).toHaveText('Lye ak yon tablo');
  await expect(action).not.toContainText('sa a');
  const source = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  await page.evaluate(source => {
    Popup.close();
    Popup.open('createBoardFromCard', { dataContext: source })({
      currentTarget: document.body, target: document.body, preventDefault() {},
    });
  }, source);
  await expect(page.locator('.js-pop-over .js-submit')).toHaveText('Kreye yon tablo apati kat sa a');
  await page.evaluate(() => Popup.close());
});

test('Irish card actions identify destination linking and creation from a card', async ({ boardPage: page, board }) => {
  const db = require('../helpers/db');
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'ga'));
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const card = new CardPage(page);
  await card.waitForOpen();
  await card.openActionsMenu();
  const action = page.locator('.js-pop-over .js-link-card-to-board');
  await expect(action).toHaveText('Nasc le clár');
  await expect(action).not.toContainText('gClár seo');
  const source = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  await page.evaluate(source => {
    Popup.close();
    Popup.open('createBoardFromCard', { dataContext: source })({
      currentTarget: document.body, target: document.body, preventDefault() {},
    });
  }, source);
  await expect(page.locator('.js-pop-over .js-submit')).toHaveText('Cruthaigh clár ón gcárta seo');
  await page.evaluate(() => Popup.close());
});

test('Scottish Gaelic card actions identify destination linking and creation from a card', async ({ boardPage: page, board }) => {
  const db = require('../helpers/db');
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'gd'));
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const card = new CardPage(page);
  await card.waitForOpen();
  await card.openActionsMenu();
  const action = page.locator('.js-pop-over .js-link-card-to-board');
  await expect(action).toHaveText('Ceangail ri bòrd');
  await expect(action).not.toContainText('bhòrd seo');
  const source = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  await page.evaluate(source => {
    Popup.close();
    Popup.open('createBoardFromCard', { dataContext: source })({
      currentTarget: document.body, target: document.body, preventDefault() {},
    });
  }, source);
  await expect(page.locator('.js-pop-over .js-submit')).toHaveText('Cruthaich bòrd bhon chairt seo');
  await page.evaluate(() => Popup.close());
});
