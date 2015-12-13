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

    appTitle = (defaultText = "Wekan"),
    # The name of the app as it is displayed to the user.

    appVersion = 7,
    # Increment this for every release.

    appMarketingVersion = (defaultText = "0.10-rc3"),
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
        command = .myCommand,
        # The command to run when starting for the first time. (".myCommand" is
        # just a constant defined at the bottom of the file.)
      )
    ],

    continueCommand = .myCommand,
    # This is the command called to start your app back up after it has been
    # shut down for inactivity. Here we're using the same command as for
    # starting a new instance, but you could use different commands for each
    # case.

    metadata = (
      icons = (
        appGrid = (svg = embed "meta/icons/wekan-128.svg"),
        grain = (svg = embed "meta/icons/wekan-24.svg"),
        market = (svg = embed "meta/icons/wekan-150.svg"),
      ),

      website = "http://libreboard.com",
      codeUrl = "https://github.com/wekan/wekan",
      license = (openSource = mit),
      categories = [productivity, office],

      author = (
        contactEmail = "maxime@quandalle.com",
        pgpSignature = embed "meta/mquandalle-pgp-sig",
      ),

      pgpKeyring = embed "meta/keyring",

      description = (defaultText = embed "meta/description.md"),

      shortDescription = (defaultText = "Kanban board"),

      screenshots = [
        (
          width = 512,
          height = 330,
          jpeg = embed "meta/screenshots/board-view.jpg"
        ),
        # XXX The screenshots should have a standard width and height.
      ],

      changeLog = (
        defaultText = embed "Changelog.md",
        localizations = [
          (locale = "fr", text = embed "meta/t9n-changelog/fr.md"),
        ],
      )
    )
  ),

  sourceMap = (
    # The following directories will be copied into your package.
    searchPath = [
      (sourcePath = ".meteor-spk/deps"),
      (sourcePath = ".meteor-spk/bundle"),
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
        title = (
          defaultText = "participate",
          localizations = [
            (locale = "fr", text = "participer"),
          ],
        ),
        description = (
          defaultText = "allows participating in the board",
          localizations = [
            (locale = "fr", text = "permet de participer dans le tableau"),
          ],
        )
      ), (
        name = "configure",
        title = (
          defaultText = "configure",
          localizations = [
            (locale = "fr", text = "configurer"),
          ],
        ),
        description = (
          defaultText = "allows configuring the board",
          localizations = [
            (locale = "fr", text = "permet de configurer le tableau"),
          ],
        )
      )],

      roles = [(
        title = (
          defaultText = "observer",
          localizations = [
            (locale = "fr", text = "observateur"),
          ],
        ),
        permissions = [false, false],
        verbPhrase = (
          defaultText = "can read",
          localizations = [
            (locale = "fr", text = "peut lire"),
          ],
        )
      ), (
        title = (
          defaultText = "member",
          localizations = [
            (locale = "fr", text = "membre"),
          ],
        ),
        permissions = [true, false],
        verbPhrase = (
          defaultText = "can edit",
          localizations = [
            (locale = "fr", text = "peut éditer"),
          ],
        ),
        default = true,
      # ), (
      #   title = (defaultText = "administrator"),
      #   permissions = [true, true],
      #   verbPhrase = (defaultText = "can configure")
      #
      # XXX Administrators configuration options aren’t implemented yet, so this
      # role is currently useless.
      )]
    )
  ),
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
