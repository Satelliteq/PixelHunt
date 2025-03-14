import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Grid, Filter, Search, ChevronRight } from "lucide-react";
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
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['/api/categories'],
    suspense: false,
  });

  // Filter categories based on search term
  const filteredCategories = categories?.filter((category: Category) => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <main className="max-w-content py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Kategoriler</h1>
        <p className="text-muted-foreground">
          İlgi alanlarınıza göre testleri keşfedin veya benzer içeriklerle kategorilere göz atın.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
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
        
        <div className="flex items-center gap-2">
          <Tabs defaultValue="all" className="w-[200px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">Tümü</TabsTrigger>
              <TabsTrigger value="popular">Popüler</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="inline-flex items-center rounded-md border border-border p-1 ml-2">
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
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <CardHeader className="bg-muted h-28"></CardHeader>
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded-md mb-3"></div>
                <div className="h-3 bg-muted rounded-md mb-2 w-3/4"></div>
                <div className="h-3 bg-muted rounded-md w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center p-12 bg-muted/30 rounded-lg">
          <h3 className="text-xl font-medium mb-2">Kategoriler yüklenirken bir hata oluştu</h3>
          <p className="text-muted-foreground mb-4">Lütfen daha sonra tekrar deneyin</p>
          <Button onClick={() => window.location.reload()}>Yenile</Button>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center p-12 bg-muted/30 rounded-lg">
          <h3 className="text-xl font-medium mb-2">Arama kriterinizle eşleşen kategori bulunamadı</h3>
          <p className="text-muted-foreground mb-4">Lütfen farklı anahtar kelimelerle tekrar deneyin</p>
          <Button onClick={() => setSearchTerm("")}>Filtrelerı Temizle</Button>
        </div>
      ) : activeView === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((category: Category) => (
            <Link href={`/categories/${category.id}`} key={category.id}>
              <a className="block h-full">
                <Card className="overflow-hidden hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
                  <CardHeader 
                    className="p-0 h-32 bg-gradient-to-r from-primary/30 to-primary/10 flex items-center justify-center"
                  >
                    <div className="w-16 h-16 flex items-center justify-center bg-primary/10 rounded-full">
                      <span className="text-2xl font-bold text-primary-foreground">{category.name.charAt(0)}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-grow">
                    <CardTitle className="text-lg mb-2">{category.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {category.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="px-4 py-3 border-t flex justify-between items-center bg-muted/30">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>{category.testCount || 0} test</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCategories.map((category: Category) => (
            <Link href={`/categories/${category.id}`} key={category.id}>
              <a className="block">
                <Card>
                  <div className="flex items-center p-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full mr-4">
                      <span className="text-xl font-bold text-primary-foreground">{category.name.charAt(0)}</span>
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium">{category.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{category.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{category.testCount || 0} test</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      )}
      
      <Separator className="my-8" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Popüler Kategoriler</h2>
          <div className="space-y-3">
            {categories?.slice(0, 5).map((category: Category) => (
              <Link href={`/categories/${category.id}`} key={`popular-${category.id}`}>
                <a className="flex items-center gap-3 p-3 hover:bg-muted rounded-md transition-colors">
                  <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full">
                    <span className="text-sm font-bold text-primary-foreground">{category.name.charAt(0)}</span>
                  </div>
                  <div className="flex-grow">
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <Badge variant="outline">{category.testCount || 0}</Badge>
                </a>
              </Link>
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Yeni Eklenen Kategoriler</h2>
          <div className="space-y-3">
            {categories?.slice(-5).reverse().map((category: Category) => (
              <Link href={`/categories/${category.id}`} key={`new-${category.id}`}>
                <a className="flex items-center gap-3 p-3 hover:bg-muted rounded-md transition-colors">
                  <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full">
                    <span className="text-sm font-bold text-primary-foreground">{category.name.charAt(0)}</span>
                  </div>
                  <div className="flex-grow">
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <Badge variant="outline">{category.testCount || 0}</Badge>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}