/**
 * LocalStorage Validation and Cleanup Utility
 * 
 * Validates and cleans up per-user UI state stored in localStorage
 * for non-logged-in users (swimlane heights, list widths, collapse states)
 */

// Maximum age for localStorage data (90 days)
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

// Maximum number of boards to keep per storage key
const MAX_BOARDS_PER_KEY = 50;

// Maximum number of items per board
const MAX_ITEMS_PER_BOARD = 100;

/**
 * Validate that a value is a valid positive number
 */
function isValidNumber(value, min = 0, max = 10000) {
  if (typeof value !== 'number') return false;
  if (isNaN(value)) return false;
  if (!isFinite(value)) return false;
  if (value < min || value > max) return false;
  return true;
}

/**
 * Validate that a value is a valid boolean
 */
function isValidBoolean(value) {
  return typeof value === 'boolean';
}

/**
 * Validate and clean swimlane heights data
 * Structure: { boardId: { swimlaneId: height, ... }, ... }
 */
function validateSwimlaneHeights(data) {
  if (!data || typeof data !== 'object') return {};
  
  const cleaned = {};
  const boardIds = Object.keys(data).slice(0, MAX_BOARDS_PER_KEY);
  
  for (const boardId of boardIds) {
    if (typeof boardId !== 'string' || boardId.length === 0) continue;
    
    const boardData = data[boardId];
    if (!boardData || typeof boardData !== 'object') continue;
    
    const swimlaneIds = Object.keys(boardData).slice(0, MAX_ITEMS_PER_BOARD);
    const cleanedBoard = {};
    
    for (const swimlaneId of swimlaneIds) {
      if (typeof swimlaneId !== 'string' || swimlaneId.length === 0) continue;
      
      const height = boardData[swimlaneId];
      // Valid swimlane heights: -1 (auto) or 50-2000 pixels
      if (isValidNumber(height, -1, 2000)) {
        cleanedBoard[swimlaneId] = height;
      }
    }
    
    if (Object.keys(cleanedBoard).length > 0) {
      cleaned[boardId] = cleanedBoard;
    }
  }
  
  return cleaned;
}

/**
 * Validate and clean list widths data
 * Structure: { boardId: { listId: width, ... }, ... }
 */
function validateListWidths(data) {
  if (!data || typeof data !== 'object') return {};
  
  const cleaned = {};
  const boardIds = Object.keys(data).slice(0, MAX_BOARDS_PER_KEY);
  
  for (const boardId of boardIds) {
    if (typeof boardId !== 'string' || boardId.length === 0) continue;
    
    const boardData = data[boardId];
    if (!boardData || typeof boardData !== 'object') continue;
    
    const listIds = Object.keys(boardData).slice(0, MAX_ITEMS_PER_BOARD);
    const cleanedBoard = {};
    
    for (const listId of listIds) {
      if (typeof listId !== 'string' || listId.length === 0) continue;
      
      const width = boardData[listId];
      // Valid list widths: 100-1000 pixels
      if (isValidNumber(width, 100, 1000)) {
        cleanedBoard[listId] = width;
      }
    }
    
    if (Object.keys(cleanedBoard).length > 0) {
      cleaned[boardId] = cleanedBoard;
    }
  }
  
  return cleaned;
}

/**
 * Validate and clean collapsed states data
 * Structure: { boardId: { itemId: boolean, ... }, ... }
 */
function validateCollapsedStates(data) {
  if (!data || typeof data !== 'object') return {};
  
  const cleaned = {};
  const boardIds = Object.keys(data).slice(0, MAX_BOARDS_PER_KEY);
  
  for (const boardId of boardIds) {
    if (typeof boardId !== 'string' || boardId.length === 0) continue;
    
    const boardData = data[boardId];
    if (!boardData || typeof boardData !== 'object') continue;
    
    const itemIds = Object.keys(boardData).slice(0, MAX_ITEMS_PER_BOARD);
    const cleanedBoard = {};
    
    for (const itemId of itemIds) {
      if (typeof itemId !== 'string' || itemId.length === 0) continue;
      
      const collapsed = boardData[itemId];
      if (isValidBoolean(collapsed)) {
        cleanedBoard[itemId] = collapsed;
      }
    }
    
    if (Object.keys(cleanedBoard).length > 0) {
      cleaned[boardId] = cleanedBoard;
    }
  }
  
  return cleaned;
}

