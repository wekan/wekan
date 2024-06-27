## Repair Snap WeKan

```
sudo su

snap stop wekan

export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/snap/wekan/current/lib/x86_64-linux-gnu

export PATH="/snap/wekan/current/bin:$PATH"

mongod --dbpath "/var/snap/wekan/common" --repair >> /root/repairlog.txt

snap start wekan

exit
```

Logs from Snap:

https://github.com/wekan/wekan/issues/5073

## Repair Docker WeKan

At step 12 below is actual repair MongoDB command.

Some customer of [WeKan Commercial Support](https://wekan.team/commercial-support/) ordered restore and repair of WeKan MongoDB database at UCS appliance. This was needed when changing back to previous UCS 4.x major version, when in new major UCS 5.x version Docker containers were all the time crashing and restarting, or something else got broken. Here are commands that were used while repairing.

Similarly, MongoDB may require repair, if:
- MongoDB does not recover from sudden power failure cleanly
- Disk comes full, that is worst case. Recommended are daily backups, in this case sometimes repair does not work well enough.

1. SSH to UCS appliance as root:
```
ssh root@192.168.0.100
```
2. If backup or raw database files is at external USB harddrive, look where it is inserted:
```
ls /dev

fdisk -l /dev/sdb

fdisk -l /dev/sdc

fdisk -l /dev/sdd
```
2. If external USB drive has NTFS file format, and mount complains about not having NTFS support, install NTFS support to Linux:
```
apt install ntfs-3g
```
3. Mount USB drive to /mnt
```
mount /dev/sdd1 /mnt
```
4. Stop WeKan Docker containers. If copying raw database files, WeKan and MongoDB should not be running, so that MongoDB would not be even more corrupted. (If MongoDB is running, and you have mongodump backup, you can [Backup with mongorestore](Backup)
```
docker stop wekan-db wekan-app
```
5. Find WeKan database raw files. MongoDB has various database engines, like WiredTiger, how to save raw data compressed, or other formats. WiredTiger is file format to save compressed MongoDB data. Similar like MySQL has ISAM, InnoDB etc.
```
apt -y install mlocate
updatedb
locate WiredTiger.wt
```
It can show for example USB drive and Docker container directory:
```
root@ucs:/mnt/wekan/data/db# locate WiredTiger.wt
/mnt/wekan/data/db/WiredTiger.wt
/var/lib/univention-appcenter/apps/wekan/data/db/WiredTiger.wt
```
6. Change to newly installed MongoDB data directory:
```
cd /var/lib/univention-appcenter/apps/wekan/data/db/
```
7. Look at directory files owner permissions:
```
ls -lah
```
There could be like this:
```
-rw-r--r-- 1 tss  tss  1004 Jan 25 13:09 WiredTiger.turtle
-rw-r--r-- 1 tss  tss  392K Jan 25 13:09 WiredTiger.wt
```
8. Move that probably empty newly installed MongoDB data elsewhere:
```
mkdir /root/new-empty-wekan-data
mv * /root/new-empty-wekan-data
```
9. Copy MongoDB raw database files from USB harddrive to docker container directory:
```
root@ucs-bdc:/var/lib/univention-appcenter/apps/wekan/data/db# cp -pR /mnt/wekan/data/db/* .
```
10. Like looked at step 7, change file owner permissions to be correct, and change directory
```
chown -R tss:tss *
cd /root
```
11. Find mongod command:
```
locate /usr/bin/mongod
```
12. Repair Docker WeKan with version of Docker MongoDB that WeKan uses, change mongod path to below. Repairing logged to textfile.
```
root@ucs:~# /var/lib/docker/overlay2/7b58483a16a2f67ee50486c00ec669940f7a95d460ee8188966fee0096e81fa2/diff/usr/bin/mongod --dbpath "/var/lib/univention-appcenter/apps/wekan/data/db" --repair >> repairlog.txt
```
13. Look what containers are running:
```
docker ps
```
14. Look what containers are not running:
```
docker ps -a
```
15. Start MongoDB first:
```
docker start wekan-db
```
16. Look what happends at MongoDB container:
```
docker logs wekan-db
```
17. Start WeKan next.
```
docker start wekan-app
```
18. Look what happends at MongoDB container.
```
docker logs wekan-app
```
19. Check are both wekan-db and wekan-app containers running, and not restarting:
```
docker ps
```
20. Try to login to WeKan with webbrowser.
21. Backup WeKan database now after repair:
```
docker exec -it wekan-db bash
cd /data
rm -rf dump
mongodump
exit
docker cp wekan-db:/data/dump .
zip -r wekan-backup-YEAR-MONTH-DATE-TIME-HERE.zip dump
```
Now backup is at wekan-backup-YEAR-MONTH-DATE-TIME-HERE.zip file.

22. At your local computer terminal (not at UCS server), transfer file to your local computer with scp:
```
scp root@192.168.0.100:/root/wekan-backup-YEAR-MONTH-DATE-TIME-HERE.zip .
```
23. Copy backup to external USB harddrive, change YEAR-MONTH-DATE-TIME-HERE to current date and time:
```
cp /root/wekan-backup-YEAR-MONTH-DATE-TIME-HERE.zip /mnt/
```
24. Look what drives are mounted:
```
df -h
```
25. Sync and save unwritted data to disk, and unmount external USB harddrive safely:
```
sync
umount /dev/sdd1
```
26. Remove external USB harddisk from server.
27. Login to WeKan, check do all WeKan boards work. In this case, all did work.