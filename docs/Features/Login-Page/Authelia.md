## Authelia login using OAuth2/OIDC

- Original issue: https://github.com/wekan/wekan/issues/4210
- [Authelia OpenID Connect introduction](https://www.authelia.com/integration/openid-connect/introduction/)
- [Authelia OpenID Connect clients configuration](https://www.authelia.com/configuration/identity-providers/openid-connect/clients/)
- [Authelia OpenID Connect provider configuration](https://www.authelia.com/configuration/identity-providers/openid-connect/provider/)

Authelia is a self-hosted authentication and single sign-on server that speaks
OpenID Connect (OIDC). Register Wekan as a client in Authelia's
`identity_providers.oidc.clients` configuration, using
`https://your-wekan.tld/_oauth/oidc` as the `redirect_uris` value, then point
Wekan at Authelia's OIDC endpoints below.

Authelia's discoverable endpoints (from
`https://auth.example.com/.well-known/openid-configuration`) are:
- `authorization_endpoint`: `/api/oidc/authorization`
- `token_endpoint`: `/api/oidc/token`
- `userinfo_endpoint`: `/api/oidc/userinfo`
- `jwks_uri`: `/jwks.json`

## Snap

```
sudo snap set wekan oauth2-enabled='true'
sudo snap set wekan oauth2-client-id='<Authelia client id>'
sudo snap set wekan oauth2-secret='<Authelia client secret>'
sudo snap set wekan oauth2-server-url='https://auth.yourserver.com'
sudo snap set wekan oauth2-auth-endpoint='/api/oidc/authorization'
sudo snap set wekan oauth2-userinfo-endpoint='/api/oidc/userinfo'
sudo snap set wekan oauth2-token-endpoint='/api/oidc/token'
sudo snap set wekan oauth2-id-map='sub'
sudo snap set wekan oauth2-username-map='preferred_username'
sudo snap set wekan oauth2-fullname-map='name'
sudo snap set wekan oauth2-email-map='email'
sudo snap set wekan oauth2-request-permissions='openid profile email'
```

## Docker

[docker-compose.yml](../../../docker-compose.yml)

```
      - OAUTH2_ENABLED=true
      - OAUTH2_CLIENT_ID=<Authelia client id>
      - OAUTH2_SECRET=<Authelia client secret>
      - OAUTH2_SERVER_URL=https://auth.yourserver.com
      - OAUTH2_AUTH_ENDPOINT=/api/oidc/authorization
      - OAUTH2_USERINFO_ENDPOINT=/api/oidc/userinfo
      - OAUTH2_TOKEN_ENDPOINT=/api/oidc/token
      - OAUTH2_ID_MAP=sub
      - OAUTH2_USERNAME_MAP=preferred_username
      - OAUTH2_EMAIL_MAP=email
      - OAUTH2_FULLNAME_MAP=name
      - OAUTH2_REQUEST_PERMISSIONS=openid profile email
```

In Authelia's client configuration, set `scopes` to at least `openid`,
`profile` and `email` so the `preferred_username`, `name` and `email` claims
are returned to Wekan, and set `authorization_policy` and `consent_mode` as
needed for your deployment.

Unlike Keycloak, Authelia does not implement OpenID Connect RP-Initiated
Logout 1.0 yet, so there is no `end_session_endpoint` to set as
`OAUTH2_LOGOUT_ENDPOINT` (see [Keycloak's logout
notes](./Keycloak/Keycloak.md#log-out-redirects-to-the-keycloak-home-page-issue-6158)
for what that setting does where a provider supports it). Leave
`OAUTH2_LOGOUT_ENDPOINT` unset for Authelia; "Log Out" in Wekan ends the Wekan
session only.

## Others

Similar like above Docker.
