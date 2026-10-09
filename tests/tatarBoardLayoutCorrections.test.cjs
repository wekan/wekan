'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tt.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["no-boards-selected", "select-only-one-board", "selected-label", "set-selected-starred", "set-selected-unstarred", "set-selected-home", "unset-selected-home", "home-board-badge", "home-board-empty", "home-board-remove", "home-board-remove-confirm", "activity-dueDate", "activity-endDate", "add-card-to-top-of-list", "add-card-to-bottom-of-list", "setListWidthPopup-title", "set-list-width", "set-list-width-value", "list-width-shared-note", "list-width-personal-note", "personal-list-width", "personal-list-width-description", "fixed-list-width", "click-to-enable-fixed-list-width", "click-to-disable-fixed-list-width", "fixed-list-width-note", "keyboard-shortcuts-enabled", "keyboard-shortcuts-disabled", "setSwimlaneHeightPopup-title", "set-swimlane-height", "set-swimlane-height-value", "swimlane-height-error-message", "add-subtask", "add-existing-card-as-subtask-empty", "add-checklist", "close-add-checklist-item", "close-edit-checklist-item", "convertChecklistItemToCardPopup-title", "add-cover", "add-after-list", "added", "admin", "admin-desc", "admin-announcement", "admin-announcement-active", "admin-announcement-title", "all-boards-hide", "public-boards", "and-n-other-card", "and-n-other-card_plural", "apply", "app-is-offline", "app-try-reconnect", "archive-board-confirm", "archive-list", "archive-swimlane", "archive-selection", "archiveBoardPopup-title", "archived-items", "archived-boards", "restore-board", "no-archived-boards", "archives", "assign-member", "attached", "attachment-delete-pop", "attachmentDeletePopup-title", "auto-watch", "avatar-too-big", "board-change-color", "board-change-background-image", "board-background-image-url", "add-background-image", "remove-background-image", "show-at-all-boards-page", "board-info-on-my-boards", "boardInfoOnMyBoardsPopup-title", "boardInfoOnMyBoards-title", "show-card-counter-per-list", "show-board_members-avatar", "board_members", "card_members", "board_assignees", "card_assignees", "board-nb-stars", "board-not-found", "board-private-info", "board-public-info", "board-drag-drop-reorder-or-click-open", "board-open-and-move-between-remaining-and-workspaces", "boardChangeColorPopup-title", "changeColorPopup-title", "changeFontPopup-title", "boardChangeBackgroundImagePopup-title", "allBoardsChangeColorPopup-title", "allBoardsChangeBackgroundImagePopup-title", "boardChangeTitlePopup-title", "boardChangeVisibilityPopup-title", "boardChangeWatchPopup-title", "boardChangeViewPopup-title", "board-view", "desktop-mode", "mobile-mode", "mobile-desktop-toggle", "zoom-in", "zoom-out", "zoom-level", "enter-zoom-level", "board-view-cal", "board-view-multiboard-cal", "board-view-collapse", "board-view-gantt", "board-view-table", "board-view-stats", "bucket-example", "calendar-previous-month-label", "calendar-next-month-label", "card-archived", "board-archived", "card-comments-title", "card-delete-notice", "card-delete-pop", "card-delete-suggest-archive", "card-archive-pop", "card-archive-suggest-cancel", "list-archive-pop", "list-archive-suggest", "listArchivePopup-title", "swimlane-archive-pop", "swimlane-archive-suggest", "swimlaneArchivePopup-title", "card-due", "card-due-on", "due-days-overdue", "card-spent", "card-edit-attachments", "card-edit-custom-fields", "card-edit-labels", "card-edit-members", "card-labels-title", "card-members-title", "card-start-on", "cardAttachmentsPopup-title", "cardCustomField-datePopup-title", "cardCustomFieldsPopup-title", "cardStartVotingPopup-title", "positiveVoteMembersPopup-title", "negativeVoteMembersPopup-title", "card-edit-voting", "editVoteEndDatePopup-title", "allowNonBoardMembers", "vote-question", "vote-public", "vote-for-it", "vote-against", "deleteVotePopup-title", "vote-delete-pop", "cardStartPlanningPokerPopup-title", "card-edit-planning-poker", "editPokerEndDatePopup-title", "poker-question", "poker-finish", "poker-result-votes", "poker-result-who", "poker-replay", "set-estimation", "deletePokerPopup-title", "poker-delete-pop", "cardArchivePopup-title", "cardDetailsActionsPopup-title", "cardDependenciesPopup-title", "cardDependencyIconPopup-title", "dependencyLinePopup-title", "importDependenciesPopup-title", "addBoardOrgPopup-title", "removeBoardOrgPopup-title", "removeBoardTeamPopup-title", "adminChangeAvatarPopup-title", "boardBackgroundsPopup-title", "deleteBoardBackgroundPopup-title", "deleteDuplicateListsPopup-title", "userDeletePopup-title", "userAnonymizePopup-title", "addBoardDomainPopup-title", "removeBoardDomainPopup-title", "mapImportedMemberPopup-title", "exportChecklistPopup-title", "importSwimlanePopup-title", "importListPopup-title", "importCardPopup-title", "importBoardIntoPopup-title", "cardStickersPopup-title", "invitePeoplePopup-title", "listsortPopup-title", "listWidthErrorPopup-title", "restoreArchivedCardToListPopup-title", "restoreArchivedListToSwimlanePopup-title", "rulesImportExportPopup-title", "swimlaneHeightErrorPopup-title", "bookmarksPopup-title", "casSignIn", "samlSignIn", "change", "change-avatar", "change-color", "change-permissions", "map-to-existing-user", "map-to-existing-user-desc", "map-to-existing-user-search", "map-to-existing-user-not-member", "map-to-existing-user-none", "map-to-existing-user-no-results", "change-settings", "theme-default", "theme-category", "theme-category-flat", "theme-category-clear", "theme-category-dark", "theme-category-special", "change-font", "font", "font-default", "font-preview-text", "font-size", "font-size-default", "font-size-smaller", "font-size-small", "font-size-large", "font-size-larger", "font-size-largest", "text-color", "text-background-color", "changeAvatarPopup-title", "delete-avatar-confirm", "deleteAvatarPopup-title", "changeLanguagePopup-title", "changePermissionsPopup-title", "changeSettingsPopup-title", "subtasks", "click-to-star", "click-to-unstar", "click-to-star-page", "click-to-unstar-page", "click-to-enable-auto-width", "click-to-disable-auto-width", "auto-list-width", "clipboard", "card-aging", "card-aging-days", "card-aging-tier1", "card-aging-tier2", "card-aging-tier3", "move-card-up", "move-card-down", "move-list-left", "move-list-right", "close-board", "close-dialog", "close-popup", "go-back", "modal-title", "skip-to-content", "close-board-pop", "close-card", "color-black", "color-blue", "color-crimson", "color-darkgreen", "color-gold", "color-gray", "color-green", "color-indigo", "color-lime", "color-magenta", "color-mistyrose", "color-navy", "color-orange", "color-paleturquoise", "color-peachpuff", "color-pink", "color-plum", "color-purple", "color-red", "color-saddlebrown", "color-silver", "color-sky", "color-slateblue", "color-white", "unset-color", "comment-only", "comment-only-desc", "comment-assigned-only", "comment-assigned-only-desc", "comment-delete", "deleteCommentPopup-title", "no-comments", "no-comments-desc", "read-only", "read-only-desc", "read-assigned-only", "read-assigned-only-desc", "worker", "worker-desc", "computer", "confirm-subtask-delete-popup", "confirm-checklist-delete-popup", "confirm-checklist-item-delete-popup", "confirm-move-list-to-swimlane", "subtaskDeletePopup-title", "checklistDeletePopup-title", "checklistItemDeletePopup-title", "copy-card-link-to-clipboard", "copy-link-to-clipboard", "copy-text-to-clipboard", "linkCardPopup-title", "copyListPopup-title", "copyManyCardsPopup-title", "copyManyCardsPopup-instructions", "copyManyCardsPopup-format", "chooseBoardSourcePopup-title", "createLabelPopup-title", "createCustomField", "createCustomFieldPopup-title", "current", "custom-color", "custom-field-delete-pop", "custom-field-checkbox", "custom-field-currency", "custom-field-currency-option", "custom-field-dropdown", "custom-field-dropdown-none", "custom-field-dropdown-options", "custom-field-dropdown-options-placeholder", "custom-field-dropdown-unknown", "custom-field-number", "custom-field-text", "date-format", "decline", "default-avatar", "deleteCustomFieldPopup-title", "deleteLabelPopup-title", "disambiguateMultiLabelPopup-title", "disambiguateMultiMemberPopup-title", "discard", "download", "edit-profile", "edit-wip-limit", "soft-wip-limit", "editCardStartDatePopup-title", "editCardDueDatePopup-title", "editCustomFieldPopup-title", "addReactionPopup-title", "editCardSpentTimePopup-title", "editLabelPopup-title", "editNotificationPopup-title", "editProfilePopup-title", "email-enrollAccount-subject", "email-enrollAccount-text", "email-fail", "email-fail-text", "email-invalid", "email-invite", "email-invite-subject", "email-invite-text", "push-invite-title", "push-invite-text", "email-resetPassword-subject", "email-resetPassword-text", "email-sent", "email-verifyEmail-subject", "email-verifyEmail-text", "enable-vertical-scrollbars", "enable-wip-limit", "error-board-doesNotExist", "error-board-notAdmin", "error-board-notAMember", "error-watch-disabled", "error-notAllowed", "error-json-malformed", "error-json-schema", "error-csv-schema", "error-import-empty-board", "error-list-doesNotExist", "error-linked-card-not-allowed", "error-user-disabled", "error-user-doesNotExist", "error-user-notAllowSelf", "error-user-notCreated", "error-username-taken", "error-orgname-taken", "error-teamname-taken", "error-email-taken", "export-board-without-attachments", "export-ical-feed", "user-can-not-export-excel", "export-card", "export-card-pdf", "export-card-excel", "export-card-excel-fields", "export-card-subtasks", "export-card-field-people", "export-card-field-board-info", "export-card-field-dates", "export-card-attachment-filename", "export-card-attachment-size", "export-card-attachment-type", "export-card-attachment-uploaded-by", "export-card-attachment-uploaded-at", "export-card-attachment-image-previews", "export-card-excel-no-disk-space", "export-card-excel-free", "export-card-excel-needed", "user-can-not-export-card-to-pdf", "user-can-not-export-card-to-excel", "exportCardPopup-title", "sorted", "remove-sort", "sort-desc", "list-sort-by", "list-label-modifiedAt", "list-label-title", "list-label-sort", "list-label-short-modifiedAt", "list-label-short-title", "list-label-short-sort", "filter-dates-label", "filter-no-due-date", "filter-overdue", "filter-due-today", "filter-due-this-week", "filter-due-next-week", "filter-due-tomorrow", "list-filter-label", "filter-clear", "filter-labels-label", "filter-no-label", "filter-member-label", "filter-no-member", "filter-assignee-label", "filter-creator-label", "filter-no-assignee", "filter-custom-fields-label", "filter-no-custom-fields", "filter-show-archive", "filter-hide-empty", "filter-on", "filter-on-desc", "filter-to-selection", "other-filters-label", "advanced-filter-label", "advanced-filter-description", "fullname", "show-activities", "hide-activities", "imported-member-no-account", "inactive-member", "impersonate-user", "import-board", "import-board-c", "import-board-instruction-kanboard", "import-board-instruction-deck", "import-board-instruction-openproject", "import-board-instruction-issues", "import-board-instruction-asana", "import-board-instruction-markdown", "import-board-instruction-trello", "import-board-instruction-csv", "import-board-instruction-jira", "import-board-instruction-excel", "import-excel-file", "import-board-instruction-wekan", "import-board-instruction-about-errors", "import-without-mapping-members", "import-json-placeholder", "import-csv-placeholder", "import-json-file", "import-attachments-zip", "import-trello-json-file", "import-trello-json-file-hint", "import-trello-zip-file", "import-trello-zip-file-hint", "import-trello-zip-no-boards", "import-trello-zip-progress", "import-trello-failed", "import-timeout", "import-trello-zip-failed", "import-trello-zip-read-failed", "import-trello-zip-too-large", "import-trello-zip-too-many-files", "import-trello-zip-file-too-large", "import-trello-zip-unsafe-path", "import-trello-workspace", "import-trello-workspace-placeholder", "import-trello-parent-workspace", "trello-api-import", "trello-api-import-desc", "trello-api-key", "trello-api-token", "trello-list-workspaces", "trello-parent-workspace-top", "trello-import-selected", "trello-importing", "trello-import-results", "trello-api-credentials-required", "trello-api-credentials-saved", "trello-select-boards", "select-all", "unselect-all", "trello-import-more", "trello-import-progress", "trello-cancel", "trello-cancel-delete", "trello-cancel-delete-confirm", "trello-resume", "trello-delete-imported", "trello-clear-job", "trello-import-errors", "copy-to-clipboard", "running", "paused", "import-map-members", "import-members-map", "import-members-map-note", "import-show-user-mapping", "import-user-select", "importMapMembersAddPopup-title", "info", "check-version", "version-check-failed", "initials", "invalid-date", "invalid-time", "invalid-year", "invalid-user", "joined", "just-invited", "keyboard-shortcuts", "label-create", "label-default", "label-delete-pop", "last-admin-desc", "leave-board", "leave-board-pop", "leaveBoardPopup-title", "link-card", "linkCardToBoardPopup-title", "linkCardToNewBoard", "list-archive-cards", "list-archive-cards-pop", "list-move-cards", "list-select-cards", "set-color-list", "settingsUserPopup-title", "settingsTeamPopup-title", "settingsOrgPopup-title", "orgAdminsPopup-title", "swimlaneActionPopup-title", "swimlaneAddPopup-title", "listImportCardPopup-title", "listImportCardsTsvPopup-title", "link-list", "list-delete-pop", "list-delete-suggest-archive", "calendar", "gantt", "log-in", "loginPopup-title", "menu", "move-selection", "copy-selection", "moveListPopup-title", "moveCardToBottom-title", "moveCardToTop-title", "moveSelectionPopup-title", "copySelectionPopup-title", "selection-color", "multi-selection", "multi-selection-label", "multi-selection-member", "multi-selection-on", "multi-selection-off", "muted", "muted-info", "no-archived-cards", "no-archived-lists", "no-archived-swimlanes", "normal", "normal-desc", "normal-assigned-only", "normal-assigned-only-desc", "not-accepted-yet", "notify-participate", "notify-watch", "page-maybe-private", "page-not-found", "paste-or-dragdrop", "participating", "preview", "previewAttachedImagePopup-title", "previewClipboardImagePopup-title", "private-desc", "public-desc", "custom-private-desc-placeholder", "custom-public-desc-placeholder", "quick-access-description", "remove-cover", "remove-from-board", "remove-label", "listDeletePopup-title", "remove-member", "deleted-user", "remove-member-from-card", "remove-member-pop", "removeMemberPopup-title", "rename-board", "rescue-card-description", "rescue-card-description-dialogue", "rules", "search-cards", "search-example", "select-color", "select-board", "set-wip-limit-value", "setWipLimitPopup-title", "shortcut-add-self", "shortcut-assign-self", "shortcut-autocomplete-emoji", "shortcut-autocomplete-members", "shortcut-clear-filters", "shortcut-close-dialog", "shortcut-filter-my-cards", "shortcut-filter-my-assigned-cards", "shortcut-show-shortcuts", "shortcut-toggle-filterbar", "shortcut-toggle-searchbar", "shortcut-toggle-sidebar", "show-cards-minimum-count", "sidebar-open", "sidebar-close", "signupPopup-title", "star-board-title", "set-default-board-title", "unset-default-board-title", "starred-boards", "starred-boards-description", "subscribe", "this-board", "spent-time-hours", "overtime-hours", "overtime", "flowtime", "flow-start", "flow-stop", "has-overtime-cards", "has-spenttime-cards", "toggle-assignees", "toggle-labels", "remove-labels-multiselect", "tracking", "tracking-info", "type", "unassign-member", "unsaved-description", "uploaded-avatar", "uploading-files", "upload-failed", "upload-completed", "custom-top-left-corner-logo-image-url", "custom-top-left-corner-logo-link-url", "custom-top-left-corner-logo-height", "custom-login-logo-image-url", "custom-login-logo-link-url", "custom-help-link-url", "text-below-custom-login-logo", "automatic-linked-url-schemes", "external-link-pattern-description", "import-usernames", "view-it", "go-to-board", "warn-list-archived", "watching", "watching-info", "welcome-board", "welcome-swimlane", "welcome-list1", "welcome-list2", "what-to-do", "wipLimitErrorPopup-title", "wipLimitErrorPopup-dialog-pt1", "wipLimitErrorPopup-dialog-pt2", "attachment-transfer-limits-title", "attachment-limits", "attachment-transfer-limits-description", "attachment-transfer-limits-saved", "attachment-transfer-limits-save-failed", "attachment-transfer-limits-invalid-value", "attachment-upload-limit-label", "avatars-upload-blocked-description", "attachment-download-limit-label", "api-upload-limit-label", "api-download-limit-label", "attachment-limit-mode-unlimited", "attachment-limit-mode-max-size", "attachment-limit-mode-blocked", "attachment-limit-unit-bytes", "registration", "self-registration", "invite", "invite-people", "to-boards", "email-addresses", "smtp-host-description", "smtp-port-description", "smtp-tls-description", "smtp-host", "smtp-port", "smtp-tls", "send-from", "send-smtp-test", "email-templates-title", "email-templates-invite-subject", "email-templates-invite-body", "email-templates-activity-subject", "email-templates-activity-body", "invitation-code", "email-invite-register-subject", "email-invite-register-text", "email-smtp-test-subject", "email-smtp-test-text", "error-invitation-code-not-exist", "error-notAuthorized", "webhook-title", "webhook-token", "outgoing-webhooks", "bidirectional-webhooks", "outgoingWebhooksPopup-title", "boardCardTitlePopup-title", "disable-webhook", "global-webhook", "new-outgoing-webhook", "no-name", "Platform", "OS", "Database", "Node_version", "Meteor_version", "Database_type", "Database_commit", "FerretDB_version", "FerretDB_commit", "Reactivity_mode", "Reactivity_order", "DDP_transport", "MongoDB_version", "MongoDB_storage_engine", "MongoDB_Oplog_enabled", "OS_Arch", "OS_Cpus", "OS_Freemem", "OS_Loadavg", "OS_Platform", "OS_Release", "OS_Totalmem", "OS_Type", "OS_Uptime", "days", "hours", "minutes", "seconds", "show-field-on-card", "automatically-field-on-card", "always-field-on-card", "showLabel-field-on-card", "showSum-field-on-list", "accounts-allowEmailChange", "accounts-allowUserNameChange", "tableVisibilityMode-allowPrivateOnly", "tableVisibilityMode", "visibility", "createdAt", "modifiedAt", "verified", "active", "active-team", "active-org", "org-shared-templates", "org-propagate-members-to-boards", "org-sync-members-from-auth", "org-tenant", "org-domains", "org-domains-description", "error-org-domain-taken", "org-admins", "org-admins-description", "org-admin", "team-shared-templates", "team-propagate-members-to-boards", "team-sync-members-from-auth", "active-person", "card-received", "card-received-on", "card-end", "card-end-on", "editCardReceivedDatePopup-title", "editCardEndDatePopup-title", "setCardColorPopup-title", "setSelectionColorPopup-title", "setCardActionsColorPopup-title", "setSwimlaneColorPopup-title", "setListColorPopup-title", "assigned-by", "requested-by", "card-sorting-by-number", "board-delete-notice", "delete-board-confirm-popup", "boardDeletePopup-title", "delete-board", "delete-all-notifications", "delete-all-notifications-confirm", "delete-duplicate-lists", "delete-duplicate-lists-confirm", "default-subtasks-board", "default", "defaultdefault", "queue", "subtask-settings", "card-settings", "boardSubtaskSettingsPopup-title", "boardCardSettingsPopup-title", "deposit-subtasks-board", "deposit-subtasks-list", "show-parent-in-minicard", "description-on-minicard", "cover-attachment-on-minicard", "badge-attachment-on-minicard", "card-sorting-by-number-on-minicard", "checklist-count-on-minicard", "checklist-count", "attachment-count", "cover-image", "prefix-with-full-path", "prefix-with-parent", "subtext-with-full-path", "subtext-with-parent", "change-card-parent", "source-board", "no-parent", "activity-added-label", "activity-removed-label", "activity-delete-attach", "activity-added-label-card", "activity-removed-label-card", "activity-delete-attach-card", "activity-set-customfield", "activity-unset-customfield", "authentication-method", "authentication-type", "custom-product-name", "settings-group-logo", "custom-head-tags-enabled", "custom-head-meta-tags", "custom-head-link-tags", "custom-manifest-enabled", "custom-head-manifest-content", "custom-assetlinks-enabled", "custom-assetlinks-content", "layout", "hide-logo", "card-counter-list", "board-member-list", "add-custom-html-after-body-start", "add-custom-html-before-body-end", "error-undefined", "error-ldap-login", "display-authentication-method", "oidc-button-text", "default-authentication-method", "duplicate-board", "duplicate-board-confirm", "org-number", "team-number", "people-number", "swimlaneDeletePopup-title", "swimlane-delete-pop", "restore-all", "delete-all", "previous_as", "act-a-dueAt", "act-a-endAt", "act-a-startAt", "act-a-receivedAt", "a-dueAt", "a-endAt", "a-startAt", "a-receivedAt", "above-selected-card", "above-selected-swimlane", "below-selected-card", "below-selected-swimlane", "left-of-list", "right-of-list", "almostdue", "pastdue", "duenow", "act-newDue", "act-withDue", "act-almostdue", "act-pastdue", "act-duenow", "act-atUserComment", "delete-user-confirm-popup", "delete-team-confirm-popup", "delete-org-confirm-popup", "accounts-allowUserDelete", "hide-minicard-label-text", "show-desktop-drag-handles", "toggle-header-icons-collapsed", "drag-to-resize-sidebar", "drag-to-resize-left-menu", "submit-on-enter", "open-many-cards-at-once", "open-many-cards-at-once-description", "submit-on-enter-description", "addmore-detail", "show-on-card", "show-on-minicard", "new", "editOrgPopup-title", "newOrgPopup-title", "editTeamPopup-title", "newTeamPopup-title", "editUserPopup-title", "newUserPopup-title", "help", "view-all", "filter-by-unread", "mark-all-as-read", "mark-all-as-unread", "remove-all-read", "allow-rename", "allowRenamePopup-title", "roles-info", "allow-invite-to-board", "all-board-members", "board-admin", "roles-status", "roles-status-desc", "roles-status-role", "roles-status-invite", "roles-status-sees", "roles-status-write", "roles-status-manage", "roles-status-sees-all", "roles-status-sees-assigned", "roles-status-empty", "start-day-of-week", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "status", "owner", "last-modified-at", "last-activity", "voting", "delete-linked-card-before-this-card", "delete-linked-cards-before-this-list", "hide-checked-items", "hide-finished-checklist", "task", "create-task", "domains", "domain", "add-domain", "share-template-with", "drag-template-here-to-share", "remove-domain-from-board", "invalid-domain", "no-items-message", "shared-templates", "shared-templates-info", "shared-templates-select-scope", "no-shared-templates", "displayName", "shortName", "autoAddUsersWithDomainName", "website", "person", "day", "week", "myCardsViewChange-title", "myCardsViewChangePopup-title", "myCardsViewChange-choice-table", "myCardsSortChange-title", "myCardsSortChangePopup-title", "myCardsSortChange-choice-board", "myCardsSortChange-choice-dueat", "dueCards-title", "dueCardsViewChange-title", "dueCardsViewChangePopup-title", "dueCardsViewChange-choice-me", "dueCardsViewChange-choice-all", "dueCardsViewChange-choice-all-description", "globalSearchViewChange-title", "globalSearchViewChangePopup-title", "globalSearchViewChange-choice-me", "globalSearchViewChange-choice-all", "globalSearchViewChange-choice-all-description", "dueCards-noResults-title", "dueCards-noResults-description", "board-title-not-found", "swimlane-title-not-found", "list-title-not-found", "label-not-found", "label-color-not-found", "user-username-not-found", "comment-not-found", "org-name-not-found", "team-name-not-found", "no-cards-found", "one-card-found", "n-cards-found", "n-n-of-n-cards-found", "operator-board", "operator-swimlane", "operator-assignee", "operator-creator", "operator-status", "operator-due", "operator-created", "operator-modified", "operator-sort", "operator-has", "operator-limit", "operator-debug", "operator-org", "operator-description", "operator-customfield", "operator-attachment-text", "operator-checklist-text", "predicate-archived", "predicate-ended", "predicate-all", "predicate-overdue", "predicate-week", "predicate-quarter", "predicate-year", "predicate-due", "predicate-modified", "predicate-created", "predicate-attachment", "predicate-description", "predicate-checklist", "predicate-end", "predicate-assignee", "predicate-private", "predicate-selector", "predicate-projection", "operator-unknown-error", "operator-number-expected", "operator-sort-invalid", "operator-status-invalid", "operator-has-invalid", "operator-limit-invalid", "operator-debug-invalid", "next-page", "previous-page", "heading-notes", "globalSearch-instructions-heading", "globalSearch-instructions-description", "globalSearch-instructions-operators", "globalSearch-instructions-operator-board", "globalSearch-instructions-operator-list", "globalSearch-instructions-operator-swimlane", "globalSearch-instructions-operator-comment", "globalSearch-instructions-operator-label", "globalSearch-instructions-operator-hash", "globalSearch-instructions-operator-user", "globalSearch-instructions-operator-at", "globalSearch-instructions-operator-member", "globalSearch-instructions-operator-assignee", "globalSearch-instructions-operator-creator", "globalSearch-instructions-operator-org", "globalSearch-instructions-operator-team", "globalSearch-instructions-operator-due", "globalSearch-instructions-operator-created", "globalSearch-instructions-operator-modified", "globalSearch-instructions-operator-status", "globalSearch-instructions-status-archived", "globalSearch-instructions-status-all", "globalSearch-instructions-status-ended", "globalSearch-instructions-status-public", "globalSearch-instructions-status-private", "globalSearch-instructions-operator-has", "globalSearch-instructions-operator-sort", "globalSearch-instructions-operator-limit", "globalSearch-instructions-notes-1", "globalSearch-instructions-notes-2", "globalSearch-instructions-notes-3", "globalSearch-instructions-notes-3-2", "globalSearch-instructions-notes-4", "globalSearch-instructions-notes-5", "link-to-search", "number", "label-colors", "label-names", "archived-at", "sort-cards", "sort-boards", "sort-boards-custom", "sort-boards-title-asc", "sort-boards-title-desc", "sort-is-on", "cardsSortPopup-title", "due-complete", "card-mark-complete", "card-mark-incomplete", "stickers", "add-sticker", "remove-sticker", "card-dependencies", "add-dependency", "remove-dependency", "show-dependencies", "hide-dependencies", "drag-to-connect", "dependency-type", "dependency-icon", "dependency-type-related-to", "dependency-type-blocks", "dependency-type-is-blocked-by", "dependency-type-fixes", "dependency-type-is-fixed-by", "filter-dependencies-label", "import-dependencies-file", "import-dependencies-placeholder", "import-dependencies-parse-error", "import-dependencies-empty", "import-dependencies-done", "board-backgrounds", "boardBackgrounds-title", "upload-background", "set-as-active", "background-too-big", "board-background-delete-pop", "location", "location-open-map", "add-location", "cardLocationsPopup-title", "location-name", "location-latitude", "location-longitude", "location-detect-from-map", "location-detect", "location-detect-none", "location-detect-done", "location-open-map-at", "map-region-usa", "map-region-europe", "map-region-asia", "map-provider-saved", "server-error-troubleshooting", "title-alphabetically", "created-at-newest-first", "created-at-oldest-first", "links-heading", "board-activities", "now-activities-of-all-boards-are-hidden", "move-swimlane", "moveSwimlanePopup-title", "custom-field-stringtemplate", "custom-field-stringtemplate-item-placeholder", "creator", "creator-on-minicard", "filesReportTitle", "filter-invisible-filenames", "filename-invisible-legend", "reports", "securityReportTitle", "speedReportTitle", "testsReportTitle", "cpuReportTitle", "databaseReportTitle", "new-problems", "acknowledge", "rulesReportTitle", "boardsReportTitle", "cardsReportTitle", "impersonationReportTitle", "impersonation-admin", "impersonation-user", "officeReportTitle", "office-report-desc", "office-location", "office-logins", "office-first-seen", "office-last-seen", "office-shared", "office-no-results", "api-report-desc", "api-calls", "api-first-called", "api-last-called", "api-no-calls", "recovery-report-desc", "recovery-event", "recovery-severity", "recovery-db", "recovery-detail", "recovery-no-events", "recovery-maintenance-title", "recovery-maintenance-note", "reason", "copy-swimlane", "copySwimlanePopup-title", "display-card-creator", "wait-spinner", "Bounce", "Cube", "Cube-Grid", "Dot", "Double-Bounce", "Rotateplane", "Scaleout", "Wave", "maximize-card", "minimize-card", "delete-org-warning-message", "delete-team-warning-message", "subject", "details", "carbon-copy", "tickets", "ticket-number", "pending", "closed", "resolved", "cancelled", "history", "request", "requests", "help-request", "editCardSortOrderPopup-title", "cardDetailsPopup-title", "add-teams", "add-teams-label", "remove-team-from-table", "confirm-btn", "remove-btn", "filter-card-title-label", "invite-people-success", "invite-people-error", "email-domain-allowed-to-invite", "to-create-teams-contact-admin", "Node_heap_total_heap_size", "Node_heap_total_heap_size_executable", "Node_heap_total_physical_size", "Node_heap_total_available_size", "Node_heap_used_heap_size", "Node_heap_heap_size_limit", "Node_heap_malloced_memory", "Node_heap_peak_malloced_memory", "Node_heap_does_zap_garbage", "Node_heap_number_of_native_contexts", "Node_heap_number_of_detached_contexts", "Node_memory_usage_rss", "Node_memory_usage_heap_total", "Node_memory_usage_heap_used", "Node_memory_usage_external", "add-organizations", "add-organizations-label", "remove-organization-from-board", "to-create-organizations-contact-admin", "custom-legal-notice-link-url", "acceptance_of_our_legalNotice", "legalNotice", "copied", "checklistActionsPopup-title", "moveChecklist", "moveChecklistPopup-title", "newlineBecomesNewChecklistItem", "newLineNewItem", "newlineBecomesNewChecklistItemOriginOrder", "originOrder", "copyChecklist", "copyChecklistPopup-title", "copyChecklistFromTemplate", "copyChecklistFromTemplatePopup-title", "card-show-lists", "subtaskActionsPopup-title", "attachmentActionsPopup-title", "attachment-move-storage-fs", "attachment-move-storage-gridfs", "attachment-move-storage-s3", "attachment-move", "move-all-attachments-to-fs", "move-all-attachments-to-gridfs", "move-all-attachments-to-s3", "move-all-attachments-of-board-to-fs", "move-all-attachments-of-board-to-gridfs", "move-all-attachments-of-board-to-s3", "move-source", "move-destination", "move-storage-fs", "move-all-attachments", "move-attachments-none-found", "attachment-last-move", "attachment-repair-locations", "attachment-repair-locations-description", "attachment-repair-running", "attachment-repair-done", "attachment-repair-scanned", "attachment-repair-repaired", "attachment-repair-broken", "move-scope", "move-scope-both", "move-storage-all", "default-save-storage", "default-save-storage-description", "default-save-storage-saved", "default-save-storage-save-failed", "move-progress-pause", "move-progress-resume", "calculate-file-counts", "calculating-counts", "stats-scope", "stats-count", "card-id", "attachment-id", "board-id", "gridfs-file-id", "s3-file-id", "mongodb-compact", "mongodb-compact-description", "mongodb-compact-warning", "mongodb-compact-run", "mongodb-compact-running", "mongodb-compact-success", "mongodb-compact-error", "path", "version-name", "size", "storage", "action", "board-title", "board-status", "board-status-loading-mode", "board-status-time-summary", "board-status-time-spent-total", "board-status-cards-with-time", "board-status-overtime-cards", "uploading", "remaining_time", "speed", "progress", "password-again", "if-you-already-have-an-account", "minicardDetailsActionsPopup-title", "Mongo_sessions_count", "change-visibility", "max-upload-filesize", "allowed-upload-filetypes", "max-avatar-filesize", "allowed-avatar-filetypes", "invalid-file", "preview-pdf-not-supported", "drag-board", "drag-board-to-workspace", "translation-number", "delete-translation-confirm-popup", "newTranslationPopup-title", "editTranslationPopup-title", "settingsTranslationPopup-title", "translation", "translation-text", "show-subtasks-field", "show-week-of-year", "convert-to-markdown", "import-board-zip", "collapse-checklist", "expand-checklist", "uncollapse", "hideCheckedChecklistItems", "hideAllChecklistItems", "card-recurrence-interval", "cardRecurrenceIntervalPopup-title", "card-recurrence-interval-none", "support", "supportPopup-title", "support-page-enabled", "support-info-not-added-yet", "support-info-only-for-logged-in-users", "support-title", "support-content", "accessibility", "accessibility-page-enabled", "accessibility-info-not-added-yet", "accessibility-title", "accessibility-content", "accounts-lockout-settings", "accounts-lockout-info", "accounts-lockout-known-users", "accounts-lockout-unknown-users", "accounts-lockout-failures-before", "accounts-lockout-period", "accounts-lockout-failure-window", "accounts-lockout-settings-updated", "accounts-lockout-locked-users", "accounts-lockout-locked-users-info", "accounts-lockout-no-locked-users", "accounts-lockout-failed-attempts", "accounts-lockout-remaining-time", "accounts-lockout-user-unlocked", "accounts-lockout-confirm-unlock", "accounts-lockout-confirm-unlock-all", "accounts-lockout-show-locked-users", "accounts-lockout-user-locked", "accounts-lockout-click-to-unlock", "accounts-lockout-status", "admin-people-filter-show", "admin-people-filter-all", "admin-people-filter-locked", "admin-people-filter-active", "admin-people-filter-inactive", "admin-people-active-status", "admin-people-user-active", "admin-people-user-inactive", "accounts-lockout-all-users-unlocked", "accounts-lockout-unlock-all", "active-cron-jobs", "add-cron-job", "add-cron-job-placeholder", "attachment-storage-configuration", "attachments-path", "attachments-path-description", "avatars-path", "avatars-path-description", "board-archive-failed", "board-archive-scheduled", "board-backup-failed", "board-backup-scheduled", "board-cleanup-failed", "board-cleanup-scheduled", "board-operations", "cron-jobs", "cron-migrations", "cron-job-delete-confirm", "cron-job-delete-failed", "cron-job-deleted", "cron-job-pause-failed", "cron-job-paused", "cron-job-resume-failed", "cron-job-resumed", "cron-job-start-failed", "cron-job-started", "cron-migration-errors", "cron-migration-warnings", "cron-no-errors", "cron-error-severity", "cron-error-message", "cron-error-details", "cron-clear-errors", "cron-retry-failed", "cron-resume-paused", "cron-errors-cleared", "cron-no-failed-migrations", "cron-no-paused-migrations", "cron-migrations-resumed", "cron-migrations-retried", "complete", "idle", "filesystem-path-description", "filesystem-enabled", "filesystem-disabled", "filesystem-enabled-description", "storage-read", "storage-enabled", "s3-minio-storage-description", "s3-force-path-style", "s3-force-path-style-description", "azure-account-name", "azure-account-key", "azure-connection-string", "azure-connection-string-description", "azure-container", "database-migration", "database-migration-description", "database-migrate-to-ferretdb", "database-migrate-to-mongodb", "database-migration-confirm", "database-migration-phase", "database-migration-done", "sandstorm-migration-description", "sandstorm-migration-status", "sandstorm-migration-success", "sandstorm-migration-failed", "sandstorm-migration-pending", "sandstorm-storage-item", "sandstorm-disk-usage", "sandstorm-raw-mongodb", "sandstorm-delete-raw-mongodb", "sandstorm-delete-raw-mongodb-description", "sandstorm-delete-raw-mongodb-confirm", "sandstorm-raw-mongodb-deleted", "collections", "features", "features-performance", "cards-loading", "cards-loading-auto", "cards-loading-all", "cards-loading-lazy", "cards-loading-description", "cards-loading-lazy-note", "features-security", "render-links-as-plain-text", "render-links-as-plain-text-description", "always-show-code-as-text", "always-show-code-as-text-description", "disable-all-import", "disable-all-import-description", "disable-all-export", "disable-all-export-description", "disable-import-avatars", "disable-import-avatars-description", "disable-export-avatars", "disable-export-avatars-description", "anonymize-import-users", "anonymize-import-users-description", "anonymize-export-users", "anonymize-export-users-description", "anonymize-account", "anonymize-account-confirm-popup", "disable-activities", "disable-activities-description", "disable-notifications", "disable-notifications-description", "disable-watch", "disable-watch-description", "backup-data", "backup-scope", "backup-scope-instance", "backup-scope-description", "theme-override-all-tenants", "backup-storage", "backup-now", "backup-done", "backup-schedule", "backup-frequency", "backup-frequency-off", "backup-frequency-daily", "backup-frequency-weekly", "backup-frequency-monthly", "backup-time", "backup-day-of-week", "backup-day-of-month", "backup-list", "backup-datetime", "backup-path", "backup-restore-mode", "backup-restore-add-missing", "backup-restore-replace-all", "backup-restore-select-first", "gcs-project-id", "gcs-bucket", "gcs-key-filename", "gcs-key-filename-description", "gcs-credentials", "gcs-credentials-description", "gcs-permissions-note", "cloud-secret-keep-blank", "azure-account-name-description", "azure-container-description", "gcs-project-id-description", "gcs-bucket-description", "s3-endpoint-menu-path", "s3-region-menu-path", "s3-bucket-menu-path", "s3-access-key-menu-path", "s3-secret-key-menu-path", "azure-account-name-menu-path", "azure-account-key-menu-path", "azure-connection-string-menu-path", "azure-container-menu-path", "gcs-project-id-menu-path", "gcs-bucket-menu-path", "gcs-key-filename-menu-path", "gcs-credentials-menu-path", "cloud-secret-set", "cloud-secret-none", "test-cloud-connection", "cloud-connection-success", "cloud-connection-failed", "cloud-settings-saved", "cloud-settings-save-failed", "attachment-move-storage-azure", "attachment-move-storage-gcs", "gridfs-enabled", "gridfs-disabled", "gridfs-enabled-description", "s3-disabled", "all-migrations", "select-migration", "pause", "stop", "migration-starting", "migration-pausing", "migration-stopping", "migration-pause-failed", "migration-paused", "migration-progress", "migration-start-failed", "migration-started", "migration-not-needed", "migration-status", "migration-stop-confirm", "migration-stop-failed", "migration-stopped", "mongodb-gridfs-storage", "gridfs-move-collectionfs-note", "pause-all-migrations", "s3-access-key", "s3-access-key-description", "s3-access-key-placeholder", "s3-bucket", "s3-bucket-description", "s3-connection-failed", "s3-connection-success", "s3-enabled", "s3-enabled-description", "s3-endpoint", "s3-endpoint-description", "s3-minio-storage", "s3-port", "s3-port-description", "s3-region", "s3-region-description", "s3-secret-key", "s3-secret-key-description", "s3-secret-key-placeholder", "s3-secret-key-required", "s3-settings-save-failed", "s3-settings-saved", "s3-ssl-enabled", "s3-ssl-enabled-description", "save-s3-settings", "schedule-board-archive", "schedule-board-backup", "schedule-board-cleanup", "scheduled-board-operations", "start-all-migrations", "stop-all-migrations", "test-s3-connection", "writable-path", "writable-path-description", "add-job", "attachment-migration", "attachment-monitoring", "attachment-settings", "attachment-storage-settings", "automatic-migration", "back-to-settings", "board-migration", "board-migrations", "card-show-lists-on-minicard", "comprehensive-board-migration", "comprehensive-board-migration-description", "delete-duplicate-empty-lists-migration", "delete-duplicate-empty-lists-migration-description", "lost-cards", "lost-cards-list", "restore-lost-cards-migration", "restore-lost-cards-migration-description", "restore-all-archived-migration", "restore-all-archived-migration-description", "fix-missing-lists-migration", "fix-missing-lists-migration-description", "fix-avatar-urls-migration", "fix-avatar-urls-migration-description", "fix-all-file-urls-migration", "fix-all-file-urls-migration-description", "migration-needed", "migration-complete", "migration-running", "migration-successful", "migration-failed", "migrations", "migrations-admin-only", "migrations-description", "no-issues-found", "run-migration", "run-comprehensive-migration-confirm", "run-delete-duplicate-empty-lists-migration-confirm", "run-restore-lost-cards-migration-confirm", "run-restore-all-archived-migration-confirm", "run-fix-missing-lists-migration-confirm", "run-fix-avatar-urls-migration-confirm", "run-fix-all-file-urls-migration-confirm", "restore-lost-cards-nothing-to-restore", "migration-progress-title", "migration-progress-overall", "migration-progress-current-step", "migration-progress-status", "migration-progress-details", "migration-progress-note", "view", "has-swimlanes", "step-analyze-board-structure", "step-fix-orphaned-cards", "step-convert-shared-lists", "step-ensure-per-swimlane-lists", "step-validate-migration", "step-fix-avatar-urls", "step-fix-attachment-urls", "step-analyze-lists", "step-create-missing-lists", "step-update-cards", "step-finalize", "step-delete-duplicate-empty-lists", "step-ensure-lost-cards-swimlane", "step-restore-lists", "step-restore-cards", "step-restore-swimlanes", "step-fix-missing-ids", "step-scan-users", "step-scan-files", "step-fix-file-urls", "cleanup", "cleanup-old-jobs", "completed", "conversion-info-text", "converting-board", "converting-board-description", "cpu-cores", "cpu-usage", "current-action", "database-migrations", "days-old", "duration", "estimated-time-remaining", "every-1-day", "every-1-hour", "every-1-minute", "every-10-minutes", "every-30-minutes", "every-5-minutes", "every-6-hours", "export-monitoring", "filesystem-attachments", "filesystem-size", "filesystem-storage", "force-board-scan", "gridfs-attachments", "gridfs-size", "hide-list-on-minicard", "idle-migration", "job-description", "job-details", "job-name", "job-queue", "last-run", "max-concurrent", "memory-usage", "migrate-all-to-filesystem", "migrate-all-to-gridfs", "migrate-all-to-s3", "migrated-attachments", "migration-batch-size", "migration-batch-size-description", "migration-cpu-threshold", "migration-cpu-threshold-description", "migration-delay-ms", "migration-delay-ms-description", "migration-detector", "migration-info-text", "migration-log", "migration-markers", "migration-resume-failed", "migration-resumed", "migration-steps", "migration-warning-text", "monitoring-export-failed", "monitoring-refresh-failed", "next", "next-run", "of", "operation-type", "overall-progress", "page", "pause-migration", "previous", "refresh", "refresh-monitoring", "remaining-attachments", "resume-migration", "run-once", "s3-attachments", "s3-size", "scanning-status", "schedule", "search-boards-or-operations", "show-list-on-minicard", "showChecklistAtMinicard", "showing", "start-test-operation", "step-progress", "stop-migration", "storage-distribution", "system-resources", "total-attachments", "total-operations", "total-size", "unmigrated-boards", "weight", "current-step", "otp", "create-account", "already-account", "available-repositories", "repositories", "repository", "repository-name", "size-bytes", "last-modified", "no-repositories", "create-repository", "upload-repository", "api-endpoints", "sign-in-to-upload", "account-locked", "otp-required", "invalid-credentials", "username-password-required", "password-mismatch", "username-too-short", "user-exists", "account-created", "account-creation-failed", "login", "login-allow", "confirm", "log", "logout", "server", "summary", "problems-summary-help", "problems-status-title", "problems-in-progress-help", "problems-none-in-progress", "no-new-problems", "repair-broken-cards", "repairing", "repair-broken-cards-done", "repair-broken-cards-done-unfixable", "cpu-usage-current", "cpu-cores-suffix", "cpu-load-average", "event-datetime", "event-category", "event-severity", "event-action", "event-source", "event-detail", "event-ip", "event-ipv4", "event-ipv6", "event-attempts", "integrityReportTitle", "export-swimlane", "export-select-what-to-include", "export-card-details", "import-here-instruction", "import-scoped-failed", "import-not-wekan-export", "operator-number", "globalSearch-instructions-operator-number", "import-board-source", "import-source-heading", "import-parts-instruction", "import-wekan-file", "wip-limit-groups", "wip-limit-group-name-placeholder", "wip-limit-group-add", "wip-limit-group-select-swimlane", "wip-limit-group-apply-swimlane", "board-view-aging-wip", "board-view-blocker-analysis", "board-view-monte-carlo", "board-view-process-behavior", "board-view-size-cycle-time", "flow-unknown", "flow-cycle-days", "flow-age-days", "flow-p85", "flow-samples", "flow-signal", "flow-unusual", "flow-blocker", "flow-episodes", "flow-active", "flow-blocked-days", "flow-unknown-start", "flow-confidence", "flow-target-count", "flow-finish-days", "flow-finish-date", "flow-target-date", "flow-capacity", "flow-history-days", "flow-beyond-horizon", "flow-mean", "flow-moving-range", "flow-mr-mean", "flow-size-source", "flow-size", "flow-error", "flow-details", "flow-note-agingWip", "flow-note-blockerAnalysis", "flow-note-monteCarlo", "flow-note-processBehavior", "flow-note-sizeCycleTime", "move-reason", "ask-move-reason", "time-adjustments", "time-adjustment-note", "import-board-instruction-zenkit"];
test('Tatar board layout corrections preserve keys and placeholders',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0400-\u04ff]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(locale[key],/\u0433\u0435\u043d\u0438\u0448\u043b\u0438\u043a|\u0441\u0435\u0447\u0438\u043b|\u0441\u0440\u04e9\u0445\u0441\u04d9\u0442/i,key);
 }
});
test('Tatar layout controls preserve personal scope, switch polarity and dimensions',()=>{
 assert.equal(locale['setListWidthPopup-title'],locale['set-list-width']);
 assert.equal(locale['setSwimlaneHeightPopup-title'],locale['set-swimlane-height']);
 assert.match(locale['set-list-width-value'],/\u043a\u0438\u04a3\u043b\u0435\u0433\u0435/);
 assert.match(locale['set-swimlane-height-value'],/\u0431\u0438\u0435\u043a\u043b\u0435\u0433\u0435/);
 for(const key of ['list-width-personal-note','fixed-list-width-note']) assert.match(locale[key],/\u0441\u0435\u0437\u043d\u0435\u04a3 \u04e9\u0447\u0435\u043d \u0433\u0435\u043d\u04d9/);
 assert.match(locale['home-board-remove-confirm'],/\u0431\u0435\u0442\u0435\u0440\u0435\u043b\u043c\u0438/);
 assert.notEqual(locale['keyboard-shortcuts-enabled'],locale['keyboard-shortcuts-disabled']);
 assert.notEqual(locale['click-to-enable-fixed-list-width'],locale['click-to-disable-fixed-list-width']);
 for(const kind of ['dueDate','endDate']) assert.match(locale['activity-'+kind],/^%s \u0438\u0442\u0435\u043f %s/);
});


