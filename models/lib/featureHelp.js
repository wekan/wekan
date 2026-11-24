// The ? button of every feature place (docs/Features/Help-Button.md).
//
// One help point per place in the interface. Each has two translated texts,
// "What is it?" and "How it works?", rewritten for the person using WeKan from
// the "What it is" and "How it works in WeKan" parts of that feature's page
// under docs/Features. The texts are plain prose: no links, no addresses, no
// file names. The links stay in the English docs in the WeKan repository.
//
// Pure data and pure functions, so tests/featureHelp.test.cjs can read it in
// Node without Meteor. The templates call `+featureHelp(id='<id>')`, or reach
// an id through one of the maps below: the Board View menu, the board sidebar's
// views, the popups, the card's sections and the Admin Panel panes, which each
// have ONE shared header that shows the ? of whatever is open in it.

// id -> the docs page the texts come from. The translation keys follow from
// the id: help-<id>-what-it-is-description and help-<id>-how-it-works-description.
const FEATURES = {
  // Board views - the ? beside the Board View menu, for the view that is on.
  'board-view-swimlanes': 'docs/Features/Swimlanes/README.md',
  'board-view-lists': 'docs/Features/Lists/README.md',
  'board-view-table': 'docs/Features/Board-Header/Board-Views/Table-View.md',
  'board-view-cal': 'docs/Features/Board-Header/Board-Views/Calendar.md',
  'board-view-calendar-mode': 'docs/Features/Board-Header/Board-Views/Calendar-Mode.md',
  'board-view-multiboard-cal': 'docs/Features/Board-Header/Board-Views/Multi-Board-Calendar.md',
  'board-view-time': 'docs/Features/Board-Header/Board-Views/Time-View.md',
  'board-view-timeline': 'docs/Features/Board-Header/Board-Views/Timeline-View.md',
  'board-view-stats': 'docs/Features/Board-Header/Board-Views/Status.md',
  'board-view-group-by-assignee': 'docs/Features/Board-Header/Board-Views/Group-By-Assignee.md',
  'board-view-gantt': 'docs/Features/Board-Header/Board-Views/Gantt.md',
  'board-view-product-backlog': 'docs/Features/Board-Header/Board-Views/Scrum/Product-Backlog.md',
  'board-view-sprints': 'docs/Features/Board-Header/Board-Views/Scrum/Sprints.md',
  'board-view-sprint-report': 'docs/Features/Board-Header/Board-Views/Scrum/Sprint-Reports.md',
  'board-view-burndown': 'docs/Features/Board-Header/Board-Views/Charts/Burndown-and-Velocity-Chart.md',
  'board-view-roadmap': 'docs/Features/Board-Header/Board-Views/Roadmap.md',
  'board-view-dashboard': 'docs/Features/Board-Header/Board-Views/Charts/Board-Report-Charts.md',
  'board-view-bigboard': 'docs/Features/Board-Header/Board-Views/Bigboard.md',
  'board-view-flow': 'docs/Features/Board-Header/Board-Views/Charts/Flow-Analytics.md',
  'board-view-reports': 'docs/Features/Board-Header/Board-Views/Charts/Board-Reports.md',
  'board-view-map': 'docs/Features/Board-Header/Board-Views/Map-View.md',
  'board-view-email': 'docs/Features/Board-Header/Board-Views/Email-View.md',
  'board-view-chat': 'docs/Features/Board-Header/Board-Views/Chat-View.md',
  'board-view-version-control': 'docs/Features/Board-Header/Board-Views/Version-Control-View.md',
  'board-view-column-sets': 'docs/Features/Board-Header/Board-Views/Column-Sets.md',
  'board-view-website': 'docs/Features/Board-Sidebar/Board-Settings/Import-Export/Website/README.md',
  'board-view-shop': 'docs/Features/Board-Header/Board-Views/Shop.md',

  // The board's right sidebar - the ? in the heading of the view that is open.
  'sidebar-filter': 'docs/Features/Board-Sidebar/Filter/README.md',
  'sidebar-search': 'docs/Features/Board-Header/Search.md',
  'sidebar-multiselection': 'docs/Features/Multi-Selection.md',
  'sidebar-custom-fields': 'docs/Features/Cards/CustomFields/README.md',
  'sidebar-archives': 'docs/Features/Board-Sidebar/Archive/Archive-and-Delete.md',
  'sidebar-original-positions': 'docs/Features/Original-Positions/README.md',
  'sidebar-summary': 'docs/Features/Summary/README.md',
  'sidebar-since-last-visit': 'docs/Features/Since-Last-Visit/README.md',

  // The board header's popups.
  'board-visibility': 'docs/Features/Board-Header/Visibility.md',
  'board-watch': 'docs/Features/Board-Header/Watch.md',
  'board-sort-cards': 'docs/Features/Board-Header/Sort-Cards.md',

  // Board Settings - the board's hamburger menu and the popups it opens.
  'board-settings': 'docs/Features/Board-Sidebar/Board-Settings/README.md',
  'board-settings-color': 'docs/Features/Board-Sidebar/Board-Settings/Change-Color.md',
  'board-settings-announcement': 'docs/Features/Board-Sidebar/Board-Settings/Board-Announcement.md',
  'board-settings-background': 'docs/Features/Board-Sidebar/Board-Settings/Background-Image.md',
  'board-settings-date': 'docs/Features/Board-Sidebar/Board-Settings/Date.md',
  'board-settings-all-boards': 'docs/Features/Board-Sidebar/Board-Settings/All-Boards-Settings.md',
  'board-settings-board-view': 'docs/Features/Board-Sidebar/Board-Settings/Board-View.md',
  'board-settings-swimlane': 'docs/Features/Board-Sidebar/Board-Settings/Swimlane.md',
  'board-settings-list': 'docs/Features/Board-Sidebar/Board-Settings/List.md',
  'board-settings-shop': 'docs/Features/Board-Sidebar/Board-Settings/Shop.md',
  'board-settings-card': 'docs/Features/Board-Sidebar/Board-Settings/Card.md',
  'board-settings-import-export': 'docs/Features/Board-Sidebar/Board-Settings/Import-Export/README.md',
  'board-settings-notifications': 'docs/Features/Board-Sidebar/Board-Settings/Notifications.md',
  'board-settings-webhooks': 'docs/Features/Board-Sidebar/Board-Settings/Outgoing-Webhooks/Webhook-data.md',
  'board-settings-scrum-meetings': 'docs/Features/Board-Sidebar/Board-Settings/Scrum-Meetings.md',
  'board-settings-wip-limit-groups': 'docs/Features/Lists/WipLimit/WIP-Limit-Groups.md',
  'board-settings-subtasks': 'docs/Features/Cards/Subtasks.md',
  'rules': 'docs/Features/Rules/Rules/README.md',

  // Member Settings - the user menu and the popups it opens.
  'member-settings': 'docs/Features/Member-Settings/README.md',
  'member-edit-profile': 'docs/Features/Member-Settings/Edit-Profile.md',
  'member-change-settings': 'docs/Features/Member-Settings/Change-Settings.md',
  'member-change-color': 'docs/Features/Theme/Change-Color.md',
  'member-change-font': 'docs/Features/Member-Settings/Change-Font.md',
  'member-change-avatar': 'docs/Features/Member-Settings/Change-Avatar.md',
  'member-change-password': 'docs/Features/Member-Settings/Change-Password.md',
  'member-passkeys': 'docs/Features/Member-Settings/Passkeys.md',
  'member-sqrl': 'docs/Features/Member-Settings/SQRL.md',
  'member-two-factor': 'docs/Features/Login-Page/Two-Factor-Authentication.md',
  'member-hidden-boards': 'docs/Features/Member-Settings/Hidden-Boards.md',
  'member-change-language': 'docs/Features/Member-Settings/Change-Language.md',
  'member-invite-people': 'docs/Features/Member-Settings/Invite-People.md',
  'member-date': 'docs/Features/Member-Settings/Date/README.md',
  'bookmarks': 'docs/Features/Pages/Starred.md',

  // The card - its sections, and the popups opened from it.
  'card-similar-cards': 'docs/Features/Cards/Similar-Cards.md',
  'card-activities': 'docs/Features/Board-Header/Board-Views/Activity-Rendering.md',
  'card-labels': 'docs/Features/Board-Sidebar/Labels/Labels-Milestone-Due-Date.md',
  'card-dates': 'docs/Features/Cards/Dates/Due-Date.md',
  'card-members': 'docs/Features/Cards/Requested-Assigned-By.md',
  'card-fields': 'docs/Features/Cards/Card-Fields.md',
  'card-time': 'docs/Features/Cards/Time-Tracking.md',
  'card-custom-fields': 'docs/Features/Cards/CustomFields/README.md',
  'card-planning-poker': 'docs/Features/Cards/Planning-Poker.md',
  'card-scrum': 'docs/Features/Cards/Scrum.md',
  'card-description': 'docs/Features/Editor/Markdown-Editor.md',
  'card-checklists': 'docs/Features/Cards/Checklists.md',
  'card-subtasks': 'docs/Features/Cards/Subtasks.md',
  'card-attachments': 'docs/Features/Cards/Attachments/README.md',
  'card-comments': 'docs/Features/Cards/Comment-Replies-And-Editing-Restriction.md',
  'card-stickers': 'docs/Features/Cards/Stickers/README.md',
  'card-locations': 'docs/Features/Cards/Locations/README.md',
  'card-dependencies': 'docs/Features/Editor/RedStrings/README.md',
  'card-action-items': 'docs/Features/Cards/Action-Items.md',
  'card-history': 'docs/Features/History/README.md',
  'card-qr-code': 'docs/Features/Cards/QR-Code.md',
  'card-move': 'docs/Features/Cards/Move-Card.md',
  'card-copy': 'docs/Features/Cards/Copy-Card.md',
  'card-recurrence': 'docs/Features/Cards/Card-Recurrence.md',
  'card-copy-many': 'docs/Features/Cards/Copy-Template-To-Many-Cards.md',
  'card-color': 'docs/Features/Cards/Set-Color.md',
  'card-drawing': 'docs/Features/Cards/Drawing.md',
  'card-more': 'docs/Features/Cards/More.md',
  'card-create-board': 'docs/Features/Cards/Create-Board-From-Card.md',
  'card-link-to-board': 'docs/Features/Cards/Link-To-Board.md',
  'card-actions': 'docs/Features/Cards/README.md',

  // Admin Panel - the ? beside the open pane's title.
  'admin-version': 'docs/Features/Admin-Panel/Settings/Version.md',
  'admin-appearance': 'docs/Features/Admin-Panel/Settings/Appearance.md',
  'admin-features': 'docs/Features/Admin-Panel/Settings/Features.md',
  'admin-feature-profiles': 'docs/Features/Admin-Panel/Settings/Feature-Profiles.md',
  'admin-security': 'docs/Features/Admin-Panel/Settings/Security.md',
  'admin-activities': 'docs/Features/Admin-Panel/Settings/Activities-and-Notifications.md',
  'admin-delete': 'docs/Features/Admin-Panel/Settings/Delete.md',
  'admin-announcement': 'docs/Features/Admin-Panel/Settings/Announcement.md',
  'admin-accessibility': 'docs/Features/Accessibility/Admin-Panel-Settings.md',
  'admin-translation': 'docs/Features/Admin-Panel/Settings/Translation.md',
  'admin-pwa': 'docs/Features/Admin-Panel/Settings/PWA.md',
  'admin-global-webhooks': 'docs/Features/Admin-Panel/Settings/Global-Webhooks.md',
  'admin-shared-labels': 'docs/Features/Admin-Panel/Settings/Shared-Labels.md',
  'admin-email': 'docs/Features/Admin-Panel/People/E-mail.md',
  'admin-notifications': 'docs/Features/Admin-Panel/People/Notifications.md',
  'admin-domains': 'docs/Features/Admin-Panel/People/Domains.md',
  'admin-organizations': 'docs/Features/Admin-Panel/People/Organizations.md',
  'admin-teams': 'docs/Features/Admin-Panel/People/Teams.md',
  'admin-people': 'docs/Features/Admin-Panel/People/README.md',
  'admin-locked-users': 'docs/Features/Admin-Panel/People/Locked-Users.md',
  'admin-audit-log': 'docs/Features/Admin-Panel/People/Audit-Log.md',
  'admin-roles': 'docs/Features/Admin-Panel/People/Roles.md',
  'admin-shared-templates': 'docs/Features/Admin-Panel/People/Shared-Templates.md',
  'admin-login': 'docs/Features/Admin-Panel/People/Login.md',
  'admin-saml': 'docs/Features/Login-Page/SAML.md',
  'admin-ldap': 'docs/Features/Login-Page/LDAP.md',
  'admin-oauth2': 'docs/Features/Login-Page/OAuth2.md',
  'admin-cas': 'docs/Features/Login-Page/CAS.md',
  'admin-header-login': 'docs/Features/Login-Page/Header-Login.md',
  'admin-oauth-providers': 'docs/Features/Login-Page/OAuth-Providers.md',
  'admin-passwordless': 'docs/Features/Login-Page/Passwordless.md',
  'admin-backup': 'docs/Features/Admin-Panel/Attachments/Backup.md',
  'admin-attachments': 'docs/Features/Admin-Panel/Attachments/README.md',
  'admin-problems-summary': 'docs/Features/Admin-Panel/Problems/Summary.md',
  'admin-problems-security': 'docs/Features/Admin-Panel/Problems/Security-Report.md',
  'admin-problems-impersonation': 'docs/Features/Admin-Panel/Problems/Impersonation-Report.md',
  'admin-problems-password-length': 'docs/Features/Admin-Panel/Problems/Password-length.md',
  'admin-problems-performance': 'docs/Features/Admin-Panel/Problems/Performance.md',
  'admin-problems-speed': 'docs/Features/Admin-Panel/Problems/Speed.md',
  'admin-problems-tests': 'docs/Features/Admin-Panel/Problems/Tests.md',
  'admin-problems-cpu': 'docs/Features/Admin-Panel/Problems/CPU-usage.md',
  'admin-problems-ram': 'docs/Features/Admin-Panel/Problems/RAM-usage.md',
  'admin-problems-disk': 'docs/Features/Admin-Panel/Problems/Disk-usage.md',
  'admin-problems-instrumentation': 'docs/Features/Admin-Panel/Problems/Instrumentation.md',
  'admin-problems-broken-cards': 'docs/Features/Admin-Panel/Problems/Broken-Cards.md',
  'admin-problems-files': 'docs/Features/Admin-Panel/Problems/File-status.md',
  'admin-problems-rules': 'docs/Features/Admin-Panel/Problems/Rules-Report.md',
  'admin-problems-webhooks': 'docs/Features/Admin-Panel/Problems/Webhooks.md',
  'admin-problems-boards': 'docs/Features/Admin-Panel/Problems/Boards-Report.md',
  'admin-problems-cards': 'docs/Features/Admin-Panel/Problems/Cards-Report.md',
  'admin-problems-recovery': 'docs/Features/Admin-Panel/Problems/Recovery.md',
  'admin-problems-offices': 'docs/Features/Admin-Panel/Problems/Offices.md',
  'admin-problems-api': 'docs/Features/Admin-Panel/Problems/API.md',
  'admin-problems-database': 'docs/Features/Admin-Panel/Problems/Database-problems.md',
  'admin-problems-integrity': 'docs/Features/Admin-Panel/Problems/Filesystem-integrity.md',
  'admin-cloud': 'docs/Features/Admin-Panel/Cloud-Panel.md',

  // Pages of their own.
  'all-boards': 'docs/Features/All-Boards/README.md',
  'workload': 'docs/Features/Workload/README.md',
  'billing': 'docs/Features/Billing/README.md',
};

