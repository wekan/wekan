/**
 * Date utility functions to replace moment.js with native JavaScript Date
 */

/**
 * Format a date to YYYY-MM-DD HH:mm format
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateTime(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Format a date to YYYY-MM-DD format
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format a date according to user's preferred format
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string (YYYY-MM-DD, DD-MM-YYYY, MM-DD-YYYY)
 * @param {boolean} includeTime - Whether to include time (HH:MM)
 * @returns {string} Formatted date string
 */
export function formatDateByUserPreference(date, format = 'YYYY-MM-DD', includeTime = true) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  let dateString;
  switch (format) {
    case 'DD-MM-YYYY':
      dateString = `${day}-${month}-${year}`;
      break;
    case 'MM-DD-YYYY':
      dateString = `${month}-${day}-${year}`;
      break;
    case 'YYYY-MM-DD':
    default:
      dateString = `${year}-${month}-${day}`;
      break;
  }
  
  if (includeTime) {
    return `${dateString} ${hours}:${minutes}`;
  }
  
  return dateString;
}

/**
 * Format a time to HH:mm format
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time string
 */
export function formatTime(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Get ISO week number (ISO 8601)
 * @param {Date|string} date - Date to get week number for
 * @returns {number} ISO week number
 */
export function getISOWeek(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 0;
  
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  const target = new Date(d);
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  
  // ISO week date weeks start on monday, so correct the day number
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  
  return 1 + Math.ceil((firstThursday - target) / 604800000); // 604800000 = 7 * 24 * 3600 * 1000
}

/**
 * Check if a date is valid
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is valid
 */
export function isValidDate(date) {
  const d = new Date(date);
  return !isNaN(d.getTime());
}

/**
 * Check if a date is before another date
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @param {string} unit - Unit of comparison ('minute', 'hour', 'day', etc.)
 * @returns {boolean} True if date1 is before date2
 */
export function isBefore(date1, date2, unit = 'millisecond') {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  
  switch (unit) {
    case 'year':
      return d1.getFullYear() < d2.getFullYear();
    case 'month':
      return d1.getFullYear() < d2.getFullYear() || 
             (d1.getFullYear() === d2.getFullYear() && d1.getMonth() < d2.getMonth());
    case 'day':
      return d1.getFullYear() < d2.getFullYear() || 
             (d1.getFullYear() === d2.getFullYear() && d1.getMonth() < d2.getMonth()) ||
             (d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() < d2.getDate());
    case 'hour':
      return d1.getTime() < d2.getTime() && Math.floor(d1.getTime() / (1000 * 60 * 60)) < Math.floor(d2.getTime() / (1000 * 60 * 60));
    case 'minute':
      return d1.getTime() < d2.getTime() && Math.floor(d1.getTime() / (1000 * 60)) < Math.floor(d2.getTime() / (1000 * 60));
    default:
      return d1.getTime() < d2.getTime();
  }
}

/**
 * Check if a date is after another date
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @param {string} unit - Unit of comparison ('minute', 'hour', 'day', etc.)
 * @returns {boolean} True if date1 is after date2
 */
export function isAfter(date1, date2, unit = 'millisecond') {
  return isBefore(date2, date1, unit);
}

/**
 * Check if a date is the same as another date
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @param {string} unit - Unit of comparison ('minute', 'hour', 'day', etc.)
 * @returns {boolean} True if dates are the same
 */
export function isSame(date1, date2, unit = 'millisecond') {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  
  switch (unit) {
    case 'year':
      return d1.getFullYear() === d2.getFullYear();
    case 'month':
      return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
    case 'day':
      return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    case 'hour':
      return Math.floor(d1.getTime() / (1000 * 60 * 60)) === Math.floor(d2.getTime() / (1000 * 60 * 60));
    case 'minute':
      return Math.floor(d1.getTime() / (1000 * 60)) === Math.floor(d2.getTime() / (1000 * 60));
    default:
      return d1.getTime() === d2.getTime();
  }
}

/**
 * Add time to a date
 * @param {Date|string} date - Base date
 * @param {number} amount - Amount to add
 * @param {string} unit - Unit ('years', 'months', 'days', 'hours', 'minutes', 'seconds')
 * @returns {Date} New date
 */
export function add(date, amount, unit) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date();
  
  switch (unit) {
    case 'years':
      d.setFullYear(d.getFullYear() + amount);
      break;
    case 'months':
      d.setMonth(d.getMonth() + amount);
      break;
    case 'days':
      d.setDate(d.getDate() + amount);
      break;
    case 'hours':
      d.setHours(d.getHours() + amount);
      break;
    case 'minutes':
      d.setMinutes(d.getMinutes() + amount);
      break;
    case 'seconds':
      d.setSeconds(d.getSeconds() + amount);
      break;
    default:
      d.setTime(d.getTime() + amount);
  }
  
  return d;
}

