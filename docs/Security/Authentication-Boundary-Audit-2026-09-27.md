# Authentication boundary audit — 2026-09-27

This audit follows the private LDAP report GHSA-m87f-f43w-hwmc by
[kta1kri](https://github.com/kta1kri). It reviews the current application login
boundaries, not every possible vulnerability in the application or its identity
providers. The fixes are prepared locally for the Upcoming release.

## Confirmed findings

### LdapBindBleed — empty user credentials

Direct user-bind mode accepted an empty password. LDAP simple bind can accept a
non-empty DN with an empty password as unauthenticated access; that does not
prove the identity of the DN. If the directory also permits the user search,
WeKan's login handler could return the matching account ID. The installed
ldapts 4.2.6 passes the empty password to its bind request.

Both the login boundary and user-authentication helpers now require non-empty
string identifiers and passwords. Passwords are not trimmed. This applies to
DDP and the REST route that delegates to the LDAP handler, including the local
fallback. Intentional anonymous service searches are unaffected. Denials are
summarized as LdapBindBleed in Admin Panel / Problems without logging passwords.

The report's assertion that stock OpenLDAP permits unauthenticated binds by
default is incorrect: its current administrator guide says they are disabled
by default. This does not remove the application defect on permissive directories.

### DirectoryGroupBleed — LDAP and CAS group restrictions

Direct LDAP user-bind mode skipped the group check. Both authentication modes
now enforce it before account lookup/synchronization; a group refusal cannot
fall back to a cached local password. Both require exactly one matching entry.

The LDAP group-login query could omit its member clause when the configured
member-format attribute was absent. It now uses the same DN fallbacks as the
other group lookup and refuses a lookup without a usable member identity.
Username values are also escaped for LDAP filters and DN construction in their
respective contexts, preventing them from changing the query structure.

CAS used a substring regular expression to match allowed group names: an
allowed `wekan` matched `wekan-other`, and dots in configured names acted as
wildcards. It now compares complete, literal CN values from the membership DN,
including escaped separators. Configured empty/malformed lists and missing
memberships fail closed. Unconfigured restrictions remain unrestricted.
LDAP and CAS group denials appear as DirectoryGroupBleed summaries in Problems.

### SamlReplayBleed — response replay

The SAML adapter omitted `validateInResponseTo`; node-saml defaulted to `never`.
A local signed-response fixture reproduced accepting the same valid response
more than once, including under a different RelayState. Validation now requires
a live request ID using the maintained library's `always` mode. A bounded,
synchronous consumption guard also refuses concurrent validations of the same
verified response before storing a login credential. Detectable concurrent
replay denials appear as SamlReplayBleed summaries in Problems.

This flow supports SP-initiated login. Unsolicited IdP-initiated assertions are
now rejected. Request state remains process-local, as in the existing adapter;
clustered deployments need sticky routing for the authentication handshake.
A restart or configuration change invalidates in-flight requests. The replay
guard refuses new identities rather than evicting live entries if its bound
is reached; the request/consumption lifetime is eight hours.

## Other boundaries reviewed

| Boundary | Existing protection reviewed | Scope and result |
| --- | --- | --- |
| Password DDP | Meteor password verification; timing wrapper never returns an identity | No equivalent empty-bind bypass found |
| REST password/LDAP | Verified handler result, active-account check, optional 2FA, guarded token insertion | LDAP fix covers the delegated handler |
| CAS tickets | HTTPS provider validation, per-token credentials, single-use retrieval, explicit account-link opt-in | Group matching fixed above |
| SAML | node-saml signature, time and audience checks; explicit account-link opt-in | Request correlation and replay fixed above |
| OIDC/OAuth | Server-side code exchange/userinfo, per-login state, verified-email merge opt-in, provider-enabled checks | No additional bypass confirmed in this review |
| Passwordless | Feature gate, payload restrictions, compare-and-set token consumption | Existing regression tests retained |
| Header login | TCP-peer proxy allowlist, fail closed when unconfigured, active token insertion | Trusted proxy remains the identity authority |
| Sandstorm | Deployment-gated rendezvous and trusted Sandstorm proxy headers | No change to its platform trust model; no live Sandstorm test |
| Administrator impersonation/token creation | Administrator authorization and audit records | No anonymous token-issuance bypass found |
| Resume/disabled accounts | Existing token validation, status guard and revocation | Existing tests retained |

“No additional bypass confirmed” is not a claim that a provider or all possible
configurations are free from vulnerabilities. This audit does not validate live
production identity providers, TLS deployments or every third-party package.

## Verification

- `tests/ldapAuthenticationBoundary.test.cjs` executes the current LDAP class
  and login handler with controlled directory/database boundaries. Positive,
  negative, ambiguous-search, malformed-input, fallback, logging-failure and
  sibling-source checks cover both LDAP modes.
- `tests/casGroupBoundary.test.cjs` executes the actual CAS validation class with
  controlled HTTPS/XML responses, plus literal and escaped-DN policy cases.
- `tests/samlReplayBoundary.test.cjs` uses a generated test certificate and a
  local signed protocol fixture. It reproduces the previous acceptance twice,
  verifies valid login, and rejects replay, unsolicited, unsigned and tampered
  responses. Atomic consumption, capacity and expiration are tested separately.
- `tests/playwright/specs/authentication-boundary.e2e.js` exercises anonymous
  DDP login, unchanged session tokens and the Problems security summary.
- Existing LDAP, CAS, SAML, OIDC, OAuth, passwordless, 2FA, inactive-account and
  provider regression suites are rerun. A stale OIDC VM harness was updated to
  supply the existing administrator-creation context; application behavior was
  unchanged by that harness repair.

References: [RFC 4513 §5.1.2](https://datatracker.ietf.org/doc/html/rfc4513#section-5.1.2),
[OpenLDAP authentication](https://www.openldap.org/doc/admin26/security.html#Authentication%20Methods),
[node-saml request validation](https://github.com/node-saml/node-saml#inresponseto-validation).

Validation result: 46 focused Node suites and five Chromium scenarios passed.
The local Meteor instance rebuilt successfully with these changes. No live
OpenLDAP/Active Directory, external CAS/SAML provider, Sandstorm deployment,
or FerretDB authentication matrix was exercised.
