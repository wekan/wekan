https://github.com/wekan/wekan-snap/wiki/Many-Snaps-on-LXC#lxd-init-cidr

# NEW WAY: Parallel Snap Installs

Note: This presumes that your laptop runs newest Ubuntu or Kubuntu, and that server is Ubuntu.

1) Install Caddy2 https://github.com/wekan/wekan/wiki/Caddy-Webserver-Config

2) Optional, recommended: Encrypted VM. Idea: Bare Metal Caddy => Proxy to encrypted VM ports => Each customer separate Snap WeKan port. Snap sandbox files at /common, snap code can not access files outside of it's /common directories. Newest WeKan is Snap Candidate. Snap has automatic updates.

2.1) If your server has additional harddrives, format them:

```
ls /dev
mkfs.ext4 /dev/nvme0n1
```
2.2) Look at that above command text output, what is created disk UUID. Add those to /etc/fstab:
```
UUID=12345-678-90	/data	ext4	errors=remount-ro	0	1
```
2.3) Create directories for mounting disk, and mount all drives:
```
sudo su
cd /
mkdir /data
mount -a
```
2.4) Install to your laptop and bare metal server packages for using remote desktop with KVM:
```
sudo apt install virt-manager qemu-system
```
2.5) Check that you can ssh to server with ssh public key as root. For that, create ssh key on your laptop, press enter many times until it's done:
```
ssh-keygen
```
2.6) copy laptop .ssh/id_rsa.pub content to server /root/.ssh/authorized_keys .

2.7) At server disable password login at /etc/ssh/sshd_config , password login enabled false. And `sudo systemctl restart ssh`

2.8) At your laptop edit .ssh/config , there add your server IP address etc. This server here is named x1.

```
Host x1
  Hostname 123.123.123.123
  User root
  IdentityFile ~/.ssh/id_rsa
```

2.9) Check that you can ssh from laptop to server as root without prompts.

2.10) Start virt-manager GUI at your laptop:

- File / Add connection
- Hypervisor: QEMU/KVM
- [X] Connect to remote host via SSH
- Username: root
- Machine name: x1
- Connect automatically: [X]
- Click [Connect]

2.11) AT SERVER: Create harddrive image: `qemu-img create -f qcow2 web.qcow2 700G`

2.12) Download newest Kubuntu desktop iso with wget. 

2.13) Install kubuntu with full disk encryption. Modify amount of RAM (here 32 GB), file locations etc. Do not select to allocate encrypted disk image immediately, let image size grow.

2.14) Create growing disk with max size:
```
qemu-img create -f qcow2 web.qcow2 700G
```
2.15) Start install from .iso image. Here RAM -r 32 GB, name web, change disk and iso locations below, vcpu 20 (check your server with nproc, should be less that all):
```
sudo virt-install -r 32000 -n web --os-type=linux --os-variant=ubuntu16.04 \
--disk /data/VMs/web.qcow2,device=disk,format=qcow2 \
-c /data/VMs/iso/kubuntu-22.10-desktop-amd64.iso \
--vcpus=20 --vnc --noautoconsole
```
It will appear to your laptop virt-manager GUI.

If you have shutdown KVM VM, you can start it from virt-manager, or this way without .iso image:
```
sudo virt-install -r 32000 -n web --boot hd --video=vga --os-type=linux --os-variant=ubuntu16.04 \
--disk /data/VMs/web.qcow2,device=disk,format=qcow2 \
--vcpus=20 --vnc --noautoconsole
```

3) Use Parallel Snap installs https://snapcraft.io/docs/parallel-installs

For example:
```
sudo snap set system experimental.parallel-instances=true
```

4) With newest WeKan Candidate like https://github.com/wekan/wekan-snap/wiki/CentOS8 . Note: Each user has different wekan port and mongodb port.
```
sudo snap install wekan --channel=latest/candidate
sudo snap install wekan wekan_customer1 --channel=latest/candidate
sudo snap disable wekan
sudo snap set wekan_customer1 caddy-enabled='false'
```
Check that each WeKan uses candidate:
```
sudo snap list
```
If not, change to candidate:
```
sudo snap refresh wekan_customer1 --channel=latest/candidate
```
If it complains about old database version (was at stable), stop it, move old files somewhere safe, and start again.
WARNING: this deletes 
```
sudo su
mkdir old_customer1_common
snap stop wekan_customer1
mv /var/snap/wekan_customer1/common/* old_customer1_common/
snap start wekan_customer1
```

