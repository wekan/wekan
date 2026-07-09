'use strict';

/**
 * Page Object for the card details panel (.js-card-details).
 * Used after clicking a card minicard on a board.
 */
class CardPage {
  constructor(page) {
    this.page = page;
    // In desktop swimlane view WeKan renders two .js-card-details for the same
    // card: one inside .board-canvas (swimlane template) and one as a direct
    // child of .board-wrapper (boardBody openCards list). Using the direct-child
    // selector targets only the latter — the "main" sliding panel — and avoids
    // Playwright strict-mode errors when methods like .click()/.fill() require
    // exactly one matching element.
    this.root = page.locator('.board-wrapper > .js-card-details');
  }

  async waitForOpen() {
    // Prefer the scoped root selector; fall back to any .js-card-details in
    // case the board-wrapper isn't present yet during initial page load.
    const appeared = await this.root
      .waitFor({ timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (!appeared) {
      await this.page.locator('.js-card-details').first().waitFor({ timeout: 5_000 });
    }
  }

  // --- Title ---

  title() {
    return this.root.locator('.js-card-title, h2.card-details-title').first();
  }

  async getTitle() {
    return (await this.title().innerText()).trim();
  }

  async editTitle(newTitle) {
    await this.root.locator('.js-card-title.js-open-inlined-form').click();
    const input = this.root.locator('.js-card-details-title textarea, .js-card-details-title input');
    await input.fill(newTitle);
    // #4236: plain Enter now inserts a newline in the card title (consistent
    // with the description field); Ctrl/Cmd+Enter saves. Control+Enter sends
    // ctrlKey on every platform, which the save handler accepts.
    await input.press('Control+Enter');
    await this.page.waitForTimeout(500);
  }

  // --- Window controls ---

  async minimize() {
    await this.root.locator('.js-minimize-card-details').first().click();
  }

  async maximize() {
    // jade: {{if cardMaximized}} shows js-minimize-card-details {{else}} shows js-maximize-card-details
    // Clicking js-maximize-card-details calls toggleCardMaximized (server method).
    await this.root.locator('.js-maximize-card-details').first().click();
    // card-details-maximized is added to the .js-card-details element itself, not a child.
    await this.page.waitForFunction(() => {
      const el = document.querySelector('.board-wrapper > .js-card-details');
      return !!el && el.classList.contains('card-details-maximized');
    }, { timeout: 15_000 });
  }

  isMaximized() {
    // card-details-maximized lives on the root .js-card-details element itself.
    return this.page.locator('.board-wrapper > .js-card-details.card-details-maximized').first();
  }

  async close() {
    await this.root.locator('.js-close-card-details').first().click();
    await this.root.waitFor({ state: 'hidden', timeout: 10_000 });
  }

  // --- List/status selector ---

  listSelector() {
    return this.root.locator('.js-select-card-details-lists');
  }

  async changeList(listTitle) {
    await this.listSelector().selectOption({ label: listTitle });
    await this.page.waitForTimeout(600);
  }

  // --- Actions menu ---

  async openActionsMenu() {
    const trigger = this.root.locator('.js-open-card-details-menu').first();
    const popover = this.page.locator('.js-pop-over');
    // The board can transiently re-render to a "board-not-found" shell while its
    // subscription re-settles under the heavy all-parallel run (most visible in
    // Firefox/WebKit), detaching the open card details — and this trigger —
    // mid-interaction. Retry the open until the popup actually shows, mirroring
    // BoardPage.openListMenu.
    for (let attempt = 0; attempt < 4; attempt++) {
      await this.root
        .waitFor({ state: 'visible', timeout: 15_000 })
        .catch(() => {});
      try {
        await trigger.click({ timeout: 5_000 });
        await popover.waitFor({ state: 'visible', timeout: 5_000 });
        return;
      } catch (err) {
        // card details re-rendered mid-interaction; loop and try again
      }
    }
    await popover.waitFor({ timeout: 5_000 });
  }

  async clickAction(selector) {
    await this.page.locator(`.js-pop-over ${selector}`).click();
  }

  async archiveCard() {
    await this.openActionsMenu();
    // cardDetailsActionsPopup uses .js-archive (not .js-archive-card).
    // Popup.afterConfirm opens a second popup (cardArchivePopup) with button.js-confirm.
    await this.clickAction('.js-archive');
    // Wait for the confirmation popup and click the confirm button.
    const confirmBtn = this.page.locator('.js-pop-over button.js-confirm, .js-pop-over .js-confirm');
    await confirmBtn.waitFor({ timeout: 5_000 });
    await confirmBtn.click();
    await this.root.waitFor({ state: 'hidden', timeout: 10_000 });
  }

  /**
   * Ensure the boards select has a valid selection.
   * Boards load reactively via Meteor DDP after the `boards` publication fires.
   * If the options never appear (subscription slow / seeded directly in MongoDB),
   * we inject the current board ID from the page URL and trigger the Blaze change
   * handler so the dialog's selectedBoardId and list select are updated.
   */
  async _selectBoard(pop, targetBoardTitle) {
    const boardSel = pop.locator('select.js-select-boards');
    if (await boardSel.count() === 0) return; // boards select hidden (isWorker user)

    // Give Meteor DDP up to 6 s to push boards to the client.
    const hasOptions = await this.page.waitForFunction(
      () => {
        const el = document.querySelector('.js-pop-over select.js-select-boards');
        return el && el.options.length > 0;
      },
      { timeout: 6_000 },
    ).catch(() => false);

    if (!hasOptions) {
      // Boards subscription is still empty — inject the current board from the URL
      // and trigger Blaze's 'change .js-select-boards' handler via jQuery.
      await this.page.evaluate(() => {
        const sel = document.querySelector('.js-pop-over select.js-select-boards');
        if (!sel || sel.options.length > 0) return;
        const m = location.pathname.match(/\/b\/([^/]+)\//);
        if (!m) return;
        const opt = document.createElement('option');
        opt.value = m[1];
        opt.selected = true;
        sel.appendChild(opt);
        // Blaze event handlers use jQuery delegation; trigger via $().
        if (typeof $ !== 'undefined') $(sel).trigger('change');
      });
      // Allow Meteor reactive system to populate lists from the injected board.
      await this.page.waitForTimeout(800);
      return;
    }

    if (targetBoardTitle) {
      await boardSel.selectOption({ label: targetBoardTitle });
    } else {
      const firstValue = await boardSel.locator('option').first().getAttribute('value');
      await boardSel.selectOption(firstValue);
    }
    await this.page.waitForTimeout(400);
  }

  /**
   * Select a list by title from a <select.js-select-lists> inside `pop`.
   * WeKan renders options as "1. ListTitle", "2. ListTitle", etc., so we
   * cannot select by exact label — instead we find the option whose text
   * contains the list title and select by value.
   */
  async _selectListByTitle(pop, listTitle) {
    const sel = pop.locator('select.js-select-lists');
    // Wait for options to be populated
    await this.page.waitForFunction(
      ([selector]) => {
        const el = document.querySelector(selector);
        return el && el.options.length > 0;
      },
      ['.js-pop-over select.js-select-lists'],
      { timeout: 8_000 },
    );
    const matchingOption = sel.locator('option').filter({ hasText: listTitle });
    const value = await matchingOption.first().getAttribute('value');
    await sel.selectOption(value);
  }

  async moveCard(targetBoardTitle, targetListTitle) {
    await this.openActionsMenu();
    await this.clickAction('.js-move-card');
    const pop = this.page.locator('.js-pop-over');
    await pop.waitFor();
    await this._selectBoard(pop, targetBoardTitle);
    await this._selectListByTitle(pop, targetListTitle);
    // moveCardPopup confirm button
    await pop.locator('button.js-done, button.primary.confirm').click();
    await this.page.waitForTimeout(800);
  }

  async copyCard(targetBoardTitle, targetListTitle, newTitle) {
    await this.openActionsMenu();
    await this.clickAction('.js-copy-card');
    const pop = this.page.locator('.js-pop-over');
    await pop.waitFor();
    // copyCardPopup title field is textarea#copy-card-title
    if (newTitle) {
      const titleField = pop.locator('textarea#copy-card-title, input.js-copy-card-title');
      await titleField.first().fill(newTitle);
    }
    await this._selectBoard(pop, targetBoardTitle);
    await this._selectListByTitle(pop, targetListTitle);
    await pop.locator('button.js-done, button.primary.confirm').click();
    await this.page.waitForTimeout(800);
  }

  // --- Description ---

  async setDescription(text) {
    // inlinedCardDescription template renders the else block (edit link) OUTSIDE the
    // .js-card-description wrapper.  The else block has:
    //   a.js-open-inlined-form i.fa.fa-pencil-square-o  (pencil link)
    //   a.js-open-inlined-form (description viewer link)
    // These live directly inside .js-card-details, not inside .js-card-description.
    // Clicking either opens the form (class="card-description js-card-description").
    const pencilLink = this.root.locator('a.js-open-inlined-form').filter({
      has: this.page.locator('i.fa-pencil-square-o'),
    }).first();
    await pencilLink.click({ timeout: 15_000 });
    // After clicking, the form element appears with class js-card-description
    const descSection = this.root.locator('.js-card-description');
    await descSection.waitFor({ timeout: 8_000 });
    const editor = descSection.locator('textarea.editor, textarea.js-new-description-input').first();
    await editor.fill(text);
    // Save via button.primary inside .edit-controls
    await descSection.locator('button.primary').first().click();
    await this.page.waitForTimeout(600);
  }

  // --- Comments ---

  async addComment(text) {
    // commentForm template:
    //   .new-comment.js-new-comment > form.js-new-comment-form
    //     > textarea.editor.js-new-comment-input  (rendered by +editor mixin)
    //     > button.primary.confirm.js-add-comment(type="submit")
    // The textarea is always visible (height: 36px via CSS).
    const form = this.root.locator('form.js-new-comment-form');
    await form.waitFor({ timeout: 10_000 });
    // Fill the textarea — clicking focuses it and expands the form
    const textarea = form.locator('textarea.js-new-comment-input, textarea.editor').first();
    await textarea.click();
    await textarea.fill(text);
    // Submit button: button.primary.confirm.clear.js-add-comment(type="submit")
    await form.locator('button.js-add-comment, button[type=submit]').first().click();
    await this.page.waitForTimeout(800);
  }

  comments() {
    // comment template: .comments .comment .comment-text > .viewer
    // Return .comment-text (one per comment); it contains all text via child .viewer.
    return this.root.locator('.comments .comment-text');
  }

  // --- Labels ---

  async openLabelSelector({ timeout = 15_000 } = {}) {
    // Two .js-add-labels exist: the labels container link + the "+" add button.
    // Click the last one (the "+" add button) to open the cardLabelsPopup.
    await this.root.locator('.js-add-labels').last().click();
    await this.page.locator('.js-pop-over').waitFor({ timeout });
  }

  // --- Members / assignees ---

  async openMemberSelector() {
    await this.root.locator('.js-add-members').click();
    await this.page.locator('.js-pop-over').waitFor();
  }

  async openAssigneeSelector() {
    await this.root.locator('.js-add-assignees').click();
    await this.page.locator('.js-pop-over').waitFor();
  }

  // --- Custom fields ---

  async openCustomFields() {
    // .js-custom-fields is inside cardDetailsActionsPopup, not directly in the card panel.
    await this.openActionsMenu();
    await this.clickAction('.js-custom-fields');
    await this.page.locator('.js-pop-over').waitFor();
  }

  // --- Attachments ---

  async openAttachmentPanel() {
    // attachmentGallery template: a.attachment-item.add-attachment.js-add-attachment
    // Clicking it opens cardAttachmentsPopup via Popup.open('cardAttachments').
    const addBtn = this.root.locator('.card-attachmentGallery a.js-add-attachment');
    await addBtn.waitFor({ timeout: 10_000 });
    await addBtn.click();
    // Wait for the cardAttachmentsPopup to appear
    await this.page.locator('.js-pop-over').waitFor({ timeout: 8_000 });
  }

  // --- Links in card body ---

  links() {
    return this.root.locator('.card-description a[href], .viewer a[href]');
  }

  // --- Activity log ---

  activityItems() {
    return this.root.locator('.activity-item, .card-activity .activity');
  }

  // --- Copy link (open in new tab) ---

  copyLinkButton() {
    return this.root.locator('.js-copy-link, a.card-copy-button').first();
  }

  // --- Due dates ---

  /**
   * Open the due-date editor popup.
   * When no due date is set the trigger is `a.js-due-date` (+icon).
   * When one already exists the trigger is `a.js-edit-date.card-date` (badge).
   */
  async openDueDateEditor() {
    // Try the "+" add button first; fall back to the existing date badge.
    const addBtn = this.root.locator('a.js-due-date').first();
    const badge  = this.root.locator('a.js-edit-date.card-date').first();
    if (await addBtn.count() > 0) {
      await addBtn.click({ timeout: 10_000 });
    } else {
      await badge.click({ timeout: 10_000 });
    }
    await this.page.locator('.js-pop-over').waitFor({ timeout: 8_000 });
  }

  /**
   * Set the due date. isoDate should be 'YYYY-MM-DD'.
   * Opens the editor, fills the date field, and submits.
   */
  async setDueDate(isoDate) {
    await this.openDueDateEditor();
    const pop = this.page.locator('.js-pop-over');
    await pop.locator('input.js-date-field, input[type=date]').first().fill(isoDate);
    await pop.locator('button.js-submit-date').click();
    await this.page.waitForTimeout(500);
  }

  /** Clear the due date by opening the editor and clicking Delete. */
  async clearDueDate() {
    await this.openDueDateEditor();
    const pop = this.page.locator('.js-pop-over');
    await pop.locator('button.js-delete-date').first().click();
    await this.page.waitForTimeout(400);
  }

  /** The due-date badge element (visible only when a due date has been set). */
  dueDateBadge() {
    return this.root.locator('.card-details-item-due a.js-edit-date, .card-details-item-due .card-date');
  }

  // --- Checklists ---

  /**
   * Add a new checklist with the given title.
   * Clicks the bottom "add checklist" inlined-form trigger, fills the title
   * textarea, and submits — which calls Checklists.insert on the server.
   */
  async addChecklist(title) {
    // inlinedForm else-block: a.add-checklist.js-open-inlined-form (bottom trigger)
    const trigger = this.root.locator('a.add-checklist.js-open-inlined-form').last();
    await trigger.click({ timeout: 10_000 });
    // After click the form becomes visible: form.inlined-form.js-add-checklist
    const form = this.root.locator('form.js-add-checklist').last();
    await form.waitFor({ timeout: 8_000 });
    await form.locator('textarea.js-add-checklist-item').fill(title);
    await form.locator('button.js-submit-add-checklist-item-form').click();
    await this.page.waitForTimeout(700);
  }

  /**
   * Add an item to an existing checklist identified by title.
   *
   * WeKan automatically opens the "add item" inlined form right after a
   * checklist is created (see checklists.js setTimeout click), so when this
   * method is called immediately after addChecklist() the form may already be
   * visible.  We handle both states: form open → fill directly; form closed →
   * click the trigger first.
   */
  async addChecklistItem(checklistTitle, itemText) {
    const checklist = this.root.locator('.js-checklist').filter({ hasText: checklistTitle }).first();
    await checklist.waitFor({ timeout: 8_000 });

    // Give WeKan's 100 ms setTimeout a chance to auto-open the form.
    await this.page.waitForTimeout(300);

    const form = checklist.locator('form.js-add-checklist-item').last();
    const formVisible = await form.isVisible().catch(() => false);

    if (!formVisible) {
      // Form is closed — click the trigger to open it.
      const trigger = checklist.locator('a.add-checklist-item.js-open-inlined-form').last();
      await trigger.click({ timeout: 8_000 });
      await form.waitFor({ timeout: 6_000 });
    }

    await form.locator('textarea.js-add-checklist-item').fill(itemText);
    await form.locator('button.js-submit-add-checklist-item-form').click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Toggle the finished state of a checklist item by clicking its checkbox.
   */
  async toggleChecklistItem(checklistTitle, itemText) {
    const checklist = this.root.locator('.js-checklist').filter({ hasText: checklistTitle }).first();
    const item = checklist.locator('.js-checklist-item').filter({ hasText: itemText }).first();
    await item.locator('.check-box.materialCheckBox').first().click();
    await this.page.waitForTimeout(400);
  }

  /** All checklist container elements on this card. */
  checklists() {
    return this.root.locator('.js-checklist.checklist');
  }

  /** Checklist item elements within a named checklist. */
  checklistItems(checklistTitle) {
    return this.root
      .locator('.js-checklist')
      .filter({ hasText: checklistTitle })
      .first()
      .locator('.js-checklist-item');
  }

  /**
   * Open the checklist actions popup for a given checklist title.
   * (The three-bar icon / .js-open-checklist-details-menu)
   */
  async openChecklistMenu(checklistTitle) {
    const checklist = this.root.locator('.js-checklist').filter({ hasText: checklistTitle }).first();
    await checklist.locator('.js-open-checklist-details-menu').click();
    await this.page.locator('.js-pop-over').waitFor({ timeout: 5_000 });
  }
}

module.exports = CardPage;
