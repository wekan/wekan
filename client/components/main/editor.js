import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
var converter = require('@wekanteam/html-to-markdown');

const specialHandles = [
  {userId: 'board_members', username: 'board_members'},
  {userId: 'card_members', username: 'card_members'}
];
const specialHandleNames = specialHandles.map(m => m.username);


BlazeComponent.extendComponent({
  onRendered() {
    // Start: Copy <pre> code https://github.com/wekan/wekan/issues/5149
    // TODO: Try to make copyPre visible at Card Details after editing or closing editor or Card Details.
    //       - Also this same TODO below at event, if someone gets it working.
    var copy = function(target) {
      var textArea = document.createElement('textarea');
      textArea.setAttribute('style','width:1px;border:0;opacity:0;');
      document.body.appendChild(textArea);
      textArea.value = target.innerHTML;
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    var pres = document.querySelectorAll(".viewer > pre");
    pres.forEach(function(pre){
      var button = document.createElement("a");
      button.className = "fa fa-copy btn btn-sm right";
      // TODO: Translate text 'Copy text to clipboard'
      button.setAttribute('title','Copy text to clipboard');
      button.innerHTML = '';
      pre.parentNode.insertBefore(button, pre);
      button.addEventListener('click', function(e){
        e.preventDefault();
        copy(pre.childNodes[0]);
      })
    })
    // End: Copy <pre> code

    const textareaSelector = 'textarea';
    const mentions = [
      // User mentions
      {
        match: /\B@([\w.-]*)$/,
        search(term, callback) {
          const currentBoard = Utils.getCurrentBoard();
          callback(
            _.union(
            currentBoard
              .activeMembers()
              .map(member => {
                const user = ReactiveCache.getUser(member.userId);
                const username = user.username;
                const fullName = user.profile && user.profile !== undefined && user.profile.fullname ? user.profile.fullname : "";
                return username.includes(term) || fullName.includes(term) ? user : null;
              })
              .filter(Boolean), [...specialHandles])
          );
        },
        template(user) {
          if (user.profile && user.profile.fullname) {
            return (user.profile.fullname + " (" + user.username + ")");
          }
          return user.username;
        },
        replace(user) {
          if (user.profile && user.profile.fullname) {
            return `@${user.username} (${user.profile.fullname}) `;
          }
          return `@${user.username} `;
        },
        index: 1,
      },
    ];

    const enableTextarea = function() {
      const $textarea = this.$(textareaSelector);
      autosize($textarea);
      $textarea.escapeableTextComplete(mentions);
    };
/*
    if (Meteor.settings.public.RICHER_CARD_COMMENT_EDITOR === true || Meteor.settings.public.RICHER_CARD_COMMENT_EDITOR === 'true') {
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
            ['insert', ['link']], //, 'picture']], // modal popup has issue somehow :(
            ['view', ['fullscreen', 'codeview', 'help']],
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
        `.js-new-description-form ${editor}`,
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
                $(originalInput).on('submitted', function() {
                  // when comment is submitted, the original textarea will be set to '', so shall we
                  if (!this.value) {
                    const sn = getSummernote(this);
                    sn && sn.summernote('code', '');
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
                    $('.minicards,#header-quick-access').toggle(!isActive); // mini card is still showing when editor is in fullscreen mode, we hide here manually
                  });
                }
              },
              onImageUpload(files) {
                const $summernote = getSummernote(this);
                if (files && files.length > 0) {
                  const image = files[0];
                  const currentCard = Utils.getCurrentCard();
                  const MAX_IMAGE_PIXEL = Utils.MAX_IMAGE_PIXEL;
                  const COMPRESS_RATIO = Utils.IMAGE_COMPRESS_RATIO;
                  const processUpload = function(file) {
                    const uploader = Attachments.insert(
                      {
                        file,
                        meta: Utils.getCommonAttachmentMetaFrom(card),
                        chunkSize: 'dynamic',
                      },
                      false,
                    );
                    uploader.on('uploaded', (error, fileRef) => {
                      if (!error) {
                        if (fileRef.isImage) {
                          const img = document.createElement('img');
                          img.src = fileRef.link();
                          img.setAttribute('width', '100%');
                          $summernote.summernote('insertNode', img);
                        }
                      }
                    });
                    uploader.start();
                  };
                  if (MAX_IMAGE_PIXEL) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                      const dataurl = e && e.target && e.target.result;
                      if (dataurl !== undefined) {
                        // need to shrink image
                        Utils.shrinkImage({
                          dataurl,
                          maxSize: MAX_IMAGE_PIXEL,
                          ratio: COMPRESS_RATIO,
                          toBlob: true,
                          callback(blob) {
                            if (blob !== false) {
                              blob.name = image.name;
                              processUpload(blob);
                            }
                          },
                        });
                      }
                    };
                    reader.readAsDataURL(image);
                  } else {
                    processUpload(image);
                  }
                }
              },
              onPaste(e) {
                var clipboardData = e.clipboardData;
                var pastedData = clipboardData.getData('Text');

                //if pasted data is an image, exit
                if (!pastedData.length) {
                  e.preventDefault();
                  return;
                }

                // clear up unwanted tag info when user pasted in text
                const thisNote = this;
                const updatePastedText = function(object) {
                  const someNote = getSummernote(object);
                  // Fix Pasting text into a card is adding a line before and after
                  // (and multiplies by pasting more) by changing paste "p" to "br".
                  // Fixes https://github.com/wekan/wekan/2890 .
                  // == Fix Start ==
                  someNote.execCommand('defaultParagraphSeparator', false, 'br');
                  // == Fix End ==
                  const original = someNote.summernote('code');
                  const cleaned = cleanPastedHTML(original); //this is where to call whatever clean function you want. I have mine in a different file, called CleanPastedHTML.
                  someNote.summernote('code', ''); //clear original
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
            spellCheck: true,
            disableGrammar: false,
            disableDragAndDrop: false,
            toolbar,
            popover: {
              image: [
                ['imagesize', ['imageSize100', 'imageSize50', 'imageSize25']],
                ['float', ['floatLeft', 'floatRight', 'floatNone']],
                ['remove', ['removeMedia']],
              ],
              link: [['link', ['linkDialogShow', 'unlink']]],
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
*/
    enableTextarea();
  },
  events() {
    return [
      {
        'click a.fa.fa-copy'(event) {
          const $editor = this.$('textarea.editor');
          const promise = Utils.copyTextToClipboard($editor[0].value);

          const $tooltip = this.$('.copied-tooltip');
          Utils.showCopied(promise, $tooltip);
        },
        'click a.fa.fa-brands.fa-markdown'(event) {
          const $editor = this.$('textarea.editor');
          $editor[0].value = converter.convert($editor[0].value);
        },
        // TODO: Try to make copyPre visible at Card Details after editing or closing editor or Card Details.
        //'click .js-close-inlined-form'(event) {
        //  Utils.copyPre();
        //},
      }
    ]
  }
}).register('editor');

import DOMPurify from 'dompurify';

// Additional  safeAttrValue function to allow for other specific protocols
// See https://github.com/leizongmin/js-xss/issues/52#issuecomment-241354114

/*
function mySafeAttrValue(tag, name, value, cssFilter) {
  // only when the tag is 'a' and attribute is 'href'
  // then use your custom function
  if (tag === 'a' && name === 'href') {
    // only filter the value if starts with 'cbthunderlink:' or 'aodroplink'
    if (
      /^thunderlink:/gi.test(value) ||
      /^cbthunderlink:/gi.test(value) ||
      /^aodroplink:/gi.test(value) ||
      /^onenote:/gi.test(value) ||
      /^file:/gi.test(value) ||
      /^abasurl:/gi.test(value) ||
      /^conisio:/gi.test(value) ||
      /^mailspring:/gi.test(value)
    ) {
      return value;
    } else {
      // use the default safeAttrValue function to process all non cbthunderlinks
      return sanitizeXss.safeAttrValue(tag, name, value, cssFilter);
    }
  } else {
    // use the default safeAttrValue function to process it
    return sanitizeXss.safeAttrValue(tag, name, value, cssFilter);
  }
}
*/

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
    const currentBoard = Utils.getCurrentBoard();
    if (!currentBoard)
      return HTML.Raw(
        DOMPurify.sanitize(content, { ALLOW_UNKNOWN_PROTOCOLS: true }),
      );
    const knowedUsers = _.union(currentBoard.members.map(member => {
      const u = ReactiveCache.getUser(member.userId);
      if (u) {
        member.username = u.username;
      }
      return member;
    }), [...specialHandles]);
    const mentionRegex = /\B@([\w.-]*)/gi;

    let currentMention;
    while ((currentMention = mentionRegex.exec(content)) !== null) {
      const [fullMention, quoteduser, simple] = currentMention;
      const username = quoteduser || simple;
      const knowedUser = _.findWhere(knowedUsers, { username });
      if (!knowedUser) {
        continue;
      }

      const linkValue = [' ', at, knowedUser.username];
      let linkClass = 'atMention js-open-member';
      if (knowedUser.userId === Meteor.userId()) {
        linkClass += ' me';
      }
      // This @user mention link generation did open same Wekan
      // window in new tab, so now A is changed to U so it's
      // underlined and there is no link popup. This way also
      // text can be selected more easily.
      //const link = HTML.A(
      const link = HTML.U(
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

    return HTML.Raw(
      DOMPurify.sanitize(content, { ALLOW_UNKNOWN_PROTOCOLS: true }),
    );
  }),
);

Template.viewer.events({
  // Viewer sometimes have click-able wrapper around them (for instance to edit
  // the corresponding text). Clicking a link shouldn't fire these actions, stop
  // we stop these event at the viewer component level.
  'click a'(event, templateInstance) {
    const prevent = true;
    const userId = event.currentTarget.dataset.userid;
    if (userId) {
      Popup.open('member').call({ userId }, event, templateInstance);
    } else {
      const href = event.currentTarget.href;
      if (href) {
        // Open links in current browser tab, changed from _blank to _self, and back to _blank:
        // https://github.com/wekan/wekan/discussions/3534
        //window.open(href, '_self');
        window.open(href, '_blank');
      }
    }
    if (prevent) {
      event.stopPropagation();

      // XXX We hijack the build-in browser action because we currently don't have
      // `_blank` attributes in viewer links, and the transformer function is
      // handled by a third party package that we can't configure easily. Fix that
      // by using directly `_blank` attribute in the rendered HTML.
      event.preventDefault();
    }
  },
});
