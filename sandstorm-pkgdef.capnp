# Use use the meteor-spk tool to generate a sandstorm package (spk) from this
# meteor application source code. https://github.com/sandstorm-io/meteor-spk
@0xa5275bd3ad124e12;

using Spk = import "/sandstorm/package.capnp";
# This imports:
#   $SANDSTORM_HOME/latest/usr/include/sandstorm/package.capnp
# Check out that file to see the full, documented package definition format.

const pkgdef :Spk.PackageDefinition = (
  # The package definition. Note that the spk tool looks specifically for the
  # "pkgdef" constant.

  id = "m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h",
  # The app ID is actually its public key. The private key was placed in your
  # keyring. All updates must be signed with the same key.

  manifest = (
    # This manifest is included in our app package to tell Sandstorm about our
    # app.

    appTitle = (defaultText = "LibreBoard"),
    # The name of the app as it is displayed to the user.

    appVersion = 2,
    # Increment this for every release.

    appMarketingVersion = (defaultText = "0.9.0"),
    # Human-readable presentation of the app version.

    minUpgradableAppVersion = 0,
    # The minimum version of the app which can be safely replaced by this app
    # package without data loss.  This might be non-zero if the app's data store
    # format changed drastically in the past and the app is no longer able to
    # read the old format.

    actions = [
      # Define your "new document" handlers here.
      (
        title = (defaultText = "New board"),
        command = .myCommand
        # The command to run when starting for the first time. (".myCommand" is
        # just a constant defined at the bottom of the file.)
      )
    ],

    continueCommand = .myCommand
    # This is the command called to start your app back up after it has been
    # shut down for inactivity. Here we're using the same command as for
    # starting a new instance, but you could use different commands for each
    # case.
  ),

  sourceMap = (
    # The following directories will be copied into your package.
    searchPath = [
      ( sourcePath = ".meteor-spk/deps" ),
      ( sourcePath = ".meteor-spk/bundle" )
    ]
  ),

  alwaysInclude = [ "." ],
  # This says that we always want to include all files from the source map. (An
  # alternative is to automatically detect dependencies by watching what the app
  # opens while running in dev mode. To see what that looks like, run `spk init`
  # without the -A option.)

  bridgeConfig = (
    viewInfo = (
      permissions = [(
        name = "participate",
        title = (defaultText = "participate"),
        description = (defaultText = "allows participating in the board")
      ), (
        name = "configure",
        title = (defaultText = "configure"),
        description = (defaultText = "allows configuring the board")
      )],

      roles = [(
        title = (defaultText = "observer"),
        permissions = [false, false],
        verbPhrase = (defaultText = "can read")
      ), (
        title = (defaultText = "member"),
        permissions = [true, false],
        verbPhrase = (defaultText = "can edit"),
        default = true
      # ), (
      #   title = (defaultText = "administrator"),
      #   permissions = [true, true],
      #   verbPhrase = (defaultText = "can configure")
      #
      # XXX Administrators configuration options aren’t implemented yet, so this
      # role is currently useless.
      )]
    )
  )
);

const myCommand :Spk.Manifest.Command = (
  # Here we define the command used to start up your server.
  argv = ["/sandstorm-http-bridge", "4000", "--", "node", "start.js"],
  environ = [
    # Note that this defines the *entire* environment seen by your app.
    (key = "PATH", value = "/usr/local/bin:/usr/bin:/bin"),
    (key = "METEOR_SETTINGS", value = "{\"public\": {\"sandstorm\": true}}")
  ]
);
