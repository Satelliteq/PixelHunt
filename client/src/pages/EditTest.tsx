import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/AuthContext";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { createId } from '@paralleldrive/cuid2';
import { getAllCategories, getTestById, updateTest } from '@/lib/firebaseHelpers';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { AlertTriangle, Trash, Upload, Plus, Image, Loader2, ArrowLeft, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const testFormSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır").max(100, "Başlık en fazla 100 karakter olabilir"),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır").max(500, "Açıklama en fazla 500 karakter olabilir").optional().default(""),
  categoryId: z.string().min(1, "Lütfen bir kategori seçin"),
  isPublic: z.boolean().default(true),
  isAnonymous: z.boolean().default(false),
  thumbnailUrl: z.string().url("Geçerli bir URL girin veya boş bırakın").optional().default(""),
  images: z.array(
    z.object({
      imageUrl: z.string().url("Görsel için geçerli bir URL girmelisiniz"),
      answers: z.array(z.string().min(1, "Cevap boş olamaz")).min(1, "En az bir cevap girmelisiniz")
    })
  ).min(1, "En az bir görsel eklemelisiniz"),
});

type TestFormValues = z.infer<typeof testFormSchema>;

export default function EditTest() {
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const testId = location.split("/").pop();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [imageInputs, setImageInputs] = useState<{
    id: string;
    imageUrl: string;
    answers: string[];
    tempAnswer: string;
  }[]>([]);

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

  // Kategorileri getir
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getAllCategories
  });

  // Test verilerini getir
  const { data: test, isLoading: isLoadingTest } = useQuery({
    queryKey: ['test', testId],
    queryFn: () => getTestById(testId || ''),
    enabled: !!testId
  });

  // Test verilerini form alanlarına doldur
  useEffect(() => {
    if (test) {
      console.log('Test verileri:', test);
      console.log('Test soruları:', test.questions);
      
      form.reset({
        title: test.title,
        description: test.description,
        categoryId: test.categoryId || '',
        isPublic: test.isPublic,
        isAnonymous: test.isAnonymous,
        thumbnailUrl: test.thumbnailUrl || '',
        images: test.questions.map(q => ({
          imageUrl: q.imageUrl || '',
          answers: q.answers || q.options || []
        }))
      });

      setThumbnailPreview(test.thumbnailUrl || '');
      setImageInputs(test.questions.map(q => ({
        id: q.id || createId(),
        imageUrl: q.imageUrl || '',
        answers: q.answers || q.options || [],
        tempAnswer: ''
      })));

      console.log('Form state:', form.getValues());
      console.log('Image inputs:', imageInputs);
    }
  }, [test, form]);

  // Form 'images' alanını imageInputs ile senkronize et
  useEffect(() => {
    const validImagesForForm = imageInputs
      .filter(img => img.imageUrl && img.answers.length > 0)
      .map(img => ({
        imageUrl: img.imageUrl,
        answers: img.answers
      }));
    
    form.setValue("images", validImagesForForm, { 
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  }, [imageInputs, form]);

  // Test güncelleme mutation'ı
  const updateTestMutation = useMutation({
    mutationFn: updateTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      toast.success("Test başarıyla güncellendi!");
      navigate("/profile");
    },
    onError: (error) => {
      toast.error("Test güncellenirken bir hata oluştu!");
      console.error("Test güncelleme hatası:", error);
    }
  });

  const addImage = () => {
    setImageInputs([...imageInputs, { 
      id: createId(), 
      imageUrl: "", 
      answers: [], 
      tempAnswer: "" 
    }]);
  };

  const removeImage = (index: number) => {
    setImageInputs(imageInputs.filter((_, i) => i !== index));
  };

  const addAnswer = (imageIndex: number) => {
    const newImageInputs = [...imageInputs];
    if (newImageInputs[imageIndex].tempAnswer.trim()) {
      newImageInputs[imageIndex].answers.push(newImageInputs[imageIndex].tempAnswer.trim());
      newImageInputs[imageIndex].tempAnswer = "";
      setImageInputs(newImageInputs);
    }
  };

  const removeAnswer = (imageIndex: number, answerIndex: number) => {
    const newImageInputs = [...imageInputs];
    newImageInputs[imageIndex].answers = newImageInputs[imageIndex].answers.filter((_, i) => i !== answerIndex);
    setImageInputs(newImageInputs);
  };

  const handleImageUpload = async (url: string, type: "thumbnail" | "question", questionIndex?: number) => {
    try {
      if (type === "thumbnail") {
        setThumbnailPreview(url);
        form.setValue("thumbnailUrl", url);
      } else if (type === "question" && questionIndex !== undefined) {
        const newImageInputs = [...imageInputs];
        newImageInputs[questionIndex].imageUrl = url;
        setImageInputs(newImageInputs);
      }
    } catch (error) {
      console.error("Resim yükleme hatası:", error);
      toast.error("Resim yüklenirken bir hata oluştu!");
    }
  };

  const handleSubmit = async (values: TestFormValues) => {
    if (!user) {
      toast({ title: "Hata", description: "Kullanıcı bulunamadı.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      // Test verilerini hazırla
      const testData = {
        id: test?.id,
        title: values.title,
        description: values.description || "",
        categoryId: values.categoryId,
        creatorId: user.uid,
        creatorUsername: user.displayName || user.email?.split('@')[0] || "Anonim",
        questions: values.images.map(img => ({
          id: createId(),
          imageUrl: img.imageUrl,
          answers: img.answers,
          question: "Bu görselde ne görüyorsunuz?"
        })),
        thumbnailUrl: values.thumbnailUrl || values.images[0]?.imageUrl || "",
        isPublic: values.isPublic,
        isAnonymous: values.isAnonymous
      };

      // Testi güncelle
      await updateTest(testData);

      toast({
        title: "Test başarıyla güncellendi",
        description: "Değişiklikleriniz kaydedildi!",
        variant: "default"
      });

      navigate(`/test/${test?.id}`);

    } catch (error: any) {
      console.error("Test güncelleme hatası:", error);
      toast({
        title: "Test Güncelleme Hatası",
        description: error.message || "Test güncellenirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingTest) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Yükleniyor...</h2>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Test Bulunamadı</h2>
          <p className="text-muted-foreground mb-4">Aradığınız test mevcut değil.</p>
          <Button onClick={() => navigate("/profile")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Profile Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => navigate("/profile")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Profile Dön
      </Button>

      <h1 className="text-3xl font-bold mb-8">Test Düzenle</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Kapak Fotoğrafı */}
          <FormField
            control={form.control}
            name="thumbnailUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kapak Görseli URL</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://..." 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      setThumbnailPreview(e.target.value);
                    }}
                  />
                </FormControl>
                <FormDescription>Testiniz için bir kapak görseli URL'si girin.</FormDescription>
                <FormMessage />
                {field.value && (
                  <div className="mt-4 relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={field.value}
                      alt="Kapak Görseli"
                      className="object-contain w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        toast({
                          title: "Görsel Yüklenemedi",
                          description: "Lütfen geçerli bir görsel URL'si girin.",
                          variant: "destructive"
                        });
                      }}
                    />
                  </div>
                )}
              </FormItem>
            )}
          />

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

            <div className="flex gap-4 mt-4">
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Herkese Açık</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isAnonymous"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Anonim Olarak Paylaş</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Görseller ve Cevaplar */}
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Görseller ve Cevaplar</h2>

            {imageInputs.map((imageInput, index) => (
              <div key={imageInput.id} className="mb-6 p-4 border rounded-md bg-muted/20 relative">
                {imageInputs.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeImage(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}

                <h3 className="font-medium mb-1 text-sm">Görsel #{index + 1}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start mt-2">
                  {/* Sol Taraf: URL Input */}
                  <div>
                    <FormLabel htmlFor={`image-url-${imageInput.id}`} className="text-xs">Görsel URL</FormLabel>
                    <Input
                      id={`image-url-${imageInput.id}`}
                      type="url"
                      placeholder="https://.../gorsel.jpg"
                      value={imageInput.imageUrl}
                      onChange={(e) => handleImageUpload(e.target.value, "question", index)}
                      className="mb-2"
                    />
                  </div>

                  {/* Sağ Taraf: Görsel Önizleme */}
                  <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center border rounded bg-muted/30 text-muted-foreground overflow-hidden shrink-0">
                    {imageInput.imageUrl ? (
                      <img
                        src={imageInput.imageUrl}
                        alt={`Görsel ${index + 1} Önizleme`}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <Image className="h-8 w-8 md:h-12 md:h-12" />
                    )}
                  </div>
                </div>

                {/* Cevaplar */}
                <div className="mt-4">
                  <FormLabel className="text-xs">Kabul Edilebilir Cevaplar (En az 1)</FormLabel>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Cevap ekle (Enter ile)"
                      value={imageInput.tempAnswer}
                      onChange={(e) => {
                        const newImageInputs = [...imageInputs];
                        newImageInputs[index].tempAnswer = e.target.value;
                        setImageInputs(newImageInputs);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addAnswer(index);
                        }
                      }}
                    />
                    <Button type="button" size="sm" onClick={() => addAnswer(index)}>
                      Ekle
                    </Button>
                  </div>
                  {imageInput.answers.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Henüz cevap eklenmedi.</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {imageInput.answers.map((answer, answerIndex) => (
                      <div key={answerIndex} className="flex items-center bg-primary/10 text-primary rounded px-2 py-1 text-sm">
                        <Input
                          value={answer}
                          onChange={(e) => {
                            const newImageInputs = [...imageInputs];
                            newImageInputs[index].answers[answerIndex] = e.target.value;
                            setImageInputs(newImageInputs);
                          }}
                          className="h-6 px-1 py-0 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0 opacity-60 hover:opacity-100"
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
              <div className="text-center p-6 border rounded-md bg-muted/20">
                <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-3">Teste en az bir görsel eklemelisiniz.</p>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={addImage}
              className="w-full mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Görsel Alanı Ekle
            </Button>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/profile")}
              className="min-w-[120px]"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[150px] bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                "Testi Güncelle"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 