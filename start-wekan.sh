# If you want to restart even on crash, uncomment while and done lines.

#while true; do
	cd ~/repos/wekan/.build/bundle
	#export MONGO_URL='mongodb://127.0.0.1:27019/wekantest'
	#export MONGO_URL='mongodb://127.0.0.1:27019/wekan'
	export MONGO_URL='mongodb://127.0.0.1:27019/wekantest'
	# Production: https://example.com/wekan
	# Local: http://localhost:2000
	#export ipaddress=$(ifdata -pa eth0)
	export ROOT_URL='http://localhost:2000'
	# https://github.com/wekan/wekan/wiki/Troubleshooting-Mail
	# https://github.com/wekan/wekan-mongodb/blob/master/docker-compose.yml
	export MAIL_URL='smtp://user:pass@mailserver.example.com:25/'
	# This is local port where Wekan Node.js runs, same as below on Caddyfile settings.
	export WITH_API=true
	export KADIRA_OPTIONS_ENDPOINT=http://127.0.0.1:11011
	export PORT=2000
	#export LDAP_ENABLE=true
	node main.js
        # & >> ~/repos/wekan.log
	cd ~/repos
#done
