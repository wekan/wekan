## How to enable it

WeKan has SP-initiated SAML 2.0 login, built on the actively-maintained,
MIT-licensed [`@node-saml/node-saml`](https://github.com/node-saml/node-saml)
library (it does all SAML protocol / XML-signature handling; WeKan only wires
it into Meteor's accounts system - see the `wekan-accounts-saml` package under
`packages/wekan-accounts-saml/`).

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
| `SAML_LOCAL_PROFILE_MATCH_ATTRIBUTE` | Assertion attribute to use as the WeKan username instead of the NameID/email. |
| `SAML_ATTRIBUTES` | Assertion attributes read for the local profile. |

The client opens a popup at `/_saml/authorize`, which redirects to the
identity provider (`SAML_ENTRYPOINT`); the IdP posts the signed assertion
back to `/_saml/validate` (WeKan's Assertion Consumer Service URL -
`<WeKan URL>/_saml/validate/<SAML_PROVIDER>`), which is registered as the
service's callback URL with the IdP. This mirrors the existing CAS
popup-based login flow (`packages/wekan-accounts-cas`).

## Admin Panel overrides and logout

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

## Related Meteor SAML code / prior art

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

## Gitea

- https://github.com/crewjam/saml
- https://github.com/go-gitea/gitea/pull/29403
- https://docs.gitea.com/enterprise/features/saml-auth

## Laravel

- https://github.com/24Slides/laravel-saml2

## ruby-saml/omniauth/RoR: Sign in as anyone: Bypassing SAML SSO authentication with parser differentials

- https://github.blog/security/sign-in-as-anyone-bypassing-saml-sso-authentication-with-parser-differentials/
- https://news.ycombinator.com/item?id=43349634
- https://github.com/github/securitylab



## Integration tests

See [local login protocol tests](Testing.md) for example identities, actual
request/response checks, failure cases and deployment limitations.
