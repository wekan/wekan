const _ = require('../utils/under-dash');

class Note {
  constructor(note) {
    this.note = note;
  }

  get model() {
    let value = null;
    switch (typeof this.note) {
      case 'string':
        value = {
          type: 'note',
          note: {
            texts: [
              {
                text: this.note,
              },
            ],
          },
        };
        break;
      default:
        value = {
          type: 'note',
          note: this.note,
        };
        break;
    }
    // Suitable for all cell comments
    return _.deepMerge({}, Note.DEFAULT_CONFIGS, value);
  }

  set model(value) {
    const {note} = value;
    const {texts} = note;
    if (texts.length === 1 && Object.keys(texts[0]).length === 1) {
      this.note = texts[0].text;
    } else {
      this.note = note;
    }
  }

  static fromModel(model) {
    const note = new Note();
    note.model = model;
    return note;
  }
}

Note.DEFAULT_CONFIGS = {
  note: {
    margins: {
      insetmode: 'auto',
      inset: [0.13, 0.13, 0.25, 0.25],
    },
    protection: {
      locked: 'True',
      lockText: 'True',
    },
    editAs: 'absolute',
  },
};

module.exports = Note;
