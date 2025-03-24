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
      {/* Hero Banner Carousel */}
      <section className="relative overflow-hidden rounded-2xl hero-carousel max-w-content mx-auto">
        {/* Carousel Navigation Buttons */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-black/20 text-white hover:bg-black/40"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-black/20 text-white hover:bg-black/40"
            onClick={nextSlide}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Indicator Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === activeHeroSlide ? "bg-white" : "bg-white/30"
              }`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>

        {/* Carousel Slides */}
        {heroSlides.map((slide, index) => (
          <div 
            key={index} 
            className={`hero-carousel-slide ${
              index === slideState.prev ? 'prev' : 
              index === activeHeroSlide ? 'active' : 
              index === slideState.next ? 'next' : ''
            }`}
          >
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10"></div>
            <div className="relative z-10 px-8 py-10 md:p-12 flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 md:max-w-[60%]">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{slide.title}</h1>
                <p className="text-white/80 mb-5">{slide.description}</p>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => navigate(slide.primaryAction.url)}
                    className="bg-white text-primary hover:bg-white/90 font-medium"
                  >
                    {slide.primaryAction.icon}
                    {slide.primaryAction.text}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      if (slide.secondaryAction.url.startsWith('#')) {
                        setActiveTab(slide.secondaryAction.url.substring(1));
                      } else {
                        navigate(slide.secondaryAction.url);
                      }
                    }}
                    className="bg-transparent border-white text-white hover:bg-white/10"
                  >
                    {slide.secondaryAction.icon}
                    {slide.secondaryAction.text}
                  </Button>
                </div>
              </div>
              <div className="flex-shrink-0 w-full md:w-[280px] rounded-xl overflow-hidden custom-hero-overlay backdrop-blur-sm">
                <div className="p-4">
                  <h3 className="text-white font-semibold flex items-center">
                    {slide.icon} {slide.cardTitle}
                  </h3>
                  <div className="mt-3 aspect-video rounded-lg overflow-hidden custom-frame">
                    {/* Farklı içerikler için karousel bazında farklı veriler gösterme */}
                    {index === 0 && featuredTests && featuredTests[0] && (
                      <img 
                        src={featuredTests[0].imageUrl || '/default-test-thumb.jpg'} 
                        alt={featuredTests[0].title}
                        className="w-full h-full object-cover" 
                      />
                    )}
                    {index === 1 && popularTests && popularTests[0] && (
                      <img 
                        src={popularTests[0].imageUrl || '/default-test-thumb.jpg'} 
                        alt={popularTests[0].title}
                        className="w-full h-full object-cover" 
                      />
                    )}
                    {index === 2 && (
                      <div className="w-full h-full flex items-center justify-center bg-primary/20">
                        <Plus className="h-10 w-10 text-white/70" />
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <h4 className="text-white text-sm font-medium">
                      {index === 0 && featuredTests && featuredTests[0] 
                        ? featuredTests[0].title 
                        : index === 1 && popularTests && popularTests[0]
                          ? popularTests[0].title
                          : index === 2
                            ? "Yeni Test Oluştur"
                            : t('loading')}
                    </h4>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center text-xs text-white/60">
                        {index !== 2 ? (
                          <>
                            <Users className="h-3 w-3 mr-1" /> 
                            <span>
                              {index === 0 && featuredTests && featuredTests[0] 
                                ? (featuredTests[0].playCount || 0) 
                                : index === 1 && popularTests && popularTests[0]
                                  ? (popularTests[0].playCount || 0)
                                  : "0"} {t('players')}
                            </span>
                          </>
                        ) : (
                          <span>Kendi testlerinizi oluşturun</span>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 text-xs text-white bg-white/10 hover:bg-white/20"
                        onClick={() => {
                          if (index === 0 && featuredTests && featuredTests[0]) {
                            handleTestClick(featuredTests[0].id);
                          } else if (index === 1 && popularTests && popularTests[0]) {
                            handleTestClick(popularTests[0].id);
                          } else if (index === 2) {
                            navigate("/test-create");
                          }
                        }}
                      >
                        {index === 2 ? 'Oluştur' : t('play')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
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
