# Login page

The sign-in, sign-up and forgot-password forms (`userFormsLayout` in
`client/components/main/layouts.jade`) and every way of signing in that they
offer. Which methods appear is set by the administrator in
[Admin Panel / People / Login](../Admin-Panel/People/Login.md); a method only
shows when it is configured.

## Signing in on the page

| Method | Guide | Implementation |
| --- | --- | --- |
| Password | [Forgot password](Forgot-Password.md), [password hashing](Password-Hashing.md), [disable password login](Disable-Password-Login.md) | `server/accounts-common.js` |
| Passkeys and Log out everywhere | [Passkeys](Passkeys.md) | `server/passkeys.js` |
| Two-factor (TOTP) | [Two-Factor Authentication](Two-Factor-Authentication.md) | Meteor `accounts-2fa`, `client/components/users/userHeader.jade` |
| One-time code by email | [Passwordless](Passwordless.md) | `server/lib/passwordlessTokenConsumption.cjs` |
| SQRL | [SQRL](SQRL.md) | `server/sqrl.js` |

## Identity providers

| Provider | Guide | Implementation |
| --- | --- | --- |
| OAuth2 / OIDC | [OAuth2](OAuth2.md), [autologin](autologin.md) | `packages/wekan-oidc`, `packages/wekan-accounts-oidc` |
| Google, GitHub, Facebook, Twitter, Meteor, Weibo, Meetup | [OAuth providers](OAuth-Providers.md), [Google login](Google-login.md), [Google Cloud](Google-Cloud.md) | `server/lib/oauthProviders.js` |
| OIDC examples | [ADFS](ADFS.md), [Apple](Apple.md), [Authelia](Authelia.md), [Azure](Azure/Azure.md), [B2C](B2C.md), [Keycloak](Keycloak/Keycloak.md), [Nextcloud](Nextcloud.md), [Oracle Identity Cloud](Oracle-Identity-Cloud.md), [Oracle OIM](Oracle-OIM.md), [Zitadel](Zitadel.md) | `packages/wekan-oidc` |
| LDAP / Active Directory | [LDAP](LDAP.md), [LDAP AD simple auth](LDAP-AD-Simple-Auth.md) | `packages/wekan-ldap`, `server/ldapGroupSync.js` |
| CAS | [CAS](CAS.md) | `packages/wekan-accounts-cas` |
| SAML | [SAML](SAML.md) | `packages/wekan-accounts-saml`, `server/saml.js` |
| Reverse-proxy header | [Header Login](Header-Login.md), [Let's Encrypt and Google Auth](Let's-Encrypt-and-Google-Auth.md) | `server/header-login.js` |
| Windows SSO (Kerberos / NTLM) | [Windows SSO](WindowsSSO.md) | `server/windowsSso.js` |

## Accounts and sessions

- [Brute force protection: accounts lockout](Accounts-Lockout.md) (`packages/wekan-accounts-lockout`)
- [Session cookies](Session-Cookies.md)
- [Adding users](Adding-users.md) and [impersonating a user](Impersonate-user.md)
- [Multitenancy](Multitenancy.md)
- [Testing login with local identity servers](Testing.md)
