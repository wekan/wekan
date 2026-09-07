# Default Save Storage

Select the backend used for new attachments, avatars and generated compatibility
images. The five supported values are Filesystem, MongoDB GridFS, S3 / MinIO,
Azure Blob and Google Cloud Storage. Existing files remain where they are until
the Move Attachment pane moves them.

The modern and Legacy HTML4 views call the same Global Admin-only operation. The
server accepts an exact backend identifier from the fixed list; a hidden-field or
direct request cannot introduce another storage name. HTML4 uses a labelled native
select followed by Save, in natural keyboard order.

The same-URL browser test changes the setting through HTML4, verifies the stored
value and the modern pane, captures both views, and restores the original global
setting.
