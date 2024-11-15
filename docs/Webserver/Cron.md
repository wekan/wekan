(TODO: Try to integrate this inside WeKan Snap Candidate, or change code so that these would not be needed.)

WeKan has some memory leaks. To prevent WeKan becoming slow, this Cron script restarts WeKan Snap once every hour.

1) Edit /root/hourly.sh

```
sudo su

apt -y install nano cron

nano /root/hourly.sh
```
2) There add this text:
```
snap stop wekan.wekan

snap start wekan.wekan

# Wait 10 seconds
sleep 10

# Disable telemetry
/snap/wekan/current/usr/bin/mongosh wekan --eval 'disableTelemetry();' --port 27019

# Snap: Disable apparmor="DENIED" at syslog
# https://github.com/wekan/wekan/issues/4855
/snap/wekan/current/usr/bin/mongosh wekan \
--eval 'db.adminCommand({ setParameter: 1, diagnosticDataCollectionEnabled: false});' \
--port 27019

# Delete incomplete uploads so that they would not prevent starting WeKan
/snap/wekan/current/usr/bin/mongosh wekan \
--eval 'db.getCollection("cfs.attachments.filerecord").find( { "uploadedAt": { "$exists": true }, "copies.attachments" : null,"failures.copies.attachments.doneTrying" : {"$ne" : true}});' \
--port 27019
```
3) Save and exit nano: Ctrl-o Enter Ctrl-x Enter

4) Make hourly.sh script executeable, and edit cron:
```
chmod +x /root/hourly.sh

export EDITOR=nano

crontab -e
```
There at bottom, add this line, that will restart WeKan hourly, and log to textfile:
```
0 * * * * /root/hourly.sh >> /root/hourly-log.txt 2>&1
```
5) Save and exit nano: Ctrl-o Enter Ctrl-x Enter

6) You can also list content of cron:

```
crontab -l
```