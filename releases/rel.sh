## After building bundles, copy and rename for uploading to releases

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./rel.sh 6.61"
    exit 1
fi


mkdir ~/rel$1
mv ~/repos/wekan/wekan-$1*.zip /home/wekan/rel$1/
mv ~/Julkinen/wekan-$1*.zip /home/wekan/rel$1/
mv /home/wekan/repos/wekan/.build/wekan-$1-amd64.zip /home/wekan/rel$1/wekan-$1-amd64.zip
