// Bootstrap the collection-prototype shim (.helpers / .attachSchema / hooks)
// BEFORE any test pulls in a model. The normal server entry (server/main.js)
// require()s this first; the `meteor test` entry does not, so without this the
// first model that calls Collection.helpers({...}) — e.g. models/positionHistory.js
// reached via utils.tests → models/boards — throws "helpers is not a function".
// ES import statements evaluate in source order, so this must stay the first one.
import '/imports/collectionHelpers';

// i18n (TAPi18n) is isomorphic and used on the server too, so run its tests here
// as the old tests/main.js did (top-level import, no block import for swc/Meteor 3).
import '/imports/i18n/i18n.test.js';
import './utils.tests';
import './users.security.tests';
import './boards.security.tests';
import './cards.security.tests';
import './cards.methods.tests';
import './attachmentApi.tests';
import './attachmentApi.authContext.tests';
import './headerLoginAuth.tests';
import './search.logic.tests';
import './fileStoreStrategy.security.tests';
import './clonebleed.security.tests';
import './permissions.security.tests';
import './dependencies.metadata.tests';
import './dependencies.openapi.tests';
import './cards.dependencies.move.tests';
import './jiraCreator.dependencies.tests';
import './attachmentActivity.tests';
import './comments.permissions.tests';
import './announcementDismiss.tests';
import './boardSearch.comments.tests';
import './dueDateEdits.tests';
import './icsImport.tests';
import './orgTeamRestriction.tests';
import './cardsCopyDueFixes.tests';
import './archivePermission.tests';
import './selectAllSwimlane.tests';
import './swimlaneCopyLabels.tests';
import './attachmentDeleteActor.tests';
import './titleChangeActivity.tests';
import './removeMissingMember.tests';
import './boardListFilter.tests';
import './restCardFixes.tests';
import './checklistHideToggle.tests';
import './listColor.tests';
import './customNumberFormat.tests';
import './languageNames.tests';
import './subtaskSettings.tests';
import './subtaskCreation.tests';
import './deleteWebhookActivity.tests';
import './webhookNonBlocking.tests';
import './apiResponseHelpers.tests';
import './dnsbleed.security.tests';
import './fileValidationBypass.security.tests';
import './importExportSecurity.tests';
import './impersonationReportQuery.tests';