test('Tatar common controls preserve empty results, form actions and loading warning',()=>{
 assert.match(locale['add-existing-card-as-subtask-empty'],/\u0442\u0430\u0431\u044b\u043b\u043c\u0430\u0434\u044b/);
 assert.notEqual(locale['close-add-checklist-item'],locale['close-edit-checklist-item']);
 assert.equal(locale['add-checklist'],locale['r-add-checklist']);
 assert.equal(locale['and-n-other-card'],locale['and-n-other-card_plural']);
 assert.match(locale['app-is-offline'],/\u043c\u04d9\u0433\u044a\u043b\u04af\u043c\u0430\u0442 \u044e\u0433\u0430\u043b\u0443\u0433\u0430/);
 assert.match(locale['app-is-offline'],/\u0442\u0443\u043a\u0442\u0430\u043c\u0430\u0433\u0430\u043d\u044b\u043d/);
 assert.notEqual(locale['archive-list'],locale['archive-swimlane']);
 assert.match(locale['admin'],/^\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440$/);
});


test('Tatar archive and board controls preserve deletion, visibility and member scope',()=>{
 assert.equal(locale['archives'],locale['archived-items']);
 assert.match(locale['no-archived-boards'],/\u044e\u043a/);
 assert.match(locale['attachment-delete-pop'],/\u043a\u0438\u0440\u0435 \u043a\u0430\u0439\u0442\u0430\u0440\u044b\u043f \u0431\u0443\u043b\u043c\u044b\u0439/);
 assert.notEqual(locale['attachment-delete-pop'],locale['attachment-soft-delete-pop']);
 assert.equal(locale['board-info-on-my-boards'],locale['boardInfoOnMyBoardsPopup-title']);
 assert.equal(locale['board-info-on-my-boards'],locale['boardInfoOnMyBoards-title']);
 for(const visibility of ['private','public']) assert.match(locale['board-'+visibility+'-info'],/<strong>[^<]+<\/strong>/);
 assert.notEqual(locale['board-private-info'],locale['board-public-info']);
 assert.equal(new Set(['board_members','card_members','board_assignees','card_assignees'].map(key=>locale[key])).size,4);
 assert.notEqual(locale['add-background-image'],locale['remove-background-image']);
});


