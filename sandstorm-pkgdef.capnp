@0xa5275bd3ad124e12;

using Spk = import "/sandstorm/package.capnp";
# This imports:
#   $SANDSTORM_HOME/latest/usr/include/sandstorm/package.capnp
# Check out that file to see the full, documented package definition format.

const pkgdef :Spk.PackageDefinition = (
  # The package definition. Note that the spk tool looks specifically for the
  # "pkgdef" constant.

  id = "m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h",
  # Your app ID is actually its public key. The private key was placed in your
  # keyring. All updates must be signed with the same key.

  manifest = (
    # This manifest is included in your app package to tell Sandstorm
    # about your app.

    appVersion = 1, # Increment this for every release.

    actions = [
      # Define your "new document" handlers here.
      ( title = (defaultText = "New board"),
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

  alwaysInclude = [ "." ]
  # This says that we always want to include all files from the source map. (An
  # alternative is to automatically detect dependencies by watching what the app
  # opens while running in dev mode. To see what that looks like, run `spk init`
  # without the -A option.)
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
