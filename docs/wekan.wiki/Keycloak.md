[2022 KEYCLOAK CERTIFICATE FIX HERE](https://github.com/wekan/wekan/issues/4525)

[Somebody got Keycloak working](https://github.com/wekan/wekan/issues/3277#issuecomment-696333794)

NOTE: Is that preffered_username setting wrong? Correct settings should be for OIDC login:

```
sudo snap set wekan oauth2-username-map='email'

sudo snap set wekan oauth2-email-map='email'
```

[Outstanding Bug](https://github.com/wekan/wekan/issues/1874#issuecomment-460802250): Create the first user (admin) with the regular process.  Then the remaining users can use the Register with OIDC process.

Keycloak settings: [realm-export.zip](https://wekan.github.io/keycloak/realm-export.zip)

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

[docker-compose.yml](https://github.com/wekan/wekan/blob/main/docker-compose.yml)
```
- DEBUG=true
- OAUTH2_ENABLED=true
- OAUTH2_CLIENT_ID=<Keycloak create Client ID>
- OAUTH2_SERVER_URL=<Keycloak server name>/auth
- OAUTH2_AUTH_ENDPOINT=/realms/<keycloak realm>/protocol/openid-connect/auth
- OAUTH2_USERINFO_ENDPOINT=/realms/<keycloak realm>/protocol/openid-connect/userinfo
- OAUTH2_TOKEN_ENDPOINT=/realms/<keycloak realm>/protocol/openid-connect/token
- OAUTH2_SECRET=<keycloak client secret>
- OAUTH2_ID_MAP=preferred_username
- OAUTH2_USERNAME_MAP=preferred_username
- OAUTH2_FULLNAME_MAP=given_name
- OAUTH2_EMAIL_MAP=email
```
### Debugging, if Docker OIDC login does not work
```
docker logs wekan-app
```