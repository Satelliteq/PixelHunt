import React from "react";
import { Mail, Phone, MapPin, Twitter, Instagram, Facebook, Send, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Form validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, {
    message: "İsim en az 2 karakter olmalıdır.",
  }),
  email: z.string().email({
    message: "Geçerli bir e-posta adresi giriniz.",
  }),
  subject: z.string().min(5, {
    message: "Konu en az 5 karakter olmalıdır.",
  }),
  message: z.string().min(10, {
    message: "Mesaj en az 10 karakter olmalıdır.",
  }),
  reason: z.string({
    required_error: "Lütfen bir iletişim nedeni seçin.",
  }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const { toast } = useToast();
  
  // Initialize form
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      reason: "",
    },
  });

  // Handle form submission
  const onSubmit = (data: ContactFormValues) => {
    // In a real app, you would send this data to your backend
    console.log("Form data:", data);
    
    // Show success message
    toast({
      title: "Mesajınız gönderildi!",
      description: "En kısa sürede size dönüş yapacağız.",
    });
    
    // Reset form
    form.reset();
  };

  return (
    <main className="max-w-content py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">İletişim</h1>
        <p className="text-muted-foreground">
          Sorularınız, önerileriniz veya geri bildirimleriniz için bizimle iletişime geçebilirsiniz.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Mail className="h-5 w-5 mr-2 text-primary" /> E-posta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm">
              7/24 bize e-posta gönderin, en kısa sürede dönüş yapacağız.
            </CardDescription>
            <a 
              href="mailto:iletisim@pixelhunt.com" 
              className="text-sm mt-3 text-primary hover:underline flex items-center"
            >
              iletisim@pixelhunt.com
              <Send className="h-3 w-3 ml-1" />
            </a>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Phone className="h-5 w-5 mr-2 text-primary" /> Telefon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm">
              Hafta içi 9:00 - 18:00 saatleri arasında bizi arayabilirsiniz.
            </CardDescription>
            <a 
              href="tel:+902121234567" 
              className="text-sm mt-3 text-primary hover:underline flex items-center"
            >
              +90 212 123 45 67
              <Send className="h-3 w-3 ml-1" />
            </a>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <MessageSquare className="h-5 w-5 mr-2 text-primary" /> Sosyal Medya
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm">
              Sosyal medya hesaplarımızdan da bize ulaşabilirsiniz.
            </CardDescription>
            <div className="flex items-center mt-4 space-x-4">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
        <div className="lg:col-span-3">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Bize Yazın</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adınız Soyadınız</FormLabel>
                      <FormControl>
                        <Input placeholder="Adınız Soyadınız" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-posta Adresiniz</FormLabel>
                      <FormControl>
                        <Input placeholder="ornek@mail.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İletişim Nedeni</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="İletişim nedeninizi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">Genel Bilgi</SelectItem>
                          <SelectItem value="support">Teknik Destek</SelectItem>
                          <SelectItem value="feedback">Geri Bildirim</SelectItem>
                          <SelectItem value="partnership">İş Birliği</SelectItem>
                          <SelectItem value="other">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konu</FormLabel>
                      <FormControl>
                        <Input placeholder="Mesaj konusu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mesajınız</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Mesajınızı buraya yazın..." 
                        className="min-h-[150px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full sm:w-auto">
                Mesajı Gönder
              </Button>
            </form>
          </Form>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ekibimiz</CardTitle>
              <CardDescription>Pixelhunt'ın arkasındaki yaratıcı ekip</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  AA
                </div>
                <div>
                  <p className="text-sm font-medium">Ali Aydın</p>
                  <p className="text-xs text-muted-foreground">Kurucu & Baş Tasarımcı</p>
                  <p className="text-xs mt-1">
                    <a href="mailto:ali@pixelhunt.com" className="text-primary hover:underline">ali@pixelhunt.com</a>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  MY
                </div>
                <div>
                  <p className="text-sm font-medium">Merve Yılmaz</p>
                  <p className="text-xs text-muted-foreground">Yazılım Geliştirme Lideri</p>
                  <p className="text-xs mt-1">
                    <a href="mailto:merve@pixelhunt.com" className="text-primary hover:underline">merve@pixelhunt.com</a>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  CK
                </div>
                <div>
                  <p className="text-sm font-medium">Can Kaya</p>
                  <p className="text-xs text-muted-foreground">İçerik Yöneticisi</p>
                  <p className="text-xs mt-1">
                    <a href="mailto:can@pixelhunt.com" className="text-primary hover:underline">can@pixelhunt.com</a>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  ZT
                </div>
                <div>
                  <p className="text-sm font-medium">Zeynep Tekin</p>
                  <p className="text-xs text-muted-foreground">Kullanıcı Deneyimi Tasarımcısı</p>
                  <p className="text-xs mt-1">
                    <a href="mailto:zeynep@pixelhunt.com" className="text-primary hover:underline">zeynep@pixelhunt.com</a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Çalışma Saatleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Pazartesi - Cuma</span>
                  <span className="text-sm">09:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Cumartesi</span>
                  <span className="text-sm">10:00 - 14:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Pazar</span>
                  <span className="text-sm">Kapalı</span>
                </div>
                <Separator className="my-2" />
                <p className="text-xs text-muted-foreground">
                  Resmi tatillerde çalışma saatlerimiz değişiklik gösterebilir.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-6">Sık Sorulan Sorular</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Testlerimi nasıl oluşturabilirim?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Test oluşturmak için önce hesabınıza giriş yapmalısınız. Ardından "Test Oluştur" butonuna tıklayarak adımları takip edebilirsiniz. Kendi görsellerinizi yükleyebilir veya mevcut kategorilerden seçim yapabilirsiniz.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ödeme seçenekleri nelerdir?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Pixelhunt platformunda temel hizmetler ücretsizdir. Premium özellikler için aylık veya yıllık abonelik planlarımız mevcuttur. Kredi kartı, banka kartı veya PayPal ile ödeme yapabilirsiniz.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Testleri arkadaşlarımla nasıl paylaşabilirim?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Her testin kendi benzersiz bir bağlantısı vardır. Test sayfasından "Paylaş" butonuna tıklayarak doğrudan sosyal medyada paylaşabilir veya bağlantıyı kopyalayabilirsiniz.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hesabımı nasıl silebilirim?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Hesap ayarlarınıza giderek "Hesabı Sil" seçeneğini kullanabilirsiniz. Hesabınızı silmeden önce oluşturduğunuz içeriklerin durumu hakkında bilgilendirme yapılacaktır.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Daha fazla soru için destek merkezimizi ziyaret edebilir veya doğrudan bizimle iletişime geçebilirsiniz.
          </p>
          <Button variant="outline">Destek Merkezi</Button>
        </div>
      </div>
    </main>
  );
}