/**
 * Subtract time from a date
 * @param {Date|string} date - Base date
 * @param {number} amount - Amount to subtract
 * @param {string} unit - Unit ('years', 'months', 'days', 'hours', 'minutes', 'seconds')
 * @returns {Date} New date
 */
export function subtract(date, amount, unit) {
  return add(date, -amount, unit);
}

/**
 * Get start of a time unit
 * @param {Date|string} date - Base date
 * @param {string} unit - Unit ('year', 'month', 'day', 'hour', 'minute', 'second')
 * @returns {Date} Start of unit
 */
export function startOf(date, unit) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date();
  
  switch (unit) {
    case 'year':
      d.setMonth(0, 1);
      d.setHours(0, 0, 0, 0);
      break;
    case 'month':
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      break;
    case 'day':
      d.setHours(0, 0, 0, 0);
      break;
    case 'hour':
      d.setMinutes(0, 0, 0);
      break;
    case 'minute':
      d.setSeconds(0, 0);
      break;
    case 'second':
      d.setMilliseconds(0);
      break;
  }
  
  return d;
}

/**
 * Get end of a time unit
 * @param {Date|string} date - Base date
 * @param {string} unit - Unit ('year', 'month', 'day', 'hour', 'minute', 'second')
 * @returns {Date} End of unit
 */
export function endOf(date, unit) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date();
  
  switch (unit) {
    case 'year':
      d.setMonth(11, 31);
      d.setHours(23, 59, 59, 999);
      break;
    case 'month':
      d.setMonth(d.getMonth() + 1, 0);
      d.setHours(23, 59, 59, 999);
      break;
    case 'day':
      d.setHours(23, 59, 59, 999);
      break;
    case 'hour':
      d.setMinutes(59, 59, 999);
      break;
    case 'minute':
      d.setSeconds(59, 999);
      break;
    case 'second':
      d.setMilliseconds(999);
      break;
  }
  
  return d;
}

/**
 * Format date for display with locale
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string (simplified)
 * @returns {string} Formatted date string
 */
