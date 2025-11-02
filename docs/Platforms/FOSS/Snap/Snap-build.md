# Building the Wekan snap without timeouts

This guide focuses on macOS hosts (Multipass VM) and common timeout fixes. It also applies to Linux hosts with LXD.

## Quick options

- Fastest: use Canonical builders (no local VM)

  ```zsh
  # One-time: login to the store (required for remote-build)
  snapcraft login
  
  # Build for amd64 on Canonical builders
  snapcraft remote-build --build-for=amd64
  ```

- Local VM (macOS + Multipass): increase resources and build verbosely

  ```zsh
  # Give the builder more CPU/RAM/disk to avoid sluggish downloads
  export SNAPCRAFT_BUILD_ENVIRONMENT=hosted-multipass
  export SNAPCRAFT_BUILD_ENVIRONMENT_CPU=4
  export SNAPCRAFT_BUILD_ENVIRONMENT_MEMORY=8G
  export SNAPCRAFT_BUILD_ENVIRONMENT_DISK=40G
  
  # Clean previous state and build
  snapcraft clean
  snapcraft --verbose --debug
  ```

## What changed to reduce timeouts

- Downloads in `wekan` part now retry with exponential backoff.
- `caddy` part now attempts APT with retries and falls back to a static binary from the official GitHub release if APT is slow or unreachable.

These changes make the build resilient to transient network issues and slow mirrors.

## Diagnosing where it stalls

- Run a single step for a part to reproduce:
  ```zsh
  snapcraft pull wekan -v
  snapcraft build wekan -v
  ```
- Drop into the build environment when it fails:
  ```zsh
  snapcraft --debug
  # Then run the failing commands manually
  ```

## Tips for macOS + Multipass

- Check networking:
  ```zsh
  multipass list
  multipass exec snapcraft-*-wekan -- ping -c2 github.com
  ```
- If the instance looks wedged, recreate it:
  ```zsh
  snapcraft clean --use-lxd || true   # harmless on macOS
  snapcraft clean --step pull
  multipass delete --purge $(multipass list | awk '/snapcraft-/{print $1}')
  snapcraft --verbose
  ```

## Linux hosts (optional)

On Linux, using LXD is often faster and more reliable than Multipass:

```bash
sudo snap install lxd --channel=5.21/stable
newgrp lxd
snapcraft --use-lxd -v
```

## Common environment knobs

- Proxy/mirror environments inside the build VM if needed:
  ```zsh
  export http_proxy=http://proxy.example:3128
  export https_proxy=$http_proxy
  export SNAPCRAFT_PROXY_HTTP=$http_proxy
  export SNAPCRAFT_PROXY_HTTPS=$https_proxy
  ```

- Speed up apt by pinning retries (already set in the recipe) or switching to a closer mirror by customizing sources in an override if needed.

## Cleaning up caches

If repeated attempts keep hitting corrupt downloads, clean Snapcraft caches:

```zsh
snapcraft clean --destructive-mode || true
rm -rf ~/.cache/snapcraft/*
```

## Reporting

If you still hit timeouts, capture and share:
- The exact step (pull/build/stage/prime) and part name
- Output of `snapcraft --verbose --debug`
- Host OS and Snapcraft version: `snapcraft --version`
- Multipass resources: `multipass list`