5) Add some settings, for example Google login and [AWS SES email sending](https://github.com/wekan/wekan/wiki/Troubleshooting-Mail#example-aws-ses):

For each customer, node and mongodb needs to be in different ports, for example:
```
sudo snap set wekan_customer1 port='5001'
sudo snap set wekan_customer1 mongodb-port='25001'
sudo snap set wekan_customer2 port='5002'
sudo snap set wekan_customer2 mongodb-port='25002'
```
For customer1:
```
sudo snap set wekan_customer1 port='5001'
sudo snap set wekan_customer1 mongodb-port='25001'
sudo snap set wekan_customer1 root-url='https://wekan.customer1.com'
sudo snap set wekan_customer1 mail-url='smtp://username:password@email-smtp.eu-west-1.amazonaws.com:587?tls={ciphers:"SSLv3"}&secureConnection=false'
sudo snap set wekan_customer1 mail-from='Wekan Customer1 Support <board@customer1.com>'
sudo snap set wekan_customer1 oauth2-auth-endpoint='https://accounts.google.com/o/oauth2/v2/auth'
sudo snap set wekan_customer1 oauth2-client-id='YOUR-GOOGLE-LOGIN-CLIENT_ID.apps.googleusercontent.com'
sudo snap set wekan_customer1 oauth2-secret='YOUR-GOOGLE-LOGIN-SECRET'
sudo snap set wekan_customer1 oauth2-email-map='email'
sudo snap set wekan_customer1 oauth2-enabled='true'
sudo snap set wekan_customer1 oauth2-fullname-map='name'
sudo snap set wekan_customer1 oauth2-id-map='sub'
sudo snap set wekan_customer1 oauth2-request-permissions='openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
sudo snap set wekan_customer1 oauth2-token-endpoint='https://oauth2.googleapis.com/token'
sudo snap set wekan_customer1 oauth2-userinfo-endpoint='https://openidconnect.googleapis.com/v1/userinfo'
sudo snap set wekan_customer1 oauth2-username-map='nickname'
```
You can check with [nosqlbooster](https://github.com/wekan/wekan/wiki/Backup#using-nosqlbooster-closed-source-mongodb-gui-with-wekan-snap-to-edit-mongodb-database) that each database has correct data.

When restoring data, stop that wekan, and restore to that port, when you have subdirectory dump:
```
sudo snap stop wekan_customer2.wekan
mongorestore --drop --port 25002
sudo snap start wekan_customer2.wekan
```
If there is errors, try again without restoring indexes:
```
mongorestore --drop --noIndexRestore --port 25002
```
To empty database, use [mongodb shell](https://www.mongodb.com/try/download/shell):
```
mongosh --port 25002
show dbs
use wekan
db.dropDatabase()
```
To see is settings written correctly, use:
```
sudo snap get wekan_customer1
sudo snap get wekan_customer2
```
And that at `Caddyfile` each subdomain is proxied to correct port like 3001 etc.

And that if there is snap called wekan, it's not in use:
```
sudo snap disable wekan
```
or has different port:
```
sudo snap get wekan
sudo snap set wekan port='6001'
sudo snap set wekan mongodb-port='28001'
```

6) Example backup script, that backups MongoDB databases. Although, maybe files directories needed to be added too.

Note: Here customer1 likes to get backup copy of backups, so this copies customer1 backup to separate directory that is synced only to that customer with Syncthing. Via email was asked customer syncthing ID, and added sync.

Set it as executeable:
```
chmod +x backup.sh
```
To run it:
```
sudo su
cd backup
./backup.sh
```

Here is backup.sh, using [mongodb tools](https://www.mongodb.com/try/download/database-tools) for mongodump/mongorestore etc:
```
#!/bin/bash

# Backup all MongoDB databases from different ports.
# Note: You may need to check also is there files directory,
#       and also backup that, like /var/snap/wekan/common/files etc

function backup {
  cd /home/wekan/backup
  # >> /home/wekan/backup/backup-log.txt
  mkdir -p /home/wekan/backup/new/$1
  cd /home/wekan/backup/new/$1
  mongodump --port $2
  sudo snap get wekan_$1 > snap-settings.txt
  cd ..
  7z a $(date -u +$1-wekan-backup-%Y-%m-%d_%H.%M_UTC.7z) $1
  mkdir /home/wekan/$3
  chown wekan:wekan *.7z
  mv *.7z /home/wekan/$3/
  rm -rf $1
  cd /home/wekan/backup
}

function backupchat {
  cd /home/wekan/backup >> /home/wekan/backup/backup-log.txt
  mkdir -p /home/wekan/backup/new/$1 >> /home/wekan/backup/backup-log.txt
  cd /home/wekan/backup/new/$1 >> /home/wekan/backup/backup-log.txt
  mongodump >> /home/wekan/backup/backup-log.txt
  cd ..
  7z a $(date -u +$1-backup-%Y-%m-%d_%H.%M_UTC.7z) $1
  mkdir /home/wekan/$3
  chown wekan:wekan *.7z
  mv *.7z /home/wekan/$3/
  rm -rf $1
  cd /home/wekan/backup
}

# Syntax:
# backup customername port backupdir

function websync {
  # Backup WeKan Kanban Snaps to different Syncthing sync directories
  backup "customer1" "25001" "backup-wekan-customer1"
  backup "customer1" "25001" "websync"
  backup "customer2" "25002" "websync"
  backup "customer3" "25003" "websync"
  backup "customer4" "25004" "websync"
  backup "customer5" "25005" "websync"
  # Backup RocketChat Snap
  backupchat "chat" "27027" "websync"
  cd ~/websync
  ## backup the backup scripts
  # 7z a $(date -u +wekan-backup-scripts-%Y-%m-%d_%H.%M_UTC.7z) ~/backup
}

(websync) >> /home/wekan/backup/backup-log.txt 2>&1
```

7. At bare metal server is installed [Caddy2](https://github.com/wekan/wekan/wiki/Caddy-Webserver-Config).

Each customer has set in their nameserver to WeKan hosting server IP address:
```
A 123.123.123.123  
```
After that, when ping wekan.company1.com shows 123.123.123.123 correctly, it's possible to get
automatic Let's Encrypt SSL/TLS cert with Caddy2.

At encrypted KVM VM type `ip address`, it shows what is KVM VM internal IP address.

Caddy2 proxies with Let's Encrypt TLS HTTPS to encrypted VM HTTP IP address and port where WeKan (Node.js) is running.


/etc/caddy/Caddyfile . Examples when in /etc/caddy directory as root: `caddy start`, `caddy stop`, `caddy validate`, `caddy --help`
```
(redirect) {
        @http {
                protocol http
        }
        redir @http https://{host}{uri}
}

kanban.customer1.com {
        tls {
                alpn http/1.1
        }

        reverse_proxy 192.168.123.23:5001
}

kanban.customer2.com {
        tls {
                alpn http/1.1
        }

        reverse_proxy 192.168.123.23:5002
}
```
Other non-kanban examples:
```
# Static website that uses free CloudFlare TLS certificates
company.com {
        tls {
                load /data/websites/certificates/company
                alpn http/1.1
        }
        root * /data/websites/company.com
        file_server
}

# RocketChat
chat.company.com {
        tls {
                alpn http/1.1
        }

        reverse_proxy 192.168.123.23:3000
}

# Browseable files listing static website
files.company.com {
        tls {
                alpn http/1.1
        }
        root * /data/websites/files.company.com
        file_server browse
}
```

***

# OLD WAY: Many Snaps on LXC

## Fix: System does not fully support snapd

To server and LXC/LXD containers, install these packages:

```
sudo apt install libsquashfuse0 squashfuse fuse
```

Source: https://forum.snapcraft.io/t/system-does-not-fully-support-snapd/14767/11

## LXD init CIDR

IPv4 CIDR: 10.1.1.1/24

```
sudo apt install snapd

sudo reboot

sudo snap install lxd

lxd init

Would you like to use LXD clustering? (yes/no) [default=no]: 
Do you want to configure a new storage pool? (yes/no) [default=yes]: 
Name of the new storage pool [default=default]: 
Name of the storage backend to use (dir, lvm, btrfs, ceph) [default=btrfs]: dir
Would you like to connect to a MAAS server? (yes/no) [default=no]: 
Would you like to create a new local network bridge? (yes/no) [default=yes]: 
What should the new bridge be called? [default=lxdbr0]: 
What IPv4 address should be used? (CIDR subnet notation, “auto” or “none”) [default=auto]: 10.1.1.1/24
Would you like LXD to NAT IPv4 traffic on your bridge? [default=yes]: 
What IPv6 address should be used? (CIDR subnet notation, “auto” or “none”) [default=auto]:
Would you like the LXD server to be available over the network? (yes/no) [default=no]: 
Would you like stale cached images to be updated automatically? (yes/no) [default=yes]: 
Would you like a YAML "lxd init" preseed to be printed? (yes/no) [default=no]:
```
> The value you have specified is the “network address”, i.e “.0” is the network address of the subnet “10.1.1.0/24”. Instead you need to specify an IP in that network, such as “.1”, e.g. “10.1.1.1/24”

https://discuss.linuxcontainers.org/t/failed-lxd-init-what-is-cidr/7181/2

## 1) Main Snap on bare metal

[Install Wekan Snap](Install) to newest Ubuntu bare metal server. Snaps have automatic updates.

For example:
```
sudo apt-get install snapd
reboot
sudo snap install wekan
```
For Let's Encrypt SSL, like this to `/var/snap/wekan/common/Caddyfile`. We will be proxying to inside LXD container:
```
boards.example.com {
	tls {
	    alpn http/1.1
	}

	proxy / 10.10.10.231:3001 {
	  websocket
	  transparent
	}
}
```
For [CloudFlare SSL](https://github.com/wekan/wekan/wiki/Caddy-Webserver-Config), like this to `/var/snap/wekan/common/Caddyfile`:
```
http://boards.example.com https://boards.example.com {
	tls {
	    load /var/snap/wekan/common/certificates
	    alpn http/1.1
	}

	proxy / 10.10.10.231:3001 {
	  websocket
	  transparent
	}
}
```
## 2) New LXC container
So when I start new lxc container:
```
lxc launch images:ubuntu/20.04 lxccontainername
```
## 3) Snapd and Wekan
Then I go inside container and install snapd:
```
lxc exec lxccontainername -- /bin/bash
apt -y install snapd
reboot
lxc exec lxccontainername -- /bin/bash
snap install wekan
snap set wekan root-url='https://boards.example.com'
sudo snap set wekan port='3001'
sudo snap set wekan mail-from='Wekan Team Boards <info@example.com>'
sudo snap set wekan mail-url='smtps://username:password@email-smtp.eu-west-1.amazonaws.com:587'
ip address
exit
```
That `ip address` command does show current IP address of container, that you can then add to bare metal `/var/snap/wekan/common/Caddyfile`.

You can also add more lxc containers to different subdomains and proxy to them in main Caddyfile.

## 4) Some LXC commands

### New Ubuntu container
```
lxc launch images:ubuntu/20.04 lxccontainername
```
### Inside LXC container
```
lxc exec lxccontainername -- /bin/bash
```
### Running command in LXC
```
lxc exec lxccontainername -- apt install p7zip-full
```
### Limit RAM available to LXC
```
lxc config set lxccontainername limits.memory 4GB
```
### New Debian container
```
lxc launch images:debian/buster mydebiancontainername
```
### New CentOS 7 container
```
lxc launch images:centos/7/amd64 centos
```
### List containers
```
lxc list -cns
```
Result:
```
+---------------+---------+
|     NAME      |  STATE  |
+---------------+---------+
| mycontainer   | RUNNING |
+---------------+---------+
```
### Stop and delete container
```
lxc stop mycontainer
lxc delete mycontainer
```
