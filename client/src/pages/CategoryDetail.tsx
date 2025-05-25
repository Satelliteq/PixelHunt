import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Layers, ArrowLeft, Star, Globe, Film, Palette, Gamepad2, Image, Music, Book as BookIcon, BookOpen, Car, Map, Camera, Coffee, Trophy, Users, Heart, PawPrint, Laptop, Smartphone, Server, Atom, Microscope, Dumbbell, Pizza, Cake, Leaf, TreeDeciduous, Sun, BookOpenCheck, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/game/ContentCard";
import { getAllCategories, getAllTests } from "@/lib/firebaseHelpers";

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
  
  return React.createElement(IconComponent, { className: "w-8 h-8" });
};

export default function CategoryDetail() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, navigate] = useLocation();
  const categoryId = location.split("/").pop();

  // Kategorileri getir
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getAllCategories
  });

  // Testleri getir
  const { data: tests = [] } = useQuery({
    queryKey: ["tests"],
    queryFn: getAllTests
  });

  // Seçili kategoriyi bul
  const selectedCategory = categories.find(cat => cat.id === categoryId);
  const categoryIndex = categories.findIndex(cat => cat.id === categoryId);

  // Kategoriye ait testleri filtrele
  const filteredTests = tests.filter(test => {
    const matchesCategory = test.categoryId === categoryId;
    const matchesSearch = searchQuery ? 
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (test.description && test.description.toLowerCase().includes(searchQuery.toLowerCase())) : 
      true;
    return matchesCategory && matchesSearch;
  });

  if (!selectedCategory) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Kategori Bulunamadı</h2>
          <p className="text-muted-foreground mb-4">Aradığınız kategori mevcut değil.</p>
          <Button onClick={() => navigate("/categories")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kategorilere Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header section */}
      <section className="max-w-content mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/categories")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kategorilere Dön
          </Button>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
              categoryIndex % 6 === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400" : 
              categoryIndex % 6 === 1 ? "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400" : 
              categoryIndex % 6 === 2 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" : 
              categoryIndex % 6 === 3 ? "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400" : 
              categoryIndex % 6 === 4 ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400" : 
              "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
            }`}>
              {selectedCategory.iconName ? getCategoryIcon(selectedCategory.iconName) : getCategoryEmoji(selectedCategory.name, categoryIndex)}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">{selectedCategory.name}</h1>
              <p className="text-muted-foreground">
                {selectedCategory.description || `${selectedCategory.name} kategorisindeki testleri keşfedin.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-content mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Layers className="w-5 h-5 mr-2 text-primary" />
              {selectedCategory.name} Testleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Arama kutusu */}
            <div className="relative w-full max-w-sm mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Test ara..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Test listesi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredTests.map((test) => (
                <ContentCard
                  key={test.id}
                  title={test.title}
                  description={test.description}
                  imageUrl={test.thumbnailUrl}
                  category={selectedCategory.name}
                  playCount={test.playCount}
                  likeCount={test.likeCount}
                  onClick={() => navigate(`/test/${test.id}`)}
                />
              ))}
            </div>

            {/* Sonuç bulunamadı mesajı */}
            {filteredTests.length === 0 && (
              <div className="text-center p-12 bg-muted/30 rounded-lg">
                <h3 className="text-xl font-medium mb-2">Test bulunamadı</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Arama kriterlerinize uygun test bulunamadı." : 
                   "Bu kategoride henüz test bulunmuyor."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
} 