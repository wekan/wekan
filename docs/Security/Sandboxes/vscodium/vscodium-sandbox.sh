#!/usr/bin/env bash
# Reset previous attempts
#flatpak kill com.vscodium.codium
flatpak install -y com.vscodium.codium
flatpak override --reset com.vscodium.codium

# Block EVERYTHING except the display and the wekan folder
# ... and one deliberate exception: --talk-name=org.freedesktop.Flatpak lets
# `flatpak-spawn --host docker ...` reach the HOST's Docker, which build.sh's
# docker_available/docker_exec use to run Playwright Firefox and WebKit in the
# official Playwright image when they cannot start inside this sandbox. It is
# a host escape (flatpak-spawn --host runs any host command, and the Docker
# socket is root-equivalent); set WEKAN_SANDBOX_HOST_DOCKER=0 to leave it out.
# README.md beside this file says what it costs.
HOST_DOCKER_ARGS=()
if [ "${WEKAN_SANDBOX_HOST_DOCKER:-1}" != 0 ]; then
  HOST_DOCKER_ARGS=(--talk-name=org.freedesktop.Flatpak)
else
  HOST_DOCKER_ARGS=(--no-talk-name=org.freedesktop.Flatpak)
fi
flatpak override com.vscodium.codium \
  --nofilesystem=home \
  --nofilesystem=host \
  --nofilesystem=xdg-run/gvfs \
  --nofilesystem=xdg-run/gvfsd \
  --filesystem=~/repos/wekan:rw \
  --device=all \
  --socket=wayland \
  --socket=x11 \
  --share=network \
  --user \
  --nosocket=ssh-auth \
  "${HOST_DOCKER_ARGS[@]}"
