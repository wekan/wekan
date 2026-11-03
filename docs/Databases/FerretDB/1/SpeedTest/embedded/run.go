package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"
)

type maker struct {
	name string
	open func(dir string) (Engine, error)
}

// Result is one engine's numbers. Times are milliseconds for one call.
type Result struct {
	Name      string             `json:"name"`
	Error     string             `json:"error,omitempty"`
	LoadMs    float64            `json:"loadMs"`
	SizeMB    float64            `json:"sizeMB"`
	Queries   map[string]float64 `json:"queries"`
	Slowest   map[string]float64 `json:"slowest"`
	TotalMs   float64            `json:"totalMs"`
	TotalSlow float64            `json:"totalSlowestMs"`
}

var queryOrder = []string{"byId", "boardCards", "countBoard", "update", "move", "insert"}

// sample times f: it is repeated until about 15 ms have passed (at most 400 times)
// and the mean of one call is returned, so a microsecond call is not lost in the
// clock. It is taken three times and the median returned.
func sample(f func(i int) error) (time.Duration, error) {
	var out []time.Duration
	for pass := 0; pass < 3; pass++ {
		start := time.Now()
		n := 0
		for n < 400 && (n == 0 || time.Since(start) < 15*time.Millisecond) {
			if err := f(n); err != nil {
				return 0, err
			}
			n++
		}
		out = append(out, time.Since(start)/time.Duration(n))
	}
	return median(out), nil
}

func run(open func(string) (Engine, error), name, dir string, cards []Card, byBoard map[string][]Card, p params) (*Result, error) {
	e, err := open(dir)
	if err != nil {
		return nil, err
	}
	defer e.Close()

	res := &Result{Name: name, Queries: map[string]float64{}, Slowest: map[string]float64{}}

	t0 := time.Now()
	if err = e.Load(cards); err != nil {
		return nil, fmt.Errorf("load: %w", err)
	}
	res.LoadMs = float64(time.Since(t0).Microseconds()) / 1000
	res.SizeMB = float64(e.SizeBytes()) / (1 << 20)

	// Correctness first: a fast wrong answer is no answer.
	for _, b := range p.Boards {
		want := 0
		for _, c := range byBoard[b] {
			if !c.Archived {
				want++
			}
		}
		docs, err := e.BoardCards(b)
		if err != nil {
			return nil, err
		}
		n, err := e.CountBoard(b)
		if err != nil {
			return nil, err
		}
		if len(docs) != want || n != want {
			return nil, fmt.Errorf("board %s: %d cards and a count of %d, want %d", b, len(docs), n, want)
		}
		first := byBoard[b][0]
		raw, err := e.ByID(first.ID)
		if err != nil {
			return nil, err
		}
		var back Card
		if err := json.Unmarshal(raw, &back); err != nil || back.ID != first.ID || back.Board != first.Board {
			return nil, fmt.Errorf("byId %s returned %q", first.ID, string(raw))
		}
	}

	// Reads: each is asked with every parameter board, and the cell is the average of
	// the per-parameter medians, like the speed test's. "Slowest" is the worst board.
	reads := map[string]func(b string, i int) error{
		"byId": func(b string, i int) error {
			cs := byBoard[b]
			_, err := e.ByID(cs[i%len(cs)].ID)
			return err
		},
		"boardCards": func(b string, i int) error {
			docs, err := e.BoardCards(b)
			if err != nil {
				return err
			}
			for _, d := range docs { // decoded, as FerretDB must
				var m map[string]any
				if err := json.Unmarshal(d, &m); err != nil {
					return err
				}
			}
			return nil
		},
		"countBoard": func(b string, i int) error { _, err := e.CountBoard(b); return err },
		// The same fetch without decoding: the part that differs between engines.
		"boardRaw": func(b string, i int) error { _, err := e.BoardCards(b); return err },
	}
	for _, q := range []string{"byId", "boardCards", "boardRaw", "countBoard"} {
		var sum, worst float64
		for _, b := range p.Boards {
			f := reads[q]
			d, err := sample(func(i int) error { return f(b, i) })
			if err != nil {
				return nil, fmt.Errorf("%s: %w", q, err)
			}
			ms := float64(d.Nanoseconds()) / 1e6
			sum += ms
			if ms > worst {
				worst = ms
			}
		}
		res.Queries[q] = sum / float64(len(p.Boards))
		res.Slowest[q] = worst
	}

	// Writes: 200 different cards each, so nothing is a no-op; the mean of a call.
	ids := make([]string, 0, 200)
	for i := 0; i < len(cards) && len(ids) < 200; i += len(cards) / 200 {
		ids = append(ids, cards[i].ID)
	}
	writes := []struct {
		name string
		f    func(i int) error
	}{
		{"update", func(i int) error {
			return e.Update(ids[i%len(ids)], func(raw []byte) ([]byte, error) { return modify(raw, "title", fmt.Sprintf("Edited %d", i)) })
		}},
		{"move", func(i int) error {
			return e.Update(ids[(i+1)%len(ids)], func(raw []byte) ([]byte, error) {
				m, err := modify(raw, "sort", 100000+i)
				if err != nil {
					return nil, err
				}
				return modify(m, "listId", "moved")
			})
		}},
		{"insert", func(i int) error {
			doc := fmt.Sprintf(`{"_id":"new%d","boardId":"%s","listId":"l","archived":false,"title":"New","sort":%d}`, i, p.Boards[0], i)
			return e.Insert(Card{ID: fmt.Sprintf("new%d", i), Board: p.Boards[0], Raw: []byte(doc)})
		}},
	}
	for _, w := range writes {
		start := time.Now()
		for i := 0; i < len(ids); i++ {
			if err := w.f(i); err != nil {
				return nil, fmt.Errorf("%s: %w", w.name, err)
			}
		}
		ms := float64(time.Since(start).Nanoseconds()) / 1e6 / float64(len(ids))
		res.Queries[w.name] = ms
		res.Slowest[w.name] = ms
	}

	// The writes must be there.
	raw, err := e.ByID(ids[0])
	if err != nil {
		return nil, err
	}
	if !strings.Contains(string(raw), `"moved"`) {
		return nil, fmt.Errorf("the move was not stored: %s", raw)
	}

	for _, q := range queryOrder {
		res.TotalMs += res.Queries[q]
		res.TotalSlow += res.Slowest[q]
	}
	return res, nil
}