test('Tatar board view controls preserve aliases, zoom limits and mode distinctions',()=>{
 assert.equal(locale['boardChangeViewPopup-title'],locale['board-view']);
 for(const key of ['boardChangeBackgroundImagePopup-title','allBoardsChangeBackgroundImagePopup-title']) assert.equal(locale[key],locale['board-change-background-image']);
 for(const key of ['changeColorPopup-title','allBoardsChangeColorPopup-title']) assert.equal(locale[key],locale['board-change-color']);
 assert.ok(locale['enter-zoom-level'].includes('50-300%'));
 assert.notEqual(locale['zoom-in'],locale['zoom-out']);
 assert.notEqual(locale['desktop-mode'],locale['mobile-mode']);
 assert.notEqual(locale['board-view-cal'],locale['board-view-multiboard-cal']);
 assert.match(locale['board-view-stats'],/^\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430$/);
 for(const key of ['board-view-gantt-frappe','board-view-gantt-dhtmlx']) assert.equal(locale[key],english[key]);
});


test('Tatar card archive guidance preserves restoration and permanent deletion distinctions',()=>{
 assert.notEqual(locale['calendar-previous-month-label'],locale['calendar-next-month-label']);
 for(const key of ['card-archive-pop','list-archive-pop','swimlane-archive-pop']) assert.match(locale[key],/\u043a\u04af\u0440\u0435\u043d\u043c\u04d9\u044f\u0447\u04d9\u043a/);
 for(const key of ['card-archive-suggest-cancel','list-archive-suggest','swimlane-archive-suggest']) assert.match(locale[key],/\u0442\u043e\u0440\u0433\u044b\u0437\u0430 \u0430\u043b\u0430\u0441\u044b\u0437/);
 assert.match(locale['card-delete-pop'],/\u043a\u0438\u0440\u0435 \u043a\u0430\u0439\u0442\u0430\u0440\u044b\u043f \u0431\u0443\u043b\u043c\u044b\u0439/);
 assert.match(locale['due-days-overdue'],/\u0441\u043e\u04a3\u0433\u0430 \u043a\u0430\u043b\u0433\u0430\u043d/);
 assert.notEqual(locale['card-due-on'],locale['card-start-on']);
 assert.equal(new Set(['attachments','custom-fields','labels','members'].map(kind=>locale['card-edit-'+kind])).size,4);
});