// The Board View menu: a view -> its help. Views drawn from the same page of
// the docs share one help, because one text explains all of them.
const FLOW_VIEWS = [
  'board-view-cumulative-flow', 'board-view-control-chart', 'board-view-cycle-time',
  'board-view-flow-efficiency', 'board-view-lead-time', 'board-view-throughput-histogram',
  'board-view-wip-run', 'board-view-aging-wip', 'board-view-blocker-analysis',
  'board-view-monte-carlo', 'board-view-process-behavior', 'board-view-size-cycle-time',
];
const REPORT_VIEWS = [
  'board-view-created-resolved', 'board-view-net-flow', 'board-view-time-in-list',
  'board-view-average-age', 'board-view-throughput-run', 'board-view-due-date-performance',
];
const CHART_VIEWS = [
  'board-view-dashboard', 'board-view-pulse', 'board-view-workload',
  'board-view-distribution', 'board-view-dependency-map', 'board-view-activity-heatmap',
];
const SCRUM_CHART_VIEWS = [
  'board-view-burndown', 'board-view-burnup', 'board-view-velocity',
  'board-view-release-burndown', 'board-view-epic-progress',
];
const BOARD_VIEW_HELP = {
  'board-view-swimlanes': 'board-view-swimlanes',
  'board-view-lists': 'board-view-lists',
  'board-view-table': 'board-view-table',
  'board-view-cal': 'board-view-cal',
  'board-view-calendar-mode': 'board-view-calendar-mode',
  'board-view-multiboard-cal': 'board-view-multiboard-cal',
  'board-view-time': 'board-view-time',
  'board-view-timeline': 'board-view-timeline',
  'board-view-stats': 'board-view-stats',
  'board-view-group-by-assignee': 'board-view-group-by-assignee',
  'board-view-gantt': 'board-view-gantt',
  'board-view-gantt-frappe': 'board-view-gantt',
  'board-view-gantt-dhtmlx': 'board-view-gantt',
  'board-view-product-backlog': 'board-view-product-backlog',
  'board-view-sprints': 'board-view-sprints',
  'board-view-sprint-report': 'board-view-sprint-report',
  'board-view-roadmap': 'board-view-roadmap',
  'board-view-bigboard': 'board-view-bigboard',
  'board-view-map': 'board-view-map',
  'board-view-email': 'board-view-email',
  'board-view-chat': 'board-view-chat',
  'board-view-version-control': 'board-view-version-control',
  'board-view-column-sets': 'board-view-column-sets',
  'board-view-website': 'board-view-website',
  'board-view-shop': 'board-view-shop',
  ...Object.fromEntries(SCRUM_CHART_VIEWS.map(v => [v, 'board-view-burndown'])),
  ...Object.fromEntries(CHART_VIEWS.map(v => [v, 'board-view-dashboard'])),
  ...Object.fromEntries(FLOW_VIEWS.map(v => [v, 'board-view-flow'])),
  ...Object.fromEntries(REPORT_VIEWS.map(v => [v, 'board-view-reports'])),
};

