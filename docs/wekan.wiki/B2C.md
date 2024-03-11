## Azure AD B2C using OAuth2

- Original issue: https://github.com/wekan/wekan/issues/5242
- B2C feature added: https://github.com/wekan/wekan/commit/93be112a9454c894c1ce3146ed377e6a6aeca64a
- Similar like [ADFS](ADFS), but `email` is first of array `userinfo[emails]`

## Snap

```
sudo snap set wekan oauth2-enabled='true'
sudo snap set wekan oauth2-b2c-enabled='true'
sudo snap set wekan oauth2-username-map='sub'
sudo snap set wekan oauth2-request-permissions='openid email profile'
sudo snap set wekan oauth2-client-id='xxxxxxxx'
sudo snap set wekan oauth2-secret='xxxxxxx'
sudo snap set wekan oauth2-server-url='https://B2C_TENANT_NAME.b2clogin.com/B2C_TENANT_NAME.onmicrosoft.com/B2C_POLICY_NAME'
sudo snap set wekan oauth2-auth-endpoint='/oauth2/v2.0/authorize'
sudo snap set wekan oauth2-token-endpoint='/oauth2/v2.0/token'
sudo snap set wekan oauth2-username-map='sub'
sudo snap set wekan oauth2-email-map='email'
sudo snap set wekan oauth2-fullname-map='name'
sudo snap set wekan oauth2-id-map='sub'
```

## Docker

https://github.com/wekan/wekan/blob/main/docker-compose.yml

```
      - OAUTH2_ENABLED=true
      - OAUTH2_B2C_ENABLED=true
      - OAUTH2_USERNAME_MAP=sub
      - OAUTH2_REQUEST_PERMISSIONS=openid email profile
      - OAUTH2_CLIENT_ID=xxxxxxxx
      - OAUTH2_SECRET=xxxxxxx
      - OAUTH2_SERVER_URL=https://B2C_TENANT_NAME.b2clogin.com/B2C_TENANT_NAME.onmicrosoft.com/B2C_POLICY_NAME
      - OAUTH2_AUTH_ENDPOINT=/oauth2/v2.0/authorize
      - OAUTH2_TOKEN_ENDPOINT=/oauth2/v2.0/token
      - OAUTH2_USERNAME_MAP=sub
      - OAUTH2_EMAIL_MAP=email
      - OAUTH2_FULLNAME_MAP=name
      - OAUTH2_ID_MAP=sub
```

## Others

Similar like above Docker.