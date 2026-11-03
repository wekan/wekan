package main

import (
	"encoding/json"
	"fmt"
	"path/filepath"

	"github.com/tidwall/buntdb"
)

// BuntDB keeps everything in memory and writes an append-only file. It has indexes
// on JSON fields of its own, so no index keys are built by hand.
type buntEng struct {
	db  *buntdb.DB
	dir string
}

func openBunt() maker {
	return maker{name: "BuntDB (in memory with an append-only file)", open: func(dir string) (Engine, error) {
		db, err := buntdb.Open(filepath.Join(dir, "cards.db"))
		if err != nil {
			return nil, err
		}
		return &buntEng{db: db, dir: dir}, nil
	}}
}

func (e *buntEng) Name() string { return "BuntDB" }

func (e *buntEng) Load(cards []Card) error {
	if err := e.db.Update(func(tx *buntdb.Tx) error {
		for _, c := range cards {
			if _, _, err := tx.Set("card:"+c.ID, string(c.Raw), nil); err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		return err
	}
	return e.db.CreateIndex("board", "card:*", buntdb.IndexJSON("boardId"), buntdb.IndexJSON("archived"))
}

func (e *buntEng) ByID(id string) ([]byte, error) {
	var out []byte
	err := e.db.View(func(tx *buntdb.Tx) error {
		v, err := tx.Get("card:" + id)
		out = []byte(v)
		return err
	})
	return out, err
}

func (e *buntEng) pivot(board string) string {
	b, _ := json.Marshal(board)
	return fmt.Sprintf(`{"boardId":%s,"archived":false}`, b)
}

func (e *buntEng) BoardCards(board string) ([][]byte, error) {
	var out [][]byte
	err := e.db.View(func(tx *buntdb.Tx) error {
		return tx.AscendEqual("board", e.pivot(board), func(_, v string) bool {
			out = append(out, []byte(v))
			return true
		})
	})
	return out, err
}

func (e *buntEng) CountBoard(board string) (int, error) {
	n := 0
	err := e.db.View(func(tx *buntdb.Tx) error {
		return tx.AscendEqual("board", e.pivot(board), func(_, _ string) bool { n++; return true })
	})
	return n, err
}

func (e *buntEng) Update(id string, change func([]byte) ([]byte, error)) error {
	return e.db.Update(func(tx *buntdb.Tx) error {
		v, err := tx.Get("card:" + id)
		if err != nil {
			return err
		}
		next, err := change([]byte(v))
		if err != nil {
			return err
		}
		_, _, err = tx.Set("card:"+id, string(next), nil)
		return err
	})
}

func (e *buntEng) Insert(c Card) error {
	return e.db.Update(func(tx *buntdb.Tx) error {
		_, _, err := tx.Set("card:"+c.ID, string(c.Raw), nil)
		return err
	})
}

func (e *buntEng) SizeBytes() int64 { return dirSize(e.dir) }
func (e *buntEng) Close() error     { return e.db.Close() }
