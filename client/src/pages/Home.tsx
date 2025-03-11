import React from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Heart, Trophy, Gamepad, Zap, Clock, Users } from "lucide-react";
import { Image } from "@shared/schema";

import GameModeCard from "@/components/game/GameModeCard";
import ContentCard from "@/components/game/ContentCard";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [_, navigate] = useLocation();

  // Fetch favorite/top liked content
  const { data: favoritesData, isLoading: isFavoritesLoading } = useQuery<Image[]>({
    queryKey: ["/api/images/favorites"],
  });

  // Fetch most played content
  const { data: popularData, isLoading: isPopularLoading } = useQuery<Image[]>({
    queryKey: ["/api/images/popular"],
  });

  const handleContentClick = (imageId: number) => {
    navigate(`/game/classic?imageId=${imageId}`);
  };

  return (
    <div className="space-y-10">
      {/* Game Modes Section */}
      <section>
        <div className="grid grid-cols-12 gap-4">
          {/* Klasik Oyun */}
          <div className="col-span-12 md:col-span-3">
            <GameModeCard
              title="Klasik Oyun"
              description="Standart tahmin etmeye çalış, zihini zorla ve doğru cevabı da erken bul."
              icon={<Trophy className="w-16 h-16 text-yellow-500" />}
              backgroundColor="bg-green-500"
              to="/game/classic"
            />
          </div>
          
          {/* Hızlı Mod */}
          <div className="col-span-12 md:col-span-3">
            <GameModeCard
              title="Hızlı Mod"
              description="Görseller adımlayla açılıyor, hızlı ol, formun."
              icon={<Zap className="w-16 h-16 text-white" />}
              backgroundColor="bg-purple-600"
              to="/game/speed"
            />
          </div>
          
          {/* Test Modu */}
          <div className="col-span-12 md:col-span-6">
            <GameModeCard
              title="Test Modu"
              description="Belenmiş farklı kategorilerinde kendini test et."
              icon={<Gamepad className="w-20 h-20 text-white" />}
              backgroundColor="bg-red-500"
              to="/game/test"
            />
          </div>
          
          <div className="col-span-12 md:col-span-6 flex flex-col gap-4">
            {/* Zamana Karşı */}
            <GameModeCard
              title="Zamana Karşı"
              description="Farkli bir oyun modu deneyimle zamanla yarış, daha az zaman kullanımda ödüllendiril."
              icon={<Clock className="w-12 h-12 text-white" />}
              backgroundColor="bg-blue-500"
              to="/game/time"
              size="md"
            />
            
            <div className="flex gap-4">
              {/* Canlı Mod */}
              <div className="w-1/2">
                <GameModeCard
                  title="Canlı Mod"
                  description="Sınırlı yanılma için bakış açına güven."
                  icon={<Heart className="w-8 h-8 text-red-500" />}
                  backgroundColor="bg-white text-black"
                  to="/game/live"
                  size="sm"
                />
              </div>
              
              {/* Çok Oyunculu (Coming Soon) */}
              <div className="w-1/2">
                <GameModeCard
                  title="Çok Oyunculu"
                  description="Gerçek rakiplerle çarpışın ve galip gelin."
                  icon={<Users className="w-8 h-8 text-white" />}
                  backgroundColor="bg-orange-500"
                  to="/"
                  size="sm"
                />
              </div>
            </div>
          </div>
          
          <div className="col-span-12 md:col-span-3 bg-zinc-800 rounded-2xl p-6 flex flex-col justify-center items-center h-[120px]">
            <p className="text-center text-sm text-zinc-400 mb-2">Yeni bir kategori mi arıyorsun?</p>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
              <span className="mr-1">+</span> Öneri Gönder
            </Button>
          </div>
        </div>
      </section>

      {/* Favorites Section */}
      <section>
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <Heart className="w-5 h-5 text-red-500 mr-2" /> En Beğenilenler
          </h2>
          <div className="ml-auto flex space-x-2">
            <Button variant="outline" className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-full text-xs border-none">
              Tümünü Gör
            </Button>
            <Button variant="outline" className="bg-zinc-800 hover:bg-zinc-700 w-8 h-8 rounded-full flex items-center justify-center p-0 border-none">
              &lt;
            </Button>
            <Button variant="outline" className="bg-zinc-800 hover:bg-zinc-700 w-8 h-8 rounded-full flex items-center justify-center p-0 border-none">
              &gt;
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {isFavoritesLoading ? (
            Array(5).fill(0).map((_, index) => (
              <div key={index} className="animate-pulse bg-zinc-800 rounded-xl h-64"></div>
            ))
          ) : (
            favoritesData?.map((image) => (
              <ContentCard
                key={image.id}
                title={image.title}
                imageUrl={image.imageUrl}
                playCount={image.playCount}
                likeCount={image.likeCount}
                duration="03:45"
                onClick={() => handleContentClick(image.id)}
              />
            ))
          )}
        </div>
      </section>

      {/* Most Played Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <Trophy className="w-5 h-5 text-yellow-500 mr-2" /> En Çok Oynananlar
            <span className="ml-3 bg-zinc-800 text-xs px-2 py-0.5 rounded-full">Hepsini Bul</span>
          </h2>
          <div className="flex space-x-1">
            <Button variant="outline" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 w-8 h-8 rounded-full flex items-center justify-center p-0 border-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </Button>
            <Button variant="outline" className="bg-zinc-800 hover:bg-zinc-700 w-8 h-8 rounded-full flex items-center justify-center p-0 border-none">
              &lt;
            </Button>
            <Button variant="outline" className="bg-zinc-800 hover:bg-zinc-700 w-8 h-8 rounded-full flex items-center justify-center p-0 border-none">
              &gt;
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {isPopularLoading ? (
            Array(5).fill(0).map((_, index) => (
              <div key={index} className="animate-pulse bg-zinc-800 rounded-xl h-64"></div>
            ))
          ) : (
            popularData?.map((image) => (
              <ContentCard
                key={image.id}
                title={image.title}
                imageUrl={image.imageUrl}
                playCount={image.playCount}
                likeCount={image.likeCount}
                duration="04:30"
                onClick={() => handleContentClick(image.id)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
