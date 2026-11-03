package main

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"syscall"

	_ "modernc.org/sqlite"
)

// SQLite as FerretDB uses it: modernc.org/sqlite, WAL, synchronous NORMAL, a 64 MiB
// cache and 256 MiB of mmap (FerretDB's defaults, metadata/pool/uri.go). The
// document is JSON text and the indexes are on json_extract expressions, which is
// how FerretDB indexes a field. "columns" keeps the same document but indexes real
// columns, which FerretDB does not do; it shows what SQLite itself could do.
type sqliteEng struct {
	name    string
	db      *sql.DB
	dir     string
	columns bool
}

func openSQLite(name, sync string, columns bool) maker {
	return maker{name: name, open: func(dir string) (Engine, error) {
		path := filepath.Join(dir, "cards.sqlite")
		dsn := fmt.Sprintf("file:%s?_pragma=journal_mode(wal)&_pragma=synchronous(%s)&_pragma=cache_size(-65536)&_pragma=mmap_size(268435456)&_pragma=temp_store(memory)&_pragma=busy_timeout(30000)&_txlock=immediate", path, sync)
		db, err := sql.Open("sqlite", dsn)
		if err != nil {
			return nil, err
		}
		db.SetMaxOpenConns(1)
		return &sqliteEng{name: name, db: db, dir: dir, columns: columns}, nil
	}}
}

func (e *sqliteEng) Name() string { return e.name }

func (e *sqliteEng) Load(cards []Card) error {
	create := `CREATE TABLE cards (doc TEXT NOT NULL)`
	insert := `INSERT INTO cards (doc) VALUES (?)`
	if e.columns {
		create = `CREATE TABLE cards (id TEXT PRIMARY KEY, board TEXT, archived INTEGER, doc TEXT NOT NULL)`
		insert = `INSERT INTO cards (id, board, archived, doc) VALUES (?, ?, ?, ?)`
	}
	if _, err := e.db.Exec(create); err != nil {
		return err
	}
	tx, err := e.db.Begin()
	if err != nil {
		return err
	}
	st, err := tx.Prepare(insert)
	if err != nil {
		return err
	}
	for _, c := range cards {
		if e.columns {
			_, err = st.Exec(c.ID, c.Board, boolInt(c.Archived), string(c.Raw))
		} else {
			_, err = st.Exec(string(c.Raw))
		}
		if err != nil {
			return err
		}
	}
	if err = tx.Commit(); err != nil {
		return err
	}
	idx := []string{
		`CREATE UNIQUE INDEX cards_id ON cards (json_extract(doc, '$._id'))`,
		`CREATE INDEX cards_board ON cards (json_extract(doc, '$.boardId'), json_extract(doc, '$.archived'))`,
	}
	if e.columns {
		idx = []string{`CREATE INDEX cards_board ON cards (board, archived)`}
	}
	for _, q := range idx {
		if _, err = e.db.Exec(q); err != nil {
			return err
		}
	}
	_, err = e.db.Exec(`ANALYZE`)
	return err
}

func (e *sqliteEng) where() (id, board string) {
	if e.columns {
		return `id = ?`, `board = ? AND archived = 0`
	}
	return `json_extract(doc, '$._id') = ?`, `json_extract(doc, '$.boardId') = ? AND json_extract(doc, '$.archived') = 0`
}

func (e *sqliteEng) ByID(id string) ([]byte, error) {
	w, _ := e.where()
	var doc string
	err := e.db.QueryRow(`SELECT doc FROM cards WHERE `+w, id).Scan(&doc)
	return []byte(doc), err
}

func (e *sqliteEng) BoardCards(board string) ([][]byte, error) {
	_, w := e.where()
	rows, err := e.db.Query(`SELECT doc FROM cards WHERE `+w, board)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out [][]byte
	for rows.Next() {
		var doc string
		if err := rows.Scan(&doc); err != nil {
			return nil, err
		}
		out = append(out, []byte(doc))
	}
	return out, rows.Err()
}

func (e *sqliteEng) CountBoard(board string) (int, error) {
	_, w := e.where()
	var n int
	err := e.db.QueryRow(`SELECT COUNT(*) FROM cards WHERE `+w, board).Scan(&n)
	return n, err
}

func (e *sqliteEng) Update(id string, change func([]byte) ([]byte, error)) error {
	w, _ := e.where()
	tx, err := e.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var doc string
	if err = tx.QueryRow(`SELECT doc FROM cards WHERE `+w, id).Scan(&doc); err != nil {
		return err
	}
	next, err := change([]byte(doc))
	if err != nil {
		return err
	}
	if _, err = tx.Exec(`UPDATE cards SET doc = ? WHERE `+w, string(next), id); err != nil {
		return err
	}
	return tx.Commit()
}

func (e *sqliteEng) Insert(c Card) error {
	if e.columns {
		_, err := e.db.Exec(`INSERT INTO cards (id, board, archived, doc) VALUES (?, ?, ?, ?)`, c.ID, c.Board, boolInt(c.Archived), string(c.Raw))
		return err
	}
	_, err := e.db.Exec(`INSERT INTO cards (doc) VALUES (?)`, string(c.Raw))
	return err
}

func (e *sqliteEng) SizeBytes() int64 {
	_, _ = e.db.Exec(`PRAGMA wal_checkpoint(TRUNCATE)`)
	return dirSize(e.dir)
}

func (e *sqliteEng) Close() error { return e.db.Close() }

func boolInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

// dirSize is what the files really occupy: the blocks, not the apparent size, which
// counts the sparse files Badger preallocates.
func dirSize(dir string) int64 {
	var n int64
	_ = filepath.Walk(dir, func(_ string, info os.FileInfo, err error) error {
		if err == nil && !info.IsDir() {
			if st, ok := info.Sys().(*syscall.Stat_t); ok {
				n += st.Blocks * 512
			} else {
				n += info.Size()
			}
		}
		return nil
	})
	return n
}
