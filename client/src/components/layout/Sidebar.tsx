import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { LogoWithText } from "@/components/icons/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Home, 
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
  LogOut, 
  Trophy, 
  Clock, 
  Heart, 
  Zap,
  Grid3X3,
  Layers,
  Filter,
  Gamepad2,
  Sparkles
} from "lucide-react";

export default function Sidebar() {
  const [_, navigate] = useLocation();
  const { user, loading, signOut } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Close sidebar when navigating
  const handleNavigation = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Çıkış Yapıldı",
        description: "Başarıyla çıkış yaptınız.",
        variant: "default"
      });
      navigate("/");
      setSidebarOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Çıkış Hatası",
        description: "Çıkış yapılırken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    }
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tests?search=${encodeURIComponent(searchQuery)}`);
      setSidebarOpen(false);
    }
  };
  
  // Close sidebar when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);
  
  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="rounded-full h-10 w-10 bg-background/80 backdrop-blur-sm border-border/50"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-background border-r border-border flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-border">
          <LogoWithText className="h-8" textClassName="text-xl" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="p-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('search')}
                className="pl-9 pr-4 py-2 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-auto py-2">
          <nav className="px-2 space-y-1">
            {/* Main Navigation */}
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation("/")}
              >
                <Home className="mr-2 h-5 w-5" />
                {t('home')}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation("/categories")}
              >
                <Grid3X3 className="mr-2 h-5 w-5" />
                {t('categories')}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation("/tests")}
              >
                <BookOpen className="mr-2 h-5 w-5" />
                {t('tests')}
              </Button>
            </div>
            
            {/* Game Modes */}
            <div className="pt-4 pb-2">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Oyun Modları
              </h3>
            </div>
            
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation("/game/classic")}
              >
                <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                Klasik Mod
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation("/game/speed")}
              >
                <Zap className="mr-2 h-5 w-5 text-purple-500" />
                Hızlı Mod
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation("/game/time")}
              >
                <Clock className="mr-2 h-5 w-5 text-blue-500" />
                Zamanlı Mod
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation("/game/live")}
              >
                <Heart className="mr-2 h-5 w-5 text-red-500" />
                Canlı Mod
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation("/game/test")}
              >
                <Gamepad2 className="mr-2 h-5 w-5 text-green-500" />
                Test Modu
              </Button>
            </div>
            
            {/* Other Links */}
            <div className="pt-4 pb-2">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Diğer
              </h3>
            </div>
            
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation("/how-to-play")}
              >
                <HelpCircle className="mr-2 h-5 w-5" />
                {t('howToPlay')}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation("/contact")}
              >
                <Mail className="mr-2 h-5 w-5" />
                {t('contact')}
              </Button>
            </div>
          </nav>
        </div>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border">
          {!loading && !user ? (
            <div className="space-y-2">
              <Button 
                className="w-full"
                onClick={() => handleNavigation("/login")}
              >
                <User className="mr-2 h-5 w-5" />
                {t('login')}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleNavigation("/create-test")}
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                {t('createTest')}
              </Button>
            </div>
          ) : !loading && user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || user?.email || ''} />
                  <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user?.displayName || 'Kullanıcı'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  className="w-full"
                  onClick={() => handleNavigation("/create-test")}
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  {t('createTest')}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleNavigation("/profile")}
                >
                  <User className="mr-2 h-5 w-5" />
                  Profilim
                </Button>
                
                {user?.uid && (user.uid === '108973046762004266106' || user.email === 'pixelhuntfun@gmail.com') && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleNavigation("/admin")}
                  >
                    <Settings className="mr-2 h-5 w-5" />
                    Admin Paneli
                  </Button>
                )}
                
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Çıkış Yap
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          
          <Separator className="my-4" />
          
          <div className="flex items-center justify-between">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </>
  );
}