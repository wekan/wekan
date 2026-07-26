#!/usr/bin/env python3
"""Python mirror of releases/translations/fill-translations.mjs.

Same rules, so the two are interchangeable — this exists only for environments
without a node runtime (the VSCode sandbox has none). It NEVER overwrites a human
translation: a key counts as fillable only while it is a placeholder, i.e. missing
from the language file or equal to the English source.

  python3 releases/translations/fill_translations.py --missing
  python3 releases/translations/fill_translations.py --list <lang> [--limit N]
  python3 releases/translations/fill_translations.py --apply <lang> <translations.json>
  python3 releases/translations/fill_translations.py --union      # every key that is a
                                                                  # placeholder somewhere
"""
import json
import os
import re
import sys

DATA_DIR = 'imports/i18n/data'
EN_FILE = os.path.join(DATA_DIR, 'en.i18n.json')


def read_json(path):
    try:
        with open(path, encoding='utf-8') as handle:
            return json.load(handle)
    except Exception:
        return None


EN = read_json(EN_FILE)
if EN is None:
    sys.exit(f'[fill] cannot read {EN_FILE}')
EN_KEYS = list(EN)


def is_placeholder(lang_json, key):
    """key missing, or value equal to the English source."""
    return isinstance(EN.get(key), str) and (
        not isinstance(lang_json.get(key), str) or lang_json[key] == EN[key])


def is_english_variant(code):
    return re.match(r'^en([_-].*)?$', code) is not None


def lang_file(code):
    return os.path.join(DATA_DIR, f'{code}.i18n.json')


def languages():
    for name in sorted(os.listdir(DATA_DIR)):
        if not name.endswith('.i18n.json') or name == 'en.i18n.json':
            continue
        code = name[:-len('.i18n.json')]
        if is_english_variant(code):
            continue
        yield code


def placeholders(code):
    data = read_json(lang_file(code)) or {}
    return [k for k in EN_KEYS if is_placeholder(data, k)]


def write_ordered(path, data):
    """en.i18n.json key order, 2-space indent, trailing newline — as the .mjs does."""
    ordered = {k: data[k] for k in EN_KEYS if isinstance(data.get(k), str)}
    for k, v in data.items():
        if k not in ordered:
            ordered[k] = v
    with open(path, 'w', encoding='utf-8') as handle:
        handle.write(json.dumps(ordered, ensure_ascii=False, indent=2) + '\n')


def main(argv):
    mode = argv[0] if argv else ''
    if mode == '--missing':
        rows = [(code, len(placeholders(code))) for code in languages()]
        rows = [r for r in rows if r[1]]
        rows.sort(key=lambda r: r[1])
        for code, miss in rows:
            print(f'{miss}\t{code}')
        print(f'[fill] {len(rows)} language(s) still have untranslated strings.',
              file=sys.stderr)
        return 0
    if mode == '--union':
        seen = {}
        for code in languages():
            for key in placeholders(code):
                seen[key] = seen.get(key, 0) + 1
        out = {k: EN[k] for k in EN_KEYS if k in seen}
        print(json.dumps(out, ensure_ascii=False, indent=2))
        print(f'[fill] {len(out)} distinct key(s) are a placeholder in some language.',
              file=sys.stderr)
        return 0
    if mode == '--list':
        code = argv[1] if len(argv) > 1 else ''
        if not code:
            sys.exit('[fill] --list needs a <lang>')
        limit = 0
        if '--limit' in argv:
            try:
                limit = int(argv[argv.index('--limit') + 1])
            except (IndexError, ValueError):
                limit = 0
        keys = placeholders(code)
        if limit > 0:
            keys = keys[:limit]
        print(json.dumps({k: EN[k] for k in keys}, ensure_ascii=False, indent=2))
        print(f'[fill] {code}: {len(keys)} placeholder(s) to translate.', file=sys.stderr)
        return 0
    if mode == '--apply':
        if len(argv) < 3:
            sys.exit('[fill] --apply needs <lang> <translations.json>')
        code, path = argv[1], argv[2]
        data = read_json(lang_file(code))
        if data is None:
            sys.exit(f'[fill] cannot read {lang_file(code)}')
        translations = read_json(path)
        if translations is None:
            sys.exit(f'[fill] cannot read {path}')
        filled = skipped_human = ignored = 0
        for key, value in translations.items():
            if key not in EN:
                ignored += 1
                continue
            if not isinstance(value, str) or not value.strip() or value == EN[key]:
                ignored += 1
                continue
            if not is_placeholder(data, key):
                skipped_human += 1
                continue
            data[key] = value
            filled += 1
        write_ordered(lang_file(code), data)
        print(f'[fill] {code}: filled {filled}, skipped {skipped_human} existing human '
              f'translation(s), ignored {ignored}.', file=sys.stderr)
        return 0
    sys.exit('Usage: fill_translations.py --missing | --union | --list <lang> [--limit N] '
             '| --apply <lang> <file.json>')


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
