  {/* Hero Section */}
  <section className="py-20">
    <div className="container mx-auto px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">PixelHunt ile Eğlenceli Testler</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Görsel testler oluşturun, arkadaşlarınızla yarışın ve eğlenin!
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/tests">Testlere Göz At</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/rooms">Arkadaşlarla Oyna</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>

  {/* Multiplayer Özellik Tanıtımı */}
  <section className="py-20 bg-muted/50">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Arkadaşlarınla Yarış</h2>
          <p className="text-lg text-muted-foreground">
            PixelHunt'un çok oyunculu modu ile arkadaşlarınla aynı anda test çözebilir, 
            skorlarınızı karşılaştırabilir ve eğlenceli vakit geçirebilirsiniz.
          </p>
          <ul className="space-y-4">
            <li className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span>Özel odalar oluşturun</span>
            </li>
            <li className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span>Gerçek zamanlı sohbet edin</span>
            </li>
            <li className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span>Skorlarınızı karşılaştırın</span>
            </li>
          </ul>
          <Button asChild>
            <Link href="/rooms">Hemen Başla</Link>
          </Button>
        </div>
        <div className="relative">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            <img 
              src="/multiplayer-preview.png" 
              alt="Multiplayer Preview" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -right-6 bg-background p-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium">Aktif Oyuncular</span>
            </div>
            <div className="text-2xl font-bold mt-1">1,234</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Diğer Bölümler */} 