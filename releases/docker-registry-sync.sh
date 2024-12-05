#!/bin/bash

#sudo apt -y install skopeo

# WeKan
#skopeo copy docker://ghcr.io/wekan/wekan docker://quay.io/wekan/wekan
#skopeo copy docker://ghcr.io/wekan/wekan docker://wekanteam/wekan

# MongoDB
#skopeo copy docker://mongo docker://ghcr.io/wekan/mongo
#skopeo copy docker://mongo docker://quay.io/wekan/mongo

# PostgreSQL
#skopeo copy docker://postgres docker://ghcr.io/wekan/postgres
#skopeo copy docker://postgres docker://quay.io/wekan/postgres


# Ubuntu
#skopeo copy docker://ubuntu docker://ghcr.io/wekan/ubuntu
#skopeo copy docker://ubuntu docker://quay.io/wekan/ubuntu

#---------------------------------------------------------------

## OLD

# Wekan Gantt GPL
#skopeo copy docker://ghcr.io/wekan/wekan-gantt-gpl docker://quay.io/wekan/wekan-gantt-gpl
#skopeo copy docker://ghcr.io/wekan/wekan-gantt-gpl docker://wekanteam/wekan-gantt-gpl

#---------------------------------------------------------------

## Auth errors, no permission to copy from Docker Hub to other Docker registry
## to have a backup, in case some Docker registry not available.

# MariaDB
#skopeo copy docker://mariadb docker://ghcr.io/wekan/mariadb
#skopeo copy docker://mariadb docker://quay.io/wekan/mariadb
#
# Debian
#skopeo copy docker://debian docker://ghcr.io/wekan/debian
#skopeo copy docker://debian docker://quay.io/wekan/debian
#
# Alpine
#skopeo copy docker://alpine docker://ghcr.io/wekan/alpine
#skopeo copy docker://alpine docker://quay.io/wekan/alpine
#
