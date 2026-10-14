'use strict';

// Board View / Email and Board View / Chat (#794, #3948), in the browser:
// the texts and buttons are there, folders and labels filter, a message opens
// as the card popup, Compose sends and the email shows under Sent; in Chat
// the tree, the card and its chat are there, a message is sent, panes fold
// and resize and keep that on the profile, the panes mirror for a
// right-to-left language, and drag and drop moves cards, lists and boards.
// Plus the email-to-card settings in Notification Settings.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');

const DOMAIN = 'boards.e2e.example.test';
const escapeRegExp = text => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function enableInbound() {
  const setting = db.findOne('settings', {});
  const previous = setting && setting.inboundMail;
  db.updateOne('settings', { _id: setting._id }, { $set: { inboundMail: { enabled: true, domain: DOMAIN } } });
  return () => db.updateOne('settings', { _id: setting._id },
    previous === undefined ? { $unset: { inboundMail: '' } } : { $set: { inboundMail: previous } });
}

async function openView(page, board, view) {
  await page.evaluate(([v, id]) => Meteor.callAsync('setBoardView', v, id), [view, board.boardId]);
  await navigateInApp(page, `/b/${board.boardId}/${board.slug}`);
}

test.describe('Email view', () => {
  test('folders, labels, rows, the card popup and Compose', async ({ boardPage: page, board, user }) => {
    const restore = enableInbound();
    try {
      const labelId = db.uid('lbl');
      db.updateOne('boards', { _id: board.boardId }, {
        $set: { emailToCard: { enabled: true, listId: board.listIds[0] } },
        $push: { labels: { _id: labelId, name: 'Urgent', color: 'red' } },
      });
      const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
      db.updateOne('cards', { _id: alpha._id }, { $set: {
        labelIds: [labelId], description: 'From: Sam Sender <sam@example.test>\n\nThe printer jams again.',
        receivedAt: new Date(),
        email: { direction: 'in', from: { name: 'Sam Sender', address: 'sam@example.test' }, to: [], cc: [],
          subject: 'Alpha Card', messageId: '<a1@example.test>', threadIds: ['<a1@example.test>'], at: new Date() },
      } });

      await openView(page, board, 'board-view-email');
      const view = page.locator('.email-view');
      await expect(view).toBeVisible();

      // The sidebar: Compose, the three folders, the lists and the labels.
      await expect(view.locator('.js-email-compose')).toBeVisible();
      await expect(view.locator('.js-email-compose')).toContainText('Compose');
      for (const name of ['Inbox', 'Sent', 'All mail', 'List A', 'List B', 'List C', 'Urgent']) {
        await expect(view.locator('.email-view-folders').getByText(name, { exact: true })).toBeVisible();
      }
      await expect(view.locator('.email-view-folder.is-active')).toContainText('Inbox');
      await expect(view.locator('.email-view-hint')).toHaveCount(0);

      // The Inbox is the email list: Alpha, with its sender, preview and label.
      const row = view.locator('.email-view-row', { hasText: 'Alpha Card' });
      await expect(row).toBeVisible();
      await expect(row.locator('.email-view-from')).toHaveText('Sam Sender');
      await expect(row.locator('.email-view-snippet')).toContainText('The printer jams again.');
      await expect(row.locator('.email-view-row-label')).toHaveText('Urgent');
      await expect(view.locator('.email-view-row', { hasText: 'Beta Card' })).toHaveCount(0);
      for (const header of ['From', 'Subject', 'Date']) {
        await expect(view.locator('.table-page-table th', { hasText: header })).toBeVisible();
      }

      // A list as a folder, a label as a filter, an empty Sent.
      await view.locator('.js-email-folder', { hasText: 'List B' }).click();
      await expect(view.locator('.email-view-row', { hasText: 'Beta Card' })).toBeVisible();
      await view.locator('.js-email-folder', { hasText: 'Urgent' }).click();
      await expect(view.locator('.email-view-row')).toHaveCount(1);
      await view.locator('.js-email-folder', { hasText: 'Sent' }).click();
      await expect(view.locator('.table-page-empty')).toContainText('No email here.');

      // Search, on Enter.
      await view.locator('.js-email-folder', { hasText: 'All mail' }).click();
      await view.locator('.js-table-page-search').fill('printer');
      await view.locator('.js-table-page-search').press('Enter');
      await expect(view.locator('.email-view-row', { hasText: 'Alpha Card' })).toBeVisible();
      await view.locator('.js-table-page-search').fill('nothing-matches-this');
      await view.locator('.js-table-page-search').press('Enter');
      await expect(view.locator('.email-view-row')).toHaveCount(0);
      await view.locator('.js-table-page-search').fill('');
      await view.locator('.js-table-page-search').press('Enter');

      // A message opens as the card popup.
      await view.locator('.js-email-folder', { hasText: 'Inbox' }).click();
      await view.locator('.email-view-row', { hasText: 'Alpha Card' }).locator('.email-view-subject-title').click();
      await expect(page.locator('.card-details')).toBeVisible();
      await expect(page.locator('.card-details')).toContainText('Alpha Card');
      await page.keyboard.press('Escape');

      // Compose: the popup, its fields, and Send. It lands under Sent.
      await view.locator('.js-email-compose').click();
      const compose = page.locator('.js-email-compose-form');
      await expect(compose).toBeVisible();
      await expect(page.locator('.pop-over')).toContainText('New message');
      await compose.locator('.js-email-to').fill('client@example.test');
      await compose.locator('.js-email-subject').fill('Quote for the printer');
      await compose.locator('.js-email-text').fill('Here is the quote.');
      await compose.locator('button[type="submit"]').click();
      await expect(compose).toHaveCount(0);
      await expect.poll(() => db.findOne('cards', { boardId: board.boardId, title: 'Quote for the printer' })?.email?.direction)
        .toBe('out');
      const sentCard = db.findOne('cards', { boardId: board.boardId, title: 'Quote for the printer' });
      expect(sentCard.email.from.address).toMatch(new RegExp(`^board\\+[A-Za-z0-9]{22}@${escapeRegExp(DOMAIN)}$`));
      expect(sentCard.userId).toBe(user.id);
      await view.locator('.js-email-folder', { hasText: 'Sent' }).click();
      const sentRow = view.locator('.email-view-row', { hasText: 'Quote for the printer' });
      await expect(sentRow).toBeVisible();
      await expect(sentRow.locator('.email-view-from')).toContainText('client@example.test');

      // Reply on a row opens Compose addressed back, under "Re:".
      await view.locator('.js-email-folder', { hasText: 'Inbox' }).click();
      await view.locator('.email-view-row', { hasText: 'Alpha Card' }).hover();
      await view.locator('.email-view-row', { hasText: 'Alpha Card' }).locator('.js-email-reply').click();
      await expect(compose.locator('.js-email-to')).toHaveValue('sam@example.test');
      await expect(compose.locator('.js-email-subject')).toHaveValue('Re: Alpha Card');

      // An invalid recipient is refused, with the message in the popup (negative).
      await compose.locator('.js-email-to').fill('not an address');
      await compose.locator('.js-email-text').fill('x');
      await compose.locator('button[type="submit"]').click();
      await expect(compose.locator('.warning')).toBeVisible();
      await page.keyboard.press('Escape');
    } finally {
      restore();
    }
  });

  test('a row renders its subject and preview as Markdown, like every card title in WeKan', async ({ boardPage: page, board }) => {
    const restore = enableInbound();
    try {
      db.updateOne('boards', { _id: board.boardId }, { $set: { emailToCard: { enabled: true, listId: board.listIds[0] } } });
      const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
      db.updateOne('cards', { _id: alpha._id }, { $set: {
        title: '# Alpha **bold** card',
        description: 'From: Sam Sender <sam@example.test>\n\nSee [the docs](https://example.org/docs) and **this**.',
        receivedAt: new Date(),
        email: { direction: 'in', from: { name: 'Sam Sender', address: 'sam@example.test' }, to: [], cc: [],
          subject: 'Alpha', messageId: '<md1@example.test>', threadIds: ['<md1@example.test>'], at: new Date() },
      } });
      await openView(page, board, 'board-view-email');
      const row = page.locator('.email-view-row', { hasText: 'Alpha' });
      await expect(row.locator('.email-view-subject-title strong')).toHaveText('bold');
      await expect(row.locator('.email-view-snippet a[href="https://example.org/docs"]')).toHaveText('the docs');
      await expect(row.locator('.email-view-snippet strong')).toHaveText('this');
      // Negative: no Markdown shown as text, and the sender line is not in the preview.
      for (const cell of ['.email-view-subject-title', '.email-view-snippet']) {
        const text = await row.locator(cell).innerText();
        expect(text).not.toMatch(/\*\*|^#|\]\(/m);
      }
      await expect(row.locator('.email-view-snippet')).not.toContainText('From:');
    } finally { restore(); }
  });

  test('says where to turn email on when the board does not receive it', async ({ boardPage: page, board }) => {
    await openView(page, board, 'board-view-email');
    await expect(page.locator('.email-view-hint')).toContainText('does not receive email yet');
    await expect(page.locator('.email-view .js-email-compose')).toBeVisible();
  });
});

// Load the Chat view again, so the channel tree is fetched afresh.
async function view_reload(page, board) {
  await page.reload();
  await openView(page, board, 'board-view-chat');
}

test.describe('Chat view', () => {
  test('tree, card and chat; send a message; fold and resize saved on the profile', async ({ boardPage: page, board, user }) => {
    await openView(page, board, 'board-view-chat');
    const view = page.locator('.chat-view');
    await expect(view).toBeVisible();
    await expect(view.locator('.chat-view-tree .chat-view-pane-title')).toHaveText('Channels');
    for (const name of ['Default', 'List A', 'List B', 'List C', 'Alpha Card', 'Beta Card', 'Gamma Card']) {
      await expect(view.locator('.chat-view-tree').getByText(name, { exact: true }).first()).toBeVisible();
    }
    await expect(view.locator('.chat-view-card .chat-view-empty')).toContainText('Pick a card');

    // Pick a channel: the card in the middle, its chat beside it.
    await view.locator('.js-chat-select-card', { hasText: 'Alpha Card' }).click();
    await expect(view.locator('.chat-view-channel.is-selected')).toContainText('Alpha Card');
    await expect(view.locator('.chat-view-card .card-details')).toBeVisible();
    await expect(view.locator('.chat-view-card .card-details')).toContainText('Alpha Card');
    await expect(view.locator('.chat-view-chat .chat-view-pane-title')).toContainText('# Alpha Card');
    await expect(view.locator('.chat-view-chat .chat-view-empty')).toContainText('No messages yet');

    // Send: Enter sends, the message is a card comment.
    const input = view.locator('.js-chat-input');
    await expect(input).toBeVisible();
    await input.fill('Hello from the chat');
    await input.press('Enter');
    await expect(view.locator('.chat-view-message', { hasText: 'Hello from the chat' })).toBeVisible();
    await expect(view.locator('.chat-view-message.is-mine')).toHaveCount(1);
    const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    await expect.poll(() => db.findOne('card_comments', { cardId: alpha._id })?.text).toBe('Hello from the chat');
    await expect(input).toHaveValue('');

    // Fold the tree: a thin bar, saved; unfold it again.
    await view.locator('.chat-view-tree .js-chat-fold').click();
    await expect(view.locator('.chat-view-tree')).toHaveCount(0);
    await expect(view.locator('.js-chat-unfold[data-pane="tree"]')).toBeVisible();
    await expect.poll(() => db.findOne('users', { _id: user.id }).profile.chatViewLayout?.treeCollapsed).toBe(true);
    await view.locator('.js-chat-unfold[data-pane="tree"]').click();
    await expect(view.locator('.chat-view-tree')).toBeVisible();
    await expect.poll(() => db.findOne('users', { _id: user.id }).profile.chatViewLayout?.treeCollapsed).toBe(false);

    // Fold the card and the chat too.
    await view.locator('.chat-view-card .js-chat-fold').click();
    await expect(view.locator('.js-chat-unfold[data-pane="card"]')).toBeVisible();
    await view.locator('.js-chat-unfold[data-pane="card"]').click();
    await view.locator('.chat-view-chat .js-chat-fold').click();
    await expect(view.locator('.js-chat-unfold[data-pane="chat"]')).toBeVisible();
    await view.locator('.js-chat-unfold[data-pane="chat"]').click();

    // Resize: drag the border right of the tree 120px wider.
    const tree = view.locator('.chat-view-tree');
    const before = (await tree.boundingBox()).width;
    const handle = view.locator('.js-chat-resize[data-pane="tree"]');
    const box = await handle.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + 40);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + 40, { steps: 5 });
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + 40, { steps: 5 });
    await page.mouse.up();
    await expect.poll(async () => (await tree.boundingBox()).width).toBeGreaterThan(before + 80);
    await expect.poll(() => db.findOne('users', { _id: user.id }).profile.chatViewLayout?.treeWidth).toBeGreaterThan(before + 80);

    // The keyboard does the same.
    const saved = db.findOne('users', { _id: user.id }).profile.chatViewLayout.treeWidth;
    await handle.focus();
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => db.findOne('users', { _id: user.id }).profile.chatViewLayout?.treeWidth).toBe(saved - 16);

    // It is still so after a reload.
    await page.reload();
    await expect(page.locator('.chat-view-tree')).toBeVisible();
    await expect.poll(async () => Math.round((await page.locator('.chat-view-tree').boundingBox()).width)).toBe(saved - 16);
  });

  test('drag and drop moves a card to another list, reorders lists, and moves a board into a workspace', async ({ boardPage: page, board, user }) => {
    const wsA = db.uid('ws'), wsB = db.uid('ws');
    db.updateOne('users', { _id: user.id }, { $set: {
      'profile.boardWorkspacesTree': [{ id: wsA, name: 'Workspace A', children: [] }, { id: wsB, name: 'Workspace B', children: [] }],
      'profile.boardWorkspaceAssignments': { [board.boardId]: wsA },
    } });
    await openView(page, board, 'board-view-chat');
    const tree = page.locator('.chat-view-tree');
    await expect(tree.getByText('Workspace A', { exact: true })).toBeVisible();
    await expect(tree.getByText('Workspace B', { exact: true })).toBeVisible();

    // A card onto another list: it moves there.
    const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    await tree.locator(`[data-kind="card"][data-id="${alpha._id}"] > .chat-view-row`)
      .dragTo(tree.locator(`[data-kind="list"][data-id="${board.listIds[1]}"] > .chat-view-row`));
    await expect.poll(() => db.findOne('cards', { _id: alpha._id }).listId).toBe(board.listIds[1]);
    const listB = tree.locator(`[data-kind="list"][data-id="${board.listIds[1]}"]`);
    await expect(listB.getByText('Alpha Card', { exact: true })).toBeVisible();

    // A list before the first one: List C is now first.
    const listC = tree.locator(`[data-kind="list"][data-id="${board.listIds[2]}"] > .chat-view-row`);
    const listA = tree.locator(`[data-kind="list"][data-id="${board.listIds[0]}"] > .chat-view-row`);
    const aBox = await listA.boundingBox();
    await listC.dragTo(listA, { targetPosition: { x: 20, y: 2 } });
    await expect.poll(() => {
      const lists = db.find('lists', { boardId: board.boardId }).sort((x, y) => x.sort - y.sort);
      return lists[0]._id;
    }).toBe(board.listIds[2]);
    expect(aBox).toBeTruthy();

    // A card onto a card in another list: placed there, in that list.
    const gamma = db.findOne('cards', { boardId: board.boardId, title: 'Gamma Card' });
    await tree.locator(`[data-kind="card"][data-id="${gamma._id}"] > .chat-view-row`)
      .dragTo(tree.locator(`[data-kind="card"][data-id="${alpha._id}"] > .chat-view-row`), { targetPosition: { x: 20, y: 2 } });
    await expect.poll(() => db.findOne('cards', { _id: gamma._id }).listId).toBe(board.listIds[1]);
    await expect.poll(() => db.findOne('cards', { _id: gamma._id }).sort < db.findOne('cards', { _id: alpha._id }).sort).toBe(true);

    // A board onto another workspace.
    await tree.locator(`[data-kind="board"][data-id="${board.boardId}"] > .chat-view-row`)
      .dragTo(tree.locator(`[data-kind="workspace"][data-id="${wsB}"] > .chat-view-row`));
    await expect.poll(() => db.findOne('users', { _id: user.id }).profile.boardWorkspaceAssignments[board.boardId]).toBe(wsB);

    // A workspace before another: B is first.
    await tree.locator(`[data-kind="workspace"][data-id="${wsB}"] > .chat-view-row`)
      .dragTo(tree.locator(`[data-kind="workspace"][data-id="${wsA}"] > .chat-view-row`), { targetPosition: { x: 20, y: 1 } });
    await expect.poll(() => db.findOne('users', { _id: user.id }).profile.boardWorkspacesTree[0].id).toBe(wsB);

    // A card onto a swimlane means nothing, and nothing moves (negative).
    const beta = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
    await tree.locator(`[data-kind="card"][data-id="${beta._id}"] > .chat-view-row`)
      .dragTo(tree.locator(`[data-kind="swimlane"][data-id="${board.swimlaneId}"] > .chat-view-row`));
    await page.waitForTimeout(500);
    expect(db.findOne('cards', { _id: beta._id }).listId).toBe(beta.listId);
  });

  test('channels: folding rows stay in the view, a first message moves a board up, unread counts, Markdown names', async ({ boardPage: page, board, user }) => {
    const other = db.seedBoard({ ownerId: user.id, title: 'Quiet **board** :tada:', cardTitlesPerList: [['Talk here']] });
    const friend = db.seedUser();
    try {
      await openView(page, board, 'board-view-chat');
      const tree = page.locator('.chat-view-tree');
      // Nothing said anywhere yet: both boards are under Other boards.
      const heading = tree.locator('.chat-view-node-heading');
      await expect(heading).toBeVisible();
      const quiet = tree.locator(`[data-kind="board"][data-id="${other.boardId}"]`);
      await expect(quiet).toBeVisible();
      // Its name is Markdown: bold and an emoji, no ** shown.
      await expect(quiet.locator(':scope > .chat-view-row strong')).toHaveText('board');
      expect(await quiet.locator(':scope > .chat-view-row').innerText()).not.toContain('**');
      // Clicking a board folds and unfolds it here; the page stays on this board in the Chat view.
      const url = page.url();
      await quiet.locator(':scope > .chat-view-row').click();
      await expect(quiet).toHaveClass(/is-open/);
      await expect(quiet).toHaveAttribute('aria-expanded', 'true');
      await expect(quiet.getByText('Talk here', { exact: true })).toBeVisible();
      expect(page.url()).toBe(url);
      await expect(page.locator('.chat-view')).toBeVisible();
      await quiet.locator(':scope > .chat-view-row').click();
      await expect(quiet).not.toHaveClass(/is-open/);
      // Somebody else writes on that board: it moves up out of Other boards,
      // with one unread message on every level down to the card.
      const talk = db.findOne('cards', { boardId: other.boardId, title: 'Talk here' });
      db.insertOne('card_comments', { _id: db.uid('cmt'), boardId: other.boardId, cardId: talk._id, userId: friend.id,
        text: 'Hello', createdAt: new Date(), modifiedAt: new Date() });
      await page.evaluate(() => new Promise(resolve => Meteor.call('chatViewChannels', () => resolve())));
      await view_reload(page, board);
      const moved = page.locator(`.chat-view-tree [data-kind="board"][data-id="${other.boardId}"]`);
      await expect(moved.locator(':scope > .chat-view-row .chat-view-unread')).toHaveText('1');
      const before = await moved.evaluate(el => {
        const h = el.parentElement.querySelector('.chat-view-node-heading');
        return !h || (el.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      });
      expect(before).toBe(true);
      await moved.locator(':scope > .chat-view-row').click();
      await expect(moved.locator('[data-kind="card"] .chat-view-unread')).toHaveText('1');
      // Negative: my own message is never unread to me.
      db.insertOne('card_comments', { _id: db.uid('cmt'), boardId: other.boardId, cardId: talk._id, userId: user.id,
        text: 'Mine', createdAt: new Date(), modifiedAt: new Date() });
      await view_reload(page, board);
      await expect(page.locator(`.chat-view-tree [data-kind="board"][data-id="${other.boardId}"] > .chat-view-row .chat-view-unread`)).toHaveText('1');
    } finally {
      db.deleteMany('card_comments', { boardId: other.boardId });
      db.cleanup({ boardIds: [other.boardId], userIds: [friend.id] });
    }
  });

  test('right to left: the panes are mirrored', async ({ boardPage: page, board }) => {
    await openView(page, board, 'board-view-chat');
    const x = async selector => (await page.locator(selector).boundingBox()).x;
    expect(await x('.chat-view-tree')).toBeLessThan(await x('.chat-view-chat'));
    await page.evaluate(() => Meteor.callAsync('setLanguage', 'ar'));
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await page.reload();
    await expect(page.locator('.chat-view')).toHaveAttribute('data-dir', 'rtl');
    expect(await x('.chat-view-tree')).toBeGreaterThan(await x('.chat-view-chat'));
    await page.evaluate(() => Meteor.callAsync('setLanguage', 'en'));
  });
});

