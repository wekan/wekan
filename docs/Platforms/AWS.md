[Scaling Meteor](https://medium.freecodecamp.org/scaling-meteor-a-year-on-26ee37588e4b)

## Production setup at AWS for thousands of users

* 3-4x m4.large for Node (ECS Cluster)
* 3x r4.large for Mongo (1 Primary for read and write, 2 replicas)

This setup runs very well for thousands of users.

To improve scalability even more, add [Redis Oplog support](https://github.com/cult-of-coders/redis-oplog), also see related [Redis Oplog discussion forum post](https://forums.meteor.com/t/meteor-scaling-redis-oplog-status-prod-ready/30855/479). At AWS you can use AWS ElastiCache that has Redis support.

### Mongo URL AND Oplog settings
From [comment at issue](https://github.com/wekan/wekan-mongodb/issues/2#issuecomment-378343587):
We've fixed our CPU usage problem today with an environment
change around Wekan. I wasn't aware during implementation
that if you're using more than 1 instance of Wekan
(or any MeteorJS based tool) you're supposed to set
MONGO_OPLOG_URL as an environment variable.
Without setting it, Meteor will perform a pull-and-diff
update of it's dataset. With it, Meteor will update from
the OPLOG. See here
https://blog.meteor.com/tuning-meteor-mongo-livedata-for-scalability-13fe9deb8908

After setting in [docker-compose.yml](https://github.com/wekan/wekan-mongodb/blob/master/docker-compose.yml):
```
MONGO_OPLOG_URL=mongodb://<username>:<password>@<mongoDbURL>/local?authSource=admin&replicaSet=rsWekan
```
the CPU usage for all Wekan instances dropped to an average
of less than 10% with only occasional spikes to high usage
(I guess when someone is doing a lot of work)
```
- MONGO_URL=mongodb://wekandb:27017/wekan
- MONGO_OPLOG_URL=mongodb://<username>:<password>@<mongoDbURL>/local?authSource=admin&replicaSet=rsWekan
```

If there is other ideas to improve scalability, add info to [existing scalability issue](https://github.com/wekan/wekan-mongodb/issues/2) or [scalability forum post](https://discourse.wekan.io/t/cpu-utilization-problems-with-large-userbase/579/15), there is also mentioned that smart-disconnect is already in Wekan.

For Enterprises using Wekan xet7 recommends participating in Wekan development, see [Benefits of contributing your features to Upstream Wekan](https://blog.wekan.team/2018/02/benefits-of-contributing-your-features-to-upstream-wekan/index.html), having your own developers working on Wekan daily, and using Commercial Support at https://wekan.team , as Wekan Team [already has access to high performance bare metal servers at CNCF / Packet for running high load testing](https://blog.wekan.team/2018/01/wekan-progress-on-x64-and-arm/index.html). With the benefits you get by using Wekan, it’s [time well spent](https://blog.wekan.team/2018/02/time-well-spent/index.html). Some [DTrace and eBPF info here](https://news.ycombinator.com/item?id=16375938).

## Single Server Install for small teams

1) Add AWS Security Group with for example name wekan, and incoming ports 80 and 443 for all. Only add ssh access to your own IP address CIDR like 123.123.123.123/32 so it means one IP address. 

2) Start Ubuntu 17.10 64bit EC2 instance that has at least 2 GB RAM, 30 GB diskspace, probably you need more when you add more customers. Add your SSH public key to instance or let it create new.

3) Add new Elastic IP address pointing to your EC2 instance. That way IP address stays same, and you can also make snapshot of EC2 instance and start that as new EC2 instance with more RAM and change Elastic IP to point to new EC2 instance with minimal downtime, but prefer times when there is no active changes to Wekan.

4) Set your subdomain.yourdomain.com address DNS pointing to your Elastic IP address as A record in Route 53, Namecheap or elsewhere where your domain control panel is. It will take max 24h for DNS to propagate globally.

5) ssh to your server, for example:

```
ssh -i pubkey.pem ubuntu@server-ip-address 

(or: root@)
```

6) Update all packages:

```
sudo apt update
sudo apt -y dist-upgrade
reboot
```

7) Install Docker CE and docker-compose for ubuntu from www.docker.com , also add user ubuntu to group docker in post-install step.

8) Install nginx, for example:

```
sudo apt install nginx
(or: nginx-full)
sudo systemctl start nginx
sudo systemctl enable nginx
```

[Example nginx config](Nginx-Webserver-Config)

Test nginx config with:

```
sudo nginx -t
```

And take config into use with:

```
sudo systemctl reload nginx
```

9) Install certbot from https://certbot.eff.org for Let's Encrypt SSL certs, redirect http to https

10) For different customers, you use different location /customer1 2 etc block and wekan running behind nginx proxy on different localhost port in same nginx virtualhost subdomain config file.

11) Get latest wekan release info from https://github.com/wekan/wekan/releases ,  read docker-compose.yml file from https://github.com/wekan/wekan-mongodb where all settings are explained, so you setup ROOT_URL=https://sub.yourdomain.com/customer1 and for example the 8080:80 for local server port 8080 to go inside docker port 80. 

For example Wekan v0.70, use in docker-compose.yml file:
image: quay.io/wekan/wekan:v0.70
Only use release version tags, because latest tag can be broken sometimes.

12) For email, in AWS SES add email address to domain, verify SPF and DKIM with Route53 wizard if you have domain at Route53 as I recommend. At SES create new SMTP credentials and [add them to docker-compose.yml SMTP settings](Troubleshooting-Mail)

13) Start wekan and mongodb database containers with command:

```
docker-compose up -d
```

So it goes nginx SSL port 443 => proxy to localhost port 8080 or any other => wekan-app port 80 inside docker

14) For different customers have different docker-compose.yml script in directories named by customer names. You may need to rename docker containers from wekan-app to wekan-customer1 etc, and probably also docker internal network names.

15) [Backup, restore, and moving data outside/inside docker](Export-Docker-Mongo-Data)

16) Register as user at https://subdomain.yourdomain.com/customer1/sign-up and login at https://subdomain.yourdomain.com/customer1/sign-in , first user will be admin. Click your username at top right corner / Admin Panel, and there chang settings to invite only.

## Upgrading Wekan

1) Go to directory where docker-compose.yml is, as in install step 14) , and create directory for backup

```
cd wekan-customer1
mkdir backup-2018-02-03
cd backup-2018-02-03
```

2) Make backup of database outside docker in that backup directory, as in install step 15)

3) Edit docker-compose.yml to have new Wekan release number:

```
image: quay.io/wekan/wekan:v0.71
```

4) Restart Wekan:

```
docker-compose stop
docker-compose start
```

5) Login to Wekan and check at Admin Panel that Wekan version is updated.

6) If version is not updated, you could also need some of these:

Seeing what Docker containers are running:
```
docker ps
```

Seeing what Docker images are installed:

```
docker images
```

Stopping containers (or start, if starting containers)

```
docker stop wekan-app
docker stop CONTAINER-ID-HERE
```

Removing containers:

```
docker rm wekan-app
docker rm CONTAINER-ID-HERE
```

Removing images:

```
docker rmi quay.io/wekan/wekan:latest
docker rmi quay.io/wekan/wekan:v0.70
```

Starting new containers from docker-compose.yml file:

```
docker-compose up -d
```

TODO:
- allow resend invites https://github.com/wekan/wekan/issues/1320
- changing logo everywhere, whitelabeling https://github.com/wekan/wekan/issues/1196
