**Purpose**: just to try Wekan on your own Linux workstation

1. [Install Docker](http://docs.docker.com/linux/step_one/)
1. [Install Docker-Compose](http://docs.docker.com/compose/install/)
1. Say we want to save our Wekan data on the host in directory `/home/johndoe/wekan/data`
1. In a given directory (say `/home/johndoe/wekan`), create a `docker-compose.yml` file with:

Use this docker-compose.yml:

https://raw.githubusercontent.com/wekan/wekan/devel/docker-compose.yml

Then, from the directory containing the `docker-compose.yml` (i.e. `/home/johndoe/wekan`), simply run `docker-compose up`. If you want it to be deamonized, you could run `docker-compose up -d`.

Your wekan data are in `/home/johndoe/wekan/data` and thus can be backed up.

**Note**
If the default host port 80 has been used and you would like to set up Wekan for another port, say, 1234, the configuration above
```
  ports:
    - 80:8080
```
can be replaced by
```
  ports:
    - 1234:8080
```

also need to change
```
 - ROOT_URL=http://localhost
```

to the new port
```
 - ROOT_URL=http://localhost:1234
```

(This procedure has been tested on Linux Ubuntu 14.04 and Mac OS 10.11.6.) (Tested on Docker for Windows 17.06.2-ce-win27, MongoDB does not support using mounted Windows volumes, simply remove volumes: from wekandb:)

## Testing with mail server

Above method will create an instance of Wekan without mailing features (users inviting, password recovery, neat registration) because MAIL_URL env var isn't set. This `docker-compose.yml` solves that problem by adding *mailserver* container.  

```yaml
wekan:
  image: quay.io/wekan/wekan
  links:
    - wekandb
    - mailserver
  environment:
    - MONGO_URL=mongodb://wekandb/wekan
    - ROOT_URL=http://10.2.0.180:8081
    - MAIL_URL=smtp://wekan:wekan@mailserver:25
  ports:
    - 8081:80

wekandb:
   image: mongo:3.2.21
   volumes:
     - /home/wekan/data:/data/db

mailserver:
  image: marvambass/versatile-postfix
  volumes:
    - /home/wekan/dkim:/etc/postfix/dkim/
    - /home/wekan/maildirs:/var/mail
  command: wekan.com wekan:wekan
  environment:
    - ALIASES=postmaster:root;hostmaster:root;webmaster:root
```

Several additional steps needed.

1. Create dirs `/home/wekan/dkim`, `/home/wekan/maildirs` that are used by *mailserver* container

    ```bash
    mkdir /home/wekan/dkim
    mkdir /home/wekan/maildirs
    ```
2. Generate DKIM key

    ```bash
    apt-get install opendkim-tools
    cd /home/wekan/maildirs
    opendkim-genkey -s mail -d example.com
    mv mail.private dkim.key
    ```

## Show mails with a Docker image, without mail configuration
When you did **NOT** setup the `MAIL_URL` environment variable in Wekan, the mail message will be 'sent' to the terminal output instead of sending an actual e-mail. If you are using Docker images, list the containers via:

```sh
docker ps
```

Then display the process output:

```sh
docker logs -f <container_id>
```

With the `-f` flag (`f` for `follow`), you will see the real-time output of the process. You can exit with **CTRL + C** without affecting the Wekan process.

Via the web-interface press the '_forgot your password?_' link and trigger a reset mail. And watch the terminal output for the e-mail.