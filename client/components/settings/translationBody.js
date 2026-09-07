import { ReactiveCache } from '/imports/reactiveCache';
import { buildHeader, pageInfo, TABLE_PAGE_ROWS_PER_PAGE } from '/models/lib/tablePage';

// Admin Panel / Settings / Translation, through the shared table page
// (docs/Features/Page/Table.md). The pane differs from every other table page only
// in this column list: its rows are interactive - an Edit link and the ⋯ menu -
// so it supplies a rowTemplate, and the "New" link is the header of the FIRST
// column, supplied as a headerTemplate. First, because that is where every other
// table page in the Admin Panel puts it (Organizations, Teams, People), and where
// the row's own actions are - a New link at the far right read as belonging to the
// last column instead of to the table. The layout, the search box, the themed pager
// and the total all come from the shared page.
const TRANSLATION_COLUMNS = [
  { headerTemplate: 'newTranslationRow' },
  { labelKey: 'language' },
  { labelKey: 'text' },
  { labelKey: 'translation-text' },
];

Template.translationSettings.onCreated(function () {
  this.error = new ReactiveVar('');
  this.findTranslationsOptions = new ReactiveVar({});
  this.numberTranslations = new ReactiveVar(0);
  // The search box belongs to the shared controls row, so the term is state here
  // rather than a DOM id read back out of another template.
  this.searchTerm = new ReactiveVar('');
  this.page = new ReactiveVar(1);

  // The total counts the whole result set, not the page. It is refreshed when the
  // pane opens and when the search changes - never on a prev/next click: moving to
  // another page cannot change the total, and recounting there would only add a
  // second round trip to every click.
  this.refreshCount = () => {
    Meteor.call('getTranslationsCollectionCount', this.findTranslationsOptions.get(),
      (error, count) => {
        if (error) {
          console.error('Failed to load translations count:', error);
          return;
        }
        const total = count || 0;
        const { totalPages } = pageInfo(total, this.page.get());
        // Strings deleted while you were on the last page must land on a real page.
        if (this.page.get() > totalPages) {
          this.page.set(totalPages);
        }
        this.numberTranslations.set(total);
      });
  };

  this.filterTranslations = () => {
    const value = this.searchTerm.get();
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
    this.page.set(1);
    this.refreshCount();
  };

  this.autorun(() => {
    // ONE page of rows, never the whole collection - and the SAME pageInfo() call
    // feeds the subscription and the "page X / N" counter, so what is fetched and
    // what is shown cannot drift apart. This page used to grow a window by
    // infinite scroll instead (and before that subscribed with limit 0, which in
    // Mongo means no limit at all: every custom string of every language at once).
    const { limit, skip } = pageInfo(this.numberTranslations.get(), this.page.get(),
      TABLE_PAGE_ROWS_PER_PAGE);
    this.subscribe('translation', this.findTranslationsOptions.get(), limit, skip);
  });

  this.refreshCount();
});

Template.translationSettings.helpers({
  tablePageData() {
    const tpl = Template.instance();
    // The publication already returns exactly this page (server-side limit/skip,
    // sorted modifiedAt:-1). Re-apply that same sort so the displayed order matches
    // the published one - and do NOT re-slice what the server already paginated.
    const translations = ReactiveCache.getTranslations(tpl.findTranslationsOptions.get(), {
      sort: { modifiedAt: -1 },
    });
    const info = pageInfo(tpl.numberTranslations.get(), tpl.page.get(),
      TABLE_PAGE_ROWS_PER_PAGE);
    return {
      // No titleKey: the pane heading is rendered once for every Admin Panel pane
      // from the open menu entry (docs/Features/Page/Left-Menu.md), so a title here
      // would print the same words a second time.
      emptyKey: 'no-items-message',
      searchTerm: tpl.searchTerm.get(),
      header: buildHeader(TRANSLATION_COLUMNS),
      // Interactive rows: translationRow owns its <tr> and takes { translationId }
      // as its context - the same context its Edit and ⋯ popups read.
      rowTemplate: 'translationRow',
      docs: translations.map(translation => ({ translationId: translation._id })),
      rowCount: translations.length,
      page: info.page,
      totalPages: info.totalPages,
      hasPrev: info.hasPrev,
      hasNext: info.hasNext,
      total: info.total,
      totalLabelKey: 'translation-number',
    };
  },
});

// The controls come from the shared row, so the handlers are the shared class
// names too - no page-specific search button, no page-specific pager ids.
Template.translationSettings.events({
  'keydown .js-table-page-search'(event, tpl) {
    if (event.keyCode !== 13 || event.shiftKey) return;
    event.preventDefault();
    tpl.searchTerm.set($(event.currentTarget).val() || '');
    tpl.filterTranslations();
  },
  'click .js-table-page-prev'(event, tpl) {
    event.preventDefault();
    if (tpl.page.get() > 1) {
      tpl.page.set(tpl.page.get() - 1);
    }
  },
  'click .js-table-page-next'(event, tpl) {
    event.preventDefault();
    const { totalPages } = pageInfo(tpl.numberTranslations.get(), tpl.page.get(),
      TABLE_PAGE_ROWS_PER_PAGE);
    if (tpl.page.get() < totalPages) {
      tpl.page.set(tpl.page.get() + 1);
    }
  },
});

Template.translationRow.helpers({
  translationData() {
    return ReactiveCache.getTranslation(this.translationId);
  },
  translation() {
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
