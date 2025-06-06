import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useLocation, Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserX, Shield, Edit, Trash, Plus, Check, X, Star, Globe, Film, Palette, Gamepad2, Image, Music, Book, BookOpen, Car, Map, Camera, Coffee, Trophy, Users, Heart, PawPrint, Laptop, Smartphone, Server, Atom, Microscope, Dumbbell, Pizza, Cake, Leaf, TreeDeciduous, Sun, BookOpenCheck, Landmark, GamepadIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { insertCategorySchema, insertTestSchema } from "@/../../shared/schema";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Admin Sayfasına Giriş Kontrolü
function AdminAccess() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    // Kullanıcı yüklendikten sonra kontrolleri yap
    if (!loading) {
      // Kullanıcı giriş yapmamış
      if (!user) {
        toast({
          title: "Erişim reddedildi",
          description: "Bu sayfaya erişmek için giriş yapmalısınız.",
          variant: "destructive",
        });
        setLocation("/login");
      } else {
        // Admin rolü kontrolü (metadata veya doğrudan Supabase üzerinden)
        // user.app_metadata.role'ü kontrol et (yönetici arayüzünden ayarlanması durumunda)
        // user.user_metadata.isAdmin'i kontrol et (SQL ile eklenmiş admin durumunda)
        // user.user_metadata.role kontrolü de ekledik SQL admin durumu için
        // Belirli email veya ID'ye sahip kullanıcılar için direkt yetkilendirme ekledik
        const isAdmin = user.app_metadata?.role === "admin" || 
                      user.user_metadata?.isAdmin === true ||
                      user.user_metadata?.role === "admin" ||
                      user.uid === '108973046762004266106' ||
                      user.email === 'pixelhuntfun@gmail.com';
                      
        console.log("Admin check:", { 
          userId: user.uid,
          email: user.email,
          app_metadata: user.app_metadata,
          user_metadata: user.user_metadata,
          isAdmin: isAdmin
        });
        
        if (!isAdmin) {
          toast({
            title: "Erişim reddedildi",
            description: "Bu sayfaya erişmek için admin yetkisine sahip olmalısınız.",
            variant: "destructive",
          });
          setLocation("/");
        }
      }
    }
  }, [user, loading, toast, setLocation]);
  
  // Kullanıcı yükleniyor
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Yetkilendiriliyor...</p>
      </div>
    );
  }
  
  // Kullanıcı yüklendi ve admin yetkisi varsa göster
  if (user && (
    user.app_metadata?.role === "admin" || 
    user.user_metadata?.isAdmin === true || 
    user.user_metadata?.role === "admin" ||
    user.uid === '108973046762004266106' ||
    user.email === 'pixelhuntfun@gmail.com'
  )) {
    // Admin ID veya email ile kesin eşleşme varsa admin panelini göster
    return <AdminPanel />;
  }
  
  // Yetkilendirme kontrolleri useEffect ile yapılıyor, boş bir div döndür
  return <div className="flex items-center justify-center min-h-screen"></div>;
}

// Kullanılabilir ikonların listesi 
const availableIcons = [
  { name: "star", component: Star },
  { name: "globe", component: Globe },
  { name: "film", component: Film },
  { name: "palette", component: Palette },
  { name: "image", component: Image },
  { name: "music", component: Music },
  { name: "book", component: Book },
  { name: "book-open", component: BookOpen },
  { name: "car", component: Car },
  { name: "map", component: Map },
  { name: "camera", component: Camera },
  { name: "coffee", component: Coffee },
  { name: "trophy", component: Trophy },
  { name: "users", component: Users },
  { name: "heart", component: Heart },
  { name: "gamepad-2", component: Gamepad2 },
  { name: "paw-print", component: PawPrint },
  { name: "laptop", component: Laptop },
  { name: "smartphone", component: Smartphone },
  { name: "server", component: Server },
  { name: "atom", component: Atom },
  { name: "microscope", component: Microscope },
  { name: "dumbbell", component: Dumbbell },
  { name: "pizza", component: Pizza },
  { name: "cake", component: Cake },
  { name: "leaf", component: Leaf },
  { name: "tree", component: TreeDeciduous },
  { name: "sun", component: Sun },
  { name: "landmark", component: Landmark },
  { name: "gamepad", component: GamepadIcon }
];

