## Using Vagrant and VirtualBox on an Ubuntu 16.04 64bit

1) Download Vagrant https://www.vagrantup.com/
and Virtualbox https://www.virtualbox.org/wiki/Downloads
2) In CMD or BASH `mkdir wekan_vagrant`
3) `cd wekan_vagrant`
4) `vagrant init -m ubuntu/xenial64`
5) Open up the vagrantfile in a text editor and copy this into it:
```
Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/xenial64"
  config.vm.provision :shell, path: "bootstrap.sh"
  config.vm.network "forwarded_port", guest: 8080, host: 8080
  config.vm.provider "virtualbox" do |v|
    v.memory = 2048
    v.cpus = 2
  end
end
```

6) Create a new text file in the same folder and call it bootstrap.sh
7) Copy this into the sh file
```
#!/usr/bin/env bash
sudo apt-get update
sudo snap install wekan
sudo snap set wekan root-url="http://localhost:8080"
sudo systemctl restart snap.wekan.wekan
```
8) Type 'vagrant up' to start the VM and wait for it to boot.

9) Got to your local browser and type in `localhost:8080`

10) You can go inside VM with `vagrant ssh`

11) Look at [Ubuntu snap wiki](https://github.com/wekan/wekan-snap/wiki) for additional configuration, backups etc

## Deleting

Once your done testing your Vagrantbox just go back to the cmd line and type `vagrant destroy` And it completely wipes any trace of the test environment from your system, however you can very very easily rebuild it by doing another `vagrant up` **Note: This will not save any data you may have put into Wekan!!!**