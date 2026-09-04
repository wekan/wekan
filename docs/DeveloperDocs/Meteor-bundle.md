- Read [Wekan new release ChangeLog](../../CHANGELOG.md)
- [Install Meteor.js](https://www.meteor.com/install). Note: Windows install is very slow, please use other option at [Windows wiki page](../Platforms/Propietary/OS/Windows)
- Download newest bundle from https://releases.wekan.team
- Unarchive bundle .tar.gz file: `tar -zxvf wekan-VERSION.tar.gz`
- `cd bundle`
- `meteor`
- Browse with webbrowser like Firefox to http://localhost:3000

[Wekan for Meteor.js bundle bug reports and feature requests](https://github.com/wekan/wekan/issues)

[Build Meteor bundle from source](../Platforms/FOSS/Source)

Note: building from source writes two directories that are easy to confuse.
`.build/` is the release bundle (`meteor build .build --directory`, and
`.build/bundle` is what is deployed); `_build/` is rspack's compiled output,
written by any Meteor compile, which Meteor reads the app's main modules from.
Both are generated and gitignored. See
[Directory-Structure.md](Directory-Structure.md).

[Install from source without root](../Platforms/FOSS/Source/Install-from-source-without-root.md)