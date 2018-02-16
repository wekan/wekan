1. Merge PR
1. `docker-compose build`
1. `git tag v1.0x-0.yy`
1. `docker tag dpoz/wekan:latest dpoz/wekan:1.0x-0.yy`
1. `docker push dpoz/wekan`
1. Deploy:
    1. `docker pull dpoz/wekan`
    1. `docker-compose down && docker-compose up`
