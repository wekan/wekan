#!/bin/bash
# Refuse a FerretDB release that predates nested positional projections.
# Meteor resumes a browser session with a projection on
# services.resume.loginTokens.$; FerretDB v1.63.0 is the first published fork
# release that handles the nested login-token filter used by that projection.

set -uo pipefail

minimum=v1.63.0
tag="${1:-}"

if [ -z "$tag" ]; then
    tag="$(bash "$(dirname "$0")/ferretdb-latest-tag.sh")"
fi

case "$tag" in
    v[0-9]*.[0-9]*.[0-9]*) ;;
    *)
        echo "::error::Could not identify the newest FerretDB release; refusing to build a bundle whose persistent login compatibility is unknown." >&2
        exit 1 ;;
esac

version_at_least() {
    local actual="${1#v}" required="${2#v}"
    local actual_major actual_minor actual_patch required_major required_minor required_patch
    IFS=. read -r actual_major actual_minor actual_patch <<< "$actual"
    IFS=. read -r required_major required_minor required_patch <<< "$required"
    actual_patch="${actual_patch%%[^0-9]*}"
    required_patch="${required_patch%%[^0-9]*}"

    (( actual_major > required_major )) ||
        (( actual_major == required_major && actual_minor > required_minor )) ||
        (( actual_major == required_major && actual_minor == required_minor && actual_patch >= required_patch ))
}

if ! version_at_least "$tag" "$minimum"; then
    echo "::error::FerretDB $tag predates persistent-login support; publish and use $minimum or newer before building WeKan." >&2
    exit 1
fi

printf '%s\n' "$tag"
