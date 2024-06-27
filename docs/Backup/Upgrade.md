
```
sudo snap stop wekan.wekan
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/snap/wekan/current/lib/x86_64-linux-gnu
export PATH2=$PATH
export PATH=/snap/wekan/current/bin:$PATH
mongodump --port 27019
sudo snap get wekan > snap-settings.txt
sudo snap stop wekan.mongodb
sudo mv /var/snap/wekan/common .
sudo mkdir /var/snap/wekan/common
sudo snap refresh wekan --channel=latest/candidate
```

To be continued...