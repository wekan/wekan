## ADFS 4.0 using OAuth 2 and OpenID

[Related issue](https://github.com/wekan/wekan/issues/3184)

There is these settings.

## Snap
```
sudo snap set oauth2-enabled='true'
sudo snap set oauth2-adfs-enabled='true'
```
Unset:
```
sudo snap unset oauth2-enabled
sudo snap unset oauth2-adfs-enabled
```
## Docker and .sh/.bat
```
OAUTH2_ENABLED=true
OAUTH2_ADFS_ENABLED=true
```
To disable, uncomment or remove that line.
