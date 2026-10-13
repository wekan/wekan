#!/usr/bin/env python3
"""Narrow workarounds for craft-application failures seen in WeKan v11.86.

Run inside the installed Snapcraft environment; never modify the installed snap.
Only remote-build uses these overrides. See Snap-Core.md for upstream sources.
"""
from pathlib import Path
import sys
import time

MIN_SNAP_BYTES = 50 * 1024 * 1024
# How long a run of failed build-state polls may last before it is an error.
# The remote build is not affected by a poll failing: v12.39 armhf and s390x
# both BUILT, then sat in Launchpad's "Uploading" for most of an hour while the
# runner's connection to the Launchpad API dropped ("Network is unreachable")
# or a poll hung until a socket timeout - which Python reports as TimeoutError,
# so snapcraft printed "Timed out waiting for build" and exited 75. Each such
# blip ended one of the three attempts, and three blips failed a build that
# had succeeded. The workflow's own deadline (timeout around this process)
# still bounds the whole wait.
POLL_RETRY_WINDOW = 30 * 60
LOCAL_ERRORS = (PermissionError, FileNotFoundError, IsADirectoryError, NotADirectoryError)


def valid_snap(path):
    path = Path(path)
    if not path.is_file() or path.stat().st_size < MIN_SNAP_BYTES:
        return False
    with path.open("rb") as stream:
        return stream.read(4) == b"hsqs"


def apply_workarounds(service, bad_request, *, clock=time.monotonic, sleep=time.sleep, transient=(OSError,)):
    original_recipe = service._new_recipe
    original_fetch = service.fetch_artifacts
    original_states = getattr(service, "_get_build_states", None)

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

    def get_build_states(self):
        # Only polling is retried: it reads state and changes nothing, so a
        # retry cannot duplicate a build. Any other error, and a failure that
        # outlasts the window, still ends the attempt as before.
        started = clock()
        delay = 30
        while True:
            try:
                return original_states(self)
            except transient as error:
                # Local file-system and permission errors are OSErrors too, and
                # no amount of waiting fixes them.
                if isinstance(error, LOCAL_ERRORS) or clock() - started >= POLL_RETRY_WINDOW:
                    raise
                print(f"Launchpad did not answer the build-state poll ({error!r}); "
                      f"retrying in {delay}s. The remote build keeps running.", flush=True)
                sleep(delay)
                delay = min(delay * 2, 300)

    service._get_repository = get_repository
    service._new_recipe = new_recipe
    service.fetch_artifacts = fetch_artifacts
    if original_states is not None:
        service._get_build_states = get_build_states


def main():
    if len(sys.argv) < 2 or sys.argv[1] != "remote-build":
        raise SystemExit("This compatibility launcher supports remote-build only")
    from craft_application.services.remotebuild import RemoteBuildService
    from lazr.restfulclient.errors import BadRequest, ServerError
    from snapcraft.application import main as snapcraft_main

    # A dropped or timed-out connection (OSError covers socket timeouts, which
    # Python raises as TimeoutError, and SSL errors), httplib2's own failures,
    # and a Launchpad 5xx while it is busy are all worth another poll.
    transient = [OSError, ServerError]
    try:
        import httplib2
        transient.append(httplib2.HttpLib2Error)
    except ImportError:
        pass
    apply_workarounds(RemoteBuildService, BadRequest, transient=tuple(transient))
    sys.argv[0] = "snapcraft"
    return snapcraft_main()


if __name__ == "__main__":
    sys.exit(main())
