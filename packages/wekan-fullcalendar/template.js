import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';

const FullCalendarCore = require('@fullcalendar/core/main.cjs.js');
const FullCalendarDayGrid = require('@fullcalendar/daygrid/main.cjs.js');
const FullCalendarInteraction = require('@fullcalendar/interaction/main.cjs.js');
const FullCalendarList = require('@fullcalendar/list/main.cjs.js');
const FullCalendarTimeGrid = require('@fullcalendar/timegrid/main.cjs.js');
const FullCalendarLocalesAll = require('@fullcalendar/core/locales-all.js');

Template.fullcalendar.onRendered(function () {
  const container = this.find('div');

  this.autorunHandle = Tracker.autorun(() => {
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

    if (this.calendar) {
      // Keep the user's current view/date when reactive data updates.
      if (this.calendar.view && this.calendar.view.type) {
        preservedViewType = this.calendar.view.type;
      }
      if (this.calendar.getDate) {
        preservedDate = this.calendar.getDate();
      }
      this.calendar.destroy();
      this.calendar = null;
    }

    if (preservedViewType && !options.initialView) {
      options.initialView = preservedViewType;
    }
    if (preservedDate && !options.initialDate) {
      options.initialDate = preservedDate;
    }

    this.calendar = new FullCalendarCore.Calendar(container, {
      plugins: [
        FullCalendarDayGrid.default,
        FullCalendarInteraction.default,
        FullCalendarList.default,
        FullCalendarTimeGrid.default,
      ],
      ...options,
    });

    // Allow callers to manually access and refetch without jQuery plugin API.
    container._wekanCalendar = this.calendar;
    this.calendar.render();
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
