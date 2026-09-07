# Filesystem Storage

Enable or disable reading files already stored on the local filesystem and
calculate attachment and avatar counts. The pane shows the actual writable base,
attachment and avatar directories resolved on the server, including Snap-aware
paths; it never guesses `WRITABLE_PATH` in browser code.

The modern checkbox and the Legacy HTML4 desired-state POST use the same Global
Admin-only settings method. The statistics button uses the same database count,
and the HTML4 result remains visible after its POST response. The same-URL test
changes Read, verifies Jade observes it, calculates counts, compares screenshots
and restores the original setting.
