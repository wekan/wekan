Running Wekan on Windows (Using WSL)

Running Wekan directly on Windows can be difficult because Meteor is designed primarily for Linux environments. Tools like Chocolatey sometimes cause installation and PATH issues.

The most stable way to run Wekan on Windows is by using Windows Subsystem for Linux, which allows you to run a Linux environment inside Windows.

This guide explains how to set up Wekan using Ubuntu in WSL.

1. Clone the Repository

First fork the repository on GitHub, then clone it locally:

mkdir repos
cd repos
git clone https://github.com/YOUR_GITHUB_USERNAME/wekan.git
cd wekan
2. Install Windows Subsystem for Linux

Open PowerShell as Administrator and run:

wsl --install

Restart your computer once installation finishes.

This installs Ubuntu Linux inside Windows.

3. Verify the Installation

Check that WSL installed correctly:

wsl --status

Expected output:

Default Distribution: Ubuntu
Default Version: 2

If Ubuntu is not installed, run:

wsl --install -d Ubuntu

You can also list installed distributions with:

wsl -l -v
4. Launch Ubuntu

Start the Linux environment:

wsl -d Ubuntu

The first time Ubuntu runs, you will be asked to create:

a Linux username
a password
5. Install Meteor

Inside the Ubuntu terminal install Meteor:

curl https://install.meteor.com/ | sh

Verify installation:

meteor --version
6. Navigate to the Wekan Directory

If the project is inside your Linux home directory:

cd ~/repos/wekan

If it was cloned in Windows, navigate through the mounted Windows filesystem:

cd /mnt/c/path/to/wekan

Make sure you are inside the wekan project directory.

7. Open the Project in VS Code

Install the Remote – WSL extension in Visual Studio Code.

Then open the project directly from the Ubuntu terminal:

code .

VS Code will automatically connect to the WSL environment.

You should see "WSL: Ubuntu" in the bottom-left corner of VS Code.

8. Install Project Dependencies

Inside the VS Code terminal run:

meteor npm install

This installs all required dependencies.

9. Run the Application

Start the development server:

meteor

The application should now start locally.

10. Fix WRITABLE_PATH Error

If you encounter the error:

WRITABLE_PATH environment variable missing and/or unset

Create a writable directory:

mkdir -p ~/meteor-storage

Run Meteor with the required environment variable:

WRITABLE_PATH=/home/$USER/meteor-storage meteor
Optional: Make WRITABLE_PATH Permanent

To avoid setting the variable each time, add it to your shell configuration.

Open your bash configuration:

nano ~/.bashrc

Add the following line:

export WRITABLE_PATH=/home/$USER/meteor-storage

Reload the configuration:

source ~/.bashrc
Troubleshooting
Meteor command not found

Restart the terminal or verify installation:

meteor --version
Node.js not found

Meteor uses its own bundled Node version. You can verify it with:

meteor node -v
WSL not detecting Ubuntu

List installed distributions:

wsl -l -v

Install Ubuntu if needed:

wsl --install -d Ubuntu