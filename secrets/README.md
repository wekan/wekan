# Wekan Docker Compose Secrets

This directory contains example secret files for Wekan Docker Compose deployment. These files should be used instead of environment variables for better security and GitOps compatibility.

## Secret Files

- `ldap_auth_password.txt` - LDAP authentication password
- `oauth2_secret.txt` - OAuth2 secret key
- `mail_service_password.txt` - Mail service password
- `mongo_password.txt` - MongoDB password
- `s3_secret.txt` - S3 configuration (JSON format)

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
