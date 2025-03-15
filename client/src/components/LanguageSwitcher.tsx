import React from 'react';
import { Button } from './ui/button';
import { useLanguage } from '@/lib/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 border rounded-lg overflow-hidden">
      <Button
        onClick={() => setLanguage('tr')}
        variant={language === 'tr' ? 'default' : 'ghost'}
        size="sm"
        className={`px-2 py-1 h-8 rounded-none ${language === 'tr' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <span className="text-sm">🇹🇷</span>
      </Button>
      <Button
        onClick={() => setLanguage('en')}
        variant={language === 'en' ? 'default' : 'ghost'}
        size="sm"
        className={`px-2 py-1 h-8 rounded-none ${language === 'en' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <span className="text-sm">🇬🇧</span>
      </Button>
    </div>
  );
}