test.describe('Email to card settings', () => {
  test('board admin: turn on, pick the list, see the address, get a new one', async ({ boardPage: page, board }) => {
    const restore = enableInbound();
    try {
      await page.evaluate(() => {
        Popup.close();
        Popup.open('notificationSettings', { dataContext: { scope: 'board' } })({
          currentTarget: document.body, target: document.body, preventDefault() {},
        });
      });
      const section = page.locator('.email-to-card-settings[data-scope="board"]');
      await section.locator('summary').click();
      await expect(section).toContainText('This board receives email');
      await expect(section).toContainText('A board admin has not turned on email for this board.');
      await section.locator('.js-etc-board-enabled').click();
      await expect.poll(() => db.findOne('boards', { _id: board.boardId }).emailToCard?.enabled).toBe(true);
      await section.locator('select[data-key="listId"]').selectOption(board.listIds[1]);
      await expect.poll(() => db.findOne('boards', { _id: board.boardId }).emailToCard?.listId).toBe(board.listIds[1]);
      const address = section.locator('code.js-etc-copy');
      await expect(address).toHaveText(new RegExp(`^board\\+[A-Za-z0-9]{22}@${escapeRegExp(DOMAIN)}$`));
      const first = await address.textContent();
      await section.locator('.js-etc-new-address').click();
      await expect(address).not.toHaveText(first);
      // Parts: leave out attachments for this board.
      await section.locator('select[data-part="attachments"]').selectOption('false');
      await expect.poll(() => db.findOne('boards', { _id: board.boardId }).emailToCard?.parts?.attachments).toBe(false);
    } finally {
      restore();
    }
  });

  test('admin: the inbound form, a mailbox row, and no password shown back', async ({ page, adminUser }) => {
    const restore = enableInbound();
    try {
      const { loginWithToken } = require('../helpers/auth');
      await loginWithToken(page, adminUser.id, adminUser.token);
      await page.evaluate(() => {
        Popup.close();
        Popup.open('notificationSettings', { dataContext: { scope: 'admin' } })({
          currentTarget: document.body, target: document.body, preventDefault() {},
        });
      });
      const section = page.locator('.email-to-card-settings[data-scope="admin"]');
      await section.locator('summary').click();
      await expect(section.locator('.js-etc-domain')).toHaveValue(DOMAIN);
      await expect(section).toContainText('api/inbound-email');
      await section.locator('.js-etc-add-account').click();
      const row = section.locator('.email-to-card-account').last();
      await row.locator('[data-key="host"]').fill('imap.example.test');
      await row.locator('[data-key="username"]').fill('cards@example.test');
      await row.locator('.js-etc-account-password').fill('Sup3rSecret');
      await row.locator('select[data-key="enabled"]').selectOption('false');
      await section.locator('.js-etc-admin-save').click();
      await expect(section.locator('.js-etc-message')).toContainText('Saved.');
      const stored = db.findOne('settings', {}).inboundMail;
      expect(stored.accounts[0].host).toBe('imap.example.test');
      expect(stored.passwords[stored.accounts[0].id]).toBe('Sup3rSecret');
      await expect(row.locator('.js-etc-account-password')).toHaveValue('');
      expect(await page.content()).not.toContain('Sup3rSecret');
    } finally {
      restore();
    }
  });
});

