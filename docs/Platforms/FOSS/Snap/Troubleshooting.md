[Info source](https://github.com/wekan/wekan-snap/issues/4#issuecomment-311355296)

1) All you need to do is

```
$ snap install wekan
```

2) Enable/disable is not needed, it is there for cases when for example you want to stop wekan, but do not want to uninstall it (uninstall will delete also all user data)

3) Wekan is service, so apart of help, it does not have any "user executables"

4) You can check status of wekan with:

```
$ sudo systemctl status snap.wekan.*
```

there should be two services, mongodb and wekan running, of either of them is showing error, that would be place to look first. To get detailed look, use

```
$ sudo journalctl -u snap.wekan.*
```

or detailed look of one of services:

```
$ sudo journalctl -u snap.wekan.wekan.service
```

or

```
$ snap.wekan.mongodb.service
```

5) Content interface for mongodb (wekan:mongodb-slot, wekan:mongodb-plug) is there only for more complex cases where for reason you want to:

a) share wekan's mongodb instance with other services, use wekan:mongodb-slot

b) you want to use mongodb instance from some other service, use wekan:mongodb-plug
so connecting wekan:mongodb-plug to wekan:mongodb-slot really makes no sense :)

As @xet7 suggested, first thing to make sure is that update your machine, so you are running up to date snapd. You can check your version with

```
$ snap version
```

Currently we are on 2.26

Otherwise shared folders are created under:

```
/var/snap/wekan/current where writable data lives
```

Databases and other settings live under:

```
/var/snap/wekan/common/
/snap/wekan/current is read only mount of squashfs wekan's image.
```

[Troubleshooting Email](https://github.com/wekan/wekan/wiki/Troubleshooting-Mail)