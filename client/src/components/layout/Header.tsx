import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Logo, LogoWithText } from "@/components/icons/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconButton } from "@/components/ui/icon-button";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/lib/LanguageContext";
import { 
  Grid2X2,
  Search,
  PlusCircle,
  User,
  BookOpen,
  HelpCircle,
  Mail,
  Menu,
  X,
  PlayCircle
} from "lucide-react";

export default function Header() {
  const [_location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    if (!isMobile && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-border sticky top-0 bg-background z-20">
      <div className="max-w-content py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center">
            <LogoWithText className="h-8" textClassName="text-xl tracking-wide" />
          </Link>
          
          <nav className="hidden md:flex items-center space-x-1">
            <IconButton
              variant="ghost"
              icon={<Grid2X2 className="w-4 h-4" />}
              label={t('categories')}
              className="text-foreground hover-text-accent text-sm px-3 font-medium"
              onClick={() => handleNavigation("/categories")}
            />
            
            <IconButton
              variant="ghost"
              icon={<BookOpen className="w-4 h-4" />}
              label={t('tests')}
              className="text-foreground hover-text-accent text-sm px-3 font-medium"
              onClick={() => handleNavigation("/tests")}
            />
            
            <IconButton
              variant="ghost"
              icon={<PlayCircle className="w-4 h-4" />}
              label={t('howToPlay')}
              className="text-foreground hover-text-accent text-sm px-3 font-medium"
              onClick={() => handleNavigation("/how-to-play")}
            />
            
            <IconButton
              variant="ghost"
              icon={<HelpCircle className="w-4 h-4" />}
              label="Destek Ol"
              className="text-foreground hover-text-accent text-sm px-3 font-medium"
              onClick={() => handleNavigation("/support")}
            />
            
            <IconButton
              variant="ghost"
              icon={<Mail className="w-4 h-4" />}
              label={t('contact')}
              className="text-foreground hover-text-accent text-sm px-3 font-medium" 
              onClick={() => handleNavigation("/contact")}
            />
          </nav>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={toggleMobileMenu}
            aria-label="Menü"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="relative hidden md:block w-64">
            <Input
              type="text"
              placeholder={t('search')}
              className="bg-muted w-full rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-theme-muted h-8 w-8 icon-hover-effect"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-full text-sm hidden md:flex"
            onClick={() => handleNavigation("/create")}
          >
            <PlusCircle className="w-4 h-4 mr-1" /> {t('createTest')}
          </Button>
          
          <Button
            variant="outline"
            className="border-border px-4 py-2 rounded-full text-sm hover:bg-accent hidden md:flex"
            onClick={() => handleNavigation("/login")}
          >
            <User className="w-4 h-4 mr-1" /> {t('login')}
          </Button>
          
          <LanguageSwitcher />
          
          <ThemeToggle />
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      <div 
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      ></div>
      
      {/* Mobile Menu */}
      <div 
        className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="flex justify-between items-center mb-8">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            <LogoWithText className="h-8" textClassName="text-xl tracking-wide" />
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} aria-label="Kapat">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="relative mb-6">
          <Input
            type="text"
            placeholder={t('search')}
            className="bg-muted w-full rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-theme-muted h-8 w-8 icon-hover-effect"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-col space-y-4">
          <Button 
            variant="ghost" 
            className="justify-start text-foreground" 
            onClick={() => handleNavigation("/categories")}
          >
            <Grid2X2 className="w-5 h-5 mr-3" /> {t('categories')}
          </Button>
          
          <Button 
            variant="ghost" 
            className="justify-start text-foreground" 
            onClick={() => handleNavigation("/tests")}
          >
            <BookOpen className="w-5 h-5 mr-3" /> {t('tests')}
          </Button>
          
          <Button 
            variant="ghost" 
            className="justify-start text-foreground" 
            onClick={() => handleNavigation("/how-to-play")}
          >
            <PlayCircle className="w-5 h-5 mr-3" /> {t('howToPlay')}
          </Button>
          
          <Button 
            variant="ghost" 
            className="justify-start text-foreground" 
            onClick={() => handleNavigation("/support")}
          >
            <HelpCircle className="w-5 h-5 mr-3" /> Destek Ol
          </Button>
          
          <Button 
            variant="ghost" 
            className="justify-start text-foreground" 
            onClick={() => handleNavigation("/contact")}
          >
            <Mail className="w-5 h-5 mr-3" /> {t('contact')}
          </Button>
          
          <div className="py-2">
            <LanguageSwitcher />
          </div>
        </div>
        
        <div className="mt-auto pt-8 flex flex-col space-y-4">
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold w-full" 
            onClick={() => handleNavigation("/create")}
          >
            <PlusCircle className="w-5 h-5 mr-2" /> {t('createTest')}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => handleNavigation("/login")}
          >
            <User className="w-5 h-5 mr-2" /> {t('login')}
          </Button>
        </div>
      </div>
    </header>
  );
}
