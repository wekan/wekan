# SAML

## What it is

WeKan has SP-initiated SAML 2.0 login, built on the actively-maintained,
MIT-licensed [`@node-saml/node-saml`](https://github.com/node-saml/node-saml)
library (it does all SAML protocol / XML-signature handling; WeKan only wires
it into Meteor's accounts system - see the `wekan-accounts-saml` package under
`packages/wekan-accounts-saml/`).

SAML (Security Assertion Markup Language) is the XML-based single sign-on
standard many company identity providers speak: the user signs in at the
identity provider (IdP), which sends WeKan a signed assertion saying who they
are, and WeKan signs them in without a WeKan password. Original issue:
[\#708](https://github.com/wekan/wekan/issues/708).

## Read more

- [SAML at Wikipedia](https://en.wikipedia.org/wiki/Security_Assertion_Markup_Language)
- [node-saml](https://github.com/node-saml/node-saml), the library WeKan uses
- [Authentication boundary audit](../../Security/Authentication-Boundary-Audit-2026-09-27.md)
- [OAuth2](OAuth2.md), including Rocket.Chat signing in with SAML before WeKan

### Related Meteor SAML code / prior art

- New: https://forums.meteor.com/t/meteor-and-saml/61561
- Old link: https://forums.meteor.com/t/what-are-you-working-on/59187

Sandstorm has SAML login, and old WeKan that will be updated someday:

- [Sandstorm](../../Platforms/FOSS/Container/Sandstorm)

How SAML works:

- https://ssoready.com
- https://github.com/ssoready/ssoready
- https://news.ycombinator.com/item?id=41110850
- https://ssoready.com/blog/from-the-founders/an-unpopular-perspective-on-the-sso-tax/
- https://news.ycombinator.com/item?id=41303844/blog/engineering/a-gentle-intro-to-saml/
- https://news.ycombinator.com/item?id=41036982
- https://www.sheshbabu.com/posts/visual-explanation-of-saml-authentication/
- https://news.ycombinator.com/item?id=41057814
- https://github.com/ssoready/ssoready
- https://news.ycombinator.com/item?id=41110850
- https://ssoready.com/blog/from-the-founders/an-unpopular-perspective-on-the-sso-tax/
- https://news.ycombinator.com/item?id=41303844

Ruby on Rails OmniAuth, that has Shibboleth and SAML:

- https://github.com/omniauth/omniauth/wiki/List-of-Strategies
- https://github.com/omniauth/omniauth
- Recent SAML issue https://news.ycombinator.com/item?id=41586031

The SSO Wall of Shame:

- https://sso.tax

[SAML Issue](https://github.com/wekan/wekan/issues/708)

[SAML settings commit](https://github.com/wekan/wekan/commit/214c86cc22f4c721a79ec0a4a4f3bbd90d673f93)

The maintained implementation is in `packages/wekan-accounts-saml/`;
configuration is in `server/saml.js` and `models/lib/samlConfig.js`.

### Gitea

- https://github.com/crewjam/saml
- https://github.com/go-gitea/gitea/pull/29403
- https://docs.gitea.com/enterprise/features/saml-auth

### Laravel

- https://github.com/24Slides/laravel-saml2

### ruby-saml/omniauth/RoR: Sign in as anyone: Bypassing SAML SSO authentication with parser differentials

- https://github.blog/security/sign-in-as-anyone-bypassing-saml-sso-authentication-with-parser-differentials/
- https://news.ycombinator.com/item?id=43349634
- https://github.com/github/securitylab

## How to use it

### How to enable it

Enable it with these environment variables (see the commented example in
`docker-compose.yml`):

| Variable | Meaning |
| --- | --- |
| `SAML_ENABLED` | Set to `true` to show the "Sign In with SAML" button. |
| `SAML_PROVIDER` | Short name for the identity provider; used in the ACS/callback URL. |
| `SAML_ENTRYPOINT` | The identity provider's SSO redirect endpoint. |
| `SAML_ISSUER` | This WeKan instance's SAML issuer / entity ID. |
| `SAML_CERT` | The identity provider's signing certificate, used to verify the response signature. |
| `SAML_IDPSLO_REDIRECTURL` | The identity provider's Single Logout redirect URL, if used. |
| `SAML_PRIVATE_KEYFILE` / `SAML_PUBLIC_CERTFILE` | Paths under `private/` to this instance's own key/cert, only needed if the IdP requires signed `AuthnRequest`s. |
| `SAML_IDENTIFIER_FORMAT` | NameID format requested from the IdP. Defaults to `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`. |
| `SAML_LOCAL_PROFILE_MATCH_ATTRIBUTE` | Assertion attribute to use as the WeKan username instead of the NameID/email. Its value is compared with `username`; see *Linking existing accounts* below. |
| `SAML_ATTRIBUTES` | Not used by login at the moment. Attributes are read from the validated assertion by name: `email`, `username` (or the match attribute), `displayName`/`cn`, `email_verified`. |
| `SAML_IDP_PROFILE` | What the identity provider signs and how login opens: `standard` (default) or `signed-assertion-redirect`. See below. |
| `SAML_WANT_RESPONSE_SIGNED` | `true`/`false`: require a signed SAML Response. Default: from the profile. |
| `SAML_WANT_ASSERTIONS_SIGNED` | `true`/`false`: require a signed Assertion. Default: from the profile. |
| `SAML_LOGIN_FLOW` | `redirect` or `popup`. Default: from the profile, `redirect` for both. |

The browser goes to `/_saml/authorize`, which redirects to the identity
provider (`SAML_ENTRYPOINT`); the IdP posts the signed assertion back to
`/_saml/validate` (WeKan's Assertion Consumer Service URL -
`<WeKan URL>/_saml/validate/<SAML_PROVIDER>`), which is registered as the
service's callback URL with the IdP, and the browser comes back to WeKan's
sign-in page, signed in. With `SAML_LOGIN_FLOW=popup` the same happens in a
popup window instead; a popup is blocked in iframes and on some phones, and an
identity provider's `Cross-Origin-Opener-Policy` can cut it off from WeKan so
the login never finishes, which is why redirect is the default.

### Identity-provider profiles

SAML 2.0 lets an identity provider sign the whole Response, only the Assertion
inside it, or both. Which one it does is a property of that identity provider,
so WeKan has a profile for each common arrangement:

| `SAML_IDP_PROFILE` | Signed Response required | Signed Assertion required | Login |
| --- | --- | --- | --- |
| `standard` (default) | yes | no | full-page redirect |
| `signed-assertion-redirect` | no | yes | full-page redirect |

Each of the three settings can also be chosen on its own in **Admin Panel /
People / SAML**; one left at Default follows the profile, and the page shows
`SAML_IDP_PROFILE` as its source. WeKan refuses a configuration that requires
neither signature, because an unsigned assertion would then be accepted.
node-saml verifies every signature that is present against `SAML_CERT`.

Symptoms that point here:

- **"Invalid document signature"** right after the identity provider reports
  success: the Response is not signed but `SAML_WANT_RESPONSE_SIGNED` is on.
  If the Assertion is signed, use `signed-assertion-redirect` or turn off only
  `SAML_WANT_RESPONSE_SIGNED` and turn on `SAML_WANT_ASSERTIONS_SIGNED`.
- **"Invalid signature"** after that: `SAML_CERT` is not the certificate whose
  key signed the Assertion. Paste that certificate's PEM, including the BEGIN
  and END lines.

With `SAML_LOGIN_FLOW=redirect` the browser leaves WeKan for the identity
provider and returns in the same window: the ACS stores the validated profile
under the random credential token and redirects to
`/sign-in?samlToken=<token>`, which the page exchanges for a login and then
opens `/`. The assertion is never put in the address. The token is remembered
in the browser tab that started the login, and a `samlToken` that tab did not
start is not exchanged, so a link cannot sign someone into another account.
Errors return as `/sign-in?samlError=<message>` and are shown on the sign-in
page.

### Admin Panel overrides and logout

Site administrators can open **Admin Panel / People / SAML** at
`/admin/people/saml`. The shared settings form shows environment variable names
and the source of each effective value. Saved values override the environment;
blank fields and the Default boolean choice restore environment/default values.
Saving applies the configuration without a server restart. Disabling SAML removes
its service configuration and prevents pending credentials from completing login.

The page lists the assertion consumer, logout callback and public metadata URLs.
Register `/_saml/config/<SAML_PROVIDER>` as the metadata endpoint where supported.
When `SAML_IDPSLO_REDIRECTURL` is configured, signing out a SAML user first obtains
a logout request, ends the local session, then navigates to the identity provider.
The callback accepts validated logout responses; IdP-initiated logout requests
are not supported. Protocol validation uses the existing MIT-licensed node-saml
library. Metadata contains no private keys.

`SAML_MERGE_EXISTING_USERS` defaults to `false`. Enabling it allows SAML identities
to match existing non-SAML usernames, so use it only with a trusted, controlled
identity mapping. Its Admin Panel override follows the same precedence rules.

Configuration and route tests and Chromium settings tests cover this integration.
End-to-end interoperability with a live identity provider still requires testing.

### Linking existing accounts

With `SAML_MERGE_EXISTING_USERS=true`, a first SAML login can be linked to an
account that already exists, for example one provisioned by LDAP. The existing
account is found:

1. by `username` equal to the login name - the value of the
   `SAML_LOCAL_PROFILE_MATCH_ATTRIBUTE` attribute, else the `email` attribute,
   else an email-address NameID;
2. when no username matches and the login name IS the assertion's email (an
   email NameID, or `SAML_LOCAL_PROFILE_MATCH_ATTRIBUTE=email`), by that address
   among the accounts' **verified** emails.

Linking then requires ALL of these, and refuses otherwise:

- the account is not already bound to a SAML identity;
- the assertion has an `email` attribute (or an email-address NameID);
- the assertion has the attribute **`email_verified`** with the value `true`.
  SAML has no standard attribute for this - add it at the IdP (for example an
  F5 BIG-IP APM attribute statement) only if the IdP really verifies addresses;
- that same email is a verified email of the local account.

Each refusal writes its reason to the server log, e.g.
`wekan-accounts-saml: refused to link the SAML login of "jdoe" to existing
account "jdoe": assertion-has-no-email_verified=true attribute`. A missing
`email` or `email_verified` is also shown on the sign-in page, because the fix
is in the IdP configuration; a refusal caused by the local account's state keeps
the generic "SAML identity does not match this account" message.

These are deployment-specific settings, not defaults changed by the fix.
The local signed-response fixture and popup/UI tests do not validate a remote
installation's certificate, account mapping or IdP configuration.

**Sign in (user)**

1. On the sign-in page click **Sign In with SAML**.
2. Sign in at the identity provider.
3. The browser comes back to WeKan signed in. An error from the identity
   provider or from WeKan's checks is shown on the sign-in page.

## How the numbers are calculated

- **Request ID lifetime: 8 hours**
  (`requestIdExpirationPeriodMs: 8 * 60 * 60 * 1000` in
  `packages/wekan-accounts-saml/saml_server.js`): a response must
  answer a request WeKan made within that time (`validateInResponseTo:
  'always'`).
- **Replay guard**: each verified response ID is remembered for 8 hours, at
  most 10,000 of them (`packages/wekan-accounts-saml/responseReplay.js`), and a
  second use is refused.
- **Credential token**: used once; it is removed as soon as the sign-in page
  exchanges it.
- **Defaults**: `SAML_IDP_PROFILE=standard` (signed Response required,
  Assertion not), `SAML_LOGIN_FLOW=redirect`, `SAML_MERGE_EXISTING_USERS=false`,
  `SAML_IDENTIFIER_FORMAT=urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`.

## How it works in WeKan

The maintained implementation is in `packages/wekan-accounts-saml/`;
configuration is in `server/saml.js` and `models/lib/samlConfig.js`.

- [packages/wekan-accounts-saml/saml_server.js](../../../packages/wekan-accounts-saml/saml_server.js) -
  the `/_saml/authorize`, `/_saml/validate/<provider>`, `/_saml/logout/<provider>`
  and `/_saml/config/<provider>` routes, the node-saml instance and the login
  handler; [identity.js](../../../packages/wekan-accounts-saml/identity.js) -
  the subject binding and account linking;
  [responseReplay.js](../../../packages/wekan-accounts-saml/responseReplay.js) -
  the replay guard.
- [models/lib/samlConfig.js](../../../models/lib/samlConfig.js) - the settings,
  profiles and the refusal of a configuration requiring no signature;
  [server/saml.js](../../../server/saml.js) applies them.
- Tests: [tests/samlConfig.test.cjs](../../../tests/samlConfig.test.cjs),
  [tests/samlIdpProfile.test.cjs](../../../tests/samlIdpProfile.test.cjs),
  [tests/samlIdentityBinding.test.cjs](../../../tests/samlIdentityBinding.test.cjs),
  [tests/samlLogin.test.cjs](../../../tests/samlLogin.test.cjs),
  [tests/samlPopupErrors.test.cjs](../../../tests/samlPopupErrors.test.cjs),
  [tests/samlReplayBoundary.test.cjs](../../../tests/samlReplayBoundary.test.cjs),
  [tests/samlRoutes.test.cjs](../../../tests/samlRoutes.test.cjs).

### Sign-in does not finish (popup or redirect)

A successful IdP response still needs to pass WeKan validation and establish a
Meteor session. The response replay guard reads node-saml's string property
`profile.inResponseTo`; it must not call a nonexistent `getInResponseTo()` method.
The verified ID is consumed once. Missing IDs and replays remain rejected, and
`validateInResponseTo` stays `always`.

If the ACS rejects a response, its error reaches the sign-in page: in the
redirect flow when the browser comes back, in the popup flow through the
popup's error marker. No credential exchange is attempted for that failed
response. Error text is rendered as text, and cleared before the next attempt.

For an IdP that supplies a short account name in the `username` attribute and
an email address separately, set `SAML_LOCAL_PROFILE_MATCH_ATTRIBUTE=username`.
Enable `SAML_MERGE_EXISTING_USERS` only when intentionally linking the trusted
IdP identity to an existing local account; the default remains false. Keep the
client's `public.SAML_PROVIDER` consistent with the server's provider setting.
Verify the issuer/audience, ACS URL and assertion-signing public certificate.
A signature failure is distinct from a response-ID or account-conflict failure.

### Request correlation and replay protection

SAML login must start from WeKan's sign-in button. Responses require a live
`InResponseTo` request ID; unsolicited IdP-initiated assertions and replayed
responses are rejected. Signed responses still undergo node-saml signature,
time and audience checks. Authentication requests and replay protection are
process-local, so clustered instances require sticky routing for the login
handshake. See the [authentication boundary audit](../../Security/Authentication-Boundary-Audit-2026-09-27.md).

### Subject binding and upgrading existing accounts

SamlSubjectBleed (GHSA-966m-4qgp-j8w4) fixed username/email-based account
reassignment. Login now resolves the assertion's issuer, NameID, NameID format,
NameQualifier and SPNameQualifier before considering username. These values are
stored together when the account is created and cannot be replaced by a later
login. Use an IdP subject that is stable and never reassigned; transient NameIDs
are rejected. An email-address NameID is only as stable as the IdP's policy for
reassigning addresses. Attribute changes do not rename or merge existing accounts.

**Optional qualifiers:** a binding that has `issuer`, `nameID` and
`nameIDFormat` but no `nameQualifier` / `spNameQualifier` keys at all matches an
assertion whose qualifiers are empty, and the next successful login writes them
as empty strings. Before this, such a user was refused as
`account-already-bound-to-saml`. A missing qualifier never matches a non-empty
one, and a stored non-empty qualifier still has to match exactly.

**Upgrade:** older SAML records store NameID but not the issuer. They fail
closed, including with `SAML_MERGE_EXISTING_USERS=true`. Before restoring SAML
access, an administrator must independently verify the account owner's identity
with the IdP administrator, then populate `services.saml.issuer`, `nameID`,
`nameIDFormat`, `nameQualifier` and `spNameQualifier` from that verified identity
through a trusted server-side maintenance session. Missing optional fields use
an empty string. The issuer is the assertion issuer, **not** `SAML_ISSUER` (the
SP entity ID). Never copy these fields from an unverified login attempt or delete
the old binding to let the next claimant establish it. Back up the account first;
retain its existing ID, memberships and other services. Audit previously issued
sessions and email verification separately if account compromise is suspected.

New SAML email addresses are unverified unless the signed assertion explicitly
contains scalar `email_verified=true` (boolean true or XML string `true`). SAML
has no standard email-verification claim: configure this attribute only when the
IdP actually verifies ownership. Opt-in linking to a non-SAML account also
requires that exact email already be verified locally. A username match alone
is insufficient, and enabling merging never replaces an existing SAML binding.
Concurrent links use a conditional write so only the first binding succeeds.

Conflicting identity attempts are summarized as **SamlSubjectBleed** in Admin
Panel / Problems through the shared security logger. A logger failure cannot
permit login. Incomplete legacy bindings are refused without recording an attack,
because an ordinary login after upgrade reaches that path. Tests cover signed assertions sharing an email but carrying
different NameIDs, repeat login, changed attributes, qualifiers, legacy records,
verification flags and concurrent changes. The browser regression includes the
same signed-assertion conflict; running it requires the Meteor browser test stack.

## Integration tests

See [local login protocol tests](Testing.md) for example identities, actual
request/response checks, failure cases and deployment limitations.

## Commits

 - [SAML logins are verified by @node-saml/node-saml 5.2.0](https://github.com/wekan/wekan/commit/5c50f38e25003e8affaf97a9ca2519a60adb0aee)
 - [Log in a SAML binding that lacks the optional qualifiers](https://github.com/wekan/wekan/commit/9949bca0b974c4d603881f5f27fcbf0386ebd84c)
 - [Explain why SAML could not link an existing account, and find it by email](https://github.com/wekan/wekan/commit/a9c75efe60a55043bc055d4a834e9a24ff008635)
 - [Defer the SAML dependencies until first use](https://github.com/wekan/wekan/commit/2b8a4a234f1d5c00897905147b540f2dbbe13964)
 - [Log in by full-page redirect by default](https://github.com/wekan/wekan/commit/ad51a03731ed2daf039204ccc7423dd05b3c9506)
 - [Bind SAML accounts to immutable assertion subjects (SamlSubjectBleed)](https://github.com/wekan/wekan/commit/c0c6aa5414fd9fa28cef07ea89908670c424e2e9)
 - [Choose which SAML signatures are required](https://github.com/wekan/wekan/commit/d6503b43f5beed6a9587d1eec5ae9def9b9af24e)
 - [Fix SAML response correlation and show popup failures](https://github.com/wekan/wekan/commit/3578e3ef84c8cd86a5db628d18823ac3d47c9eaf)
 - [Prevent SAML replay](https://github.com/wekan/wekan/commit/679a8b349960a64f03eabb9ae3c24d115be8915a)
 - [SAML administration, metadata and service-provider logout](https://github.com/wekan/wekan/commit/05f1f0a032110dcdd06a355f6ffcc7135cc489e4)
 - [Verify the SAML exchange against a local identity server and fix it](https://github.com/wekan/wekan/commit/4f7d28637e3c68d20c8c8462dfaea1289210c861)
 - [The first CAS and SAML settings](https://github.com/wekan/wekan/commit/214c86cc22f4c721a79ec0a4a4f3bbd90d673f93)
