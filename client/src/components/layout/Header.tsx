import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Logo, LogoWithText } from "@/components/icons/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconButton } from "@/components/ui/icon-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  PlayCircle,
  Settings,
  Loader2,
  Filter,
  Sun,
  LogOut
} from "lucide-react";

export default function Header() {
  const [_location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  
  // Arama işlemleri için state'ler
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Çıkış Yapıldı",
        description: "Başarıyla çıkış yaptınız.",
        variant: "default"
      });
      navigate("/");
    } catch (error) {
      console.error("Çıkış yapılırken hata oluştu:", error);
      toast({
        title: "Hata",
        description: "Çıkış yapılırken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    }
  };
  
  // Arama fonksiyonu
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Arama hatası",
        description: "Lütfen aramak için bir şeyler yazın.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await apiRequest(`/api/tests?query=${encodeURIComponent(searchQuery)}`);
      
      setSearchResults(response);
      setSearchOpen(true);
    } catch (error) {
      console.error("Arama hatası:", error);
      toast({
        title: "Arama hatası",
        description: "Sonuçlar yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Test detay sayfasına yönlendirme
  const handleTestClick = (testId: number) => {
    setSearchOpen(false);
    navigate(`/tests/${testId}`);
  };

  return (
    <header className="border-b border-border sticky top-0 bg-background z-20">
      <div className="max-w-content py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center">
            <LogoWithText className="h-8" textClassName="text-xl tracking-wide" />
          </Link>
          
          <nav className="hidden md:flex items-center space-x-4">
            {/* Simplified Navigation */}
            <Button
              variant="ghost"
              className="text-foreground hover:bg-accent text-sm font-medium"
              onClick={() => handleNavigation("/categories")}
            >
              <Grid2X2 className="w-4 h-4 mr-2" />
              {t('categories')}
            </Button>
            
            <Button
              variant="ghost"
              className="text-foreground hover:bg-accent text-sm font-medium"
              onClick={() => handleNavigation("/tests")}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              {t('tests')}
            </Button>
            
            <Button
              variant="ghost"
              className="text-foreground hover:bg-accent text-sm font-medium"
              onClick={() => handleNavigation("/how-to-play")}
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              {t('howToPlay')}
            </Button>
            
            <Button
              variant="ghost"
              className="text-foreground hover:bg-accent text-sm font-medium"
              onClick={() => handleNavigation("/support")}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Destek
            </Button>
            
            <Button
              variant="ghost"
              className="text-foreground hover:bg-accent text-sm font-medium"
              onClick={() => handleNavigation("/contact")}
            >
              <Mail className="w-4 h-4 mr-2" />
              İletişim
            </Button>
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
          
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <Search className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Test Ara</DialogTitle>
                <DialogDescription>
                  Aramak istediğiniz test veya içeriği yazıp arama yapabilirsiniz.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Test veya içerik ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Ara
                  </Button>
                </div>
                
                {isSearching ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-2">
                    {searchResults.map((test) => (
                      <div 
                        key={test.id}
                        className="flex flex-col bg-card rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleTestClick(test.id)}
                      >
                        <div className="aspect-video bg-muted">
                          {test.imageUrl ? (
                            <img 
                              src={test.imageUrl} 
                              alt={test.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h4 className="font-medium text-sm line-clamp-1">{test.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {test.description || "Açıklama bulunmuyor"}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[11px] text-muted-foreground">
                              {test.questions?.length || 0} soru
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {test.playCount || 0} oynanma
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery && !isSearching ? (
                  <div className="text-center p-8 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground mb-2">"{searchQuery}" için sonuç bulunamadı</p>
                    <p className="text-sm text-muted-foreground">Farklı anahtar kelimelerle aramayı deneyin.</p>
                  </div>
                ) : null}
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-full text-sm hidden md:flex"
            onClick={() => handleNavigation("/create-test")}
          >
            <PlusCircle className="w-4 h-4 mr-1" /> {t('createTest')}
          </Button>
          
          {!loading && !user ? (
            <Button
              variant="outline"
              className="border-border px-4 py-2 rounded-full text-sm hover:bg-accent hidden md:flex"
              onClick={() => handleNavigation("/login")}
            >
              <User className="w-4 h-4 mr-1" /> {t('login')}
            </Button>
          ) : !loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name || user.email} />
                    <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.user_metadata.full_name || 'Kullanıcı'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => handleNavigation("/profile")}>
                    <User className="w-4 h-4 mr-2" />
                    Profilim
                  </DropdownMenuItem>
                  {user.app_metadata?.role === 'admin' || user.user_metadata?.isAdmin ? (
                    <DropdownMenuItem onClick={() => handleNavigation("/admin")}>
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Paneli
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <div className="flex items-center justify-between w-full px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        <span className="text-sm">Tema</span>
                      </div>
                      <ThemeToggle />
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut} 
                  className="text-red-600 focus:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-theme-muted h-8 w-8 icon-hover-effect"
            onClick={handleSearch}
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
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
        </div>
        
        <div className="mt-auto pt-8 flex flex-col space-y-4">
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold w-full" 
            onClick={() => handleNavigation("/create-test")}
          >
            <PlusCircle className="w-5 h-5 mr-2" /> {t('createTest')}
          </Button>
          
          {!loading && !user ? (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleNavigation("/login")}
            >
              <User className="w-5 h-5 mr-2" /> {t('login')}
            </Button>
          ) : !loading && user ? (
            <>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleNavigation("/profile")}
              >
                <User className="w-5 h-5 mr-2" /> Profilim
              </Button>
              {user.app_metadata?.role === 'admin' || user.user_metadata?.isAdmin ? (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleNavigation("/admin")}
                >
                  <Settings className="w-5 h-5 mr-2" /> Admin Paneli
                </Button>
              ) : null}
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleSignOut}
              >
                Çıkış Yap
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
