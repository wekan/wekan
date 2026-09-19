36 findings: Critical 0 · High 4 · Medium 29 · Low 3.

## Functional

### [F01] Check/uncheck-item rules serialize inputs instead of names — High

`client/components/rules/actions/checklistActions.js:79`; `server/rulesHelper.js:625`

Problem: The checklist action buttons pass DOM elements through saveRuleTriggerAction instead of strings, so the saved action cannot match the checklist/item titles used by the executor.

Fix:

```diff
--- a/client/components/rules/actions/checklistActions.js
+++ b/client/components/rules/actions/checklistActions.js
@@ -77,6 +77,6 @@
     const ruleName = data.ruleName.get();
     const trigger = data.triggerVar.get();
-    const checkItemName = tpl.find('#checkitem-name');
-    const checklistName = tpl.find('#checklist-name3');
+    const checkItemName = tpl.find('#checkitem-name').value;
+    const checklistName = tpl.find('#checklist-name3').value;
     const actionSelected = tpl.find('#check-item-action').value;
     const boardId = Session.get('currentBoard');
```

### [F02] Relative card placement jumps across fractional neighbors — High

`client/components/cards/cardDetails.js:2275`; `client/components/cards/cardDetails.js:2329`; `client/components/cards/cardDetails.js:2382`; `client/components/cards/cardDetails.js:2430`; `client/components/cards/cardDetails.js:2478`

Problem: Move/copy/link/convert use ±0.5 rather than the adjacent sort gap (above 0.25 becomes −0.25 and jumps past 0); apply the shared calculation to every listed branch, including each iteration of bulk copy.

Fix:

```diff
--- a/client/components/cards/cardDetails.js
+++ b/client/components/cards/cardDetails.js
@@ -2244,4 +2244,18 @@
 }
 
+function relativeCardSort(targetCard, position) {
+  const neighbors = Cards.find({
+    boardId: targetCard.boardId,
+    listId: targetCard.listId,
+    swimlaneId: targetCard.swimlaneId,
+    archived: false,
+    sort: position === 'above' ? { $lt: targetCard.sort } : { $gt: targetCard.sort },
+  }, { sort: { sort: position === 'above' ? -1 : 1 }, limit: 1 }).fetch();
+  const neighbor = neighbors[0];
+  return neighbor
+    ? (targetCard.sort + neighbor.sort) / 2
+    : targetCard.sort + (position === 'above' ? -1 : 1);
+}
+
 /** Move Card Dialog */
 Template.moveCardPopup.onCreated(function () {
@@ -2273,7 +2287,7 @@
           const targetSort = targetCard.sort || 0;
           if (position === 'above') {
-            sortIndex = targetSort - 0.5;
+            sortIndex = relativeCardSort(targetCard, 'above');
           } else {
-            sortIndex = targetSort + 0.5;
+            sortIndex = relativeCardSort(targetCard, 'below');
           }
         }
@@ -2327,7 +2341,7 @@
                 const targetSort = targetCard.sort || 0;
                 if (position === 'above') {
-                  sortIndex = targetSort - 0.5;
+                  sortIndex = relativeCardSort(targetCard, 'above');
                 } else {
-                  sortIndex = targetSort + 0.5;
+                  sortIndex = relativeCardSort(targetCard, 'below');
                 }
               }
@@ -2380,5 +2394,5 @@
             if (targetCard) {
               const targetSort = targetCard.sort || 0;
-              sortIndex = position === 'above' ? targetSort - 0.5 : targetSort + 0.5;
+              sortIndex = relativeCardSort(targetCard, position);
             }
           } else {
@@ -2428,7 +2442,7 @@
             const targetSort = targetCard.sort || 0;
             if (position === 'above') {
-              sortIndex = targetSort - 0.5;
+              sortIndex = relativeCardSort(targetCard, 'above');
             } else {
-              sortIndex = targetSort + 0.5;
+              sortIndex = relativeCardSort(targetCard, 'below');
             }
           }
@@ -2476,7 +2490,7 @@
                 const targetSort = targetCard.sort || 0;
                 if (position === 'above') {
-                  sortIndex = targetSort - 0.5;
+                  sortIndex = relativeCardSort(targetCard, 'above');
                 } else {
-                  sortIndex = targetSort + 0.5;
+                  sortIndex = relativeCardSort(targetCard, 'below');
                 }
               }
@@ -2487,4 +2501,5 @@
 
             await newCard.move(options.boardId, options.swimlaneId, options.listId, sortIndex);
+            if (position === 'below') cardId = newCardId;
           }
 
```

### [F03] Destination follows response order instead of the last selection — High

`client/lib/dialogWithBoardSwimlaneList.js:236`; `client/lib/dialogWithBoardSwimlaneListCard.js:54`

Problem: Selecting board B then C lets a late B onReady overwrite the destination, while Done can still use the previous board before either response arrives.

Fix:

```diff
--- a/client/lib/dialogWithBoardSwimlaneList.js
+++ b/client/lib/dialogWithBoardSwimlaneList.js
@@ -235,10 +235,14 @@
   getBoardData(boardId) {
     const self = this;
+    const sameBoardId = self.selectedBoardId.get() === boardId;
+    self.selectedBoardId.set(boardId);
+    if (!sameBoardId) {
+      self.selectedSwimlaneId.set('');
+      self.selectedListId.set('');
+    }
     Meteor.subscribe('board', boardId, false, {
       onReady() {
-        const sameBoardId = self.selectedBoardId.get() == boardId;
-        self.selectedBoardId.set(boardId);
-
-        if (!sameBoardId) {
+        if (self.selectedBoardId.get() !== boardId) return;
+        if (!sameBoardId || !self.selectedSwimlaneId.get() || !self.selectedListId.get()) {
           self.setFirstSwimlaneId();
           self.setFirstListId();
--- a/client/lib/dialogWithBoardSwimlaneListCard.js
+++ b/client/lib/dialogWithBoardSwimlaneListCard.js
@@ -53,10 +53,14 @@
   getBoardData(boardId) {
     const self = this;
+    const sameBoardId = self.selectedBoardId.get() === boardId;
+    self.selectedBoardId.set(boardId);
+    if (!sameBoardId) {
+      self.selectedSwimlaneId.set('');
+      self.selectedListId.set('');
+    }
     Meteor.subscribe('board', boardId, false, {
       onReady() {
-        const sameBoardId = self.selectedBoardId.get() == boardId;
-        self.selectedBoardId.set(boardId);
-
-        if (!sameBoardId) {
+        if (self.selectedBoardId.get() !== boardId) return;
+        if (!sameBoardId || !self.selectedSwimlaneId.get() || !self.selectedListId.get()) {
           self.setFirstSwimlaneId();
           self.setFirstListId();
--- a/client/components/cards/cardDetails.js
+++ b/client/components/cards/cardDetails.js
@@ -2215,4 +2215,5 @@
         : null;
 
+      if (!boardId || !swimlaneId || !listId) return;
       const options = { boardId, swimlaneId, listId, cardId };
       try {
```

### [F04] Destination subscriptions outlive their popups — Medium

`client/lib/dialogWithBoardSwimlaneList.js:237`; `client/lib/dialogWithBoardSwimlaneListCard.js:55`

Problem: Every destination selection starts an unowned board subscription, so closing the popup retains its board data and observers.

Fix:

```diff
--- a/client/lib/dialogWithBoardSwimlaneList.js
+++ b/client/lib/dialogWithBoardSwimlaneList.js
@@ -235,5 +235,6 @@
   getBoardData(boardId) {
     const self = this;
-    Meteor.subscribe('board', boardId, false, {
+    this._boardSubscription?.stop();
+    this._boardSubscription = this.tpl.subscribe('board', boardId, false, {
       onReady() {
         const sameBoardId = self.selectedBoardId.get() == boardId;
--- a/client/lib/dialogWithBoardSwimlaneListCard.js
+++ b/client/lib/dialogWithBoardSwimlaneListCard.js
@@ -53,5 +53,6 @@
   getBoardData(boardId) {
     const self = this;
-    Meteor.subscribe('board', boardId, false, {
+    this._boardSubscription?.stop();
+    this._boardSubscription = this.tpl.subscribe('board', boardId, false, {
       onReady() {
         const sameBoardId = self.selectedBoardId.get() == boardId;
```

### [F05] Failed card operations dismiss the input — Medium

`client/components/cards/cardDetails.js:2220`

