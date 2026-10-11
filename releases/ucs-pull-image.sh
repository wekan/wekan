# Sourced by the generated UCS preinst and the publisher's anonymous checks.
# Keep the version fixed while trying the three independently hosted copies.
ucs_pull_image() {
    local requested="$1" mirror="${2:-}" suffix candidate
    case "$requested" in
        ghcr.io/wekan/wekan:*|ghcr.io/wekan/ferretdb:*) suffix="${requested#ghcr.io/wekan/}" ;;
        *) echo "Unsupported UCS image: $requested" >&2; return 1 ;;
    esac
    for candidate in "$mirror" "$requested" "docker.io/wekanteam/$suffix" "quay.io/wekan/$suffix"; do
        [ -n "$candidate" ] || continue
        echo "Trying UCS image $candidate" >&2
        if timeout 600 docker pull "$candidate"; then
            # The hook and compose keep their canonical names. A failed remote
            # pull must never let an unrelated stale local image pass this check.
            if [ "$candidate" != "$requested" ]; then
                docker tag "$candidate" "$requested" || return 1
            fi
            return 0
        fi
    done
    echo "Cannot download $requested from the UCS mirror, GHCR, Docker Hub or Quay; upgrade cancelled before downtime" >&2
    return 1
}

# App Center invokes <component>.preinst beside <component>.compose in its
# target-version cache (App.get_cache_file). Never read the installed OLD compose
# and never guess the mirror tag: UCS can rename it, including -ucsN suffixes.
ucs_compose_image() {
    python3 - "$1" "$2" <<'PYTHON'
import re
import sys
from pathlib import Path

# Read only the static image fields in our generated two-service template.
# UCR code elsewhere in the template must not be evaluated merely to pull an
# image. Reject unsupported/ambiguous fields rather than selecting an old image.
service = None
images = []
for line in Path(sys.argv[1]).read_text().splitlines():
    match = re.fullmatch(r"  ([a-zA-Z0-9_-]+):\s*", line)
    if match:
        service = match[1]
    match = re.fullmatch(r"    image:\s*(.*?)\s*", line)
    if match and service == sys.argv[2]:
        value = match[1].split(' #', 1)[0].strip().strip('"\'')
        if not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9._/:@-]+', value):
            raise SystemExit('UCS compose image must be a static versioned reference')
        if ':' not in value.rsplit('/', 1)[-1] and '@sha256:' not in value:
            raise SystemExit('UCS compose image must pin a version')
        images.append(value)
if len(images) != 1:
    raise SystemExit('Missing or ambiguous UCS compose image for ' + sys.argv[2])
print(images[0])
PYTHON
}
