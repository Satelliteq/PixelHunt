import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Plus, Gamepad2, Users, Clock, MessageSquare, Trophy, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Room {
  id: string;
  name: string;
  status: 'waiting' | 'playing' | 'finished';
  settings: {
    minPlayers: number;
    maxPlayers: number;
    questionTime: number;
    allowChat: boolean;
    showLeaderboard: boolean;
  };
  currentPlayers: number;
  createdAt: any;
  test?: {
    title: string;
  };
  hasPassword: boolean;
}

const Rooms: React.FC = () => {
  const [, setLocation] = useLocation();
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    const roomsRef = collection(db, 'rooms');
    const roomsQuery = query(
      roomsRef,
      where('status', '!=', 'finished'),
      orderBy('status'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(roomsQuery, async (snapshot) => {
      const roomsData: Room[] = [];
      
      for (const doc of snapshot.docs) {
        const roomData = doc.data() as Room;
        
        // Oyuncu sayısını al
        const playersRef = collection(db, 'roomPlayers');
        const playersQuery = query(playersRef, where('roomId', '==', roomData.id));
        const playersSnapshot = await getDocs(playersQuery);
        
        roomsData.push({
          ...roomData,
          currentPlayers: playersSnapshot.size
        });
      }
      
      setRooms(roomsData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Odalar</h1>
        <Button onClick={() => setLocation('/create-room')}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Oda Oluştur
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <Card 
            key={room.id} 
            className="cursor-pointer hover:border-primary/50 transition-all duration-300 overflow-hidden group"
          >
            <div className="px-4 py-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110 bg-primary/10 text-primary">
                <Gamepad2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium mb-1">{room.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {room.test?.title || "Test bilgisi yok"}
              </p>
              
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {room.currentPlayers}/{room.settings.maxPlayers}
                </Badge>
                <Badge variant={room.status === 'playing' ? "destructive" : "secondary"}>
                  {room.status === 'playing' ? 'Oyun Devam Ediyor' : 'Beklemede'}
                </Badge>
                {room.hasPassword && (
                  <Badge variant="outline">
                    <Lock className="w-3 h-3 mr-1" />
                    Şifreli
                  </Badge>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-border/50 w-full">
                <Button
                  className="w-full justify-center group-hover:bg-primary group-hover:text-primary-foreground"
                  onClick={() => setLocation(`/room/${room.id}`)}
                  disabled={room.status === 'playing'}
                >
                  {room.status === 'playing' ? 'Oyun Devam Ediyor' : 'Katıl'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Rooms; 