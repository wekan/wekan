# Admin Panel / Problems / Offices

Open **Offices** to review successful login counts by person and address.
Each person's addresses stay together. Rows can show IPv4, IPv6, first/last
login times and location information when available. A shared address may
represent an office, VPN or NAT; it is not proof that accounts are one person.

Location information comes from the configured trusted proxy/CDN headers.
Missing information remains unknown. An IPv4/IPv6 pair is only shown when the
server has evidence linking the addresses; an address alone cannot establish
someone's precise physical location.

This is an administrator report of locally recorded login activity. Its
implementation does not require sending login addresses to an external
geolocation service. See [Problems](README.md) and
[account lockout](../../Login/Accounts-Lockout.md).
