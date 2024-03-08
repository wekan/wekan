Using CentOS 8 Stream.

1. Install Snap https://snapcraft.io/docs/installing-snap-on-centos

2. Reboot

3. With terminal, test latest release candidate, to your server IP address:

```
su
snap install wekan --channel=latest/candidate
snap set wekan root-url='http://YOUR-IP-ADDRESS'
snap set wekan port='80'
```

4. For additional server options, see https://github.com/wekan/wekan/wiki/Settings

5. For adding users, see https://github.com/wekan/wekan/wiki/Adding-users

6. For other login option, see right menu at https://github.com/wekan/wekan/wiki