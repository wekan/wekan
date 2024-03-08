If you have some users logging to your server, that don't have root access, and you want to limit snap to root user only, you can do the following:

## 1) Set snap refresh schedule, for example

```
sudo snap set core refresh.schedule=02:00-03:00
```

## 2) Set cron to limit permissions to root users after updates

For example, sudo to root, and edit root cron with nano:

```
sudo su
export EDITOR=nano
crontab -e
```

and add there that at 03:10 permissions are limited to root again:
```
10 3 * * * chmod og-rwx /usr/bin/snap
10 3 * * * chmod -R og-rwx /var/snap
```
You can see crontab syntax help at https://crontab.guru

`snap` is the command, and `/var/snap` is where data is stored.

## Future snap features for permissions

For more advanced user permission control in snap, sometime new features will be added:<br />
https://forum.snapcraft.io/t/multiple-users-and-groups-in-snaps/1461/3