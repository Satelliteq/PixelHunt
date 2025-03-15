import React from "react";
import { Users, Image, Info, Sparkles, BookText, Trophy, UserPlus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HowToPlay() {
  return (
    <div className="max-w-content mx-auto py-10 px-4 md:px-0">
      <h1 className="text-3xl font-bold mb-2">Nasıl Oynanır?</h1>
      <p className="text-muted-foreground mb-8">
        Pixelhunt'ta testler ile görsellerinizi tanıma yeteneklerinizi sınayın ve kendi testlerinizi oluşturun.
      </p>

      <div className="custom-frame p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <Info className="mr-2 text-primary" /> Test Oyun Sistemi
        </h2>
        <div className="space-y-4">
          <p>Pixelhunt'ta testler aracılığıyla görsellerinizi tanıma yeteneklerinizi geliştirirsiniz:</p>
          <ol className="list-decimal ml-5 space-y-2">
            <li>Temaya uygun görsel setlerinden oluşan testleri seçebilirsiniz.</li>
            <li>Görseller kademeli olarak açılır ve doğru cevabı bulmanız gerekir.</li>
            <li>Ne kadar az açılmış görüntüyle doğru cevabı bulursanız, o kadar yüksek puan alırsınız.</li>
            <li>Testleri tamamladıkça puan kazanır ve sıralamada yükselirsiniz.</li>
            <li>Farklı zorluk seviyelerinde testler bulabilirsiniz.</li>
            <li>Kendi testlerinizi oluşturarak toplulukla paylaşabilirsiniz.</li>
          </ol>

          <p className="font-medium mt-4">Puan Sistemi:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Görüntünün %10'u açıkken doğru cevap: 100 puan</li>
            <li>Görüntünün %30'u açıkken doğru cevap: 70 puan</li>
            <li>Görüntünün %50'si açıkken doğru cevap: 50 puan</li>
            <li>Görüntünün %70'i açıkken doğru cevap: 30 puan</li>
            <li>Görüntünün %90'ı açıkken doğru cevap: 10 puan</li>
          </ul>
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
          <div className="custom-frame p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <BookText className="mr-2 text-primary" /> Test Bulma ve Keşfetme
            </h2>
            <div className="space-y-4">
              <p>Pixelhunt'ta ilgi alanınıza ve beceri seviyenize göre testler bulabilirsiniz:</p>
              <ol className="list-decimal ml-5 space-y-2">
                <li>Ana sayfadaki "Testler" bölümünden popüler ve öne çıkan testlere göz atabilirsiniz.</li>
                <li>Kategoriler sayfasından belirli temalara göre testleri filtreleyebilirsiniz.</li>
                <li>Zorluk seviyesine göre testleri sıralayabilirsiniz (Kolay, Orta, Zor, Çok Zor, Uzman).</li>
                <li>Arama çubuğunu kullanarak belirli anahtar kelimelere göre test bulabilirsiniz.</li>
                <li>En çok oynanan ve beğenilen testleri keşfedebilirsiniz.</li>
                <li>Yeni eklenen testleri takip edebilirsiniz.</li>
              </ol>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="play">
          <div className="custom-frame p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Image className="mr-2 text-primary" /> Test Çözme
            </h2>
            <div className="space-y-4">
              <p>Seçtiğiniz testi çözerken izleyeceğiniz adımlar:</p>
              <ol className="list-decimal ml-5 space-y-2">
                <li>Test sayfasında "Oyna" butonuna tıklayarak testi başlatın.</li>
                <li>Her görsel başlangıçta kısmen kapalıdır ve kademeli olarak açılır.</li>
                <li>Açılan kısımları inceleyerek görselde ne olduğunu tahmin etmeye çalışın.</li>
                <li>Tahminlerinizi metin kutusuna yazın ve "Tahmin Et" butonuna tıklayın.</li>
                <li>Yanlış tahminlerde, görsel açılmaya devam eder ve tekrar deneyebilirsiniz.</li>
                <li>Doğru cevabı bulduğunuzda veya görsel tamamen açıldığında bir sonraki soruya geçilir.</li>
                <li>Tüm soruları cevapladığınızda sonuçlarınız ve puanınız gösterilir.</li>
              </ol>
              <p className="mt-4">Testi bitirdikten sonra beğenebilir, yorum yapabilir ve kendi rekorunuzu geliştirmek için tekrar oynayabilirsiniz.</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="create">
          <div className="custom-frame p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Sparkles className="mr-2 text-primary" /> Test Oluşturma
            </h2>
            <div className="space-y-4">
              <p>Kendi testinizi oluşturmak için izlemeniz gereken adımlar:</p>
              <ol className="list-decimal ml-5 space-y-2">
                <li>Ana menüde veya testler sayfasında "Test Oluştur" butonuna tıklayın.</li>
                <li>Testiniz için bir başlık, açıklama ve kategori belirleyin.</li>
                <li>Zorluk seviyesini seçin (Kolay, Orta, Zor, Çok Zor, Uzman).</li>
                <li>"Görsel Ekle" butonuyla testinize görsel ekleyin.</li>
                <li>Her görsel için doğru cevap ve alternatif kabul edilebilir cevapları belirleyin.</li>
                <li>Gerekirse görsellerin sırasını değiştirin veya kaldırın.</li>
                <li>Test önizlemesini kontrol edin ve hazır olduğunda "Yayınla" butonuna tıklayın.</li>
              </ol>
              <p className="mt-4">Yayınlanan testiniz diğer kullanıcılar tarafından oynanabilir, beğenilebilir ve yorum alabilir. Oluşturduğunuz testleri istediğiniz zaman düzenleyebilir veya güncelleyebilirsiniz.</p>
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