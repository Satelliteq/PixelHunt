import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Language, TranslationKey, translations } from '../lib/translations';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
};

// Default language (browser language or fallback to Turkish)
const getDefaultLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'tr') return 'tr';
  }
  return 'tr'; // Default to Turkish
};

const defaultValue: LanguageContextType = {
  language: getDefaultLanguage(),
  setLanguage: () => {},
  t: (key: TranslationKey) => key,
};

const LanguageContext = createContext<LanguageContextType>(defaultValue);

export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(getDefaultLanguage());

  // Load saved language preference from localStorage if available
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('appLanguage') as Language;
      if (savedLanguage && (savedLanguage === 'tr' || savedLanguage === 'en')) {
        setLanguage(savedLanguage);
      }
    }
  }, []);

  // Save language preference to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('appLanguage', language);
    }
  }, [language]);

  // Translation function
  const t = (key: TranslationKey): string => {
    const translation = translations[language]?.[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};