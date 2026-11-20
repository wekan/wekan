// Server-only: the mail, calendar, chat and note imports of the Import page,
// from what the page sent (text, parsed JSON, or a .zip as { zipBase64 }) to
// the normalized board KanboardCreator writes. The decoders that are not for
// the client - mailparser, htmlparser2, unzipper - are only reached here.
import { parseMailMessages } from '/models/lib/mailFormat';
import { enexBoard } from '/models/lib/enexFormat';
import { parseGoogleTakeout } from '/models/lib/googleTakeoutFormat';
import { parseSlackExport } from '/models/lib/chatExportFormats';
import { EXTERNAL_PARSERS } from '/models/lib/externalParsers';

const text = value => {
  if (typeof value !== 'string') throw new Error('Paste or choose the exported file');
  return value;
};

export async function parseMessageImport(source, value) {
  switch (source) {
    case 'mail': {
      // A mailbox streamed to the local disk is read a message at a time.
      if (value && typeof value.mboxFile === 'string') {
        const { messages, skipped } = await require('./mailImport').decodeMailFile(value.mboxFile);
        const board = parseMailMessages(messages, { name: 'Imported mail' });
        if (skipped) board.unsupported.push({ path: '/messages', reason: `${skipped} message(s) larger than 32 MB are not imported` });
        return board;
      }
      return parseMailMessages(await require('./mailImport').decodeMail(text(value)), { name: 'Imported mail' });
    }
    case 'evernote': {
      const { notes, cutOff } = require('./enexImport').readEnex(text(value));
      return enexBoard(notes, { cutOff });
    }
    case 'slack':
      return parseSlackExport(await require('./chatArchives').readSlackExport(value));
    case 'googletakeout':
      return parseGoogleTakeout(await require('./chatArchives').readGoogleTakeout(value));
    case 'ical': case 'mattermost': case 'whatsapp':
      return EXTERNAL_PARSERS[source](text(value));
    case 'telegram': case 'discord':
      return EXTERNAL_PARSERS[source](value);
    default:
      throw new Error(`Unknown import source: ${source}`);
  }
}
