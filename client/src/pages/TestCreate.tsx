import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
// apiRequest'i kullanmadığınız için kaldırabilirsiniz veya kullanıyorsanız import edin.
// import { apiRequest } from "@/lib/queryClient"; 
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/AuthContext";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// collection, addDoc, serverTimestamp, getDocs, query, where, orderBy kullanmadığınız için kaldırabilirsiniz.
// import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase'; // db'yi kullanıyorsanız kalsın
import { createId } from '@paralleldrive/cuid2';
import { getAllCategories, createTest } from '@/lib/firebaseHelpers';

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
  description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır").max(500, "Açıklama en fazla 500 karakter olabilir").optional().default(""),
  categoryId: z.string().min(1, "Lütfen bir kategori seçin"),
  isPublic: z.boolean().default(true),
  isAnonymous: z.boolean().default(false),
  thumbnailUrl: z.string().url("Geçerli bir URL girin veya boş bırakın").optional(),
  images: z.array(
    z.object({
      imageUrl: z.string().url("Görsel için geçerli bir URL girmelisiniz"),
      answers: z.array(z.string().min(1, "Cevap boş olamaz")).min(1, "En az bir cevap girmelisiniz")
    })
  ).min(1, "En az bir görsel eklemelisiniz"),
});

type TestFormValues = z.infer<typeof testFormSchema>;

