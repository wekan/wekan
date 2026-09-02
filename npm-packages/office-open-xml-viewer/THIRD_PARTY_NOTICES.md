# Third-Party Notices

`@silurus/ooxml` is MIT-licensed (see [LICENSE](./LICENSE)). It bundles the
third-party components listed below, none of which are copyleft. This file
is included in the npm tarball so it travels with every install.

## JavaScript / bundled asset

### Natural Earth Admin 0 Countries, 1:110m

The optional Region Map renderer contains a coordinate-quantized derivative of
Natural Earth's Admin 0 Countries 1:110m vector dataset. Natural Earth states
that all versions of its raster and vector data are in the public domain. The
generated source records the exact upstream SHA-256 and fixed feature/vertex
bounds. The boundaries are illustrative, show Natural Earth's default de-facto
point of view, and do not imply this project's endorsement of any territorial
claim.

- Source: <https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson>
- Terms: <https://www.naturalearthdata.com/about/terms-of-use/>

### MathJax + STIX Two Math (`mathjax-stix2.js`)

The optional equation-rendering engine (`@silurus/ooxml/math`, opt-in —
see the [README's "Rendering equations" section](./README.md#rendering-equations))
pre-bundles two Apache-2.0 packages into a single ~3 MB asset
(`packages/core/assets/mathjax-stix2.js`, built by
[`packages/core/build/build-mathjax.mjs`](./packages/core/build/build-mathjax.mjs)).
It ships in the npm tarball but is only fetched by a consuming app at
runtime if that app imports `@silurus/ooxml/math` **and** the loaded
document actually contains an equation.

- **[MathJax](https://www.mathjax.org/)** (`@mathjax/src`, v4.1.2) —
  Copyright © MathJax Consortium. Licensed under the
  [Apache License, Version 2.0](#apache-license-20-full-text).
  <https://github.com/mathjax/MathJax-src>
- **STIX Two Math font, as packaged for MathJax v4**
  (`@mathjax/mathjax-stix2-font`, v4.1.2) — Copyright © MathJax Consortium.
  The npm package declares `"license": "Apache-2.0"` in its `package.json`
  (verified by reading `node_modules/@mathjax/mathjax-stix2-font/package.json`
  directly; the package does not bundle its own `LICENSE` file, so this is
  the authoritative declaration). Licensed under the
  [Apache License, Version 2.0](#apache-license-20-full-text).
  <https://github.com/mathjax/MathJax-fonts>

  Note: the STIX Two Math font is also separately distributed upstream
  (<https://github.com/stipub/stixfonts>) under the SIL Open Font License
  1.1. The build in this repository consumes the Apache-2.0-licensed
  `@mathjax/mathjax-stix2-font` npm package specifically, not the upstream
  OFL font files directly, so Apache-2.0 is the governing license for the
  bytes actually shipped here.

  Neither package includes a Apache-2.0 §4(d) `NOTICE` file (checked in
  the installed `node_modules` tree), so there is no additional NOTICE
  content to reproduce beyond the attribution above.

### Build-time only (not shipped)

The library also declares `esbuild` (MIT) as a build-time dependency
(bundles `mathjax-stix2.js` above) and TypeScript (Apache-2.0) as a
dev/type-check dependency. Neither's code is included in the published
package — noted here for completeness only.

## Rust / WebAssembly

The three parser crates (`docx-parser`, `pptx-parser`, `xlsx-parser`) and
their shared `ooxml-common` crate compile to the `*_parser_bg.wasm` binaries
shipped in `dist/`. Their `wasm32-unknown-unknown` dependency graph is
identical across all three crates (verified with `cargo license
--filter-platform wasm32-unknown-unknown`) and consists entirely of
permissively-licensed crates — no copyleft (GPL/LGPL/AGPL) dependencies:

| License | Crates |
|---|---|
| MIT OR Apache-2.0 | bumpalo, cfg-if, console_error_panic_hook, crc32fast, displaydoc, equivalent, flate2, hashbrown, indexmap, itoa, log, once_cell, proc-macro2, quote, roxmltree, rustversion, serde, serde_core, serde_derive, serde_json, syn, thiserror, thiserror-impl, wasm-bindgen, wasm-bindgen-macro, wasm-bindgen-macro-support, wasm-bindgen-shared |
| (Apache-2.0 OR MIT) AND Unicode-3.0 | unicode-ident |
| 0BSD OR Apache-2.0 OR MIT | adler2 |
| Apache-2.0 | zopfli |
| Apache-2.0 OR MIT OR Zlib | miniz_oxide |
| MIT | simd-adler32, zip, zmij |
| MIT OR Unlicense | memchr |

Full license texts for each crate are available from
[crates.io](https://crates.io/) or the crate's own repository; SPDX
identifiers above match each crate's `Cargo.toml` `license` field. This
list was generated with:

```bash
cargo install cargo-license
cargo license --manifest-path packages/pptx/parser/Cargo.toml \
  --avoid-dev-deps --filter-platform wasm32-unknown-unknown
# docx-parser / xlsx-parser produce an identical dependency set
```

### MCP server (`ooxml-mcp-server`, separate distribution)

`packages/mcp-server` is not part of the `@silurus/ooxml` npm package — it
is a standalone binary distributed independently (see the repository's MCP
server documentation). Its dependency graph is a superset of the table
above (adds `tokio`, `rmcp`, `anyhow`, `schemars`, `tracing`, and their
transitive deps for the async runtime and MCP protocol implementation) and
remains entirely MIT / Apache-2.0, with no copyleft licenses:

```bash
cargo license --manifest-path packages/mcp-server/Cargo.toml --avoid-dev-deps
```

## Unicode Character Database data

The line-breaking, vertical-orientation and Arabic-shaping logic is driven
by tables generated from the Unicode Character Database (UCD), © Unicode,
Inc., licensed under the [Unicode License v3](#unicode-license-v3-full-text)
(SPDX: `Unicode-3.0`), which expressly permits copying, modification and
redistribution of the data files with this notice.

Checked into this repository (generator inputs, each retaining its original
Unicode copyright header; not part of the npm tarball):

- `packages/core/scripts/VerticalOrientation.txt` (UAX #50
  Vertical_Orientation, UCD 17.0.0)
- `packages/docx/scripts/ArabicShaping.txt` (Joining_Type / Joining_Group,
  UCD 17.0.0)
- `packages/docx/scripts/DerivedJoiningType.txt` (UCD 17.0.0)

Shipped in `dist/` as UCD-derived data compiled from the above and from
`LineBreak.txt` / `DerivedGeneralCategory.txt` / `EastAsianWidth.txt`
(fetched at generation time, not checked in): the `*.generated.ts` tables
under `packages/core/src/text/` and `packages/docx/src/` (line-break
classes, East Asian width, vertical orientation, bidi character data,
Arabic joining classes).

The `unicode-ident` Rust crate listed above also carries `Unicode-3.0` in
its SPDX expression for the same reason (embedded UCD-derived tables).

## License texts

- **MIT** — see [LICENSE](./LICENSE) (this repository's own license; the
  MIT-licensed dependencies above use the same standard text with their own
  copyright holder).
- **Unicode License v3** — canonical text at
  <https://www.unicode.org/license.txt>, reproduced below.
- **Apache License, Version 2.0** — full text at
  <https://www.apache.org/licenses/LICENSE-2.0>, reproduced below for
  convenience.

### Unicode License v3 (full text)

```
UNICODE LICENSE V3

COPYRIGHT AND PERMISSION NOTICE

Copyright © 1991-2026 Unicode, Inc.

NOTICE TO USER: Carefully read the following legal agreement. BY
DOWNLOADING, INSTALLING, COPYING OR OTHERWISE USING DATA FILES, AND/OR
SOFTWARE, YOU UNEQUIVOCALLY ACCEPT, AND AGREE TO BE BOUND BY, ALL OF THE
TERMS AND CONDITIONS OF THIS AGREEMENT. IF YOU DO NOT AGREE, DO NOT
DOWNLOAD, INSTALL, COPY, DISTRIBUTE OR USE THE DATA FILES OR SOFTWARE.

Permission is hereby granted, free of charge, to any person obtaining a
copy of data files and any associated documentation (the "Data Files") or
software and any associated documentation (the "Software") to deal in the
Data Files or Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, and/or sell
copies of the Data Files or Software, and to permit persons to whom the
Data Files or Software are furnished to do so, provided that either (a)
this copyright and permission notice appear with all copies of the Data
Files or Software, or (b) this copyright and permission notice appear in
associated Documentation.

THE DATA FILES AND SOFTWARE ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF
THIRD PARTY RIGHTS.

IN NO EVENT SHALL THE COPYRIGHT HOLDER OR HOLDERS INCLUDED IN THIS NOTICE
BE LIABLE FOR ANY CLAIM, OR ANY SPECIAL INDIRECT OR CONSEQUENTIAL DAMAGES,
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THE DATA
FILES OR SOFTWARE.

Except as contained in this notice, the name of a copyright holder shall
not be used in advertising or otherwise to promote the sale, use or other
dealings in these Data Files or Software without prior written
authorization of the copyright holder.
```

### Apache License 2.0 (full text)

```
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS
```
