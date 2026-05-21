#!/bin/sh

set -e

THE_ARCH_BIN=""
DEST=frankenphp

OS=$(uname -s)
ARCH=$(uname -m)

case ${OS} in
Linux*)
	case ${ARCH} in
	aarch64)
		THE_ARCH_BIN="frankenphp-linux-aarch64"
		;;
	x86_64)
		THE_ARCH_BIN="frankenphp-linux-x86_64"
		;;
	*)
		THE_ARCH_BIN=""
		;;
	esac
	;;
Darwin*)
	case ${ARCH} in
	arm64)
		THE_ARCH_BIN="frankenphp-mac-arm64"
		;;
	*)
		THE_ARCH_BIN="frankenphp-mac-x86_64"
		;;
	esac
	;;
Windows | MINGW64_NT*)
	echo "Install and use WSL to use FrankenPHP on Windows: https://learn.microsoft.com/windows/wsl/"
	exit 1
	;;
*)
	THE_ARCH_BIN=""
	;;
esac

if [ -z "${THE_ARCH_BIN}" ]; then
	echo "FrankenPHP is not supported on ${OS} and ${ARCH}"
	exit 1
fi

curl -L --progress-bar "https://github.com/dunglas/frankenphp/releases/latest/download/${THE_ARCH_BIN}" -o "${DEST}"

chmod +x "${DEST}"

echo "FrankenPHP downloaded successfully to ${DEST}"
