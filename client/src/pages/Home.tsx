import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Heart, Trophy, BookOpen, Filter, Clock, Users, Sparkles, Award, ChevronLeft, ChevronRight, Plus, Search, X, Loader2, Layers } from "lucide-react";
import { Test, Category } from "@shared/schema";
import { useLanguage } from "@/lib/LanguageContext";

import ContentCard from "@/components/game/ContentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  
  // Kategori adına göre emoji döndüren yardımcı fonksiyon
  const getCategoryEmoji = (categoryName: string, index: number): string => {
    const name = categoryName.toLowerCase();
    
    if (name.includes("film") || name.includes("tv") || name.includes("dizi")) return "🎬";
    if (name.includes("oyun") || name.includes("game")) return "🎮";
    if (name.includes("müzik") || name.includes("music")) return "🎵";
    if (name.includes("sanat") || name.includes("art")) return "🎨";
    if (name.includes("spor") || name.includes("sport")) return "⚽";
    if (name.includes("bilim") || name.includes("science")) return "🧪";
    if (name.includes("tarih") || name.includes("history")) return "📜";
    if (name.includes("coğrafya") || name.includes("geography")) return "🌍";
    if (name.includes("yemek") || name.includes("food")) return "🍕";
    if (name.includes("hayvan") || name.includes("animal")) return "🐱";
    if (name.includes("eğitim") || name.includes("education")) return "📚";
    
    // Varsayılan emojiler
    const defaultEmojis = ["🔍", "💡", "🎯", "📊", "🔮", "🌟", "💎"];
    return defaultEmojis[index % defaultEmojis.length];
  };

  // Helper functions were refactored directly into the component rendering

  return (
    <div className="space-y-12">
      {/* Hero Section with theme aware styling */}
      <section className="max-w-content mx-auto">
        {/* Hero banner with theme-aware styling */}
        <div className="relative w-full bg-card rounded-lg mb-8 border">
          <div className="flex flex-col md:flex-row items-center overflow-hidden">
            {/* Left side content */}
            <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center z-10">
              <div className="inline-block mb-4">
                <Badge className="bg-primary text-primary-foreground py-1 px-4 text-sm font-bold">
                  ✨ Pixel Hunt
                </Badge>
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
            
            {/* Right side illustration - Simple Yellow Pixel Design */}
            <div className="w-full md:w-1/2 h-[260px] md:h-[320px] relative hero-card-container">
              {/* Decorative elements */}
              <div className="absolute top-0 right-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
              <div className="absolute bottom-10 left-0 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
              
              {/* Single yellow design */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[280px] h-[280px]">
                  {/* Main yellow circle */}
                  <div className="absolute inset-0 bg-primary rounded-full"></div>
                  
                  {/* Inner circle */}
                  <div className="absolute inset-[40px] bg-primary-foreground rounded-full flex items-center justify-center">
                    {/* Pixel hunt logo or text */}
                    <div className="text-primary font-bold text-4xl">PH</div>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute top-[20px] right-[20px] w-[30px] h-[30px] bg-primary-foreground rounded-full"></div>
                  <div className="absolute bottom-[40px] left-[30px] w-[20px] h-[20px] bg-primary-foreground rounded-full"></div>
                  <div className="absolute top-[100px] left-[10px] w-[15px] h-[15px] bg-primary-foreground rounded-full"></div>
                  
                  {/* Rays or pixel elements */}
                  <div className="absolute top-[-30px] left-[120px] w-[40px] h-[100px] bg-primary-foreground/20 rotate-45 rounded-lg"></div>
                  <div className="absolute bottom-[-30px] right-[120px] w-[40px] h-[100px] bg-primary-foreground/20 rotate-45 rounded-lg"></div>
                  <div className="absolute left-[-30px] top-[120px] w-[100px] h-[40px] bg-primary-foreground/20 rotate-45 rounded-lg"></div>
                  <div className="absolute right-[-30px] bottom-[120px] w-[100px] h-[40px] bg-primary-foreground/20 rotate-45 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Kategori kartları - düzenlenmiş hali */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {categories.slice(0, 6).map((category, index) => (
            <Card 
              key={category.id || index}
              className="group cursor-pointer hover:border-primary/50 transition-all duration-300 overflow-hidden"
              onClick={() => navigate(`/category/${category.id || index + 1}`)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-3 mt-2 ${
                  index % 6 === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400" : 
                  index % 6 === 1 ? "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400" : 
                  index % 6 === 2 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" : 
                  index % 6 === 3 ? "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400" : 
                  index % 6 === 4 ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400" : 
                  "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
                }`}>
                  {getCategoryEmoji(category.name || "", index)}
                </div>
                <h3 className="text-card-foreground font-medium text-sm">{category.name}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
        

      </section>

      {/* Search Results (hidden by default, shown when search is activated) */}
      {showSearchResults && (
        <section className="max-w-content mx-auto mb-8">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Search className="w-5 h-5 mr-2 text-primary" />
                Arama Sonuçları
                {searchResults.length > 0 && <span className="text-sm ml-2 text-muted-foreground">({searchResults.length} sonuç)</span>}
              </CardTitle>
              {searchQuery && <CardDescription>"{searchQuery}" için sonuçlar gösteriliyor</CardDescription>}
            </CardHeader>
            
            <CardContent>
              {isSearching ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
            </CardContent>
            
            {searchResults.length > 0 && (
              <CardFooter className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSearchResults(false)}
                >
                  Sonuçları Kapat
                </Button>
              </CardFooter>
            )}
          </Card>
        </section>
      )}
      
      {/* Main Content */}
      <section className="max-w-content mx-auto">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-xl flex items-center">
                <Filter className="w-5 h-5 mr-2 text-primary" />
                Tüm Testler
              </CardTitle>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 text-xs self-end sm:self-auto"
                onClick={() => navigate("/tests")}
              >
                <Filter className="w-4 h-4" />
                <span>{t('allTests')}</span>
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="featured" onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 custom-tab-bg">
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
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => navigate("/tests")}
            >
              Tüm Testleri Gör
            </Button>
          </CardFooter>
        </Card>
      </section>

      {/* Categories Section */}
      <section className="max-w-content mx-auto">
        <Card className="border shadow-sm mb-8">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-xl flex items-center">
                <Layers className="w-5 h-5 mr-2 text-primary" /> {t('discoverByCategory')}
              </CardTitle>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs self-end sm:self-auto"
                onClick={() => navigate("/categories")}
              >
                {t('allCategories')}
              </Button>
            </div>
            <CardDescription>
              Farklı kategorilerdeki içerikleri keşfedin
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Category cards - Featured categories */}
              <Card
                className="hover:border-primary/50 transition-colors p-4 text-center cursor-pointer border shadow-sm"
                onClick={() => navigate("/categories")}
              >
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-medium">{t('catLiterature')}</h3>
                <p className="text-xs text-muted-foreground mt-1">120+ {t('tests').toLowerCase()}</p>
              </Card>
              
              <Card
                className="hover:border-primary/50 transition-colors p-4 text-center cursor-pointer border shadow-sm"
                onClick={() => navigate("/categories")}
              >
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl text-white">🌎</span>
                </div>
                <h3 className="font-medium">{t('catGeography')}</h3>
                <p className="text-xs text-muted-foreground mt-1">86 {t('tests').toLowerCase()}</p>
              </Card>
              
              <Card
                className="hover:border-primary/50 transition-colors p-4 text-center cursor-pointer border shadow-sm"
                onClick={() => navigate("/categories")}
              >
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl text-white">🎬</span>
                </div>
                <h3 className="font-medium">{t('catFilmTV')}</h3>
                <p className="text-xs text-muted-foreground mt-1">214 {t('tests').toLowerCase()}</p>
              </Card>
              
              <Card
                className="hover:border-primary/50 transition-colors p-4 text-center cursor-pointer border shadow-sm"
                onClick={() => navigate("/categories")}
              >
                <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl text-white">🎨</span>
                </div>
                <h3 className="font-medium">{t('catArt')}</h3>
                <p className="text-xs text-muted-foreground mt-1">73 {t('tests').toLowerCase()}</p>
              </Card>
              
              <Card
                className="hover:border-primary/50 transition-colors p-4 text-center cursor-pointer border shadow-sm"
                onClick={() => navigate("/categories")}
              >
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl text-white">🎮</span>
                </div>
                <h3 className="font-medium">{t('catGames')}</h3>
                <p className="text-xs text-muted-foreground mt-1">95 {t('tests').toLowerCase()}</p>
              </Card>
              
              <Card
                className="hover:border-primary/50 transition-colors p-4 text-center cursor-pointer border shadow-sm"
                onClick={() => navigate("/categories")}
              >
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl text-white">+</span>
                </div>
                <h3 className="font-medium">{t('catMore')}</h3>
                <p className="text-xs text-muted-foreground mt-1">300+ {t('tests').toLowerCase()}</p>
              </Card>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate("/categories")}>
              Tüm Kategorileri Görüntüle
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}
