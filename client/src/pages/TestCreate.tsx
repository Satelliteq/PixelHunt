import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/AuthContext";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { createId } from '@paralleldrive/cuid2';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, Trash, Upload, Plus, Image, Loader2 } from "lucide-react";

const testFormSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır").max(100, "Başlık en fazla 100 karakter olabilir"),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır").default(""),
  categoryId: z.string().min(1, "Lütfen bir kategori seçin"),
  isPublic: z.boolean().default(true),
  isAnonymous: z.boolean().default(false),
  thumbnailUrl: z.string().optional(),
  images: z.array(
    z.object({
      imageUrl: z.string().url("Geçerli bir URL girmelisiniz"),
      answers: z.array(z.string()).min(1, "En az bir cevap girmelisiniz")
    })
  ).min(1, "En az bir görsel eklemelisiniz"),
});

type TestFormValues = z.infer<typeof testFormSchema>;

export default function TestCreate() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [thumbnail, setThumbnail] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  
  // Giriş yapmamış kullanıcıları giriş sayfasına yönlendir
  useEffect(() => {
    if (!user) {
      toast({
        title: "Lütfen giriş yapın",
        description: "Test oluşturmak için giriş yapmalısınız.",
        variant: "destructive"
      });
      navigate("/login");
    }
  }, [user, navigate]);
  
  // Kullanıcı giriş yapmamışsa içeriği gösterme
  if (!user) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Giriş Gerekli</h2>
          <p className="mb-4">Test oluşturmak için lütfen giriş yapın.</p>
          <Button onClick={() => navigate("/login")}>Giriş Yap</Button>
        </div>
      </div>
    );
  }
  
  const [imageInputs, setImageInputs] = useState<{
    imageUrl: string;
    answers: string[];
    tempAnswer: string;
  }[]>([
    { imageUrl: "", answers: [], tempAnswer: "" }
  ]);

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      try {
        const categoriesRef = collection(db, 'categories');
        const q = query(categoriesRef, where('active', '==', true), orderBy('name'));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
      }
    }
  });

  // Thumbnail yükleme işlevi
  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Hata",
        description: "Lütfen bir görsel dosyası yükleyin.",
        variant: "destructive",
      });
      return;
    }
    
    // Dosya boyutu kontrolü (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Hata",
        description: "Görsel boyutu 5MB'dan küçük olmalıdır.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setUploading(true);
      
      // Create a reference to Firebase Storage
      const storageRef = ref(storage, `test-thumbnails/${createId()}_${file.name}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setThumbnail(downloadURL);
      form.setValue("thumbnailUrl", downloadURL);
      setUploading(false);
    } catch (error) {
      setUploading(false);
      console.error("Error uploading thumbnail:", error);
      toast({
        title: "Hata",
        description: "Kapak fotoğrafı yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      isPublic: true,
      isAnonymous: false,
      thumbnailUrl: "",
      images: [],
    },
  });

  // Form değerlerini görevlerde imageInputs ile güncelle
  useEffect(() => {
    // Geçerli görsel verileri var ve form hazırsa, form "images" alanını imageInputs ile güncelle
    if (imageInputs.length > 0 && form) {
      const formattedImages = imageInputs.map(img => ({
        imageUrl: img.imageUrl,
        answers: img.answers
      }));
      
      // Form değerini güncelle
      form.setValue("images", formattedImages);
    }
  }, [imageInputs, form]);
  
  const handleSubmit = async (values: TestFormValues) => {
    try {
      setUploading(true);
      
      // Process images
      const processedQuestions = await Promise.all(
        imageInputs.map(async (img, index) => {
          let finalImageUrl = img.imageUrl;
          
          // If the image is a data URL, upload it to Firebase Storage
          if (finalImageUrl.startsWith('data:image/')) {
            try {
              // Convert data URL to blob
              const response = await fetch(finalImageUrl);
              const blob = await response.blob();
              
              // Create a reference to Firebase Storage
              const storageRef = ref(storage, `test-images/${createId()}_${index}.jpg`);
              
              // Upload the blob
              const snapshot = await uploadBytes(storageRef, blob);
              
              // Get the download URL
              finalImageUrl = await getDownloadURL(snapshot.ref);
            } catch (error) {
              console.error(`Error uploading image #${index + 1}:`, error);
              throw error;
            }
          }
          
          return {
            imageUrl: finalImageUrl,
            answers: img.answers,
            question: "Bu görselde ne görüyorsunuz?"
          };
        })
      );
      
      // Process thumbnail if it's a data URL
      let finalThumbnail = thumbnail || (imageInputs[0]?.imageUrl || '');
      if (finalThumbnail && finalThumbnail.startsWith('data:image/')) {
        try {
          // Convert data URL to blob
          const response = await fetch(finalThumbnail);
          const blob = await response.blob();
          
          // Create a reference to Firebase Storage
          const storageRef = ref(storage, `test-thumbnails/${createId()}.jpg`);
          
          // Upload the blob
          const snapshot = await uploadBytes(storageRef, blob);
          
          // Get the download URL
          finalThumbnail = await getDownloadURL(snapshot.ref);
        } catch (error) {
          console.error('Error uploading thumbnail:', error);
          throw error;
        }
      }
      
      // Create test in Firestore
      const testData = {
        uuid: createId(),
        title: values.title,
        description: values.description || "",
        categoryId: values.categoryId,
        creatorId: user.uid,
        questions: processedQuestions,
        thumbnailUrl: finalThumbnail || processedQuestions[0]?.imageUrl,
        isPublic: values.isPublic,
        isAnonymous: values.isAnonymous,
        approved: true, // Auto-approve for now
        featured: false,
        playCount: 0,
        likeCount: 0,
        createdAt: serverTimestamp()
      };
      
      const testRef = await addDoc(collection(db, 'tests'), testData);
      
      toast({
        title: "Test başarıyla oluşturuldu",
        description: "Testiniz başarıyla oluşturuldu ve yayınlandı.",
        variant: "default",
      });
      
      // Navigate to the test page
      navigate(`/test/${testRef.id}`);
    } catch (error) {
      console.error("Test oluşturma hatası:", error);
      toast({
        title: "Hata",
        description: "Test oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const addImage = () => {
    setImageInputs([...imageInputs, { imageUrl: "", answers: [], tempAnswer: "" }]);
  };

  const removeImage = (index: number) => {
    if (imageInputs.length <= 1) {
      toast({
        title: "Uyarı",
        description: "En az bir görsel eklenmelidir.",
        variant: "default",
      });
      return;
    }
    const newImages = [...imageInputs];
    newImages.splice(index, 1);
    setImageInputs(newImages);
  };

  const updateImageUrl = (index: number, url: string) => {
    const newImages = [...imageInputs];
    newImages[index].imageUrl = url;
    setImageInputs(newImages);
  };
  
  const handleFileUpload = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Hata",
        description: "Lütfen bir görsel dosyası yükleyin.",
        variant: "destructive",
      });
      return;
    }
    
    // Dosya boyutu kontrolü (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Hata",
        description: "Görsel boyutu 5MB'dan küçük olmalıdır.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setUploading(true);
      
      // Create a reference to Firebase Storage
      const storageRef = ref(storage, `test-images/${createId()}_${file.name}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update image URL
      const newImages = [...imageInputs];
      newImages[index].imageUrl = downloadURL;
      setImageInputs(newImages);
      
      setUploading(false);
    } catch (error) {
      setUploading(false);
      console.error("Error uploading image:", error);
      toast({
        title: "Hata",
        description: "Görsel yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const addAnswer = (index: number) => {
    if (!imageInputs[index].tempAnswer.trim()) return;
    
    const newImages = [...imageInputs];
    newImages[index].answers = [...newImages[index].answers, newImages[index].tempAnswer.trim()];
    newImages[index].tempAnswer = "";
    setImageInputs(newImages);
  };

  const removeAnswer = (imageIndex: number, answerIndex: number) => {
    const newImages = [...imageInputs];
    newImages[imageIndex].answers.splice(answerIndex, 1);
    setImageInputs(newImages);
  };

  const updateTempAnswer = (index: number, value: string) => {
    const newImages = [...imageInputs];
    newImages[index].tempAnswer = value;
    setImageInputs(newImages);
  };

  const handleEnterKey = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAnswer(index);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Yeni Test Oluştur</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Test Bilgileri</h2>
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Test Başlığı</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: Ünlü Tablo Eserleri" {...field} />
                  </FormControl>
                  <FormDescription>
                    Testinizi tanımlayan kısa ve açıklayıcı bir başlık girin.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Örn: Bu test, sanat tarihi boyunca tanınmış tabloları içerir..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Testiniz hakkında detaylı bilgi verin.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select
                      disabled={categoriesLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategori seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Testinizin en uygun kategorisini seçin.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Herkese Açık
                      </FormLabel>
                      <FormDescription>
                        Bu test tüm kullanıcılar tarafından görülebilir
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isAnonymous"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Anonim Olarak Paylaş
                      </FormLabel>
                      <FormDescription>
                        Testin kime ait olduğu gizlenecek
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Kapak Fotoğrafı</FormLabel>
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-1">
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <label htmlFor="thumbnail-upload" className="flex items-center justify-center cursor-pointer w-full py-2 px-3 border border-dashed rounded text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                            <input
                              id="thumbnail-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleThumbnailUpload}
                              disabled={uploading}
                            />
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? 'Yükleniyor...' : 'Kapak Fotoğrafı Yükle'}
                          </label>
                        </div>
                      </FormControl>
                      <FormDescription className="mt-2">
                        Testiniz için öne çıkan bir görsel yükleyin (opsiyonel).
                      </FormDescription>
                      <FormMessage />
                    </div>
                    
                    {thumbnail && (
                      <div className="w-32 h-32 flex items-center justify-center border rounded overflow-hidden">
                        <img
                          src={thumbnail}
                          alt="Kapak Fotoğrafı"
                          className="max-w-full max-h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {!thumbnail && (
                      <div className="w-32 h-32 flex flex-col items-center justify-center border rounded bg-muted/30">
                        <Image className="h-10 w-10 text-muted-foreground/50 mb-2" />
                        <span className="text-xs text-muted-foreground text-center px-2">Kapak Fotoğrafı Yok</span>
                      </div>
                    )}
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Görseller ve Cevaplar</h2>
            </div>

            {imageInputs.map((image, index) => (
              <div key={index} className="mb-8 p-4 border rounded-md bg-muted/20 relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={() => removeImage(index)}
                >
                  <Trash className="h-4 w-4" />
                </Button>

                <div className="mb-4">
                  <h3 className="font-medium mb-2">Görsel #{index + 1}</h3>
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <FormLabel className="block mb-2">Görsel URL veya Dosya Yükle</FormLabel>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="url"
                            placeholder="https://örnek.com/görsel.jpg"
                            value={image.imageUrl}
                            onChange={(e) => updateImageUrl(index, e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label htmlFor={`image-upload-${index}`} className="flex items-center justify-center cursor-pointer w-full py-2 px-3 border border-dashed rounded text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                            <input
                              id={`image-upload-${index}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(index, e)}
                              disabled={uploading}
                            />
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? 'Yükleniyor...' : 'Bilgisayardan Görsel Yükle'}
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {image.imageUrl && (
                      <div className="w-20 h-20 flex items-center justify-center border rounded">
                        <img
                          src={image.imageUrl}
                          alt={`Preview ${index}`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500';
                          }}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}
                    
                    {!image.imageUrl && (
                      <div className="w-20 h-20 flex items-center justify-center border rounded bg-muted/30">
                        <Image className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <FormLabel className="block mb-2">Kabul Edilebilir Cevaplar</FormLabel>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Cevap ekle"
                      value={image.tempAnswer}
                      onChange={(e) => updateTempAnswer(index, e.target.value)}
                      onKeyDown={(e) => handleEnterKey(e, index)}
                    />
                    <Button type="button" size="sm" onClick={() => addAnswer(index)}>
                      Ekle
                    </Button>
                  </div>
                  
                  {image.answers.length === 0 && (
                    <div className="p-3 bg-muted/30 rounded border text-center text-sm text-muted-foreground">
                      <AlertTriangle className="h-4 w-4 inline mr-2" />
                      Bu görsel için en az bir cevap eklemelisiniz
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {image.answers.map((answer, answerIndex) => (
                      <div key={answerIndex} className="flex items-center bg-primary/10 rounded px-2 py-1">
                        <span className="text-sm mr-2">{answer}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => removeAnswer(index, answerIndex)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {imageInputs.length === 0 && (
              <div className="text-center p-8 border rounded-md bg-muted/20">
                <AlertTriangle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">En az bir görsel eklemelisiniz</p>
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={addImage}>
                  <Plus className="h-4 w-4 mr-2" />
                  Görsel Ekle
                </Button>
              </div>
            )}
            
            {imageInputs.length > 0 && (
              <div className="text-center mt-2">
                <Button type="button" variant="outline" onClick={addImage} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Görsel Ekle
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/")}>
              İptal
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                "Testi Oluştur"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}