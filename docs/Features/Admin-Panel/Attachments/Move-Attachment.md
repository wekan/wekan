# Move Attachment

Move attachments, avatars or both from one storage backend to another. The
source may be one exact backend or every Read-enabled backend; the destination
is one of CollectionFS, MongoDB GridFS, Filesystem, S3 / MinIO, Azure Blob or
Google Cloud Storage. An explicit source cannot equal its destination.

The operation runs as a server-side job and stores progress. Both modern and
Legacy HTML4 views display the current/total count and filename or the last move.
A running job can be paused, resumed or cancelled. **Repair file locations**
scans attachment and avatar metadata and repairs filesystem/GridFS locations
whose recorded backend no longer matches their binary.

The HTML4 view uses one labelled fieldset plus signed POST controls and calls the
same Global Admin-only methods as Jade. The server validates scope, source,
destination, configured read/write state and the one-active-job invariant;
refused HTML4 requests are reported to Problems / Security. The same-URL test
captures both forms without starting a move against existing files.
