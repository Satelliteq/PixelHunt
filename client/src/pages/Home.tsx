import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Heart, Trophy, BookOpen, Filter, Clock, Users, Sparkles, Award, ChevronLeft, ChevronRight, Plus, Search, X, Loader2 } from "lucide-react";
import { Test } from "@shared/schema";
import { useLanguage } from "@/lib/LanguageContext";

import ContentCard from "@/components/game/ContentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [_, navigate] = useLocation();
  const { t } = useLanguage();

  // Active tab state
  const [activeTab, setActiveTab] = useState("featured");
  
  // Hero carousel state
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  
  // Arama durumu
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Test[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Arama fonksiyonu
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
      return;
    }
    
    setIsSearching(true);
    setShowSearchResults(true);
    
    try {
      // API'ye arama sorgusu gönder
      const response = await fetch(`/api/tests?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Arama hatası:", error);
      // Hata durumunda boş sonuç göster
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Define hero slides using translation function
  const heroSlides = [
    {
      title: t('heroTitle'),
      description: t('heroDescription'),
      icon: <Award className="h-4 w-4 mr-2" />,
      cardTitle: t('featured'),
      primaryAction: { 
        text: t('createTest'), 
        icon: <BookOpen className="mr-2 h-4 w-4" />, 
        url: "/create-test" 
      },
      secondaryAction: { 
        text: t('popular'), 
        icon: <Trophy className="mr-2 h-4 w-4" />, 
        url: "#popular" 
      },
    },
    {
      title: t('heroTitle'),
      description: t('heroDescription'),
      icon: <Trophy className="h-4 w-4 mr-2" />,
      cardTitle: t('popular'),
      primaryAction: { 
        text: t('popular'), 
        icon: <Trophy className="mr-2 h-4 w-4" />, 
        url: "#popular" 
      },
      secondaryAction: { 
        text: t('createTest'), 
        icon: <Plus className="mr-2 h-4 w-4" />, 
        url: "/create-test" 
      },
    },
    {
      title: t('heroTitle'),
      description: t('heroDescription'),
      icon: <Plus className="h-4 w-4 mr-2" />,
      cardTitle: t('createTest'),
      primaryAction: { 
        text: t('createTest'), 
        icon: <Plus className="mr-2 h-4 w-4" />, 
        url: "/create-test" 
      },
      secondaryAction: { 
        text: t('featured'), 
        icon: <BookOpen className="mr-2 h-4 w-4" />, 
        url: "#featured" 
      },
    }
  ];

  // Carousel state to track previous and next slides
  const [slideState, setSlideState] = useState<{
    prev: number | null;
    active: number;
    next: number | null;
  }>({
    prev: null,
    active: 0,
    next: 1
  });

  // Update slide state whenever active slide changes
  useEffect(() => {
    const prevIndex = (activeHeroSlide - 1 + heroSlides.length) % heroSlides.length;
    const nextIndex = (activeHeroSlide + 1) % heroSlides.length;
    
    setSlideState({
      prev: prevIndex,
      active: activeHeroSlide,
      next: nextIndex
    });
  }, [activeHeroSlide, heroSlides.length]);

  // Carousel auto rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHeroSlide(prev => (prev + 1) % heroSlides.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  // Reset animation helper function
  const resetSlideAnimation = (callback: () => void) => {
    const slides = document.querySelectorAll('.hero-carousel-slide');
    slides.forEach(slide => {
      slide.classList.add('animation-reset');
    });
    
    // Use timeout to ensure DOM changes are processed
    setTimeout(() => {
      slides.forEach(slide => {
        slide.classList.remove('animation-reset');
      });
      callback();
    }, 10);
  };
  
  // Navigation handlers with auto animation reset
  const prevSlide = () => {
    resetSlideAnimation(() => {
      setActiveHeroSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
    });
  };
  
  const nextSlide = () => {
    resetSlideAnimation(() => {
      setActiveHeroSlide(prev => (prev + 1) % heroSlides.length);
    });
  };
  
  // For indicator dots
  const goToSlide = (index: number) => {
    if (index === activeHeroSlide) return;
    resetSlideAnimation(() => {
      setActiveHeroSlide(index);
    });
  };

  // Fetch popular tests
  const { data: popularTests, isLoading: isPopularTestsLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests/popular"],
    enabled: activeTab === "popular" || activeTab === "featured",
  });

  // Fetch newest tests
  const { data: newestTests, isLoading: isNewestTestsLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests/newest"],
    enabled: activeTab === "newest" || activeTab === "featured",
  });

  // Fetch featured tests
  const { data: featuredTests, isLoading: isFeaturedTestsLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests/featured"],
    enabled: activeTab === "featured",
  });

  const handleTestClick = (testId: number) => {
    navigate(`/tests/${testId}`);
  };

  // Helper functions were refactored directly into the component rendering

  return (
    <div className="space-y-12">
      {/* Simple and Modern Hero Banner */}
      <section className="hero-banner rounded-2xl max-w-content mx-auto overflow-hidden bg-gradient-to-r from-primary/90 via-primary to-primary/80">
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-5"></div>
        
        <div className="relative z-10 p-8 md:p-16 flex flex-col items-center text-center">
          <span className="hero-badge text-white">✨ Pixel Hunt</span>
          
          <h1 className="hero-title text-white">
            Görsellerinizi <span className="text-black font-extrabold">Tahmin Etmeye</span> Hazır Mısınız?
          </h1>
          
          <p className="hero-description text-white/90">
            Farklı kategorilerde testler oluşturun, paylaşın ve arkadaşlarınızla birlikte eğlenin!
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              onClick={() => navigate("/create-test")}
              className="hero-action-button bg-black hover:bg-black/90 text-white px-6"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Test Oluştur
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setActiveTab("popular")}
              className="hero-action-button bg-transparent border-white text-white hover:bg-white/10 px-6"
              size="lg"
            >
              <Trophy className="mr-2 h-5 w-5" />
              Popüler Testler
            </Button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-black/10 rounded-full blur-3xl"></div>
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
      </section>

      {/* Search Results (hidden by default, shown when search is activated) */}
      {showSearchResults && (
        <section className="max-w-content mx-auto mb-8">
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Arama Sonuçları
              {searchResults.length > 0 && <span className="text-sm ml-2 text-muted-foreground">({searchResults.length} sonuç)</span>}
            </h2>
            
            {isSearching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center p-8 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground mb-2">"{searchQuery}" için sonuç bulunamadı</p>
                <p className="text-sm text-muted-foreground">Farklı anahtar kelimelerle aramayı deneyin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {searchResults.map((test) => (
                  <ContentCard
                    key={test.id}
                    title={test.title}
                    imageUrl={test.imageUrl || '/default-test-thumb.jpg'}
                    playCount={test.playCount}
                    likeCount={test.likeCount}
                    duration={`${test.questions && Array.isArray(test.questions) ? test.questions.length : 0} ${t('question')}`}
                    onClick={() => handleTestClick(test.id)}
                  />
                ))}
              </div>
            )}
            
            {searchResults.length > 0 && (
              <div className="flex justify-center mt-6">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSearchResults(false)}
                >
                  Sonuçları Kapat
                </Button>
              </div>
            )}
          </div>
        </section>
      )}
      
      {/* Main Content */}
      <section className="max-w-content mx-auto">
        <Tabs defaultValue="featured" onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <TabsList className="custom-tab-bg">
              <TabsTrigger value="featured" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Sparkles className="w-4 h-4 mr-2" />
                {t('featured')}
              </TabsTrigger>
              <TabsTrigger value="popular" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Trophy className="w-4 h-4 mr-2" />
                {t('popular')}
              </TabsTrigger>
              <TabsTrigger value="newest" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Clock className="w-4 h-4 mr-2" />
                {t('newest')}
              </TabsTrigger>
            </TabsList>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2 custom-frame border-none hover:custom-frame self-end sm:self-auto"
              onClick={() => navigate("/tests")}
            >
              <Filter className="w-4 h-4" />
              <span>{t('allTests')}</span>
            </Button>
          </div>
          
          <TabsContent value="featured" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {isFeaturedTestsLoading ? (
                Array(10).fill(0).map((_, index) => (
                  <div key={index} className="animate-pulse test-card rounded-xl h-[220px]"></div>
                ))
              ) : (
                featuredTests?.map((test) => (
                  <ContentCard
                    key={test.id}
                    title={test.title}
                    imageUrl={test.imageUrl || '/default-test-thumb.jpg'}
                    playCount={test.playCount || 0}
                    likeCount={test.likeCount || 0}
                    duration={`${test.questions && Array.isArray(test.questions) ? test.questions.length : 0} ${t('question')}`}
                    onClick={() => handleTestClick(test.id)}
                  />
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="popular" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {isPopularTestsLoading ? (
                Array(10).fill(0).map((_, index) => (
                  <div key={index} className="animate-pulse test-card rounded-xl h-[220px]"></div>
                ))
              ) : (
                popularTests?.map((test) => (
                  <ContentCard
                    key={test.id}
                    title={test.title}
                    imageUrl={test.imageUrl || '/default-test-thumb.jpg'}
                    playCount={test.playCount || 0}
                    likeCount={test.likeCount || 0}
                    duration={`${test.questions && Array.isArray(test.questions) ? test.questions.length : 0} ${t('question')}`}
                    onClick={() => handleTestClick(test.id)}
                  />
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="newest" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {isNewestTestsLoading ? (
                Array(10).fill(0).map((_, index) => (
                  <div key={index} className="animate-pulse test-card rounded-xl h-[220px]"></div>
                ))
              ) : (
                newestTests?.map((test) => (
                  <ContentCard
                    key={test.id}
                    title={test.title}
                    imageUrl={test.imageUrl || '/default-test-thumb.jpg'}
                    playCount={test.playCount || 0}
                    likeCount={test.likeCount || 0}
                    duration={`${test.questions && Array.isArray(test.questions) ? test.questions.length : 0} ${t('question')}`}
                    onClick={() => handleTestClick(test.id)}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Categories Section */}
      <section className="max-w-content mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold flex items-center">
            <Filter className="w-5 h-5 text-primary mr-2" /> {t('discoverByCategory')}
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs self-end sm:self-auto"
            onClick={() => navigate("/categories")}
          >
            {t('allCategories')}
          </Button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Category cards - Hardcoded for now until we add categories component */}
          <div 
            className="custom-frame hover:bg-[hsl(var(--frame-hover))] transition-colors rounded-xl p-4 text-center cursor-pointer"
            onClick={() => navigate("/categories")}
          >
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-medium">{t('catLiterature')}</h3>
            <p className="text-xs text-muted-foreground mt-1">120+ {t('tests').toLowerCase()}</p>
          </div>
          
          <div 
            className="custom-frame hover:bg-[hsl(var(--frame-hover))] transition-colors rounded-xl p-4 text-center cursor-pointer"
            onClick={() => navigate("/categories")}
          >
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl text-white">🌎</span>
            </div>
            <h3 className="font-medium">{t('catGeography')}</h3>
            <p className="text-xs text-muted-foreground mt-1">86 {t('tests').toLowerCase()}</p>
          </div>
          
          <div 
            className="custom-frame hover:bg-[hsl(var(--frame-hover))] transition-colors rounded-xl p-4 text-center cursor-pointer"
            onClick={() => navigate("/categories")}
          >
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl text-white">🎬</span>
            </div>
            <h3 className="font-medium">{t('catFilmTV')}</h3>
            <p className="text-xs text-muted-foreground mt-1">214 {t('tests').toLowerCase()}</p>
          </div>
          
          <div 
            className="custom-frame hover:bg-[hsl(var(--frame-hover))] transition-colors rounded-xl p-4 text-center cursor-pointer"
            onClick={() => navigate("/categories")}
          >
            <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl text-white">🎨</span>
            </div>
            <h3 className="font-medium">{t('catArt')}</h3>
            <p className="text-xs text-muted-foreground mt-1">73 {t('tests').toLowerCase()}</p>
          </div>
          
          <div 
            className="custom-frame hover:bg-[hsl(var(--frame-hover))] transition-colors rounded-xl p-4 text-center cursor-pointer"
            onClick={() => navigate("/categories")}
          >
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl text-white">🎮</span>
            </div>
            <h3 className="font-medium">{t('catGames')}</h3>
            <p className="text-xs text-muted-foreground mt-1">95 {t('tests').toLowerCase()}</p>
          </div>
          
          <div 
            className="custom-frame hover:bg-[hsl(var(--frame-hover))] transition-colors rounded-xl p-4 text-center cursor-pointer"
            onClick={() => navigate("/categories")}
          >
            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl text-white">+</span>
            </div>
            <h3 className="font-medium">{t('catMore')}</h3>
            <p className="text-xs text-muted-foreground mt-1">300+ {t('tests').toLowerCase()}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
