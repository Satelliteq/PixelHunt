import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useLocation, Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  UserX,
  Shield,
  Edit,
  Trash,
  Plus,
  Check,
  X,
} from "lucide-react";
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
                      user.id === '5d946ebe-c6b0-4488-801a-f4b1e67138bb' ||
                      user.email === 'pixelhuntfun@gmail.com';
                      
        console.log("Admin check:", { 
          userId: user.id,
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
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
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
    user.id === '5d946ebe-c6b0-4488-801a-f4b1e67138bb' ||
    user.email === 'pixelhuntfun@gmail.com'
  )) {
    // Admin ID veya email ile kesin eşleşme varsa admin panelini göster
    return <AdminPanel />;
  }
  
  // Yetkilendirme kontrolleri useEffect ile yapılıyor, boş bir div döndür
  return <div className="flex flex-col items-center justify-center min-h-[60vh]"></div>;
}

// Kategori yönetimi için form şeması
const categoryFormSchema = insertCategorySchema.extend({
  description: z.string().min(10, {
    message: "Açıklama en az 10 karakter olmalıdır.",
  }),
  name: z.string().min(3, {
    message: "Kategori adı en az 3 karakter olmalıdır.",
  }),
  color: z.string().regex(/^#([0-9A-F]{6})$/i, {
    message: "Geçerli bir hex renk kodu girin (örn: #FF5733).",
  }).default("#4F46E5"),
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
        await apiRequest("/api/categories", {
          method: "POST",
          data: values,
        });
        toast({
          title: "Başarılı",
          description: "Kategori başarıyla eklendi.",
        });
      }
      // Kategori güncelleme
      else {
        await apiRequest(`/api/categories/${selectedCategory.id}`, {
          method: "PUT",
          data: values,
        });
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
      const data = await apiRequest("/api/categories");
      setCategories(data);
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
      const data = await apiRequest("/api/tests");
      setTests(data);
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
      const data = await apiRequest("/api/admin/users", {
        headers: {
          "x-admin-token": "admin-secret-token", // Geliştirme amacıyla
          // Production ortamında oturum tabanlı kimlik doğrulama kullanacağız
        }
      });
      setUsers(data);
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

  // Kategori düzenleme için dialog'u aç
  const openEditCategoryDialog = (category: any) => {
    setSelectedCategory(category);
    categoryForm.reset({
      name: category.name,
      description: category.description,
      color: category.color || "#4F46E5",
    });
    setIsCategoryDialogOpen(true);
  };

  // Test silme
  const handleDeleteTest = async (testId: number) => {
    if (window.confirm("Bu testi silmek istediğinize emin misiniz?")) {
      setIsLoading(true);
      try {
        await apiRequest(`/api/tests/${testId}`, {
          method: "DELETE",
        });
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
  const handleBanUser = async (userId: number, currentBanStatus: boolean) => {
    const confirmMessage = currentBanStatus 
      ? "Bu kullanıcının banını kaldırmak istediğinize emin misiniz?" 
      : "Bu kullanıcıyı banlamak istediğinize emin misiniz?";
    
    if (window.confirm(confirmMessage)) {
      setIsLoading(true);
      try {
        await apiRequest(`/api/admin/users/${userId}/ban`, {
          method: "POST",
          data: { banned: !currentBanStatus },
          headers: {
            "x-admin-token": "admin-secret-token", // Geliştirme amacıyla
          }
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
  const handleToggleAdminRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const confirmMessage =
      currentRole === "admin"
        ? "Bu kullanıcının admin yetkisini kaldırmak istediğinize emin misiniz?"
        : "Bu kullanıcıya admin yetkisi vermek istediğinize emin misiniz?";

    if (window.confirm(confirmMessage)) {
      setIsLoading(true);
      try {
        await apiRequest(`/api/admin/users/${userId}/role`, {
          method: "POST",
          data: { role: newRole },
          headers: {
            "x-admin-token": "admin-secret-token", // Geliştirme amacıyla
          }
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

  // Aktivite ve popüler testleri yükleme
  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      // Bu endpoint henüz yoksa, geçici veri döndürebiliriz
      // const data = await apiRequest("/api/admin/activities");
      // setActivities(data);
      
      // Popüler testleri yükle
      const popularData = await apiRequest("/api/tests/popular?limit=3");
      setPopularTests(popularData);
    } catch (error) {
      console.error("Aktiviteler yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Aktiviteler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
      fetchActivities();
    }
  }, [activeTab]);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Paneli</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="categories">Kategoriler</TabsTrigger>
          <TabsTrigger value="tests">Testler</TabsTrigger>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="activities">Aktiviteler</TabsTrigger>
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
                          color: "#4F46E5",
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Kategori
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
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
                        className="space-y-4"
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
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Renk</FormLabel>
                              <div className="flex items-center gap-4">
                                <div 
                                  className="w-10 h-10 rounded-md border" 
                                  style={{ backgroundColor: field.value || "#4F46E5" }}
                                />
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="text"
                                    placeholder="#4F46E5"
                                  />
                                </FormControl>
                              </div>
                              <FormDescription>
                                Kategori için bir renk kodu girin (örn: #FF5733). Bu renk, kategori kartlarında kullanılacaktır.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCategoryDialogOpen(false)}
                          >
                            İptal
                          </Button>
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Kaydediliyor...
                              </>
                            ) : selectedCategory ? (
                              "Güncelle"
                            ) : (
                              "Ekle"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
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
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>{category.id}</TableCell>
                        <TableCell>{category.name}</TableCell>
                        <TableCell className="max-w-sm truncate">
                          {category.description}
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
                <Link to="/test-create">
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
                      <TableHead>Zorluk</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell>{test.id}</TableCell>
                        <TableCell>{test.title}</TableCell>
                        <TableCell>
                          {test.category?.name || "Kategori yok"}
                        </TableCell>
                        <TableCell>
                          {test.createdBy?.username || "Bilinmeyen"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              test.difficulty <= 2
                                ? "outline"
                                : test.difficulty <= 3
                                  ? "secondary"
                                  : test.difficulty <= 4
                                    ? "default"
                                    : "destructive"
                            }
                          >
                            {test.difficulty}/5
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/test-edit/${test.id}`}>
                            <Button variant="ghost" size="icon" title="Düzenle">
                              <Edit className="w-4 h-4" />
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
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
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
                            <Badge variant="success">Aktif</Badge>
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
                        {/* Örnek aktivite girdileri */}
                        <TableRow>
                          <TableCell>user123</TableCell>
                          <TableCell>
                            <Badge variant="outline">Test Oluşturma</Badge>
                          </TableCell>
                          <TableCell>Sanat Testi</TableCell>
                          <TableCell>
                            {new Date().toLocaleString('tr-TR')}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>admin</TableCell>
                          <TableCell>
                            <Badge variant="outline">Kategori Güncelleme</Badge>
                          </TableCell>
                          <TableCell>Tarih Kategorisi</TableCell>
                          <TableCell>
                            {new Date().toLocaleString('tr-TR')}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>user456</TableCell>
                          <TableCell>
                            <Badge variant="outline">Oyun Puanı</Badge>
                          </TableCell>
                          <TableCell>450 puan</TableCell>
                          <TableCell>
                            {new Date().toLocaleString('tr-TR')}
                          </TableCell>
                        </TableRow>
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

export default AdminAccess;
