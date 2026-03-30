#!/bin/bash

echo "Recommended for development: Newest Debian or Ubuntu amd64 based distro, directly to SSD disk or dual boot, not VM. Works fast."
echo "Note1: If you use other locale than en_US.UTF-8 , you need to additionally install en_US.UTF-8"
echo "       with 'sudo dpkg-reconfigure locales' , so that MongoDB works correctly."
echo "       You can still use any other locale as your main locale."
echo "Note2: Console output is also logged to ../wekan-log.txt"

function pause(){
	read -p "$*"
}

echo
PS3='Please enter your choice: '
options=("Install Wekan dependencies" "Build Wekan" "Run Meteor for dev on http://localhost:4000" "Run Meteor for dev on http://localhost:4000 with trace warnings, and warnings using old Meteor API that will not exist in Meteor 3.0" "Run Meteor for dev on http://localhost:4000 with bundle visualizer" "Run Meteor for dev on http://CURRENT-IP-ADDRESS:4000" "Run Meteor for dev on http://CURRENT-IP-ADDRESS:4000 with MONGO_URL=mongodb://127.0.0.1:27019/wekan" "Run Meteor for dev on http://CUSTOM-IP-ADDRESS:PORT" "Run tests" "Save Meteor dependency chain to ../meteor-deps.txt" "Quit")

