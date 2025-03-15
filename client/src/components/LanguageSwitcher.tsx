import React from 'react';
import { Button } from './ui/button';
import { useLanguage } from '@/lib/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 border rounded-md overflow-hidden">
      <Button
        onClick={() => setLanguage('tr')}
        variant={language === 'tr' ? 'default' : 'ghost'}
        size="sm"
        className={`px-2 py-1 h-8 rounded-none ${language === 'tr' ? 'text-primary-foreground' : 'text-muted-foreground'}`}
      >
        <span className="mr-1.5">🇹🇷</span>
        TR
      </Button>
      <Button
        onClick={() => setLanguage('en')}
        variant={language === 'en' ? 'default' : 'ghost'}
        size="sm"
        className={`px-2 py-1 h-8 rounded-none ${language === 'en' ? 'text-primary-foreground' : 'text-muted-foreground'}`}
      >
        <span className="mr-1.5">🇬🇧</span>
        EN
      </Button>
    </div>
  );
}