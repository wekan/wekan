import { Template } from 'meteor/templating';

const FullCalendarCore = require('@fullcalendar/core/main.cjs.js');
const FullCalendarDayGrid = require('@fullcalendar/daygrid/main.cjs.js');
const FullCalendarInteraction = require('@fullcalendar/interaction/main.cjs.js');
const FullCalendarList = require('@fullcalendar/list/main.cjs.js');
const FullCalendarTimeGrid = require('@fullcalendar/timegrid/main.cjs.js');
const FullCalendarLocalesAll = require('@fullcalendar/core/locales-all.js');

Template.fullcalendar.onRendered(function () {
  const instance = this;
  const container = this.find('div');

  this.autorunHandle = this.autorun(() => {
    const data = Template.currentData() || {};
    let preservedViewType = null;
    let preservedDate = null;

    if (!container) {
      return;
    }

    container.id = data.id || '';
    container.className = data.class || '';

    const options = { ...data };
    delete options.id;
    delete options.class;
    if (options.defaultView && !options.initialView) {
      options.initialView = options.defaultView;
    }
    delete options.defaultView;
    if (options.header && !options.headerToolbar) {
      options.headerToolbar = options.header;
    }
    delete options.header;

    if (!options.locales && FullCalendarLocalesAll && FullCalendarLocalesAll.default) {
      options.locales = FullCalendarLocalesAll.default;
    }

    if (instance.calendar) {
      // Keep the user's current view/date when reactive data updates.
      if (instance.calendar.view && instance.calendar.view.type) {
        preservedViewType = instance.calendar.view.type;
      }
      if (instance.calendar.getDate) {
        preservedDate = instance.calendar.getDate();
      }
      instance.calendar.destroy();
      instance.calendar = null;
    }

    if (preservedViewType && !options.initialView) {
      options.initialView = preservedViewType;
    }
    if (preservedDate && !options.initialDate) {
      options.initialDate = preservedDate;
    }

    instance.calendar = new FullCalendarCore.Calendar(container, {
      plugins: [
        FullCalendarDayGrid.default,
        FullCalendarInteraction.default,
        FullCalendarList.default,
        FullCalendarTimeGrid.default,
      ],
      ...options,
    });

    // Allow callers to manually access and refetch without jQuery plugin API.
    container._wekanCalendar = instance.calendar;
    instance.calendar.render();
  });
});

Template.fullcalendar.onDestroyed(function () {
  if (this.autorunHandle) {
    this.autorunHandle.stop();
    this.autorunHandle = null;
  }
  if (this.calendar) {
    this.calendar.destroy();
    this.calendar = null;
  }
});
