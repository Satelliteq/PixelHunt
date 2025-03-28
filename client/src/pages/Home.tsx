import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Heart, Trophy, BookOpen, Filter, Clock, Users, Sparkles, Award, ChevronLeft, ChevronRight, Plus, Search, X, Loader2 } from "lucide-react";
import { Test, Category } from "@shared/schema";
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

  // Fetch categories
  const { data: categoriesData } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Örnek kategoriler (API'den veri gelmezse kullanılacak)
  const defaultCategories: Array<{id?: number, name: string, iconName?: string}> = [
    { id: 1, name: "Film & TV", iconName: "🎬" },
    { id: 2, name: "Müzik", iconName: "🎵" },
    { id: 3, name: "Sanat", iconName: "🎨" },
    { id: 4, name: "Oyun", iconName: "🎮" },
    { id: 5, name: "Spor", iconName: "⚽" },
    { id: 6, name: "Bilim", iconName: "🧪" },
  ];

  // Kategorileri API'den veya varsayılan veriden al
  const categories = categoriesData || defaultCategories;

  const handleTestClick = (testId: number) => {
    navigate(`/tests/${testId}`);
  };

  // Helper functions were refactored directly into the component rendering

  return (
    <div className="space-y-12">
      {/* Gaming Platform Hero Section with theme aware styling */}
      <section className="relative hero-banner max-w-content mx-auto overflow-hidden">
        {/* Hero banner with theme-aware styling */}
        <div className="relative w-full bg-card rounded-lg mb-8 border shadow-sm">
          <div className="flex flex-col md:flex-row items-center overflow-hidden">
            {/* Left side content */}
            <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center z-10">
              <div className="inline-block mb-4">
                <span className="bg-primary text-primary-foreground py-1 px-4 rounded-md text-sm font-bold shadow-sm">
                  ✨ Pixel Hunt
                </span>
              </div>
              
              <h1 className="text-card-foreground text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                Görsellerinizi <span className="text-primary font-extrabold">Tahmin Etmeye</span> Hazır Mısınız?
              </h1>
              
              <p className="text-muted-foreground max-w-xl mb-8">
                Farklı kategorilerde testler oluşturun, paylaşın ve arkadaşlarınızla birlikte eğlenin!
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => navigate("/create-test")}
                  size="lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Test Oluştur
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab("popular")}
                  size="lg"
                >
                  <Trophy className="mr-2 h-5 w-5" />
                  Popüler Testler
                </Button>
              </div>
            </div>
            
            {/* Right side image */}
            <div className="w-full md:w-1/2 h-[260px] md:h-[320px] relative">
              {/* Decorative elements */}
              <div className="absolute top-6 right-10 w-16 h-16 bg-primary/10 rounded-full blur-xl z-10"></div>
              <div className="absolute bottom-10 left-20 w-20 h-20 bg-primary/10 rounded-full blur-xl z-10"></div>
              
              {/* Dynamic overlapping test cards */}
              <div className="absolute bottom-4 right-0 transform -rotate-6 translate-x-5 w-48 h-64 md:w-56 md:h-72 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg shadow-xl overflow-hidden">
                <div className="absolute inset-0.5 bg-black/30 rounded-[7px] p-3 flex flex-col">
                  <div className="mt-auto">
                    <div className="bg-amber-300 w-10 h-10 rounded-full mb-2 flex items-center justify-center text-xl">
                      🎮
                    </div>
                    <h3 className="text-white font-bold text-lg">Oyun</h3>
                    <p className="text-white/70 text-sm">20+ Test</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-4 right-20 transform rotate-3 w-48 h-64 md:w-56 md:h-72 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg shadow-xl overflow-hidden z-20">
                <div className="absolute inset-0.5 bg-black/30 rounded-[7px] p-3 flex flex-col">
                  <div className="mt-auto">
                    <div className="bg-sky-300 w-10 h-10 rounded-full mb-2 flex items-center justify-center text-xl">
                      🎬
                    </div>
                    <h3 className="text-white font-bold text-lg">Film</h3>
                    <p className="text-white/70 text-sm">45+ Test</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-4 right-40 transform -rotate-3 w-48 h-64 md:w-56 md:h-72 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-xl overflow-hidden z-30">
                <div className="absolute inset-0.5 bg-black/30 rounded-[7px] p-3 flex flex-col">
                  <div className="mt-auto">
                    <div className="bg-emerald-300 w-10 h-10 rounded-full mb-2 flex items-center justify-center text-xl">
                      🎨
                    </div>
                    <h3 className="text-white font-bold text-lg">Sanat</h3>
                    <p className="text-white/70 text-sm">30+ Test</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Category shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          {categories.slice(0, 6).map((category, index) => (
            <div 
              key={index}
              className="bg-card border-border hover:border-primary/50 transition-colors p-3 rounded-lg text-center cursor-pointer border shadow-sm"
              onClick={() => navigate(`/category/${category.id || index + 1}`)}
            >
              <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-lg mb-2 ${
                index % 6 === 0 ? "bg-amber-500" : 
                index % 6 === 1 ? "bg-sky-500" : 
                index % 6 === 2 ? "bg-emerald-500" : 
                index % 6 === 3 ? "bg-violet-500" : 
                index % 6 === 4 ? "bg-yellow-500" : "bg-orange-500"
              }`}>
                {category.iconName || category.icon_name || "🎯"}
              </div>
              <h3 className="text-card-foreground text-sm font-medium truncate">{category.name}</h3>
            </div>
          ))}
        </div>
        
        {/* Featured sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {/* Popular */}
          <div className="bg-card border-border rounded-lg p-5 border shadow-sm">
            <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
              Popüler Testler
            </h3>
            
            <div className="space-y-3 mb-4">
              {popularTests?.slice(0, 3).map((test, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 p-2 hover:bg-accent/50 rounded-lg cursor-pointer"
                  onClick={() => handleTestClick(test.id)}
                >
                  <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-card-foreground text-sm font-medium truncate">{test.title}</h4>
                    <p className="text-muted-foreground text-xs">{test.playCount || 0} oynama</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setActiveTab("popular")}
              className="w-full"
            >
              Tümünü Gör
            </Button>
          </div>
          
          {/* Featured */}
          <div className="bg-card border-border rounded-lg p-5 border shadow-sm">
            <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-primary" />
              Öne Çıkanlar
            </h3>
            
            <div className="space-y-3 mb-4">
              {featuredTests?.slice(0, 3).map((test, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-2 hover:bg-accent/50 rounded-lg cursor-pointer" 
                  onClick={() => handleTestClick(test.id)}
                >
                  <div 
                    className="w-10 h-10 bg-cover bg-center rounded-md"
                    style={{backgroundImage: `url(${test.imageUrl || '/default-test-thumb.jpg'})`}}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-card-foreground text-sm font-medium truncate">{test.title}</h4>
                    <p className="text-muted-foreground text-xs">{test.likeCount || 0} beğeni</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setActiveTab("featured")}
              className="w-full"
            >
              Tümünü Gör
            </Button>
          </div>
          
          {/* Newest */}
          <div className="bg-card border-border rounded-lg p-5 border shadow-sm">
            <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-500" />
              Son Eklenenler
            </h3>
            
            <div className="space-y-3 mb-4">
              {newestTests?.slice(0, 3).map((test, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-2 hover:bg-accent/50 rounded-lg cursor-pointer"
                  onClick={() => handleTestClick(test.id)}
                >
                  <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-card-foreground text-sm font-medium truncate">{test.title}</h4>
                    <p className="text-muted-foreground text-xs">Yeni eklendi</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setActiveTab("newest")}
              className="w-full"
            >
              Tümünü Gör
            </Button>
          </div>
        </div>
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
