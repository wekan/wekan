cd ~/repos/wekan
sudo apt-get -y install parallel
./releases/rebuild-release.sh
#./releases/delete-phantomjs.sh
cd ~/repos/wekan/.build
zip -r wekan-$1.zip bundle

{
  scp wekan-$1.zip x2:/var/snap/wekan/common/releases.wekan.team/
  scp wekan-$1.zip a:/home/wekan/repos/
  scp wekan-$1.zip s:/home/linux1/
  scp wekan-$1.zip o:/home/ubuntu/
} | parallel -k

cd ..

echo "Bundle uploaded to x2/a/s/o."
