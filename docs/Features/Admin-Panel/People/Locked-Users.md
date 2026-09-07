# Admin Panel / People / Locked Users

Brute-force protection: how many failed sign-in attempts lock an account, for how
long, and the list of who is locked out right now.

Separate limits are kept for **known users** (an existing account) and **unknown
users** (an address with no account), so guessing usernames cannot lock out real
people faster than it is worth.

**Unlock all users** is one of the actions in [People](People.md).

The pane lists each currently locked account with its username, primary e-mail,
combined failed-attempt count, number of affected source addresses and remaining
lock time. An administrator can refresh the list, confirm an individual unlock or
confirm unlocking all accounts. Saving the six settings activates the new values
immediately through the same server operation used by the Legacy HTML4 view.

## Legacy HTML4

The same `/admin/people/locked-users` URL has a semantic, accessible HTML4
baseline when JavaScript drag and drop is unavailable. Its labelled numeric
fieldset has the same six bounds as the modern form. The locked-user rows and
single/all unlock operations contain the same data and require explicit
confirmation. All mutations are CSRF-protected HTTP POSTs and work without
JavaScript or cookies.

Both views use one Global Admin-only service. Invalid fields and out-of-range
integers are refused, and settings are activated only after the complete validated
set is stored. The LockoutSettings publication is also Global Admin-only. Refused
access is reported as JamBleed with available username, IPv4/IPv6 and location
context.

## Related

- [Brute-force protection](../../../Security/brute-force-protection.md)
