#!/usr/bin/env python3
"""Recompute the glyph bounding boxes of the vendored Font Awesome fonts.

WHY THIS EXISTS

Firefox logs one warning per glyph, on every page load, for every Font Awesome
file WeKan serves:

    downloadable font: glyf: Glyph bbox was incorrect; adjusting (glyph 19)
    (font-family: "Font Awesome 6 Free" style:normal weight:400 stretch:100
    src index:0) source: .../webfonts/fa-regular-400.woff2

819 of the 2163 glyphs in the four files are affected, so the console fills with
hundreds of lines and stops being useful for spotting anything else.

Every TrueType glyph stores its own bounding box in the `glyf` table. Font
Awesome ships boxes that are TIGHTER than the outline: they bound the on-curve
points only, while the box has to bound the control points too, because a
quadratic curve can bulge past its endpoints. Firefox's OpenType sanitiser
notices, corrects the box in memory and says so. Nothing renders wrongly - the
warning is the whole of the damage - but the numbers in the file are wrong, and
they are wrong upstream, in Font Awesome's own build.

WHAT IT DOES

Recomputes every glyph's box from its points, updates the font-wide box in
`head`, and writes the `.ttf` and the `.woff2` from that one corrected font, so
the pair cannot drift. Outlines, glyph order, character map and advance widths
are untouched: this only rewrites four numbers per glyph.

Idempotent, and that is the point - re-run it after upgrading Font Awesome and
it will either fix the new files or report that there was nothing to fix.

    python3 releases/fix-font-bboxes.py            # fix in place
    python3 releases/fix-font-bboxes.py --check    # report only, exit 1 if wrong

Needs fontTools (and brotli, for woff2):  pip3 install fonttools brotli

tests/fontGlyphBounds.test.cjs is the guard: it reads the `.ttf` files with its
own parser and fails if any stated box disagrees with the outline, so a Font
Awesome upgrade that reintroduces this cannot pass unnoticed.
"""

import argparse
import os
import sys

WEBFONTS = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'packages', 'wekan-fontawesome', 'fontawesome-free', 'webfonts',
)

# The stems that have both a .ttf and a .woff2. The .ttf is always the source:
# it is the one fontTools reads reliably (fa-regular-400.woff2 does not
# round-trip through fontTools' woff2 reader at all), and the pair is written
# from it so the two cannot disagree about anything, bounding boxes included.
STEMS = ['fa-brands-400', 'fa-regular-400', 'fa-solid-900', 'fa-v4compatibility']


def wrong_bounds(font):
    """Names of glyphs whose stated box does not bound their points."""
    glyf = font['glyf']
    out = []
    for name in font.getGlyphOrder():
        glyph = glyf[name]
        if glyph.numberOfContours == 0:
            continue
        before = (glyph.xMin, glyph.yMin, glyph.xMax, glyph.yMax)
        glyph.recalcBounds(glyf)
        if before != (glyph.xMin, glyph.yMin, glyph.xMax, glyph.yMax):
            out.append(name)
    return out


def snapshot(font):
    """Everything this script must NOT change."""
    glyf = font['glyf']
    return {
        'order': list(font.getGlyphOrder()),
        'cmap': dict(font['cmap'].getBestCmap()),
        'hmtx': dict(font['hmtx'].metrics),
        'contours': {n: glyf[n].numberOfContours for n in font.getGlyphOrder()},
        'coords': {
            n: (list(glyf[n].coordinates), list(glyf[n].flags))
            for n in font.getGlyphOrder() if glyf[n].numberOfContours > 0
        },
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true',
                        help='report wrong boxes and exit 1, writing nothing')
    args = parser.parse_args()

    try:
        from fontTools.ttLib import TTFont
    except ImportError:
        print('fontTools is needed: pip3 install fonttools brotli', file=sys.stderr)
        return 2

    total = 0
    for stem in STEMS:
        ttf = os.path.join(WEBFONTS, stem + '.ttf')
        woff2 = os.path.join(WEBFONTS, stem + '.woff2')
        if not os.path.exists(ttf):
            print(f'{stem}: no .ttf, skipped', file=sys.stderr)
            continue

        # recalcTimestamp=False keeps Font Awesome's own head.modified. Without
        # it every run stamps "now", so re-running churns the binary and two runs
        # of the same script over the same input disagree - in a vendored file
        # that is committed, that is noise nobody can review.
        font = TTFont(ttf, recalcTimestamp=False)
        before = snapshot(font)
        bad = wrong_bounds(font)     # recalcBounds has now been applied
        total += len(bad)

        if args.check:
            print(f'{stem:22} {len(bad):4} glyph(s) with a wrong bounding box')
            continue

        if not bad:
            print(f'{stem:22} already correct, left alone')
            continue

        # The font-wide box in `head` is the union of the glyph boxes, so it
        # moves with them.
        glyf = font['glyf']
        boxes = [(glyf[n].xMin, glyf[n].yMin, glyf[n].xMax, glyf[n].yMax)
                 for n in font.getGlyphOrder() if glyf[n].numberOfContours != 0]
        head = font['head']
        head.xMin = min(b[0] for b in boxes)
        head.yMin = min(b[1] for b in boxes)
        head.xMax = max(b[2] for b in boxes)
        head.yMax = max(b[3] for b in boxes)

        font.flavor = None
        font.save(ttf)
        font.flavor = 'woff2'
        font.save(woff2)

        # Read back what was actually written, and refuse to leave anything
        # behind that differs in any way other than the boxes.
        for path in (ttf, woff2):
            check = TTFont(path, recalcTimestamp=False)
            after = snapshot(check)
            for key in before:
                if before[key] != after[key]:
                    print(f'{path}: {key} CHANGED - not writing this font',
                          file=sys.stderr)
                    return 1
            assert not wrong_bounds(check), f'{path}: boxes still wrong'

        print(f'{stem:22} fixed {len(bad):4} glyph(s), wrote .ttf and .woff2')

    if args.check and total:
        print(f'\n{total} glyph(s) have a wrong bounding box. '
              f'Fix with: python3 releases/fix-font-bboxes.py', file=sys.stderr)
        return 1

    return 0


if __name__ == '__main__':
    sys.exit(main())
