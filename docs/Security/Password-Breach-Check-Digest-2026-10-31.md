# Password breach check digest (CodeQL #599)

Reviewed on **2026-10-31** from the saved alert in `.tools/log/wekansec2`.

| Alert | Source review | Changes |
| --- | --- | --- |
| 599: use of password hash with insufficient computational effort (`js/insufficient-password-hash`, CWE-916) | `server/lib/passwordPolicy.js` computed the SHA-1 of a new password for `PASSWORD_CHECK_PWNED` (off by default, unreleased). That digest is not password storage: accounts-password stores passwords with bcrypt, and this one is never stored or logged. Have I Been Pwned's range API is keyed by SHA-1, so its first 5 hex digits are sent and the remaining 35 are compared with the answer in memory and dropped. A slow hash cannot be used, because the service could not match it. | The browser and the server now compute the lookup digest with ONE implementation, `breachLookupDigest` in `models/lib/passwordPolicy.js` (Web Crypto in both), whose comment says what it is and is not. The server no longer hashes a password with a hash of its own, and a failure to compute the digest lets the password through, like an unreachable service. Tests: the digest equals SHA-1 for ASCII and UTF-8 input, it reaches only the range lookup and the comparison, and nothing anywhere in WeKan hashes a password-named value with a fast hash (`tests/passwordPolicy.test.cjs`). |

This is hardening of a check that had not been released, not a confirmed
vulnerability: no password or password hash was stored or sent beyond five
hex digits. No Hall of Fame entry is created, and nothing is recorded in Admin
Panel / Problems - a password being checked is ordinary use, not an attack.

If the alert is raised again for the Web Crypto digest, it is the same false
positive and can be dismissed as "Won't fix - the API requires SHA-1; not
stored", with a link to this page.

Reference: [Have I Been Pwned range API](https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange),
[OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