export function format(date, format = 'L') {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  switch (format) {
    case 'L':
      return `${month}/${day}/${year}`;
    case 'LL':
      return d.toLocaleDateString();
    case 'LLL':
      return d.toLocaleString();
    case 'llll':
      return d.toLocaleString();
    case 'LLLL':
      return d.toLocaleString();
    case 'l LT':
      return `${month}/${day}/${year} ${hours}:${minutes}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'YYYY-MM-DD HH:mm':
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    case 'HH:mm':
      return `${hours}:${minutes}`;
    default:
      return d.toLocaleString();
  }
}

/**
 * Parse a date string with multiple formats
 * @param {string} dateString - Date string to parse
 * @param {string[]} formats - Array of format strings to try
 * @param {boolean} strict - Whether to use strict parsing
 * @returns {Date|null} Parsed date or null if invalid
 */
export function parseDate(dateString, formats = [], strict = true) {
  if (!dateString) return null;
  
  // Try native Date parsing first
  const nativeDate = new Date(dateString);
  if (!isNaN(nativeDate.getTime())) {
    return nativeDate;
  }
  
  // Try common formats
  const commonFormats = [
    'YYYY-MM-DD HH:mm',
    'YYYY-MM-DD',
    'MM/DD/YYYY HH:mm',
    'MM/DD/YYYY',
    'DD.MM.YYYY HH:mm',
    'DD.MM.YYYY',
    'DD/MM/YYYY HH:mm',
    'DD/MM/YYYY',
    'DD-MM-YYYY HH:mm',
    'DD-MM-YYYY'
  ];
  
  const allFormats = [...formats, ...commonFormats];
  
  for (const format of allFormats) {
    const parsed = parseWithFormat(dateString, format);
    if (parsed && isValidDate(parsed)) {
      return parsed;
    }
  }
  
  return null;
}

/**
 * Parse date with specific format
 * @param {string} dateString - Date string to parse
 * @param {string} format - Format string
 * @returns {Date|null} Parsed date or null
 */
function parseWithFormat(dateString, format) {
  // Simple format parsing - can be extended as needed
  const formatMap = {
    'YYYY': '\\d{4}',
    'MM': '\\d{2}',
    'DD': '\\d{2}',
    'HH': '\\d{2}',
    'mm': '\\d{2}',
    'ss': '\\d{2}'
  };
  
  let regex = format;
  for (const [key, value] of Object.entries(formatMap)) {
    regex = regex.replace(new RegExp(key, 'g'), `(${value})`);
  }
  
  const match = dateString.match(new RegExp(regex));
  if (!match) return null;
  
  const groups = match.slice(1);
  let year, month, day, hour = 0, minute = 0, second = 0;
  
  let groupIndex = 0;
  for (let i = 0; i < format.length; i++) {
    if (format[i] === 'Y' && format[i + 1] === 'Y' && format[i + 2] === 'Y' && format[i + 3] === 'Y') {
      year = parseInt(groups[groupIndex++]);
      i += 3;
    } else if (format[i] === 'M' && format[i + 1] === 'M') {
      month = parseInt(groups[groupIndex++]) - 1;
      i += 1;
    } else if (format[i] === 'D' && format[i + 1] === 'D') {
      day = parseInt(groups[groupIndex++]);
      i += 1;
    } else if (format[i] === 'H' && format[i + 1] === 'H') {
      hour = parseInt(groups[groupIndex++]);
      i += 1;
    } else if (format[i] === 'm' && format[i + 1] === 'm') {
      minute = parseInt(groups[groupIndex++]);
      i += 1;
    } else if (format[i] === 's' && format[i + 1] === 's') {
      second = parseInt(groups[groupIndex++]);
      i += 1;
    }
  }
  
  if (year === undefined || month === undefined || day === undefined) {
    return null;
  }
  
  return new Date(year, month, day, hour, minute, second);
}

/**
 * Get current date and time
 * @returns {Date} Current date
 */
export function now() {
  return new Date();
}

/**
 * Create a date from components
 * @param {number} year - Year
 * @param {number} month - Month (0-based)
 * @param {number} day - Day
 * @param {number} hour - Hour (optional)
 * @param {number} minute - Minute (optional)
 * @param {number} second - Second (optional)
 * @returns {Date} Created date
 */
export function createDate(year, month, day, hour = 0, minute = 0, second = 0) {
  return new Date(year, month, day, hour, minute, second);
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Date|string} date - Date to compare
 * @param {Date|string} now - Current date (optional)
 * @returns {string} Relative time string
 */
export function fromNow(date, now = new Date()) {
  const d = new Date(date);
  const n = new Date(now);
  
  if (isNaN(d.getTime()) || isNaN(n.getTime())) return '';
  
  const diffMs = n.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffSeconds < 60) return 'a few seconds ago';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
}

/**
 * Get calendar format (e.g., "Today", "Yesterday", "Tomorrow")
 * @param {Date|string} date - Date to format
 * @param {Date|string} now - Current date (optional)
 * @returns {string} Calendar format string
 */
export function calendar(date, now = new Date()) {
  const d = new Date(date);
  const n = new Date(now);
  
  if (isNaN(d.getTime()) || isNaN(n.getTime())) return format(d);
  
  const diffMs = d.getTime() - n.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays > -7) return `${Math.abs(diffDays)} days ago`;
  
  return format(d, 'L');
}

/**
 * Calculate the difference between two dates in the specified unit
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date  
 * @param {string} unit - Unit of measurement ('millisecond', 'second', 'minute', 'hour', 'day', 'week', 'month', 'year')
 * @returns {number} Difference in the specified unit
 */
export function diff(date1, date2, unit = 'millisecond') {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  
  const diffMs = d1.getTime() - d2.getTime();
  
  switch (unit) {
    case 'millisecond':
      return diffMs;
    case 'second':
      return Math.floor(diffMs / 1000);
    case 'minute':
      return Math.floor(diffMs / (1000 * 60));
    case 'hour':
      return Math.floor(diffMs / (1000 * 60 * 60));
    case 'day':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    case 'week':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
    case 'month':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
    case 'year':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
    default:
      return diffMs;
  }
}
