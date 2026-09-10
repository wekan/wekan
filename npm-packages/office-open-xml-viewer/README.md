# WeKan Office Open XML viewer fork

This directory vendors the browser runtime from `@silurus/ooxml` 0.85.2 for
WeKan's read-only DOCX, XLSX and PPTX attachment previews. Its upstream source
is <https://github.com/yukiyokotani/office-open-xml-viewer> at release v0.85.2
(commit `9756f5e`). The source npm tarball SHA256 is
`7dd3995b65e45adfab9d7686e1a2eb69d4c5a9851cbd025e63aaf97869110831`.

Only the three browser viewer entry graphs, their WebAssembly parsers and their
render workers are retained. The upstream Node API, MCP server, VS Code
extension, examples, site, source toolchain, type declarations and optional
MathJax, ChartEx, region-map and TIFF entry points are excluded. This package
has no npm dependencies or lifecycle scripts.

The compiled runtime remains upstream's MIT-licensed code. `LICENSE` and
`THIRD_PARTY_NOTICES.md` are retained verbatim. Update this fork only from a
reviewed, pinned upstream release and repeat the attachment security tests.
