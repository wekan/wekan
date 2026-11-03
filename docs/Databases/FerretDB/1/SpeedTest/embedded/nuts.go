package main

import (
	"bytes"
	"errors"
	"fmt"

	"github.com/nutsdb/nutsdb"
)

type nutsEng struct {
	db  *nutsdb.DB
	dir string
}

func openNuts() maker {
	return maker{name: "Nutsdb", open: func(dir string) (Engine, error) {
		db, err := nutsdb.Open(nutsdb.DefaultOptions, nutsdb.WithDir(dir), nutsdb.WithSyncEnable(false))
		if err != nil {
			return nil, err
		}
		for _, b := range []string{"d", "b"} {
			if err := db.Update(func(tx *nutsdb.Tx) error { return tx.NewBucket(nutsdb.DataStructureBTree, b) }); err != nil {
				return nil, err
			}
		}
		return &nutsEng{db: db, dir: dir}, nil
	}}
}

func (e *nutsEng) Name() string { return "Nutsdb" }

func (e *nutsEng) Load(cards []Card) error {
	for start := 0; start < len(cards); start += 2000 {
		end := min(start+2000, len(cards))
		if err := e.db.Update(func(tx *nutsdb.Tx) error {
			for _, c := range cards[start:end] {
				if err := tx.Put("d", []byte(c.ID), c.Raw, nutsdb.Persistent); err != nil {
					return err
				}
				if err := tx.Put("b", indexKey(c)[2:], []byte{1}, nutsdb.Persistent); err != nil {
					return err
				}
			}
			return nil
		}); err != nil {
			return err
		}
	}
	return nil
}

func (e *nutsEng) ByID(id string) ([]byte, error) {
	var out []byte
	err := e.db.View(func(tx *nutsdb.Tx) error {
		v, err := tx.Get("d", []byte(id))
		out = append([]byte(nil), v...)
		return err
	})
	return out, err
}

func (e *nutsEng) ids(tx *nutsdb.Tx, board string) ([]string, error) {
	p := boardPrefix(board)[2:]
	keys, _, err := tx.PrefixScanEntries("b", p, "", 0, 1<<30, true, false)
	if err != nil {
		if errors.Is(err, nutsdb.ErrPrefixScan) || errors.Is(err, nutsdb.ErrNotFoundKey) {
			return nil, nil // a prefix with nothing under it is an error here, not an empty list
		}
		return nil, err
	}
	var ids []string
	for _, k := range keys {
		if !bytes.HasPrefix(k, p) {
			continue
		}
		ids = append(ids, idFromIndexKey(k))
	}
	return ids, nil
}

func (e *nutsEng) BoardCards(board string) ([][]byte, error) {
	var out [][]byte
	err := e.db.View(func(tx *nutsdb.Tx) error {
		ids, err := e.ids(tx, board)
		if err != nil {
			return err
		}
		for _, id := range ids {
			v, err := tx.Get("d", []byte(id))
			if err != nil {
				return err
			}
			out = append(out, append([]byte(nil), v...))
		}
		return nil
	})
	return out, err
}

func (e *nutsEng) CountBoard(board string) (int, error) {
	n := 0
	err := e.db.View(func(tx *nutsdb.Tx) error {
		ids, err := e.ids(tx, board)
		n = len(ids)
		return err
	})
	return n, err
}

func (e *nutsEng) Update(id string, change func([]byte) ([]byte, error)) error {
	return e.db.Update(func(tx *nutsdb.Tx) error {
		v, err := tx.Get("d", []byte(id))
		if err != nil {
			return fmt.Errorf("get %s: %w", id, err)
		}
		next, err := change(append([]byte(nil), v...))
		if err != nil {
			return err
		}
		return tx.Put("d", []byte(id), next, nutsdb.Persistent)
	})
}

func (e *nutsEng) Insert(c Card) error {
	return e.db.Update(func(tx *nutsdb.Tx) error {
		if err := tx.Put("d", []byte(c.ID), c.Raw, nutsdb.Persistent); err != nil {
			return err
		}
		return tx.Put("b", indexKey(c)[2:], []byte{1}, nutsdb.Persistent)
	})
}

func (e *nutsEng) SizeBytes() int64 { return dirSize(e.dir) }
func (e *nutsEng) Close() error     { return e.db.Close() }
