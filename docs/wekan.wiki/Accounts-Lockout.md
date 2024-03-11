## Brute force protection

For settings, see:
- Snap: `wekan.help | grep lockout`
- Docker: Search lockout from docker-compose.yml at https://github.com/wekan/wekan

[Removing lockout from users](https://github.com/wekan/wekan/issues/3306)

For UCS, it's UCS VM and inside it Docker container. You just ssh your ucs VM like this, with same username password you used when installin UCS and administering UCS apps, su to root:
```
ssh Administrator@192.168.0.100
su
```
And then use those Docker commands https://github.com/wekan/wekan/issues/3306#issuecomment-712743002