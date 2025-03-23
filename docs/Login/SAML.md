Related Meteor SAML code, not in WeKan yet: 

- New: https://forums.meteor.com/t/meteor-and-saml/61561
- Old link: https://forums.meteor.com/t/what-are-you-working-on/59187

Sandstorm has SAML login, and old WeKan that will be updated someday:

- https://github.com/wekan/wekan/wiki/Sandstorm

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

Currently has code from https://github.com/steffow/meteor-accounts-saml/ copied to `wekan/packages/meteor-accounts-saml`

Does not yet have [fixes from RocketChat SAML](https://github.com/RocketChat/Rocket.Chat/tree/develop/app/meteor-accounts-saml)

Please add pull requests if it does not work.

Wekan clientside code is at `wekan/client/components/main/layouts.*`

Wekan serverside code is at:
- `wekan/server/authentication.js` at bottom
- `wekan/packages/meteor-accounts-saml/*`

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


