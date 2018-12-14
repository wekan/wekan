#!/bin/bash

echo "Note: If you use other locale than en_US.UTF-8 , you need to additionally install en_US.UTF-8"
echo "      with 'sudo dpkg-reconfigure locales' , so that MongoDB works correctly."
echo "      You can still use any other locale as your main locale."

X64NODE="https://nodejs.org/dist/v8.14.0/node-v8.14.0-linux-x64.tar.gz"

function pause(){
	read -p "$*"
}

function cprec(){
	if [[ -d "$1" ]]; then
		if [[ ! -d "$2" ]]; then
			sudo mkdir -p "$2"
		fi

		for i in $(ls -A "$1"); do
			cprec "$1/$i" "$2/$i"
		done
	else
		sudo cp "$1" "$2"
	fi
}

# sudo npm doesn't work right, so this is a workaround
function npm_call(){
	TMPDIR="/tmp/tmp_npm_prefix"
	if [[ -d "$TMPDIR" ]]; then
		rm -rf $TMPDIR
	fi
	mkdir $TMPDIR
	NPM_PREFIX="$(npm config get prefix)"
	npm config set prefix $TMPDIR
	npm "$@"
	npm config set prefix "$NPM_PREFIX"

	echo "Moving files to $NPM_PREFIX"
	for i in $(ls -A $TMPDIR); do
		cprec "$TMPDIR/$i" "$NPM_PREFIX/$i"
	done
	rm -rf $TMPDIR
}

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

echo
PS3='Please enter your choice: '
options=("Install Wekan dependencies" "Build Wekan" "Quit")
select opt in "${options[@]}"
do
    case $opt in
        "Install Wekan dependencies")

		if [[ "$OSTYPE" == "linux-gnu" ]]; then
	                echo "Linux";

			if [ "$(grep -Ei 'buntu|mint' /etc/*release)" ]; then
				sudo apt install -y build-essential git curl wget
#				sudo apt -y install nodejs npm
#				npm_call -g install n
#				sudo n 8.14.0
			fi

#			if [ "$(grep -Ei 'debian' /etc/*release)" ]; then
#				sudo apt install -y build-essential git curl wget
#				echo "Debian, or Debian on Windows Subsystem for Linux"
#				curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
#				sudo apt install -y nodejs
#			fi

			# TODO: Add Sandstorm for version of Node.js install
			#MACHINE_TYPE=`uname -m`
			#if [ ${MACHINE_TYPE} == 'x86_64' ]; then
			#	# 64-bit stuff here
			#	wget ${X64NODE}
			#	sudo tar -C /usr/local --strip-components 1 -xzf ${X64NODE}
			#elif [ ${MACHINE_TYPE} == '32bit' ]; then
			#	echo "TODO: 32-bit Linux install here"
			#	exit
			#fi
		elif [[ "$OSTYPE" == "darwin"* ]]; then
		        echo "macOS";
			pause '1) Install XCode 2) Install Node 8.x from https://nodejs.org/en/ 3) Press [Enter] key to continue.'
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

	        ## Latest npm with Meteor 1.6
	        npm_call -g install npm
	        npm_call -g install node-gyp
	        # Latest fibers for Meteor 1.6
	        npm_call -g install fibers@2.0.0
	        # Install Meteor, if it's not yet installed
	        curl https://install.meteor.com | bash
#	        mkdir ~/repos
#	        cd ~/repos
#	        git clone https://github.com/wekan/wekan.git
#	        cd wekan
#	        git checkout devel
		break
		;;
        "Build Wekan")
		echo "Building Wekan."
		wekan_repo_check
		rm -rf packages
		mkdir packages
		cd packages
		git clone --depth 1 -b master https://github.com/wekan/flow-router.git kadira-flow-router
		git clone --depth 1 -b master https://github.com/meteor-useraccounts/core.git meteor-useraccounts-core
		git clone --depth 1 -b master https://github.com/wekan/meteor-accounts-cas.git
		git clone --depth 1 -b master https://github.com/wekan/wekan-ldap.git
		git clone --depth 1 -b master https://github.com/wekan/wekan-scrollbar.git
		if [[ "$OSTYPE" == "darwin"* ]]; then
			echo "sed at macOS";
			sed -i '' 's/api\.versionsFrom/\/\/api.versionsFrom/' ~/repos/wekan/packages/meteor-useraccounts-core/package.js
		else
			echo "sed at ${OSTYPE}"
			sed -i 's/api\.versionsFrom/\/\/api.versionsFrom/' ~/repos/wekan/packages/meteor-useraccounts-core/package.js
		fi

		cd ..
		rm -rf node_modules
		meteor npm install
		rm -rf .build
		meteor build .build --directory
		cp -f fix-download-unicode/cfs_access-point.txt .build/bundle/programs/server/packages/cfs_access-point.js
		#Removed binary version of bcrypt because of security vulnerability that is not fixed yet.
		#https://github.com/wekan/wekan/commit/4b2010213907c61b0e0482ab55abb06f6a668eac
		#https://github.com/wekan/wekan/commit/7eeabf14be3c63fae2226e561ef8a0c1390c8d3c
		#cd ~/repos/wekan/.build/bundle/programs/server/npm/node_modules/meteor/npm-bcrypt
		#rm -rf node_modules/bcrypt
		#meteor npm install bcrypt
		cd .build/bundle/programs/server
		rm -rf node_modules
		meteor npm install
		#meteor npm install bcrypt
		cd ../../../..
		echo Done.
		break
		;;
        "Quit")
		break
            ;;
        *) echo invalid option;;
    esac
done