// Helper function to upload a single file to Firebase Storage
const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, `${path}/${createId()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};


export default function TestCreate() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Submit işlemi için genel yükleme durumu
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(""); // Sadece önizleme için
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null); // Yüklenecek thumbnail dosyası

  const [imageInputs, setImageInputs] = useState<{
    id: string; // Her imaj için benzersiz ID
    imageUrl: string; // URL veya dosya yüklendikten sonraki URL
    answers: string[];
    tempAnswer: string;
    file?: File; // Yüklenecek dosya
    isUploading?: boolean; // Bireysel imaj yükleme durumu
    error?: string; // Bireysel imaj yükleme hatası
  }[]>([
    { id: createId(), imageUrl: "", answers: [], tempAnswer: "" }
  ]);

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

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'], // Basit bir key yeterli, API yolu değil
    queryFn: getAllCategories
  });

  // Form 'images' alanını imageInputs ile senkronize et
  useEffect(() => {
    const validImagesForForm = imageInputs
      .filter(img => img.imageUrl && img.answers.length > 0) // Sadece geçerli URL'si ve cevabı olanları al
      .map(img => ({
        imageUrl: img.imageUrl,
        answers: img.answers
      }));
    form.setValue("images", validImagesForForm, { shouldValidate: true });
  }, [imageInputs, form]);

  const handleThumbnailFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Hata", description: "Lütfen bir görsel dosyası yükleyin.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Hata", description: "Görsel boyutu 5MB'dan küçük olmalıdır.", variant: "destructive" });
      return;
    }
    
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file)); // Dosyadan önizleme oluştur
    form.setValue("thumbnailUrl", ""); // Dosya seçildiğinde URL'yi temizle, submit'te yüklenecek
    event.target.value = ""; // Aynı dosyayı tekrar seçebilmek için input'u sıfırla
  };

  const handleImageFileChange = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Hata", description: "Lütfen bir görsel dosyası yükleyin.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Hata", description: "Görsel boyutu 5MB'dan küçük olmalıdır.", variant: "destructive" });
      return;
    }

    const newImages = [...imageInputs];
    newImages[index].file = file;
    newImages[index].imageUrl = URL.createObjectURL(file); // Önizleme için URL
    newImages[index].isUploading = false; // Henüz yüklenmedi
    setImageInputs(newImages);
    event.target.value = ""; // Aynı dosyayı tekrar seçebilmek için input'u sıfırla
  };


  const handleSubmit = async (values: TestFormValues) => {
    if (!user) {
      toast({ title: "Hata", description: "Kullanıcı bulunamadı.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      let finalThumbnailUrl = values.thumbnailUrl || ""; // Eğer URL girilmişse onu kullan

      // 1. Thumbnail yüklemesi (eğer dosya seçilmişse)
      if (thumbnailFile) {
        try {
          finalThumbnailUrl = await uploadFileToStorage(thumbnailFile, 'test-thumbnails');
        } catch (error) {
          console.error("Thumbnail yükleme hatası:", error);
          toast({ title: "Hata", description: "Kapak fotoğrafı yüklenirken bir hata oluştu.", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Görselleri işle ve yükle
      const processedQuestions = await Promise.all(
        imageInputs.map(async (imgInput, idx) => {
          setImageInputs(prev => prev.map(item => item.id === imgInput.id ? { ...item, isUploading: true, error: undefined } : item));
          let imageUrl = imgInput.imageUrl;

          if (imgInput.file) { // Eğer dosya varsa yükle
            try {
              imageUrl = await uploadFileToStorage(imgInput.file, 'test-images');
              setImageInputs(prev => prev.map(item => item.id === imgInput.id ? { ...item, imageUrl, isUploading: false, file: undefined } : item));
            } catch (error) {
              console.error(`Görsel #${idx + 1} yükleme hatası:`, error);
              setImageInputs(prev => prev.map(item => item.id === imgInput.id ? { ...item, isUploading: false, error: "Yükleme başarısız" } : item));
              throw new Error(`Görsel #${idx + 1} yüklenemedi.`); // Promise.all'u durdur
            }
          } else if (!imgInput.imageUrl.startsWith('http')) {
             // Eğer URL değilse ve dosya da yoksa bu bir hata (örneğin sadece blob: URL kalmışsa)
             // Ancak zaten zod validasyonu URL olmasını istiyor, bu durum pek olası değil.
             // Yine de güvenlik için kontrol eklenebilir.
             console.warn(`Görsel #${idx + 1} için geçerli bir URL veya dosya bulunamadı.`);
          }
          
          if (!imageUrl) { // Eğer hiçbir şekilde URL elde edilemediyse
            setImageInputs(prev => prev.map(item => item.id === imgInput.id ? { ...item, isUploading: false, error: "Geçerli görsel yok" } : item));
            throw new Error(`Görsel #${idx + 1} için geçerli bir görsel kaynağı bulunamadı.`);
          }

          return {
            imageUrl: imageUrl,
            answers: imgInput.answers,
            // question: "Bu görselde ne görüyorsunuz?" // Bu sabitse ve gerekliyse ekleyin
          };
        })
      );
      
      if (!finalThumbnailUrl && processedQuestions.length > 0 && processedQuestions[0].imageUrl) {
        finalThumbnailUrl = processedQuestions[0].imageUrl; // İlk görseli thumbnail yap
      }


      const testData = {
        title: values.title,
        description: values.description || "",
        categoryId: values.categoryId,
        creatorId: user.uid,
        creatorUsername: user.displayName || user.email?.split('@')[0] || "Anonim",
        questions: processedQuestions,
        thumbnailUrl: finalThumbnailUrl,
        isPublic: values.isPublic,
        isAnonymous: values.isAnonymous,
        // createdAt, updatedAt, scoreCounts vb. createTest helper'ı içinde halledilmeli
        // approved: true, // Firebase helper'da yönetilmeli
        // featured: false // Firebase helper'da yönetilmeli
      };

      const createdTest = await createTest(testData);

      toast({
        title: "Test başarıyla oluşturuldu",
        description: "Testiniz yayında!",
        variant: "default",
      });

      navigate(`/test/${createdTest.id}`);

    } catch (error: any) {
      console.error("Test oluşturma hatası:", error);
      toast({
        title: "Test Oluşturma Hatası",
        description: error.message || "Test oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      // Hata durumunda bile bireysel yükleme durumlarını sıfırla
      setImageInputs(prev => prev.map(item => ({ ...item, isUploading: false })));
    }
  };

  const addImage = () => {
    setImageInputs([...imageInputs, { id: createId(), imageUrl: "", answers: [], tempAnswer: "" }]);
  };

  const removeImage = (id: string) => {
    if (imageInputs.length <= 1) {
      toast({ title: "Uyarı", description: "En az bir görsel eklenmelidir.", variant: "default" });
      return;
    }
    setImageInputs(imageInputs.filter(img => img.id !== id));
  };

  const updateImageUrlInput = (id: string, url: string) => {
    setImageInputs(
      imageInputs.map(img => (img.id === id ? { ...img, imageUrl: url, file: undefined } : img)) // URL girilince dosyayı temizle
    );
  };

  const addAnswer = (id: string) => {
    const imgIndex = imageInputs.findIndex(img => img.id === id);
    if (imgIndex === -1 || !imageInputs[imgIndex].tempAnswer.trim()) return;

    const newImages = [...imageInputs];
    newImages[imgIndex].answers = [...newImages[imgIndex].answers, newImages[imgIndex].tempAnswer.trim()];
    newImages[imgIndex].tempAnswer = "";
    setImageInputs(newImages);
  };

  const removeAnswer = (imageId: string, answerIndex: number) => {
    const imgIndex = imageInputs.findIndex(img => img.id === imageId);
    if (imgIndex === -1) return;

    const newImages = [...imageInputs];
    newImages[imgIndex].answers.splice(answerIndex, 1);
    setImageInputs(newImages);
  };

  const updateTempAnswer = (id: string, value: string) => {
    setImageInputs(
      imageInputs.map(img => (img.id === id ? { ...img, tempAnswer: value } : img))
    );
  };

  const handleEnterKey = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAnswer(id);
    }
  };

  // Giriş yapmamış kullanıcı için erken dönüş
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

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Yeni Test Oluştur</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Test Bilgileri Kartı */}
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
                  <FormDescription>Testinizi tanımlayan kısa ve açıklayıcı bir başlık girin.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Açıklama (Opsiyonel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Örn: Bu test, sanat tarihi boyunca tanınmış tabloları içerir..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Testiniz hakkında detaylı bilgi verin.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Kategori</FormLabel>
                  <Select
                    disabled={categoriesLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={categoriesLoading ? "Kategoriler yükleniyor..." : "Kategori seçin"} />
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
                  <FormDescription>Testinizin en uygun kategorisini seçin.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Herkese Açık</FormLabel>
                      <FormDescription>Bu test tüm kullanıcılar tarafından görülebilir.</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isAnonymous"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Anonim Olarak Paylaş</FormLabel>
                      <FormDescription>Testi oluşturan kullanıcı bilgisi gizlenir.</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Thumbnail Yükleme Alanı */}
            <FormField
                control={form.control}
                name="thumbnailUrl" // Zod şeması bu alanı bekliyor, submit'te URL ile dolacak
                render={({ field }) => ( // field'ı doğrudan kullanmıyoruz ama react-hook-form için gerekli
                <FormItem className="mt-6">
                  <FormLabel>Kapak Fotoğrafı (Opsiyonel)</FormLabel>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex-1">
                      <FormControl>
                        <>
                          <Input
                            type="url"
                            placeholder="https://.../kapak.jpg veya dosya yükleyin"
                            value={field.value || ""} // Eğer thumbnailFile seçilirse burası form submit'te URL ile dolacak
                            onChange={(e) => {
                                field.onChange(e.target.value); // Form değerini güncelle
                                setThumbnailPreview(e.target.value); // URL girilince önizlemeyi güncelle
                                setThumbnailFile(null); // URL girilince dosyayı temizle
                            }}
                            disabled={isSubmitting}
                            className="mb-2"
                          />
                          <label htmlFor="thumbnail-upload" className="flex items-center justify-center cursor-pointer w-full py-2 px-3 border border-dashed rounded text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                            <input
                              id="thumbnail-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleThumbnailFileChange}
                              disabled={isSubmitting}
                            />
                            <Upload className="h-4 w-4 mr-2" />
                            {isSubmitting && thumbnailFile ? 'Yükleniyor...' : 'Bilgisayardan Seç'}
                          </label>
                        </>
                      </FormControl>
                      <FormDescription className="mt-2">
                        Testiniz için öne çıkan bir görsel. (Max 5MB)
                      </FormDescription>
                      <FormMessage />
                    </div>
                    
                    {thumbnailPreview ? (
                      <div className="w-32 h-32 flex items-center justify-center border rounded overflow-hidden bg-muted">
                        <img
                          src={thumbnailPreview}
                          alt="Kapak Fotoğrafı Önizleme"
                          className="max-w-full max-h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-32 flex flex-col items-center justify-center border rounded bg-muted/30 text-muted-foreground">
                        <Image className="h-10 w-10  mb-2" />
                        <span className="text-xs text-center px-2">Kapak Fotoğrafı</span>
                      </div>
                    )}
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Görseller ve Cevaplar Kartı */}
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Görseller ve Cevaplar</h2>

            {imageInputs.map((image, index) => (
              <div key={image.id} className="mb-6 p-4 border rounded-md bg-muted/20 relative">
                {imageInputs.length > 1 && (
                    <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeImage(image.id)}
                    disabled={isSubmitting}
                    >
                    <Trash className="h-4 w-4" />
                    </Button>
                )}

                <h3 className="font-medium mb-1 text-sm">Görsel #{index + 1}</h3>
                {image.isUploading && <p className="text-xs text-blue-500">Yükleniyor...</p>}
                {image.error && <p className="text-xs text-red-500">{image.error}</p>}
                
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start mt-2">
                  {/* Sol Taraf: URL Input ve Dosya Yükleme */}
                  <div>
                    <FormLabel htmlFor={`image-url-${image.id}`} className="text-xs">Görsel URL</FormLabel>
                    <Input
                      id={`image-url-${image.id}`}
                      type="url"
                      placeholder="https://.../gorsel.jpg"
                      value={image.imageUrl.startsWith('blob:') ? '' : image.imageUrl} // blob URL'leri gösterme, dosya seçildi demek
                      onChange={(e) => updateImageUrlInput(image.id, e.target.value)}
                      disabled={isSubmitting || image.isUploading}
                      className="mb-2"
                    />
                    <label htmlFor={`image-file-${image.id}`} className="flex items-center justify-center cursor-pointer w-full py-2 px-3 border border-dashed rounded text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                      <input
                        id={`image-file-${image.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageFileChange(index, e)} // index kullanmaya devam
                        disabled={isSubmitting || image.isUploading}
                      />
                      <Upload className="h-4 w-4 mr-2" />
                      {image.isUploading ? 'Yükleniyor...' : (image.file ? `${image.file.name.substring(0,15)}...` : 'Bilgisayardan Seç')}
                    </label>
                  </div>

                  {/* Sağ Taraf: Görsel Önizleme */}
                  <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center border rounded bg-muted/30 text-muted-foreground overflow-hidden shrink-0">
                    {image.imageUrl ? (
                      <img
                        src={image.imageUrl}
                        alt={`Görsel ${index + 1} Önizleme`}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; /* veya placeholder */ }}
                      />
                    ) : (
                      <Image className="h-8 w-8 md:h-12 md:h-12" />
                    )}
                  </div>
                </div>
                
                {/* Cevap Ekleme Alanı */}
                <div className="mt-4">
                  <FormLabel className="text-xs">Kabul Edilebilir Cevaplar (En az 1)</FormLabel>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Cevap ekle (Enter ile)"
                      value={image.tempAnswer}
                      onChange={(e) => updateTempAnswer(image.id, e.target.value)}
                      onKeyDown={(e) => handleEnterKey(e, image.id)}
                      disabled={isSubmitting || image.isUploading}
                    />
                    <Button type="button" size="sm" onClick={() => addAnswer(image.id)} disabled={isSubmitting || image.isUploading}>
                      Ekle
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name={`images.${index}.answers`} // Bu form validasyonu için
                    render={() => ( // Sadece FormMessage'ı göstermek için render kullanılıyor
                      <FormMessage className="mt-1" />
                    )}
                  />
                  {image.answers.length === 0 && !form.formState.errors.images?.[index]?.answers && (
                     <p className="text-xs text-muted-foreground mt-1">Henüz cevap eklenmedi.</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {image.answers.map((answer, ansIndex) => (
                      <div key={ansIndex} className="flex items-center bg-primary/10 text-primary rounded px-2 py-1 text-sm">
                        <span className="mr-2">{answer}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0 opacity-60 hover:opacity-100"
                          onClick={() => removeAnswer(image.id, ansIndex)}
                          disabled={isSubmitting || image.isUploading}
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
              <div className="text-center p-6 border rounded-md bg-muted/20">
                <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-3">Teste en az bir görsel eklemelisiniz.</p>
              </div>
            )}

            <Button type="button" variant="outline" onClick={addImage} className="w-full mt-2" disabled={isSubmitting}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Görsel Alanı Ekle
            </Button>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button type="button" variant="outline" onClick={() => navigate("/")} disabled={isSubmitting}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting || !form.formState.isValid || categoriesLoading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                "Testi Oluştur"
              )}
            </Button>
          </div>
          {/* Form Hatalarını Göstermek İçin (Opsiyonel Debug) */}
          {/* <pre>{JSON.stringify(form.formState.errors, null, 2)}</pre> */}
        </form>
      </Form>
    </div>
  );
}