/**
 * Validate and clean a single localStorage key
 */
function validateAndCleanKey(key, validator) {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return;
    
    const data = JSON.parse(stored);
    const cleaned = validator(data);
    
    // Only write back if data changed
    const cleanedStr = JSON.stringify(cleaned);
    if (cleanedStr !== stored) {
      if (Object.keys(cleaned).length > 0) {
        localStorage.setItem(key, cleanedStr);
      } else {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn(`Error validating localStorage key ${key}:`, e);
    // Remove corrupted data
    try {
      localStorage.removeItem(key);
    } catch (removeError) {
      console.error(`Failed to remove corrupted localStorage key ${key}:`, removeError);
    }
  }
}

/**
 * Validate and clean all Wekan localStorage data
 * Called on app startup and periodically
 */
export function validateAndCleanLocalStorage() {
  if (typeof localStorage === 'undefined') return;
  
  try {
    // Validate swimlane heights
    validateAndCleanKey('wekan-swimlane-heights', validateSwimlaneHeights);
    
    // Validate list widths
    validateAndCleanKey('wekan-list-widths', validateListWidths);
    
    // Validate list constraints
    validateAndCleanKey('wekan-list-constraints', validateListWidths);
    
    // Validate collapsed lists
    validateAndCleanKey('wekan-collapsed-lists', validateCollapsedStates);
    
    // Validate collapsed swimlanes
    validateAndCleanKey('wekan-collapsed-swimlanes', validateCollapsedStates);
    
    // Record last cleanup time
    localStorage.setItem('wekan-last-cleanup', Date.now().toString());
    
  } catch (e) {
    console.error('Error during localStorage validation:', e);
  }
}

/**
 * Check if cleanup is needed (once per day)
 */
export function shouldRunCleanup() {
  if (typeof localStorage === 'undefined') return false;
  
  try {
    const lastCleanup = localStorage.getItem('wekan-last-cleanup');
    if (!lastCleanup) return true;
    
    const lastCleanupTime = parseInt(lastCleanup, 10);
    if (isNaN(lastCleanupTime)) return true;
    
    const timeSince = Date.now() - lastCleanupTime;
    // Run cleanup once per day
    return timeSince > 24 * 60 * 60 * 1000;
  } catch (e) {
    return true;
  }
}

/**
 * Get validated data from localStorage
 */
export function getValidatedLocalStorageData(key, validator) {
  if (typeof localStorage === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return {};
    
    const data = JSON.parse(stored);
    return validator(data);
  } catch (e) {
    console.warn(`Error reading localStorage key ${key}:`, e);
    return {};
  }
}

/**
 * Set validated data to localStorage
 */
export function setValidatedLocalStorageData(key, data, validator) {
  if (typeof localStorage === 'undefined') return false;
  
  try {
    const validated = validator(data);
    localStorage.setItem(key, JSON.stringify(validated));
    return true;
  } catch (e) {
    console.error(`Error writing localStorage key ${key}:`, e);
    return false;
  }
}

// Export validators for use by other modules
export const validators = {
  swimlaneHeights: validateSwimlaneHeights,
  listWidths: validateListWidths,
  collapsedStates: validateCollapsedStates,
  isValidNumber,
  isValidBoolean,
};

// Auto-cleanup on module load if needed
if (Meteor.isClient) {
  Meteor.startup(() => {
    if (shouldRunCleanup()) {
      validateAndCleanLocalStorage();
    }
  });
}
