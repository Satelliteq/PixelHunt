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
    <Link href={`/categories/${category.id}`} key={category.id}>
      <a className="block h-full">
        <Card className="overflow-hidden hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
          <CardHeader 
            className={`p-0 h-40 bg-gradient-to-r ${getCategoryGradient(category.name)} flex items-center justify-center`}
          >
            <div className="w-20 h-20 flex items-center justify-center bg-primary/20 rounded-full">
              {category.iconUrl ? (
                <img 
                  src={category.iconUrl} 
                  alt={category.name} 
                  className="w-12 h-12 object-contain"
                />
              ) : (
                getCategoryIcon(category.name)
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow">
            <CardTitle className="text-lg mb-2">{category.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {category.description || `${category.name} kategorisindeki içerikleri keşfedin.`}
            </CardDescription>
          </CardContent>
          <CardFooter className="px-4 py-3 border-t flex justify-between items-center bg-muted/30">
            <Badge variant="outline" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{0} Test</span>
            </Badge>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </a>
    </Link>
  );

  // Category list item component
  const CategoryListItem = ({ category }: { category: Category }) => (
    <Link href={`/categories/${category.id}`} key={category.id}>
      <a className="block">
        <Card className="overflow-hidden hover:bg-muted/20 transition-all">
          <div className="flex items-center p-4">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-r ${getCategoryGradient(category.name)} mr-4`}>
              {category.iconUrl ? (
                <img 
                  src={category.iconUrl} 
                  alt={category.name} 
                  className="w-6 h-6 object-contain"
                />
              ) : (
                React.cloneElement(getCategoryIcon(category.name) as React.ReactElement, { className: "h-6 w-6" })
              )}
            </div>
            <div className="flex-grow">
              <h3 className="font-medium">{category.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {category.description || `${category.name} kategorisindeki içerikleri keşfedin.`}
              </p>
            </div>
            <div className="ml-4 flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{0} Test</span>
              </Badge>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </Card>
      </a>
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
        <TabsList className="mb-6">
          <TabsTrigger value="all">Tüm Kategoriler</TabsTrigger>
          <TabsTrigger value="popular">Popüler</TabsTrigger>
          <TabsTrigger value="newest">Yeni Eklenenler</TabsTrigger>
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