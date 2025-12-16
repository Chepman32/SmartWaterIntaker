import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import { StorageService } from '../services/storage';

import en from './locales/en.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import ptBR from './locales/pt-BR.json';
import ar from './locales/ar.json';
import ru from './locales/ru.json';
import it from './locales/it.json';
import nl from './locales/nl.json';
import tr from './locales/tr.json';
import th from './locales/th.json';
import vi from './locales/vi.json';
import id from './locales/id.json';
import pl from './locales/pl.json';
import uk from './locales/uk.json';
import hi from './locales/hi.json';
import he from './locales/he.json';
import sv from './locales/sv.json';
import no from './locales/no.json';
import da from './locales/da.json';
import fi from './locales/fi.json';
import cs from './locales/cs.json';
import hu from './locales/hu.json';
import ro from './locales/ro.json';
import el from './locales/el.json';
import ms from './locales/ms.json';
import fil from './locales/fil.json';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  'pt-BR': { translation: ptBR },
  ar: { translation: ar },
  ru: { translation: ru },
  it: { translation: it },
  nl: { translation: nl },
  tr: { translation: tr },
  th: { translation: th },
  vi: { translation: vi },
  id: { translation: id },
  pl: { translation: pl },
  uk: { translation: uk },
  hi: { translation: hi },
  he: { translation: he },
  sv: { translation: sv },
  no: { translation: no },
  da: { translation: da },
  fi: { translation: fi },
  cs: { translation: cs },
  hu: { translation: hu },
  ro: { translation: ro },
  el: { translation: el },
  ms: { translation: ms },
  fil: { translation: fil },
};

// Get device locale with regional variant support
const getDeviceLocale = (): { languageCode: string; languageTag: string } => {
  const locales = RNLocalize.getLocales();
  if (locales && locales.length > 0) {
    return {
      languageCode: locales[0].languageCode,
      languageTag: locales[0].languageTag,
    };
  }
  return { languageCode: 'en', languageTag: 'en' };
};

// Find the best matching language from supported languages
const findBestLanguageMatch = (
  languageCode: string,
  languageTag: string,
): string => {
  // First, try exact match with language tag (e.g., pt-BR)
  if (resources[languageTag as keyof typeof resources]) {
    return languageTag;
  }

  // Try with language code only (e.g., pt -> pt-BR for Portuguese)
  if (resources[languageCode as keyof typeof resources]) {
    return languageCode;
  }

  // Special handling for regional variants
  const regionalMappings: { [key: string]: string } = {
    pt: 'pt-BR', // Portuguese defaults to Brazilian Portuguese
    nb: 'no', // Norwegian Bokmål maps to Norwegian
    nn: 'no', // Norwegian Nynorsk maps to Norwegian
    tl: 'fil', // Tagalog maps to Filipino
  };

  if (regionalMappings[languageCode]) {
    return regionalMappings[languageCode];
  }

  // Fallback to English
  return 'en';
};

// Get stored language or fallback to device locale
const getInitialLanguage = (): string => {
  try {
    const settings = StorageService.getSettings();
    if (settings?.language) {
      // Verify the stored language is still supported
      if (resources[settings.language as keyof typeof resources]) {
        return settings.language;
      }
    }
  } catch (error) {
    console.log('Failed to load stored language:', error);
  }

  // Fallback to device locale
  const { languageCode, languageTag } = getDeviceLocale();
  const detectedLanguage = findBestLanguageMatch(languageCode, languageTag);

  // Persist the detected language so Redux can pick it up
  try {
    const settings = StorageService.getSettings();
    StorageService.setSettings({ ...settings, language: detectedLanguage });
  } catch (error) {
    console.log('Failed to save detected language:', error);
  }

  return detectedLanguage;
};

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
