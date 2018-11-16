#!/bin/bash

function wekan_repo_check(){
	git_remotes="$(git remote show 2>/dev/null)"
	res=""
	for i in $git_remotes; do
		res="$(git remote get-url $i | sed 's/.*wekan\/wekan.*/wekan\/wekan/')"
		if [[ "$res" == "wekan/wekan" ]]; then
		    break
		fi
	done

	if [[ "$res" != "wekan/wekan" ]]; then
		echo "$PWD is not a wekan repository"
		exit;
	fi
}

# If you want to restart even on crash, uncomment while and done lines.
#while true; do
	wekan_repo_check
	cd .build/bundle
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
        # & >> ../../wekan.log
	cd ../..
#done