select opt in "${options[@]}"
do
    case $opt in
        "Install Wekan dependencies")

		if [[ "$OSTYPE" == "linux-gnu" ]]; then
			echo "Linux";
			# Debian, Ubuntu, Mint
			sudo apt install -y build-essential gcc g++ make git curl wget p7zip-full zip unzip unp npm p7zip-full
			#sudo chown -R $(id -u):$(id -g) $HOME/.npm
			sudo npm -g install n
			sudo n 22.22.2
			sudo npm -g install meteor --unsafe-perm
			#sudo chown -R $(id -u):$(id -g) $HOME/.npm $HOME/.meteor
		elif [[ "$OSTYPE" == "darwin"* ]]; then
			echo "macOS"
			brew install npm
			brew install node@22
			directory_name="~/.npm"
			if [ ! -d "$directory_name" ]; then
				mkdir "$directory_name"
				echo "Directory '$directory_name' created."
			else
				echo "Directory '$directory_name' already exists."
			fi
			npm config set prefix '~/.npm'
			npx -y meteor
			export PATH=~/.meteor:$PATH
			exit;
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
		rm -rf .build/bundle node_modules .meteor/local .build
		npm install
		meteor build .build --directory --platforms=web.browser
		echo Done.
		break
		;;

    "Run Meteor for dev on http://localhost:4000")
		#Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
		#---------------------------------------------------------------------
		# Logging of terminal output to console and to ../wekan-log.txt at end of this line: 2>&1 | tee ../wekan-log.txt
		#WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
		WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:4000 meteor run --exclude-archs web.browser.legacy,web.cordova --port 4000 2>&1 | tee ../wekan-log.txt
		#---------------------------------------------------------------------
		break
		;;


    "Run Meteor for dev on http://localhost:4000 with trace warnings, and warnings using old Meteor API that will not exist in Meteor 3.0")
                #Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
                #---------------------------------------------------------------------
                # Logging of terminal output to console and to ../wekan-log.txt at end of this line: 2>&1 | tee ../wekan-log.txt
                WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings" WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:4000 meteor run --exclude-archs web.browser.legacy,web.cordova --port 4000 2>&1 | tee ../wekan-log.txt
                #---------------------------------------------------------------------
                break
                ;;

    "Run Meteor for dev on http://localhost:4000 with bundle visualizer")
		#Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
		#---------------------------------------------------------------------
		#Logging of terminal output to console and to ../wekan-log.txt at end of this line: 2>&1 | tee ../wekan-log.txt
		#WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
		WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://localhost:4000 meteor run --exclude-archs web.browser.legacy,web.cordova --port 4000 --extra-packages bundle-visualizer --production  2>&1 | tee ../wekan-log.txt
		#---------------------------------------------------------------------
		break
		;;

    "Run Meteor for dev on http://CURRENT-IP-ADDRESS:4000")
		if [[ "$OSTYPE" == "darwin"* ]]; then
		  IPADDRESS=$(ifconfig | grep broadcast | grep 'inet ' | cut -d: -f2 | awk '{ print $2}' | cut -d '/' -f 1 | grep '192.')
		else
		  IPADDRESS=$(ip a | grep 'noprefixroute' | grep 'inet ' | cut -d: -f2 | awk '{ print $2}' | cut -d '/' -f 1 | grep '192.')
		fi
		echo "Your IP address is $IPADDRESS"
		#---------------------------------------------------------------------
		#Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
		#---------------------------------------------------------------------
		#Logging of terminal output to console and to ../wekan-log.txt at end of this line: 2>&1 | tee ../wekan-log.txt
		#WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
		DEBUG=true WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://$IPADDRESS:4000 meteor run --exclude-archs web.browser.legacy,web.cordova --port 4000 2>&1 | tee ../wekan-log.txt
		#---------------------------------------------------------------------
		break
		;;

    "Run Meteor for dev on http://CURRENT-IP-ADDRESS:4000 with MONGO_URL=mongodb://127.0.0.1:27019/wekan")
                if [[ "$OSTYPE" == "darwin"* ]]; then
                  IPADDRESS=$(ifconfig | grep broadcast | grep 'inet ' | cut -d: -f2 | awk '{ print $2}' | cut -d '/' -f 1 | grep '192.')
                else
                  IPADDRESS=$(ip a | grep 'noprefixroute' | grep 'inet ' | cut -d: -f2 | awk '{ print $2}' | cut -d '/' -f 1 | grep '192.')
                fi
                echo "Your IP address is $IPADDRESS"
                #---------------------------------------------------------------------
                #Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
                #---------------------------------------------------------------------
                #Logging of terminal output to console and to ../wekan-log.txt at end of this line: 2>&1 | tee ../wekan-log.txt
                #WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
                MONGO_URL=mongodb://127.0.0.1:27019/wekan WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://$IPADDRESS:4000 meteor run --exclude-archs web.browser.legacy,web.cordova --port 4000 2>&1 | tee ../wekan-log.txt
                #---------------------------------------------------------------------
                break
                ;;

    "Run Meteor for dev on http://CUSTOM-IP-ADDRESS:PORT")
		ip address
		echo "From above list, what is your IP address?"
		read IPADDRESS
		echo "On what port you would like to run Wekan?"
		read PORT
		echo "ROOT_URL=http://$IPADDRESS:$PORT"
		#---------------------------------------------------------------------
		#Not in use, could increase RAM usage: NODE_OPTIONS="--max_old_space_size=4096"
		#---------------------------------------------------------------------
		#Logging of terminal output to console and to ../wekan-log.txt at end of this line: 2>&1 | tee ../wekan-log.txt
		#WARN_WHEN_USING_OLD_API=true NODE_OPTIONS="--trace-warnings"
		WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://$IPADDRESS:$PORT meteor run --exclude-archs web.browser.legacy,web.cordova --port $PORT 2>&1 | tee ../wekan-log.txt
		#---------------------------------------------------------------------
		break
		;;

    "Save Meteor dependency chain to ../meteor-deps.txt")
                meteor list --tree > ../meteor-deps.txt
                echo "Saved Meteor dependency chain to ../meteor-deps.txt"
                #---------------------------------------------------------------------
                break
                ;;

    "Run tests")
		echo "Running tests (import regression)."
		node tests/wekanCreator.import.test.js
		break
		;;

    "Quit")
		break
		;;
    *) echo invalid option;;
    esac
done