test.describe('Email bounces in the Admin Panel', () => {
  test('rules are shown and saved, a bounced address is listed and cleared', async ({ page, adminUser }) => {
    const { loginWithToken } = require('../helpers/auth');
    const setting = db.findOne('settings', {});
    const previous = setting.emailBounces;
    const email = `typo-${db.uid('b').toLowerCase()}@exmaple.org`;
    db.insertOne('email_bounces', { _id: db.uid('bounce'), email, counts: { hard: 1 }, total: 1, stopped: true,
      lastCategory: 'hard', lastStatus: '5.1.1', lastDiagnostic: '550 5.1.1 user unknown', lastSource: 'ses',
      firstAt: new Date(), lastAt: new Date(), history: [] });
    try {
      await loginWithToken(page, adminUser.id, adminUser.token);
      await navigateInApp(page, '/admin/people/email');
      const section = page.locator('.email-bounces');
      await expect(section).toBeVisible();
      await expect(section.locator('h2')).toHaveText('Bounces');
      for (const text of ['Hard bounce', 'Soft bounce', 'Automatic reply', 'Spam complaint', 'Stop emailing the address',
        'Tell who invited it', 'Delete the invitation', 'Amazon SES']) {
        await expect(section).toContainText(text);
      }
      await expect(section).toContainText('/api/inbound-email/ses');

      // Defaults: hard stops and tells the inviter; auto-replies are ignored.
      const hard = section.locator('tr[data-category="hard"]');
      await expect(hard.locator('[data-action="stop-email"] .materialCheckBox')).toHaveClass(/is-checked/);
      await expect(hard.locator('[data-action="notify-inviter"] .materialCheckBox')).toHaveClass(/is-checked/);
      await expect(section.locator('tr[data-category="auto-reply"] [data-action="ignore"] .materialCheckBox')).toHaveClass(/is-checked/);

      // Change: auto-replies are listed, soft bounces after 3, a topic; save.
      await section.locator('tr[data-category="auto-reply"] [data-action="record"]').click();
      await expect(section.locator('tr[data-category="auto-reply"] [data-action="ignore"] .materialCheckBox')).not.toHaveClass(/is-checked/);
      await section.locator('.js-bounce-threshold[data-category="soft"]').fill('3');
      await section.locator('.js-bounce-threshold[data-category="soft"]').dispatchEvent('change');
      await section.locator('.js-bounce-topics').fill('arn:aws:sns:eu-west-1:123456789012:wekan-bounces');
      await section.locator('.js-bounce-save').click();
      await expect(section.locator('.js-bounce-message')).toContainText('Saved.');
      const saved = db.findOne('settings', {}).emailBounces;
      expect(saved.rules['auto-reply'].actions).toEqual(['record']);
      expect(saved.rules.soft.threshold).toBe(3);
      expect(saved.sesTopicArns).toEqual(['arn:aws:sns:eu-west-1:123456789012:wekan-bounces']);

      // An invalid topic is refused, with a message (negative).
      await section.locator('.js-bounce-topics').fill('not-an-arn');
      await section.locator('.js-bounce-save').click();
      await expect(section.locator('.js-bounce-message')).toContainText('not an SNS topic ARN');

      // The list: the address, its reason, "Not emailed"; Clear removes it.
      await section.locator('.js-table-page-search').fill(email);
      await section.locator('.js-table-page-search').press('Enter');
      const row = section.locator('.email-bounce-row', { hasText: email });
      await expect(row).toBeVisible();
      await expect(row).toContainText('user unknown');
      await expect(row).toContainText('Not emailed');
      await row.locator('.js-bounce-clear').click();
      await expect(row).toHaveCount(0);
      expect(db.findOne('email_bounces', { email })).toBeNull();
    } finally {
      db.deleteMany('email_bounces', { email });
      db.updateOne('settings', { _id: setting._id }, previous === undefined ? { $unset: { emailBounces: '' } } : { $set: { emailBounces: previous } });
    }
  });

  test('the other sending services: listed with their addresses, a key is required and never shown back', async ({ page, adminUser }) => {
    const { loginWithToken } = require('../helpers/auth');
    const setting = db.findOne('settings', {});
    const previous = setting.emailBounces;
    try {
      await loginWithToken(page, adminUser.id, adminUser.token);
      await navigateInApp(page, '/admin/people/email');
      const section = page.locator('.email-bounces');
      for (const name of ['Mailgun', 'SendGrid', 'Postmark', 'Brevo', 'Mailjet', 'SparkPost', 'Mandrill', 'Resend']) {
        await expect(section.locator('.email-bounce-providers')).toContainText(name);
      }
      const mailgun = section.locator('tr[data-provider="mailgun"]');
      await expect(mailgun.locator('.email-bounce-endpoint')).toContainText('/api/inbound-email/bounces/mailgun');
      await expect(mailgun).toContainText('Webhook signing key');
      await expect(section.locator('tr[data-provider="postmark"]')).toContainText('Webhook password');

      // On without a key: refused, with a message (negative).
      await mailgun.locator('.js-bounce-provider').click();
      await section.locator('.js-bounce-save').click();
      await expect(section.locator('.js-bounce-message')).toContainText('needs its signing key or password');

      // With a key: saved; the field empties and says a key is kept.
      await mailgun.locator('.js-bounce-provider-secret').fill('key-test-1234');
      await section.locator('.js-bounce-save').click();
      await expect(section.locator('.js-bounce-message')).toContainText('Saved.');
      await expect(mailgun.locator('.js-bounce-provider-secret')).toHaveValue('');
      await expect(mailgun.locator('.js-bounce-provider-secret')).toHaveAttribute('placeholder', /Saved/);
      const stored = db.findOne('settings', {}).emailBounces;
      expect(stored.providers.mailgun.enabled).toBe(true);
      expect(stored.providerSecrets.mailgun).toBe('key-test-1234');
      expect(await page.content()).not.toContain('key-test-1234');
    } finally {
      db.updateOne('settings', { _id: setting._id }, previous === undefined ? { $unset: { emailBounces: '' } } : { $set: { emailBounces: previous } });
    }
  });

  test('Admin Panel -> Problems has an Email pane', async ({ page, adminUser }) => {
    const { loginWithToken } = require('../helpers/auth');
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/mail');
    await expect(page.locator('.admin-pane-title, h1').filter({ hasText: 'Email' }).first()).toBeVisible();
  });
});
