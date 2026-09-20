# File type detection on server platforms

Uploads, extension correction and Admin Panel / Problems file status checks share
`models/lib/mimeDetection.js`. They prefer the system `file` utility, then use the
bundled [wasmagic](https://github.com/moshen/wasmagic) libmagic engine and embedded
magic database. The portable engine is a production npm dependency and requires
no download, external service or native compilation at runtime.

This fallback applies to Windows, macOS, Linux, Docker, Snap and Sandstorm server
bundles, including source development. Browser/mobile clients use the server's
validation. Windows needs no separate `file.exe`. The Linux dependency menu installs
native `file` on supported distributions; Docker includes it and Snap stages it
with its magic database. Snap detection passes the staged database to the native
command without changing the global environment.

Preserve the whole `wasmagic` package, including `dist/libmagic-wrapper.wasm`,
when packaging or trimming npm dependencies. Its wrapper is resolved from the
Meteor server's runtime npm directory so the WASM remains beside its loader.
`releases/verify-mime-runtime.cjs <bundle>` rejects missing dependencies/assets
and tests real HTML detection; the release bundle smoke test runs this check.
Run `npm install` when updating a source checkout.

Portable detection reads at most 64 KiB per file. Unknown, encrypted or truncated
formats can remain inconclusive; type detection is not malware scanning. Existing
upload content checks, sanitization and audit limits still apply. If both engines
fail, upload validation retains its JavaScript sniffing fallback and logs a warning.
A missing native command alone no longer produces that warning.

Regression coverage includes real portable HTML/JSON/text/PDF detection with no
`file` on PATH, concurrent initialization, missing files, invalid inputs, an
isolated Meteor npm layout, and missing module/WASM rejection. The browser file
status test also checks HTML (which the binary `file-type` package does not detect)
and confirms that diagnostic checks leave file contents and metadata unchanged.
