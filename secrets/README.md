# Wekan Docker Compose Secrets

This directory contains example secret files for Wekan Docker Compose deployment. These files should be used instead of environment variables for better security and GitOps compatibility.

## Secret Files

WeKan reads these itself, at each login, so the password is never put in an
environment variable:

- `LDAP_AUTHENTIFICATION_PASSWORD_FILE` - `ldap_auth_password.txt`, the LDAP
  search user's password
- `OAUTH2_SECRET_FILE` - `oauth2_secret.txt`, the OAuth2 / OpenID Connect
  client secret
- `OAUTH_<PROVIDER>_SECRET_FILE` - the secret of a Meteor accounts login
  provider; `<PROVIDER>` is one of `GOOGLE`, `GITHUB`, `FACEBOOK`, `TWITTER`,
  `METEOR_DEVELOPER`, `WEIBO`, `MEETUP` (see
  `docs/Features/Login/OAuth-Providers.md`)

The variable itself (for example `LDAP_AUTHENTIFICATION_PASSWORD`) wins over its
file when both are set, and a value saved in Admin Panel / People wins over
both. One trailing line break in the file is ignored; every other character is
part of the password. Admin Panel / People shows when the password comes from
the file, and when the file cannot be read.

Not read by WeKan yet: `MAIL_SERVICE_PASSWORD_FILE` (`mail_service_password.txt`),
`MONGO_PASSWORD_FILE` (`mongo_password.txt`) and `S3_SECRET_FILE`
(`s3_secret.txt`). The examples below still show where they would go.

On the snap, WeKan can read files under `/var/snap/wekan/common`, for example
`snap set wekan ldap-authentication-password-file='/var/snap/wekan/common/secrets/ldap_auth_password'`.

## Usage

1. Copy the example files and replace the placeholder values with your actual secrets
2. Update your `docker-compose.yml` to use the `_FILE` environment variables
3. Ensure the secret files are properly secured with appropriate file permissions

## Security Notes

- Never commit actual secret values to version control
- Set appropriate file permissions (e.g., `chmod 600 secrets/*.txt`)
- Consider using a secrets management system in production
- The secret files are mounted as read-only in the container

## Docker Compose Configuration

Example configuration in `docker-compose.yml`:

```yaml
services:
  wekan:
    environment:
      - LDAP_AUTHENTIFICATION_PASSWORD_FILE=/run/secrets/ldap_auth_password
      - OAUTH2_SECRET_FILE=/run/secrets/oauth2_secret
      - MAIL_SERVICE_PASSWORD_FILE=/run/secrets/mail_service_password
      - MONGO_PASSWORD_FILE=/run/secrets/mongo_password
      - S3_SECRET_FILE=/run/secrets/s3_secret
    secrets:
      - ldap_auth_password
      - oauth2_secret
      - mail_service_password
      - mongo_password
      - s3_secret

secrets:
  ldap_auth_password:
    file: ./secrets/ldap_auth_password.txt
  oauth2_secret:
    file: ./secrets/oauth2_secret.txt
  mail_service_password:
    file: ./secrets/mail_service_password.txt
  mongo_password:
    file: ./secrets/mongo_password.txt
  s3_secret:
    file: ./secrets/s3_secret.txt
```
