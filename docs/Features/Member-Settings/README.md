# Member Settings

## What it is

**Member Settings** is the menu that opens when you click your username or
avatar at the **top right**. It holds your own pages (My Cards, Due Cards,
Starred ...), the overviews (All Boards, Public, Archive), and every personal
setting: profile, date, display, notifications, font, avatar, password,
two-factor authentication, passkeys, language and logging out. Entries depend on
your account type, role and site settings.

When a site administrator has given you a
[feature profile](../Admin-Panel/Settings/Feature-Profiles.md) that hides
features, the menu opens with a note: *Your feature profile ... hides N
features. Ask an administrator if you need one of them.* A hidden feature is
then hidden on purpose, not missing.

## How to use it

Click your username or avatar at the top right and pick an entry. In menu
order:

| Entry | What to use it for |
| --- | --- |
| Show My Dependencies | [Your own dependency lines](../General/Editor/RedStrings/Board-And-My-Dependencies.md#member-settings) |
| Show Board Dependencies | [The board's dependency lines](../General/Editor/RedStrings/Board-And-My-Dependencies.md#member-settings) |
| Import | [Import dependencies](../General/Editor/RedStrings/Board-And-My-Dependencies.md#import-and-export) |
| Export | [Export dependencies](../General/Editor/RedStrings/Board-And-My-Dependencies.md#import-and-export) |
| My Cards | [Cards associated with you](../Pages/My-Cards-Due-Attachments.md) |
| Due Cards | [Cards with deadlines](../Pages/My-Cards-Due-Attachments.md) |
| Workload and capacity | [Workload](../Workload/Workload.md), when the feature is allowed |
| Budget and billing | [Billing](../Billing/Billing.md), when the feature is allowed |
| My Attachments | [Your attachments](../Pages/My-Cards-Due-Attachments.md) |
| Starred | [Favorite boards and items](../Pages/Starred.md) |
| Search All Boards | [Search across accessible content](../Board-Header/Search.md) |
| All Boards | [Board overview](../All-Boards/README.md) |
| Public | [Public boards](../All-Boards/Public.md) |
| Archive | [Archived content](../All-Boards/Archive.md) |
| Help | The site's configured help link, when provided |
| Templates | [Reusable content](../All-Boards/Templates.md), not for Worker accounts |
| Admin Panel | [Administration](../Admin-Panel/Admin-Panel.md), for authorized administrators |
| Invite People | [Invite people by e-mail](Invite-People.md), when self-registration is off and your domain may invite |
| Edit Profile | [Name, username, initials, e-mail; delete or anonymize](Edit-Profile.md); not for OAuth2 accounts |
| Date | [Date format, week start and calendar system](Date/README.md) |
| Change Settings | [Editing and display preferences](Change-Settings.md) |
| Change Color | [Appearance](../General/Theme/Theme.md) |
| Notifications | [Email and in-app delivery preferences](Notifications.md) |
| Font | [Font, font size and text color](Change-Font.md) |
| Change Avatar | [Your profile image](Change-Avatar.md) |
| Change Password | [Change a WeKan password](Change-Password.md); not on Sandstorm or for OAuth2 accounts |
| Two-Factor Authentication | [Set up an authenticator](../Login-Page/Two-Factor-Authentication.md); not on Sandstorm or for OAuth2 accounts |
| Hidden boards | [Boards you left that a team or organization still shows](Hidden-Boards.md) |
| Passkeys | [Sign in without a password](Passkeys.md); not on Sandstorm |
| SQRL | [Your SQRL identity](SQRL.md), when SQRL is turned on |
| Change Language | [Language chooser](Change-Language.md) |
| Activity on all my boards | [What happened on your boards](Activity-Feed.md) |
| Support | [The site's support page](Support.md), when enabled |
| Log Out | End this browser's session ([details](Log-Out-Everywhere.md)); not on Sandstorm |
| Log out everywhere | [End every session of your account](Log-Out-Everywhere.md); not on Sandstorm |

The labels are the English texts of the menu (`memberMenuPopup` in
[client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade)).
An administrator who is a per-tenant Global Admin rather than a site admin is
sent to Admin Panel / People instead of Settings.

[Default avatar](Default-Avatar.md) describes the server-wide image used when a
member has no picture.

Date Format is directly inside **Date**, followed by week start and calendar
system. These controls are not in **Change Settings**. The Date popup displays
the global and current board defaults before your personal override.

See the pages above.

## Commits

 - [the menu notes how many features a feature profile hides](https://github.com/wekan/wekan/commit/fc21b0b177dc8f8902efa39d0f89c8b041c7cf2d)
 - [Show My Dependencies and Show Board Dependencies at the top of the menu](https://github.com/wekan/wekan/commit/cff80a9d7b89ab8e70b3bc1adfacb2db86527307)
 - [the Date entry groups date format, week start and calendar system](https://github.com/wekan/wekan/commit/e13f4f6c29c55a50c423d5887c297455b552b4c2)
