import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MessageSquare, Phone, Send } from 'lucide-react';

export default function Support() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Destek Merkezi</h1>
          <p className="text-muted-foreground">
            Size nasıl yardımcı olabileceğimizi öğrenmek için aşağıdaki seçenekleri kullanabilirsiniz.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                İletişim Formu
              </CardTitle>
              <CardDescription>
                Sorularınızı veya geri bildirimlerinizi bizimle paylaşın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Adınız
                  </label>
                  <Input id="name" placeholder="Adınızı girin" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    E-posta Adresiniz
                  </label>
                  <Input id="email" type="email" placeholder="ornek@email.com" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Mesajınız
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Mesajınızı buraya yazın..."
                    className="min-h-[150px]"
                  />
                </div>
                <Button className="w-full gap-2">
                  <Send className="w-4 h-4" />
                  Gönder
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  E-posta ile İletişim
                </CardTitle>
                <CardDescription>
                  Doğrudan e-posta göndermek için
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  destek@pixelhunt.com
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Telefon ile İletişim
                </CardTitle>
                <CardDescription>
                  Çalışma saatleri: Pazartesi - Cuma, 09:00 - 18:00
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  +90 (212) XXX XX XX
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sık Sorulan Sorular</CardTitle>
            <CardDescription>
              En çok sorulan sorular ve cevapları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Nasıl hesap oluşturabilirim?</h3>
              <p className="text-sm text-muted-foreground">
                Sağ üst köşedeki "Giriş Yap" butonuna tıklayarak kayıt olabilirsiniz.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Şifremi unuttum, ne yapmalıyım?</h3>
              <p className="text-sm text-muted-foreground">
                Giriş sayfasındaki "Şifremi Unuttum" bağlantısını kullanarak şifrenizi sıfırlayabilirsiniz.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Ödeme işlemlerinde sorun yaşıyorum</h3>
              <p className="text-sm text-muted-foreground">
                Lütfen bankanızla iletişime geçin veya destek ekibimizle iletişime geçin.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 