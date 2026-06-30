import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationHI from './locales/hi/translation.json';
import authEN from './locales/en/auth.json';
import authHI from './locales/hi/auth.json';
import dashboardEN from './locales/en/dashboard.json';
import dashboardHI from './locales/hi/dashboard.json';
import imageEN from './locales/en/image.json';
import imageHI from './locales/hi/image.json';
import videoEN from './locales/en/video.json';
import videoHI from './locales/hi/video.json';
import historyEN from './locales/en/history.json';
import historyHI from './locales/hi/history.json';
import reportsEN from './locales/en/reports.json';
import reportsHI from './locales/hi/reports.json';
import textEN from './locales/en/text.json';
import textHI from './locales/hi/text.json';
import urlEN from './locales/en/url.json';
import urlHI from './locales/hi/url.json';
import settingsEN from './locales/en/settings.json';
import settingsHI from './locales/hi/settings.json';
import profileEN from './locales/en/profile.json';
import profileHI from './locales/hi/profile.json';
import imageResultsEN from './locales/en/imageResults.json';
import imageResultsHI from './locales/hi/imageResults.json';
import videoResultsEN from './locales/en/videoResults.json';
import videoResultsHI from './locales/hi/videoResults.json';
import textResultsEN from './locales/en/textResults.json';
import textResultsHI from './locales/hi/textResults.json';
import urlResultsEN from './locales/en/urlResults.json';
import urlResultsHI from './locales/hi/urlResults.json';
import reportResultsEN from './locales/en/reportResults.json';
import reportResultsHI from './locales/hi/reportResults.json';
import commonResultsEN from './locales/en/commonResults.json';
import commonResultsHI from './locales/hi/commonResults.json';

const resources = {
  en: {
    translation: translationEN,
    auth: authEN,
    dashboard: dashboardEN,
    image: imageEN,
    video: videoEN,
    history: historyEN,
    reports: reportsEN,
    text: textEN,
    url: urlEN,
    settings: settingsEN,
    profile: profileEN,
    imageResults: imageResultsEN,
    videoResults: videoResultsEN,
    textResults: textResultsEN,
    urlResults: urlResultsEN,
    reportResults: reportResultsEN,
    commonResults: commonResultsEN
  },
  hi: {
    translation: translationHI,
    auth: authHI,
    dashboard: dashboardHI,
    image: imageHI,
    video: videoHI,
    history: historyHI,
    reports: reportsHI,
    text: textHI,
    url: urlHI,
    settings: settingsHI,
    profile: profileHI,
    imageResults: imageResultsHI,
    videoResults: videoResultsHI,
    textResults: textResultsHI,
    urlResults: urlResultsHI,
    reportResults: reportResultsHI,
    commonResults: commonResultsHI
  }
};

const i18nInstance = i18n.createInstance();

i18nInstance
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      caches: ['localStorage', 'cookie']
    }
  });

// Multilingual Helper APIs
export const changeLanguage = (lng) => {
  i18nInstance.changeLanguage(lng);
};

export const currentLanguage = () => {
  const lng = i18nInstance.language || 'en';
  if (lng.startsWith('hi')) return 'hi';
  return 'en';
};

export const isHindi = () => {
  return currentLanguage().startsWith('hi');
};

export const isEnglish = () => {
  return currentLanguage().startsWith('en');
};

export default i18nInstance;
