import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useLocation } from 'wouter';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserX, Shield, Edit, Trash, Plus, Check, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { insertCategorySchema, insertTestSchema } from '@/../../shared/schema';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

// Admin Sayfasına Giriş Kontrolü
function AdminAccess() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Kullanıcı yükleniyor
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Yetkilendiriliyor...</p>
      </div>
    );
  }

  // Kullanıcı giriş yapmamış
  if (!user) {
    toast({
      title: "Erişim reddedildi",
      description: "Bu sayfaya erişmek için giriş yapmalısınız.",
      variant: "destructive"
    });
    navigate('/login');
    return null;
  }

  // Admin rolü kontrolü (Supabase user.user_metadata'dan kontrol ederiz)
  const isAdmin = user.app_metadata?.role === 'admin' || user.user_metadata?.isAdmin;
  
  if (!isAdmin) {
    toast({
      title: "Erişim reddedildi",
      description: "Bu sayfaya erişmek için admin yetkisine sahip olmalısınız.",
      variant: "destructive"
    });
    navigate('/');
    return null;
  }

  // Admin sayfasını göster
  return <AdminPanel />;
}

// Kategori yönetimi için form şeması
const categoryFormSchema = insertCategorySchema.extend({
  description: z.string().min(10, {
    message: "Açıklama en az 10 karakter olmalıdır.",
  }),
  name: z.string().min(3, {
    message: "Kategori adı en az 3 karakter olmalıdır.",
  }),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

// Admin Paneli Ana Bileşeni
function AdminPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('categories');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Form tanımlamaları
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Kategori ekle/düzenle işlemi
  const handleCategorySubmit = async (values: CategoryFormValues) => {
    setIsLoading(true);
    try {
      // Yeni kategori ekleme
      if (!selectedCategory) {
        await apiRequest('/api/categories', {
          method: 'POST',
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
          method: 'PUT',
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
      console.error('Kategori işlemi sırasında hata:', error);
      toast({
        title: "Hata",
        description: "Kategori işlemi sırasında bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Kategori yükleme
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/categories');
      setCategories(data);
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
      toast({
        title: "Hata",
        description: "Kategoriler yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Testleri yükleme
  const fetchTests = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/tests');
      setTests(data);
    } catch (error) {
      console.error('Testler yüklenirken hata:', error);
      toast({
        title: "Hata",
        description: "Testler yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Kullanıcıları yükleme (örnek)
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Bu endpoint'i backend'de oluşturmanız gerekecek
      const data = await apiRequest('/api/admin/users');
      setUsers(data);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
      toast({
        title: "Hata",
        description: "Kullanıcılar yüklenirken bir hata oluştu.",
        variant: "destructive"
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
    });
    setIsCategoryDialogOpen(true);
  };

  // Test silme
  const handleDeleteTest = async (testId: number) => {
    if (window.confirm('Bu testi silmek istediğinize emin misiniz?')) {
      setIsLoading(true);
      try {
        await apiRequest(`/api/tests/${testId}`, {
          method: 'DELETE',
        });
        toast({
          title: "Başarılı",
          description: "Test başarıyla silindi.",
        });
        // Testleri yeniden yükle
        fetchTests();
      } catch (error) {
        console.error('Test silinirken hata:', error);
        toast({
          title: "Hata",
          description: "Test silinirken bir hata oluştu.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Kullanıcı banlama
  const handleBanUser = async (userId: number) => {
    if (window.confirm('Bu kullanıcıyı banlamak istediğinize emin misiniz?')) {
      setIsLoading(true);
      try {
        // Bu endpoint'i backend'de oluşturmanız gerekecek
        await apiRequest(`/api/admin/users/${userId}/ban`, {
          method: 'POST',
        });
        toast({
          title: "Başarılı",
          description: "Kullanıcı başarıyla banlandı.",
        });
        // Kullanıcıları yeniden yükle
        fetchUsers();
      } catch (error) {
        console.error('Kullanıcı banlanırken hata:', error);
        toast({
          title: "Hata",
          description: "Kullanıcı banlanırken bir hata oluştu.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Admin rolü atama
  const handleToggleAdminRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirmMessage = currentRole === 'admin' 
      ? 'Bu kullanıcının admin yetkisini kaldırmak istediğinize emin misiniz?' 
      : 'Bu kullanıcıya admin yetkisi vermek istediğinize emin misiniz?';
    
    if (window.confirm(confirmMessage)) {
      setIsLoading(true);
      try {
        // Bu endpoint'i backend'de oluşturmanız gerekecek
        await apiRequest(`/api/admin/users/${userId}/role`, {
          method: 'POST',
          data: { role: newRole },
        });
        toast({
          title: "Başarılı",
          description: `Kullanıcı rolü ${newRole === 'admin' ? 'admin' : 'kullanıcı'} olarak güncellendi.`,
        });
        // Kullanıcıları yeniden yükle
        fetchUsers();
      } catch (error) {
        console.error('Kullanıcı rolü güncellenirken hata:', error);
        toast({
          title: "Hata",
          description: "Kullanıcı rolü güncellenirken bir hata oluştu.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Sayfa açıldığında ilgili verileri yükle
  useEffect(() => {
    // Active tab değiştiğinde ilgili verileri yükle
    if (activeTab === 'categories') {
      fetchCategories();
    } else if (activeTab === 'tests') {
      fetchTests();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Paneli</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="categories">Kategoriler</TabsTrigger>
          <TabsTrigger value="tests">Testler</TabsTrigger>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
        </TabsList>
        
        {/* Kategoriler Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kategori Yönetimi</CardTitle>
                  <CardDescription>Kategori ekleyin, düzenleyin ve yönetin.</CardDescription>
                </div>
                <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setSelectedCategory(null);
                      categoryForm.reset({
                        name: '',
                        description: '',
                      });
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Kategori
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {selectedCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
                      </DialogTitle>
                      <DialogDescription>
                        Kategori detaylarını giriniz.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...categoryForm}>
                      <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
                        <FormField
                          control={categoryForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kategori Adı</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Örn: Sanat, Bilim, Tarih..." />
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
                            ) : selectedCategory ? 'Güncelle' : 'Ekle'}
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
                        <TableCell className="max-w-sm truncate">{category.description}</TableCell>
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
                  <CardDescription>Testleri görüntüleyin ve silin.</CardDescription>
                </div>
                <Button onClick={() => navigate('/create-test')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Test Oluştur
                </Button>
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
                        <TableCell>{test.category?.name || 'Kategori yok'}</TableCell>
                        <TableCell>{test.createdBy?.username || 'Bilinmeyen'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              test.difficulty <= 2 ? "outline" : 
                              test.difficulty <= 3 ? "secondary" : 
                              test.difficulty <= 4 ? "default" : 
                              "destructive"
                            }
                          >
                            {test.difficulty}/5
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/test-edit/${test.id}`)}
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
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
              <CardDescription>Kullanıcıları yönetin, banlayın ve admin atayın.</CardDescription>
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
                          <Badge variant={user.role === 'admin' ? "default" : "outline"}>
                            {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.banned ? "destructive" : "success"}>
                            {user.banned ? 'Banlı' : 'Aktif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleAdminRole(user.id, user.role)}
                            title={user.role === 'admin' ? 'Admin Yetkisini Kaldır' : 'Admin Yap'}
                          >
                            <Shield className={`w-4 h-4 ${user.role === 'admin' ? 'text-primary' : ''}`} />
                          </Button>
                          {!user.banned ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleBanUser(user.id)}
                              title="Kullanıcıyı Banla"
                            >
                              <UserX className="w-4 h-4 text-destructive" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleBanUser(user.id)}
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
      </Tabs>
    </div>
  );
}

export default AdminAccess;