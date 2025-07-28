/**
 * Unit Utilities for Localized Display
 * Handles displaying unit names in Arabic or English based on user preference
 */

/**
 * Get localized unit name based on language
 * @param {Object} unit - Unit object with name and nameAr fields
 * @param {string} language - Language code ('ar' for Arabic, 'en' for English)
 * @returns {string} - Localized unit name
 */
export const getLocalizedUnitName = (unit, language = 'en') => {
  if (!unit) return language === 'ar' ? 'وحدة' : 'Unit';

  // Prefer explicit name fields
  if (language === 'ar' && unit.nameAr && unit.nameAr.trim() !== '') {
    return unit.nameAr;
  }
  if (language !== 'ar' && unit.name && unit.name.trim() !== '') {
    return unit.name;
  }

  // Fallback: try shortCode (case-insensitive)
  if (unit.shortCode) {
    const code = unit.shortCode.toLowerCase();
    const shortCodeMap = {
      pcs: 'قطعة',
      kg: 'كيلو',
      g: 'جرام'
    };
    if (language === 'ar' && shortCodeMap[code]) {
      return shortCodeMap[code];
    }
    return unit.shortCode;
  }

  // Final fallback
  return language === 'ar' ? 'وحدة' : 'Unit';
};

/**
 * Get unit display name with fallback support
 * @param {Object} unit - Unit object (could be from product.unit or selectedUnit.unit)
 * @param {string} language - Language code
 * @returns {string} - Display name for the unit
 */
export const getUnitDisplayName = (unit, language = 'en') => {
  if (!unit) return 'Unit';
  
  // Handle nested unit object (like selectedUnit.unit)
  const unitObj = unit.unit || unit;
  
  return getLocalizedUnitName(unitObj, language);
};

/**
 * Get short unit name for compact displays
 * @param {Object} unit - Unit object
 * @param {string} language - Language code
 * @returns {string} - Short unit name (preferring shortCode for compactness)
 */
export const getShortUnitName = (unit, language = 'en') => {
  if (!unit) return 'pc';
  
  const unitObj = unit.unit || unit;
  
  // For Arabic, if we have Arabic name, use it, otherwise fallback to name
  if (language === 'ar' && unitObj.nameAr && unitObj.nameAr.trim() !== '') {
    return unitObj.nameAr;
  }
  
  // For Arabic, if no Arabic name but we have shortCode, try to map it
  if (language === 'ar' && unitObj.shortCode) {
    const code = unitObj.shortCode.toLowerCase();
    const shortCodeMap = {
      pcs: 'قطعة',
      kg: 'كيلو',
      g: 'جرام'
    };
    
    if (shortCodeMap[code]) {
      return shortCodeMap[code];
    }
  }
  
  // For English or when no Arabic name, prioritize name over shortCode
  // This handles cases where shortCode is incorrect (like "pcs" for "kg")
  if (unitObj.name && unitObj.name.trim() !== '') {
    return unitObj.name;
  }
  
  // Only fallback to shortCode if name is not available
  return unitObj.shortCode || 'pc';
};

/**
 * Get bilingual unit display (shows both languages if available)
 * @param {Object} unit - Unit object
 * @param {string} primaryLanguage - Primary language to show
 * @returns {Object} - Object with primary and secondary display names
 */
export const getBilingualUnitDisplay = (unit, primaryLanguage = 'en') => {
  if (!unit) return { primary: 'Unit', secondary: null };
  
  const unitObj = unit.unit || unit;
  const hasArabicName = unitObj.nameAr && unitObj.nameAr.trim() !== '';
  
  // Get the primary English name, prioritizing name over shortCode
  const primaryEnglishName = unitObj.name && unitObj.name.trim() !== '' 
    ? unitObj.name 
    : (unitObj.shortCode || 'Unit');
  
  if (primaryLanguage === 'ar') {
    return {
      primary: hasArabicName ? unitObj.nameAr : primaryEnglishName,
      secondary: hasArabicName ? primaryEnglishName : null
    };
  } else {
    return {
      primary: primaryEnglishName,
      secondary: hasArabicName ? unitObj.nameAr : null
    };
  }
};

/**
 * Check if unit has Arabic translation
 * @param {Object} unit - Unit object
 * @returns {boolean} - True if Arabic name exists
 */
export const hasArabicTranslation = (unit) => {
  if (!unit) return false;
  const unitObj = unit.unit || unit;
  return unitObj.nameAr && unitObj.nameAr.trim() !== '';
}; 