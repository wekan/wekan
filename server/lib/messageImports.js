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
    case 'outlook': {
      // Outlook's .msg, or a .zip of .msg and .eml (server/lib/microsoftArchives.js).
      const messages = await require('./microsoftArchives').readOutlookMessages(value);
      // A message's attachments go with its card; those without data (an
      // embedded message) are counted by parseMailMessages.
      return parseMailMessages(messages, { name: messages.length === 1 ? (messages[0].subject || 'Imported Outlook mail') : 'Imported Outlook mail' });
    }
    case 'evernote': {
      const { notes, cutOff } = require('./enexImport').readEnex(text(value));
      return enexBoard(notes, { cutOff });
    }
    case 'slack':
      return parseSlackExport(await require('./chatArchives').readSlackExport(value));
    case 'googletakeout':
      return parseGoogleTakeout(await require('./chatArchives').readGoogleTakeout(value));
    case 'mattermost':
      return EXTERNAL_PARSERS.mattermost(value && Array.isArray(value.jsonLines) ? value : text(value));
    case 'rocketchat':
      if (value && (typeof value.zipFile === 'string' || typeof value.zipBase64 === 'string')) {
        return EXTERNAL_PARSERS.rocketchat(await require('./chatArchives').readRocketChatExport(value));
      }
      return EXTERNAL_PARSERS.rocketchat(text(value));
    case 'ical': case 'whatsapp':
      return EXTERNAL_PARSERS[source](text(value));
    case 'telegram': case 'discord':
      // The export folder zipped: its JSON and the message files beside it.
      if (value && (typeof value.zipFile === 'string' || typeof value.zipBase64 === 'string')) {
        const archives = require('./chatArchives');
        return EXTERNAL_PARSERS[source](await (source === 'telegram' ? archives.readTelegramExport(value) : archives.readDiscordExport(value)));
      }
      return EXTERNAL_PARSERS[source](value);
    default:
      throw new Error(`Unknown import source: ${source}`);
  }
}
