import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, Grid3X3, Layers, BookOpen, ChevronRight, Eye } from "lucide-react";
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
        <Card key={i} className="overflow-hidden animate-pulse">
          <CardHeader className="bg-muted h-32"></CardHeader>
          <CardContent className="p-4">
            <div className="h-5 bg-muted rounded-md mb-3"></div>
            <div className="h-4 bg-muted rounded-md mb-2 w-3/4"></div>
            <div className="h-4 bg-muted rounded-md w-1/2"></div>
          </CardContent>
          <CardFooter className="px-4 py-3 border-t flex justify-between bg-muted/30">
            <div className="h-4 bg-muted rounded-md w-1/4"></div>
            <div className="h-4 bg-muted rounded-md w-1/4"></div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  // Category card component
  const CategoryCard = ({ category }: { category: Category }) => (
    <Link href={`/categories/${category.id}`}>
      <div className="custom-frame hover:bg-[hsl(var(--frame-hover))] transition-colors rounded-xl p-4 text-center cursor-pointer">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
          {category.iconUrl ? (
            <img 
              src={category.iconUrl} 
              alt={category.name} 
              className="w-6 h-6 object-contain"
            />
          ) : (
            React.cloneElement(getCategoryIcon(category.name) as React.ReactElement, { className: "h-6 w-6 text-white" })
          )}
        </div>
        <h3 className="font-medium">{category.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">{category.testCount || 0}+ test</p>
      </div>
    </Link>
  );

  // Category list item component
  const CategoryListItem = ({ category }: { category: Category }) => (
    <Link href={`/categories/${category.id}`}>
      <div className="custom-frame hover:bg-[hsl(var(--frame-hover))] transition-colors rounded-xl p-4 flex items-center cursor-pointer">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
          {category.iconUrl ? (
            <img 
              src={category.iconUrl} 
              alt={category.name} 
              className="w-6 h-6 object-contain"
            />
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
            <span>{category.testCount || 0} Test</span>
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );

  return (
    <main className="max-w-content py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Kategoriler</h1>
        <p className="text-muted-foreground">
          Farklı kategorilerde binlerce görsel ve testi keşfedin.
        </p>
      </div>
      
      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="mb-6 custom-tab-bg rounded-xl p-1 flex bg-opacity-50">
          <TabsTrigger value="all" className="data-[state=active]:bg-background rounded-lg text-sm px-4">Tüm Kategoriler</TabsTrigger>
          <TabsTrigger value="popular" className="data-[state=active]:bg-background rounded-lg text-sm px-4">Popüler</TabsTrigger>
          <TabsTrigger value="newest" className="data-[state=active]:bg-background rounded-lg text-sm px-4">Yeni Eklenenler</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="flex items-center justify-between gap-4 mb-6">
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
          
          {isLoading ? (
            <LoadingCards />
          ) : filteredCategories.length === 0 ? (
            <div className="text-center p-12 bg-muted/30 rounded-lg">
              <h3 className="text-xl font-medium mb-2">Arama kriterinizle eşleşen kategori bulunamadı</h3>
              <p className="text-muted-foreground mb-4">Lütfen farklı anahtar kelimelerle tekrar deneyin</p>
              <Button onClick={() => setSearchTerm("")}>Aramayı Temizle</Button>
            </div>
          ) : activeView === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
        
        <TabsContent value="popular">
          {isLoading ? (
            <LoadingCards />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.length > 0 
                ? categories.slice(0, 5).map((category: Category) => (
                    <CategoryCard key={category.id} category={category} />
                  ))
                : (
                  <div className="col-span-3 text-center p-12 bg-muted/30 rounded-lg">
                    <h3 className="text-xl font-medium mb-2">Henüz kategori bulunmuyor</h3>
                    <p className="text-muted-foreground">Daha sonra tekrar kontrol edin</p>
                  </div>
                )
              }
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="newest">
          {isLoading ? (
            <LoadingCards />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.length > 0 
                ? [...categories].slice(-5).reverse().map((category: Category) => (
                    <CategoryCard key={category.id} category={category} />
                  ))
                : (
                  <div className="col-span-3 text-center p-12 bg-muted/30 rounded-lg">
                    <h3 className="text-xl font-medium mb-2">Henüz kategori bulunmuyor</h3>
                    <p className="text-muted-foreground">Daha sonra tekrar kontrol edin</p>
                  </div>
                )
              }
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}