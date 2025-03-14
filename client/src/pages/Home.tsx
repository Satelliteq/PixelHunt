import React from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Heart, Trophy, BookOpen, Filter, Clock, Users, Sparkles, Award } from "lucide-react";
import { Test } from "@shared/schema";

import ContentCard from "@/components/game/ContentCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [_, navigate] = useLocation();

  // Active tab state
  const [activeTab, setActiveTab] = React.useState("featured");

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
    navigate(`/test/${testId}`);
  };

  return (
    <div className="space-y-10">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/80 to-primary">
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10"></div>
        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:max-w-[60%]">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Görsel Hafıza Testlerine Hoş Geldiniz</h1>
            <p className="text-white/80 mb-5">
              Binlerce ilginç görsel testini keşfedin veya kendi testlerinizi oluşturun.
              Arkadaşlarınızla paylaşın ve sıralamada yerinizi alın.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => navigate("/create-test")}
                className="bg-white text-primary hover:bg-white/90 font-medium"
              >
                <BookOpen className="mr-2 h-4 w-4" /> 
                Test Oluştur
              </Button>
              <Button 
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white/10"
              >
                <Trophy className="mr-2 h-4 w-4" /> 
                Popüler Testler
              </Button>
            </div>
          </div>
          <div className="flex-shrink-0 w-full md:w-[280px] rounded-xl overflow-hidden bg-black/20 backdrop-blur-sm">
            <div className="p-4">
              <h3 className="text-white font-semibold flex items-center">
                <Award className="h-4 w-4 mr-2" /> Haftanın En İyi Testi
              </h3>
              <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-zinc-800">
                {/* Haftanın test görseli */}
                {featuredTests && featuredTests[0] && (
                  <img 
                    src={featuredTests[0].thumbnail || '/default-test-thumb.jpg'} 
                    alt={featuredTests[0].title}
                    className="w-full h-full object-cover" 
                  />
                )}
              </div>
              <div className="mt-3">
                <h4 className="text-white text-sm font-medium">
                  {featuredTests && featuredTests[0] ? featuredTests[0].title : "Test Yükleniyor..."}
                </h4>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center text-xs text-white/60">
                    <Users className="h-3 w-3 mr-1" /> 
                    <span>{featuredTests && featuredTests[0] ? featuredTests[0].playCount : "0"} oyuncu</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-7 text-xs text-white bg-white/10 hover:bg-white/20"
                    onClick={() => featuredTests && featuredTests[0] && handleTestClick(featuredTests[0].id)}
                  >
                    Oyna
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section>
        <Tabs defaultValue="featured" onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-zinc-800/50">
              <TabsTrigger value="featured" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Sparkles className="w-4 h-4 mr-2" />
                Öne Çıkanlar
              </TabsTrigger>
              <TabsTrigger value="popular" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Trophy className="w-4 h-4 mr-2" />
                Popüler
              </TabsTrigger>
              <TabsTrigger value="newest" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Clock className="w-4 h-4 mr-2" />
                Yeni Eklenenler
              </TabsTrigger>
            </TabsList>
            
            <Button variant="outline" size="sm" className="flex items-center gap-2 bg-zinc-800 border-none hover:bg-zinc-700">
              <Filter className="w-4 h-4" />
              <span>Filtrele</span>
            </Button>
          </div>
          
          <TabsContent value="featured" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {isFeaturedTestsLoading ? (
                Array(8).fill(0).map((_, index) => (
                  <div key={index} className="animate-pulse bg-zinc-800 rounded-xl h-[220px]"></div>
                ))
              ) : (
                featuredTests?.map((test) => (
                  <ContentCard
                    key={test.id}
                    title={test.title}
                    imageUrl={test.thumbnail || '/default-test-thumb.jpg'}
                    playCount={test.playCount}
                    likeCount={test.likeCount}
                    duration={`${test.imageIds?.length || 0} soru`}
                    onClick={() => handleTestClick(test.id)}
                  />
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="popular" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {isPopularTestsLoading ? (
                Array(8).fill(0).map((_, index) => (
                  <div key={index} className="animate-pulse bg-zinc-800 rounded-xl h-[220px]"></div>
                ))
              ) : (
                popularTests?.map((test) => (
                  <ContentCard
                    key={test.id}
                    title={test.title}
                    imageUrl={test.thumbnail || '/default-test-thumb.jpg'}
                    playCount={test.playCount}
                    likeCount={test.likeCount}
                    duration={`${test.imageIds?.length || 0} soru`}
                    onClick={() => handleTestClick(test.id)}
                  />
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="newest" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {isNewestTestsLoading ? (
                Array(8).fill(0).map((_, index) => (
                  <div key={index} className="animate-pulse bg-zinc-800 rounded-xl h-[220px]"></div>
                ))
              ) : (
                newestTests?.map((test) => (
                  <ContentCard
                    key={test.id}
                    title={test.title}
                    imageUrl={test.thumbnail || '/default-test-thumb.jpg'}
                    playCount={test.playCount}
                    likeCount={test.likeCount}
                    duration={`${test.imageIds?.length || 0} soru`}
                    onClick={() => handleTestClick(test.id)}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Categories Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <Filter className="w-5 h-5 text-primary mr-2" /> Kategorilere Göre Keşfet
          </h2>
          <Button variant="outline" size="sm" className="text-xs">
            Tüm Kategoriler
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Category cards - hardcoded for now */}
          <div className="bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-xl p-4 text-center cursor-pointer">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-medium">Edebiyat</h3>
            <p className="text-xs text-muted-foreground mt-1">120+ test</p>
          </div>
          
          <div className="bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-xl p-4 text-center cursor-pointer">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl text-white">🌎</span>
            </div>
            <h3 className="font-medium">Coğrafya</h3>
            <p className="text-xs text-muted-foreground mt-1">86 test</p>
          </div>
          
          <div className="bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-xl p-4 text-center cursor-pointer">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl text-white">🎬</span>
            </div>
            <h3 className="font-medium">Film & TV</h3>
            <p className="text-xs text-muted-foreground mt-1">214 test</p>
          </div>
          
          <div className="bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-xl p-4 text-center cursor-pointer">
            <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl text-white">🎨</span>
            </div>
            <h3 className="font-medium">Sanat</h3>
            <p className="text-xs text-muted-foreground mt-1">73 test</p>
          </div>
          
          <div className="bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-xl p-4 text-center cursor-pointer">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl text-white">🎮</span>
            </div>
            <h3 className="font-medium">Oyunlar</h3>
            <p className="text-xs text-muted-foreground mt-1">95 test</p>
          </div>
          
          <div className="bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-xl p-4 text-center cursor-pointer">
            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl text-white">+</span>
            </div>
            <h3 className="font-medium">Daha Fazla</h3>
            <p className="text-xs text-muted-foreground mt-1">300+ test</p>
          </div>
        </div>
      </section>
    </div>
  );
}