func report(results []Result, p params) {
	ok := results[:0:0]
	for _, r := range results {
		if r.Error == "" {
			ok = append(ok, r)
		}
	}
	// Fastest first.
	for i := range ok {
		for j := i + 1; j < len(ok); j++ {
			if ok[j].TotalMs < ok[i].TotalMs {
				ok[i], ok[j] = ok[j], ok[i]
			}
		}
	}
	fmt.Printf("\nScale %v: %d cards, %d parameter boards. Milliseconds for one call; total = sum of the six.\n\n", p.Scale, p.Cards, len(p.Boards))
	fmt.Println("| # | Engine | Total | By id | Board cards | (raw, not decoded) | Count | Edit | Move | Add | Load (s) | Size (MB) |")
	fmt.Println("| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |")
	for i, r := range ok {
		size := fmt.Sprintf("%.0f", r.SizeMB)
		if r.SizeMB < 0 {
			size = "n/a"
		}
		fmt.Printf("| %d | %s | **%s** | %s | %s | %s | %s | %s | %s | %s | %.1f | %s |\n", i+1, r.Name, ms(r.TotalMs),
			ms(r.Queries["byId"]), ms(r.Queries["boardCards"]), ms(r.Queries["boardRaw"]), ms(r.Queries["countBoard"]),
			ms(r.Queries["update"]), ms(r.Queries["move"]), ms(r.Queries["insert"]), r.LoadMs/1000, size)
	}
	for _, r := range results {
		if r.Error != "" {
			fmt.Printf("\n%s: %s\n", r.Name, r.Error)
		}
	}
	_ = os.Stdout.Sync()
}

func ms(v float64) string {
	switch {
	case v < 0.01:
		return fmt.Sprintf("%.4f", v)
	case v < 10:
		return fmt.Sprintf("%.3f", v)
	case v < 100:
		return fmt.Sprintf("%.1f", v)
	default:
		return fmt.Sprintf("%.0f", v)
	}
}
