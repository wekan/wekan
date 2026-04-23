import { ReactiveCache } from '/imports/reactiveCache';
import { InfiniteScrolling } from '/client/lib/infiniteScrolling';

const translationsPerPage = 25;

Template.translation.onCreated(function () {
  this.error = new ReactiveVar('');
  this.loading = new ReactiveVar(false);
  this.translationSetting = new ReactiveVar(true);
  this.findTranslationsOptions = new ReactiveVar({});
  this.numberTranslations = new ReactiveVar(0);

  this.page = new ReactiveVar(1);
  this.loadNextPageLocked = false;
  this.infiniteScrolling = new InfiniteScrolling();

  this.loadNextPage = () => {
    if (this.loadNextPageLocked === false) {
      this.page.set(this.page.get() + 1);
      this.loadNextPageLocked = true;
    }
  };

  this.calculateNextPeak = () => {
    const element = this.find('.main-body');
    if (element) {
      this.infiniteScrolling.setNextPeak(element.scrollHeight);
    }
  };

  this.autorun(() => {
    const limitTranslations = this.page.get() * translationsPerPage;

    this.subscribe('translation', this.findTranslationsOptions.get(), 0, () => {
      this.loadNextPageLocked = false;
      const nextPeakBefore = this.infiniteScrolling.getNextPeak();
      this.calculateNextPeak();
      const nextPeakAfter = this.infiniteScrolling.getNextPeak();
      if (nextPeakBefore === nextPeakAfter) {
        this.infiniteScrolling.resetNextPeak();
      }
    });
  });
});

Template.translation.helpers({
  loading() {
    return Template.instance().loading;
  },
  translationSetting() {
    return Template.instance().translationSetting;
  },
  translationList() {
    const tpl = Template.instance();
    const translations = ReactiveCache.getTranslations(tpl.findTranslationsOptions.get(), {
      sort: { modifiedAt: 1 },
      fields: { _id: true },
    });
    tpl.numberTranslations.set(translations.length);
    return translations;
  },
  translationNumber() {
    return Template.instance().numberTranslations.get();
  },
  setError(error) {
    Template.instance().error.set(error);
  },
  setLoading(w) {
    Template.instance().loading.set(w);
  },
});

Template.translation.events({
  'click #searchTranslationButton'(event, tpl) {
    _filterTranslation(tpl);
  },
  'keydown #searchTranslationInput'(event, tpl) {
    if (event.keyCode === 13 && !event.shiftKey) {
      _filterTranslation(tpl);
    }
  },
  'click #newTranslationButton'() {
    Popup.open('newTranslation');
  },
  'click a.js-translation-menu'(event, tpl) {
    const target = $(event.target);
    if (!target.hasClass('active')) {
      $('.side-menu li.active').removeClass('active');
      target.parent().addClass('active');
      const targetID = target.data('id');
      tpl.translationSetting.set('translation-setting' === targetID);
    }
  },
  'scroll .main-body'(event, tpl) {
    tpl.infiniteScrolling.checkScrollPosition(event.currentTarget, () => {
      tpl.loadNextPage();
    });
  },
});

function _filterTranslation(tpl) {
  const value = $('#searchTranslationInput').first().val();
  if (value === '') {
    tpl.findTranslationsOptions.set({});
  } else {
    const regex = new RegExp(value, 'i');
    tpl.findTranslationsOptions.set({
      $or: [
        { language: regex },
        { text: regex },
        { translationText: regex },
      ],
    });
  }
}

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

Template.translationRow.helpers({
  translation() {
    return ReactiveCache.getTranslation(this.translationId);
  },
});

Template.translationRow.events({
  'click a.edit-translation': Popup.open('editTranslation'),
  'click a.more-settings-translation': Popup.open('settingsTranslation'),
});

Template.newTranslationRow.events({
  'click a.new-translation': Popup.open('newTranslation'),
});

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
    Meteor.call('deleteTranslation', this.translationId);
    Popup.back();
  }
});
