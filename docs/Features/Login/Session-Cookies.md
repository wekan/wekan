# Session cookies

WeKan resumes sessions using Meteor's HttpOnly cookie flow. Login credentials
are kept in memory instead of Local Storage. The server validates resume
cookies and applies the configured login expiry; HTTPS cookies remain Secure.

Set `ROOT_URL` to the public address, including any deployment path, for
example `https://boards.example.com/wekan`. Cookie set, refresh and clear
requests include that path and use the browser's current origin. Reloading
a prefixed board preserves the signed-in user and member preferences.
Root deployments retain Meteor's native cookie methods.

This works on-premise without Internet access and adds no dependency.
See [calendar preferences](../Member-Settings/Date/Calendar-Systems.md) and
[header login](Header-Login.md) for related behavior.