// İkon adına göre ilgili komponenti döndüren yardımcı fonksiyon
const getIconComponent = (iconName: string | null | undefined): React.ReactNode => {
  if (!iconName) return null;
  const icon = availableIcons.find(icon => icon.name === iconName);
  if (!icon) return null;
  return React.createElement(icon.component, { className: "w-4 h-4" });
};

// Kategori yönetimi için form şeması - basitleştirilmiş model
const categoryFormSchema = z.object({
  name: z.string().min(3, {
    message: "Kategori adı en az 3 karakter olmalıdır.",
  }),
  description: z.string().min(10, {
    message: "Açıklama en az 10 karakter olmalıdır.",
  }),
  iconName: z.string().nullable().optional(),
  active: z.boolean().default(true)
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

// Admin Paneli Ana Bileşeni
function AdminPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("categories");
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [popularTests, setPopularTests] = useState<any[]>([]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Form tanımlamaları
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Kategori ekle/düzenle işlemi
  const handleCategorySubmit = async (values: CategoryFormValues) => {
    setIsLoading(true);
    try {
      // Yeni kategori ekleme
      if (!selectedCategory) {
        const categoryData = {
          name: values.name,
          description: values.description,
          iconName: values.iconName || null,
          active: values.active,
          createdAt: serverTimestamp()
        };
        
        await addDoc(collection(db, 'categories'), categoryData);
        
        toast({
          title: "Başarılı",
          description: "Kategori başarıyla eklendi.",
        });
      }
      // Kategori güncelleme
      else {
        const categoryRef = doc(db, 'categories', selectedCategory.id);
        
        const updateData = {
          name: values.name,
          description: values.description,
          iconName: values.iconName,
          active: values.active,
          updatedAt: serverTimestamp()
        };
        
        await updateDoc(categoryRef, updateData);
        
        toast({
          title: "Başarılı",
          description: "Kategori başarıyla güncellendi.",
        });
      }

      // Form ve dialog'u sıfırla
      categoryForm.reset();
      setIsCategoryDialogOpen(false);
      setSelectedCategory(null);

      // Kategorileri yeniden yükle
      fetchCategories();
    } catch (error) {
      console.error("Kategori işlemi sırasında hata:", error);
      toast({
        title: "Hata",
        description: "Kategori işlemi sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Kategori yükleme
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const categoriesRef = collection(db, 'categories');
      const q = query(categoriesRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCategories(categoriesData);
    } catch (error) {
      console.error("Kategoriler yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Kategoriler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Testleri yükleme
  const fetchTests = async () => {
    setIsLoading(true);
    try {
      const testsRef = collection(db, 'tests');
      const q = query(testsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const testsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTests(testsData);
    } catch (error) {
      console.error("Testler yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Testler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Kullanıcı yönetimi için API istekleri
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsers(usersData);
    } catch (error) {
      console.error("Kullanıcılar yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Kullanıcılar yüklenirken bir hata oluştu. Admin yetkileriniz olduğundan emin olun.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Kategori düzenleme için dialog'u aç - basitleştirilmiş model
  const openEditCategoryDialog = (category: any) => {
    setSelectedCategory(category);
    categoryForm.reset({
      name: category.name,
      description: category.description,
      iconName: category.iconName,
      active: category.active
    });
    setIsCategoryDialogOpen(true);
  };
  
  // Kullanıcı etkinliklerini yükle ve popüler testleri göster
  const fetchActivitiesAndPopularTests = async () => {
    setIsLoading(true);
    try {
      // Aktiviteleri yükle
      const activitiesRef = collection(db, 'userActivities');
      const q = query(activitiesRef, orderBy('createdAt', 'desc'), limit(20));
      const querySnapshot = await getDocs(q);
      
      const activitiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      setActivities(activitiesData);
      
      // Popüler testleri yükle
      const testsRef = collection(db, 'tests');
      const testsQuery = query(
        testsRef,
        where('isPublic', '==', true),
        where('approved', '==', true),
        orderBy('playCount', 'desc'),
        limit(3)
      );
      
      const testsSnapshot = await getDocs(testsQuery);
      const testsData = testsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPopularTests(testsData);
    } catch (error) {
      console.error("Etkinlikler yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Kullanıcı etkinlikleri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Kullanıcı etkinliklerini göster
  const showUserActivities = async (userId: string) => {
    try {
      const activitiesRef = collection(db, 'userActivities');
      const q = query(
        activitiesRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const activitiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      setActivities(activitiesData);
      setActiveTab("activities");
    } catch (error) {
      console.error("Kullanıcı etkinlikleri yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Kullanıcı etkinlikleri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Test silme
  const handleDeleteTest = async (testId: string) => {
    if (window.confirm("Bu testi silmek istediğinize emin misiniz?")) {
      setIsLoading(true);
      try {
        const testRef = doc(db, 'tests', testId);
        await deleteDoc(testRef);
        
        toast({
          title: "Başarılı",
          description: "Test başarıyla silindi.",
        });
        // Testleri yeniden yükle
        fetchTests();
      } catch (error) {
        console.error("Test silinirken hata:", error);
        toast({
          title: "Hata",
          description: "Test silinirken bir hata oluştu.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Kullanıcı banlama veya ban kaldırma
  const handleBanUser = async (userId: string, currentBanStatus: boolean) => {
    const confirmMessage = currentBanStatus 
      ? "Bu kullanıcının banını kaldırmak istediğinize emin misiniz?" 
      : "Bu kullanıcıyı banlamak istediğinize emin misiniz?";
    
    if (window.confirm(confirmMessage)) {
      setIsLoading(true);
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          banned: !currentBanStatus
        });
        
        toast({
          title: "Başarılı",
          description: currentBanStatus 
            ? "Kullanıcının banı kaldırıldı." 
            : "Kullanıcı başarıyla banlandı.",
        });
        
        // Kullanıcıları yeniden yükle
        fetchUsers();
      } catch (error) {
        console.error("Kullanıcı ban işlemi sırasında hata:", error);
        toast({
          title: "Hata",
          description: "Kullanıcı işlemi sırasında bir hata oluştu.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Admin rolü atama
  const handleToggleAdminRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const confirmMessage =
      currentRole === "admin"
        ? "Bu kullanıcının admin yetkisini kaldırmak istediğinize emin misiniz?"
        : "Bu kullanıcıya admin yetkisi vermek istediğinize emin misiniz?";

    if (window.confirm(confirmMessage)) {
      setIsLoading(true);
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          role: newRole
        });
        
        toast({
          title: "Başarılı",
          description: `Kullanıcı rolü ${newRole === "admin" ? "admin" : "kullanıcı"} olarak güncellendi.`,
        });
        
        // Kullanıcıları yeniden yükle
        fetchUsers();
      } catch (error) {
        console.error("Kullanıcı rolü güncellenirken hata:", error);
        toast({
          title: "Hata",
          description: "Kullanıcı rolü güncellenirken bir hata oluştu.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Sayfa açıldığında ilgili verileri yükle
  useEffect(() => {
    // Active tab değiştiğinde ilgili verileri yükle
    if (activeTab === "categories") {
      fetchCategories();
    } else if (activeTab === "tests") {
      fetchTests();
    } else if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "activities") {
      fetchActivitiesAndPopularTests();
    }
  }, [activeTab]);

  return (
    <div className="max-w-content mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Admin Paneli</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8 custom-tab-bg">
          <TabsTrigger value="categories" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Kategoriler</TabsTrigger>
          <TabsTrigger value="tests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Testler</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="activities" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Aktiviteler</TabsTrigger>
        </TabsList>

        {/* Kategoriler Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kategori Yönetimi</CardTitle>
                  <CardDescription>
                    Kategori ekleyin, düzenleyin ve yönetin.
                  </CardDescription>
                </div>
                <Dialog
                  open={isCategoryDialogOpen}
                  onOpenChange={setIsCategoryDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setSelectedCategory(null);
                        categoryForm.reset({
                          name: "",
                          description: "",
                          iconName: null,
                          active: true
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Kategori
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto p-0">
                    <div className="p-6">
                      <DialogHeader className="mb-4">
                        <DialogTitle>
                          {selectedCategory
                            ? "Kategori Düzenle"
                            : "Yeni Kategori Ekle"}
                        </DialogTitle>
                        <DialogDescription>
                          Kategori detaylarını giriniz.
                        </DialogDescription>
                      </DialogHeader>

                      <Form {...categoryForm}>
                        <form
                          onSubmit={categoryForm.handleSubmit(
                            handleCategorySubmit,
                          )}
                          className="space-y-6"
                        >
                          <FormField
                            control={categoryForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Kategori Adı</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Örn: Sanat, Bilim, Tarih..."
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={categoryForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Açıklama</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    placeholder="Kategori hakkında kısa açıklama..."
                                    rows={3}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={categoryForm.control}
                            name="iconName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>İkon</FormLabel>
                                <div className="grid grid-cols-6 gap-2 p-3 max-h-[180px] overflow-y-auto border rounded-md bg-background">
                                  {availableIcons.map((icon) => (
                                    <div
                                      key={icon.name}
                                      onClick={() => field.onChange(icon.name)}
                                      className={`flex flex-col items-center justify-center p-2 rounded-md cursor-pointer transition-colors ${
                                        field.value === icon.name
                                          ? "bg-primary/20 border border-primary"
                                          : "hover:bg-muted border border-transparent"
                                      }`}
                                    >
                                      {React.createElement(icon.component, {
                                        className: "w-5 h-5 mb-1.5",
                                      })}
                                      <span className="text-xs text-center truncate w-full">{icon.name}</span>
                                    </div>
                                  ))}
                                </div>
                                <FormDescription className="mt-1.5">
                                  Kategori için bir ikon seçin (isteğe bağlı)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={categoryForm.control}
                            name="active"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Durum</FormLabel>
                                <Select
                                  onValueChange={(value) => field.onChange(value === "true")}
                                  defaultValue={field.value ? "true" : "false"}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Kategori durumu" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="true">Aktif</SelectItem>
                                    <SelectItem value="false">Pasif</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Bu kategori aktif olarak kullanılsın mı?
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </form>
                      </Form>
                    </div>

                    <DialogFooter className="sticky bottom-0 bg-background border-t p-4 mt-0">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCategoryDialogOpen(false)}
                        >
                          İptal
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={isLoading}
                          onClick={categoryForm.handleSubmit(handleCategorySubmit)}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Kaydediliyor...
                            </>
                          ) : selectedCategory ? (
                            "Güncelle"
                          ) : (
                            "Ekle"
                          )}
                        </Button>
                      </div>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz kategori bulunmuyor. Yeni bir kategori ekleyin.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Kategori Adı</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-mono text-xs">{category.id.substring(0, 8)}...</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              {category.iconName ? 
                                getIconComponent(category.iconName) : 
                                <Image className="w-3 h-3 text-primary/50" />
                              }
                            </div>
                            <span>{category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-sm truncate">
                          {category.description}
                        </TableCell>
                        <TableCell>
                          {category.active ? (
                            <Badge variant="success" className="bg-green-500/10 text-green-600 border-green-200">Aktif</Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-200">Pasif</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditCategoryDialog(category)}
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testler Tab */}
        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Test Yönetimi</CardTitle>
                  <CardDescription>
                    Testleri görüntüleyin ve silin.
                  </CardDescription>
                </div>
                <Link to="/create-test">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Test Oluştur
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : tests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz test bulunmuyor.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Test Adı</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Oluşturan</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="font-mono text-xs">{test.id.substring(0, 8)}...</TableCell>
                        <TableCell>{test.title}</TableCell>
                        <TableCell>
                          {test.categoryId || "Kategori yok"}
                        </TableCell>
                        <TableCell>
                          {test.creatorId || "Bilinmeyen"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {test.isPublic ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Yayında</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Gizli</Badge>
                            )}
                            {test.approved ? (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">Onaylı</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">Onaysız</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/test/${test.id}`}>
                            <Button variant="ghost" size="icon" title="Görüntüle">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTest(test.id)}
                            title="Sil"
                          >
                            <Trash className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kullanıcılar Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Kullanıcı Yönetimi</CardTitle>
              <CardDescription>
                Kullanıcıları yönetin, banlayın ve admin atayın.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz kullanıcı bulunmuyor.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Kullanıcı Adı</TableHead>
                      <TableHead>E-posta</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-xs">{user.id.substring(0, 8)}...</TableCell>
                        <TableCell>{user.username || user.displayName || "Kullanıcı"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "admin" ? "default" : "outline"
                            }
                          >
                            {user.role === "admin" ? "Admin" : "Kullanıcı"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.banned ? (
                            <Badge variant="destructive">Banlı</Badge>
                          ) : (
                            <Badge variant="success" className="bg-green-500/10 text-green-600 border-green-200">Aktif</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleToggleAdminRole(user.id, user.role)
                            }
                            title={
                              user.role === "admin"
                                ? "Admin Yetkisini Kaldır"
                                : "Admin Yap"
                            }
                          >
                            <Shield
                              className={`w-4 h-4 ${user.role === "admin" ? "text-primary" : ""}`}
                            />
                          </Button>
                          {!user.banned ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleBanUser(user.id, false)}
                              title="Kullanıcıyı Banla"
                            >
                              <UserX className="w-4 h-4 text-destructive" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleBanUser(user.id, true)}
                              title="Kullanıcının Banını Kaldır"
                            >
                              <Check className="w-4 h-4 text-success" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aktiviteler Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Kullanıcı Aktiviteleri</CardTitle>
              <CardDescription>
                Son kullanıcı aktivitelerini görüntüleyin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-medium">Son Aktiviteler</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kullanıcı</TableHead>
                          <TableHead>Aktivite</TableHead>
                          <TableHead>Detay</TableHead>
                          <TableHead>Tarih</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activities.length > 0 ? (
                          activities.map((activity, index) => (
                            <TableRow key={activity.id || index}>
                              <TableCell>{activity.userName || activity.userId || 'Bilinmeyen Kullanıcı'}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{activity.activityType}</Badge>
                              </TableCell>
                              <TableCell>{activity.details || '-'}</TableCell>
                              <TableCell>
                                {activity.createdAt ? new Date(activity.createdAt).toLocaleString('tr-TR') : '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                              Henüz kayıtlı aktivite bulunmuyor.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-medium">Popüler Testler</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {popularTests.length > 0 ? (
                        popularTests.map((test) => (
                          <Card key={test.id}>
                            <CardHeader className="p-4">
                              <CardTitle className="text-base">{test.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Oynanma: {test.playCount || 0}</span>
                                <span>Beğeni: {test.likeCount || 0}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-3 text-center text-muted-foreground py-4">
                          Henüz popüler test bulunmuyor.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Add missing Eye component
const Eye = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default AdminAccess;