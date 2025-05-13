import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Heart, Trophy, BookOpen, Filter, Clock, Users, Sparkles, Award, ChevronLeft, ChevronRight, Plus, Search, X, Loader2, Layers, Film, Music, Palette, Gamepad2, Dumbbell, FlaskConical, Landmark } from "lucide-react";
import { Test, Category } from "@shared/schema";
import { useLanguage } from "@/lib/LanguageContext";
import { getAllCategories, getPopularTests, getNewestTests, getFeaturedTests, searchTests } from "@/lib/firebaseHelpers";

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

  const handleTestClick = (testId: string) => {
    navigate(`/test/${testId}`);
  };

  return (
    <div className="space-y-12">
      {/* Modern Hero Section */}
      <section className="max-w-content mx-auto mb-12 md:mb-16">
        <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-xl overflow-hidden shadow-lg border border-border/50">
          <div className="p-8 md:p-12">
            <div className="max-w-3xl">
              <Badge className="bg-primary/10 text-primary py-1 px-3 text-xs font-medium mb-4">
                ✨ Görsel Tahmin Platformu
              </Badge>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Görsel tanıma yeteneklerinizi test edin
              </h1>
              
              <p className="text-muted-foreground mb-8 text-lg">
                Pixelhunt'ta resimler kademeli olarak açılır ve doğru cevabı en hızlı şekilde bulmanız gerekir. 
                Kendi testlerinizi oluşturabilir ve arkadaşlarınızla paylaşabilirsiniz.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => navigate("/tests")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                  size="lg"
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  Testleri Keşfet
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate("/create-test")}
                  className="border-border/50 hover:bg-accent/50"
                  size="lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Test Oluştur
                </Button>
              </div>
            </div>
          </div>
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
      
      {/* Game Modes Section */}
      <section className="max-w-content mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Oyun Modları</h2>
          <p className="text-muted-foreground">Farklı oyun modlarında kendinizi test edin</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:shadow-md transition-all duration-300 cursor-pointer" onClick={() => navigate("/game/classic")}>
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-3">
                  <Trophy className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold">Klasik Mod</h3>
              </div>
              <p className="text-sm text-muted-foreground">Resim kademeli olarak açılır. Ne kadar az açılmışken doğru tahmin ederseniz o kadar çok puan kazanırsınız.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 hover:shadow-md transition-all duration-300 cursor-pointer" onClick={() => navigate("/game/speed")}>
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
                  <Clock className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold">Hızlı Mod</h3>
              </div>
              <p className="text-sm text-muted-foreground">Resim otomatik olarak açılmaya devam eder. Ne kadar hızlı doğru tahminde bulunursanız o kadar çok puan kazanırsınız.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 hover:shadow-md transition-all duration-300 cursor-pointer" onClick={() => navigate("/game/time")}>
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                  <Clock className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold">Zamanlı Mod</h3>
              </div>
              <p className="text-sm text-muted-foreground">Belirli bir süre içinde doğru tahmini yapmalısınız. Kalan süre bonus puan olarak eklenir.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 hover:shadow-md transition-all duration-300 cursor-pointer" onClick={() => navigate("/game/test")}>
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
                  <BookOpen className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold">Test Modu</h3>
              </div>
              <p className="text-sm text-muted-foreground">Kullanıcılar tarafından oluşturulan testleri çözün ve puanınızı diğer kullanıcılarla karşılaştırın.</p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Main Content */}
      <section id="featured-tests" className="max-w-content mx-auto">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-xl flex items-center">
                <Filter className="w-5 h-5 mr-2 text-primary" />
                Tüm Testler
              </CardTitle>
              
              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Test ara..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                  />
                </div>
                
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

      {/* Call to Action Section */}
      <section className="max-w-content mx-auto mb-8">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Kendi Testinizi Oluşturun</h2>
                <p className="text-muted-foreground max-w-lg">
                  Kendi görsellerinizi yükleyin, cevapları belirleyin ve arkadaşlarınızla paylaşın. 
                  Yaratıcılığınızı gösterin ve topluluğa katkıda bulunun.
                </p>
              </div>
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => navigate("/create-test")}
              >
                <Plus className="mr-2 h-5 w-5" />
                Test Oluştur
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}