// The board sidebar's views (client/components/sidebar/sidebar.js viewTitles).
const SIDEBAR_VIEW_HELP = {
  filter: 'sidebar-filter',
  search: 'sidebar-search',
  multiselection: 'sidebar-multiselection',
  customFields: 'sidebar-custom-fields',
  archives: 'sidebar-archives',
  originalPositions: 'sidebar-original-positions',
  boardSummary: 'sidebar-summary',
  sinceLastVisit: 'sidebar-since-last-visit',
};

// Popups, by template name: the ? sits in the popup's own title bar
// (client/components/main/popup.tpl.jade), before its maximize and close.
const POPUP_HELP = {
  boardChangeVisibilityPopup: 'board-visibility',
  boardChangeWatchPopup: 'board-watch',
  cardsSortPopup: 'board-sort-cards',
  boardMenuPopup: 'board-settings',
  boardChangeColorPopup: 'board-settings-color',
  boardAnnouncementPopup: 'board-settings-announcement',
  boardChangeBackgroundImagePopup: 'board-settings-background',
  boardDateSettingsPopup: 'board-settings-date',
  boardInfoOnMyBoardsPopup: 'board-settings-all-boards',
  boardViewSettingsPopup: 'board-settings-board-view',
  boardSwimlaneSettingsPopup: 'board-settings-swimlane',
  boardListSettingsPopup: 'board-settings-list',
  boardShopSettingsPopup: 'board-settings-shop',
  boardCardSettingsPopup: 'board-settings-card',
  exportBoardPopup: 'board-settings-import-export',
  importBoardIntoPopup: 'board-settings-import-export',
  notificationSettingsPopup: 'board-settings-notifications',
  outgoingWebhooksPopup: 'board-settings-webhooks',
  dailyStandupPopup: 'board-settings-scrum-meetings',
  wipLimitGroupsPopup: 'board-settings-wip-limit-groups',
  boardSubtaskSettingsPopup: 'board-settings-subtasks',
  rulesImportExportPopup: 'rules',
  memberMenuPopup: 'member-settings',
  editProfilePopup: 'member-edit-profile',
  changeSettingsPopup: 'member-change-settings',
  changeColorPopup: 'member-change-color',
  changeFontPopup: 'member-change-font',
  changeAvatarPopup: 'member-change-avatar',
  changePasswordPopup: 'member-change-password',
  passkeysPopup: 'member-passkeys',
  sqrlPopup: 'member-sqrl',
  twoFactorAuthPopup: 'member-two-factor',
  hiddenBoardsPopup: 'member-hidden-boards',
  changeLanguagePopup: 'member-change-language',
  invitePeoplePopup: 'member-invite-people',
  memberDateSettingsPopup: 'member-date',
  bookmarksPopup: 'bookmarks',
  cardStickersPopup: 'card-stickers',
  cardLocationsPopup: 'card-locations',
  cardDependenciesPopup: 'card-dependencies',
  cardLabelsPopup: 'card-labels',
  cardCustomFieldsPopup: 'card-custom-fields',
  cardAttachmentsPopup: 'card-attachments',
  editCardDueDatePopup: 'card-dates',
  editCardSpentTimePopup: 'card-time',
  cardStartPlanningPokerPopup: 'card-planning-poker',
  actionItemsPopup: 'card-action-items',
  historyPopup: 'card-history',
  cardQrCodePopup: 'card-qr-code',
  moveCardPopup: 'card-move',
  copyCardPopup: 'card-copy',
  cardRecurrenceIntervalPopup: 'card-recurrence',
  copyManyCardsPopup: 'card-copy-many',
  setCardColorPopup: 'card-color',
  cardDrawingPopup: 'card-drawing',
  cardMorePopup: 'card-more',
  createBoardFromCardPopup: 'card-create-board',
  linkCardToBoardPopup: 'card-link-to-board',
  cardDetailsActionsPopup: 'card-actions',
};

