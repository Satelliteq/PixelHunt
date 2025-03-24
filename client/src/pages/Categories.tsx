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
  
  // Custom icon for each category based on name
  const getCategoryIcon = (name: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      "Sanat": <Layers className="h-10 w-10" />,
      "Müzik": <BookOpen className="h-10 w-10" />,
      "Sinema": <BookOpen className="h-10 w-10" />,
      "Spor": <Grid3X3 className="h-10 w-10" />,
      "Tarih": <Layers className="h-10 w-10" />,
      "Bilim": <BookOpen className="h-10 w-10" />,
    };
    
    for (const key in icons) {
      if (name.toLowerCase().includes(key.toLowerCase())) {
        return icons[key];
      }
    }
    
    return <Grid3X3 className="h-10 w-10" />;
  };

  // Get background gradient based on category name
  const getCategoryGradient = (name: string) => {
    const gradients: { [key: string]: string } = {
      "Sanat": "from-blue-500/30 to-blue-600/10",
      "Müzik": "from-purple-500/30 to-purple-600/10",
      "Sinema": "from-red-500/30 to-red-600/10",
      "Spor": "from-green-500/30 to-green-600/10",
      "Tarih": "from-amber-500/30 to-amber-600/10",
      "Bilim": "from-indigo-500/30 to-indigo-600/10",
    };
    
    for (const key in gradients) {
      if (name.toLowerCase().includes(key.toLowerCase())) {
        return gradients[key];
      }
    }
    
    return "from-primary/30 to-primary/10";
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

  // Category card component
  const CategoryCard = ({ category }: { category: Category }) => (
    <Link href={`/categories/${category.id}`}>
      <div className="custom-frame hover:bg-[hsl(var(--frame-hover))] transition-colors rounded-xl p-4 text-center cursor-pointer">
        <div 
          className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3`}
          style={{ 
            backgroundColor: category.color || '#6366f1',
            background: category.backgroundColor ? `linear-gradient(135deg, ${category.color || '#6366f1'}, ${category.backgroundColor})` : undefined
          }}
        >
          {category.iconUrl ? (
            <img 
              src={category.iconUrl} 
              alt={category.name} 
              className="w-6 h-6 object-contain"
            />
          ) : category.iconName ? (
            <span className="text-xl text-white">{category.iconName}</span>
          ) : (
            React.cloneElement(getCategoryIcon(category.name) as React.ReactElement, { className: "h-6 w-6 text-white" })
          )}
        </div>
        <h3 className="font-medium">{category.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">0+ test</p>
      </div>
    </Link>
  );

  // Category list item component
  const CategoryListItem = ({ category }: { category: Category }) => (
    <Link href={`/categories/${category.id}`}>
      <div className="custom-frame hover:bg-[hsl(var(--frame-hover))] transition-colors rounded-xl p-4 flex items-center cursor-pointer">
        <div 
          className={`w-12 h-12 rounded-full flex items-center justify-center mr-4`}
          style={{ 
            backgroundColor: category.color || '#6366f1',
            background: category.backgroundColor ? `linear-gradient(135deg, ${category.color || '#6366f1'}, ${category.backgroundColor})` : undefined
          }}
        >
          {category.iconUrl ? (
            <img 
              src={category.iconUrl} 
              alt={category.name} 
              className="w-6 h-6 object-contain"
            />
          ) : category.iconName ? (
            <span className="text-xl text-white">{category.iconName}</span>
          ) : (
            React.cloneElement(getCategoryIcon(category.name) as React.ReactElement, { className: "h-6 w-6 text-white" })
          )}
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
      </div>
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
                {filteredCategories.map((category: Category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCategories.map((category: Category) => (
                  <CategoryListItem key={category.id} category={category} />
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
                  ? categories.slice(0, 5).map((category: Category) => (
                      <CategoryCard key={category.id} category={category} />
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
                  ? [...categories].slice(-5).reverse().map((category: Category) => (
                      <CategoryCard key={category.id} category={category} />
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