import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Heart, Trophy, BookOpen, Filter, Clock, Users, Sparkles, Award, ChevronLeft, ChevronRight, Plus, Search, X, Loader2, Layers, Film, Music, Palette, Gamepad2, Dumbbell, FlaskConical, Landmark, Eye, PawPrint, Laptop, Smartphone, Server, Atom, Microscope, Pizza, Cake, Leaf, TreeDeciduous, Sun, BookOpenCheck, Star, Globe, Image, Book as BookIcon, Car, Map, Camera, Coffee, MessageSquare } from "lucide-react";
import { Test, Category } from "@shared/schema";
import { useLanguage } from "@/lib/LanguageContext";
import { getAllCategories, getPopularTests, getNewestTests, getFeaturedTests, searchTests } from "@/lib/firebaseHelpers";

import { ContentCard } from "@/components/game/ContentCard";
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
  
  // Fetch categories
  const { data: categoriesData } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => getAllCategories()
  });

  // Fetch popular tests
  const { data: popularTests, isLoading: isPopularTestsLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests/popular"],
    queryFn: () => getPopularTests(10),
    enabled: activeTab === "popular" || activeTab === "featured",
  });

  // Fetch newest tests
  const { data: newestTests, isLoading: isNewestTestsLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests/newest"],
    queryFn: () => getNewestTests(10),
    enabled: activeTab === "newest" || activeTab === "featured",
  });

  // Fetch featured tests
  const { data: featuredTests, isLoading: isFeaturedTestsLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests/featured"],
    queryFn: () => getFeaturedTests(10),
    enabled: activeTab === "featured",
  });
  
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
      const results = await searchTests(searchQuery);
      setSearchResults(results);
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

  // Örnek kategoriler (API'den veri gelmezse kullanılacak)
  const defaultCategories: Array<{id?: string, name: string, iconName?: string}> = [
    { id: "1", name: "Film & TV", iconName: "film" },
    { id: "2", name: "Müzik", iconName: "music" },
    { id: "3", name: "Sanat", iconName: "palette" },
    { id: "4", name: "Oyunlar", iconName: "gamepad-2" },
    { id: "5", name: "Spor", iconName: "dumbbell" },
    { id: "6", name: "Bilim", iconName: "flask-conical" },
  ];

  // Kategorileri API'den veya varsayılan veriden al
  const categories = categoriesData || defaultCategories;

  const handleTestClick = (testId: string) => {
    navigate(`/test/${testId}`);
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
  
  // İkon adına göre ilgili komponenti döndüren yardımcı fonksiyon
  const getCategoryIcon = (iconName: string | null | undefined): React.ReactNode => {
    if (!iconName) return null;
    
    const iconMap: { [key: string]: React.ElementType } = {
      'star': Star,
      'globe': Globe,
      'film': Film,
      'palette': Palette,
      'image': Image,
      'music': Music,
      'book': BookIcon,
      'book-open': BookOpen,
      'car': Car,
      'map': Map,
      'camera': Camera,
      'coffee': Coffee,
      'trophy': Trophy,
      'users': Users,
      'heart': Heart,
      'gamepad-2': Gamepad2,
      'paw-print': PawPrint,
      'laptop': Laptop,
      'smartphone': Smartphone,
      'server': Server,
      'atom': Atom,
      'microscope': Microscope,
      'dumbbell': Dumbbell,
      'pizza': Pizza,
      'cake': Cake,
      'leaf': Leaf,
      'tree': TreeDeciduous,
      'sun': Sun,
      'landmark': Landmark,
      'book-open-check': BookOpenCheck
    };

    const IconComponent = iconMap[iconName];
    if (!IconComponent) return null;
    
    return React.createElement(IconComponent, { className: "w-5 h-5" });
  };

  return (
    <div className="space-y-12">
      {/* Basitleştirilmiş Hero Bölümü */}
      <section className="max-w-content mx-auto mb-12 md:mb-16">
        <div className="bg-card rounded-xl overflow-hidden shadow-lg border border-border/50">
          <div className="flex flex-col md:flex-row">
            {/* Sol taraf - İçerik */}
            <div className="p-6 md:p-8 flex flex-col justify-center w-full md:w-1/2">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-primary/10 text-primary py-1 px-3 text-xs font-medium">
                  ✨ Görsel Tahmin Platformu
                </Badge>
                <div className="h-4 w-px bg-border/50"></div>
                <span className="text-xs text-muted-foreground">Yeni Testler Her Gün</span>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Bilginizi Test Edin, <span className="text-primary">Yeni Testler Keşfedin</span>
              </h1>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Farklı kategorilerdeki görsel tahmin testleriyle kendinizi sınayın ve kendi testlerinizi oluşturarak platformumuza katkıda bulunun.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => navigate("/tests")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Testleri Keşfet
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate("/create-test")}
                  className="border-border/50 hover:bg-accent/50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Test Oluştur
                </Button>
              </div>
            </div>
            
            {/* Sağ taraf - Görsel */}
            <div className="w-full md:w-1/2 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 relative md:h-auto min-h-[200px] md:min-h-0">
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="relative w-full max-w-md">
                  {/* Ana dekoratif element */}
                  <div className="absolute w-48 h-48 bg-primary/20 rounded-full -top-12 -left-12 blur-2xl"></div>
                  <div className="absolute w-48 h-48 bg-primary/10 rounded-full -bottom-12 -right-12 blur-2xl"></div>
                  
                  {/* Test kartları grid */}
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    {featuredTests && featuredTests.slice(0, 4).map((test, idx) => (
                      <div 
                        key={`featured-card-${idx}`}
                        className={`bg-card/90 backdrop-blur-sm shadow-lg border border-border/50 rounded-xl overflow-hidden cursor-pointer transform hover:-translate-y-1 transition-all duration-300 ${idx >= 2 ? 'hidden md:block' : ''}`}
                        onClick={() => navigate(`/test/${test.id}`)}
                        style={{
                          transform: `rotate(${idx % 2 === 0 ? '-2deg' : '2deg'})`,
                          zIndex: idx === 1 ? 2 : 1
                        }}
                      >
                        <div className="aspect-video relative group">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                          <img 
                            src={test.thumbnailUrl || 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500'} 
                            alt={test.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 rounded-full bg-primary"></div>
                              <span className="text-xs font-medium text-white/90">Öne Çıkan</span>
                            </div>
                            <h3 className="text-sm font-medium text-white truncate">{test.title}</h3>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Fallback cards if not enough tests */}
                    {(!featuredTests || featuredTests.length < 2) && (
                      <div 
                        className="bg-primary/10 border border-primary/20 rounded-xl overflow-hidden cursor-pointer flex items-center justify-center p-4 aspect-video backdrop-blur-sm"
                        onClick={() => navigate('/tests')}
                      >
                        <div className="text-center">
                          <Award className="h-8 w-8 mx-auto text-primary mb-2" />
                          <span className="text-sm font-medium text-primary">Testleri Keşfet</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Kategori kartları - daha küçük ve sade */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 mt-8 md:mt-12">
          {categories.slice(0, 6).map((category, index) => (
            <Card 
              key={category.id || index}
              className="group cursor-pointer hover:border-primary/50 transition-all duration-300 overflow-hidden"
              onClick={() => navigate(`/category/${category.id || index + 1}`)}
            >
              <CardContent className="p-3 flex flex-col items-center text-center">
                <div 
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 ${
                    index % 6 === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400" : 
                    index % 6 === 1 ? "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400" : 
                    index % 6 === 2 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" : 
                    index % 6 === 3 ? "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400" : 
                    index % 6 === 4 ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400" : 
                    "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
                  }`}
                >
                  {category.iconName ? getCategoryIcon(category.iconName) : getCategoryEmoji(category.name || "", index)}
                </div>
                <h3 className="text-card-foreground font-medium text-xs sm:text-sm">{category.name}</h3>
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
                      imageUrl={test.thumbnailUrl || 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500'}
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
      <section id="featured-tests" className="max-w-content mx-auto">
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
                  ) : featuredTests && featuredTests.length > 0 ? (
                    featuredTests.map((test) => (
                      <ContentCard
                        key={test.id}
                        title={test.title}
                        imageUrl={test.thumbnailUrl || 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500'}
                        playCount={test.playCount || 0}
                        likeCount={test.likeCount || 0}
                        duration={`${test.questions && Array.isArray(test.questions) ? test.questions.length : 0} ${t('question')}`}
                        onClick={() => handleTestClick(test.id)}
                      />
                    ))
                  ) : (
                    <div className="col-span-5 text-center py-8 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground">Henüz öne çıkan test bulunmuyor.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="popular" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {isPopularTestsLoading ? (
                    Array(10).fill(0).map((_, index) => (
                      <div key={index} className="animate-pulse test-card rounded-xl h-[220px]"></div>
                    ))
                  ) : popularTests && popularTests.length > 0 ? (
                    popularTests.map((test) => (
                      <ContentCard
                        key={test.id}
                        title={test.title}
                        imageUrl={test.thumbnailUrl || 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500'}
                        playCount={test.playCount || 0}
                        likeCount={test.likeCount || 0}
                        duration={`${test.questions && Array.isArray(test.questions) ? test.questions.length : 0} ${t('question')}`}
                        onClick={() => handleTestClick(test.id)}
                      />
                    ))
                  ) : (
                    <div className="col-span-5 text-center py-8 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground">Henüz popüler test bulunmuyor.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="newest" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {isNewestTestsLoading ? (
                    Array(10).fill(0).map((_, index) => (
                      <div key={index} className="animate-pulse test-card rounded-xl h-[220px]"></div>
                    ))
                  ) : newestTests && newestTests.length > 0 ? (
                    newestTests.map((test) => (
                      <ContentCard
                        key={test.id}
                        title={test.title}
                        imageUrl={test.thumbnailUrl || 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500'}
                        playCount={test.playCount || 0}
                        likeCount={test.likeCount || 0}
                        duration={`${test.questions && Array.isArray(test.questions) ? test.questions.length : 0} ${t('question')}`}
                        onClick={() => handleTestClick(test.id)}
                      />
                    ))
                  ) : (
                    <div className="col-span-5 text-center py-8 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground">Henüz yeni test bulunmuyor.</p>
                    </div>
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

      {/* Multiplayer Özellik Tanıtımı */}
      <section className="py-32">
        <div className="max-w-content mx-auto px-4">
          <div className="bg-card rounded-xl overflow-hidden shadow-lg border border-border/50">
            <div className="flex flex-col md:flex-row">
              {/* Sol taraf - İçerik */}
              <div className="p-8 md:p-12 flex flex-col justify-center w-full md:w-1/2">
                <div className="flex items-center gap-2 mb-6">
                  <Badge className="bg-primary/10 text-primary py-1 px-3 text-xs font-medium">
                    <Users className="w-3 h-3 mr-1" />
                    Çok Oyunculu Mod
                  </Badge>
                  <div className="h-4 w-px bg-border/50"></div>
                  <span className="text-xs text-muted-foreground">Arkadaşlarınla Yarış</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Arkadaşlarınla <span className="text-primary">Yarış</span>
                </h2>
                
                <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
                  PixelHunt'un çok oyunculu modu ile arkadaşlarınla aynı anda test çözebilir, 
                  skorlarınızı karşılaştırabilir ve eğlenceli vakit geçirebilirsiniz.
                </p>
                
                <ul className="space-y-6 mb-8">
                  <li className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-base">Özel odalar oluşturun</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-base">Gerçek zamanlı sohbet edin</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-base">Skor tablosunda yarışın</span>
                  </li>
                </ul>
                
                <Button 
                  size="lg"
                  className="w-full md:w-auto"
                  onClick={() => navigate("/rooms")}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Odalara Göz At
                </Button>
              </div>
              
              {/* Sağ taraf - Görsel */}
              <div className="w-full md:w-1/2 ">
                <img 
                  src="/public/gamification-concept-illustration.png" 
                  alt="Multiplayer Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Diğer Bölümler */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Testler</h3>
              <p className="text-muted-foreground">
                Binlerce görsel test arasından seçim yapın
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Yarışmalar</h3>
              <p className="text-muted-foreground">
                Arkadaşlarınızla yarışın ve skorlarınızı karşılaştırın
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Sıralamalar</h3>
              <p className="text-muted-foreground">
                Lider tablosunda yerinizi alın
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}