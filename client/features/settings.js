import '/client/components/settings/adminFeatures.jade';
import '/client/components/settings/adminReports.jade';
import '/client/components/settings/attachments.jade';
import '/client/components/settings/attachmentSettings.jade';
import '/client/components/settings/connectionMethod.jade';
import '/client/components/settings/cronSettings.jade';
import '/client/components/settings/informationBody.jade';
import '/client/components/settings/invitationCode.jade';
import '/client/components/settings/migrationProgress.jade';
import '/client/components/settings/peopleBody.jade';
import '/client/components/settings/settingBody.jade';
import '/client/components/settings/settingHeader.jade';
import '/client/components/settings/translationBody.jade';

import '/client/components/settings/adminFeatures.js';
import '/client/components/settings/adminReports.js';
import '/client/components/settings/attachments.js';
import '/client/components/settings/connectionMethod.js';
import '/client/components/settings/informationBody.js';
import '/client/components/settings/invitationCode.js';
import '/client/components/settings/lockedUsersBody.js';
import '/client/components/settings/migrationProgress.js';
import '/client/components/settings/peopleBody.js';
import '/client/components/settings/settingBody.js';
import '/client/components/settings/settingHeader.js';
import '/client/components/settings/problemsSummary.jade';
import '/client/components/settings/problemsSummary.js';
import '/client/components/settings/translationBody.js';

// adminReports.css was missing here, so NONE of the Admin Panel report styling
// was in the bundle (package.json sets meteor.mainModule, so a CSS file that is
// never imported is simply not loaded). That is why the report search box and
// the prev/next pagination buttons fell back to the global `button` rule in
// forms.css and rendered with a black/grey background instead of the theme.
import '/client/components/settings/adminReports.css';
import '/client/components/settings/attachments.css';
import '/client/components/settings/cronSettings.css';
import '/client/components/settings/lockedUsersBody.css';
import '/client/components/settings/migrationProgress.css';
import '/client/components/settings/peopleBody.css';
import '/client/components/settings/settingBody.css';
import '/client/components/settings/settingHeader.css';
import '/client/components/settings/translationBody.css';