test('Tatar voting keeps numeric options exact and distinguishes support from opposition',()=>{
 for(const key of ['one','two','three','five','eight','thirteen','twenty','forty','oneHundred','unsure']) assert.equal(locale['poker-'+key],english['poker-'+key]);
 assert.notEqual(locale['vote-for-it'],locale['vote-against']);
 assert.notEqual(locale['positiveVoteMembersPopup-title'],locale['negativeVoteMembersPopup-title']);
 assert.equal(locale['cardCustomFieldsPopup-title'],locale['card-edit-custom-fields']);
 for(const key of ['vote-delete-pop','poker-delete-pop']) assert.match(locale[key],/\u0411\u0435\u0442\u0435\u0440\u04af \u0434\u0430\u0438\u043c\u0438/);
 assert.match(locale['allowNonBoardMembers'],/\u041a\u0435\u0440\u0433\u04d9\u043d \u0431\u0430\u0440\u043b\u044b\u043a/);
 assert.match(locale['poker-result-votes'],/^\u0422\u0430\u0432\u044b\u0448\u043b\u0430\u0440$/);
});


test('Tatar popup labels preserve account actions and restoration targets',()=>{
 assert.notEqual(locale['userDeletePopup-title'],locale['userAnonymizePopup-title']);
 assert.match(locale['userAnonymizePopup-title'],/\u0430\u043d\u043e\u043d\u0438\u043c\u043b\u0430\u0448\u0442\u044b\u0440\u0443/);
 assert.match(locale['addBoardOrgPopup-title'],/^\u041e\u0435\u0448\u043c\u0430/);
 assert.notEqual(locale['addBoardDomainPopup-title'],locale['removeBoardDomainPopup-title']);
 assert.notEqual(locale['restoreArchivedCardToListPopup-title'],locale['restoreArchivedListToSwimlanePopup-title']);
 assert.equal(locale['listsortPopup-title'],locale['r-sort-list']);
 assert.equal(locale['deleteBoardBackgroundPopup-title'],locale['remove-background-image']);
 assert.match(locale['listWidthErrorPopup-title'],/\u043a\u0438\u04a3\u043b\u0435\u0433\u0435/);
 assert.match(locale['swimlaneHeightErrorPopup-title'],/\u0431\u0438\u0435\u043a\u043b\u0435\u0433\u0435/);
 assert.equal(new Set(['importSwimlanePopup-title','importListPopup-title','importCardPopup-title','importBoardIntoPopup-title'].map(key=>locale[key])).size,4);
});


test('Tatar user mapping and appearance preserve restrictions and font distinctions',()=>{
 assert.equal(locale['map-to-existing-user'],locale['mapImportedMemberPopup-title']);
 assert.equal(locale['change-avatar'],locale['adminChangeAvatarPopup-title']);
 assert.equal(locale['change-color'],locale['changeColorPopup-title']);
 assert.equal(locale['font'],locale['change-font']);
 assert.match(locale['map-to-existing-user-desc'],/\u043a\u04af\u0431\u0440\u04d9\u043a \u0440\u04e9\u0445\u0441\u04d9\u0442 \u0431\u0438\u0440\u04d9 \u0430\u043b\u043c\u044b\u0439/);
 assert.match(locale['map-to-existing-user-no-results'],/\u0442\u0430\u0431\u044b\u043b\u043c\u0430\u0434\u044b/);
 assert.equal(new Set(['smaller','small','large','larger','largest'].map(size=>locale['font-size-'+size])).size,5);
 assert.ok(locale['font-preview-text'].endsWith('0123456789'));
 assert.match(locale['font-preview-text'],/\u0442\u04e9\u043b\u043a\u0435/);
 assert.ok(locale['casSignIn'].includes('CAS'));
 assert.ok(locale['samlSignIn'].includes('SAML'));
});


test('Tatar navigation preserves direction, toggle state and aging tiers',()=>{
 assert.equal(locale['changeAvatarPopup-title'],locale['change-avatar']);
 assert.equal(locale['changePermissionsPopup-title'],locale['change-permissions']);
 assert.equal(locale['changeSettingsPopup-title'],locale['change-settings']);
 assert.notEqual(locale['move-card-up'],locale['move-card-down']);
 assert.notEqual(locale['move-list-left'],locale['move-list-right']);
 for(const suffix of ['', '-page']) assert.notEqual(locale['click-to-star'+suffix],locale['click-to-unstar'+suffix]);
 assert.notEqual(locale['click-to-enable-auto-width'],locale['click-to-disable-auto-width']);
 for(const tier of [1,2,3]) assert.ok(locale['card-aging-tier'+tier].startsWith(String(tier)));
 assert.equal(new Set([1,2,3].map(tier=>locale['card-aging-tier'+tier])).size,3);
 assert.match(locale['changeLanguagePopup-title'],/^\u0422\u0435\u043b\u043d\u0435/);
 assert.match(locale['close-board-pop'],/\u0442\u043e\u0440\u0433\u044b\u0437\u0430 \u0430\u043b\u0430\u0441\u044b\u0437/);
});


test('Tatar colors and comment permissions preserve blank UI and permission limits',()=>{
 assert.equal(locale['comment-placeholder'],english['comment-placeholder']);
 assert.equal(locale['comment-placeholder'].trim(),'');
 for(const pair of [['red','crimson'],['green','darkgreen'],['blue','navy'],['black','white']]) assert.notEqual(locale['color-'+pair[0]],locale['color-'+pair[1]]);
 assert.match(locale['color-green'],/^\u044f\u0448\u0435\u043b$/);
 assert.match(locale['color-white'],/^\u0430\u043a$/);
 assert.match(locale['comment-assigned-only-desc'],/\u0433\u044b\u043d\u0430/);
 assert.match(locale['no-comments-desc'],/\u043a\u04af\u0440\u04d9 \u0430\u043b\u043c\u044b\u0439/);
 assert.match(locale['read-only-desc'],/\u04ae\u0437\u0433\u04d9\u0440\u0442\u04d9 \u0430\u043b\u043c\u044b\u0439/);
 assert.notEqual(locale['comment-only-desc'],locale['read-only-desc']);
});


test('Tatar copying preserves JSON syntax and restricted role meanings',()=>{
 const sample=JSON.parse(locale['copyManyCardsPopup-format']);
 assert.equal(sample.length,3);
 for(const card of sample){assert.deepEqual(Object.keys(card),['title','description']);assert.ok(card.title);assert.ok(card.description);}
 assert.equal(locale['createCustomField'],locale['createCustomFieldPopup-title']);
 assert.match(locale['read-assigned-only-desc'],/\u04ae\u0437\u0433\u04d9\u0440\u0442\u04d9 \u0430\u043b\u043c\u044b\u0439/);
 assert.match(locale['worker-desc'],/\u04af\u0437\u0435\u043d/);
 assert.match(locale['custom-field-delete-pop'],/\u043a\u0438\u0440\u0435 \u043a\u0430\u0439\u0442\u0430\u0440\u044b\u043f \u0431\u0443\u043b\u043c\u044b\u0439/);
 assert.equal(new Set(['copy-card-link-to-clipboard','copy-link-to-clipboard','copy-text-to-clipboard'].map(key=>locale[key])).size,3);
 assert.notEqual(locale['checklistDeletePopup-title'],locale['checklistItemDeletePopup-title']);
});


test('Tatar field controls preserve date notation and none-versus-unknown choices',()=>{
 for(const order of ['yyyy-mm-dd','dd-mm-yyyy','mm-dd-yyyy']) assert.equal(locale['date-format-'+order],english['date-format-'+order]);
 assert.notEqual(locale['custom-field-dropdown-none'],locale['custom-field-dropdown-unknown']);
 assert.ok(locale['custom-field-dropdown-options-placeholder'].includes('Enter'));
 assert.match(locale['custom-field-number'],/^\u0421\u0430\u043d$/);
 assert.match(locale['custom-field-text'],/^\u0422\u0435\u043a\u0441\u0442$/);
 assert.notEqual(locale['editCardStartDatePopup-title'],locale['editCardDueDatePopup-title']);
 assert.notEqual(locale['disambiguateMultiLabelPopup-title'],locale['disambiguateMultiMemberPopup-title']);
 assert.match(locale['soft-wip-limit'],/\u0439\u043e\u043c\u0448\u0430\u043a/);
});


test('Tatar email and errors preserve paragraph structure, links and permission distinctions',()=>{
 assert.equal(locale['email-invite-text'],locale['push-invite-text']);
 assert.equal(locale['email-invite-subject'],locale['push-invite-title']);
 for(const key of ['email-enrollAccount-text','email-invite-text','email-resetPassword-text','email-verifyEmail-text']) {
  assert.ok(locale[key].includes('\n\n__url__\n\n'));
  assert.equal(locale[key].split('\n\n').length,english[key].split('\n\n').length);
 }
 assert.equal(locale['editProfilePopup-title'],locale['edit-profile']);
 assert.notEqual(locale['error-board-notAdmin'],locale['error-board-notAMember']);
 assert.notEqual(locale['email-fail'],locale['email-sent']);
 for(const term of ['CSV','TSV']) assert.ok(locale['error-csv-schema'].includes(term));
 assert.match(locale['error-notAllowed'],/\u0440\u04e9\u0445\u0441\u04d9\u0442 \u0438\u0442\u043c\u0438/);
 assert.match(locale['error-import-empty-board'],/WeKan/);
});


test('Tatar export controls preserve format names and inability conditions',()=>{
 for(const [key,format] of [['export-card-pdf','PDF'],['export-card-excel','Excel'],['export-ical-feed','iCal']]) assert.ok(locale[key].includes(format));
 for(const key of ['user-can-not-export-excel','user-can-not-export-card-to-pdf','user-can-not-export-card-to-excel']) assert.match(locale[key],/\u0430\u043b\u043c\u044b\u0439$/);
 assert.match(locale['export-card-excel-no-disk-space'],/\u0431\u0443\u0448 \u0443\u0440\u044b\u043d \u0497\u0438\u0442\u043c\u0438/);
 assert.notEqual(locale['export-card-excel-free'],locale['export-card-excel-needed']);
 assert.notEqual(locale['export-card-attachment-uploaded-by'],locale['export-card-attachment-uploaded-at']);
 assert.equal(locale['export-card-subtasks'],locale['subtasks']);
 assert.match(locale['error-user-notAllowSelf'],/\u04ae\u0437\u0435\u0433\u0435\u0437\u043d\u0435/);
 assert.equal(new Set(['username','orgname','teamname','email'].map(type=>locale['error-'+type+'-taken'])).size,4);
});


test('Tatar filters preserve date, person and sorting distinctions',()=>{
 assert.equal(locale['exportCardPopup-title'],locale['export-card']);
 assert.equal(new Set(['modifiedAt','title','sort'].map(key=>locale['list-label-short-'+key])).size,3);
 assert.equal(new Set(['today','tomorrow','this-week','next-week'].map(key=>locale['filter-due-'+key])).size,4);
 assert.notEqual(locale['filter-no-due-date'],locale['filter-overdue']);
 assert.notEqual(locale['filter-assignee-label'],locale['filter-creator-label']);
 assert.notEqual(locale['filter-show-archive'],locale['filter-hide-empty']);
 for(const key of ['filter-no-label','filter-no-member','filter-no-assignee','filter-no-custom-fields']) assert.match(locale[key],/\u044e\u043a$/);
 assert.match(locale['filter-creator-label'],/^\u0422\u04e9\u0437\u04af\u0447\u0435/);
});


test('Tatar import guidance preserves executable examples and field identifiers',()=>{
 const examples={
  'import-board-instruction-kanboard':['columns','tasks','column_name','swimlane_name','date_due','owner','tags'],
  'import-board-instruction-deck':['NextCloud Deck','stacks','cards'],
  'import-board-instruction-openproject':['GET /api/v3/work_packages'],
  'import-board-instruction-asana':['GET /tasks','"data"','memberships'],
  'import-board-instruction-jira':['GET /rest/api/3/search/jql','"issues"','"automationRules"'],
  'import-board-instruction-excel':['.xlsx'],
  'import-excel-file':['.xlsx'],
  'advanced-filter-description':['== != <= >= && || ( )',"'Field 1' == 'Value 1'",'F1 == V1 && ( F2 == V2 || F2 == V3 )','F1 == /Tes.*/i']
 };
 for(const [key,parts] of Object.entries(examples)) for(const part of parts) assert.ok(locale[key].includes(part),key+': '+part);
 assert.match(locale['import-board-instruction-markdown'],/\u043c\u0430\u0440\u043a\u0435\u0440\u043b\u044b/);
 assert.notEqual(locale['show-activities'],locale['hide-activities']);
 assert.equal(locale['import-board'],locale['import-board-c']);
});


