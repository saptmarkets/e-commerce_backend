import dayjs from "dayjs";
import Cookies from "js-cookie";
import useGetSetting from "./useGetSetting";

const useUtilsFunction = () => {
  const lang = Cookies.get("_lang");

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
      // Try current language first, then English, then first available language
      return data[lang] || data.en || data[Object.keys(data)[0]] || '';
    }

    return data?.en || '';
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
