export const ACTIVITY_NOTIFICATION_TITLE = Object.freeze({
  BOARD: 'activity-notification-board-title',
  CARD: 'activity-notification-card-title',
});

export function formatActivityNotificationTitle(
  title,
  params,
  translate,
  language,
) {
  if (title === ACTIVITY_NOTIFICATION_TITLE.BOARD) {
    return `${params?.board || ''}`;
  }

  if (title === ACTIVITY_NOTIFICATION_TITLE.CARD) {
    const board = `${params?.board || ''}`;
    const card = `${params?.card || ''}`;
    return board ? `[${board}] ${card}` : card;
  }

  return translate(title, params, language);
}
