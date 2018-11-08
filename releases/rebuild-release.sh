#!/bin/bash

		echo "Building Wekan."
		cd ~/repos/wekan
		rm -rf packages
		mkdir -p ~/repos/wekan/packages
		cd ~/repos/wekan/packages
                git clone --depth 1 -b master https://github.com/wekan/flow-router.git kadira-flow-router
                git clone --depth 1 -b master https://github.com/meteor-useraccounts/core.git meteor-useraccounts-core
                git clone --depth 1 -b master https://github.com/wekan/meteor-accounts-cas.git
                git clone --depth 1 -b master https://github.com/wekan/wekan-ldap.git

		if [[ "$OSTYPE" == "darwin"* ]]; then
			echo "sed at macOS";
			sed -i '' 's/api\.versionsFrom/\/\/api.versionsFrom/' ~/repos/wekan/packages/meteor-useraccounts-core/package.js
		else
			echo "sed at ${OSTYPE}"
			sed -i 's/api\.versionsFrom/\/\/api.versionsFrom/' ~/repos/wekan/packages/meteor-useraccounts-core/package.js
		fi

		cd ~/repos/wekan
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
		cd ~/repos/wekan/.build/bundle/programs/server
		rm -rf node_modules
		meteor npm install
		#meteor npm install bcrypt
		cd ~/repos
		echo Building Wekan Done.