test('Tatar Trello import preserves extensions, URL and archive failure distinctions',()=>{
 for(const key of ['import-trello-json-file','import-trello-json-file-hint','import-trello-zip-no-boards']) assert.ok(locale[key].includes('.json'));
 for(const suffix of ['file','file-hint','no-boards','progress','failed','read-failed','too-large','too-many-files','file-too-large','unsafe-path']) assert.ok(locale['import-trello-zip-'+suffix].includes('.zip'));
 // CodeQL js/incomplete-url-substring-sanitization (#551): parse the link and
  // require the real host and path, not a substring.
  assert.ok((String(locale['trello-api-key']).match(/https?:\/\/[^\s"'<>)\]]+/g) || [])
    .some(link => { const url = new URL(link.replace(/[.,;:]+$/, '')); return url.hostname === 'trello.com' && url.pathname === '/app-key'; }));
 assert.equal(new Set(['too-large','too-many-files','file-too-large','unsafe-path'].map(suffix=>locale['import-trello-zip-'+suffix])).size,4);
 assert.match(locale['import-trello-zip-unsafe-path'],/\u043a\u0438\u0440\u0435 \u043a\u0430\u0433\u044b\u043b\u0434\u044b/);
 assert.match(locale['import-trello-workspace'],/\u043c\u04d9\u0497\u0431\u04af\u0440\u0438 \u0442\u04af\u0433\u0435\u043b/);
 for(const key of ['import-attachments-zip','import-trello-zip-file-hint']) assert.ok(locale[key].includes('Trello Card Attachments Downloader'));
});


test('Tatar import progress preserves cancellation choices and mapping fallback',()=>{
 assert.notEqual(locale['trello-cancel'],locale['trello-cancel-delete']);
 assert.notEqual(locale['trello-cancel'],locale['trello-resume']);
 assert.notEqual(locale['running'],locale['paused']);
 assert.match(locale['trello-cancel-delete-confirm'],/\u043a\u0438\u0440\u0435 \u043a\u0430\u0439\u0442\u0430\u0440\u044b\u043f \u0431\u0443\u043b\u043c\u044b\u0439/);
 assert.match(locale['trello-select-boards'],/\u043a\u0438\u043c\u0435\u043d\u0434\u04d9 \u0431\u0435\u0440/);
 assert.match(locale['import-members-map-note'],/\u0445\u04d9\u0437\u0435\u0440\u0433\u0435 \u043a\u0443\u043b\u043b\u0430\u043d\u0443\u0447\u044b\u0433\u0430/);
 assert.equal(locale['select-all'],locale['r-select-all']);
 assert.equal(locale['unselect-all'],locale['r-unselect-all']);
 assert.ok(locale['trello-api-credentials-required'].includes('Trello API'));
});


test('Tatar validation and membership retain year, admin and deletion requirements',()=>{
 assert.ok(locale['invalid-year'].includes('2026'));
 assert.match(locale['invalid-year'],/\u0414\u04af\u0440\u0442/);
 assert.equal(new Set(['date','time','year','user'].map(kind=>locale['invalid-'+kind])).size,4);
 assert.match(locale['last-admin-desc'],/\u043a\u0438\u043c\u0435\u043d\u0434\u04d9 \u0431\u0435\u0440/);
 assert.match(locale['label-delete-pop'],/\u043a\u0438\u0440\u0435 \u043a\u0430\u0439\u0442\u0430\u0440\u044b\u043f \u0431\u0443\u043b\u043c\u044b\u0439/);
 assert.match(locale['leave-board-pop'],/\u0431\u0430\u0440\u043b\u044b\u043a \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430\u043b\u0430\u0440\u0434\u0430\u043d/);
 assert.equal(locale['label-create'],locale['createLabelPopup-title']);
 assert.notEqual(locale['link-card'],locale['linkCardToBoardPopup-title']);
});


test('Tatar list actions preserve bulk scope, settings targets and irreversible deletion',()=>{
 for(const key of ['list-archive-cards','list-move-cards','list-select-cards']) assert.match(locale[key],/\u0431\u0430\u0440\u043b\u044b\u043a \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430\u043b\u0430\u0440\u043d\u044b/);
 assert.equal(new Set(['settingsUserPopup-title','settingsTeamPopup-title','settingsOrgPopup-title'].map(key=>locale[key])).size,3);
 assert.match(locale['list-delete-pop'],/\u0442\u043e\u0440\u0433\u044b\u0437\u0430 \u0430\u043b\u043c\u0430\u044f\u0447\u0430\u043a\u0441\u044b\u0437/);
 assert.match(locale['list-delete-suggest-archive'],/\u0442\u0430\u0440\u0438\u0445\u044b\u043d \u0441\u0430\u043a\u043b\u0430\u0443/);
 assert.equal(locale['calendar'],locale['board-view-cal']);
 assert.equal(locale['gantt'],locale['board-view-gantt']);
 assert.equal(locale['log-in'],locale['loginPopup-title']);
 assert.ok(locale['listImportCardsTsvPopup-title'].includes('Excel CSV/TSV'));
});


test('Tatar selection and roles preserve action aliases and permission limits',()=>{
 assert.equal(locale['move-selection'],locale['moveSelectionPopup-title']);
 assert.equal(locale['copy-selection'],locale['copySelectionPopup-title']);
 assert.notEqual(locale['move-selection'],locale['copy-selection']);
 assert.notEqual(locale['moveCardToTop-title'],locale['moveCardToBottom-title']);
 for(const kind of ['cards','lists','swimlanes']) assert.match(locale['no-archived-'+kind],/\u044e\u043a\.$/);
 assert.match(locale['normal-desc'],/\u041a\u04e9\u0439\u043b\u04d9\u04af\u043b\u04d9\u0440\u043d\u0435 \u04af\u0437\u0433\u04d9\u0440\u0442\u04d9 \u0430\u043b\u043c\u044b\u0439/);
 assert.match(locale['normal-assigned-only-desc'],/\u0433\u044b\u043d\u0430 \u043a\u04af\u0440\u0435\u043d\u04d9/);
 assert.match(locale['muted-info'],/\u0430\u043b\u043c\u0430\u044f\u0447\u0430\u043a\u0441\u044b\u0437/);
 assert.match(locale['not-accepted-yet'],/\u0438\u0442\u0435\u043b\u043c\u04d9\u0433\u04d9\u043d/);
});


test('Tatar visibility guidance preserves login markup and membership restrictions',()=>{
 assert.match(locale['page-maybe-private'],/<a href='%s'>[^<]+<\/a>/);
 for(const key of ['private-desc','public-desc']) assert.match(locale[key],/\u043a\u0435\u0448\u0435\u043b\u04d9\u0440 \u0433\u0435\u043d\u04d9/);
 assert.ok(locale['public-desc'].includes('Google'));
 assert.notEqual(locale['private-desc'],locale['public-desc']);
 for(const kind of ['private','public']) assert.match(locale['custom-'+kind+'-desc-placeholder'],/\u0431\u0443\u0448 \u043a\u0430\u043b\u0434\u044b\u0440\u044b\u0433\u044b\u0437/);
 assert.equal(locale['preview'],locale['previewAttachedImagePopup-title']);
 assert.equal(locale['preview'],locale['previewClipboardImagePopup-title']);
 assert.equal(locale['remove-label'],locale['r-d-remove-label']);
 assert.match(locale['paste-or-dragdrop'],/\u0440\u04d9\u0441\u0435\u043c\u043d\u04d9\u0440 \u0433\u0435\u043d\u04d9/);
});


test('Tatar member removal and shortcuts preserve scope and action distinctions',()=>{
 assert.match(locale['remove-member-pop'],/\u0431\u0430\u0440\u043b\u044b\u043a \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430\u043b\u0430\u0440\u0434\u0430\u043d/);
 assert.match(locale['remove-member-pop'],/\u0431\u0435\u043b\u0434\u0435\u0440\u04af \u0497\u0438\u0431\u04d9\u0440\u0435\u043b\u04d9\u0447\u04d9\u043a/);
 assert.equal(locale['rename-board'],locale['boardChangeTitlePopup-title']);
 assert.equal(locale['shortcut-close-dialog'],locale['close-dialog']);
 assert.notEqual(locale['shortcut-add-self'],locale['shortcut-assign-self']);
 assert.match(locale['shortcut-assign-self'],/\u0497\u0430\u0432\u0430\u043f\u043b\u044b/);
 assert.ok(locale['search-example'].includes('Enter'));
 assert.match(locale['rescue-card-description-dialogue'],/\u0430\u043b\u044b\u0448\u0442\u044b\u0440\u044b\u0440\u0433\u0430\u043c\u044b/);
});


test('Tatar shortcuts preserve sidebar targets and automatic-opening states',()=>{
 assert.equal(new Set(['filterbar','searchbar','sidebar'].map(kind=>locale['shortcut-toggle-'+kind])).size,3);
 assert.notEqual(locale['sidebar-open'],locale['sidebar-close']);
 assert.notEqual(locale['set-default-board-title'],locale['unset-default-board-title']);
 assert.match(locale['unset-default-board-title'],/\u0442\u0443\u043a\u0442\u0430\u0442\u0443/);
 assert.match(locale['shortcut-filter-my-assigned-cards'],/\u041c\u0438\u04a3\u0430 \u0431\u0438\u043b\u0433\u0435\u043b\u04d9\u043d\u0433\u04d9\u043d/);
 assert.match(locale['show-cards-minimum-count'],/\u043a\u04af\u0431\u0440\u04d9\u043a/);
 assert.equal(locale['starred-boards'],locale['bookmarksPopup-title']);
 for(const key of ['spent-time-hours','overtime-hours']) assert.match(locale[key],/\(\u0441\u04d9\u0433\u0430\u0442\u044c\)$/);
});


test('Tatar tracking and uploads preserve shortcut ranges and upload states',()=>{
 for(const key of ['toggle-assignees','toggle-labels','remove-labels-multiselect']) assert.ok(locale[key].includes('1-9'));
 assert.match(locale['toggle-labels'],/\u04e9\u0441\u0442\u0438$/);
 assert.match(locale['remove-labels-multiselect'],/\u0431\u0435\u0442\u0435\u0440\u04d9$/);
 assert.equal(new Set(['uploading-files','upload-failed','upload-completed'].map(key=>locale[key])).size,3);
 assert.notEqual(locale['has-overtime-cards'],locale['has-spenttime-cards']);
 assert.notEqual(locale['flow-start'],locale['flow-stop']);
 assert.match(locale['unsaved-description'],/\u0441\u0430\u043a\u043b\u0430\u043d\u043c\u0430\u0433\u0430\u043d/);
 const image=locale['custom-top-left-corner-logo-image-url'],link=locale['custom-top-left-corner-logo-link-url'];
 assert.notEqual(image,link);assert.ok(image.includes('URL'));assert.ok(link.includes('URL'));
});

test('Tatar settings preserve defaults, autolink disabling and transfer directions',()=>{
 assert.ok(locale['custom-top-left-corner-logo-height'].endsWith('27'));
 assert.ok(locale['welcome-swimlane'].endsWith('1'));
 assert.ok(locale['external-link-pattern-description'].includes('"#1234"'));
 assert.ok(locale['external-link-pattern-description'].includes('\u0438\u043a\u0435 \u043a\u044b\u0440\u043d\u044b\u04a3 \u0442\u0435\u043b\u04d9\u0441\u04d9 \u043a\u0430\u0439\u0441\u044b\u0441\u044b\u043d'));
 assert.ok(locale['automatic-linked-url-schemes'].includes('\u04ba\u04d9\u0440 \u044e\u043b\u0434\u0430 \u0431\u0435\u0440 URL'));
 for(const key of ['wipLimitErrorPopup-title','wipLimitErrorPopup-dialog-pt1','wipLimitErrorPopup-dialog-pt2']) assert.ok(locale[key].includes('WIP'));
 for(const prefix of ['attachment','api']) assert.notEqual(locale[prefix+'-upload-limit-label'],locale[prefix+'-download-limit-label']);
 assert.ok(locale['attachment-transfer-limits-invalid-value'].includes('\u0443\u04a3\u0430\u0439'));
 assert.ok(locale['avatars-upload-blocked-description'].includes('\u041a\u0438\u043b\u0435\u0448\u04af \u0431\u0443\u0435\u043d\u0447\u0430 \u0430\u0432\u0430\u0442\u0430\u0440\u043b\u0430\u0440 \u0440\u04e9\u0445\u0441\u04d9\u0442 \u0438\u0442\u0435\u043b\u0433\u04d9\u043d'));
 assert.notEqual(locale['attachment-transfer-limits-saved'],locale['attachment-transfer-limits-save-failed']);
});

test('Tatar email settings preserve protocol names and invitation fields',()=>{
 for(const key of ['smtp-host','smtp-port','smtp-host-description','smtp-port-description','smtp-tls-description','email-smtp-test-subject']) assert.ok(locale[key].includes('SMTP'));
 for(const key of ['smtp-tls','smtp-tls-description']) assert.ok(locale[key].includes('TLS'));
 for(const kind of ['invite','activity']) assert.notEqual(locale['email-templates-'+kind+'-subject'],locale['email-templates-'+kind+'-body']);
 const invitation=locale['email-invite-register-text'];
 for(const token of ['__user__','__inviter__','__url__','__icode__']) assert.equal(invitation.split(token).length-1,1);
 assert.equal(invitation.split('\n\n').length,english['email-invite-register-text'].split('\n\n').length);
 assert.ok(locale['webhook-token'].includes('\u043c\u04d9\u0497\u0431\u04af\u0440\u0438 \u0442\u04af\u0433\u0435\u043b'));
 assert.notEqual(locale['registration'],locale['self-registration']);
 assert.notEqual(locale['attachment-limit-mode-blocked'],locale['attachment-limit-mode-unlimited']);
});

test('Tatar system information preserves product names and runtime identifiers',()=>{
 for(const key of ['Meteor','Node']) assert.equal(locale[key],english[key]);
 for(const value of ['changeStreams','oplog','polling']) assert.ok(locale.Reactivity_mode.includes(value));
 assert.ok(locale.Reactivity_order.includes('METEOR_REACTIVITY_ORDER'));
 assert.ok(locale.DDP_transport.includes('DDP_TRANSPORT'));
 for(const key of ['MongoDB_version','MongoDB_storage_engine','MongoDB_Oplog_enabled']) assert.ok(locale[key].includes('MongoDB'));
 assert.equal(locale['outgoing-webhooks'],locale['outgoingWebhooksPopup-title']);
 assert.notEqual(locale['outgoing-webhooks'],locale['bidirectional-webhooks']);
 assert.notEqual(locale.OS_Freemem,locale.OS_Totalmem);
 assert.notEqual(locale.FerretDB_version,locale.FerretDB_commit);
});

test('Tatar organization settings preserve domain syntax and administrator limits',()=>{
 for(const literal of ['a.example.com','kanban.example.org','MULTITENANCY=true']) assert.ok(locale['org-domains-description'].includes(literal));
 assert.ok(locale['org-domains-description'].includes('\u04e9\u0442\u0435\u0440\u043b\u04d9\u0440'));
 assert.ok(locale['org-admins-description'].includes('\u0440\u0435\u0437\u0435\u0440\u0432 \u043a\u04af\u0447\u0435\u0440\u043c\u04d9\u043b\u04d9\u0440\u0435 \u0431\u0435\u043b\u04d9\u043d \u0433\u0435\u043d\u04d9'));
 assert.ok(locale['org-admins-description'].includes('\u0445\u043e\u043a\u0443\u043a\u044b\u043d \u0431\u0438\u0440\u04d9 \u0430\u043b\u043c\u044b\u0439'));
 assert.ok(locale['org-admins-description'].includes('\u0438\u0434\u0430\u0440\u04d9 \u0438\u0442\u04d9 \u0430\u043b\u043c\u044b\u0439'));
 for(const suffix of ['shared-templates','propagate-members-to-boards','sync-members-from-auth']) assert.equal(locale['org-'+suffix],locale['team-'+suffix]);
 assert.notEqual(locale['automatically-field-on-card'],locale['always-field-on-card']);
 assert.ok(locale['showSum-field-on-list'].includes('\u0441\u0443\u043c\u043c\u0430\u0441\u044b\u043d'));
 assert.equal(new Set(['hours','minutes','seconds'].map(key=>locale[key])).size,3);
});

test('Tatar deletion warnings preserve irreversibility and duplicate-list conditions',()=>{
 assert.ok(locale['board-delete-notice'].includes('\u0411\u0443 \u0442\u0430\u043a\u0442\u0430\u0433\u0430'));
 assert.ok(locale['delete-board-confirm-popup'].includes('\u041a\u0438\u0440\u0435 \u043a\u0430\u0439\u0442\u0430\u0440\u0443 \u043c\u04e9\u043c\u043a\u0438\u043d \u0442\u04af\u0433\u0435\u043b'));
 assert.ok(locale['delete-all-notifications-confirm'].includes('\u043a\u0438\u0440\u0435 \u043a\u0430\u0439\u0442\u0430\u0440\u044b\u043f \u0431\u0443\u043b\u043c\u044b\u0439'));
 assert.ok(locale['delete-duplicate-lists-confirm'].includes('\u0431\u0435\u0440 \u04af\u043a \u0438\u0441\u0435\u043c\u043b\u0435'));
 assert.ok(locale['delete-duplicate-lists-confirm'].includes('\u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430\u043b\u0430\u0440\u044b \u0431\u0443\u043b\u043c\u0430\u0433\u0430\u043d'));
 assert.notEqual(locale['card-received-on'],locale['card-end-on']);
 assert.equal(locale['default'],locale['defaultdefault']);
 assert.equal(locale['subtask-settings'],locale['boardSubtaskSettingsPopup-title']);
 assert.equal(locale['card-settings'],locale['boardCardSettingsPopup-title']);
 for(const key of ['setCardActionsColorPopup-title','setSwimlaneColorPopup-title','setListColorPopup-title']) assert.equal(locale[key],locale['setCardActionsColorPopup-title']);
});

test('Tatar minicards and activity messages preserve counts and argument roles',()=>{
 for(const key of ['checklist-count','checklist-count-on-minicard']) assert.ok(locale[key].includes('(0/0)'));
 assert.notEqual(locale['prefix-with-full-path'],locale['prefix-with-parent']);
 assert.notEqual(locale['subtext-with-full-path'],locale['subtext-with-parent']);
 const format=(key,args)=>{let i=0;return locale[key].replace(/%s/g,()=>args[i++]);};
 assert.ok(format('activity-added-label',['LABEL','CARD']).includes("'LABEL' \u0442\u0430\u043c\u0433\u0430\u0441\u044b\u043d CARD"));
 assert.ok(format('activity-removed-label',['LABEL','CARD']).includes("'LABEL' \u0442\u0430\u043c\u0433\u0430\u0441\u044b\u043d CARD"));
 const set=format('activity-set-customfield',['FIELD','VALUE','CARD']);
 assert.ok(set.includes("'FIELD' \u043c\u0430\u0445\u0441\u0443\u0441 \u043a\u044b\u0440\u044b\u043d 'VALUE' \u043a\u044b\u0439\u043c\u043c\u04d9\u0442\u0435\u043d\u04d9"));
 assert.ok(set.endsWith('(CARD)'));
 assert.ok(format('activity-unset-customfield',['FIELD','CARD']).endsWith('(CARD)'));
 assert.notEqual(locale['activity-added-label-card'],locale['activity-removed-label-card']);
});

test('Tatar branding settings preserve HTML boundaries and configuration filenames',()=>{
 for(const key of ['ldap','oauth2','cas','settings-group-url']) assert.equal(locale[key],english[key]);
 for(const key of ['custom-assetlinks-enabled','custom-assetlinks-content']) assert.ok(locale[key].includes('assetlinks.json'));
 for(const key of ['custom-assetlinks-content','custom-head-manifest-content']) assert.ok(locale[key].includes('(JSON)'));
 assert.ok(locale['add-custom-html-after-body-start'].includes('<body>'));
 assert.ok(!locale['add-custom-html-after-body-start'].includes('</body>'));
 assert.ok(locale['add-custom-html-before-body-end'].includes('</body>'));
 assert.ok(locale['oidc-button-text'].includes('OIDC'));
 assert.notEqual(locale['authentication-method'],locale['authentication-type']);
 for(const key of ['org-number','team-number','people-number']) assert.ok(locale[key].endsWith(': '));
});

test('Tatar reminders preserve dates, mention fields and irreversible deletion warnings',()=>{
 for(const key of ['delete-user-confirm-popup','delete-team-confirm-popup','delete-org-confirm-popup','swimlane-delete-pop']) assert.ok(locale[key].includes('\u041a\u0438\u0440\u0435 \u043a\u0430\u0439\u0442\u0430\u0440\u0443 \u043c\u04e9\u043c\u043a\u0438\u043d \u0442\u04af\u0433\u0435\u043b'));
 for(const key of ['act-a-endAt','act-a-startAt','act-a-receivedAt']) {
  assert.ok(locale[key].includes('(__timeOldValue__) \u0443\u0440\u044b\u043d\u044b\u043d\u0430 __timeValue__'));
 }
 assert.equal(new Set(['almostdue','pastdue','duenow'].map(key=>locale[key])).size,3);
 assert.ok(locale['duenow'].endsWith('\u0431\u04af\u0433\u0435\u043d'));
 for(const key of ['act-newDue','act-withDue']) assert.ok(locale[key].endsWith('[__board__]'));
 assert.ok(locale['act-newDue'].includes('\u0431\u0435\u0440\u0435\u043d\u0447\u0435'));
 for(const token of ['__board__','__swimlane__','__list__','__card__','__comment__']) assert.equal(locale['act-atUserComment'].split(token).length-1,1);
 assert.notEqual(locale['left-of-list'],locale['right-of-list']);
 assert.notEqual(locale['above-selected-card'],locale['below-selected-card']);
});

test('Tatar editor preferences preserve keyboard combinations and window behavior',()=>{
 const description=locale['submit-on-enter-description'];
 for(const shortcut of ['Enter','Shift+Enter','Ctrl/Cmd+Enter']) assert.ok(description.includes(shortcut));
 assert.ok(description.includes('\u041a\u0430\u0431\u044b\u0437\u044b\u043b\u0433\u0430\u043d\u0434\u0430'));
 assert.ok(description.includes('\u0421\u04af\u043d\u0434\u0435\u0440\u0435\u043b\u0433\u04d9\u043d\u0434\u04d9'));
 assert.ok(locale['open-many-cards-at-once-description'].includes('\u04af\u0437 \u0442\u04d9\u0440\u04d9\u0437\u04d9\u0441\u0435\u043d\u0434\u04d9'));
 assert.ok(locale['open-many-cards-at-once-description'].includes('\u044d\u043b\u0435\u043a \u0430\u0447\u044b\u043b\u0433\u0430\u043d \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430\u043d\u044b \u044f\u0431\u0430'));
 for(const kind of ['Org','Team','User']) assert.notEqual(locale['edit'+kind+'Popup-title'],locale['new'+kind+'Popup-title']);
 assert.notEqual(locale['show-on-card'],locale['show-on-minicard']);
 assert.notEqual(locale['drag-to-resize-sidebar'],locale['drag-to-resize-left-menu']);
});

test('Tatar roles and weekdays preserve permissions and read-state distinctions',()=>{
 assert.ok(locale['roles-info'].includes('\u0447\u0438\u043a\u043b\u04d9\u043f \u0431\u0443\u043b\u043c\u044b\u0439'));
 assert.ok(locale['roles-status-desc'].includes('\u0423\u043a\u0443 \u04e9\u0447\u0435\u043d \u0433\u0435\u043d\u04d9'));
 assert.ok(locale['roles-status-desc'].includes('\u0441\u0430\u043a\u043b\u0430\u0433\u0430\u043d\u0447\u044b'));
 assert.notEqual(locale['mark-all-as-read'],locale['mark-all-as-unread']);
 assert.notEqual(locale['roles-status-sees-all'],locale['roles-status-sees-assigned']);
 assert.equal(locale['allow-rename'],locale['allowRenamePopup-title']);
 assert.deepEqual(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(key=>locale[key]),['\u0414\u04af\u0448\u04d9\u043c\u0431\u0435','\u0421\u0438\u0448\u04d9\u043c\u0431\u0435','\u0427\u04d9\u0440\u0448\u04d9\u043c\u0431\u0435','\u041f\u04d9\u043d\u0497\u0435\u0448\u04d9\u043c\u0431\u0435','\u0496\u043e\u043c\u0433\u0430','\u0428\u0438\u043c\u0431\u04d9','\u042f\u043a\u0448\u04d9\u043c\u0431\u0435']);
 for(const key of ['delete-linked-card-before-this-card','delete-linked-cards-before-this-list']) assert.ok(locale[key].includes('\u0431\u0435\u0442\u0435\u0440\u0433\u04d9\u043d\u0447\u0435, \u0431\u0430\u0448\u0442\u0430'));
});

test('Tatar shared templates preserve domain validation and nonempty-board scope',()=>{
 // CodeQL #552: the example domain is a whole word of the text, not part of a host.
  assert.ok(locale['invalid-domain'].split(/\s+/).some(word => word === 'example.com'));
 assert.ok(locale['invalid-domain'].includes('@'));
 assert.ok(locale['invalid-domain'].includes('\u0431\u0443\u0448\u043b\u044b\u043a\u043b\u0430\u0440\u0441\u044b\u0437'));
 assert.ok(locale['shared-templates-info'].includes('\u0431\u0435\u0440 \u044f\u043a\u0438 \u0431\u0435\u0440\u043d\u0438\u0447\u04d9'));
 assert.ok(locale['shared-templates-info'].includes('\u0431\u0443\u0448 \u0431\u0443\u043b\u043c\u0430\u0433\u0430\u043d \u043a\u0443\u043b\u043b\u0430\u043d\u0443\u0447\u044b\u043b\u0430\u0440 \u0433\u044b\u043d\u0430'));
 for(const scope of ['\u041e\u0435\u0448\u043c\u0430\u043b\u0430\u0440','\u0422\u04e9\u0440\u043a\u0435\u043c\u043d\u04d9\u0440','\u0414\u043e\u043c\u0435\u043d\u043d\u0430\u0440']) assert.ok(locale['shared-templates-select-scope'].includes(scope));
 assert.notEqual(locale['displayName'],locale['shortName']);
 assert.notEqual(locale['day'],locale['week']);
 assert.ok(locale['remove-domain-from-board'].includes('\u0431\u0443 \u0442\u0430\u043a\u0442\u0430\u0434\u0430\u043d'));
});

test('Tatar search views preserve authorization scope and result placeholders',()=>{
 assert.equal(locale['context-separator'],'/');
 for(const prefix of ['myCardsViewChange','myCardsSortChange','dueCardsViewChange','globalSearchViewChange']) assert.equal(locale[prefix+'-title'],locale[prefix+'Popup-title']);
 assert.ok(locale['dueCardsViewChange-choice-all-description'].includes('\u0442\u04d9\u043c\u0430\u043c\u043b\u0430\u043d\u043c\u0430\u0433\u0430\u043d'));
 assert.ok(locale['globalSearchViewChange-choice-all-description'].includes('\u04d9\u0433\u044a\u0437\u0430 \u044f\u043a\u0438 \u0497\u0430\u0432\u0430\u043f\u043b\u044b \u043a\u0435\u0448\u0435'));
 assert.ok(locale['globalSearchViewChange-choice-all-description'].includes('*'+locale['globalSearchViewChange-choice-me']+'*'));
 assert.ok(locale['n-n-of-n-cards-found'].includes('__start__-__end__'));
 assert.notEqual(locale['no-cards-found'],locale['one-card-found']);
 assert.ok(locale['comment-not-found'].includes("'%s'"));
});

test('Tatar search aliases preserve parser-compatible words and shorthand symbols',()=>{
 assert.equal(locale['operator-label-abbrev'],'#');
 assert.equal(locale['operator-user-abbrev'],'@');
 const operatorKeys=Object.keys(english).filter(key=>key.startsWith('operator-')&&!key.endsWith('-abbrev')&&key!=='operator-unknown-error');
 const parser=require('node:fs').readFileSync(require('node:path').join(__dirname,'../config/query-classes.js'),'utf8');
 const registered=operatorKeys.filter(key=>parser.includes("'"+key+"':"));
 for(const key of registered) assert.match(locale[key],/^[\p{Letter}\p{Mark}'\u2019]+$/u,key);
 const aliases=Object.keys(english).filter(key=>/^operator-.*-abbrev$/.test(key)).map(key=>locale[key]);
 assert.equal(new Set(aliases).size,aliases.length);
 assert.equal(new Set(registered.map(key=>locale[key])).size,registered.length);
 for(const name of ['created','modified','due','description','assignee']) assert.equal(locale['operator-'+name],locale['predicate-'+name]);
});

test('Tatar search instructions preserve executable examples and syntax markers',()=>{
 const description=locale['globalSearch-instructions-description'];
 assert.ok(description.includes('`list:Blocked`'));
 assert.ok(description.includes('`__operator_list__:"To Review"`'));
 assert.ok(locale['globalSearch-instructions-operator-at'].includes('`__operator_user_abbrev__username`'));
 assert.ok(locale['globalSearch-instructions-operator-at'].includes('`user:<username>`'));
 for(const key of keys.filter(key=>key.startsWith('globalSearch-instructions-operator-'))) {
  assert.deepEqual(locale[key].match(/<[^>]+>/g)||[],english[key].match(/<[^>]+>/g)||[],key);
  assert.equal((locale[key].match(/`/g)||[]).length%2,0,key);
 }
 assert.notEqual(locale['next-page'],locale['previous-page']);
});

test('Tatar search logic preserves OR, AND, negation and literal examples',()=>{
 assert.equal(locale['excel-font'],'Arial');
 assert.ok(locale['globalSearch-instructions-notes-2'].includes('*\u042f\u041a\u0418*'));
 assert.ok(locale['globalSearch-instructions-notes-3'].includes('*\u04ba\u04d8\u041c*'));
 for(const key of ['globalSearch-instructions-notes-2','globalSearch-instructions-notes-3','globalSearch-instructions-operator-has','globalSearch-instructions-operator-sort']) {
  assert.deepEqual(locale[key].match(/`[^`]+`/g),english[key].match(/`[^`]+`/g),key);
 }
 assert.ok(locale['globalSearch-instructions-operator-limit'].includes('\u0443\u04a3\u0430\u0439 \u0431\u04e9\u0442\u0435\u043d \u0441\u0430\u043d'));
 assert.ok(locale['globalSearch-instructions-notes-5'].includes('\u044d\u0437\u043b\u04d9\u043d\u043c\u0438'));
});

test('Tatar card actions preserve sort direction and opposing actions',()=>{
 assert.ok(locale['sort-boards-title-asc'].includes('(A → Z)'));
 assert.ok(locale['sort-boards-title-desc'].includes('(Z → A)'));
 assert.equal(locale['cardsSortPopup-title'],locale['sort-cards']);
 for(const pair of [['card-mark-complete','card-mark-incomplete'],['add-sticker','remove-sticker'],['add-dependency','remove-dependency'],['show-dependencies','hide-dependencies']]) assert.notEqual(locale[pair[0]],locale[pair[1]]);
});

test('Tatar dependency imports preserve formats, directions and image-size tokens',()=>{
 for(const key of ['import-dependencies-file','import-dependencies-placeholder']) for(const format of ['JSON','SVG']) assert.ok(locale[key].includes(format));
 for(const pair of [['dependency-type-blocks','dependency-type-is-blocked-by'],['dependency-type-fixes','dependency-type-is-fixed-by'],['location-latitude','location-longitude']]) assert.notEqual(locale[pair[0]],locale[pair[1]]);
 assert.equal(locale['background-too-big'].split('{{size}}').length-1,1);
 assert.equal(locale['board-backgrounds'],locale['boardBackgrounds-title']);
 assert.equal(locale['add-location'],locale['cardLocationsPopup-title']);
 for(const token of ['__imported__','__unmatched__']) assert.equal(locale['import-dependencies-done'].split(token).length-1,1);
});

test('Tatar map and diagnostics messages preserve commands and ordering choices',()=>{
 const troubleshooting=locale['server-error-troubleshooting'];
 for(const command of ['sudo snap logs wekan.wekan','sudo docker logs wekan-app']) assert.ok(troubleshooting.includes('`'+command+'`'));
 assert.equal(troubleshooting.split('\n').length,english['server-error-troubleshooting'].split('\n').length);
 assert.notEqual(locale['location-detect-none'],locale['location-detect-done']);
 assert.notEqual(locale['created-at-newest-first'],locale['created-at-oldest-first']);
 assert.equal(locale['move-swimlane'],locale['moveSwimlanePopup-title']);
 assert.ok(locale['custom-field-stringtemplate-item-placeholder'].includes('Enter'));
});

test('Tatar reports preserve IP protocols and aggregated API reporting',()=>{
 for(const protocol of ['IPv4','IPv6']) assert.ok(locale['office-report-desc'].includes(protocol));
 for(const key of ['apiReportTitle','api-endpoint']) assert.equal(locale[key],'API');
 assert.ok(locale['api-report-desc'].includes('REST API'));
 assert.ok(locale['api-report-desc'].includes('\u04bb\u04d9\u0440 \u0441\u043e\u0440\u0430\u0443 \u04e9\u0447\u0435\u043d \u0430\u0435\u0440\u044b\u043c \u044e\u043b \u0431\u0443\u043b\u043c\u044b\u0439'));
 assert.notEqual(locale['office-first-seen'],locale['office-last-seen']);
 assert.notEqual(locale['impersonation-admin'],locale['impersonation-user']);
 assert.ok(locale['filename-invisible-legend'].startsWith('\u041a\u044b\u0437\u044b\u043b:'));
});

test('Tatar recovery messages preserve API configuration and distinct spinner choices',()=>{
 for(const literal of ['REST API','WITH_API=true']) assert.ok(locale['api-no-calls'].includes(literal));
 assert.ok(locale['recovery-report-desc'].includes('MongoDB'));
 assert.notEqual(locale['api-first-called'],locale['api-last-called']);
 assert.notEqual(locale['recovery-no-events'],locale['recovery-maintenance-title']);
 assert.equal(locale['copy-swimlane'],locale['copySwimlanePopup-title']);
 const spinners=['Bounce','Cube','Cube-Grid','Dot','Double-Bounce','Rotateplane','Scaleout','Wave'];
 assert.equal(new Set(spinners.map(key=>locale[key])).size,spinners.length);
});

test('Tatar ticket states preserve deletion constraints and mail header notation',()=>{
 assert.ok(locale['carbon-copy'].includes('(Cc:)'));
 for(const key of ['delete-org-warning-message','delete-team-warning-message']) {
  assert.ok(locale[key].includes('\u0431\u0435\u0442\u0435\u0440\u0435\u043f \u0431\u0443\u043b\u043c\u044b\u0439'));
  assert.ok(locale[key].includes('\u043a\u0438\u043c\u0435\u043d\u0434\u04d9 \u0431\u0435\u0440 \u043a\u0443\u043b\u043b\u0430\u043d\u0443\u0447\u044b'));
 }
 assert.equal(new Set(['open','pending','closed','resolved','cancelled'].map(key=>locale[key])).size,5);
 assert.notEqual(locale['maximize-card'],locale['minimize-card']);
 assert.notEqual(locale['request'],locale['requests']);
});

test('Tatar invitations preserve registration conditions and distinct heap metrics',()=>{
 assert.notEqual(locale['invite-people-success'],locale['invite-people-error']);
 assert.ok(locale['email-domain-allowed-to-invite'].includes('\u0442\u0435\u0440\u043a\u04d9\u043b\u04af \u0441\u04af\u043d\u0434\u0435\u0440\u0435\u043b\u0433\u04d9\u043d\u0434\u04d9'));
 assert.ok(locale['remove-team-from-table'].includes('\u0442\u0430\u043a\u0442\u0430\u0434\u0430\u043d'));
 const metrics=['Node_heap_total_heap_size','Node_heap_total_heap_size_executable','Node_heap_total_physical_size','Node_heap_total_available_size','Node_heap_used_heap_size'];
 for(const key of metrics) assert.ok(locale[key].startsWith('Node '));
 assert.equal(new Set(metrics.map(key=>locale[key])).size,metrics.length);
 assert.notEqual(locale['confirm-btn'],locale['remove-btn']);
});

test('Tatar memory and checklist labels preserve identifiers and line mapping',()=>{
 const metrics=keys.filter(key=>key.startsWith('Node_'));
 for(const key of metrics) assert.ok(locale[key].startsWith('Node '));
 assert.equal(new Set(metrics.map(key=>locale[key])).size,metrics.length);
 assert.ok(locale.Node_heap_does_zap_garbage.includes('does_zap_garbage'));
 assert.ok(locale.Node_heap_malloced_memory.includes('malloc'));
 assert.equal(locale.moveChecklist,locale['moveChecklistPopup-title']);
 assert.ok(locale.newLineNewItem.includes(' = '));
 assert.notEqual(locale.newlineBecomesNewChecklistItem,locale.newlineBecomesNewChecklistItemOriginOrder);
 assert.ok(locale['custom-legal-notice-link-url'].includes('URL'));
});

test('Tatar attachment moves preserve storage names and operation scope',()=>{
 for(const key of ['move-storage-collectionfs','move-storage-gridfs']) assert.equal(locale[key],english[key]);
 for(const [suffix,name] of [['gridfs','GridFS'],['s3','S3']]) for(const prefix of ['attachment-move-storage-','move-all-attachments-to-','move-all-attachments-of-board-to-']) assert.ok(locale[prefix+suffix].includes(name));
 for(const suffix of ['fs','gridfs','s3']) assert.equal(new Set(['attachment-move-storage-','move-all-attachments-to-','move-all-attachments-of-board-to-'].map(prefix=>locale[prefix+suffix])).size,3);
 assert.equal(locale.copyChecklist,locale['copyChecklistPopup-title']);
 assert.equal(locale.copyChecklistFromTemplate,locale['copyChecklistFromTemplatePopup-title']);
 assert.notEqual(locale.copyChecklist,locale.copyChecklistFromTemplate);
 assert.notEqual(locale['move-source'],locale['move-destination']);
});

test('Tatar storage repair preserves read eligibility and repair states',()=>{
 assert.equal(locale['move-storage-s3'],'S3/MinIO');
 assert.ok(locale['attachment-repair-locations-description'].includes('GridFS'));
 assert.ok(locale['attachment-repair-locations-description'].includes('\u0431\u0435\u0440\u043a\u0435\u0442\u043c\u04d9\u043b\u04d9\u0440\u043d\u0435 \u04bb\u04d9\u043c \u0430\u0432\u0430\u0442\u0430\u0440\u043b\u0430\u0440\u043d\u044b'));
 assert.ok(locale['move-storage-all'].includes('\u0423\u043a\u0443 \u0440\u04e9\u0445\u0441\u04d9\u0442 \u0438\u0442\u0435\u043b\u0433\u04d9\u043d'));
 assert.ok(locale['default-save-storage-description'].includes('\u042f\u04a3\u0430 \u0439\u04e9\u043a\u043b\u04d9\u043d\u0433\u04d9\u043d'));
 assert.equal(new Set(['attachment-repair-running','attachment-repair-done','attachment-repair-scanned','attachment-repair-repaired','attachment-repair-broken'].map(key=>locale[key])).size,5);
 assert.notEqual(locale['default-save-storage-saved'],locale['default-save-storage-save-failed']);
});

test('Tatar compaction guidance preserves prerequisites and storage identifiers',()=>{
 for(const key of ['stats-collectionfs','stats-mongo-files']) assert.equal(locale[key],english[key]);
 for(const key of ['card-id','attachment-id','board-id','gridfs-file-id','s3-file-id']) assert.ok(locale[key].includes('ID'));
 assert.ok(locale['gridfs-file-id'].includes('GridFS'));assert.ok(locale['s3-file-id'].includes('S3'));
 assert.ok(locale['mongodb-compact-description'].includes('\u0442\u04d9\u043c\u0430\u043c\u043b\u0430\u043d\u0433\u0430\u0447 \u043a\u044b\u043d\u0430'));
 for(const term of ['Compact','oplog','Meteor']) assert.ok(locale['mongodb-compact-warning'].includes(term));
 assert.ok(locale['mongodb-compact-warning'].includes('\u0431\u043b\u043e\u043a\u043b\u0430\u0443\u0447\u044b'));
 assert.ok(locale['mongodb-compact-warning'].includes('\u0442\u04e9\u043f \u0442\u04e9\u0435\u043d \u0433\u0435\u043d\u04d9'));
 assert.notEqual(locale['move-progress-pause'],locale['move-progress-resume']);
 assert.notEqual(locale['mongodb-compact-running'],locale['mongodb-compact-success']);
});

test('Tatar board status keeps time categories and transfer measurements distinct',()=>{
 const timeKeys=['board-status-time-summary','board-status-time-spent-total','board-status-cards-with-time','board-status-overtime-cards','board-status-remaining-time-total'];
 assert.equal(new Set(timeKeys.map(key=>locale[key])).size,timeKeys.length);
 assert.equal(new Set(['uploading','remaining_time','speed','progress'].map(key=>locale[key])).size,4);
 assert.ok(locale['mongodb-compact-error'].endsWith(':'));
 assert.notEqual(locale['mongodb-compact-error'],locale['mongodb-compact-success']);
 assert.notEqual(locale['password-again'],locale['smtp-password']);
 assert.equal(locale.speed,locale.speedReportTitle);
});

test('Tatar upload validation preserves byte units and custom-translation deletion warnings',()=>{
 for(const key of ['max-upload-filesize','max-avatar-filesize']) assert.ok(locale[key].includes('\u0431\u0430\u0439\u0442\u043b\u0430\u0440\u0434\u0430'));
 assert.ok(locale['preview-pdf-not-supported'].includes('PDF'));
 assert.ok(locale['show-week-of-year'].includes('ISO 8601'));
 assert.ok(locale['Mongo_sessions_count'].includes('Mongo'));
 assert.ok(locale['invalid-file'].includes('\u0439\u04e9\u043a\u043b\u04d9\u04af \u044f\u043a\u0438 \u0438\u0441\u0435\u043c\u0435\u043d \u04af\u0437\u0433\u04d9\u0440\u0442\u04af'));
 assert.ok(locale['delete-translation-confirm-popup'].includes('\u041a\u0438\u0440\u0435 \u043a\u0430\u0439\u0442\u0430\u0440\u0443 \u043c\u04e9\u043c\u043a\u0438\u043d \u0442\u04af\u0433\u0435\u043b'));
 assert.equal(locale['minicardDetailsActionsPopup-title'],locale['cardDetailsPopup-title']);
 assert.equal(new Set(['newTranslationPopup-title','editTranslationPopup-title','settingsTranslationPopup-title'].map(key=>locale[key])).size,3);
});

test('Tatar recurrence controls distinguish recurrence from checklist reset',()=>{
 assert.ok(locale['convert-to-markdown'].includes('Markdown'));
 for(const literal of ['.zip','JSON']) assert.ok(locale['import-board-zip'].includes(literal));
 assert.equal(locale['card-recurrence-interval'],locale['cardRecurrenceIntervalPopup-title']);
 assert.notEqual(locale['card-recurrence-interval'],locale['checklist-reset-interval']);
 assert.notEqual(locale['card-recurrence-interval-none'],locale['checklist-reset-interval-none']);
 assert.notEqual(locale.hideCheckedChecklistItems,locale.hideAllChecklistItems);
 assert.notEqual(locale['collapse-checklist'],locale['expand-checklist']);
 for(const period of ['daily','weekly','monthly']) assert.equal(locale['card-recurrence-interval-'+period],locale['checklist-reset-interval-'+period]);
});

test('Tatar support and lockout labels preserve access restrictions and time units',()=>{
 assert.equal(locale['supportPopup-title'],locale.support);
 assert.ok(locale['support-info-only-for-logged-in-users'].includes('\u043a\u0435\u0440\u0433\u04d9\u043d \u043a\u0443\u043b\u043b\u0430\u043d\u0443\u0447\u044b\u043b\u0430\u0440 \u04e9\u0447\u0435\u043d \u0433\u0435\u043d\u04d9'));
 assert.ok(locale['accounts-lockout-known-users'].includes('\u044f\u043b\u0433\u044b\u0448 \u0441\u0435\u0440\u0441\u04af\u0437'));
 assert.ok(locale['accounts-lockout-unknown-users'].includes('\u0431\u0443\u043b\u043c\u0430\u0433\u0430\u043d \u043a\u0443\u043b\u043b\u0430\u043d\u0443\u0447\u044b \u0438\u0441\u0435\u043c\u0435'));
 for(const key of ['accounts-lockout-period','accounts-lockout-failure-window']) assert.ok(locale[key].endsWith('(\u0441\u0435\u043a\u0443\u043d\u0434)'));
 assert.notEqual(locale['accounts-lockout-period'],locale['accounts-lockout-failure-window']);
 assert.notEqual(locale['accounts-lockout-locked-users'],locale['accounts-lockout-no-locked-users']);
});

test('Tatar unlock controls preserve single-user scope and opposite activation actions',()=>{
 assert.notEqual(locale['accounts-lockout-confirm-unlock'],locale['accounts-lockout-confirm-unlock-all']);
 assert.ok(locale['accounts-lockout-confirm-unlock-all'].includes('\u0411\u0430\u0440\u043b\u044b\u043a \u0431\u043b\u043e\u043a\u043b\u0430\u043d\u0433\u0430\u043d'));
 assert.ok(locale['admin-people-user-active'].includes('\u0441\u04af\u043d\u0434\u0435\u0440\u04af \u04e9\u0447\u0435\u043d'));
 assert.ok(locale['admin-people-user-inactive'].includes('\u043a\u0430\u0431\u044b\u0437\u0443 \u04e9\u0447\u0435\u043d'));
 assert.notEqual(locale['admin-people-filter-active'],locale['admin-people-filter-inactive']);
 assert.equal(locale['accounts-lockout-remaining-time'],locale.remaining_time);
 assert.equal(locale['accounts-lockout-status'],locale.status);
});

test('Tatar scheduled jobs distinguish scheduling outcomes and job actions',()=>{
 for(const action of ['archive','backup','cleanup']) assert.notEqual(locale['board-'+action+'-failed'],locale['board-'+action+'-scheduled']);
 assert.equal(new Set(['archive','backup','cleanup'].map(action=>locale['board-'+action+'-scheduled'])).size,3);
 for(const [action,state] of [['delete','deleted'],['pause','paused'],['resume','resumed']]) assert.notEqual(locale['cron-job-'+action+'-failed'],locale['cron-job-'+state]);
 assert.equal(new Set(['deleted','paused','resumed'].map(state=>locale['cron-job-'+state])).size,3);
 assert.notEqual(locale['attachments-path-description'],locale['avatars-path-description']);
 assert.notEqual(locale['add-cron-job'],locale['add-cron-job-placeholder']);
});

test('Tatar migration messages distinguish errors, warnings, retry and resume',()=>{
 for(const pair of [['cron-migration-errors','cron-migration-warnings'],['cron-retry-failed','cron-resume-paused'],['cron-no-failed-migrations','cron-no-paused-migrations'],['cron-migrations-retried','cron-migrations-resumed'],['filesystem-enabled','filesystem-disabled'],['complete','idle']]) assert.notEqual(locale[pair[0]],locale[pair[1]]);
 assert.equal(locale['cron-error-severity'],locale['recovery-severity']);
 assert.equal(locale['cron-error-details'],locale.details);
 assert.notEqual(locale['cron-job-started'],locale['cron-job-start-failed']);
});

test('Tatar cloud migration guidance preserves commands, URLs and storage paths',()=>{
 for(const key of ['azure-blob-storage','azure-blob-storage-description','gcs-storage','gcs-storage-description']) assert.equal(locale[key],english[key]);
 for(const name of ['AWS S3','MinIO','Cloudflare R2','Backblaze B2','Wasabi','DigitalOcean Spaces']) assert.ok(locale['s3-minio-storage-description'].includes(name));
 for(const literal of ['mongodb://127.0.0.1:27018','mongodb://127.0.0.1:27019','WEKAN_FERRETDB_URL','WEKAN_MONGODB_URL','MONGO_URL','snap set wekan database=ferretdb','=mongodb']) assert.ok(locale['database-migration-description'].includes(literal));
 for(const literal of ['MongoDB 3','FerretDB v1 (SQLite)','files/attachments','files/avatars']) assert.ok(locale['sandstorm-migration-description'].includes(literal));
 assert.notEqual(locale['database-migrate-to-ferretdb'],locale['database-migrate-to-mongodb']);
});

test('Tatar Sandstorm cleanup preserves migration prerequisite and irreversible warning',()=>{
 for(const key of ['sandstorm-delete-raw-mongodb-description','sandstorm-delete-raw-mongodb-confirm']) {
  assert.ok(locale[key].includes('MongoDB 3'));
  assert.ok(locale[key].includes('FerretDB'));
  assert.ok(locale[key].includes('\u043a\u0438\u0440\u0435 \u043a\u0430\u0439\u0442\u0430\u0440\u044b\u043f \u0431\u0443\u043b\u043c\u044b\u0439'));
 }
 assert.ok(locale['sandstorm-delete-raw-mongodb-description'].includes('\u0423\u04a3\u044b\u0448\u043b\u044b \u043a\u04af\u0447\u0435\u0440\u04af\u0434\u04d9\u043d \u0441\u043e\u04a3'));
 assert.ok(locale['sandstorm-delete-raw-mongodb-confirm'].includes('\u0438\u043d\u0434\u0435'));
 assert.equal(new Set(['sandstorm-migration-success','sandstorm-migration-failed','sandstorm-migration-pending'].map(key=>locale[key])).size,3);
 assert.equal(locale['sandstorm-storage-item'],locale.storage);
});

test('Tatar loading and rendering guidance preserves configuration and code examples',()=>{
 for(const literal of ['CARDS_LOADING','all/lazy/auto','CARDS_LOADING_LAZY_THRESHOLD']) assert.ok(locale['cards-loading-description'].includes(literal));
 assert.ok(locale['cards-loading-lazy-note'].includes('WIP'));
 for(const literal of ['[label](url)','<a href>']) assert.ok(locale['render-links-as-plain-text-description'].includes(literal));
 for(const literal of ['<!-- -->','JavaScript','markdown','HTML']) assert.ok(locale['always-show-code-as-text-description'].includes(literal));
 assert.equal(new Set(['cards-loading-auto','cards-loading-all','cards-loading-lazy'].map(key=>locale[key])).size,3);
 assert.notEqual(locale['render-links-as-plain-text'],locale['always-show-code-as-text']);
});

test('Tatar anonymization describes account consequences separately from export',()=>{
 for(const key of ['anonymize-import-users-description','anonymize-export-users-description']) for(const literal of ['user1, user2','@username','requested-by','assigned-by']) assert.ok(locale[key].includes(literal));
 const account=locale['anonymize-account-confirm-popup'];
 for(const phrase of ['\u044d\u043b\u0435\u043a\u0442\u0440\u043e\u043d \u043f\u043e\u0447\u0442\u0430 \u0430\u0434\u0440\u0435\u0441\u044b\u043d','\u043a\u0435\u0440\u04af\u043d\u0435 \u0441\u04af\u043d\u0434\u0435\u0440\u04d9','\u0442\u0430\u0440\u0438\u0445\u044b\u043d \u0441\u0430\u043a\u043b\u044b\u0439','\u043a\u0438\u0440\u0435 \u043a\u0430\u0439\u0442\u0430\u0440\u044b\u043f \u0431\u0443\u043b\u043c\u044b\u0439']) assert.ok(account.includes(phrase));
 assert.notEqual(account,locale['anonymize-export-users-description']);
 for(const key of ['disable-all-import-description','disable-all-export-description']) for(const name of ['NextCloud Deck','OpenProject','GitHub','GitLab','Gitea','Forgejo']) assert.ok(locale[key].includes(name));
 assert.ok(locale['disable-import-avatars-description'].includes('OIDC/OAuth2'));
});

test('Tatar notification and backup settings preserve recording and organization boundaries',()=>{
 assert.ok(locale['disable-activities-description'].includes('\u0442\u0430\u0440\u0438\u0445\u044b \u0441\u0430\u043a\u043b\u0430\u043d\u043c\u044b\u0439'));
 assert.ok(locale['disable-notifications-description'].includes('\u0413\u0430\u043c\u04d9\u043b\u043b\u04d9\u0440 \u04bb\u0430\u043c\u0430\u043d \u0442\u0435\u0440\u043a\u04d9\u043b\u04d9 \u0430\u043b\u0430'));
 assert.ok(locale['disable-watch-description'].includes('\u043a\u0438\u0440\u0435 \u043a\u0430\u0433\u044b\u043b\u0430'));
 assert.ok(locale['backup-scope-description'].includes('\u041a\u0443\u043b\u043b\u0430\u043d\u0443\u0447\u044b \u0445\u0438\u0441\u0430\u043f\u043b\u0430\u0440\u044b \u04bb\u04d9\u043c \u0441\u0435\u0440\u0432\u0435\u0440 \u043a\u04e9\u0439\u043b\u04d9\u04af\u043b\u04d9\u0440\u0435 \u043a\u0435\u0440\u043c\u0438'));
 assert.ok(locale['backup-scope-description'].includes('\u0448\u0443\u043b \u043e\u0435\u0448\u043c\u0430\u0433\u0430 \u043a\u0430\u0440\u0430\u0433\u0430\u043d \u0442\u0430\u043a\u0442\u0430\u043b\u0430\u0440\u0433\u0430 \u0433\u044b\u043d\u0430'));
 assert.equal(locale['backup-frequency-daily'],locale['checklist-reset-interval-daily']);
 assert.notEqual(locale['backup-frequency-off'],locale['backup-frequency-daily']);
});

test('Tatar backup scheduling preserves time format and distinct restore modes',()=>{
 assert.ok(locale['backup-time'].includes('HH:MM'));
 assert.ok(locale['backup-day-of-month'].includes('1-28'));
 for(const period of ['weekly','monthly']) assert.equal(locale['backup-frequency-'+period],locale['checklist-reset-interval-'+period]);
 assert.notEqual(locale['backup-restore-add-missing'],locale['backup-restore-replace-all']);
 assert.ok(locale['gcs-project-id'].includes('ID'));
 assert.notEqual(locale['backup-day-of-week'],locale['backup-day-of-month']);
});

test('Tatar cloud credential guidance preserves external UI labels and JSON fields',()=>{
 for(const literal of ['client_email','Storage Object Admin','New principals','Grant access']) assert.ok(locale['gcs-permissions-note'].includes(literal));
 for(const literal of ['IAM','Access key ID','Application running outside AWS']) assert.ok(locale['s3-access-key-menu-path'].includes(literal));
 for(const literal of ['Secret access key','.csv']) assert.ok(locale['s3-secret-key-menu-path'].includes(literal));
 for(const key of ['azure-account-key-menu-path','azure-connection-string-menu-path']) assert.ok(locale[key].includes('key1'));
 for(const literal of ['IAM & Admin','Service accounts','Create new key','JSON']) assert.ok(locale['gcs-credentials-menu-path'].includes(literal));
 for(const key of keys.filter(key=>key.endsWith('-menu-path'))) assert.equal((locale[key].match(/→/g)||[]).length,(english[key].match(/→/g)||[]).length,key);
});

test('Tatar cloud status preserves provider names and pause versus stop',()=>{
 for(const key of ['move-storage-azure','move-storage-gcs']) assert.equal(locale[key],english[key]);
 for(const key of ['gridfs-enabled','gridfs-disabled','gridfs-enabled-description']) assert.ok(locale[key].includes('GridFS'));
 assert.ok(locale['s3-disabled'].includes('S3/MinIO'));
 for(const pair of [['pause','stop'],['migration-pausing','migration-stopping'],['cloud-secret-set','cloud-secret-none'],['cloud-connection-success','cloud-connection-failed'],['cloud-settings-saved','cloud-settings-save-failed']]) assert.notEqual(locale[pair[0]],locale[pair[1]]);
 assert.equal(locale.pause,locale['move-progress-pause']);
});

test('Tatar migration and S3 controls preserve storage identifiers and outcomes',()=>{
 for(const key of ['s3-access-key','s3-access-key-description','s3-access-key-placeholder','s3-bucket','s3-bucket-description','s3-connection-failed','s3-connection-success','s3-enabled','s3-enabled-description','s3-endpoint']) assert.ok(locale[key].includes('S3'));
 assert.ok(locale['s3-enabled-description'].includes('AWS'));assert.ok(locale['s3-enabled-description'].includes('MinIO'));
 assert.ok(locale['gridfs-move-collectionfs-note'].includes('CollectionFS'));
 assert.ok(locale['mongodb-gridfs-storage'].includes('MongoDB GridFS'));
 for(const pair of [['migration-started','migration-start-failed'],['migration-stopped','migration-stop-failed'],['migration-paused','migration-stopped'],['s3-connection-success','s3-connection-failed']]) assert.notEqual(locale[pair[0]],locale[pair[1]]);
});

test('Tatar S3 connection settings preserve usable examples and distinct operations',()=>{
 for(const literal of ['s3.amazonaws.com','minio.example.com']) assert.ok(locale['s3-endpoint-description'].includes(literal));
 for(const literal of ['AWS','S3','us-east-1']) assert.ok(locale['s3-region-description'].includes(literal));
 assert.ok(locale['s3-ssl-enabled-description'].includes('SSL/TLS'));
 assert.ok(locale['s3-minio-storage'].includes('S3/MinIO'));
 assert.notEqual(locale['s3-settings-save-failed'],locale['s3-settings-saved']);
 assert.notEqual(locale['start-all-migrations'],locale['stop-all-migrations']);
 assert.equal(new Set(['schedule-board-archive','schedule-board-backup','schedule-board-cleanup'].map(key=>locale[key])).size,3);
});

test('Tatar board recovery preserves identifiers, restrictions and confirmation warnings',()=>{
 for(const key of ['restore-lost-cards-migration-description','restore-all-archived-migration-description','run-restore-lost-cards-migration-confirm']) {
  for(const literal of ['swimlaneId','listId']) assert.ok(locale[key].includes(literal),key);
 }
 assert.ok(locale['delete-duplicate-empty-lists-migration-description'].includes('\u041a\u0430\u0440\u0442\u043e\u0447\u043a\u0430\u043b\u0430\u0440\u044b \u0431\u0443\u043b\u043c\u0430\u0433\u0430\u043d \u04ba\u04d8\u041c'));
 assert.ok(locale['delete-duplicate-empty-lists-migration-description'].includes('\u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430\u043b\u0430\u0440\u044b \u0431\u0443\u043b\u0433\u0430\u043d \u0431\u0430\u0448\u043a\u0430 \u0438\u0441\u0435\u043c\u043b\u0435\u043a'));
 assert.ok(locale['run-restore-lost-cards-migration-confirm'].includes('\u0430\u0440\u0445\u0438\u0432\u043b\u0430\u043d\u043c\u0430\u0433\u0430\u043d \u044d\u043b\u0435\u043c\u0435\u043d\u0442\u043b\u0430\u0440\u0433\u0430 \u0433\u044b\u043d\u0430'));
 assert.ok(locale['run-restore-all-archived-migration-confirm'].includes('\u043a\u0438\u0440\u0435 \u043a\u0430\u0439\u0442\u0430\u0440\u0443 \u0497\u0438\u04a3\u0435\u043b \u0442\u04af\u0433\u0435\u043b'));
 assert.ok(locale['migrations-admin-only'].includes('\u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440\u043b\u0430\u0440\u044b \u0433\u044b\u043d\u0430'));
 for(const key of ['fix-avatar-urls-migration','fix-all-file-urls-migration']) assert.ok(locale[key].includes('URL'));
 assert.notEqual(locale['migration-successful'],locale['migration-failed']);
 assert.ok(locale['restore-lost-cards-migration-description'].includes(locale['lost-cards']));
});

test('Tatar migration progress retains recovery targets and continued use notice',()=>{
 assert.equal(locale['step-fix-avatar-urls'],locale['fix-avatar-urls-migration']);
 assert.equal(locale['step-delete-duplicate-empty-lists'],locale['delete-duplicate-empty-lists-migration']);
 assert.equal(locale.completed,locale['migration-complete']);
 assert.ok(locale['step-ensure-lost-cards-swimlane'].includes(locale['lost-cards']));
 for(const key of ['step-fix-avatar-urls','step-fix-attachment-urls','step-fix-file-urls']) assert.ok(locale[key].includes('URL'));
 assert.ok(locale['step-fix-missing-ids'].includes('ID'));
 assert.ok(locale['conversion-info-text'].includes('\u0431\u0435\u0440 \u0442\u0430\u043f\u043a\u044b\u0440'));
 assert.ok(locale['conversion-info-text'].includes('\u0433\u0430\u0434\u04d9\u0442\u0442\u04d9\u0433\u0435\u0447\u04d9 \u043a\u0443\u043b\u043b\u0430\u043d\u0443\u043d\u044b \u0434\u04d9\u0432\u0430\u043c \u0438\u0442\u04d9 \u0430\u043b\u0430\u0441\u044b\u0437'));
 assert.equal(new Set(['step-restore-lists','step-restore-cards','step-restore-swimlanes'].map(key=>locale[key])).size,3);
});

test('Tatar job monitoring preserves intervals, resource identifiers and limits',()=>{
 assert.equal(locale['gridfs-storage'],english['gridfs-storage']);
 for(const key of ['cpu-cores','cpu-usage','migration-cpu-threshold']) assert.ok(locale[key].includes('CPU'));
 assert.ok(locale['migration-cpu-threshold'].includes('(%)'));
 assert.ok(locale['migration-batch-size-description'].includes('(1-100)'));
 for(const key of ['gridfs-attachments','gridfs-size','migrate-all-to-gridfs']) assert.ok(locale[key].includes('GridFS'));
 assert.ok(locale['migrate-all-to-s3'].includes('S3'));
 for(const [key,n] of [['every-1-day',1],['every-1-hour',1],['every-1-minute',1],['every-10-minutes',10],['every-30-minutes',30],['every-5-minutes',5],['every-6-hours',6]]) assert.ok(locale[key].includes(' '+n+' '),key);
 assert.ok(locale['every-1-day'].includes('\u043a\u04e9\u043d'));
 for(const key of ['every-1-hour','every-6-hours']) assert.ok(locale[key].includes('\u0441\u04d9\u0433\u0430\u0442\u044c'));
 for(const key of ['every-1-minute','every-5-minutes','every-10-minutes','every-30-minutes']) assert.ok(locale[key].includes('\u043c\u0438\u043d\u0443\u0442'));
 assert.notEqual(locale['hide-list-on-minicard'],locale['card-show-lists-on-minicard']);
});

test('Tatar migration thresholds retain units, ranges and background operation notices',()=>{
 assert.equal(locale['s3-storage'],english['s3-storage']);
 assert.equal(locale['overall-progress'],locale['migration-progress-overall']);
 for(const literal of ['CPU','10-90']) assert.ok(locale['migration-cpu-threshold-description'].includes(literal));
 assert.ok(locale['migration-delay-ms-description'].includes('100-10000'));
 assert.ok(locale['migration-delay-ms-description'].includes('\u043c\u0438\u043b\u043b\u0438\u0441\u0435\u043a\u0443\u043d\u0434\u043b\u0430\u0440\u0434\u0430'));
 for(const key of ['migration-info-text','migration-warning-text']) assert.ok(locale[key].includes('\u0430\u0440\u0442\u043a\u044b \u043f\u043b\u0430\u043d\u0434\u0430 \u0434\u04d9\u0432\u0430\u043c'));
 assert.ok(locale['migration-warning-text'].includes('\u0431\u0440\u0430\u0443\u0437\u0435\u0440\u043d\u044b \u044f\u043f\u043c\u0430\u0433\u044b\u0437'));
 assert.notEqual(locale['pause-migration'],locale['resume-migration']);
 assert.notEqual(locale['migration-resume-failed'],locale['migration-resumed']);
 for(const key of ['s3-attachments','s3-size']) assert.ok(locale[key].includes('S3'));
 assert.notEqual(locale['show-list-on-minicard'],locale['hide-list-on-minicard']);
});

test('Tatar repository access preserves technical labels and temporary lockout',()=>{
 assert.equal(locale.cron,english.cron);
 assert.equal(locale['current-step'],locale['migration-progress-current-step']);
 for(const key of ['otp','otp-required']) assert.ok(locale[key].includes('OTP'));
 assert.ok(locale['api-endpoints'].includes('API'));
 assert.ok(locale['size-bytes'].includes('\u0431\u0430\u0439\u0442'));
 assert.ok(locale['account-locked'].includes('\u0432\u0430\u043a\u044b\u0442\u043b\u044b\u0447\u0430 \u0431\u0438\u043a\u043b\u04d9\u043d\u0434\u0435'));
 assert.ok(locale['account-locked'].includes('\u0421\u043e\u04a3\u0440\u0430\u043a \u043a\u0430\u0431\u0430\u0442\u043b\u0430\u043f \u043a\u0430\u0440\u0430\u0433\u044b\u0437'));
 assert.notEqual(locale['stop-migration'],locale['pause-migration']);
 assert.notEqual(locale['invalid-credentials'],locale['username-password-required']);
 assert.ok(locale['upload-repository'].includes('\u0439\u04e9\u043a\u043b\u04d9\u04af/\u044f\u04a3\u0430\u0440\u0442\u0443'));
});

test('Tatar repair status preserves counts, failure conditions and acknowledgement label',()=>{
 assert.ok(locale['username-too-short'].includes('3'));
 assert.ok(locale['problems-summary-help'].includes('\u00ab'+locale.acknowledge+'\u00bb'));
 assert.ok(locale['problems-summary-help'].includes('\u043d\u0443\u043b\u044c\u0433\u04d9'));
 for(const key of ['problems-in-progress-help','cpu-usage-current']) assert.ok(locale[key].includes('CPU'));
 assert.deepEqual(translationTokens(locale['repair-broken-cards-done-unfixable']),translationTokens(english['repair-broken-cards-done-unfixable']));
 assert.ok(locale['repair-broken-cards-done-unfixable'].includes('\u0442\u0430\u043a\u0442\u0430\u0441\u044b \u044e\u043a'));
 assert.ok(locale['repair-broken-cards-done-unfixable'].includes('\u0442\u04e9\u0437\u04d9\u0442\u0435\u043f \u0431\u0443\u043b\u043c\u044b\u0439'));
 assert.notEqual(locale['account-created'],locale['account-creation-failed']);
 assert.notEqual(locale.login,locale.logout);
});

test('Tatar event and import labels preserve addresses, file formats and search syntax',()=>{
 for(const [key,literal] of [['event-ip','IP'],['event-ipv4','IPv4'],['event-ipv6','IPv6']]) assert.ok(locale[key].includes(literal));
 for(const key of ['import-here-instruction','import-wekan-file']) for(const ext of ['.json','.zip']) assert.ok(locale[key].includes(ext));
 for(const literal of ['Trello','Jira','WeKan','CSV','Excel']) assert.ok(locale['import-board-source'].includes(literal));
 assert.ok(locale['globalSearch-instructions-operator-number'].includes('`__operator_number__:<number>`'));
 assert.ok(locale['globalSearch-instructions-operator-number'].includes('*<number>*'));
 assert.match(locale['operator-number'],/^\p{L}+$/u);
 assert.ok(locale['import-parts-instruction'].includes('\u04e9\u043b\u0435\u0448\u043b\u04d9\u0440 \u0433\u0435\u043d\u04d9'));
 assert.ok(locale['import-parts-instruction'].includes('\u0448\u0443\u043b \u0443\u043a \u0441\u0430\u0439\u043b\u0430\u0443'));
 assert.notEqual(locale['import-scoped-failed'],locale['import-done']);
});

test('Tatar flow labels retain statistical distinctions and WIP group meaning',()=>{
 assert.ok(locale['board-view-process-behavior'].includes('XmR'));
 assert.ok(locale['flow-p85'].includes('85'));
 for(const key of ['flow-cycle-days','flow-age-days','flow-p85']) assert.ok(locale[key].includes('\u043a\u04e9\u043d\u043d\u04d9\u0440'));
 assert.ok(locale['flow-capacity'].includes('\u041a\u0438\u043c\u0435\u043d\u0434\u04d9'));
 for(const pair of [['flow-finish-date','flow-target-date'],['flow-mean','flow-moving-range'],['flow-moving-range','flow-mr-mean'],['flow-blocker','flow-blocked-days']]) assert.notEqual(locale[pair[0]],locale[pair[1]]);
 assert.ok(locale['wip-limit-group-name-placeholder'].includes('\u0422\u04e9\u0440\u043a\u0435\u043c'));
 assert.ok(locale['flow-error'].includes('\u043a\u0430\u0431\u0430\u0442\u043b\u0430\u043f \u043a\u0430\u0440\u0430\u0433\u044b\u0437'));
});

test('Tatar flow explanations preserve forecast limits and time correction caveats',()=>{
 for(const literal of ['2 000','UTC','3 650','\u0433\u0430\u0440\u0430\u043d\u0442\u0438\u044f \u0442\u04af\u0433\u0435\u043b','\u0444\u0430\u0440\u0430\u0437 \u0434\u0430 \u044e\u043a']) assert.ok(locale['flow-note-monteCarlo'].includes(literal));
 for(const key of ['flow-note-processBehavior','flow-note-sizeCycleTime']) for(const term of ['\u0442\u04e9\u0437\u04af \u0434\u0430\u0442\u0430\u0441\u044b','\u0430\u0440\u0445\u0438\u0432\u043b\u0430\u0443 \u0434\u0430\u0442\u0430\u0441\u044b']) assert.ok(locale[key].includes(term));
 assert.ok(locale['flow-note-processBehavior'].includes('XmR'));
 assert.ok(locale['flow-note-sizeCycleTime'].includes('Planning Poker'));
 assert.ok(locale['flow-note-agingWip'].includes('85'));
 assert.ok(locale['flow-note-blockerAnalysis'].includes('\u0430\u0435\u0440\u044b\u043c \u0438\u0441\u04d9\u043f\u043b\u04d9\u043d\u04d9'));
 assert.ok(locale['time-adjustment-note'].includes('\u0430\u0435\u0440\u044b\u043c \u044d\u0448 \u0441\u0435\u0430\u043d\u0441\u043b\u0430\u0440\u044b \u0442\u04af\u0433\u0435\u043b'));
 assert.ok(locale['time-adjustment-note'].includes('\u0422\u0438\u0441\u043a\u04d9\u0440\u0435 \u043a\u044b\u0439\u043c\u043c\u04d9\u0442\u043b\u04d9\u0440'));
 assert.ok(locale['move-reason'].includes('\u043c\u04d9\u0497\u0431\u04af\u0440\u0438 \u0442\u04af\u0433\u0435\u043b'));
});

test('Tatar ZenKit import instruction preserves the JSON field example',()=>{
 const example=english['import-board-instruction-zenkit'].match(/\{.*\}/)[0];
 assert.ok(locale['import-board-instruction-zenkit'].includes(example));
 assert.ok(locale['import-board-instruction-zenkit'].includes('ZenKit'));
});
