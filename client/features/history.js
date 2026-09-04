// The universal change History view
// (docs/Features/Reports/History/History.md). ONE template serves every scope -
// the card group menu, the whole card, Member settings, Board settings, and the
// swimlane and list menus - so there is one file to register here however many
// menus offer History.
//
// The .jade, the .js AND the .css all have to be listed. package.json sets
// meteor.mainModule, so a file nothing imports is simply not in the bundle: an
// unimported .jade means the template does not exist and the menu item opens
// nothing, and an unimported .css means it renders unstyled. Both have happened
// in this directory before (see the note in features/settings.js).
import '/client/components/history/historyTable.jade';
import '/client/components/history/historyTable.js';
import '/client/components/history/historyTable.css';
