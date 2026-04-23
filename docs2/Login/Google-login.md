### NOTE: BEFORE 2020-09-07 THERE WAS WRONG SETTING BELOW, IT CAUSED LOGIN WITH WRONG USER, YOU SHOULD FIX YOUR SETTINGS
### CORRECT SETTINGS ARE:
### snap set wekan oauth2-email-map='email'
### snap set wekan oauth2-username-map='email'

[Thanks to @mlazzje for this info below](https://github.com/wekan/wekan/issues/2527#issuecomment-654155289)

To create Google OAuth 2 credentials, you can follow this tutorial: https://developers.google.com/identity/sign-in/web/sign-in

Then replace `CLIENT_ID` and `CLIENT_SECRET` below.

The redirect URL is your Wekan root-url+_oauth/oidc like this: https://boards.example.com/_oauth/oidc

If you have existing password account, and would like to switch to Google auth account, you need to rename that username and email address, so you can autoregister with your Google auth email address. Then share your boards from password account to Google auth account and set that to Google auth user as BoardAdmin.

In your wekan config, you have to set the following information in snap:
```
sudo snap set wekan oauth2-enabled='true'
sudo snap set wekan oauth2-client-id='CLIENT_ID'
sudo snap set wekan oauth2-secret='CLIENT_SECRET'
sudo snap set wekan oauth2-auth-endpoint='https://accounts.google.com/o/oauth2/v2/auth'
sudo snap set wekan oauth2-token-endpoint='https://oauth2.googleapis.com/token'
sudo snap set wekan oauth2-userinfo-endpoint='https://openidconnect.googleapis.com/v1/userinfo'
sudo snap set wekan oauth2-id-map='sub'
sudo snap set wekan oauth2-email-map='email'
sudo snap set wekan oauth2-username-map='email'
sudo snap set wekan oauth2-fullname-map='name'
sudo snap set wekan oauth2-request-permissions='openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
```