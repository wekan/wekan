[FullCalendar](https://fullcalendar.io/) packaged for Wekan as a Blaze wrapper.

### Installation

This package is bundled in Wekan (`wekan-fullcalendar`).

### Usage

```handlebars
{{> fullcalendar calendarOptions}}
```

Options can be passed directly from a helper:

```js
Template.example.helpers({
  calendarOptions() {
    return {
      id: 'myCalendar',
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'title today prev,next',
        center: 'timeGridDay,timeGridWeek,dayGridMonth,listMonth',
        right: '',
      },
      events(fetchInfo, successCallback) {
        successCallback([]);
      },
    };
  },
});
```

### Compatibility notes

- Uses FullCalendar v5 modules (`@fullcalendar/*`) and no longer uses jQuery plugin APIs.
- Legacy options are mapped for compatibility:
  - `defaultView` -> `initialView`
  - `header` -> `headerToolbar`

### Refetching events

If you provide an `id`, the wrapper stores the calendar instance on the container
element as `_wekanCalendar`:

```js
const el = document.getElementById('myCalendar');
if (el && el._wekanCalendar) {
  el._wekanCalendar.refetchEvents();
}
```
