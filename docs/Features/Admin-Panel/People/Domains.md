# Admin Panel / People / Domains

Every e-mail domain in use across the instance, with the number of users on it. A
read-only [table page](../../../Features/Page/Table.md): search on Enter, a total,
`page X / N`, prev/next, one page at a time from the server.

It answers "who is on this instance, by organization" without reading the user list,
and is the quickest way to spot an unexpected domain.

The same URL has an equivalent semantic Legacy HTML4 table when JavaScript drag
and drop is unavailable. Its labelled search form submits on ordinary HTTP POST,
and signed Previous/Next controls retain the current literal search. Both views
use the same Global Admin-only aggregation service, fixed ten-row page and
case-insensitive domain ordering. Only primary e-mail domains and their counts
leave the server; addresses and other account fields do not. Refused enumeration
is reported as `DomainBleed` in Admin Panel / Problems / Security.

Related, but different: the invite-domain field in [E-mail](E-mail.md), and
per-organization automatic membership by domain (Organizations / *auto add users
with domain name*).
