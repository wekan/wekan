1. Merge PR
1. `docker-compose build`
1. `git tag v1.0x-0.yy`
1. `docker tag dpoz/wekan:latest dpoz/wekan:1.0x-0.yy`
1. `docker push dpoz/wekan`
1. Deploy: `sudo docker pull dpoz/wekan && sudo docker-compose down && sudo docker-compose up`
