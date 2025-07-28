import dayjs from "dayjs";
import Cookies from "js-cookie";
import useGetSetting from "./useGetSetting";

const useUtilsFunction = () => {
  let lang = Cookies.get("_lang");
  
  // Force only English or Arabic - ignore browser locale completely
  if (!lang || !['en', 'ar'].includes(lang)) {
    lang = 'en';
    // Set the correct cookie and clear any other language cookies
    Cookies.set('_lang', 'en', { expires: 365 });
    Cookies.set('NEXT_LOCALE', 'en', { expires: 365 });
    
    // Clear any other language-related cookies
    const allCookies = Cookies.get();
    Object.keys(allCookies).forEach(cookieName => {
      if (cookieName.includes('lang') || cookieName.includes('locale')) {
        const cookieValue = allCookies[cookieName];
        try {
          const parsedValue = JSON.parse(cookieValue);
          if (parsedValue && parsedValue.code && !['en', 'ar'].includes(parsedValue.code)) {
            Cookies.remove(cookieName);
          }
        } catch (e) {
          // If it's not JSON, check if it's a string value
          if (typeof cookieValue === 'string' && !['en', 'ar'].includes(cookieValue)) {
            Cookies.remove(cookieName);
          }
        }
      }
    });
  }

  const { globalSetting } = useGetSetting();

  let currency = globalSetting?.default_currency || "$";
  
  if (currency && typeof currency === 'string') {
    const normalized = currency.toUpperCase().trim();
    const isRiyal = ['SAR', 'SAUDI RIYAL', 'RIYAL', 'SAR.', 'RIAL', 'SR', '﷼', 'SAR﷼', 'ريال', 'JD', 'JOD'].includes(normalized) || 
        currency.includes('ريال') || currency.includes('﷼');
    
    if (isRiyal) {
      currency = '\uE900'; // Private-use code-point rendered via saudi_riyal font
    }
  }

  //for date and time format
  const showTimeFormat = (data, timeFormat) => {
    return dayjs(data).format(timeFormat);
  };

  const showDateFormat = (data) => {
    return dayjs(data).format(globalSetting?.default_date_format);
  };

  const showDateTimeFormat = (data, date, time) => {
    return dayjs(data).format(`${date} ${time}`);
  };

  //for formatting number

  const getNumber = (value = 0) => {
    return Number(parseFloat(value || 0).toFixed(2));
  };

  const getNumberTwo = (value = 0) => {
    return parseFloat(value || 0).toFixed(globalSetting?.floating_number || 2);
  };

  //for translation
  const showingTranslateValue = (data) => {
    if (!data) return '';

    // If data is already a plain string, return as is
    if (typeof data === 'string') return data;

    // If data looks like an object with numeric keys (string chars) -> flatten to string
    const keys = Object.keys(data);
    const isCharMap = keys.every(k => !isNaN(k));
    if (isCharMap) {
      return keys.sort((a,b)=>a-b).map(k => data[k]).join('');
    }

    // Check if data is an object with language keys
    if (typeof data === 'object' && data !== null) {
      // When current language exists in the object, return it
      if (data[lang] && typeof data[lang] === 'string') return data[lang];

      // If Arabic UI but Arabic value missing, avoid falling back to English so that component can use i18n t() fallback instead
      if (lang === 'ar') return '';

      // For other languages, gracefully fall back to English or first available
      const fallbackValue = data.en || data[Object.keys(data)[0]] || '';
      return typeof fallbackValue === 'string' ? fallbackValue : '';
    }

    // Final fallback - ensure we always return a string
    const finalValue = data?.en || '';
    return typeof finalValue === 'string' ? finalValue : '';
  };

  const showingImage = (data) => {
    return data !== undefined && data;
  };

  const showingUrl = (data) => {
    return data !== undefined ? data : "!#";
  };

  /*
   * Simple helper to translate short static phrases without adding JSON keys.
   * Usage: tr('English', 'Arabic') will return Arabic when current lang is 'ar'.
   */
  const tr = (en, ar) => {
    if (lang === 'ar') return ar;
    return en;
  };

  return {
    lang,
    currency,
    getNumber,
    getNumberTwo,
    showTimeFormat,
    showDateFormat,
    showingImage,
    showingUrl,
    globalSetting,
    showDateTimeFormat,
    showingTranslateValue,
    tr,
  };
};

export default useUtilsFunction;
