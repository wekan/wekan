package main

import (
	"encoding/json"

	c "github.com/ostafen/clover/v2"
	d "github.com/ostafen/clover/v2/document"
	q "github.com/ostafen/clover/v2/query"
)

// Clover is a document database with indexes and queries of its own, over Badger.
type cloverEng struct {
	db  *c.DB
	dir string
}

func openClover() maker {
	return maker{name: "Clover (document database over Badger)", open: func(dir string) (Engine, error) {
		db, err := c.Open(dir)
		if err != nil {
			return nil, err
		}
		if err := db.CreateCollection("cards"); err != nil {
			return nil, err
		}
		return &cloverEng{db: db, dir: dir}, nil
	}}
}

func (e *cloverEng) Name() string { return "Clover" }

func toDoc(raw []byte) (*d.Document, error) {
	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		return nil, err
	}
	// _id is Clover's own (a UUID); the card's id is kept in cid.
	m["cid"] = m["_id"]
	delete(m, "_id")
	return d.NewDocumentOf(m), nil
}

// fromDoc is the card as JSON again, with its own _id back.
func fromDoc(doc *d.Document) ([]byte, error) {
	m := map[string]any{}
	for k, v := range doc.AsMap() {
		m[k] = v
	}
	m["_id"] = m["cid"]
	delete(m, "cid")
	delete(m, "_id_clover")
	return json.Marshal(m)
}

func (e *cloverEng) Load(cards []Card) error {
	docs := make([]*d.Document, 0, len(cards))
	for _, card := range cards {
		doc, err := toDoc(card.Raw)
		if err != nil {
			return err
		}
		docs = append(docs, doc)
	}
	if err := e.db.Insert("cards", docs...); err != nil {
		return err
	}
	for _, f := range []string{"cid", "boardId"} {
		if err := e.db.CreateIndex("cards", f); err != nil {
			return err
		}
	}
	return nil
}

func (e *cloverEng) one(id string) (*d.Document, error) {
	return e.db.FindFirst(q.NewQuery("cards").Where(q.Field("cid").Eq(id)))
}

func (e *cloverEng) ByID(id string) ([]byte, error) {
	doc, err := e.one(id)
	if err != nil || doc == nil {
		return nil, err
	}
	return fromDoc(doc)
}

func (e *cloverEng) query(board string) *q.Query {
	return q.NewQuery("cards").Where(q.Field("boardId").Eq(board).And(q.Field("archived").Eq(false)))
}

func (e *cloverEng) BoardCards(board string) ([][]byte, error) {
	docs, err := e.db.FindAll(e.query(board))
	if err != nil {
		return nil, err
	}
	// Clover returns decoded documents. They are encoded again so the runner decodes
	// them like every other engine's - which charges Clover for a step it does not need.
	out := make([][]byte, 0, len(docs))
	for _, doc := range docs {
		b, err := fromDoc(doc)
		if err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, nil
}

func (e *cloverEng) CountBoard(board string) (int, error) { return e.db.Count(e.query(board)) }

func (e *cloverEng) Update(id string, change func([]byte) ([]byte, error)) error {
	doc, err := e.one(id)
	if err != nil {
		return err
	}
	raw, err := fromDoc(doc)
	if err != nil {
		return err
	}
	next, err := change(raw)
	if err != nil {
		return err
	}
	var m map[string]any
	if err := json.Unmarshal(next, &m); err != nil {
		return err
	}
	m["cid"] = m["_id"]
	delete(m, "_id")
	return e.db.Update(q.NewQuery("cards").Where(q.Field("cid").Eq(id)), m)
}

func (e *cloverEng) Insert(card Card) error {
	doc, err := toDoc(card.Raw)
	if err != nil {
		return err
	}
	_, err = e.db.InsertOne("cards", doc)
	return err
}

func (e *cloverEng) SizeBytes() int64 { return dirSize(e.dir) }
func (e *cloverEng) Close() error     { return e.db.Close() }
