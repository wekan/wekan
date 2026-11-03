package main

// engines lists what is compared, the baseline first.
func engines() []maker {
	return []maker{
		openSQLite("SQLite as FerretDB uses it (JSON, expression indexes)", "normal", false),
		openSQLite("SQLite, plain columns (not what FerretDB does)", "normal", true),
		openSQLite("SQLite as FerretDB uses it, synchronous=FULL", "full", false),
		openPebble(),
		openBadger(),
		openBolt("bbolt, no fsync", true),
		openBolt("bbolt, fsync on every commit (its default)", false),
		openBunt(),
		openNuts(),
		openClover(),
	}
}
