import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Language, TranslationKey, translations } from './translations';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
};

const defaultValue: LanguageContextType = {
  language: 'tr',
  setLanguage: () => {},
  t: (key) => key,
};

const LanguageContext = createContext<LanguageContextType>(defaultValue);

export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Try to get stored language preference or default to Turkish
  const [language, setLanguage] = useState<Language>(() => {
    const storedLanguage = localStorage.getItem('language');
    return (storedLanguage === 'en' ? 'en' : 'tr') as Language;
  });

  // Translate function
  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('language', language);
    // Optionally update document language for accessibility
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};