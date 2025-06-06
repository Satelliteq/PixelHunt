import React from "react";
import { Logo, LogoWithText } from "@/components/icons/Logo";
import { IconButton } from "@/components/ui/icon-button";
import { Link } from "wouter";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/LanguageContext";
import { 
  Globe, 
  HelpCircle, 
  Send, 
  Bell, 
  Twitter, 
  Instagram, 
  Mail, 
  ExternalLink, 
  ChevronRight, 
  Eye
} from "lucide-react";

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-muted/30 dark:bg-background border-t border-border pt-10 pb-6 mt-10">
      <div className="max-w-content mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo ve açıklama */}
          <div className="col-span-1 md:col-span-1">
            <LogoWithText className="h-8" textClassName="text-lg" />
            <p className="text-sm text-muted-foreground mt-3">
              {t('language') === 'tr' 
                ? 'Görsel tespit ve hafıza geliştirme oyunları platformu. Testler oluşturun, arkadaşlarınızla paylaşın ve eğlenin!' 
                : 'Visual recognition and memory improvement games platform. Create tests, share with friends and have fun!'}
            </p>
          </div>
          
          {/* Hızlı bağlantılar */}
          <div className="col-span-1">
            <h3 className="font-semibold mb-4 text-theme-primary">{t('quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/categories" className="text-sm text-muted-foreground hover:text-theme-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> {t('categories')}
                </Link>
              </li>
              <li>
                <Link href="/tests" className="text-sm text-muted-foreground hover:text-theme-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> {t('tests')}
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-sm text-muted-foreground hover:text-theme-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> {t('supportUs')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-theme-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> {t('contact')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Yasal */}
          <div className="col-span-1">
            <h3 className="font-semibold mb-4 text-theme-primary">{t('legal')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-theme-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> {t('termsOfService')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-theme-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> {t('privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm text-muted-foreground hover:text-theme-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> {t('cookiePolicy')}
                </Link>
              </li>
              <li>
                <Link href="/announcements" className="text-sm text-muted-foreground hover:text-theme-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> {t('announcements')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* İletişim */}
          <div className="col-span-1">
            <h3 className="font-semibold mb-4 text-theme-primary">{t('contactUs')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-theme-primary flex items-center">
                  <Mail className="h-3 w-3 mr-2" /> iletisim@pixelhunt.com
                </Link>
              </li>
              <li>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-theme-primary flex items-center">
                  <Twitter className="h-3 w-3 mr-2" /> @pixelhunt
                </a>
              </li>
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-theme-primary flex items-center">
                  <Instagram className="h-3 w-3 mr-2" /> @pixelhunt
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Alt kısım - telif hakkı ve dil */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-10 pt-5 border-t border-border">
          <div className="text-xs text-muted-foreground mb-3 sm:mb-0">
            &copy; {new Date().getFullYear()} Pixelhunt. {t('allRightsReserved')}.
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center px-2">
              <LanguageSwitcher />
            </div>
            <div className="flex space-x-2">
              <IconButton
                variant="ghost"
                size="sm"
                icon={<HelpCircle className="w-4 h-4" />}
                className="w-7 h-7 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground"
                aria-label="Yardım"
              />
              <IconButton
                variant="ghost"
                size="sm"
                icon={<Send className="w-4 h-4" />}
                className="w-7 h-7 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground"
                aria-label="İletişim"
              />
              <IconButton
                variant="ghost"
                size="sm"
                icon={<Bell className="w-4 h-4" />}
                className="w-7 h-7 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground"
                aria-label="Bildirimler"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}