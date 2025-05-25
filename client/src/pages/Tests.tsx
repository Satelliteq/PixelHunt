import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Filter, Search, Grid, ChevronRight, Star, Clock, TrendingUp, Calendar, Sparkles, Trophy, Users, Heart, Layers } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Test } from "@shared/schema";
import { getDifficultyText } from "@/lib/gameHelpers";
import { ContentCard } from "@/components/game/ContentCard";
import { getAllTests, getPopularTests, getNewestTests, getFeaturedTests, getAllCategories } from "@/lib/firebaseHelpers";

export default function Tests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<"grid" | "list">("grid");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("newest");
  
  // Fetch tests data
  const { data: tests = [], isLoading: testsLoading } = useQuery<Test[]>({
    queryKey: ['/api/tests'],
    queryFn: () => getAllTests()
  });
  
  // Fetch categories for filter
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: ['/api/categories'],
    queryFn: () => getAllCategories()
  });
  
  // Filter tests based on search term and other filters
  const filteredTests = tests.filter((test: Test) => {
    // Search filter
    const matchesSearch = 
      test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (test.description ? test.description.toLowerCase().includes(searchTerm.toLowerCase()) : false);
    
    // Category filter
    const matchesCategory = categoryFilter === "all" || (test.categoryId ? test.categoryId.toString() === categoryFilter : false);
    
    // Difficulty filter is no longer needed since we removed difficulty
    const matchesDifficulty = true;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });
  
  // Sort tests based on selected order
  const sortedTests = [...filteredTests].sort((a: Test, b: Test) => {
    switch (sortOrder) {
      case "newest":
        return (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      case "oldest":
        return (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      case "popular":
        return (b.playCount || 0) - (a.playCount || 0);
      default:
        return 0;
    }
  });

  // Tabs content: popular, newest, featured
  const { data: popularTests = [], isLoading: popularLoading } = useQuery<Test[]>({
    queryKey: ['/api/tests/popular'],
    queryFn: () => getPopularTests(10)
  });
  
  const { data: newestTests = [], isLoading: newestLoading } = useQuery<Test[]>({
    queryKey: ['/api/tests/newest'],
    queryFn: () => getNewestTests(10)
  });
  
  const { data: featuredTests = [], isLoading: featuredLoading } = useQuery<Test[]>({
    queryKey: ['/api/tests/featured'],
    queryFn: () => getFeaturedTests(10)
  });

  // Date formatter helper
  const formatDate = (dateString: string | null | Date) => {
    if (!dateString) return "-";
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('tr-TR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  // Test card component
  const TestCard = ({ test }: { test: Test }) => (
    <Link to={`/test/${test.id}`}>
      <div className="custom-frame hover:bg-[hsl(var(--frame-hover))] transition-colors rounded-xl p-5 cursor-pointer">
        <div className="mb-4 flex justify-between items-start">
          <div className="flex gap-3 items-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white">
              <span className="text-lg font-bold">
                {test.title.split(' ').map(word => word[0]).join('').substring(0, 2)}
              </span>
            </div>
            <div>
              <h3 className="font-medium">{test.title}</h3>
              <p className="text-xs text-muted-foreground">
                {formatDate(test.createdAt)}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {getQuestionCount(test.questions)} Soru
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {test.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>{test.playCount || 0} Oynanma</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Star className="h-3 w-3 mr-1" />
              <span>{test.likeCount || 0} Beğeni</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Link>
  );

  // Test list item component
  const TestListItem = ({ test }: { test: Test }) => (
    <Link to={`/test/${test.id}`}>
      <div className="custom-frame hover:bg-[hsl(var(--frame-hover))] transition-colors rounded-xl p-4 flex items-center cursor-pointer">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4 text-white">
          <span className="text-lg font-bold">
            {test.title.split(' ').map(word => word[0]).join('').substring(0, 2)}
          </span>
        </div>
        <div className="flex-grow mr-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium">{test.title}</h3>
            <Badge variant="secondary" className="text-xs">
              {getQuestionCount(test.questions)} Soru
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {test.description}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>{test.playCount || 0} Oynanma</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Star className="h-3 w-3 mr-1" />
              <span>{test.likeCount || 0} Beğeni</span>
            </div>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{formatDate(test.createdAt)}</span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
      </div>
    </Link>
  );

  // Loading state for cards
  const LoadingCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="custom-frame rounded-xl p-5 animate-pulse">
          <div className="mb-4 flex justify-between items-start">
            <div className="flex gap-3 items-center">
              <div className="w-12 h-12 bg-muted rounded-full"></div>
              <div>
                <div className="h-5 bg-muted rounded-md w-24 mb-2"></div>
                <div className="h-3 bg-muted rounded-md w-16"></div>
              </div>
            </div>
            <div className="h-5 bg-muted rounded-full w-16"></div>
          </div>
          
          <div className="h-4 bg-muted rounded-md mb-2 w-full"></div>
          <div className="h-4 bg-muted rounded-md mb-4 w-3/4"></div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 bg-muted rounded-md w-16"></div>
              <div className="h-3 bg-muted rounded-md w-16"></div>
            </div>
            <div className="h-7 w-7 bg-muted rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Helper function to get the number of questions from questions array
  const getQuestionCount = (questions: unknown): number => {
    if (Array.isArray(questions)) {
      return questions.length;
    }
    return 0;
  };

  // Handle test click
  const [_, navigate] = useLocation();
  const handleTestClick = (testId: string) => {
    navigate(`/test/${testId}`);
  };

  return (
    <div className="space-y-12">
      {/* Header section */}
      <section className="max-w-content mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Testler</h1>
          <p className="text-muted-foreground">
            Oluşturulan testlere göz atın, zekânızı ve görsel hafızanızı test edin.
          </p>
        </div>
      </section>
      
      {/* Main content */}
      <section className="max-w-content mx-auto">
        <Tabs defaultValue="all" onValueChange={(value) => {}} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <TabsList className="custom-tab-bg">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Layers className="w-4 h-4 mr-2" />
                Tüm Testler
              </TabsTrigger>
              <TabsTrigger value="popular" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Trophy className="w-4 h-4 mr-2" />
                Popüler
              </TabsTrigger>
              <TabsTrigger value="newest" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Clock className="w-4 h-4 mr-2" />
                Yeni Eklenenler
              </TabsTrigger>
              <TabsTrigger value="featured" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Sparkles className="w-4 h-4 mr-2" />
                Öne Çıkanlar
              </TabsTrigger>
            </TabsList>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Test ara..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Button variant="outline" size="sm" className="flex items-center gap-2 custom-frame border-none hover:custom-frame">
                <Filter className="w-4 h-4" />
                <span>Filtrele</span>
              </Button>
            </div>
          </div>
          
          <TabsContent value="all" className="mt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Kategoriler</SelectItem>
                    {categories.length > 0 ? categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    )) : null}
                  </SelectContent>
                </Select>
                

                
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sıralama" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">En Yeni</SelectItem>
                    <SelectItem value="oldest">En Eski</SelectItem>
                    <SelectItem value="popular">En Popüler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="inline-flex items-center rounded-md border border-border p-1">
                <Button
                  variant={activeView === "grid" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setActiveView("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={activeView === "list" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setActiveView("list")}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {testsLoading ? (
              <LoadingCards />
            ) : sortedTests.length === 0 ? (
              <div className="text-center p-12 bg-muted/30 rounded-lg">
                <h3 className="text-xl font-medium mb-2">Arama kriterinizle eşleşen test bulunamadı</h3>
                <p className="text-muted-foreground mb-4">Lütfen farklı filtreler veya anahtar kelimelerle tekrar deneyin</p>
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("all");
                    setDifficultyFilter("all");
                    setSortOrder("newest");
                  }}
                >
                  Filtreleri Temizle
                </Button>
              </div>
            ) : activeView === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {sortedTests.map((test: Test) => (
                  <ContentCard
                    key={test.id}
                    title={test.title}
                    imageUrl={test.thumbnailUrl || '/default-test-thumb.jpg'}
                    playCount={test.playCount}
                    likeCount={test.likeCount}
                    duration={`${getQuestionCount(test.questions)} soru`}
                    onClick={() => handleTestClick(test.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {sortedTests.map((test: Test) => (
                  <TestListItem key={test.id} test={test} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="popular" className="mt-0">
            {popularLoading ? (
              <LoadingCards />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {popularTests.length > 0 
                  ? popularTests.map((test: Test) => (
                      <ContentCard
                        key={test.id}
                        title={test.title}
                        imageUrl={test.thumbnailUrl || '/default-test-thumb.jpg'}
                        playCount={test.playCount}
                        likeCount={test.likeCount}
                        duration={`${getQuestionCount(test.questions)} soru`}
                        onClick={() => handleTestClick(test.id)}
                      />
                    ))
                  : (
                    <div className="col-span-5 text-center p-12 bg-muted/30 rounded-lg">
                      <h3 className="text-xl font-medium mb-2">Henüz test bulunmuyor</h3>
                      <p className="text-muted-foreground">Daha sonra tekrar kontrol edin</p>
                    </div>
                  )
                }
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="newest" className="mt-0">
            {newestLoading ? (
              <LoadingCards />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {newestTests.length > 0 
                  ? newestTests.map((test: Test) => (
                      <ContentCard
                        key={test.id}
                        title={test.title}
                        imageUrl={test.thumbnailUrl || '/default-test-thumb.jpg'}
                        playCount={test.playCount}
                        likeCount={test.likeCount}
                        duration={`${getQuestionCount(test.questions)} soru`}
                        onClick={() => handleTestClick(test.id)}
                      />
                    ))
                  : (
                    <div className="col-span-5 text-center p-12 bg-muted/30 rounded-lg">
                      <h3 className="text-xl font-medium mb-2">Henüz test bulunmuyor</h3>
                      <p className="text-muted-foreground">Daha sonra tekrar kontrol edin</p>
                    </div>
                  )
                }
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="featured" className="mt-0">
            {featuredLoading ? (
              <LoadingCards />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {featuredTests.length > 0 
                  ? featuredTests.map((test: Test) => (
                      <ContentCard
                        key={test.id}
                        title={test.title}
                        imageUrl={test.thumbnailUrl || '/default-test-thumb.jpg'}
                        playCount={test.playCount}
                        likeCount={test.likeCount}
                        duration={`${getQuestionCount(test.questions)} soru`}
                        onClick={() => handleTestClick(test.id)}
                      />
                    ))
                  : (
                    <div className="col-span-5 text-center p-12 bg-muted/30 rounded-lg">
                      <h3 className="text-xl font-medium mb-2">Henüz öne çıkan test bulunmuyor</h3>
                      <p className="text-muted-foreground">Daha sonra tekrar kontrol edin</p>
                    </div>
                  )
                }
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}