package main

import (
	"github.com/dgraph-io/badger/v4"
)

type badgerEng struct {
	db  *badger.DB
	dir string
}

func openBadger() maker {
	return maker{name: "Badger", open: func(dir string) (Engine, error) {
		db, err := badger.Open(badger.DefaultOptions(dir).WithLogger(nil).WithSyncWrites(false))
		if err != nil {
			return nil, err
		}
		return &badgerEng{db: db, dir: dir}, nil
	}}
}

func (e *badgerEng) Name() string { return "Badger" }

func (e *badgerEng) Load(cards []Card) error {
	wb := e.db.NewWriteBatch()
	defer wb.Cancel()
	for _, c := range cards {
		if err := wb.Set(docKey(c.ID), c.Raw); err != nil {
			return err
		}
		if err := wb.Set(indexKey(c), nil); err != nil {
			return err
		}
	}
	return wb.Flush()
}

func (e *badgerEng) ByID(id string) ([]byte, error) {
	var out []byte
	err := e.db.View(func(tx *badger.Txn) error {
		it, err := tx.Get(docKey(id))
		if err != nil {
			return err
		}
		out, err = it.ValueCopy(nil)
		return err
	})
	return out, err
}

func (e *badgerEng) BoardCards(board string) ([][]byte, error) {
	var out [][]byte
	err := e.db.View(func(tx *badger.Txn) error {
		p := boardPrefix(board)
		it := tx.NewIterator(badger.IteratorOptions{Prefix: p})
		defer it.Close()
		var ids []string
		for it.Rewind(); it.Valid(); it.Next() {
			ids = append(ids, idFromIndexKey(it.Item().Key()))
		}
		for _, id := range ids {
			item, err := tx.Get(docKey(id))
			if err != nil {
				return err
			}
			v, err := item.ValueCopy(nil)
			if err != nil {
				return err
			}
			out = append(out, v)
		}
		return nil
	})
	return out, err
}

func (e *badgerEng) CountBoard(board string) (int, error) {
	n := 0
	err := e.db.View(func(tx *badger.Txn) error {
		it := tx.NewIterator(badger.IteratorOptions{Prefix: boardPrefix(board)})
		defer it.Close()
		for it.Rewind(); it.Valid(); it.Next() {
			n++
		}
		return nil
	})
	return n, err
}

func (e *badgerEng) Update(id string, change func([]byte) ([]byte, error)) error {
	return e.db.Update(func(tx *badger.Txn) error {
		item, err := tx.Get(docKey(id))
		if err != nil {
			return err
		}
		d, err := item.ValueCopy(nil)
		if err != nil {
			return err
		}
		next, err := change(d)
		if err != nil {
			return err
		}
		return tx.Set(docKey(id), next)
	})
}

func (e *badgerEng) Insert(c Card) error {
	return e.db.Update(func(tx *badger.Txn) error {
		if err := tx.Set(docKey(c.ID), c.Raw); err != nil {
			return err
		}
		return tx.Set(indexKey(c), nil)
	})
}

// SizeBytes is -1: Badger keeps a recent write in its memtable and preallocates its
// log files, so the directory says nothing about what the data takes.
func (e *badgerEng) SizeBytes() int64 { return -1 }
func (e *badgerEng) Close() error     { return e.db.Close() }
