import '/client/components/settings/adminProblems.jade';
import '/client/components/settings/attachments.jade';
import '/client/components/settings/attachmentSettings.jade';
import '/client/components/settings/connectionMethod.jade';
import '/client/components/settings/informationBody.jade';
import '/client/components/settings/invitationCode.jade';
import '/client/components/settings/migrationProgress.jade';
import '/client/components/settings/peopleBody.jade';
import '/client/components/settings/settingBody.jade';
import '/client/components/settings/settingHeader.jade';
import '/client/components/settings/leftMenu.jade';
import '/client/components/settings/tablePage.jade';
import '/client/components/settings/tablePage.js';
import '/client/components/settings/translationBody.jade';

import '/client/components/settings/adminProblems.js';
import '/client/components/settings/attachments.js';
import '/client/components/settings/connectionMethod.js';
import '/client/components/settings/informationBody.js';
import '/client/components/settings/invitationCode.js';
// The left menu's caret. Its .jade above only DRAWS the caret: the click that
// folds the menu and the `isLeftMenuCollapsed` helper that says whether it is
// folded live here, and package.json sets meteor.mainModule, so a file nobody
// imports is simply not in the bundle. Without this line the caret rendered and
// did nothing - an unregistered helper is undefined, so the panel never took
// the `collapsed` class either. docs/Features/Page/Left-Menu.md
import '/client/components/settings/leftMenu.js';
import '/client/components/settings/lockedUsersBody.js';
import '/client/components/settings/migrationProgress.js';
import '/client/components/settings/peopleBody.js';
import '/client/components/settings/settingBody.js';
import '/client/components/settings/settingHeader.js';
import '/client/components/settings/problemsSummary.jade';
import '/client/components/settings/problemsSummary.js';
import '/client/components/settings/translationBody.js';

// adminProblems.css was missing here, so NONE of the Admin Panel report styling
// was in the bundle (package.json sets meteor.mainModule, so a CSS file that is
// never imported is simply not loaded). That is why the report search box and
// the prev/next pagination buttons fell back to the global `button` rule in
// forms.css and rendered with a black/grey background instead of the theme.
import '/client/components/settings/adminProblems.css';
import '/client/components/settings/attachments.css';
import '/client/components/settings/informationBody.css';
import '/client/components/settings/lockedUsersBody.css';
import '/client/components/settings/migrationProgress.css';
import '/client/components/settings/peopleBody.css';
import '/client/components/settings/settingBody.css';
import '/client/components/settings/settingHeader.css';
import '/client/components/settings/tablePage.css';
import '/client/components/settings/translationBody.css';
