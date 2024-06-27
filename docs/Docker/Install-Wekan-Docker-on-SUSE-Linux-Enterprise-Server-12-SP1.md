More complete Docker info at:

* [Docker](Docker)

Tested to work on AWS cloud:

```
ec2-user@ip:~> cat /etc/os-release
NAME="SLES"
VERSION="12-SP1"
VERSION_ID="12.1"
PRETTY_NAME="SUSE Linux Enterprise Server 12 SP1"
ID="sles"
ANSI_COLOR="0;32"
CPE_NAME="cpe:/o:suse:sles:12:sp1"
```

As root:

1) Install all updates and Docker (recommended):

```
zypper update
zypper in docker
```

2) Start editing textfile to add rights for Docker to access network:

```
vi /etc/sysconfig/SuSEfirewall2
```

3) In that textfile change FW_ROUTE line to this and save:

```
FW_ROUTE="yes"
```

4) Add rights to use docker as another user, examples: ec2-user, virtual

```
/usr/sbin/usermod -a -G docker ec2-user
```

5) Start Docker and enable it on booting

```
systemctl start docker
chkconfig docker on
```

6) Reboot so updates and firewall changes start working:

```
reboot
```

7) As normal user (examples: ec2-user, virtual) (root works still too), install MongoDB and Wekan, you can change 8080 to be another port:

```
docker run -d --restart=always --name wekan-db -v /volume1/docker/wekan/wekan-db:/data/db mongo:3.2.12

docker run -d --restart=always --name wekan --link "wekan-db:db" -e "MONGO_URL=mongodb://db" -e "ROOT_URL=http://localhost:8080" -p 8080:80 wekanteam/wekan:meteor-1.4
```

8) Now Wekan is available at http://ip-address:port , for example: http://192.168.100.50:8080 . Wekan starts at boot, and restarts on error conditions.
