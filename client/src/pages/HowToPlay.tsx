import React from "react";
import { Users, Image, Info, Sparkles, BookText, Trophy, UserPlus, ArrowRight, Timer, Zap, Brain, GamepadIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function HowToPlay() {
  return (
    <div className="max-w-content mx-auto py-10 px-4 md:px-0">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 text-card-foreground">Pixelhunt Nasıl Oynanır?</h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto">
          Görsellerinizi tanıma yeteneklerinizi sınayın, farklı oyun modlarında eğlenin ve kendi testlerinizi oluşturun.
        </p>
      </div>
      
      <div className="bg-card border rounded-xl overflow-hidden shadow-lg mb-12">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <p className="text-lg">Pixelhunt'ta testler aracılığıyla görsellerinizi tanıma yeteneklerinizi geliştirirsiniz:</p>
            <ol className="list-decimal ml-5 space-y-2">
              <li>Temaya uygun görsel setlerinden oluşan testleri seçebilirsiniz.</li>
              <li>Görseller kademeli olarak açılır ve doğru cevabı bulmanız gerekir.</li>
              <li>Ne kadar az açılmış görüntüyle doğru cevabı bulursanız, o kadar yüksek puan alırsınız.</li>
              <li>Testleri tamamladıkça puan kazanır ve sıralamada yükselirsiniz.</li>
              <li>Farklı zorluk seviyelerinde testler bulabilirsiniz.</li>
              <li>Kendi testlerinizi oluşturarak toplulukla paylaşabilirsiniz.</li>
            </ol>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-muted/40 p-4 rounded-lg border">
                <h3 className="font-bold text-lg flex items-center mb-2">
                  <GamepadIcon className="w-5 h-5 mr-2 text-primary" /> Puan Sistemi
                </h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex justify-between">
                    <span>Görüntünün %10'u açıkken:</span>
                    <Badge variant="default" className="ml-2">100 puan</Badge>
                  </li>
                  <li className="flex justify-between">
                    <span>Görüntünün %30'u açıkken:</span>
                    <Badge variant="default" className="ml-2">70 puan</Badge>
                  </li>
                  <li className="flex justify-between">
                    <span>Görüntünün %50'si açıkken:</span>
                    <Badge variant="default" className="ml-2">50 puan</Badge>
                  </li>
                  <li className="flex justify-between">
                    <span>Görüntünün %70'i açıkken:</span>
                    <Badge variant="default" className="ml-2">30 puan</Badge>
                  </li>
                  <li className="flex justify-between">
                    <span>Görüntünün %90'ı açıkken:</span>
                    <Badge variant="default" className="ml-2">10 puan</Badge>
                  </li>
                </ul>
              </div>
              
              <div className="bg-muted/40 p-4 rounded-lg border">
                <h3 className="font-bold text-lg flex items-center mb-2">
                  <Brain className="w-5 h-5 mr-2 text-primary" /> Test İpuçları
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <Badge variant="outline" className="mt-0.5 mr-2 bg-amber-500/10 border-amber-200 text-amber-700">İpucu</Badge>
                    <span>Her soruya dikkatlice bakın, detaylar önemlidir</span>
                  </li>
                  <li className="flex items-start">
                    <Badge variant="outline" className="mt-0.5 mr-2 bg-amber-500/10 border-amber-200 text-amber-700">İpucu</Badge>
                    <span>Doğru yazıma dikkat edin, benzer kelimeler kabul edilmeyebilir</span>
                  </li>
                  <li className="flex items-start">
                    <Badge variant="outline" className="mt-0.5 mr-2 bg-amber-500/10 border-amber-200 text-amber-700">İpucu</Badge>
                    <span>Test oluştururken açık ve anlaşılır sorular hazırlayın</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="browse" className="mb-12">
        <TabsList className="mb-6 custom-tab-bg rounded-xl p-1 flex bg-opacity-50">
          <TabsTrigger value="browse" className="data-[state=active]:bg-background rounded-lg text-sm px-4">
            Test Bulma
          </TabsTrigger>
          <TabsTrigger value="play" className="data-[state=active]:bg-background rounded-lg text-sm px-4">
            Test Çözme
          </TabsTrigger>
          <TabsTrigger value="create" className="data-[state=active]:bg-background rounded-lg text-sm px-4">
            Test Oluşturma
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border rounded-lg overflow-hidden shadow-md">
              <div className="p-4">
                <h3 className="font-bold text-lg flex items-center mb-2">
                  <BookText className="mr-2 h-5 w-5 text-primary" /> Test Bulma ve Keşfetme
                </h3>
                <p className="text-sm mb-4">Pixelhunt'ta ilgi alanınıza ve beceri seviyenize göre testler bulabilirsiniz.</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <div className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">1</div>
                    <span>Ana sayfadan popüler ve öne çıkan testlere göz atın</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">2</div>
                    <span>Kategorilere göre testleri filtreleyin</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">3</div>
                    <span>Arama çubuğunu kullanarak özel testler bulun</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg overflow-hidden shadow-md">
              <div className="p-4">
                <h3 className="font-bold text-lg flex items-center mb-3">
                  <BookText className="mr-2 h-5 w-5 text-primary" /> Testleri Sıralama
                </h3>
                <div className="space-y-4">
                  <div className="p-3 rounded-md border bg-muted/30">
                    <h4 className="font-medium text-sm mb-2">Popülerliğe Göre</h4>
                    <div className="flex justify-between text-sm">
                      <span>En çok oynanan</span>
                      <span className="text-primary">🔥</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>En çok beğenilen</span>
                      <span className="text-primary">❤️</span>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-md border bg-muted/30">
                    <h4 className="font-medium text-sm mb-2">Kategorilere Göre</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Filmler</Badge>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">Oyunlar</Badge>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Doğa</Badge>
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-200">Bilim</Badge>
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">Diğer</Badge>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-md border bg-muted/30">
                    <h4 className="font-medium text-sm mb-2">Tarihe Göre</h4>
                    <div className="flex justify-between text-sm">
                      <span>Yeni eklenenler</span>
                      <span className="text-primary">✨</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Öne çıkan testler</span>
                      <span className="text-primary">🌟</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="play">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border rounded-lg overflow-hidden shadow-md md:col-span-2">
              <div className="p-4">
                <h3 className="font-bold text-lg flex items-center mb-4">
                  <Image className="mr-2 h-5 w-5 text-primary" /> Test Çözme Adımları
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-primary">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Testi Başlat</h4>
                      <p className="text-sm text-muted-foreground">Test sayfasında "Oyna" butonuna tıklayın</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-primary">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Görseli İncele</h4>
                      <p className="text-sm text-muted-foreground">Kısmen açılan görseli dikkatlice inceleyin</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-primary">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Tahmin Et</h4>
                      <p className="text-sm text-muted-foreground">Tahminlerinizi metin kutusuna yazıp "Tahmin Et" butonuna tıklayın</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-primary">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Sonuçlarınızı Görün</h4>
                      <p className="text-sm text-muted-foreground">Tüm soruları cevapladıktan sonra puanınızı ve sonuçlarınızı görüntüleyin</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg overflow-hidden shadow-md">
              <div className="p-4">
                <h3 className="font-bold text-lg flex items-center mb-3">
                  <Zap className="mr-2 h-5 w-5 text-primary" /> Oyun Sonrası Etkileşim
                </h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <h4 className="font-medium text-sm mb-1 flex items-center">
                      <span className="text-lg mr-2">❤️</span> Beğen
                    </h4>
                    <p className="text-xs text-muted-foreground">Beğendiğiniz testleri işaretleyin</p>
                  </div>
                  
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <h4 className="font-medium text-sm mb-1 flex items-center">
                      <span className="text-lg mr-2">💬</span> Yorum Yap
                    </h4>
                    <p className="text-xs text-muted-foreground">Test hakkında yorumlarınızı paylaşın</p>
                  </div>
                  
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <h4 className="font-medium text-sm mb-1 flex items-center">
                      <span className="text-lg mr-2">🔄</span> Tekrar Oyna
                    </h4>
                    <p className="text-xs text-muted-foreground">Daha yüksek puan için tekrar deneyin</p>
                  </div>
                  
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <h4 className="font-medium text-sm mb-1 flex items-center">
                      <span className="text-lg mr-2">🏆</span> Sıralamayı Kontrol Et
                    </h4>
                    <p className="text-xs text-muted-foreground">Liderlik tablosundaki yerinizi görün</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="create">
          <div className="bg-card border rounded-lg overflow-hidden shadow-md">
            <div className="aspect-[21/9] relative overflow-hidden">
              <img 
                src="/attached_assets/6c161a984b072640f8d7cde4b759f0a8.jpg" 
                alt="Test creation interface" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                <div className="text-white">
                  <h3 className="text-xl font-bold">Kendi Testinizi Oluşturun</h3>
                  <p className="opacity-80">Yaratıcılığınızı gösterin, topluluğa katkıda bulunun</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-lg flex items-center mb-4">
                    <Sparkles className="mr-2 h-5 w-5 text-primary" /> Test Oluşturma Adımları
                  </h3>
                  <ol className="space-y-3">
                    <li className="flex items-start">
                      <div className="bg-primary/10 text-primary rounded-full min-w-6 h-6 flex items-center justify-center mr-2 mt-0.5">1</div>
                      <div>
                        <p className="font-medium">Test Oluştur Butonuna Tıklayın</p>
                        <p className="text-sm text-muted-foreground">Ana menüde "Test Oluştur" butonunu bulun</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-primary/10 text-primary rounded-full min-w-6 h-6 flex items-center justify-center mr-2 mt-0.5">2</div>
                      <div>
                        <p className="font-medium">Test Bilgilerini Girin</p>
                        <p className="text-sm text-muted-foreground">Başlık, açıklama ve kategori belirleyin</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-primary/10 text-primary rounded-full min-w-6 h-6 flex items-center justify-center mr-2 mt-0.5">3</div>
                      <div>
                        <p className="font-medium">Görselleri Ekleyin</p>
                        <p className="text-sm text-muted-foreground">"Görsel Ekle" ile testinize resimler ekleyin</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-primary/10 text-primary rounded-full min-w-6 h-6 flex items-center justify-center mr-2 mt-0.5">4</div>
                      <div>
                        <p className="font-medium">Doğru Cevapları Belirleyin</p>
                        <p className="text-sm text-muted-foreground">Her görsel için kabul edilebilir cevaplar tanımlayın</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-primary/10 text-primary rounded-full min-w-6 h-6 flex items-center justify-center mr-2 mt-0.5">5</div>
                      <div>
                        <p className="font-medium">Yayınlayın</p>
                        <p className="text-sm text-muted-foreground">Önizlemeyi kontrol edip "Yayınla" butonuna tıklayın</p>
                      </div>
                    </li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg flex items-center mb-4">
                    <Sparkles className="mr-2 h-5 w-5 text-primary" /> Test Yönetimi
                  </h3>
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <h4 className="font-medium mb-1">Görsel İpuçları</h4>
                      <p className="text-sm text-muted-foreground">Görsellerin aşamalı olarak açılması için kaliteli ve tanınabilir resimler seçin</p>
                    </div>
                    
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <h4 className="font-medium mb-1">Test Düzenleme</h4>
                      <p className="text-sm text-muted-foreground">Oluşturduğunuz testleri istediğiniz zaman düzenleyebilir veya güncelleyebilirsiniz</p>
                    </div>
                    
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <h4 className="font-medium mb-1">Topluluk Etkileşimi</h4>
                      <p className="text-sm text-muted-foreground">Kullanıcıların yorumlarını okuyabilir ve testlerinizin popülerliğini takip edebilirsiniz</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Badge variant="outline" className="bg-green-500/10 border-green-200">Yaratıcılık</Badge>
                      <Badge variant="outline" className="bg-blue-500/10 border-blue-200">Paylaşım</Badge>
                      <Badge variant="outline" className="bg-purple-500/10 border-purple-200">Topluluk</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-primary" /> Puan Sıralaması
            </CardTitle>
            <CardDescription>Nasıl sıralamaya girerim?</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Testlerde elde ettiğiniz puanlar, genel sıralamanızı belirler. Test çözdükçe ve yüksek puanlar aldıkça sıralamada yükselirsiniz. Aylık ve haftalık sıralamalar düzenli olarak sıfırlanır, böylece herkes lider tablosunda yer alma şansı elde eder. Ayrıca, oluşturduğunuz testlerin popülerliği de profilinizin değerini artırır.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="mr-2 h-5 w-5 text-primary" /> Hesap Oluşturma
            </CardTitle>
            <CardDescription>Neden hesap oluşturmalıyım?</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Hesap oluşturarak ilerlemenizi kaydedebilir, sıralamada yerinizi görebilir, kendi testlerinizi oluşturabilir ve diğer kullanıcıların testlerine yorum yapabilirsiniz. Ayrıca, favori testlerinizi kaydedebilir ve ileride çözmek üzere bir koleksiyon oluşturabilirsiniz. Hesap oluşturmak tamamen ücretsizdir ve sadece birkaç dakikanızı alır.</p>
          </CardContent>
        </Card>
      </div>

      <div className="custom-frame p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <Users className="mr-2 text-primary" /> Çok Oyunculu Modlar
          <span className="ml-2 text-sm bg-primary text-white px-2 py-1 rounded-full">Yakında Eklenecek</span>
        </h2>
        <div className="space-y-4">
          <p>Çok oyunculu modlar şu anda geliştirme aşamasındadır ve yakında kullanıma sunulacaktır!</p>
          <div className="p-4 bg-primary/10 rounded-md border border-primary/30">
            <h3 className="font-bold mb-2">Çok Oyunculu Modlarda Neler Olacak?</h3>
            <ul className="list-disc ml-5 space-y-2">
              <li>Arkadaşlarınızla özel odalarda gerçek zamanlı test çözme</li>
              <li>Haftalık turnuvalar ve özel etkinlikler</li>
              <li>Takım halinde yarışmalar</li>
              <li>Canlı sohbet ve etkileşim özelliği</li>
              <li>Özel ödüllü yarışmalara katılma imkanı</li>
              <li>Global liderlik tablolarında rekabet</li>
            </ul>
          </div>
          <div className="flex items-center mt-4 text-primary">
            <ArrowRight className="h-4 w-4 mr-1" />
            <p className="text-sm font-medium">Çok oyunculu modların lansman tarihiyle ilgili güncellemeler için sosyal medya hesaplarımızı takip edin.</p>
          </div>
        </div>
      </div>
    </div>
  );
}