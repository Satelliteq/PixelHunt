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
  Github,
  Linkedin,
  Youtube,
  Facebook
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-card dark:bg-card/50 border-t border-border pt-16 pb-8 mt-20">
      <div className="max-w-content mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          {/* Logo and description section */}
          <div className="col-span-1 md:col-span-4">
            <LogoWithText className="h-8" textClassName="text-lg" />
            <p className="text-sm text-muted-foreground mt-4 mb-6 max-w-md">
              {t('language') === 'tr' 
                ? 'Görsel tespit ve hafıza geliştirme oyunları platformu. Testler oluşturun, arkadaşlarınızla paylaşın ve eğlenin!' 
                : 'Visual recognition and memory improvement games platform. Create tests, share with friends and have fun!'}
            </p>
            
            <div className="flex space-x-3">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Quick links section */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-semibold mb-4 text-foreground">{t('quickLinks')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/categories" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> {t('categories')}
                </Link>
              </li>
              <li>
                <Link href="/tests" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> {t('tests')}
                </Link>
              </li>
              <li>
                <Link href="/how-to-play" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> {t('howToPlay')}
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> {t('supportUs')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> {t('contact')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Game Modes section */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-semibold mb-4 text-foreground">Oyun Modları</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/game/classic" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> Klasik Mod
                </Link>
              </li>
              <li>
                <Link href="/game/speed" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> Hızlı Mod
                </Link>
              </li>
              <li>
                <Link href="/game/time" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> Zamanlı Mod
                </Link>
              </li>
              <li>
                <Link href="/game/live" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> Canlı Mod
                </Link>
              </li>
              <li>
                <Link href="/game/test" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> Test Modu
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal section */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-semibold mb-4 text-foreground">{t('legal')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> {t('termsOfService')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> {t('privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> {t('cookiePolicy')}
                </Link>
              </li>
              <li>
                <Link href="/announcements" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1" /> {t('announcements')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact section */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-semibold mb-4 text-foreground">{t('contactUs')}</h3>
            <ul className="space-y-3">
              <li>
                <a href="mailto:iletisim@pixelhunt.com" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                  <Mail className="w-4 h-4 mr-2" /> iletisim@pixelhunt.com
                </a>
              </li>
              <li>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                  <Twitter className="w-4 h-4 mr-2" /> @pixelhunt
                </a>
              </li>
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                  <Instagram className="w-4 h-4 mr-2" /> @pixelhunt
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Newsletter */}
        <div className="border-t border-border pt-8 pb-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Yeniliklerden Haberdar Olun</h3>
              <p className="text-sm text-muted-foreground">Yeni özellikler ve güncellemeler hakkında bilgi almak için abone olun.</p>
            </div>
            <div className="flex w-full md:w-auto">
              <div className="relative flex-grow md:w-64">
                <Input 
                  type="email" 
                  placeholder="E-posta adresiniz" 
                  className="pr-24"
                />
                <Button 
                  className="absolute right-0 top-0 rounded-l-none"
                  size="sm"
                >
                  Abone Ol
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom section with copyright and language */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-border">
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