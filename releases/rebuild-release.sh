
#!/bin/bash

# Check dependencies for macOS/Linux
if [ "$(uname)" = "Darwin" ]; then
	if ! command -v brew >/dev/null 2>&1; then
		echo "Homebrew not found. Installing Homebrew..."
		/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
	fi
	for dep in meteor zip; do
		if ! command -v $dep >/dev/null 2>&1; then
			echo "$dep not found. Installing $dep with brew..."
			brew install $dep
		fi
	done
else
	for dep in meteor zip; do
		if ! command -v $dep >/dev/null 2>&1; then
			echo "$dep not found. Installing $dep with apt-get..."
			sudo apt-get update && sudo apt-get install -y $dep
		fi
	done
fi

echo "Note: If you use other locale than en_US.UTF-8 , you need to additionally install en_US.UTF-8"
echo "      with 'sudo dpkg-reconfigure locales' , so that MongoDB works correctly."
echo "      You can still use any other locale as your main locale."

echo "Building Wekan."
sudo chown -R $(id -u):$(id -g) $HOME/.npm $HOME/.meteor
rm -rf node_modules .meteor/local .build
(meteor update --npm 2>/dev/null || true) && meteor npm install
#METEOR_PROFILE=100 meteor build .build --directory
meteor build .build --directory
