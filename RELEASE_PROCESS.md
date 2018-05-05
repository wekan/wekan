1. Merge PR
```
$version=1.0x-0.yy

docker-compose build && \
git tag v$version && \
docker tag dpoz/wekan:latest dpoz/wekan:$version && \
docker push dpoz/wekan
```
1. Deploy:
````
cd wekan && \
git pull origin tweaks && \
sudo docker pull dpoz/wekan && \
sudo docker-compose down && sudo docker-compose up
````