Problem: A rejected move/copy/link or malformed bulk-copy JSON is only logged before Popup.back(2), discarding the form and presenting failure like success.

Fix:

```diff
--- a/client/components/cards/cardDetails.js
+++ b/client/components/cards/cardDetails.js
@@ -2220,4 +2220,6 @@
       } catch (e) {
         console.error('Error in card dialog operation:', e);
+        window.alert(e.reason || e.message || TAPi18n.__('server-error'));
+        return;
       }
       Popup.back(2);
```

### [F06] Move up/down does nothing for tied card sorts — Medium

`client/components/cards/minicard.js:394`; `models/cards.js:2980`

Problem: The accessible move buttons swap equal sort values unchanged, and Card.move explicitly skips both writes; imported/legacy tied cards therefore cannot be reordered with these controls.

Fix:

```diff
--- a/client/components/cards/minicard.js
+++ b/client/components/cards/minicard.js
@@ -392,5 +392,5 @@
 // or down within its list via sr-only buttons (no drag-and-drop required). The
 // move swaps the card's sort value with its neighbour in the same list+swimlane.
-function moveCardBy(card, delta) {
+async function moveCardBy(card, delta) {
   const siblings = ReactiveCache.getCards(
     { listId: card.listId, swimlaneId: card.swimlaneId, archived: false },
@@ -407,6 +407,10 @@
   // path (e.g. editCardSortOrderPopup). A raw Cards.update of `sort` is the
   // wrong path here and would be reverted.
-  card.move(card.boardId, card.swimlaneId, card.listId, targetSort);
-  target.move(target.boardId, target.swimlaneId, target.listId, cardSort);
+  const ordered = siblings.slice();
+  [ordered[idx], ordered[idx + delta]] = [ordered[idx + delta], ordered[idx]];
+  for (let sort = 0; sort < ordered.length; sort++) {
+    const sibling = ordered[sort];
+    await sibling.move(sibling.boardId, sibling.swimlaneId, sibling.listId, sort);
+  }
 }
 
```

### [F07] Move list left/right swaps with an invisible swimlane list — Medium

`client/components/lists/listHeader.js:346`; `models/swimlanes.js:419`

Problem: The header buttons choose a neighbor from every list on the board, although swimlane rendering includes only that swimlane and shared lists, so moving right can leave the visible order unchanged.

Fix:

```diff
--- a/client/components/lists/listHeader.js
+++ b/client/components/lists/listHeader.js
@@ -345,8 +345,10 @@
 // swapping its sort value with the adjacent list (no drag-and-drop required).
 function moveListBy(list, delta) {
-  const siblings = ReactiveCache.getLists(
-    { boardId: list.boardId, archived: false },
-    { sort: { sort: 1 } },
-  );
+  const swimlaneId = resolveContainerSwimlaneId(list);
+  const selector = { boardId: list.boardId, archived: false };
+  if (Utils.boardView() === 'board-view-swimlanes' && swimlaneId) {
+    selector.swimlaneId = { $in: [swimlaneId, null, ''] };
+  }
+  const siblings = ReactiveCache.getLists(selector, { sort: { sort: 1 } });
   const idx = siblings.findIndex(l => l._id === list._id);
   const target = siblings[idx + delta];
```

### [F08] Calendar option updates reset the selected view — Medium

`packages/wekan-fullcalendar/template.js:70`; `client/components/boards/boardBody.js:1189`

Problem: Changing language or first-day preferences recreates the calendar with the supplied initialView, overriding a user-selected week/day view despite capturing preservedViewType.

Fix:

```diff
--- a/packages/wekan-fullcalendar/template.js
+++ b/packages/wekan-fullcalendar/template.js
@@ -68,5 +68,5 @@
     }
 
-    if (preservedViewType && !options.initialView) {
+    if (preservedViewType) {
       options.initialView = preservedViewType;
     }
```

### [F09] New translation closes before duplicate validation — Medium

`client/components/settings/translationBody.js:196`; `server/models/translation.js:20`

Problem: New translation calls Popup.back immediately and again on success, so a duplicate error targets an already dismissed form and success can navigate back twice.

Fix:

```diff
--- a/client/components/settings/translationBody.js
+++ b/client/components/settings/translationBody.js
@@ -219,5 +219,4 @@
       },
     );
-    Popup.back();
   },
 });
```

### [F10] Literal punctuation breaks translation search — Medium

`client/components/settings/translationBody.js:55`

