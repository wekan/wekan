You can read up how to set up Rancher on a host together with Rancher Active Proxy and a Wekan/MongoDB Docker Stack.

This way you have Wekan running on a rancher host with automatic letsencrypt retrieval/renewal and proxying to a domain of your choice.

Here's how to set up Rancher + Rancher Active Proxy:
https://github.com/adi90x/rancher-active-proxy/issues/21

Alter the wekan service in the docker-compose like this:
```
  wekan:
    image: wekanteam/wekan:meteor-1.4
    container_name: whatever-you-like
    restart: always
    ports:
      - 80
    labels:
      - io.rancher.container.pull_image=always
      - rap.port=80
      - rap.host=your.domain.com
      - rap.le_host=your.domain.com
      - rap.le_email=your@mail.com
    environment:
      - MONGO_URL=mongodb://wekandb:27017/wekan
      - ROOT_URL=https://your.domain.com
    depends_on:
      - wekandb
```