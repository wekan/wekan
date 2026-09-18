#!/usr/bin/env python3
"""Narrow workarounds for craft-application failures seen in WeKan v11.86.

Run inside the installed Snapcraft environment; never modify the installed snap.
Only remote-build uses these overrides. See Snap-Core.md for upstream sources.
"""
from pathlib import Path
import sys
import time

MIN_SNAP_BYTES = 50 * 1024 * 1024


def valid_snap(path):
    path = Path(path)
    if not path.is_file() or path.stat().st_size < MIN_SNAP_BYTES:
        return False
    with path.open("rb") as stream:
        return stream.read(4) == b"hsqs"


def apply_workarounds(service, bad_request, *, clock=time.monotonic, sleep=time.sleep):
    original_recipe = service._new_recipe
    original_fetch = service.fetch_artifacts

    def get_repository(self):
        # Submission creates ~owner/PROJECT/+git/name, but upstream recovery
        # omits the project and looks for a different personal repository.
        if self._lp_project is None:
            raise RuntimeError("Launchpad project is not initialized for recovery")
        return self.lp.get_repository(
            name=self._name, owner=self.lp.username, project=self._lp_project.name
        )

    def new_recipe(self, name, repository, **kwargs):
        deadline = clock() + 900
        while True:
            try:
                return original_recipe(self, name, repository, **kwargs)
            except bad_request as error:
                # A successful Git transfer may precede Launchpad's ref index.
                # Retry only that exact 400, without pushing the tree again.
                content = getattr(error, "content", b"")
                if isinstance(content, bytes):
                    content = content.decode("utf-8", errors="replace")
                remaining = deadline - clock()
                if not all(text in content for text in ("git_ref:", "No such object", "/+ref/main")) or remaining <= 0:
                    raise
                print("Launchpad has not indexed main yet; retrying recipe creation.", flush=True)
                sleep(min(15, remaining))

    def fetch_artifacts(self, output_dir):
        for attempt in range(3):
            artifacts = list(original_fetch(self, output_dir))
            invalid = [Path(item) for item in artifacts if Path(item).suffix == ".snap" and not valid_snap(item)]
            if not invalid:
                return artifacts
            for path in invalid:
                print(f"Invalid snap download: {path.name}; removing it before retry.", flush=True)
                path.unlink(missing_ok=True)
            if attempt < 2:
                sleep(15)
        # Raising before _monitor_and_complete returns prevents cleanup from
        # deleting the successful remote build. The next --recover can fetch it.
        raise RuntimeError("Snap download remained invalid after three attempts; remote build retained for recovery")

    service._get_repository = get_repository
    service._new_recipe = new_recipe
    service.fetch_artifacts = fetch_artifacts


def main():
    if len(sys.argv) < 2 or sys.argv[1] != "remote-build":
        raise SystemExit("This compatibility launcher supports remote-build only")
    from craft_application.services.remotebuild import RemoteBuildService
    from lazr.restfulclient.errors import BadRequest
    from snapcraft.application import main as snapcraft_main

    apply_workarounds(RemoteBuildService, BadRequest)
    sys.argv[0] = "snapcraft"
    return snapcraft_main()


if __name__ == "__main__":
    sys.exit(main())
