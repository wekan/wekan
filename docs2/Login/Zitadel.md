## Zitadel login using OAuth2

- Original issue: https://github.com/wekan/wekan/issues/5250

## Snap

```
sudo snap set wekan oauth2-enabled='true'
sudo snap set wekan oauth2-b2c-enabled='true'
sudo snap set wekan oauth2-username-map='sub'
sudo snap set wekan oauth2-client-id='xxxxxxxx'
sudo snap set wekan oauth2-secret='xxxxxxx'
sudo snap set wekan oauth2-server-url='https://auth.yourserver.com'
sudo snap set wekan oauth2-auth-endpoint='/oauth/v2/authorize'
sudo snap set wekan oauth2-userinfo-endpoint='/oidc/v1/userinfo'
sudo snap set wekan oauth2-token-endpoint='/oauth/v2/token'
sudo snap set wekan oauth2-id-map='sub'
sudo snap set wekan oauth2-username-map='email'
sudo snap set wekan oauth2-email-map='email'
sudo snap set wekan oauth2-fullname-map='given_name'
sudo snap set wekan oauth2-request-permissions='openid email profile'
```

## Docker

https://github.com/wekan/wekan/blob/main/docker-compose.yml

```
      - OAUTH2_ENABLED=true
      - OAUTH2_CLIENT_ID=xxxxxxxx
      - OAUTH2_SECRET=xxxxxxxx
      - OAUTH2_SERVER_URL=https://auth.yourserver.com
      - OAUTH2_AUTH_ENDPOINT=/oauth/v2/authorize
      - OAUTH2_USERINFO_ENDPOINT=/oidc/v1/userinfo
      - OAUTH2_TOKEN_ENDPOINT=/oauth/v2/token
      - OAUTH2_ID_MAP=sub
      - OAUTH2_USERNAME_MAP=email
      - OAUTH2_EMAIL_MAP=email
      - OAUTH2_FULLNAME_MAP=given_name
      - OAUTH2_REQUEST_PERMISSIONS=openid profile email
```

## Others

Similar like above Docker.