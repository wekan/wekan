package main

import "strings"

// The key layout a handler on a key-value store would have to build: the document
// under d/<id>, and the index of (boardId, archived) as keys b/<board>/<0|1>/<id>
// with no value. A scan of the prefix b/<board>/0/ is "the unarchived cards of a
// board" and counting its keys is the count.
func docKey(id string) []byte { return []byte("d/" + id) }

func boardPrefix(board string) []byte { return []byte("b/" + board + "/0/") }

func indexKey(c Card) []byte {
	a := "0"
	if c.Archived {
		a = "1"
	}
	return []byte("b/" + c.Board + "/" + a + "/" + c.ID)
}

func idFromIndexKey(k []byte) string {
	s := string(k)
	return s[strings.LastIndexByte(s, '/')+1:]
}

// prefixEnd is the first key after every key with the prefix.
func prefixEnd(p []byte) []byte {
	end := append([]byte(nil), p...)
	end[len(end)-1]++
	return end
}
