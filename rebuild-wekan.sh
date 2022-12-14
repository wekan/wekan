#!/bin/bash


echo "Recommended for development: Ubuntu 22.04 amd64 Jammy Jellyfish daily iso, directly to SSD disk or dual boot, not VM. Works fast."
echo "Note: If you use other locale than en_US.UTF-8 , you need to additionally install en_US.UTF-8"
echo "      with 'sudo dpkg-reconfigure locales' , so that MongoDB works correctly."
echo "      You can still use any other locale as your main locale."

#Below script installs newest node 8.x for Debian/Ubuntu/Mint.

function pause(){
	read -p "$*"
}

echo
PS3='Please enter your choice: '
options=("Install Wekan dependencies" "Build Wekan" "Run Meteor for dev on http://localhost:4000" "Run Meteor for dev on http://localhost:4000 with bundle visualizer" "Run Meteor for dev on http://CURRENT-IP-ADDRESS:4000" "Run Meteor for dev on http://CUSTOM-IP-ADDRESS:PORT" "Quit")

select opt in "${options[@]}"
do
    case $opt in
        "Install Wekan dependencies")

		if [[ "$OSTYPE" == "linux-gnu" ]]; then
			echo "Linux";
			# Debian, Ubuntu, Mint
			sudo apt install -y build-essential gcc g++ make git curl wget p7zip-full zip unzip unp npm p7zip-full
			#curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
			#sudo apt-get install -y nodejs
			#sudo apt-get install -y npm
			# Volta Node and NPM install manager, made with Rust https://volta.sh
			# Volta uses home directory also with "npm -g install", no sudo needed.
			# Volta install script is broken, so using n.
			#curl https://get.volta.sh | bash
			#export VOLTA_HOME="$HOME/.volta"
			#export PATH="$VOLTA_HOME/bin:$PATH"
			#volta install node@14
			# npm nodejs
			#curl -0 -L https://npmjs.org/install.sh | sudo sh
			#sudo chown -R $(id -u):$(id -g) $HOME/.npm
			sudo npm -g install n
			sudo n 14.21.2
			sudo npm -g install npm
			#sudo npm -g install npm
			## Latest npm with Meteor 2.2
			sudo npm -g uninstall node-pre-gyp
			sudo npm -g install @mapbox/node-pre-gyp
			# Latest fibers for Meteor 2.2
			#sudo mkdir -p /usr/local/lib/node_modules/fibers/.node-gyp
			#sudo npm -g install fibers
			# Install Meteor, if it's not yet installed
			sudo npm -g install meteor --unsafe-perm
			#sudo chown -R $(id -u):$(id -g) $HOME/.npm $HOME/.meteor
		elif [[ "$OSTYPE" == "darwin"* ]]; then
		        echo "macOS";
			pause '1) Install XCode 2) Install Node 14.x from https://nodejs.org/en/ 3) Press [Enter] key to continue.'
		elif [[ "$OSTYPE" == "cygwin" ]]; then
		        # POSIX compatibility layer and Linux environment emulation for Windows
		        echo "TODO: Add Cygwin";
			exit;
		elif [[ "$OSTYPE" == "msys" ]]; then
		        # Lightweight shell and GNU utilities compiled for Windows (part of MinGW)
		        echo "TODO: Add msys on Windows";
			exit;
		elif [[ "$OSTYPE" == "win32" ]]; then
		        # I'm not sure this can happen.
		        echo "TODO: Add Windows";
			exit;
		elif [[ "$OSTYPE" == "freebsd"* ]]; then
		        echo "TODO: Add FreeBSD";
			exit;
		else
		        echo "Unknown"
			echo ${OSTYPE}
			exit;
		fi

		break
		;;

    "Build Wekan")
		echo "Building Wekan."
		#if [[ "$OSTYPE" == "darwin"* ]]; then
		#	echo "sed at macOS";
		#	sed -i '' 's/api\.versionsFrom/\/\/api.versionsFrom/' ~/repos/wekan/packages/meteor-useraccounts-core/package.js
		#else
		#	echo "sed at ${OSTYPE}"
		#	sed -i 's/api\.versionsFrom/\/\/api.versionsFrom/' ~/repos/wekan/packages/meteor-useraccounts-core/package.js
		#fi
		#cd ..
		#sudo chown -R $(id -u):$(id -g) $HOME/.npm $HOME/.meteor
		rm -rf .build/bundle node_modules .meteor/local .build
		meteor npm install
		meteor build .build --directory
		rm -rf .build/bundle/programs/web.browser.legacy
		(cd .build/bundle/programs/server && rm -rf node_modules && chmod u+w *.json && meteor npm install)
                (cd .build/bundle/programs/server/node_modules/fibers && node build.js)
		(cd .build/bundle/programs/server/npm/node_modules/meteor/accounts-password && meteor npm remove bcrypt && meteor npm install bcrypt)
		# Cleanup
		cd .build/bundle
		find . -type d -name '*-garbage*' | xargs rm -rf
		find . -name '*phantom*' | xargs rm -rf
		find . -name '.*.swp' | xargs rm -f
		find . -name '*.swp' | xargs rm -f
		cd ../..
		# Add fibers multi arch
		#cd .build/bundle/programs/server/node_modules/fibers/bin
		#curl https://releases.wekan.team/fibers-multi.7z -o fibers-multi.7z
		#7z x fibers-multi.7z
		#rm fibers-multi.7z
		#cd ../../../../../../..
		echo Done.
		break
		;;

    "Run Meteor for dev on http://localhost:4000")
		#WRITABLE_PATH=.. NODE_OPTIONS="--max_old_space_size=4096 --trace-warnings" WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:4000 meteor run --exclude-archs web.browser.legacy,web.cordova --port 4000
		WRITABLE_PATH=.. NODE_OPTIONS="--trace-warnings" WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:4000 meteor run --exclude-archs web.browser.legacy,web.cordova --port 4000
		break
		;;

    "Run Meteor for dev on http://localhost:4000 with bundle visualizer")
		#WRITABLE_PATH=.. NODE_OPTIONS="--max_old_space_size=4096 --trace-warnings" WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:4000 meteor run --exclude-archs web.browser.legacy,web.cordova --port 4000 --extra-packages bundle-visualizer --production
		WRITABLE_PATH=.. NODE_OPTIONS="--trace-warnings" WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:4000 meteor run --exclude-archs web.browser.legacy,web.cordova --port 4000 --extra-packages bundle-visualizer --production
		break
		;;

    "Run Meteor for dev on http://CURRENT-IP-ADDRESS:4000")
		if [[ "$OSTYPE" == "darwin"* ]]; then
		  IPADDRESS=$(ifconfig | grep broadcast | grep 'inet ' | cut -d: -f2 | awk '{ print $2}' | cut -d '/' -f 1)
		else
		  IPADDRESS=$(ip a | grep 'noprefixroute' | grep 'inet ' | cut -d: -f2 | awk '{ print $2}' | cut -d '/' -f 1)
		fi
		echo "Your IP address is $IPADDRESS"
		#WRITABLE_PATH=.. NODE_OPTIONS="--max_old_space_size=4096 --trace-warnings" WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://$IPADDRESS:4000 meteor run --exclude-archs web.browser.legacy,web.cordova --port 4000
		WRITABLE_PATH=.. NODE_OPTIONS="--trace-warnings" WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://$IPADDRESS:4000 meteor run --exclude-archs web.browser.legacy,web.cordova --port 4000
		break
		;;

    "Run Meteor for dev on http://CUSTOM-IP-ADDRESS:PORT")
		ip address
		echo "From above list, what is your IP address?"
		read IPADDRESS
		echo "On what port you would like to run Wekan?"
		read PORT
		echo "ROOT_URL=http://$IPADDRESS:$PORT"
		#WRITABLE_PATH=.. NODE_OPTIONS="--max_old_space_size=4096 --trace-warnings" WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://$IPADDRESS:$PORT meteor run --exclude-archs web.browser.legacy,web.cordova --port $PORT
		WRITABLE_PATH=.. NODE_OPTIONS="--trace-warnings" WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://$IPADDRESS:$PORT meteor run --exclude-archs web.browser.legacy,web.cordova --port $PORT
		break
		;;

    "Quit")
		break
		;;
    *) echo invalid option;;
    esac
done
