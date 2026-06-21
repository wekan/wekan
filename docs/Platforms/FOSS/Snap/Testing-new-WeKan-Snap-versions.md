Please:
- Test does WeKan on some non-stable channel work, [add a new issue](https://github.com/wekan/wekan-snap/issues) about can it be added to stable channel.
- Check [is there PR about fixing some bug already](https://github.com/wekan/wekan/pulls)
- Please report bugs [by adding a new issue](https://github.com/wekan/wekan-snap/issues).
- Make backups first, so you are not using your only copy of production data
- Have time to test
- Have enough disk space. For example, some update migration could write all attachments from database to some subdirectory of `/var/snap/wekan/common` or `/var/snap/wekan-gantt-gpl/common`.
- You can try bleeding edge versions of Wekan Snap, that contains cool new features, and could be broken in many ways.
- Sometimes Snap builds fail, so then there is no package file to upload to Snap store at all, only successfully built are visible at Snap store. Successfully built does not mean that every feature works.

[Changing between WeKan and WeKan Gantt GPL](https://github.com/wekan/wekan/issues/2870#issuecomment-721364824)

## 1) Stop WeKan

```
sudo snap stop wekan
```
or 
```
sudo snap stop wekan-gantt-gpl
```

## 2) Create Backup

2.1 Backup settings:

```
sudo snap get wekan > snap-settings.txt
```
or
```
sudo snap get wekan-gantt-gpl > snap-settings.txt
```

2.2 [Backup](../../../Backup/Backup.md)

2.3 Copy files to safe place from /var/snap/wekan/common or /var/snap/wekan-gantt-gpl/common . There could be some board attachments etc.

## 3) Check what is available at various channels

https://snapcraft.io/wekan

https://snapcraft.io/wekan-gantt-gpl

- Stable: Current working version
- Beta: Maybe work, or not
- Edge: Newest that did build, no idea does it work or not

This is how you can try snap beta channel:
```
sudo snap refresh wekan --beta --amend
```
This is how to change back to snap stable channel, that most Wekan users have installed:
```
sudo snap refresh wekan --stable --amend
```
Wekan stable versions are numbered v1.x

## 4) Update all Snaps to newest on that channel

[Check you don't have Snap updates disabled](Automatic-update-schedule.md#if-required-you-can-disable-all-snap-updates)

```
sudo snap refresh

```

## 5) Start WeKan

```
sudo snap stop wekan
```
or 
```
sudo snap stop wekan-gantt-gpl
```

## Other docs

* [Adding Snap settings to code](../../../DeveloperDocs/Adding-new-Snap-settings-to-code.md)
* [Wekan Developer Docs](../../../DeveloperDocs/Developer-Documentation.md)
