# Upgrading

Newest WeKan uses MongoDB 6.0.3.

Current working way to upgrade is:

## Docker

1. Create Mongodump of your database like at [Backup page](https://github.com/wekan/wekan/wiki/Backup)
2. Use newest WeKan docker-compose.yml from https://github.com/wekan/wekan with WRITABLE_PATH setup to Rclone/MinIO like below this page
3. Mongorestore to MongoDB 6.0.3 database
4. Use WeKan Admin Panel `Move all attachments to filesystem` button to move all attachments to MinIO.
5. Create Mongodump, that this time does not have any attachments, and is much smaller.
6. Mongorestore to MongoDB 6.0.3 database.
7. Start WeKan.

## Snap

Similar Mongodump and Mongorestore above, with these info:
- https://github.com/wekan/wekan-snap/wiki/Candidate-WeKan-Snap-Manual-Upgrade
- https://github.com/wekan/wekan/issues/4780

# Introduction

With Rclone https://rclone.org , it's possible to use many cloud filesystems, like AWS S3, MinIO https://min.io , etc.

Newest WeKan has features to move files between MongoDB GridFS and filesystem.

Instead of filesystem, Rclone mounted cloud filesystem directory can be used, like MinIO.

## Screenshot 1: Move to filesystem button moves to cloud filesystem like MinIO. S3 button does not work yet.

Note: In some cases, only buttons `Move all attachments` at top are visible. In some other cases, there is more visible, like moving all attachments of board, etc, maybe when some have been already moved.

<img src="https://wekan.github.io/rclone/wekan-admin-panel.png" width="100%" alt="Wekan Admin Panel file move" />

## Screenshot 2: Files at MinIO after moving all to filesystem

<img src="https://wekan.github.io/rclone/minio1.png" width="100%" alt="MinIO 1" />

## Screenshot 3: Files at MinIO after moving all to filesystem

<img src="https://wekan.github.io/rclone/minio2.png" width="100%" alt="MinIO 2" />

## Rclone config

Create config for example with command:
```
rclone config
```
At S3 providers, there is MinIO at https://rclone.org/s3/#minio

`/root/.config/rclone/rclone.conf`

```
[aws]
type = s3
provider = AWS
access_key_id = ACCESS-KEY-HERE
secret_access_key = SECRET-KEY-HERE
region = eu-north-1
location_constraint = eu-north-1
acl = private

[minio]
type = s3
provider = Minio
access_key_id = ACCESS-KEY-HERE
secret_access_key = SECRET-KEY-HERE
endpoint = http://192.168.0.100:9000
acl = private
```
## Listing files with Rclone
```
rclone ls aws:

rclone ls minio:
```
## MinIO config

https://min.io

Running MinIO server binary, storing files at `/home/wekan/minio/data`
```
MINIO_ROOT_USER=admin MINIO_ROOT_PASSWORD=password ./minio server /home/wekan/minio/data --console-address ":9001"
```
Create bucket, access key, secret key. Then connect them with `mc` command installed from https://min.io website, here bucket wekan:
```
mc config host add wekan http://192.168.0.100:9000 ACCESS-KEY-HERE SECRET-KEY-HERE
```
## Snap
This uses minimal cache to make it work. Note that Rclone stays at foreground running, showing related messages, it does not daemonize to background.
```
sudo su

rclone mount minio:wekan/files /var/snap/wekan/common/files --vfs-cache-mode minimal
```
Sometimes it shows this kind of message:
```
2022/12/27 10:22:13 NOTICE: S3 bucket wekan path files: Streaming uploads using chunk size 5Mi will have maximum file size of 48.828Gi
```
## Docker

Rclone, short story:
```
sudo su

rclone mount minio:wekan/files /var/lib/docker/volumes/wekan_wekan-files/_data --vfs-cache-mode minimal
```
Longer story:

`docker-compose.yml` at https://github.com/wekan/wekan
```
- WRITABLE_PATH=/data
```
Docker volumes are there:
```
sudo ls /var/lib/docker/volumes/

wekan_wekan-db-dump
wekan_wekan-db 
wekan_wekan-files
```
Directories there are:
```
/var/lib/docker/volumes/_data/attachments
/var/lib/docker/volumes/_data/avatars
```
## Bundle or Source

Set `WRITABLE_PATH`like in Docker example above.

## Development

In Progress direct support without Rclone, if getting it working sometime.

Meteor-Files currently uses official AWS-SDK that does not yet directly support custom endpoint like MinIO:
- https://github.com/veliovgroup/Meteor-Files/issues/862
- https://github.com/veliovgroup/Meteor-Files/blob/master/docs/aws-s3-integration.md
- https://github.com/wekan/wekan/issues/142#issuecomment-1365249290

MinIO code examples:
- https://github.com/minio/minio-js/tree/master/examples

Related RocketChat docs about MinIO:
- https://docs.rocket.chat/guides/administration/admin-panel/settings/file-upload/minio
- https://github.com/RocketChat/Rocket.Chat/tree/develop/apps/meteor/app/file-upload
- https://github.com/RocketChat/Rocket.Chat/pulls?q=is%3Apr+minio+is%3Aclosed

Storage path during developing WeKan, for example:
```
./rebuild-wekan.sh

rclone mount minio:wekan/files /home/wekan/repos/wekan/.meteor/local/.build-garbage-uslyxi.uokel/programs --vfs-cache-mode minimal
```
