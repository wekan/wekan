#!/usr/bin/env python3
"""Stream a V8 .heapsnapshot and say what is holding the memory.

    python3 releases/analyse-heapsnapshot.py Heap.*.heapsnapshot

Written for the `meteor build` that runs out of heap: build.sh with
WEKAN_BUILD_HEAP_SNAPSHOT=1 leaves a snapshot behind, and this says what is in
it. Chrome DevTools can do the same, but it has to load the whole file into a
browser first - several gigabytes - and this streams, so it answers on a
machine that could not open it.

It aggregates SELF size by node type and by (type, name). Self size, not
retained size: retained size needs the dominator tree, which needs the whole
graph in memory, which is the thing being avoided. Self size is enough to say
WHAT there is a lot of, which is the question.

Reading the output: a type with a huge total and a huge count is many small
objects, and the name column says what they are. On the run this was written
for, 14.3 million IgnoreRule objects held 980 MB.
"""
import sys, json, collections, re

path = sys.argv[1]

# ---- header: field layout and type names ----------------------------------
with open(path, 'rb') as f:
    head = f.read(8192).decode('utf-8', 'replace')
# Brace-match the meta object: it contains nested arrays, so slicing on a
# following key name splits it in the wrong place.
_i = head.index('"meta":') + len('"meta":')
_d = 0
for _j in range(_i, len(head)):
    if head[_j] == '{':
        _d += 1
    elif head[_j] == '}':
        _d -= 1
        if _d == 0:
            meta = json.loads(head[_i:_j + 1])
            break
NF = meta['node_fields']
NODE_TYPES = meta['node_types'][0]
n_fields = len(NF)
i_type, i_name, i_self = NF.index('type'), NF.index('name'), NF.index('self_size')

def array_span(f, key):
    """Byte offset just after `"key":[` ."""
    f.seek(0)
    needle = f'"{key}":['.encode()
    buf = b''
    pos = 0
    while True:
        chunk = f.read(1 << 20)
        if not chunk:
            raise SystemExit(f'{key} not found')
        buf += chunk
        i = buf.find(needle)
        if i >= 0:
            return pos + i + len(needle)
        pos += len(buf) - len(needle)
        buf = buf[-len(needle):]

by_type = collections.Counter()
by_name = collections.Counter()
count_by_name = collections.Counter()

with open(path, 'rb') as f:
    start = array_span(f, 'nodes')
    f.seek(start)
    field = 0
    cur = [0] * n_fields
    num = 0
    have = False
    total_nodes = 0
    while True:
        chunk = f.read(1 << 22)
        if not chunk:
            break
        done = False
        for b in chunk:
            if 48 <= b <= 57:
                num = num * 10 + (b - 48)
                have = True
            elif b == 44:            # ,
                cur[field] = num
                num = 0; have = False
                field += 1
                if field == n_fields:
                    by_type[cur[i_type]] += cur[i_self]
                    if cur[i_self]:
                        by_name[(cur[i_type], cur[i_name])] += cur[i_self]
                        count_by_name[(cur[i_type], cur[i_name])] += 1
                    field = 0
                    total_nodes += 1
            elif b == 93:            # ]  end of nodes
                if have:
                    cur[field] = num
                    by_type[cur[i_type]] += cur[i_self]
                    if cur[i_self]:
                        by_name[(cur[i_type], cur[i_name])] += cur[i_self]
                        count_by_name[(cur[i_type], cur[i_name])] += 1
                    total_nodes += 1
                done = True
                break
        if done:
            break

# ---- resolve the names we care about --------------------------------------
wanted = {n for (_t, n), _v in by_name.most_common(60)}
names = {}
with open(path, 'rb') as f:
    start = array_span(f, 'strings')
    f.seek(start)
    idx = 0
    buf = ''
    decoder = json.JSONDecoder()
    pending = ''
    in_str = False
    cur_chars = []
    esc = False
    while True:
        chunk = f.read(1 << 22)
        if not chunk:
            break
        text = chunk.decode('utf-8', 'replace')
        stop = False
        for ch in text:
            if in_str:
                if esc:
                    cur_chars.append(ch); esc = False
                elif ch == '\\':
                    esc = True
                elif ch == '"':
                    in_str = False
                    if idx in wanted:
                        names[idx] = ''.join(cur_chars)[:70]
                    idx += 1
                    cur_chars = []
                    if idx > max(wanted) if wanted else 0:
                        stop = True
                        break
                else:
                    cur_chars.append(ch)
            else:
                if ch == '"':
                    in_str = True; cur_chars = []
                elif ch == ']':
                    stop = True; break
        if stop:
            break

MB = 1024 * 1024
grand = sum(by_type.values())
print(f'nodes: {total_nodes:,}   total self size: {grand/MB:,.0f} MB\n')

print('By node type:')
for t, v in by_type.most_common():
    if v / MB < 1:
        continue
    print(f'  {NODE_TYPES[t]:<20} {v/MB:>10,.0f} MB')

print('\nTop retainers by (type, name), self size:')
for (t, n), v in by_name.most_common(25):
    nm = names.get(n, f'<string #{n}>')
    print(f'  {v/MB:>9,.0f} MB  {count_by_name[(t,n)]:>10,} x  {NODE_TYPES[t]:<12} {nm}')
