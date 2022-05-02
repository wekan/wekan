@0xb412d6a17c04e5cc;

using Spk = import "/sandstorm/package.capnp";

const pkgdef :Spk.PackageDefinition = (
  id = "y49n7yrxk6p3ud1hkgeup1mah6f7a488nancvay7v6y1wxq78cn0",

  manifest = (
    appTitle = (defaultText = "Meteor Accounts Test App"),
    appVersion = 0,
    appMarketingVersion = (defaultText = "0.0.0"),
    actions = [
      ( title = (defaultText = "New Test"),
        command = .myCommand
      )
    ],

    continueCommand = .myCommand,
  ),

  sourceMap = (
    searchPath = [
      ( sourcePath = ".meteor-spk/deps" ),
      ( sourcePath = ".meteor-spk/bundle" )
    ]
  ),

  alwaysInclude = [ "." ],

  bridgeConfig = (
    viewInfo = (
      permissions = [
        (
          name = "editor",  
          title = (defaultText = "editor"),
          description = (defaultText = "grants ability to modify data"),
        ),
        (
          name = "commenter",
          title = (defaultText = "commenter"),
          description = (defaultText = "grants ability to modify data"),
        ),
      ],
      roles = [
        (
          title = (defaultText = "editor"),
          permissions  = [true, true],
          verbPhrase = (defaultText = "can edit"),
          description = (defaultText = "editors may view all site data and change settings."),
        ),
        (
          title = (defaultText = "commenter"),
          permissions  = [false, true],
          verbPhrase = (defaultText = "can comment"),
          description = (defaultText = "viewers may view what other users have written."),
        ),
        (
          title = (defaultText = "viewer"),
          permissions  = [false, false],
          verbPhrase = (defaultText = "can view"),
          description = (defaultText = "viewers may view what other users have written."),
        ),
      ],
    ),
  ),
);

const myCommand :Spk.Manifest.Command = (
  argv = ["/sandstorm-http-bridge", "4000", "--", "node", "start.js"],
  environ = [
    (key = "PATH", value = "/usr/local/bin:/usr/bin:/bin"),
    (key = "SANDSTORM", value = "1"),
  ]
);
