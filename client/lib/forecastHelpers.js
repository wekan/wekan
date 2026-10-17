import { Template } from 'meteor/templating';
import { formatDateForDisplay } from '/client/lib/dateDisplay';
import { forecastOf } from '/client/lib/boardCycleTimes';

// {{#with cardForecastOf this}} and {{forecastDate p85}} for the opened card's
// dates and the minicard (docs/Features/Cards/Dates/Forecast.md).
Template.registerHelper('cardForecastOf', card => forecastOf(card));
Template.registerHelper('forecastDate', date => formatDateForDisplay(date, false, value => value.toLocaleDateString()));
