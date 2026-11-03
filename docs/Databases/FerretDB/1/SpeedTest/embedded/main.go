// Embedded engines for FerretDB, compared with the SQLite it uses today.
//
// FerretDB is one Go binary, and its SQLite handler is the modernc.org/sqlite driver
// inside it. Which of the databases implemented in Go (awesome-go) could be linked in
// beside it, and is any of them faster for what WeKan asks? This is the engine
// level of that question: the same cards, the same questions, asked of each engine
// the way a handler written for it would ask. See README.md.
//
//	go run . -data <dir with cards.jsonl and params.json> [-only sqlite,pebble] [-out results.json]
package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// Card is one WeKan card: what the questions read, and the whole document.
type Card struct {
	ID       string `json:"_id"`
	Board    string `json:"boardId"`
	List     string `json:"listId"`
	Archived bool   `json:"archived"`
	Raw      []byte `json:"-"`
}

// Engine is what a FerretDB handler needs from a storage engine for WeKan.
type Engine interface {
	Name() string
	// Load stores the cards and builds the indexes: by _id, and by (boardId, archived).
	Load(cards []Card) error
	ByID(id string) ([]byte, error)
	// BoardCards returns the unarchived cards of a board.
	BoardCards(board string) ([][]byte, error)
	CountBoard(board string) (int, error)
	// Update reads the card, changes it in Go and writes it back, which is what
	// FerretDB's updateOne does.
	Update(id string, change func([]byte) ([]byte, error)) error
	Insert(c Card) error
	SizeBytes() int64
	Close() error
}

type params struct {
	Scale  float64  `json:"scale"`
	Cards  int      `json:"cards"`
	Boards []string `json:"boards"`
}

func main() {
	dataDir := flag.String("data", "", "directory with cards.jsonl and params.json")
	only := flag.String("only", "", "comma separated engine names to run")
	outFile := flag.String("out", "", "write the results as JSON")
	workDir := flag.String("work", "", "where the engines keep their files (default: a temporary directory)")
	flag.Parse()

	cards, p := readData(*dataDir)
	byBoard := map[string][]Card{}
	for _, c := range cards {
		byBoard[c.Board] = append(byBoard[c.Board], c)
	}

	root := *workDir
	if root == "" {
		var err error
		root, err = os.MkdirTemp("", "embeddedbench")
		must(err)
	}
	defer os.RemoveAll(root)

	var results []Result
	for _, mk := range engines() {
		name := mk.name
		if *only != "" && !contains(strings.Split(*only, ","), name) {
			continue
		}
		dir := filepath.Join(root, strings.NewReplacer(" ", "_", "/", "_", "(", "", ")", "").Replace(name))
		must(os.MkdirAll(dir, 0o755))
		fmt.Fprintf(os.Stderr, "== %s\n", name)
		res, err := run(mk.open, name, dir, cards, byBoard, p)
		if err != nil {
			fmt.Fprintf(os.Stderr, "   FAILED: %v\n", err)
			results = append(results, Result{Name: name, Error: err.Error()})
			continue
		}
		results = append(results, *res)
	}

	report(results, p)
	if *outFile != "" {
		b, _ := json.MarshalIndent(results, "", "  ")
		must(os.WriteFile(*outFile, b, 0o644))
	}
}

func readData(dir string) ([]Card, params) {
	var p params
	b, err := os.ReadFile(filepath.Join(dir, "params.json"))
	must(err)
	must(json.Unmarshal(b, &p))

	f, err := os.Open(filepath.Join(dir, "cards.jsonl"))
	must(err)
	defer f.Close()

	var cards []Card
	sc := bufio.NewScanner(f)
	sc.Buffer(make([]byte, 1<<20), 1<<24)
	for sc.Scan() {
		line := bytes.TrimSpace(sc.Bytes())
		if len(line) == 0 {
			continue
		}
		var c Card
		must(json.Unmarshal(line, &c))
		c.Raw = append([]byte(nil), line...)
		cards = append(cards, c)
	}
	must(sc.Err())
	return cards, p
}

func must(err error) {
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func contains(list []string, s string) bool {
	for _, x := range list {
		if x == s {
			return true
		}
	}
	return false
}

func median(d []time.Duration) time.Duration {
	sort.Slice(d, func(i, j int) bool { return d[i] < d[j] })
	return d[len(d)/2]
}

// modify is the change an updateOne makes: decode, set, encode.
func modify(raw []byte, key string, value any) ([]byte, error) {
	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		return nil, err
	}
	m[key] = value
	return json.Marshal(m)
}