Problem: Entering [ or ( and pressing Enter throws while constructing the search RegExp, leaving the previous results instead of searching the entered text.

Fix:

```diff
--- a/client/components/settings/translationBody.js
+++ b/client/components/settings/translationBody.js
@@ -53,5 +53,5 @@
       this.findTranslationsOptions.set({});
     } else {
-      const regex = new RegExp(value, 'i');
+      const regex = new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
       this.findTranslationsOptions.set({
         $or: [
```

### [F11] Number shortcuts throw outside a board — Medium

`client/lib/keyboard.js:167`; `client/lib/keyboard.js:182`

Problem: Both number and Shift+number handlers dereference board.labels on All Boards and other non-board pages when a user is signed in; apply the guard to both occurrences.

Fix:

```diff
--- a/client/lib/keyboard.js
+++ b/client/lib/keyboard.js
@@ -166,4 +166,5 @@
   const currentBoardId = Session.get('currentBoard');
   const board = ReactiveCache.getBoard(currentBoardId);
+  if (!board) return;
   const labels = board.labels;
   if (MultiSelection.isActive()) {
@@ -189,4 +190,5 @@
   }
   const board = ReactiveCache.getBoard(currentBoardId);
+  if (!board) return;
   const labels = board.labels;
   if (MultiSelection.isActive() && ReactiveCache.getCurrentUser().isBoardMember()) {
```

### [F12] Overtime is saved even when the time editor is cancelled — Medium

`client/components/cards/cardTime.js:59`; `models/cards.js:2154`

Problem: Clicking the overtime checkbox immediately writes the card, so closing the popup without Save still changes overtime.

Fix:

```diff
--- a/client/components/cards/cardTime.js
+++ b/client/components/cards/cardTime.js
@@ -57,7 +57,6 @@
     const card = Cards.findOne(getCardId());
     if (!card) return;
-    card.setIsOvertime(!card.getIsOvertime());
-    $('#overtime .materialCheckBox').toggleClass('is-checked');
-    $('#overtime').toggleClass('is-checked');
+    evt.preventDefault();
+    $(evt.currentTarget).find('#overtime').toggleClass('is-checked');
   },
 });
```

### [F13] Card picker selection is bound to the previous saved choice — Medium

`client/lib/dialogWithBoardSwimlaneListCard.js:49`; `client/components/cards/cardDetails.jade:1271`

Problem: The card options read cardOption.cardId instead of selectedCardId, so reactive option updates can restore the previous saved target instead of the card just selected.

Fix:

```diff
--- a/client/lib/dialogWithBoardSwimlaneListCard.js
+++ b/client/lib/dialogWithBoardSwimlaneListCard.js
@@ -11,5 +11,5 @@
   constructor(tpl, callbacks = {}) {
     super(tpl, callbacks);
-    this.selectedCardId = new ReactiveVar('');
+    this.selectedCardId = new ReactiveVar(this.cardOption.cardId || '');
   }
 
@@ -47,5 +47,5 @@
   /** returns if the card id was the last confirmed one */
   isDialogOptionCardId(cardId) {
-    return this.cardOption.cardId == cardId;
+    return this.selectedCardId.get() === cardId;
   }
 
```

### [F14] Four minicard visibility toggles have no rendered target — Medium

`models/lib/cardSettingsRows.js:79`; `models/lib/cardSettingsRows.js:82`; `models/lib/cardSettingsRows.js:124`; `models/lib/cardSettingsRows.js:145`

Problem: Requested by, Assigned by, Description title and Attachments save allows*OnMinicard flags that neither minicard helpers nor its template consume; remove these inert rows until their rendering is implemented.

Fix:

```diff
--- a/models/lib/cardSettingsRows.js
+++ b/models/lib/cardSettingsRows.js
@@ -78,9 +78,7 @@
     minicard: { toggle: 'js-field-has-creator-on-minicard', field: 'allowsCreatorOnMinicard' } },
   { key: 'requestedBy', icons: ['fa-user', 'fa-plus'], label: ['requested-by'],
-    card: { toggle: 'js-field-has-requested-by', field: 'allowsRequestedBy' },
-    minicard: { toggle: 'js-field-has-requested-by-on-minicard', field: 'allowsRequestedByOnMinicard', after: 'creator' } },
+    card: { toggle: 'js-field-has-requested-by', field: 'allowsRequestedBy' } },
   { key: 'assignedBy', icons: ['fa-shopping-cart'], label: ['assigned-by'],
-    card: { toggle: 'js-field-has-assigned-by', field: 'allowsAssignedBy' },
-    minicard: { toggle: 'js-field-has-assigned-by-on-minicard', field: 'allowsAssignedByOnMinicard', after: 'requestedBy' } },
+    card: { toggle: 'js-field-has-assigned-by', field: 'allowsAssignedBy' } },
 
   { key: 'dependencies', icons: ['fa-link'], label: ['card-dependencies'],
@@ -123,6 +121,5 @@
 
   { key: 'descriptionTitle', icons: ['fa-file-text-o'], label: ['description', 'title'],
-    card: { toggle: 'js-field-has-description-title', field: 'allowsDescriptionTitle' },
-    minicard: { toggle: 'js-field-has-description-title-on-minicard', field: 'allowsDescriptionTitleOnMinicard', after: 'descriptionText' } },
+    card: { toggle: 'js-field-has-description-title', field: 'allowsDescriptionTitle' } },
   { key: 'descriptionText', icons: ['fa-file-text-o'], label: ['description', 'custom-field-text'],
     card: { toggle: 'js-field-has-description-text', field: 'allowsDescriptionText' },
@@ -144,6 +141,5 @@
   // toggle there predates it and has no element of its own, so it follows.
   { key: 'attachments', icons: ['fa-paperclip'], label: ['attachments'],
-    card: { toggle: 'js-field-has-attachments', field: 'allowsAttachments' },
-    minicard: { toggle: 'js-field-has-attachments-on-minicard', field: 'allowsAttachmentsOnMinicard', after: 'attachmentCount' } },
+    card: { toggle: 'js-field-has-attachments', field: 'allowsAttachments' } },
   // #595 text notes: card only, nothing of them is on the minicard.
   { key: 'textNotes', icons: ['fa-file-text-o'], label: ['text-notes'],
```

### [F15] Attachment background actions depend on mouse hover — Medium

`client/components/cards/attachments.js:54`; `client/components/cards/attachments.js:643`

Problem: Keyboard activation uses a null or previously hovered attachment URL, and the hardcoded false background helper makes Remove background image unreachable even after Add succeeds.

Fix:

```diff
--- a/client/components/cards/attachments.js
+++ b/client/components/cards/attachments.js
@@ -30,6 +30,4 @@
 let touchEndCoords = null;
 
-// Stores link to the attachment for which attachment actions popup was opened
-let attachmentActionsLink = null;
 let officePreview = null;
 let officePreviewAbortController = null;
@@ -52,7 +50,4 @@
   },
   'click .js-open-attachment-menu': Popup.open('attachmentActions'),
-  'mouseover .js-open-attachment-menu'(event) { // For some reason I cannot combine handlers for "click .js-open-attachment-menu" and "mouseover .js-open-attachment-menu" events so this is a quick workaround.
-    attachmentActionsLink = event.currentTarget.getAttribute("data-attachment-link");
-  },
   'click .js-rename': Popup.open('attachmentRename'),
   // History.md §12.1: Delete is a SOFT delete, done by the server. The method
@@ -642,7 +637,6 @@
   },
   isBackgroundImage() {
-    //const currentBoard = Utils.getCurrentBoard();
-    //return currentBoard.backgroundImageURL === $(".attachment-thumbnail-img").attr("src");
-    return false;
+    const url = getAttachmentUrl(this);
+    return !!url && Utils.getCurrentBoard()?.backgroundImageURL === url;
   },
 });
@@ -659,6 +653,8 @@
   'click .js-add-background-image'(event) {
     const currentBoard = Utils.getCurrentBoard();
-    currentBoard.setBackgroundImageURL(attachmentActionsLink);
-    Utils.setBackgroundImage(attachmentActionsLink);
+    const url = getAttachmentUrl(this);
+    if (!url) return;
+    currentBoard.setBackgroundImageURL(url);
+    Utils.setBackgroundImage(url);
     Popup.back();
     event.preventDefault();
```

### [F16] Checklist visibility switch targets the first open card — Medium

`client/components/cards/checklists.jade:18`; `client/components/cards/checklists.js:405`; `client/components/boards/boardBody.jade:104`

Problem: Every open card renders the same input id, so clicking the second card’s switch label activates the first card’s input and its toggleHideFinishedChecklist mutation.

Fix:

```diff
--- a/client/components/cards/checklists.jade
+++ b/client/components/cards/checklists.jade
@@ -16,8 +16,8 @@
         //span.toggle-switch-title
         if card.hideFinishedChecklistIfItemsAreHidden
-          input.toggle-switch(type="checkbox" id="toggleHideFinishedChecklist" checked="checked")
+          input.toggle-switch.js-toggle-hide-finished-checklist(type="checkbox" id="toggleHideFinishedChecklist_{{card._id}}" checked="checked")
         else
-          input.toggle-switch(type="checkbox" id="toggleHideFinishedChecklist")
-        label.toggle-label(for="toggleHideFinishedChecklist")
+          input.toggle-switch.js-toggle-hide-finished-checklist(type="checkbox" id="toggleHideFinishedChecklist_{{card._id}}")
+        label.toggle-label(for="toggleHideFinishedChecklist_{{card._id}}")
 
   .card-checklist-items
--- a/client/components/cards/checklists.js
+++ b/client/components/cards/checklists.js
@@ -403,5 +403,5 @@
     tpl.$('.js-close-inlined-form').click();
   },
-  'click #toggleHideFinishedChecklist'(event) {
+  'click .js-toggle-hide-finished-checklist'(event) {
     event.preventDefault();
     Template.currentData().card.toggleHideFinishedChecklist();
```

### [F17] Attachment viewer is missing from history and duplicated across cards — Medium

`client/components/cards/cardDetails.jade:6`; `client/components/settings/adminProblems.jade:2`; `client/components/history/historyTable.js:253`; `client/components/cards/attachments.js:123`

Problem: History preview calls a viewer mounted only by card details or Admin Problems, leaving board history without a viewer when no card is open and producing duplicate global viewer ids when several cards are open.

Fix:

```diff
--- a/client/components/cards/cardDetails.jade
+++ b/client/components/cards/cardDetails.jade
@@ -3,6 +3,4 @@
 
 template(name="cardDetails")
-
-  +attachmentViewer
 
   //- `card-details-with-handle` when drag handles are on, the same class the
--- a/client/components/settings/adminProblems.jade
+++ b/client/components/settings/adminProblems.jade
@@ -1,4 +1,3 @@
 template(name="adminProblems")
-  +attachmentViewer
   .setting-content.admin-reports-content
     unless currentUser.isAdmin
--- a/client/components/main/layouts.jade
+++ b/client/components/main/layouts.jade
@@ -131,4 +131,5 @@
 
 template(name="defaultLayout")
+  +attachmentViewer
   +recoveryMaintenance
   //- Shared migration / board-repair progress dashboard. Mounted app-wide so it
```

## Visual

### [V01] Popup headers do not grow with the font preset — Medium

`client/components/main/popup.css:42`; `client/components/main/popup.css:929`

Problem: The 150% preset makes the title line-height 54px plus padding inside a fixed 41px desktop/48px mobile header, overlapping the content; scale the header and mobile content offset together.

Fix:

```diff
--- a/client/components/main/popup.css
+++ b/client/components/main/popup.css
@@ -40,5 +40,5 @@
    side padding, so 6 + 12 = 18 makes the top gap and the left gutter the same. */
 .pop-over .header {
-  height: 41px;
+  height: calc(41px * var(--wekan-ui-font-scale, 1));
   position: relative;
   margin-bottom: 6px;
@@ -927,5 +927,5 @@
        unchanged. */
     background: var(--theme-accent, #2980b9);
-    height: 48px;
+    height: calc(48px * var(--wekan-ui-font-scale, 1));
     padding: 0px 0px;
     border: 0px;
@@ -956,8 +956,8 @@
   .pop-over .content-wrapper {
     width: 100%;
-    height: calc(100% - 48px);
+    height: calc(100% - 48px * var(--wekan-ui-font-scale, 1));
     overflow-y: scroll;
     overflow-x: hidden;
-    margin: 48px 0px 0px 0px;
+    margin: calc(48px * var(--wekan-ui-font-scale, 1)) 0 0;
   }
   .pop-over .content-container {
```

### [V02] Frappe chart text bypasses the global font scale — Medium

`client/components/gantt/frappeGanttLib.css:9`; `client/components/main/uiFont.js:52`

Problem: The vendored Frappe container, date headers, controls and SVG bar labels retain 12/13/14px while surrounding WeKan text uses --wekan-ui-font-scale.

Fix:

```diff
--- a/client/components/gantt/frappeGantt.css
+++ b/client/components/gantt/frappeGantt.css
@@ -2,4 +2,19 @@
   overflow-x: auto;
   min-height: 80px;
+}
+
+.gantt-view .gantt-container {
+  font-size: calc(12px * var(--wekan-ui-font-scale, 1));
+  line-height: calc(14.5px * var(--wekan-ui-font-scale, 1));
+}
+.gantt-view .gantt-container .lower-text {
+  font-size: calc(12px * var(--wekan-ui-font-scale, 1));
+}
+.gantt-view .gantt-container .upper-text,
+.gantt-view .gantt-container .side-header * {
+  font-size: calc(14px * var(--wekan-ui-font-scale, 1));
+}
+.gantt-view .gantt .bar-label {
+  font-size: calc(13px * var(--wekan-ui-font-scale, 1));
 }
 
```

### [V04] Minicard completion checkbox occupies a separate line — Medium

`client/components/cards/minicard.jade:47`; `client/components/cards/minicard.css:312`; `client/components/cards/minicard.css:1069`

Problem: The inline completion control is followed by a block title, forcing the title below it instead of beside it; place the control and title in one flex row while keeping parent-path prefixes above that row.

Fix:

```diff
--- a/client/components/cards/minicard.jade
+++ b/client/components/cards/minicard.jade
@@ -46,8 +46,4 @@
       aria-expanded="{{#if minicardCollapsed}}false{{else}}true{{/if}}")
     .minicard-title
-      if showDueComplete
-        if canModifyCard
-          a.minicard-complete-toggle.js-toggle-card-complete(title="{{#if getDueComplete}}{{_ 'card-mark-incomplete'}}{{else}}{{_ 'card-mark-complete'}}{{/if}}")
-            .materialCheckBox(class="{{#if getDueComplete}}is-checked{{/if}}")
       if $eq 'prefix-with-full-path' currentBoard.presentParentTask
         .parent-prefix
@@ -56,21 +52,26 @@
         .parent-prefix
           | {{ parentCardName }}
-      if isLinkedBoard
-        a.js-linked-link
-          span.linked-icon
-            i.fa.fa-folder
-      else if isLinkedCard
-        a.js-linked-link
-          span.linked-icon
-            i.fa.fa-id-card
-      if getArchived
-        span.linked-icon.linked-archived
-          i.fa.fa-archive
-      span.minicard-title-text
-        if showCardNumber
-          span.card-number
-            | ##{getCardNumber} &nbsp;
-        +viewer
-          = getTitle
+      .minicard-title-row
+        if showDueComplete
+          if canModifyCard
+            a.minicard-complete-toggle.js-toggle-card-complete(title="{{#if getDueComplete}}{{_ 'card-mark-incomplete'}}{{else}}{{_ 'card-mark-complete'}}{{/if}}")
+              .materialCheckBox(class="{{#if getDueComplete}}is-checked{{/if}}")
+        if isLinkedBoard
+          a.js-linked-link
+            span.linked-icon
+              i.fa.fa-folder
+        else if isLinkedCard
+          a.js-linked-link
+            span.linked-icon
+              i.fa.fa-id-card
+        if getArchived
+          span.linked-icon.linked-archived
+            i.fa.fa-archive
+        span.minicard-title-text
+          if showCardNumber
+            span.card-number
+              | ##{getCardNumber} &nbsp;
+          +viewer
+            = getTitle
     //- Everything under the title renders in the board's minicard order
       (Board Settings / Card, "Show on Minicard"; board.minicardFieldOrder,
--- a/client/components/cards/minicard.css
+++ b/client/components/cards/minicard.css
@@ -310,7 +310,15 @@
    line, not only the words, is that target: a click on the empty space after a
    short title is still a click on the title. */
+.minicard .minicard-title-row {
+  display: flex;
+  align-items: center;
+  gap: 6px;
+  min-width: 0;
+}
 .minicard .minicard-title .minicard-title-text {
   display: block;
   position: relative;
+  flex: 1;
+  min-width: 0;
 }
 
@@ -1071,9 +1079,6 @@
   align-items: center;
   vertical-align: middle;
-  /* Nudge down so the checkmark sits at the vertical middle of the title text
-     (the checked materialCheckBox is shifted up 4px by its own positioning). */
-  position: relative;
-  top: 4px;
-  margin-inline-end: 6px;
+  flex-shrink: 0;
+  margin-inline-end: 0;
   cursor: pointer;
 }
```

### [V05] Checklist progress fill exceeds its percentage width — Medium

`client/components/cards/checklists.css:43`; `client/components/cards/checklists.jade:81`; `client/components/main/layouts.css:1`

Problem: The percentage-width fill uses content-box sizing plus 32px horizontal padding, so 100% extends 32px beyond the track and smaller percentages overstate progress.

Fix:

```diff
--- a/client/components/cards/checklists.css
+++ b/client/components/cards/checklists.css
@@ -44,5 +44,6 @@
   color: #fff;
   background-color: #666;
-  padding: 0.01em 16px;
+  padding: 0;
+  box-sizing: border-box;
   border-radius: 16px;
   height: 100%;
```

### [V06] Long checklist text and attachment names push controls out of view — Medium

`client/components/cards/checklists.css:135`; `client/components/cards/attachments.css:44`; `client/components/cards/attachments.css:48`

Problem: Automatic flex minimum widths retain long unbroken titles/filenames, while the attachment metadata row never wraps, pushing adjacent due-date or attachment actions beyond the card’s clipped horizontal viewport.

Fix:

```diff
--- a/client/components/cards/checklists.css
+++ b/client/components/cards/checklists.css
@@ -135,4 +135,6 @@
 .checklist-item .item-title {
   flex: 1;
+  min-width: 0;
+  overflow-wrap: anywhere;
 }
 .checklist-item .item-title.is-checked {
@@ -144,5 +146,5 @@
   margin-bottom: 2px;
   display: block;
-  word-wrap: break-word;
+  overflow-wrap: anywhere;
   max-width: 420px;
 }
--- a/client/components/cards/attachments.css
+++ b/client/components/cards/attachments.css
@@ -45,7 +45,11 @@
   display: block;
   flex-grow: 1;
+  min-width: 0;
+  overflow-wrap: anywhere;
 }
 .attachment-details {
   display: flex;
+  flex-wrap: wrap;
+  gap: 8px;
   justify-content: space-between;
   margin-inline-end: 25px; /* Make sure the icons are not to far to the right */
```

### [V07] Card Settings retains two columns on narrow screens — Medium

`client/components/sidebar/sidebar.css:162`; `client/components/main/popup.css:302`

Problem: The two 1fr tracks keep automatic minimum widths for icon-heavy translated rows at mobile widths, overflowing the popup instead of stacking the Minicard and Card columns.

Fix:

```diff
--- a/client/components/sidebar/sidebar.css
+++ b/client/components/sidebar/sidebar.css
@@ -162,7 +162,17 @@
 .card-field-order-columns {
   display: grid;
-  grid-template-columns: 1fr 1fr;
+  grid-template-columns: repeat(2, minmax(0, 1fr));
   column-gap: 18px;
   align-items: start;
+}
+
+@media screen and (max-width: 800px) {
+  .card-field-order-columns {
+    grid-template-columns: minmax(0, 1fr);
+  }
+}
+
+.card-field-order-column {
+  min-width: 0;
 }
 
@@ -195,4 +205,5 @@
 
 .card-field-order-label {
+  overflow-wrap: anywhere;
   display: inline-flex;
   align-items: center;
@@ -226,5 +237,15 @@
   }
   .board-card-settings.show-card-only .card-field-order-column-heading,
-  .board-card-settings.show-minicard-only .card-field-order-column-heading {
+  .board-card-settings.show-minicard-only @media screen and (max-width: 800px) {
+  .card-field-order-columns {
+    grid-template-columns: minmax(0, 1fr);
+  }
+}
+
+.card-field-order-column {
+  min-width: 0;
+}
+
+.card-field-order-column-heading {
     grid-column: 1 / -1;
   }
```

### [V03] Miniprofile reserves avatar space on the wrong side in RTL — Low

`client/components/main/popup.css:885`

Problem: The avatar uses inset-inline-start but its information block always reserves physical left margin, leaving RTL text beneath the right-hand avatar.

Fix:

```diff
--- a/client/components/main/popup.css
+++ b/client/components/main/popup.css
@@ -884,5 +884,6 @@
 }
 .pop-over.miniprofile .miniprofile-header .info {
-  margin: 0 0 0 64px;
+  margin: 0;
+  margin-inline-start: 64px;
   word-wrap: break-word;
 }
```

## Template/i18n

### [T01] Missing source keys leak identifiers into the UI — Medium

- no-list-found: `client/components/sidebar/sidebarArchives.jade:113`

- select-list: `client/components/sidebar/sidebarArchives.jade:113`

- no-swimlane-found: `client/components/sidebar/sidebarArchives.jade:122`

- select-swimlane: `client/components/sidebar/sidebarArchives.jade:122`

- impersonate-org: `client/components/settings/peopleBody.jade:690`

- error-text-taken: `client/components/settings/translationBody.jade:60`

- drag-list: `client/components/lists/listHeader.jade:134`, `client/components/lists/listHeader.jade:145`

- dragList: `client/components/lists/minilist.jade:6`

- dragChecklist: `client/components/cards/checklists.jade:62`

- dragChecklistItem: `client/components/cards/checklists.jade:180`

- dragLabel: `client/components/cards/labels.jade:39`

- migrating-attachment: `client/components/cards/attachments.jade:112`

- collapse-card: `client/components/cards/cardDetails.jade:31`

- top-level-card: `client/components/cards/cardDetails.jade:99`

- add-subtask-item: `client/components/cards/subtasks.jade:96`

- date-created-newest-first: `client/components/boards/boardHeader.js:777`

- date-created-oldest-first: `client/components/boards/boardHeader.js:785`

- card-due-date: `client/components/boards/timelineView.jade:47`

- favorite-toggle-label: `client/components/boards/boardBody.js:479`

- dragBoard: `client/components/boards/miniboard.jade:6`

- reaction: `client/components/activities/comments.jade:93`

- Card: `client/components/main/myCards.jade:52`

- List: `client/components/main/myCards.jade:53`

- Board: `client/components/main/myCards.jade:54`

- Swimlane: `client/components/main/myCards.jade:55`

- Members: `client/components/main/myCards.jade:57`

- Labels: `client/components/main/myCards.jade:58`

- Due Date: `client/components/main/myCards.jade:59`

- bookmarks: `client/components/main/bookmarks.jade:3`

- star-board-short-unstar: `client/components/main/bookmarks.jade:10`, `client/components/main/bookmarks.jade:26`

- no-starred-boards: `client/components/main/bookmarks.jade:13`, `client/components/main/bookmarks.jade:29`

- please-sign-in: `client/components/main/bookmarks.jade:15`

- search-users: `client/components/import/import.jade:214`

- loading-boards: `client/components/rules/actions/boardActions.js:41`

- copy-tag: `models/import.js:245`

Problem: 35 literal keys are absent from the English fallback, leaving raw identifiers or untranslated English in destination/archive controls, sort menus, drag labels and other listed UI.

Fix:

```diff
--- a/imports/i18n/data/en.i18n.json
+++ b/imports/i18n/data/en.i18n.json
@@ -1,3 +1,38 @@
 {
+  "no-list-found": "No list found",
+  "select-list": "Select list",
+  "no-swimlane-found": "No swimlane found",
+  "select-swimlane": "Select swimlane",
+  "impersonate-org": "Impersonate organization",
+  "error-text-taken": "A translation already exists for this language and key.",
+  "drag-list": "Drag list",
+  "dragList": "Drag list",
+  "dragChecklist": "Drag checklist",
+  "dragChecklistItem": "Drag checklist item",
+  "dragLabel": "Drag label",
+  "migrating-attachment": "Migrating attachment",
+  "collapse-card": "Collapse card",
+  "top-level-card": "Top-level card",
+  "add-subtask-item": "Add subtask",
+  "date-created-newest-first": "Date created (newest first)",
+  "date-created-oldest-first": "Date created (oldest first)",
+  "card-due-date": "Due date",
+  "favorite-toggle-label": "Toggle favorite",
+  "dragBoard": "Drag board",
+  "reaction": "Reaction",
+  "Card": "Card",
+  "List": "List",
+  "Board": "Board",
+  "Swimlane": "Swimlane",
+  "Members": "Members",
+  "Labels": "Labels",
+  "Due Date": "Due date",
+  "bookmarks": "Bookmarks",
+  "star-board-short-unstar": "Unstar board",
+  "no-starred-boards": "No starred boards",
+  "please-sign-in": "Please sign in",
+  "search-users": "Search users",
+  "loading-boards": "Loading boards…",
+  "copy-tag": "Copy",
   "accept": "Accept",
   "activity-changedTitle": "changed title to %s of %s",
```

### [T02] Custom translations reject supported locale tags — Medium

`models/translation.js:16`

Problem: The language field permits five characters, rejecting supported tags such as zh-Hans, zh-Hant, wuu-Hans and ca@valencia entered in the translation editor.

Fix:

```diff
--- a/models/translation.js
+++ b/models/translation.js
@@ -14,5 +14,5 @@
        */
       type: String,
-      max: 5,
+      max: 35,
     },
     text: {
```

### [T03] Account-operation failures contain hardcoded English — Low

`client/components/settings/peopleBody.js:2592`; `client/components/settings/peopleBody.js:2623`; `client/components/users/userHeader.js:261`

Problem: Delete/anonymize-account failure handlers bypass TAPi18n, displaying English in otherwise translated settings; use localized error text at the listed branches.

Fix:

```diff
--- a/client/components/settings/peopleBody.js
+++ b/client/components/settings/peopleBody.js
@@ -2590,11 +2590,11 @@
         // Show error message to user
         if (error.error === 'not-authorized') {
-          alert('You are not authorized to delete this user.');
+          alert(TAPi18n.__('error-delete-user-not-authorized'));
         } else if (error.error === 'user-not-found') {
-          alert('User not found.');
+          alert(TAPi18n.__('error-user-doesNotExist'));
         } else if (error.error === 'not-authorized' && error.reason === 'Cannot delete the last administrator') {
-          alert('Cannot delete the last administrator.');
+          alert(TAPi18n.__('error-delete-last-admin'));
         } else {
-          alert('Error deleting user: ' + error.reason);
+          alert(TAPi18n.__('error-deleting-user') + ': ' + error.reason);
         }
       } else {
@@ -2621,9 +2621,9 @@
         }
         if (error.error === 'not-authorized') {
-          alert('You are not authorized to anonymize this user.');
+          alert(TAPi18n.__('error-anonymize-user-not-authorized'));
         } else if (error.error === 'user-not-found') {
-          alert('User not found.');
+          alert(TAPi18n.__('error-user-doesNotExist'));
         } else {
-          alert('Error anonymizing user: ' + error.reason);
+          alert(TAPi18n.__('error-anonymizing-user') + ': ' + error.reason);
         }
       } else {
--- a/client/components/users/userHeader.js
+++ b/client/components/users/userHeader.js
@@ -259,5 +259,5 @@
           console.error('Error removing user:', error);
         }
-        alert('Error deleting account: ' + error.reason);
+        alert(TAPi18n.__('error-deleting-account') + ': ' + error.reason);
       } else {
         if (process.env.DEBUG === 'true') {
@@ -278,5 +278,5 @@
           console.error('Error anonymizing user:', error);
         }
-        alert('Error anonymizing account: ' + error.reason);
+        alert(TAPi18n.__('error-anonymizing-account') + ': ' + error.reason);
       } else {
         if (process.env.DEBUG === 'true') {
--- a/imports/i18n/data/en.i18n.json
+++ b/imports/i18n/data/en.i18n.json
@@ -1855,4 +1855,11 @@
   "map-provider-saved": "Default map service saved.",
   "server-error": "Server Error",
+  "error-delete-user-not-authorized": "You are not authorized to delete this user.",
+  "error-anonymize-user-not-authorized": "You are not authorized to anonymize this user.",
+  "error-delete-last-admin": "Cannot delete the last administrator.",
+  "error-deleting-user": "Error deleting user",
+  "error-anonymizing-user": "Error anonymizing user",
+  "error-deleting-account": "Error deleting account",
+  "error-anonymizing-account": "Error anonymizing account",
   "server-error-troubleshooting": "Please submit the error generated by the server.\nFor a snap installation, run: `sudo snap logs wekan.wekan`\nFor a Docker installation, run: `sudo docker logs wekan-app`",
   "title-alphabetically": "Title (Alphabetically)",
```

## A11y

### [A01] Global Space shortcut hijacks focused controls — High

`client/lib/keyboard.js:25`; `client/lib/keyboard.js:267`

Problem: The shortcut filter allows focused buttons and links, then Space prevents their native activation and can toggle membership on the selected card instead.

Fix:

```diff
--- a/client/lib/keyboard.js
+++ b/client/lib/keyboard.js
@@ -45,4 +45,7 @@
   // Make sure we are not in an input element
   if (currentElement instanceof HTMLInputElement || currentElement instanceof HTMLSelectElement || currentElement instanceof HTMLTextAreaElement)
+    return false;
+
+  if (currentElement.closest('button, a[href], summary, [role="button"], [role="tab"], [role="checkbox"]'))
     return false;
 
```

### [A02] Rule trigger/action add controls are mouse-only — Medium

`client/components/rules/triggers/cardTriggers.jade:12`; `client/components/rules/triggers/cardTriggers.jade:19`; `client/components/rules/triggers/cardTriggers.jade:43`; `client/components/rules/triggers/cardTriggers.jade:50`; `client/components/rules/triggers/cardTriggers.jade:63`; `client/components/rules/triggers/cardTriggers.jade:70`; `client/components/rules/triggers/cardTriggers.jade:92`; `client/components/rules/triggers/cardTriggers.jade:99`; `client/components/rules/triggers/cardTriggers.jade:112`; `client/components/rules/triggers/cardTriggers.jade:119`; `client/components/rules/triggers/cardTriggers.jade:141`; `client/components/rules/triggers/cardTriggers.jade:148`; `client/components/rules/triggers/cardTriggers.jade:163`; `client/components/rules/triggers/cardTriggers.jade:170`; `client/components/rules/triggers/cardTriggers.jade:179`; `client/components/rules/triggers/cardTriggers.jade:188`; `client/components/rules/triggers/cardTriggers.jade:195`; `client/components/rules/triggers/cardTriggers.jade:202`; `client/components/rules/triggers/cardTriggers.jade:209`; `client/components/rules/triggers/cardTriggers.jade:216`; `client/components/rules/triggers/cardTriggers.jade:223`; `client/components/rules/triggers/cardTriggers.jade:230`; `client/components/rules/triggers/cardTriggers.jade:237`; `client/components/rules/triggers/cardTriggers.jade:244`; `client/components/rules/triggers/checklistTriggers.jade:12`; `client/components/rules/triggers/checklistTriggers.jade:19`; `client/components/rules/triggers/checklistTriggers.jade:41`; `client/components/rules/triggers/checklistTriggers.jade:48`; `client/components/rules/triggers/checklistTriggers.jade:59`; `client/components/rules/triggers/checklistTriggers.jade:66`; `client/components/rules/triggers/checklistTriggers.jade:85`; `client/components/rules/triggers/checklistTriggers.jade:92`; `client/components/rules/triggers/checklistTriggers.jade:103`; `client/components/rules/triggers/checklistTriggers.jade:110`; `client/components/rules/triggers/checklistTriggers.jade:129`; `client/components/rules/triggers/checklistTriggers.jade:136`; `client/components/rules/triggers/boardTriggers.jade:20`; `client/components/rules/triggers/boardTriggers.jade:27`; `client/components/rules/triggers/boardTriggers.jade:38`; `client/components/rules/triggers/boardTriggers.jade:45`; `client/components/rules/triggers/boardTriggers.jade:68`; `client/components/rules/triggers/boardTriggers.jade:75`; `client/components/rules/triggers/boardTriggers.jade:90`; `client/components/rules/triggers/boardTriggers.jade:97`; `client/components/rules/triggers/scheduledTriggers.jade:42`; `client/components/rules/triggers/scheduledTriggers.jade:62`; `client/components/rules/triggers/scheduledTriggers.jade:79`; `client/components/rules/triggers/buttonTriggers.jade:12`; `client/components/rules/actions/cardActions.jade:18`; `client/components/rules/actions/cardActions.jade:32`; `client/components/rules/actions/cardActions.jade:48`; `client/components/rules/actions/cardActions.jade:61`; `client/components/rules/actions/cardActions.jade:68`; `client/components/rules/actions/cardActions.jade:75`; `client/components/rules/actions/cardActions.jade:82`; `client/components/rules/actions/cardActions.jade:93`; `client/components/rules/actions/cardActions.jade:102`; `client/components/rules/actions/cardActions.jade:126`; `client/components/rules/actions/mailActions.jade:12`; `client/components/rules/actions/boardActions.jade:12`; `client/components/rules/actions/boardActions.jade:41`; `client/components/rules/actions/boardActions.jade:52`; `client/components/rules/actions/boardActions.jade:61`; `client/components/rules/actions/boardActions.jade:78`; `client/components/rules/actions/boardActions.jade:103`; `client/components/rules/actions/boardActions.jade:120`; `client/components/rules/actions/boardActions.jade:133`; `client/components/rules/actions/checklistActions.jade:12`; `client/components/rules/actions/checklistActions.jade:25`; `client/components/rules/actions/checklistActions.jade:43`; `client/components/rules/actions/checklistActions.jade:56`

Problem: The listed clickable div.trigger-button controls have no tabindex, keyboard handler or accessible name; convert each to a named native button using this pattern.

Fix:

```diff
--- a/client/components/rules/actions/checklistActions.jade
+++ b/client/components/rules/actions/checklistActions.jade
@@ -41,6 +41,6 @@
       div.trigger-dropdown
         input(id="checklist-name3",type=text,placeholder="{{_'r-name'}}")
-    div.trigger-button.js-add-check-item-action.js-goto-rules
-      i.fa.fa-plus
+    button.trigger-button.js-add-check-item-action.js-goto-rules(type="button" aria-label="{{_ 'add'}}")
+      i.fa.fa-plus(aria-hidden="true")
 
   div.trigger-item
```

### [A03] Destination selects have unassociated labels — Medium

`client/components/cards/cardDetails.jade:1253`

Problem: All four destination labels are siblings without for/id associations, and their selects have no accessible names.

Fix:

```diff
--- a/client/components/cards/cardDetails.jade
+++ b/client/components/cards/cardDetails.jade
@@ -1254,20 +1254,20 @@
   unless currentUser.isWorker
     label {{_ 'boards'}}:
-    select.js-select-boards(autofocus)
+    select.js-select-boards(autofocus aria-label="{{_ 'boards'}}")
       each boards
         option(value="{{_id}}" selected="{{#if isSelectedBoardId _id}}selected{{/if}}") {{title}}
 
   label {{_ 'swimlanes'}}:
-  select.js-select-swimlanes
+  select.js-select-swimlanes(aria-label="{{_ 'swimlanes'}}")
     each swimlanes
       option(value="{{_id}}" selected="{{#if isSelectedSwimlaneId _id}}selected{{/if}}") {{isTitleDefault title}}
 
   label {{_ 'lists'}}:
-  select.js-select-lists
+  select.js-select-lists(aria-label="{{_ 'lists'}}")
     each lists
       option(value="{{_id}}" selected="{{#if isSelectedListId _id}}selected{{/if}}") {{title}}
 
   label {{_ 'cards'}}:
-  select.js-select-cards
+  select.js-select-cards(aria-label="{{_ 'cards'}}")
     each cards
       option(value="{{_id}}" selected="{{#if isDialogOptionCardId _id}}selected{{/if}}") {{title}}
```

### [A04] Selected timeline timestamp has low text contrast — Medium

`client/components/boards/timelineView.css:27`

Problem: The 11px white timestamp on #29a3a3 has 3.06:1 contrast; #187575 raises it to 5.47:1.

Fix:

```diff
--- a/client/components/boards/timelineView.css
+++ b/client/components/boards/timelineView.css
@@ -26,7 +26,7 @@
 
 .timeline-view .timeline-marker.is-selected {
-  background: #29a3a3;
+  background: #187575;
   color: #fff;
-  border-color: #29a3a3;
+  border-color: #187575;
 }
 
```

### [A06] Fixed and boundary field-order arrows still announce an action — Medium

`client/components/sidebar/sidebar.jade:303`; `client/components/sidebar/sidebar.css:191`; `client/components/sidebar/sidebar.js:2312`

Problem: Unavailable arrows lack aria-disabled, keep the active Move up/down title, suppress hover explanations with pointer-events:none and still execute a no-op model write when activated by keyboard.

Fix:

```diff
--- a/client/components/sidebar/sidebar.jade
+++ b/client/components/sidebar/sidebar.jade
@@ -301,7 +301,7 @@
               i.fa(class="{{#if row.checked}}fa-check{{else}}fa-square-o{{/if}}")
             if canModifyBoard
-              a.flex.card-field-order-move.js-card-field-order-up(href="#" role="button" class="{{#unless row.canMoveUp}}is-disabled{{/unless}}" title="{{_ 'card-field-order-move-up'}}" aria-label="{{_ 'card-field-order-move-up'}}")
+              a.flex.card-field-order-move.js-card-field-order-up(href="#" role="button" class="{{#unless row.canMoveUp}}is-disabled{{/unless}}" aria-disabled="{{#if row.canMoveUp}}false{{else}}true{{/if}}" title="{{#if row.canMoveUp}}{{_ 'card-field-order-move-up'}}{{else}}{{_ 'card-field-order-fixed'}}{{/if}}" aria-label="{{_ 'card-field-order-move-up'}}")
                 i.fa.fa-arrow-up
-              a.flex.card-field-order-move.js-card-field-order-down(href="#" role="button" class="{{#unless row.canMoveDown}}is-disabled{{/unless}}" title="{{_ 'card-field-order-move-down'}}" aria-label="{{_ 'card-field-order-move-down'}}")
+              a.flex.card-field-order-move.js-card-field-order-down(href="#" role="button" class="{{#unless row.canMoveDown}}is-disabled{{/unless}}" aria-disabled="{{#if row.canMoveDown}}false{{else}}true{{/if}}" title="{{#if row.canMoveDown}}{{_ 'card-field-order-move-down'}}{{else}}{{_ 'card-field-order-fixed'}}{{/if}}" aria-label="{{_ 'card-field-order-move-down'}}")
                 i.fa.fa-arrow-down
             span.card-field-order-label
@@ -327,7 +327,7 @@
               i.fa(class="{{#if row.checked}}fa-check{{else}}fa-square-o{{/if}}")
             if canModifyBoard
-              a.flex.card-field-order-move.js-card-field-order-up(href="#" role="button" class="{{#unless row.canMoveUp}}is-disabled{{/unless}}" title="{{_ 'card-field-order-move-up'}}" aria-label="{{_ 'card-field-order-move-up'}}")
+              a.flex.card-field-order-move.js-card-field-order-up(href="#" role="button" class="{{#unless row.canMoveUp}}is-disabled{{/unless}}" aria-disabled="{{#if row.canMoveUp}}false{{else}}true{{/if}}" title="{{#if row.canMoveUp}}{{_ 'card-field-order-move-up'}}{{else}}{{_ 'card-field-order-fixed'}}{{/if}}" aria-label="{{_ 'card-field-order-move-up'}}")
                 i.fa.fa-arrow-up
-              a.flex.card-field-order-move.js-card-field-order-down(href="#" role="button" class="{{#unless row.canMoveDown}}is-disabled{{/unless}}" title="{{_ 'card-field-order-move-down'}}" aria-label="{{_ 'card-field-order-move-down'}}")
+              a.flex.card-field-order-move.js-card-field-order-down(href="#" role="button" class="{{#unless row.canMoveDown}}is-disabled{{/unless}}" aria-disabled="{{#if row.canMoveDown}}false{{else}}true{{/if}}" title="{{#if row.canMoveDown}}{{_ 'card-field-order-move-down'}}{{else}}{{_ 'card-field-order-fixed'}}{{/if}}" aria-label="{{_ 'card-field-order-move-down'}}")
                 i.fa.fa-arrow-down
             span.card-field-order-label
--- a/client/components/sidebar/sidebar.css
+++ b/client/components/sidebar/sidebar.css
@@ -191,5 +191,5 @@
 .card-field-order-move.is-disabled {
   opacity: 0.3;
-  pointer-events: none;
+  cursor: not-allowed;
 }
 
--- a/client/components/sidebar/sidebar.js
+++ b/client/components/sidebar/sidebar.js
@@ -2312,4 +2312,5 @@
 function moveCardSettingsRow(evt, direction) {
   evt.preventDefault();
+  if (evt.currentTarget.classList.contains('is-disabled')) return;
   const rowEl = evt.currentTarget.closest('.js-card-field-order-row');
   if (!rowEl) return;
--- a/imports/i18n/data/en.i18n.json
+++ b/imports/i18n/data/en.i18n.json
@@ -1201,4 +1201,5 @@
   "boardCardSettingsPopup-title": "Card Settings",
   "card-field-order": "Card field order",
+  "card-field-order-fixed": "Fixed row or section boundary: cannot move in this direction.",
   "card-field-order-move-up": "Move up",
   "card-field-order-move-down": "Move down",
```

### [A07] Checklist checkbox rows have no keyboard activation — Medium

`client/components/cards/checklists.jade:168`; `client/components/cards/checklists.js:611`

Problem: The focusable role=checkbox row only handles mouse clicks on its child check-box-container, so Space/Enter cannot check an item and read-only rows incorrectly remain actionable tab stops.

Fix:

```diff
--- a/client/components/cards/checklists.jade
+++ b/client/components/cards/checklists.jade
@@ -166,5 +166,5 @@
 template(name='checklistItemDetail')
   .js-checklist-item.checklist-item(class="{{#if item.isFinished }}is-checked{{#if checklist.isItemHidden item.isFinished}} invisible{{/if}}{{/if}}{{#if checklist.hideAllChecklistItems}} is-checked invisible{{/if}}"
-    role="checkbox" aria-checked="{{#if item.isFinished }}true{{else}}false{{/if}}" tabindex="0")
+    role="checkbox" aria-checked="{{#if item.isFinished }}true{{else}}false{{/if}}" aria-readonly="{{#if canCheckChecklistItem}}false{{else}}true{{/if}}" tabindex="{{#if canCheckChecklistItem}}0{{else}}-1{{/if}}")
     //- #3307: checking off an item is a lower bar than editing/deleting one - a
       Worker may do the former but not the latter, so the checkbox itself is
--- a/client/components/cards/checklists.js
+++ b/client/components/cards/checklists.js
@@ -610,4 +610,10 @@
 
 Template.checklistItemDetail.events({
+  'keydown .js-checklist-item'(event) {
+    if (event.target !== event.currentTarget || ![' ', 'Enter'].includes(event.key)) return;
+    event.preventDefault();
+    event.stopPropagation();
+    event.currentTarget.querySelector('.check-box-container')?.click();
+  },
   // #2422: open the checklist item's linked subtask card. Reuses the same
   // navigation guard subtasks.js uses for its own "View it" button, so a
```

### [A08] Attachment preview and navigation controls are mouse-only — Medium

`client/components/cards/attachments.jade:39`; `client/components/cards/attachments.jade:43`; `client/components/cards/attachments.jade:65`

Problem: The gallery preview is a non-focusable div, previous/next are non-focusable icons, and the close icon has no accessible name.

Fix:

```diff
--- a/client/components/cards/attachments.jade
+++ b/client/components/cards/attachments.jade
@@ -37,9 +37,9 @@
     #viewer-top-bar
       span#attachment-name
-      a#viewer-close
+      a#viewer-close(href="#" title="{{_ 'close'}}")
         i.fa.fa-times-thin
 
     #viewer-container
-      i.fa.fa-caret-left#prev-attachment
+      a.fa.fa-caret-left#prev-attachment(href="#" title="{{_ 'previous'}}")
       #viewer-content
         img#image-viewer.hidden
@@ -50,5 +50,5 @@
         object#txt-viewer.hidden(type="text/plain")
         #office-viewer.hidden
-      i.fa.fa-caret-right#next-attachment
+      a.fa.fa-caret-right#next-attachment(href="#" title="{{_ 'next'}}")
 
 template(name="attachmentGallery")
@@ -63,5 +63,5 @@
 
       .attachment-item(class="{{#if isAttachmentMigrating _id}}migrating{{/if}}")
-        .attachment-thumbnail-container.open-preview(data-attachment-id="{{_id}}" data-card-id="{{ meta.cardId }}")
+        a.attachment-thumbnail-container.open-preview(href="#" aria-label="{{_ 'preview'}}: {{cleanFilename name}}" data-attachment-id="{{_id}}" data-card-id="{{ meta.cardId }}")
           if link
             if(isImage)
--- a/client/components/cards/attachments.js
+++ b/client/components/cards/attachments.js
@@ -38,4 +38,5 @@
 Template.attachmentGallery.events({
   'click .open-preview'(event) {
+    event.preventDefault();
 
     openAttachmentId = $(event.currentTarget).attr("data-attachment-id");
@@ -341,11 +342,14 @@
     closeAttachmentViewer();
   },
-  'click #viewer-close'() {
+  'click #viewer-close'(event) {
+    event.preventDefault();
     closeAttachmentViewer();
   },
-  'click #next-attachment'() {
+  'click #next-attachment'(event) {
+    event.preventDefault();
     openNextAttachment();
   },
-  'click #prev-attachment'() {
+  'click #prev-attachment'(event) {
+    event.preventDefault();
     openPrevAttachment();
   },
```

### [A09] Checklist switches are excluded from keyboard navigation — Medium

`client/components/forms/forms.css:356`; `client/components/forms/forms.css:810`; `client/components/cards/checklists.jade:18,102,107,242,251,264`

Problem: Native switch inputs are display:none/visibility:hidden and their replacement labels are not focusable, preventing keyboard use of checklist visibility and newline-mode settings.

Fix:

```diff
--- a/client/components/forms/forms.css
+++ b/client/components/forms/forms.css
@@ -808,6 +808,19 @@
   background-color: #bcbdbc;
 }
-.toggle-switch {
-  display: none;
+.material-toggle-switch input.toggle-switch[type="checkbox"] {
+  display: block;
+  visibility: visible;
+  position: absolute;
+  inset-inline-start: auto;
+  width: 1px;
+  height: 1px;
+  margin: 0;
+  padding: 0;
+  clip-path: inset(50%);
+  overflow: hidden;
+}
+.material-toggle-switch .toggle-switch:focus-visible ~ .toggle-label {
+  outline: 2px solid currentColor;
+  outline-offset: 4px;
 }
 .toggle-switch-title {
```

### [A05] Password visibility toggle is removed from tab order — Low

`client/components/users/passwordInput.jade:6`

Problem: The native visibility button has tabindex="-1", preventing keyboard users from reaching the reveal/hide action.

Fix:

```diff
--- a/client/components/users/passwordInput.jade
+++ b/client/components/users/passwordInput.jade
@@ -4,5 +4,5 @@
     .password-input-container
       input.password-field(type="{{type}}" placeholder="{{displayName}}" autocomplete="{{autocomplete}}" required="{{required}}")
-      button.password-toggle-btn.primary(type="button" tabindex="-1" aria-label="{{_ 'password'}}: {{_ 'visibility'}}" title="{{_ 'password'}}: {{_ 'visibility'}}")
+      button.password-toggle-btn.primary(type="button" aria-label="{{_ 'password'}}: {{_ 'visibility'}}" title="{{_ 'password'}}: {{_ 'visibility'}}")
         i.fa.fa-eye.eye-icon(aria-hidden="true")
         i.fa.fa-eye-slash.eye-slash-icon(aria-hidden="true")
```

## Alingsås feedback coverage

| # | Observation | Source assessment / disposition |
| --- | --- | --- |
| 1 | Hide minicard collapse arrow | Feature request: the caret is unconditional at `client/components/cards/minicard.jade:41`; `models/lib/cardSettingsRows.js:31` has no visibility row for it. Add an opt-out only with an explicit policy for already-collapsed cards. |
| 2 | Completion checkbox above title | Confirmed layout defect: V04; checkbox and title need one row. |
| 3 | Labels above title; ineffective arrows | Fixed layout limitation: `models/lib/cardFieldOrder.js:84` and `client/components/cards/minicard.jade:76,149` place all reorderable sections after the title; above-title labels require a new layout option. A06 covers misleading unavailable arrows; F14 covers four genuinely inert visibility settings. |
| 4 | Smaller fonts / Compact density | Font sizing already exists: Member Settings → Font → Size, 80/90/100/115/130/150% (`models/lib/uiFonts.js:75`, `client/components/users/userHeader.jade:282`). Card details and settings use `--wekan-ui-font-scale`; V01–V02 cover gaps. Compact spacing remains a feature request; fixed padding does not shrink with fonts. |
| 5 | Hide per-card Date format selector | Already implemented in this checkout: `client/components/cards/cardDetails.jade:335`, `client/lib/dateDisplay.js:9`, `models/lib/dateFormatPolicy.js:3`, `models/settings.js:253`; the selector is omitted when the admin forces the date format. No new defect attributed to this observation. |
| 6 | Date-only display | Feature request: `models/lib/dateFormatPolicy.js:1` offers three date orders, while display calls independently enable time (`client/components/cards/checklists.js:691,939`, `client/lib/dateDisplay.js:35`). Selecting YYYY-MM-DD does not currently mean “hide time”; add a separate persisted display-time preference, preserving stored timestamps. |
| 7 | Hide / reduce checklist Due button | Confirmed current layout, feature request: `client/components/cards/checklists.jade:70,343` always renders a date or add-date button for editable checklists; `models/lib/cardSettingsRows.js:131` has no checklist-due row. The add control inherits standard button padding/minimum height from `client/components/forms/forms.css:1,132`; an icon in the checklist header plus an independent visibility flag needs template, model and settings wiring. |
| 8 | Redundant Checklists and checklist title | Confirmed current hierarchy, feature request: `client/components/cards/cardDetails.jade:176` renders the section header and `client/components/cards/checklists.jade:61` renders every checklist title. There is no independent heading/title visibility setting; hiding the whole checklist section is not equivalent. |

Feature requests and already-implemented behavior above are excluded from severity totals.

## Audit basis and verification

Source audit of this checkout, with repository-wide searches across client, models, config, packages and template/style/i18n sources; focused traces include card movement/copy/link, list ordering, rule execution, settings persistence/rendering, checklist actions, attachment menus/history, popup lifecycle, keyboard shortcuts and translation forms. Generated `_build`, `.build` and `.tools` copies are excluded. This is source coverage, not a claim that every screen or state was exercised.

The existing scale is mixed but explicit: rem/em for inherited text, `calc(Npx * var(--wekan-ui-font-scale, 1))` for component text/line heights, and largely fixed control dimensions/gaps; named font presets are the shared mechanism. Fixed pixels alone are not counted as defects. V01–V07 identify concrete scaling, wrapping, sizing, alignment or direction failures. Existing theme overrides and the global anchor accessibility transform were checked before flagging local styles/markup.

All 78 proposed diff hunks were checked against 35 current source files without applying them; proposed JSON changes parse. Node is unavailable, so JavaScript/Blaze compilation was not run. No application build, browser interaction, screenshot comparison or screen-reader validation was run; the supplied feedback text was cross-checked against code, not its referenced figures. Proposed fixes still require runtime verification, especially at 320px width, 150% font size, long Swedish labels, RTL, dark themes and with multiple cards open. Only this report was changed.

## Suggested fix order

1. F03, F01–F02: destination race, rule payloads and card placement.

2. V04, F14, A06: minicard checkbox and misleading Card Settings controls.

3. F16–F17, F15: wrong-card switch, shared viewer and attachment background actions.

4. A01, A07–A09, A02–A03: keyboard activation, switches and control names.

5. V05–V07: checklist progress, long content and narrow settings layouts.

6. F05, F09: retain forms on failure.

7. F04, F06–F08, F13: ordering, picker state, calendar state and subscription lifetime.

8. F10–F12: search, shortcut guards and save semantics.

9. T01–T03: translation keys, locale schema and messages.

10. V01–V03, A04–A05: font scaling, RTL, contrast and password-toggle focus.
