sudo docker kill $(docker ps -q)
sudo docker rm $(docker ps -a -q)
sudo docker rmi $(docker images -q -f dangling=true)
sudo docker rmi $(docker images -q)
sudo docker-cleanup-volumes/docker-cleanup-volumes.sh
sudo systemctl stop docker
sudo rm -rf /var/lib/docker
sudo systemctl start docker