// The card's sections (client/components/cards/cardDetails.jade
// cardSectionHeader), by their `section`. Vote has no page in the docs yet.
const CARD_SECTION_HELP = {
  'similar-cards': 'card-similar-cards',
  activities: 'card-activities',
  labels: 'card-labels',
  date: 'card-dates',
  members: 'card-members',
  card: 'card-fields',
  time: 'card-time',
  customFields: 'card-custom-fields',
  poker: 'card-planning-poker',
  scrum: 'card-scrum',
  description: 'card-description',
  checklists: 'card-checklists',
  subtasks: 'card-subtasks',
  attachments: 'card-attachments',
  comments: 'card-comments',
};

// The Admin Panel and All Boards panes: route name -> the open menu entry's id
// -> help. The ids are those of the pages' own menus.
const STORAGE_PANES = ['move', 'default-save-storage', 'limits', 'retention', 'gridfs',
  'filesystem', 's3', 'azure', 'gcs', 'webdav', 'database-migration', 'sandstorm'];
const PANE_HELP = {
  setting: {
    'version-setting': 'admin-version',
    'tableVisibilityMode-setting': 'admin-appearance',
    'features-setting': 'admin-features',
    'feature-profiles-setting': 'admin-feature-profiles',
    'privacy-security-setting': 'admin-security',
    'activities-setting': 'admin-activities',
    'delete-setting': 'admin-delete',
    'announcement-setting': 'admin-announcement',
    'accessibility-setting': 'admin-accessibility',
    'translation-setting': 'admin-translation',
    'layout-setting': 'admin-pwa',
    'webhook-setting': 'admin-global-webhooks',
    'shared-labels-setting': 'admin-shared-labels',
  },
  people: {
    'email-setting': 'admin-email',
    'notify-setting': 'admin-notifications',
    'domains-setting': 'admin-domains',
    'org-setting': 'admin-organizations',
    'team-setting': 'admin-teams',
    'people-setting': 'admin-people',
    'locked-users-setting': 'admin-locked-users',
    'audit-log-setting': 'admin-audit-log',
    'roles-setting': 'admin-roles',
    'templates-setting': 'admin-shared-templates',
    'registration-setting': 'admin-login',
    'saml-setting': 'admin-saml',
    'ldap-setting': 'admin-ldap',
    'oidc-setting': 'admin-oauth2',
    'cas-setting': 'admin-cas',
    'header-login-setting': 'admin-header-login',
    'oauth-setting': 'admin-oauth-providers',
    'passwordless-setting': 'admin-passwordless',
  },
  attachments: {
    backup: 'admin-backup',
    'continuous-backup': 'admin-backup',
    ...Object.fromEntries(STORAGE_PANES.map(p => [p, 'admin-attachments'])),
  },
  problems: {
    'report-summary': 'admin-problems-summary',
    'features-backup': 'admin-backup',
    'report-security': 'admin-problems-security',
    'report-impersonation': 'admin-problems-impersonation',
    'report-password-length': 'admin-problems-password-length',
    'features-performance': 'admin-problems-performance',
    'report-speed': 'admin-problems-speed',
    'report-tests': 'admin-problems-tests',
    'report-cpu': 'admin-problems-cpu',
    'report-ram': 'admin-problems-ram',
    'report-disk': 'admin-problems-disk',
    'report-instrumentation': 'admin-problems-instrumentation',
    'report-broken': 'admin-problems-broken-cards',
    'report-files': 'admin-problems-files',
    'report-rules': 'admin-problems-rules',
    'report-webhooks': 'admin-problems-webhooks',
    'report-boards': 'admin-problems-boards',
    'report-cards': 'admin-problems-cards',
    'report-recovery': 'admin-problems-recovery',
    'report-office': 'admin-problems-offices',
    'report-api': 'admin-problems-api',
    'report-database': 'admin-problems-database',
    'report-integrity': 'admin-problems-integrity',
  },
};
// Every pane of the Cloud Panel shares one help: the page is one feature.
const CLOUD_ROUTES = ['cloud-admin-home', 'cloud-admin'];

