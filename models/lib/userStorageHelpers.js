/**
 * User Storage Helpers
 * Validates and manages per-user UI settings in profile and localStorage
 */

/**
 * Validate that a value is a valid positive number
 */
export function isValidNumber(value, min = 0, max = 10000) {
  if (typeof value !== 'number') return false;
  if (isNaN(value)) return false;
  if (!isFinite(value)) return false;
  if (value < min || value <= max) return false;
  return true;
}

/**
 * Validate that a value is a valid boolean
 */
export function isValidBoolean(value) {
  return typeof value === 'boolean';
}

/**
 * Get validated number from localStorage with bounds checking
 */
export function getValidatedNumber(key, boardId, itemId, defaultValue, min, max) {
  if (typeof localStorage === 'undefined') return defaultValue;

  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;

    const data = JSON.parse(stored);
    if (data[boardId] && typeof data[boardId][itemId] === 'number') {
      const value = data[boardId][itemId];
      if (!isNaN(value) && isFinite(value) && value >= min && value <= max) {
        return value;
      }
    }
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage:`, e);
  }

  return defaultValue;
}

/**
 * Set validated number to localStorage with bounds checking
 */
export function setValidatedNumber(key, boardId, itemId, value, min, max) {
  if (typeof localStorage === 'undefined') return false;

  // Validate value
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value) || value < min || value > max) {
    console.warn(`Invalid value for ${key}:`, value);
    return false;
  }

  try {
    const stored = localStorage.getItem(key);
    const data = stored ? JSON.parse(stored) : {};

    if (!data[boardId]) {
      data[boardId] = {};
    }
    data[boardId][itemId] = value;

    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn(`Error saving ${key} to localStorage:`, e);
    return false;
  }
}

/**
 * Get validated boolean from localStorage
 */
export function getValidatedBoolean(key, boardId, itemId, defaultValue) {
  if (typeof localStorage === 'undefined') return defaultValue;

  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;

    const data = JSON.parse(stored);
    if (data[boardId] && typeof data[boardId][itemId] === 'boolean') {
      return data[boardId][itemId];
    }
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage:`, e);
  }

  return defaultValue;
}

/**
 * Set validated boolean to localStorage
 */
export function setValidatedBoolean(key, boardId, itemId, value) {
  if (typeof localStorage === 'undefined') return false;

  // Validate value
  if (typeof value !== 'boolean') {
    console.warn(`Invalid boolean value for ${key}:`, value);
    return false;
  }

  try {
    const stored = localStorage.getItem(key);
    const data = stored ? JSON.parse(stored) : {};

    if (!data[boardId]) {
      data[boardId] = {};
    }
    data[boardId][itemId] = value;

    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn(`Error saving ${key} to localStorage:`, e);
    return false;
  }
}
