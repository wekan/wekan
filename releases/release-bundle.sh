cd ~/repos/wekan
sudo apt-get -y install parallel
./releases/rebuild-release.sh
#./releases/delete-phantomjs.sh
cd ~/repos/wekan/.build
zip -r wekan-$1.zip bundle

{
  scp ~/repos/wekan/releases/maintainer-make-bundle-a.sh a:/home/wekan/maintainer-make-bundle.sh
  scp ~/repos/wekan/releases/maintainer-make-bundle-s.sh s:/home/linux1/maintainer-make-bundle.sh
  scp ~/repos/wekan/releases/maintainer-make-bundle-o.sh o:/home/ubuntu/maintainer-make-bundle.sh
  scp ~/repos/wekan/releases/release-x2.sh x2w:/var/websites/
  scp wekan-$1.zip x2w:/var/websites/releases.wekan.team/public/
  scp wekan-$1.zip a:/home/wekan/
  scp wekan-$1.zip s:/home/linux1/
  scp wekan-$1.zip o:/home/ubuntu/
} | parallel -k

cd ..

echo "x64 bundle and arm64/s390x/ppc64le build scripts uploaded to x2/a/s/o."