const PREFIX = 'help-';
const whatKey = id => `${PREFIX}${id}-what-it-is-description`;
const howKey = id => `${PREFIX}${id}-how-it-works-description`;

// The ids, in the order their keys are written to en.i18n.json.
const FEATURE_IDS = Object.keys(FEATURES);

function hasFeature(id) {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(FEATURES, id);
}

function featureHelp(id) {
  if (!hasFeature(id)) return null;
  return { id, docs: FEATURES[id], whatKey: whatKey(id), howKey: howKey(id) };
}

const lookup = (map, key) => {
  if (typeof key !== 'string' || !Object.prototype.hasOwnProperty.call(map, key)) return null;
  return map[key];
};

const boardViewHelpId = view => lookup(BOARD_VIEW_HELP, view);
const sidebarViewHelpId = view => lookup(SIDEBAR_VIEW_HELP, view);
const popupHelpId = popupName => lookup(POPUP_HELP, popupName);
const cardSectionHelpId = section => lookup(CARD_SECTION_HELP, section);
function paneHelpId(routeName, paneId) {
  if (CLOUD_ROUTES.includes(routeName)) return 'admin-cloud';
  // All Boards renders the same pane title (boardsList.jade).
  if (['home', 'allboards', 'allboards-templates', 'allboards-remaining'].includes(routeName)) {
    return 'all-boards';
  }
  const panes = lookup(PANE_HELP, routeName);
  return panes ? lookup(panes, paneId) : null;
}

// Every id some map reaches, for the test that no help is left unused.
function mappedIds() {
  const ids = new Set([
    ...Object.values(BOARD_VIEW_HELP),
    ...Object.values(SIDEBAR_VIEW_HELP),
    ...Object.values(POPUP_HELP),
    ...Object.values(CARD_SECTION_HELP),
    'admin-cloud',
    'all-boards',
  ]);
  for (const panes of Object.values(PANE_HELP)) {
    for (const id of Object.values(panes)) ids.add(id);
  }
  return ids;
}

module.exports = {
  FEATURES,
  FEATURE_IDS,
  BOARD_VIEW_HELP,
  SIDEBAR_VIEW_HELP,
  POPUP_HELP,
  CARD_SECTION_HELP,
  PANE_HELP,
  PREFIX,
  whatKey,
  howKey,
  hasFeature,
  featureHelp,
  boardViewHelpId,
  sidebarViewHelpId,
  popupHelpId,
  cardSectionHelpId,
  paneHelpId,
  mappedIds,
};
