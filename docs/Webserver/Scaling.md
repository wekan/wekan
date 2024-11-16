## How We Scaled Meteor JS to Handle 30,000 Concurrent Users at Propiedata

- https://forums.meteor.com/t/first-steps-on-scaling-meteor-js/62570

## Meteor Galaxy Guide

- https://galaxy-guide.meteor.com/scaling

## Pods

Reply from customer at 2023-09-29 about WeKan v7.08:

> The good thing is that that new version is working really well and being able to spread the load between 4 OpenShift pods changes everything.

Maybe related to these improvements:
- https://github.com/wekan/wekan/pull/5136
- https://github.com/wekan/wekan/issues/5000

[Optimizing Nested Imports](https://zodern.me/posts/nested-imports/)

## Scaling [Wekan Snap with Automatic Updates](https://github.com/wekan/wekan-snap/wiki/Install)

Recommended specs:

- Try to add [Redis Oplog](https://github.com/cult-of-coders/redis-oplog) like [this](Emoji#how-you-could-add-another-plugin)
- One bare metal server (or VM on server that does not have oversubscription), for example [Fastest: UpCloud](https://upcloud.com), [Hetzner](https://www.hetzner.com/?country=en), [Packet](https://packet.com).
- NVME or SSD disk. Speed difference when opening Wekan board: SSD 2 seconds, HDD 5 minutes.
- Minimum 60 GB total disk space, 40 GB free disk space, [Daily Backups](Backup) to elsewhere, monitoring and alerting if server has low disk space, because disk full causes database corruption.
- Newest Ubuntu 64bit
- 4GB RAM minimum. See with `free -h` is server is using any swap. If it is, add more RAM.
- some performance optimized CPUs/cores. 2 minimum, 4 is better. See with `nproc` how many CPUs you have. Look with `top` or `htop` is server using max 100% CPUs, if it is, add higher performance optimized CPUs (or more CPUs). But if it looks like Wekan not using some of those added CPUs, then adding more CPUs is not useful.
- Do not store attachments at database, like uploading file to card. Have markdown links to files, like `[Document](https://example.com/files/document.doc)`. Click `Wekan board` => `☰` => `⚙` => `Board Settings` => `Card Settings`. There uncheck `[_] Attachments` to hide attachments at card.
- Click Wekan `Admin Panel / Settings / Accounts / Hide System Messages of All Users`. If someone needs to show system messages, they can click slider at opened card to show them. Sometime later, if many have manually enabled showing system messages, click that same button at Admin Panel again.
- Check Webhooks: Do you have `Admin Panel / Settings / Global Webhooks` (that sends most board actions to webhook) or at each board, per-board webhooks (that sends most one board actions to webhook, more info at [wiki right menu Webhooks](https://github.com/wekan/wekan/wiki)) at `Wekan board` => `☰` => `⚙` => `Outgoing Webhooks`. You also see this with [DBGate](Backup#dbgate-open-source-mongodb-gui) at port localhost:27019 / database: wekan / table: integrations. Each webhook should [immediately return 200 response before processing any data](https://github.com/wekan/wekan/issues/3575), because otherwise it will slow down Wekan a lot.
- In future Wekan version will be added as default:
  - [Setting `NODE_OPTIONS: --max_old_space_size=4096`](https://github.com/wekan/wekan/issues/3585#issuecomment-782431177)

Minimum specs:
- [RasPi3](Raspberry-Pi), 1 GB RAM, external SSD disk for Wekan and MongoDB.
- While it works, it's only for minimal usage.
- Newer RasPi recommended for minimum use.


## Alternatives

At https://wekan.github.io / Download / Kubernetes or OpenShift, etc


***

# OLD INFO BELOW:

## Story: MongoDB on bare metal

From Tampa:

Hey,

... (about other tries) ...

Last month I threw all this out, recreated all the boards and connected them centrally to a single instance of mongo running on a dedicated server with custom hardware. This was like stepping into the light almost. Since then not a single machine has sent me a mail that it reached 50% usage. It seems insignificant, but the results speak for themselves.

The cloud instances are all shared 1vcpu, 1GB, 10GB storage, they just run wekan natively piped to the background, no docker, no snap, native install. They are connected to the central DB server sitting in the same datacenter. I stuffed a Raid6 with solid disks in that and gave it a hardware controller with a nice big cache. The latency being below 5ms over the network and the DB server having plenty of IO to go around it almost never has a queue of commits going to it and from the cache and IO use I suspect I could grow this tenfold easily.

With this setup each board essentially runs on half the hardware, in terms of cost anyways, yet it works so much better. There seems to be some magic ingredient here, being really fast IO for mongo that reduces system load of wekan by such a large amount that is can practically run even large boards with 40+ concurrent users on the least hardware most cloud providers even offer. With the central server setting up backups has become so much easier, I no longer need to wait for low usage to do backups either.

## Scaling to more users

For any large scale usage, you can:

a) scale with Docker Swarm, etc

b) for big reads or writes, do it on replica

c) for big reads or writes, do it at small amounts at a time, at night, or when database CPU usage seems to be low

Related to docker-compose.yml at https://github.com/wekan/wekan , using Docker Swarm:

[How to scale to more users](https://github.com/wekan/wekan/issues/2711#issuecomment-601163047)

[MongoDB replication docs](https://docs.mongodb.com/manual/replication/)

[MongoDB compatible databases](https://github.com/wekan/wekan/issues/2852)

[AWS](AWS)

[Azure OIDC](Azure)