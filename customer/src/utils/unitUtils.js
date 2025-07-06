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
  if (!unit) return 'Unit';
  
  // If Arabic is requested and Arabic name exists, use it
  if (language === 'ar' && unit.nameAr && unit.nameAr.trim() !== '') {
    return unit.nameAr;
  }

  // Fallback map for common shortCodes to Arabic names
  if (language === 'ar') {
    const shortCodeMap = {
      pcs: 'قطعة',
      CTN: 'كرتون',
      ctn: 'كرتون',
      kg: 'كيلو',
      g: 'جرام'
    };
    if (unit.shortCode && shortCodeMap[unit.shortCode]) {
      return shortCodeMap[unit.shortCode] + (unit.unitValue && unit.unitValue > 1 ? ` ${unit.unitValue}` : '');
    }
  }
  
  // Fallback to English name or shortCode
  return unit.name || unit.shortCode || 'Unit';
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
  
  // For Arabic, if we have Arabic name, use it, otherwise fallback to shortCode
  if (language === 'ar' && unitObj.nameAr && unitObj.nameAr.trim() !== '') {
    return unitObj.nameAr;
  }
  
  // For English or when no Arabic name, prefer shortCode for compactness
  return unitObj.shortCode || unitObj.name || 'pc';
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
  
  if (primaryLanguage === 'ar') {
    return {
      primary: hasArabicName ? unitObj.nameAr : (unitObj.name || unitObj.shortCode || 'Unit'),
      secondary: hasArabicName ? (unitObj.name || unitObj.shortCode) : null
    };
  } else {
    return {
      primary: unitObj.name || unitObj.shortCode || 'Unit',
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