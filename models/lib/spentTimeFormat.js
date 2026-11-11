'use strict';

// A card's Spent time is stored in decimal hours - a Pomodoro or Flowtime
// session adds its duration to it - so a short session left a value such as
// 0.034722222222222224 on the badge (#6890). Shown, it is a duration:
// days, hours, minutes and seconds, the leading zero units left out
// ("12h34m56s", "1d2h", "0s"); a tooltip that names hours rounds them to
// two decimals. The stored value and the edit popup keep their hours.

function spentTimeParts(hours) {
  if (typeof hours !== 'number' || !Number.isFinite(hours) || hours < 0) return null;
  let seconds = Math.round(hours * 3600);
  const days = Math.floor(seconds / 86400); seconds -= days * 86400;
  const h = Math.floor(seconds / 3600); seconds -= h * 3600;
  const m = Math.floor(seconds / 60); seconds -= m * 60;
  return { days, hours: h, minutes: m, seconds };
}

function formatSpentTime(hours) {
  const parts = spentTimeParts(hours);
  if (!parts) return '';
  const out = [];
  if (parts.days) out.push(`${parts.days}d`);
  if (parts.hours) out.push(`${parts.hours}h`);
  if (parts.minutes) out.push(`${parts.minutes}m`);
  if (parts.seconds || !out.length) out.push(`${parts.seconds}s`);
  return out.join('');
}

function roundedSpentHours(hours) {
  if (typeof hours !== 'number' || !Number.isFinite(hours)) return '';
  return String(Math.round(hours * 100) / 100);
}

module.exports = { formatSpentTime, roundedSpentHours, spentTimeParts };
