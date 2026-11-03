package main

import (
	"github.com/cockroachdb/pebble"
)

type pebbleEng struct {
	db  *pebble.DB
	dir string
}

func openPebble() maker {
	return maker{name: "Pebble (CockroachDB's LSM)", open: func(dir string) (Engine, error) {
		db, err := pebble.Open(dir, &pebble.Options{})
		if err != nil {
			return nil, err
		}
		return &pebbleEng{db: db, dir: dir}, nil
	}}
}

func (e *pebbleEng) Name() string { return "Pebble" }

func (e *pebbleEng) Load(cards []Card) error {
	b := e.db.NewBatch()
	for i, c := range cards {
		if err := b.Set(docKey(c.ID), c.Raw, nil); err != nil {
			return err
		}
		if err := b.Set(indexKey(c), nil, nil); err != nil {
			return err
		}
		if i%5000 == 4999 {
			if err := b.Commit(pebble.NoSync); err != nil {
				return err
			}
			b = e.db.NewBatch()
		}
	}
	if err := b.Commit(pebble.NoSync); err != nil {
		return err
	}
	return e.db.Flush()
}

func (e *pebbleEng) ByID(id string) ([]byte, error) {
	v, closer, err := e.db.Get(docKey(id))
	if err != nil {
		return nil, err
	}
	defer closer.Close()
	return append([]byte(nil), v...), nil
}

func (e *pebbleEng) ids(board string) ([]string, error) {
	p := boardPrefix(board)
	it, err := e.db.NewIter(&pebble.IterOptions{LowerBound: p, UpperBound: prefixEnd(p)})
	if err != nil {
		return nil, err
	}
	defer it.Close()
	var ids []string
	for ok := it.First(); ok; ok = it.Next() {
		ids = append(ids, idFromIndexKey(it.Key()))
	}
	return ids, it.Error()
}

func (e *pebbleEng) BoardCards(board string) ([][]byte, error) {
	ids, err := e.ids(board)
	if err != nil {
		return nil, err
	}
	out := make([][]byte, 0, len(ids))
	for _, id := range ids {
		d, err := e.ByID(id)
		if err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, nil
}

func (e *pebbleEng) CountBoard(board string) (int, error) {
	ids, err := e.ids(board)
	return len(ids), err
}

func (e *pebbleEng) Update(id string, change func([]byte) ([]byte, error)) error {
	d, err := e.ByID(id)
	if err != nil {
		return err
	}
	next, err := change(d)
	if err != nil {
		return err
	}
	return e.db.Set(docKey(id), next, pebble.NoSync)
}

func (e *pebbleEng) Insert(c Card) error {
	b := e.db.NewBatch()
	_ = b.Set(docKey(c.ID), c.Raw, nil)
	_ = b.Set(indexKey(c), nil, nil)
	return b.Commit(pebble.NoSync)
}

func (e *pebbleEng) SizeBytes() int64 { return dirSize(e.dir) }
func (e *pebbleEng) Close() error     { return e.db.Close() }
