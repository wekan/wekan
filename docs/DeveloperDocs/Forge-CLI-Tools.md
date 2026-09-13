# Forge CLI tools

In `build.sh`, select **Tools → Install forge CLI tools**. The corresponding
Windows menu is available in `build.bat`. Installed commands are skipped.

The Go install paths for Tea and Forge are:

```sh
go install gitea.dev/tea@latest
go install github.com/git-pkgs/forge/cmd/forge@latest
```

The former `code.gitea.io/tea` module fetches an obsolete Tea version. Forge's
module root is a library; installing it produces “is not a main package”. Its
executable lives under `cmd/forge`.

If the old Tea executable was installed already, the menu skips it. Run the Tea
command above to update it. Go installs commands into `GOBIN`, or into
`$(go env GOPATH)/bin` when `GOBIN` is unset; include that directory in `PATH`.
Use the Go version required by the selected upstream release. The Unix installer
reports Tea/Forge Go installation failures and returns a nonzero status, while
continuing to try subsequent tools.

References: [Tea's installation and compilation guide](https://pkg.go.dev/gitea.dev/tea#section-readme),
[Forge CLI installation](https://github.com/git-pkgs/forge#cli).

The regression suite executes the Unix installer with offline substitutes,
checks Fedora package-manager selection, current paths, skips and failure
continuation, and checks Windows paths. It does not install packages, authenticate
or mirror repositories. Actual Windows execution needs a Windows host.
