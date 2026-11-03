package main

import (
	"bytes"
	"fmt"
	"path/filepath"

	bolt "go.etcd.io/bbolt"
)

type boltEng struct {
	db  *bolt.DB
	dir string
}

// bbolt fsyncs on every commit, which the others here do not; "NoSync" is the same
// engine without it, for a like-for-like with SQLite's synchronous=NORMAL.
func openBolt(name string, noSync bool) maker {
	return maker{name: name, open: func(dir string) (Engine, error) {
		db, err := bolt.Open(filepath.Join(dir, "cards.bolt"), 0o600, &bolt.Options{NoSync: noSync})
		if err != nil {
			return nil, err
		}
		db.NoSync = noSync
		return &boltEng{db: db, dir: dir}, nil
	}}
}

func (e *boltEng) Name() string { return "bbolt" }

func (e *boltEng) Load(cards []Card) error {
	return e.db.Update(func(tx *bolt.Tx) error {
		d, err := tx.CreateBucketIfNotExists([]byte("d"))
		if err != nil {
			return err
		}
		b, err := tx.CreateBucketIfNotExists([]byte("b"))
		if err != nil {
			return err
		}
		for _, c := range cards {
			if err := d.Put([]byte(c.ID), c.Raw); err != nil {
				return err
			}
			if err := b.Put(indexKey(c)[2:], nil); err != nil { // without the b/
				return err
			}
		}
		return nil
	})
}

func (e *boltEng) ByID(id string) ([]byte, error) {
	var out []byte
	err := e.db.View(func(tx *bolt.Tx) error {
		v := tx.Bucket([]byte("d")).Get([]byte(id))
		if v == nil {
			return fmt.Errorf("not found")
		}
		out = append([]byte(nil), v...)
		return nil
	})
	return out, err
}

func (e *boltEng) scan(tx *bolt.Tx, board string, f func(id string) error) error {
	p := boardPrefix(board)[2:]
	c := tx.Bucket([]byte("b")).Cursor()
	for k, _ := c.Seek(p); k != nil && bytes.HasPrefix(k, p); k, _ = c.Next() {
		if err := f(idFromIndexKey(k)); err != nil {
			return err
		}
	}
	return nil
}

func (e *boltEng) BoardCards(board string) ([][]byte, error) {
	var out [][]byte
	err := e.db.View(func(tx *bolt.Tx) error {
		d := tx.Bucket([]byte("d"))
		return e.scan(tx, board, func(id string) error {
			out = append(out, append([]byte(nil), d.Get([]byte(id))...))
			return nil
		})
	})
	return out, err
}

func (e *boltEng) CountBoard(board string) (int, error) {
	n := 0
	err := e.db.View(func(tx *bolt.Tx) error { return e.scan(tx, board, func(string) error { n++; return nil }) })
	return n, err
}

func (e *boltEng) Update(id string, change func([]byte) ([]byte, error)) error {
	return e.db.Update(func(tx *bolt.Tx) error {
		d := tx.Bucket([]byte("d"))
		cur := d.Get([]byte(id))
		if cur == nil {
			return fmt.Errorf("not found")
		}
		next, err := change(append([]byte(nil), cur...))
		if err != nil {
			return err
		}
		return d.Put([]byte(id), next)
	})
}

func (e *boltEng) Insert(c Card) error {
	return e.db.Update(func(tx *bolt.Tx) error {
		if err := tx.Bucket([]byte("d")).Put([]byte(c.ID), c.Raw); err != nil {
			return err
		}
		return tx.Bucket([]byte("b")).Put(indexKey(c)[2:], nil)
	})
}

func (e *boltEng) SizeBytes() int64 { return dirSize(e.dir) }
func (e *boltEng) Close() error     { return e.db.Close() }
