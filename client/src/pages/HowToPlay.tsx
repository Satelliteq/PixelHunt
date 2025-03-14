import React from "react";
import { Users, Clock, Trophy, Info, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HowToPlay() {
  return (
    <div className="max-w-content mx-auto py-10 px-4 md:px-0">
      <h1 className="text-3xl font-bold mb-2">Nasıl Oynanır?</h1>
      <p className="text-muted-foreground mb-8">
        Pixelhunt'ta resimler adım adım açılır ve doğru cevabı en hızlı şekilde bulmanız gerekir.
      </p>

      <Tabs defaultValue="classic" className="mb-12">
        <TabsList className="mb-6 custom-tab-bg rounded-xl p-1 flex bg-opacity-50">
          <TabsTrigger value="classic" className="data-[state=active]:bg-background rounded-lg text-sm px-4">
            Klasik Mod
          </TabsTrigger>
          <TabsTrigger value="speed" className="data-[state=active]:bg-background rounded-lg text-sm px-4">
            Hız Modu
          </TabsTrigger>
          <TabsTrigger value="time" className="data-[state=active]:bg-background rounded-lg text-sm px-4">
            Zamanlı Mod
          </TabsTrigger>
          <TabsTrigger value="test" className="data-[state=active]:bg-background rounded-lg text-sm px-4">
            Test Modu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classic">
          <div className="custom-frame p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Trophy className="mr-2 text-primary" /> Klasik Mod Nasıl Oynanır?
            </h2>
            <div className="space-y-4">
              <p>Klasik modda, görsel parça parça açılır ve siz doğru cevabı tahmin etmeye çalışırsınız:</p>
              <ol className="list-decimal ml-5 space-y-2">
                <li>Her turda karşınıza yeni bir görsel gelir.</li>
                <li>Görsel başlangıçta tamamen kapalıdır ve zamanla açılmaya başlar.</li>
                <li>Açılan kısımları görerek görseldekileri tahmin etmelisiniz.</li>
                <li>Ne kadar az açılmış görüntüyle doğru cevabı bulursanız, o kadar yüksek puan alırsınız.</li>
                <li>Yanlış cevap verirseniz, açılma devam eder ve tekrar deneyebilirsiniz.</li>
                <li>Görselin tamamı açıldığında süre biter ve sıradaki görüntüye geçilir.</li>
              </ol>
              <p className="font-medium">Puan Sistemi:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Görüntünün %10'u açıkken doğru cevap: 100 puan</li>
                <li>Görüntünün %30'u açıkken doğru cevap: 70 puan</li>
                <li>Görüntünün %50'si açıkken doğru cevap: 50 puan</li>
                <li>Görüntünün %70'i açıkken doğru cevap: 30 puan</li>
                <li>Görüntünün %90'ı açıkken doğru cevap: 10 puan</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="speed">
          <div className="custom-frame p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Clock className="mr-2 text-primary" /> Hız Modu Nasıl Oynanır?
            </h2>
            <div className="space-y-4">
              <p>Hız modunda, görsellerinizi ne kadar hızlı tanımlayabildiğinizi test edersiniz:</p>
              <ol className="list-decimal ml-5 space-y-2">
                <li>Görsel anında %50 açık olarak gösterilir.</li>
                <li>Süre başladığında hemen tahminde bulunmalısınız.</li>
                <li>Ne kadar hızlı doğru cevabı verirseniz, o kadar yüksek puan alırsınız.</li>
                <li>Yanlış tahminler için puan cezası yoktur, ancak süre işlemeye devam eder.</li>
                <li>Her görsel için 30 saniye süreniz vardır.</li>
                <li>Toplam 10 görsel içeren bir seti tamamlarsınız.</li>
              </ol>
              <p className="font-medium">Puan Sistemi:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>5 saniye içinde doğru cevap: 100 puan</li>
                <li>10 saniye içinde doğru cevap: 80 puan</li>
                <li>20 saniye içinde doğru cevap: 50 puan</li>
                <li>30 saniye içinde doğru cevap: 30 puan</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="time">
          <div className="custom-frame p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Clock className="mr-2 text-primary" /> Zamanlı Mod Nasıl Oynanır?
            </h2>
            <div className="space-y-4">
              <p>Zamanlı modda, belirli bir süre içinde tüm resimleri doğru tahmin etmeye çalışırsınız:</p>
              <ol className="list-decimal ml-5 space-y-2">
                <li>Toplam 3 dakikalık süre içinde mümkün olduğunca çok görseli tanımlamalısınız.</li>
                <li>Her görsel %60 açık olarak gösterilir.</li>
                <li>Doğru tahmin ettiğinizde hemen yeni bir görsele geçersiniz.</li>
                <li>Yanlış tahminlerde "Pas Geç" seçeneğini kullanabilirsiniz.</li>
                <li>Her pas geçilen görsel için 10 saniye ceza alırsınız.</li>
                <li>Süre dolduğunda oyun biter ve toplam puanınız hesaplanır.</li>
              </ol>
              <p className="font-medium">Puan Sistemi:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Her doğru cevap: 50 puan</li>
                <li>Süre bonusu: Kalan her 10 saniye için +5 puan</li>
                <li>Pas geçme cezası: Her pas için -10 puan</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="test">
          <div className="custom-frame p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Info className="mr-2 text-primary" /> Test Modu Nasıl Oynanır?
            </h2>
            <div className="space-y-4">
              <p>Test modunda, diğer kullanıcılar tarafından oluşturulan özel testleri çözersiniz:</p>
              <ol className="list-decimal ml-5 space-y-2">
                <li>Her test, belirli bir tema etrafında bir dizi görsel içerir.</li>
                <li>Görseller test yaratıcısının belirlediği zorluk seviyesinde açılır.</li>
                <li>Testi bitirdiğinizde toplam puanınız ve performansınız görüntülenir.</li>
                <li>Puanlamanız diğer oyuncularla karşılaştırılır.</li>
                <li>Testleri beğenebilir ve yorumlayabilirsiniz.</li>
                <li>Kendi testlerinizi de oluşturabilirsiniz.</li>
              </ol>
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
            <p>Her oyun modu için ayrı puan sıralamaları bulunmaktadır. Ne kadar çok oyun oynarsanız ve ne kadar yüksek puan alırsanız, sıralamada o kadar yükselirsiniz. Haftalık ve aylık sıralamalar sıfırlanır, böylece herkes lider tablosunda yer alma şansına sahip olur.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-primary" /> Test Oluşturma
            </CardTitle>
            <CardDescription>Kendi testimi nasıl oluşturabilirim?</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Test oluşturmak için ana menüden "Test Oluştur" butonuna tıklayın. Ardından testiniz için bir başlık, açıklama ve kategori seçin. Daha sonra teste eklemek istediğiniz görselleri ve her görsel için kabul edilebilir cevapları ekleyin. Testinizi yayınladığınızda diğer oyuncular tarafından oynanabilir olacaktır.</p>
          </CardContent>
        </Card>
      </div>

      <div className="custom-frame p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <Users className="mr-2 text-primary" /> Çok Oyunculu Mod (Yakında!)
        </h2>
        <div className="space-y-4">
          <p>Çok oyunculu mod şu anda geliştirme aşamasındadır ve yakında kullanıma sunulacaktır!</p>
          <div className="p-4 bg-primary/10 rounded-md border border-primary/30">
            <h3 className="font-bold mb-2">Çok Oyunculu Modda Neler Olacak?</h3>
            <ul className="list-disc ml-5 space-y-2">
              <li>Arkadaşlarınızla özel odalarda gerçek zamanlı mücadele</li>
              <li>Turnuvalar ve özel etkinlikler</li>
              <li>Takım tabanlı zorluklar</li>
              <li>Canlı sohbet ve etkileşim</li>
              <li>Özel ödüllü yarışmalar</li>
            </ul>
          </div>
          <p className="text-muted-foreground">Çok oyunculu modun lansman tarihiyle ilgili güncellemeler için sosyal medya hesaplarımızı takip edin.</p>
        </div>
      </div>
    </div>
  );
}