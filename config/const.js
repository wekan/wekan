export const ALLOWED_BOARD_COLORS = [
  'belize',
  'nephritis',
  'pomegranate',
  'pumpkin',
  'wisteria',
  'moderatepink',
  'strongcyan',
  'limegreen',
  'midnight',
  'dark',
  'relax',
  'corteza',
  'appleglasspastel',
  'clearblue',
  'cleargreen',
  'clearorange',
  'clearpink',
  'clearpurple',
  'clearred',
  'natural',
  'modern',
  'moderndark',
  'exodark',
  'cleandark',
  'cleanlight',
];

// The product default when neither the user, current board, nor site/tenant
// settings choose a theme. Keep this in the allowed board-colour list so the
// same CSS class and validation path is used everywhere.
export const DEFAULT_GLOBAL_THEME_COLOR = 'appleglasspastel';

// New boards should open in the same Apple Glass Pastel v2 experience as the
// rest of the app. Keep this separate from ALLOWED_BOARD_COLORS[0], because the
// palette order is user-facing and still starts with the legacy flat colours.
export const DEFAULT_BOARD_THEME_COLOR = DEFAULT_GLOBAL_THEME_COLOR;

export const ALLOWED_COLORS = [
  'white',
  'green',
  'yellow',
  'orange',
  'red',
  'purple',
  'blue',
  'sky',
  'lime',
  'pink',
  'black',
  'silver',
  'peachpuff',
  'crimson',
  'plum',
  'darkgreen',
  'slateblue',
  'magenta',
  'gold',
  'navy',
  'gray',
  'saddlebrown',
  'paleturquoise',
  'mistyrose',
  'indigo',
];
export const TYPE_BOARD = 'board';
export const TYPE_CARD = 'cardType-card';
export const TYPE_LINKED_BOARD = 'cardType-linkedBoard';
export const TYPE_LINKED_CARD = 'cardType-linkedCard';
export const TYPE_TEMPLATE_BOARD = 'template-board';
export const TYPE_TEMPLATE_CONTAINER = 'template-container';
export const TYPE_TEMPLATE_CARD = 'template-card';
export const TYPE_TEMPLATE_LIST = 'template-list';
export const CARD_TYPES = [
  TYPE_CARD,
  TYPE_LINKED_CARD,
  TYPE_LINKED_BOARD,
  TYPE_TEMPLATE_CARD
];
export const ALLOWED_WAIT_SPINNERS = [
  'Bounce',
  'Cube',
  'Cube-Grid',
  'Dot',
  'Double-Bounce',
  'Rotateplane',
  'Scaleout',
  'Wave'
];
