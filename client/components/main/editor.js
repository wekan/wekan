Template.editor.onRendered(() => {
  const textareaSelector = 'textarea';
  const enableRicherEditor =
    Meteor.settings.public.RICHER_CARD_COMMENT_EDITOR || true;
  const mentions = [
    // User mentions
    {
      match: /\B@([\w.]*)$/,
      search(term, callback) {
        const currentBoard = Boards.findOne(Session.get('currentBoard'));
        callback(
          currentBoard
            .activeMembers()
            .map(member => {
              const username = Users.findOne(member.userId).username;
              return username.includes(term) ? username : null;
            })
            .filter(Boolean),
        );
      },
      template(value) {
        return value;
      },
      replace(username) {
        return `@${username} `;
      },
      index: 1,
    },
  ];
  const enableTextarea = function() {
    const $textarea = this.$(textareaSelector);
    autosize($textarea);
    $textarea.escapeableTextComplete(mentions);
  };
  if (enableRicherEditor) {
    const isSmall = Utils.isMiniScreen();
    const toolbar = isSmall
      ? [
          ['view', ['fullscreen']],
          ['table', ['table']],
          ['font', ['bold', 'underline']],
          //['fontsize', ['fontsize']],
          ['color', ['color']],
        ]
      : [
          ['style', ['style']],
          ['font', ['bold', 'underline', 'clear']],
          ['fontsize', ['fontsize']],
          ['fontname', ['fontname']],
          ['color', ['color']],
          ['para', ['ul', 'ol', 'paragraph']],
          ['table', ['table']],
          //['insert', ['link', 'picture', 'video']], // iframe tag will be sanitized TODO if iframe[class=note-video-clip] can be added into safe list, insert video can be enabled
          //['insert', ['link', 'picture']], // modal popup has issue somehow :(
          ['view', ['fullscreen', 'help']],
        ];
    const cleanPastedHTML = function(input) {
      const badTags = [
        'style',
        'script',
        'applet',
        'embed',
        'noframes',
        'noscript',
        'meta',
        'link',
        'button',
        'form',
      ].join('|');
      const badPatterns = new RegExp(
        `(?:${[
          `<(${badTags})s*[^>][\\s\\S]*?<\\/\\1>`,
          `<(${badTags})[^>]*?\\/>`,
        ].join('|')})`,
        'gi',
      );
      let output = input;
      // remove bad Tags
      output = output.replace(badPatterns, '');
      // remove attributes ' style="..."'
      const badAttributes = new RegExp(
        `(?:${[
          'on\\S+=([\'"]?).*?\\1',
          'href=([\'"]?)javascript:.*?\\2',
          'style=([\'"]?).*?\\3',
          'target=\\S+',
        ].join('|')})`,
        'gi',
      );
      output = output.replace(badAttributes, '');
      output = output.replace(/(<a )/gi, '$1target=_ '); // always to new target
      return output;
    };
    const editor = '.editor';
    const selectors = [
      `.js-new-comment-form ${editor}`,
      `.js-edit-comment ${editor}`,
    ].join(','); // only new comment and edit comment
    const inputs = $(selectors);
    if (inputs.length === 0) {
      // only enable richereditor to new comment or edit comment no others
      enableTextarea();
    } else {
      const placeholder = inputs.attr('placeholder') || '';
      const mSummernotes = [];
      const getSummernote = function(input) {
        const idx = inputs.index(input);
        if (idx > -1) {
          return mSummernotes[idx];
        }
        return undefined;
      };
      inputs.each(function(idx, input) {
        mSummernotes[idx] = $(input).summernote({
          placeholder,
          callbacks: {
            onInit(object) {
              const originalInput = this;
              $(originalInput).on('input', function() {
                // when comment is submitted, the original textarea will be set to '', so shall we
                if (!this.value) {
                  const sn = getSummernote(this);
                  sn && sn.summernote('reset');
                  object && object.editingArea.find('.note-placeholder').show();
                }
              });
              const jEditor = object && object.editable;
              const toolbar = object && object.toolbar;
              if (jEditor !== undefined) {
                jEditor.escapeableTextComplete(mentions);
              }
              if (toolbar !== undefined) {
                const fBtn = toolbar.find('.btn-fullscreen');
                fBtn.on('click', function() {
                  const $this = $(this),
                    isActive = $this.hasClass('active');
                  $('.minicards').toggle(!isActive); // mini card is still showing when editor is in fullscreen mode, we hide here manually
                });
              }
            },
            onPaste() {
              // clear up unwanted tag info when user pasted in text
              const thisNote = this;
              const updatePastedText = function(object) {
                const someNote = getSummernote(object);
                const original = someNote.summernote('code');
                const cleaned = cleanPastedHTML(original); //this is where to call whatever clean function you want. I have mine in a different file, called CleanPastedHTML.
                someNote.summernote('reset'); //clear original
                someNote.summernote('pasteHTML', cleaned); //this sets the displayed content editor to the cleaned pasted code.
              };
              setTimeout(function() {
                //this kinda sucks, but if you don't do a setTimeout,
                //the function is called before the text is really pasted.
                updatePastedText(thisNote);
              }, 10);
            },
          },
          dialogsInBody: true,
          disableDragAndDrop: true,
          toolbar,
          popover: {
            image: [
              [
                'image',
                ['resizeFull', 'resizeHalf', 'resizeQuarter', 'resizeNone'],
              ],
              ['float', ['floatLeft', 'floatRight', 'floatNone']],
              ['remove', ['removeMedia']],
            ],
            table: [
              ['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
              ['delete', ['deleteRow', 'deleteCol', 'deleteTable']],
            ],
            air: [
              ['color', ['color']],
              ['font', ['bold', 'underline', 'clear']],
            ],
          },
          height: 200,
        });
      });
    }
  } else {
    enableTextarea();
  }
});

import sanitizeXss from 'xss';

// XXX I believe we should compute a HTML rendered field on the server that
// would handle markdown and user mentions. We can simply have two
// fields, one source, and one compiled version (in HTML) and send only the
// compiled version to most users -- who don't need to edit.
// In the meantime, all the transformation are done on the client using the
// Blaze API.
const at = HTML.CharRef({ html: '&commat;', str: '@' });
Blaze.Template.registerHelper(
  'mentions',
  new Template('mentions', function() {
    const view = this;
    let content = Blaze.toHTML(view.templateContentBlock);
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    if (!currentBoard) return HTML.Raw(sanitizeXss(content));
    const knowedUsers = currentBoard.members.map(member => {
      const u = Users.findOne(member.userId);
      if (u) {
        member.username = u.username;
      }
      return member;
    });
    const mentionRegex = /\B@([\w.]*)/gi;

    let currentMention;
    while ((currentMention = mentionRegex.exec(content)) !== null) {
      const [fullMention, username] = currentMention;
      const knowedUser = _.findWhere(knowedUsers, { username });
      if (!knowedUser) {
        continue;
      }

      const linkValue = [' ', at, knowedUser.username];
      let linkClass = 'atMention js-open-member';
      if (knowedUser.userId === Meteor.userId()) {
        linkClass += ' me';
      }
      const link = HTML.A(
        {
          class: linkClass,
          // XXX Hack. Since we stringify this render function result below with
          // `Blaze.toHTML` we can't rely on blaze data contexts to pass the
          // `userId` to the popup as usual, and we need to store it in the DOM
          // using a data attribute.
          'data-userId': knowedUser.userId,
        },
        linkValue,
      );

      content = content.replace(fullMention, Blaze.toHTML(link));
    }

    return HTML.Raw(sanitizeXss(content));
  }),
);

Template.viewer.events({
  // Viewer sometimes have click-able wrapper around them (for instance to edit
  // the corresponding text). Clicking a link shouldn't fire these actions, stop
  // we stop these event at the viewer component level.
  'click a'(event, templateInstance) {
    event.stopPropagation();

    // XXX We hijack the build-in browser action because we currently don't have
    // `_blank` attributes in viewer links, and the transformer function is
    // handled by a third party package that we can't configure easily. Fix that
    // by using directly `_blank` attribute in the rendered HTML.
    event.preventDefault();

    const userId = event.currentTarget.dataset.userid;
    if (userId) {
      Popup.open('member').call({ userId }, event, templateInstance);
    } else {
      const href = event.currentTarget.href;
      if (href) {
        window.open(href, '_blank');
      }
    }
  },
});
