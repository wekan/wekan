# Dev and test
https://github.com/wekan/wekan/wiki/Install-Wekan-from-source-on-Windows

#Release

1. Merge PR
```
version=1.0x-0.yy

docker-compose build && \
git tag v$version && git push --tags && \
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
