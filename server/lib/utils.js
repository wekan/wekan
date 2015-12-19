export function allowIsBoardAdmin(userId, board) {
  return board && board.hasAdmin(userId);
}

export function allowIsBoardMember(userId, board) {
  return board && board.hasMember(userId);
}

// todo XXX not really server-specific,
// so move it to a common (client+server) lib?
export const Utils = {
  /**
   * If text starts with a / will remove it.
   * @param text
   */
  stripLeadingSlash(text) {
    // we need an actual text string
    if (!text) {
      return text;
    }
    // if starting with slash
    if (text[0] === '/') {
      return text.slice(1);
    }
    // otherwise leave untouched
    return text;
  },
};
