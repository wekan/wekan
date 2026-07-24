// i18n (TAPi18n) tests, run on the client as the old tests/main.js did.
import '/imports/i18n/i18n.test.js';
import './Utils.tests';
import './filter.dependencies.tests';
import './dueDateColor.tests';
import './dueCards.logic.tests';
import './listAdd.tests';
import './responsive.tests';
import './boardNumbering.tests';
import './subtaskStatus.tests';
import './subtaskViewGuard.tests';
import './boardTriggersClass.tests';
import './calendarFirstDay.tests';
import './mentionEnterGuard.tests';
import './subtaskViewTarget.tests';
import './cardCloseGuard.tests';
import './bsonBrowserShim.tests';

// #6520: existed but were never imported here, so `meteor test` skipped them.
import './alwaysShowCodeAsText.tests';
import './renderLinksPlainText.tests';
