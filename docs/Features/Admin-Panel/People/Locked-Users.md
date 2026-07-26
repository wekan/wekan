# Admin Panel / People / Locked Users

Brute-force protection: how many failed sign-in attempts lock an account, for how
long, and the list of who is locked out right now.

Separate limits are kept for **known users** (an existing account) and **unknown
users** (an address with no account), so guessing usernames cannot lock out real
people faster than it is worth.

**Unlock all users** is one of the actions in [People](People.md).

## Related

- [Brute-force protection](../../../Security/brute-force-protection.md)
