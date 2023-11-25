import { ReactiveCache } from '/imports/reactiveCache';

const translationsPerPage = 25;

BlazeComponent.extendComponent({
  mixins() {
    return [Mixins.InfiniteScrolling];
  },
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.translationSetting = new ReactiveVar(true);
    this.findTranslationsOptions = new ReactiveVar({});
    this.numberTranslations = new ReactiveVar(0);

    this.page = new ReactiveVar(1);
    this.loadNextPageLocked = false;
    this.callFirstWith(null, 'resetNextPeak');
    this.autorun(() => {
      const limitTranslations = this.page.get() * translationsPerPage;

      this.subscribe('translation', this.findTranslationsOptions.get(), 0, () => {
        this.loadNextPageLocked = false;
        const nextPeakBefore = this.callFirstWith(null, 'getNextPeak');
        this.calculateNextPeak();
        const nextPeakAfter = this.callFirstWith(null, 'getNextPeak');
        if (nextPeakBefore === nextPeakAfter) {
          this.callFirstWith(null, 'resetNextPeak');
        }
      });
    });
  },
  events() {
    return [
      {
        'click #searchTranslationButton'() {
          this.filterTranslation();
        },
        'keydown #searchTranslationInput'(event) {
          if (event.keyCode === 13 && !event.shiftKey) {
            this.filterTranslation();
          }
        },
        'click #newTranslationButton'() {
          Popup.open('newTranslation');
        },
        'click a.js-translation-menu': this.switchMenu,
      },
    ];
  },
  filterTranslation() {
    const value = $('#searchTranslationInput').first().val();
    if (value === '') {
      this.findTranslationsOptions.set({});
    } else {
      const regex = new RegExp(value, 'i');
      this.findTranslationsOptions.set({
        $or: [
          { language: regex },
          { text: regex },
          { translationText: regex },
        ],
      });
    }
  },
  loadNextPage() {
    if (this.loadNextPageLocked === false) {
      this.page.set(this.page.get() + 1);
      this.loadNextPageLocked = true;
    }
  },
  calculateNextPeak() {
    const element = this.find('.main-body');
    if (element) {
      const altitude = element.scrollHeight;
      this.callFirstWith(this, 'setNextPeak', altitude);
    }
  },
  reachNextPeak() {
    this.loadNextPage();
  },
  setError(error) {
    this.error.set(error);
  },
  setLoading(w) {
    this.loading.set(w);
  },
  translationList() {
    const translations = ReactiveCache.getTranslations(this.findTranslationsOptions.get(), {
      sort: { modifiedAt: 1 },
      fields: { _id: true },
    });
    this.numberTranslations.set(translations.length);
    return translations;
  },
  translationNumber() {
    return this.numberTranslations.get();
  },
  switchMenu(event) {
    const target = $(event.target);
    if (!target.hasClass('active')) {
      $('.side-menu li.active').removeClass('active');
      target.parent().addClass('active');
      const targetID = target.data('id');
      this.translationSetting.set('translation-setting' === targetID);
    }
  },
}).register('translation');

Template.translationRow.helpers({
  translationData() {
    return ReactiveCache.getTranslation(this.translationId);
  },
});

Template.editTranslationPopup.helpers({
  translation() {
    return ReactiveCache.getTranslation(this.translationId);
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

Template.newTranslationPopup.onCreated(function () {
  this.errorMessage = new ReactiveVar('');
});

Template.newTranslationPopup.helpers({
  translation() {
    return ReactiveCache.getTranslation(this.translationId);
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

BlazeComponent.extendComponent({
  onCreated() {},
  translation() {
    return ReactiveCache.getTranslation(this.translationId);
  },
  events() {
    return [
      {
        'click a.edit-translation': Popup.open('editTranslation'),
        'click a.more-settings-translation': Popup.open('settingsTranslation'),
      },
    ];
  },
}).register('translationRow');

BlazeComponent.extendComponent({
  events() {
    return [
      {
        'click a.new-translation': Popup.open('newTranslation'),
      },
    ];
  },
}).register('newTranslationRow');

Template.editTranslationPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const translation = ReactiveCache.getTranslation(this.translationId);
    const translationText = templateInstance.find('.js-translation-translation-text').value.trim();

    Meteor.call(
      'setTranslationText',
      translation,
      translationText
    );

    Popup.back();
  },
});

Template.newTranslationPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const language = templateInstance.find('.js-translation-language').value.trim();
    const text = templateInstance.find('.js-translation-text').value.trim();
    const translationText = templateInstance.find('.js-translation-translation-text').value.trim();

    Meteor.call(
      'setCreateTranslation',
      language,
      text,
      translationText,
      function(error) {
        const textMessageElement = templateInstance.$('.text-taken');
        if (error) {
          const errorElement = error.error;
          if (errorElement === 'text-already-taken') {
            textMessageElement.show();
          }
        } else {
          textMessageElement.hide();
          Popup.back();
        }
      },
    );
    Popup.back();
  },
});

Template.settingsTranslationPopup.events({
  'click #deleteButton'(event) {
    event.preventDefault();
    Translation.remove(this.translationId);
    Popup.back();
  }
});
