## Login with OIDC OAuth2 Oracle OIM, on premise identity manager

[Added with this commit](https://github.com/wekan/wekan/commit/ec8a78537f1dc40e967de36a02ea09cf7398318a), and after [added change that OAUTH2_REQUEST_PERMISSION can be set freely with environment variable](https://github.com/wekan/wekan/commit/1b429b3f99c32840ebb0ff9a29015aa8c28ec644) for what is required.

Here is a summary of code and changes by anonymous Wekan contributors and xet7:
- If the OAuth2 token doesn't contain the email address, Wekan raises an exception. The userinfo and servicedata were changed to avoid that.
- In the getToken function, OIM expects a POST request that contains OAUTH2_CLIENT_ID and OAUTH2_SECRET in its header. We fixed that.
- We also had to edit the app.js in order to put a custom "scope" value. But we think the target should be to be able to set this as an environment variable.
- There is a problem in the code when email is null or empty. I know it might not be null but we have some situation where it is. xet7 fixed it in above commit so that if email is missing, it takes that value from username. When logging into Wekan with OIDC, both username and email should be mapped to email.
- It was tested that with these changes, this works well.

### About settings

Other OIDC settings are similar like in this wiki OAuth2, Google, Azure etc settings. Both username and email should be mapped to email.

### Snap
```
sudo snap set wekan oracle-oim-enabled='true'
```
Unset Snap:
```
sudo snap unset wekan oracle-oim-enabled
```
### Docker
```
- ORACLE_OIM_ENABLED=true
```
