[2022 KEYCLOAK CERTIFICATE FIX HERE](https://github.com/wekan/wekan/issues/4525)

[Somebody got Keycloak working](https://github.com/wekan/wekan/issues/3277#issuecomment-696333794)

NOTE: Is that preffered_username setting wrong? Correct settings should be for OIDC login:

```
sudo snap set wekan oauth2-username-map='email'

sudo snap set wekan oauth2-email-map='email'
```

[Outstanding Bug](https://github.com/wekan/wekan/issues/1874#issuecomment-460802250): Create the first user (admin) with the regular process.  Then the remaining users can use the Register with OIDC process.

Keycloak settings: [realm-export.zip](https://wekan.fi/keycloak/realm-export.zip)

[Keycloak at Docker Hub](https://hub.docker.com/r/jboss/keycloak)

Environment Variables that need to be set in your Wekan environment:

> When creating a Client in keycloak, ensure the access type is confidential under the settings tab.  After clicking save, you will have a Credentials tab.  You can retrieve the secret from that location.

## Snap
Copy below commands to `auth.sh` textfile, make it executeable `chmod +x auth.sh` and run it with `./auth.sh`.
```
sudo snap set wekan oauth2-enabled='true'
sudo snap set wekan oauth2-client-id='<Keycloak create Client ID>'
sudo snap set wekan oauth2-secret='<Keycloak Client secret>'
sudo snap set wekan oauth2-server-url='<Keycloak server name>/auth'
sudo snap set wekan oauth2-auth-endpoint='/realms/<keycloak realm>/protocol/openid-connect/auth'
sudo snap set wekan oauth2-userinfo-endpoint='/realms/<keycloak realm>/protocol/openid-connect/userinfo'
sudo snap set wekan oauth2-token-endpoint='/realms/<keycloak realm>/protocol/openid-connect/token'
sudo snap set wekan oauth2-id-map='preferred_username'
sudo snap set wekan oauth2-username-map='preferred_username'
sudo snap set wekan oauth2-fullname-map='given_name'
sudo snap set wekan oauth2-email-map='email'
```
### Debugging, if Snap OIDC login does not work
```
sudo snap set wekan debug='true'
```
Click Oidc button. Then:
```
sudo snap logs wekan.wekan
sudo systemctl status snap.wekan.wekan
```

## Docker

[docker-compose.yml](../../../docker-compose.yml)
```
- DEBUG=true
- OAUTH2_ENABLED=true
- OAUTH2_CLIENT_ID=<Keycloak create Client ID>
- OAUTH2_SERVER_URL=<Keycloak server name>/auth
- OAUTH2_AUTH_ENDPOINT=/realms/<keycloak realm>/protocol/openid-connect/auth
- OAUTH2_USERINFO_ENDPOINT=/realms/<keycloak realm>/protocol/openid-connect/userinfo
- OAUTH2_TOKEN_ENDPOINT=/realms/<keycloak realm>/protocol/openid-connect/token
- OAUTH2_LOGOUT_ENDPOINT=/realms/<keycloak realm>/protocol/openid-connect/logout
- OAUTH2_SECRET=<keycloak client secret>
- OAUTH2_ID_MAP=preferred_username
- OAUTH2_USERNAME_MAP=preferred_username
- OAUTH2_FULLNAME_MAP=given_name
- OAUTH2_EMAIL_MAP=email
```

### Log Out redirects to the Keycloak home page (issue #6158)

With autologin (`OIDC_REDIRECTION_ENABLED=true`), clicking **Log Out** used to
redirect to the Keycloak server home page, which shows an error page for
non-admin users. Set `OAUTH2_LOGOUT_ENDPOINT` to Keycloak's end_session endpoint
so Wekan performs an OIDC RP-initiated logout: it ends the Keycloak session and
returns the user to Wekan (your `ROOT_URL`) via `post_logout_redirect_uri`.

In the Keycloak client settings, add your Wekan `ROOT_URL` (for example
`https://kanban.company.com`) to **Valid post logout redirect URIs** (Keycloak 18+),
otherwise Keycloak rejects the redirect back to Wekan.
### Debugging, if Docker OIDC login does not work
```
docker logs wekan-app
```