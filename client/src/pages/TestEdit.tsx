import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/AuthContext";
import { createId } from '@paralleldrive/cuid2';
import { getAllCategories, getTest, updateTest } from '@/lib/firebaseHelpers';

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
import { AlertTriangle, Trash, Plus, Loader2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

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

export default function TestEdit() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [testId, setTestId] = useState<string>("");
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");

  const [imageInputs, setImageInputs] = useState<{
    id: string;
    imageUrl: string;
    answers: string[];
    tempAnswer: string;
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

  // URL'den test ID'sini al
  useEffect(() => {
    const path = window.location.pathname;
    const id = path.split('/').pop();
    if (id) {
      setTestId(id);
    }
  }, []);

  // Test verilerini yükle
  const { data: test, isLoading: testLoading } = useQuery({
    queryKey: ['test', testId],
    queryFn: () => getTest(testId),
    enabled: !!testId,
    onSuccess: (data) => {
      if (data) {
        form.reset({
          title: data.title,
          description: data.description || "",
          categoryId: data.categoryId,
          isPublic: data.isPublic,
          isAnonymous: data.isAnonymous,
          thumbnailUrl: data.thumbnailUrl || "",
          images: data.questions.map(q => ({
            imageUrl: q.imageUrl,
            answers: q.answers
          }))
        });
        setThumbnailPreview(data.thumbnailUrl || "");
        setImageInputs(
          data.questions.map(q => ({
            id: createId(),
            imageUrl: q.imageUrl,
            answers: q.answers,
            tempAnswer: ""
          }))
        );
      }
    }
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories
  });

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

  const handleSubmit = async (values: TestFormValues) => {
    if (!user) {
      toast({ title: "Hata", description: "Kullanıcı bulunamadı.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      const testData = {
        title: values.title,
        description: values.description || "",
        categoryId: values.categoryId,
        creatorId: user.uid,
        creatorUsername: user.displayName || user.email?.split('@')[0] || "Anonim",
        questions: values.images.map(img => ({
          imageUrl: img.imageUrl,
          answers: img.answers,
          question: "Bu görselde ne görüyorsunuz?"
        })),
        thumbnailUrl: values.thumbnailUrl || values.images[0]?.imageUrl || "",
        isPublic: values.isPublic,
        isAnonymous: values.isAnonymous,
        updatedAt: new Date()
      };

      await updateTest(testId, testData);

      toast({
        title: "Test başarıyla güncellendi",
        description: "Değişiklikleriniz kaydedildi!",
        variant: "default"
      });

      navigate(`/test/${testId}`);

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
      imageInputs.map(img => (img.id === id ? { ...img, imageUrl: url } : img))
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

  if (testLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Test yükleniyor...</span>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Test Bulunamadı</h2>
          <p className="mb-4">Düzenlemek istediğiniz test bulunamadı veya erişim izniniz yok.</p>
          <Button onClick={() => navigate("/profile")}>Profile Dön</Button>
        </div>
      </div>
    );
  }

  if (test.creatorId !== user?.uid) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Erişim Reddedildi</h2>
          <p className="mb-4">Bu testi düzenleme yetkiniz yok.</p>
          <Button onClick={() => navigate("/profile")}>Profile Dön</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Testi Düzenle</h1>
      
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Görseller ve Cevaplar</h2>
              <Button type="button" onClick={addImage} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Görsel Ekle
              </Button>
            </div>

            <div className="space-y-6">
              {imageInputs.map((input, index) => (
                <div key={input.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-medium">Görsel {index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImage(input.id)}
                      disabled={imageInputs.length <= 1}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Görsel URL</label>
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={input.imageUrl}
                        onChange={(e) => updateImageUrlInput(input.id, e.target.value)}
                      />
                    </div>

                    {input.imageUrl && (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={input.imageUrl}
                          alt={`Görsel ${index + 1}`}
                          className="object-contain w-full h-full"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium mb-2 block">Cevaplar</label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Cevap ekleyin..."
                          value={input.tempAnswer}
                          onChange={(e) => updateTempAnswer(input.id, e.target.value)}
                          onKeyDown={(e) => handleEnterKey(e, input.id)}
                        />
                        <Button
                          type="button"
                          onClick={() => addAnswer(input.id)}
                          disabled={!input.tempAnswer.trim()}
                        >
                          Ekle
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {input.answers.map((answer, answerIndex) => (
                          <Badge
                            key={answerIndex}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {answer}
                            <button
                              type="button"
                              onClick={() => removeAnswer(input.id, answerIndex)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button type="button" variant="outline" onClick={() => navigate("/profile")} disabled={isSubmitting}>
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || categoriesLoading}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Değişiklikler Kaydediliyor...
                </>
              ) : (
                "Değişiklikleri Kaydet"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 