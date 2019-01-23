module.exports = {
    servers: {
        one: {
            host: 'wekan.rafaelrglima.com',
            username: 'root',
            pem: '~/.ssh/rafaelrglima',
            opts: {
                port: 22,
            }
        }
        // two: {
        //     host: '5.6.7.8',
        //     username: 'root',
        //     pem: '~/.ssh/id_rsa'
        // },
        // three: {
        //     host: '2.3.4.5',
        //     username: 'root',
        //     password: 'password'
        // }
    },

    // Formerly named 'meteor'. Configuration for deploying the app
    app: {
        name: 'wekan',
        path: '../../../project/',
        type: 'meteor',

        // lets you add docker volumes (optional). Can be used to
        // store files between app deploys and restarts.
        volumes: {
            // passed as '-v /host/path:/container/path' to the docker run command
            "/volumes/temp": "/temp",
            "/volumes/otherstorage": "/storage"
        },
        docker: {
            image: 'abernix/meteord:node-8.4.0-base',
            // args: [
            //     "-v /etc/timezone:/etc/timezone",
            //     "-v /etc/localtime:/etc/localtime"
            // ],
            // args: [
            //     // linking example
            //     '--link=myCustomMongoDB:myCustomMongoDB',
            //     // memory resvevation example
            //     '--memory-reservation 2000M'
            // ],
            // args:[ // lets you add/overwrite any parameter on the docker run command (optional)
            //     "--link=mongodb:mongoserver", // linking example
            // ],

            // (optional) It is set to true when using a docker image
            // that supports it. Builds a new docker image containing the
            // app's bundle and npm dependencies to start the app faster and
            // make deploys more reliable and easier to troubleshoot
            prepareBundle: true,
            // Additional docker build instructions, used during Prepare Bundle
            buildInstructions: [
                'RUN apt-get update && apt-get install -y imagemagick',
                'RUN apt-get install -y tzdata',
                'RUN ln -fs /usr/share/zoneinfo/America/new_york /etc/localtime',
                'RUN dpkg-reconfigure --frontend noninteractive tzdata'
            ],
            // (optional, default is true) If true, the app is stopped during
            // Prepare Bundle to help prevent running out of memory when building
            // the docker image. Set to false to reduce downtime if your server has
            // enough memory or swap.
            stopAppDuringPrepareBundle: true,

            // lets you bind the docker container to a
            // specific network interface (optional)
            bind: '127.0.0.1',

            // lets you add network connections to perform after run
            // (runs docker network connect <net name> for each network listed here)
            // networks: [
            //     'bridge',
            //     'mongo-cluster'
            // ]
        },

        // list of servers to deploy to, from the 'servers' list
        servers: {
            one: {}
            // two: {},
            // three: {
            //     // Add or override env variables for specific servers (optional)
            //     env: {
            //         PORT: 5000
            //     }
            // }
        },

        // All options are optional.
        buildOptions: {
            // Set to true to skip building mobile apps
            // but still build the web.cordova architecture. (recommended)
            serverOnly: true,

            // Set to true to disable minification and bundling,
            // and include debugOnly packages
            debug: false,

            // defaults to a a folder in your tmp folder.
            buildLocation: '/home/rafael/rafaelrglima/wekan/temp/buildfolder/',


            cleanAfterBuild: true,

            // Remove this property for mobileSettings to use your settings.json
            // mobileSettings: {
            //     public: {
            //         'meteor-up': 'rocks'
            //     }
            // },

            // your app url for mobile app access
            server: 'https://wekan.rafaelrglima.com',

            // When true, adds --allow-incompatible-updates arg to build command
            allowIncompatibleUpdates: false,

            // Executable used to build the meteor project
            // You can set to a local repo path if needed
            executable: 'meteor'
        },
        env: {
            // If you are using SSL, this needs to start with https
            ROOT_URL: 'https://app.rafaelrglima.com',

            // When using the built-in mongodb,
            // this is overwritten with the correct url
            MONGO_URL: 'mongodb://localhost:27017/customdb',
            MAIL_URL : 'smtp://email%40gmail:password@smtp.mailgun.org:587'
            // The port you access the app on. (optional, default is 80)
            // PORT: 8000

            // The number of proxies in front of your server (optional, default is
            // 1 with reverse proxy, unused otherwise).
            // https://docs.meteor.com/api/connections.html
            // HTTP_FORWARDED_COUNT: 1
        },

        // Docker log options (optional)
        // log: {
        //     driver: 'syslog',
        //     opts: {
        //         'syslog-address': 'udp://wekan.rafaelrglima.com:1234'
        //     }
        // },
        // The maximum number of seconds it will wait
        // for your app to successfully start (optional, default is 60)
        deployCheckWaitTime: 120,

        // lets you define which port to check after the deploy process, if it
        // differs from the meteor port you are serving
        // (like meteor behind a proxy/firewall) (optional)
        //deployCheckPort: 80,

        // Shows progress bar while uploading bundle to server
        // You might need to disable it on CI servers
        // (optional, default is false)
        enableUploadProgressBar: true
    },
    proxy: {
        // comma-separated list of domains your website
        // ex: website.com,www.website.com
        // will be accessed at.
        // You will need to configure your DNS for each one.
        domains: 'wekan.rafaelrglima.com',
        // force redirect from http to https
        ssl: {
            letsEncryptEmail: 'admin@rafaelrglima.com',
            forceSSL: true
        },

        // (optional, default=10M) Limit for the size of file uploads.
        // Set to 0 disables the limit.
        clientUploadLimit: '50M'
    },
    // (optional) Use built-in mongodb. Remove it to use a remote MongoDB
    mongo: {
      version: "4.0.5",
      servers: {
        one: {}
      }
    }
};
