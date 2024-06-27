Related SAML code, not in WeKan yet: https://forums.meteor.com/t/what-are-you-working-on/59187

[SAML Issue](https://github.com/wekan/wekan/issues/708)

[SAML settings commit](https://github.com/wekan/wekan/commit/214c86cc22f4c721a79ec0a4a4f3bbd90d673f93)

Currently has code from https://github.com/steffow/meteor-accounts-saml/ copied to `wekan/packages/meteor-accounts-saml`

Does not yet have [fixes from RocketChat SAML](https://github.com/RocketChat/Rocket.Chat/tree/develop/app/meteor-accounts-saml)

Please add pull requests if it does not work.

Wekan clientside code is at `wekan/client/components/main/layouts.*`

Wekan serverside code is at:
- `wekan/server/authentication.js` at bottom
- `wekan/packages/meteor-accounts-saml/*`