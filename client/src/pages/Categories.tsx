import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Search, Grid3X3, Layers, BookOpen, ChevronRight, Eye, Trophy, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Category } from "@shared/schema";

export default function Categories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<"grid" | "list">("grid");
  
  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories']
  });
  
  // Filter categories based on search term
  const filteredCategories = categories.filter((category: Category) => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Kategori adına göre emoji döndüren yardımcı fonksiyon
  const getCategoryEmoji = (categoryName: string, index: number): string => {
    const name = categoryName.toLowerCase();
    
    if (name.includes("film") || name.includes("tv") || name.includes("dizi") || name.includes("sinema")) return "🎬";
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
    if (name.includes("edebiyat") || name.includes("literature")) return "📖";
    if (name.includes("teknoloji") || name.includes("technology")) return "💻";
    
    // Varsayılan emojiler
    const defaultEmojis = ["🔍", "💡", "🎯", "📊", "🔮", "🌟", "💎"];
    return defaultEmojis[index % defaultEmojis.length];
  };

  // Loading state for cards
  const LoadingCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="custom-frame rounded-xl p-4 text-center animate-pulse">
          <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-3"></div>
          <div className="h-5 bg-muted rounded-md w-24 mx-auto mb-2"></div>
          <div className="h-3 bg-muted rounded-md w-16 mx-auto"></div>
        </div>
      ))}
    </div>
  );

  // İyileştirilmiş kategori kartı bileşeni
  const CategoryCard = ({ category, index = 0 }: { category: Category, index?: number }) => (
    <Link href={`/category/${category.id}`}>
      <Card className="cursor-pointer hover:border-primary/50 transition-all duration-300 overflow-hidden">
        <CardContent className="p-4 flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-3 mt-2 ${
            index % 6 === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400" : 
            index % 6 === 1 ? "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400" : 
            index % 6 === 2 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" : 
            index % 6 === 3 ? "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400" : 
            index % 6 === 4 ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400" : 
            "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
          }`}>
            {getCategoryEmoji(category.name, index)}
          </div>
          <h3 className="text-card-foreground font-medium text-sm">{category.name}</h3>
        </CardContent>
      </Card>
    </Link>
  );

  // İyileştirilmiş liste görünümü bileşeni
  const CategoryListItem = ({ category, index = 0 }: { category: Category, index?: number }) => (
    <Link href={`/category/${category.id}`}>
      <Card className="cursor-pointer hover:border-primary/50 transition-all duration-300 overflow-hidden">
        <CardContent className="p-4 flex items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mr-4 ${
            index % 6 === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400" : 
            index % 6 === 1 ? "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400" : 
            index % 6 === 2 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" : 
            index % 6 === 3 ? "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400" : 
            index % 6 === 4 ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400" : 
            "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
          }`}>
            {getCategoryEmoji(category.name, index)}
          </div>
          <div className="flex-grow">
            <h3 className="font-medium">{category.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {category.description || `${category.name} kategorisindeki içerikleri keşfedin.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>0 Test</span>
            </Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="space-y-12">
      {/* Header section */}
      <section className="max-w-content mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Kategoriler</h1>
          <p className="text-muted-foreground">
            Farklı kategorilerde binlerce görsel ve testi keşfedin.
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
                Tüm Kategoriler
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

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Kategori ara..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="inline-flex items-center rounded-md border border-border p-1">
                <Button
                  variant={activeView === "grid" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setActiveView("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={activeView === "list" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setActiveView("list")}
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <TabsContent value="all" className="mt-0">
            {isLoading ? (
              <LoadingCards />
            ) : filteredCategories.length === 0 ? (
              <div className="text-center p-12 bg-muted/30 rounded-lg">
                <h3 className="text-xl font-medium mb-2">Arama kriterinizle eşleşen kategori bulunamadı</h3>
                <p className="text-muted-foreground mb-4">Lütfen farklı anahtar kelimelerle tekrar deneyin</p>
                <Button onClick={() => setSearchTerm("")}>Aramayı Temizle</Button>
              </div>
            ) : activeView === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredCategories.map((category: Category, index) => (
                  <CategoryCard key={category.id} category={category} index={index} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCategories.map((category: Category, index) => (
                  <CategoryListItem key={category.id} category={category} index={index} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="popular" className="mt-0">
            {isLoading ? (
              <LoadingCards />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {categories.length > 0 
                  ? categories.slice(0, 6).map((category: Category, index) => (
                      <CategoryCard key={category.id} category={category} index={index} />
                    ))
                  : (
                    <div className="col-span-6 text-center p-12 bg-muted/30 rounded-lg">
                      <h3 className="text-xl font-medium mb-2">Henüz kategori bulunmuyor</h3>
                      <p className="text-muted-foreground">Daha sonra tekrar kontrol edin</p>
                    </div>
                  )
                }
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="newest" className="mt-0">
            {isLoading ? (
              <LoadingCards />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {categories.length > 0 
                  ? [...categories].slice(-6).reverse().map((category: Category, index) => (
                      <CategoryCard key={category.id} category={category} index={index} />
                    ))
                  : (
                    <div className="col-span-6 text-center p-12 bg-muted/30 rounded-lg">
                      <h3 className="text-xl font-medium mb-2">Henüz kategori bulunmuyor</h3>
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