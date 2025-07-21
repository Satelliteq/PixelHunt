import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const JoinRoom: React.FC = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [roomId, setRoomId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roomData, setRoomData] = useState<any>(null);

  useEffect(() => {
    // URL'den oda ID'sini al
    const searchParams = new URLSearchParams(window.location.search);
    const roomIdFromUrl = searchParams.get('roomId');
    if (roomIdFromUrl) {
      setRoomId(roomIdFromUrl);
      checkRoom(roomIdFromUrl);
    }
  }, []);

  const checkRoom = async (roomIdToCheck: string) => {
    if (!roomIdToCheck.trim() || !user) return;
    setError('');

    try {
      // Oda var mı kontrol et
      const roomsRef = collection(db, 'rooms');
      const q = query(roomsRef, where('id', '==', roomIdToCheck.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Oda bulunamadı');
      }

      const roomDoc = querySnapshot.docs[0];
      const room = roomDoc.data();

      if (room.status !== 'waiting') {
        throw new Error('Bu oda şu anda aktif değil');
      }

      setRoomData(room);

      if (room.hasPassword) {
        setShowPasswordInput(true);
      } else {
        handleJoinRoom(roomIdToCheck);
      }
    } catch (error: any) {
      console.error('Oda kontrol hatası:', error);
      setError(error.message || 'Oda kontrol edilirken bir hata oluştu.');
      toast({
        title: "Hata",
        description: error.message || 'Oda kontrol edilirken bir hata oluştu.',
        variant: "destructive",
      });
    }
  };

  const handleJoinRoom = async (roomIdToJoin?: string) => {
    const finalRoomId = roomIdToJoin || roomId;
    if (!finalRoomId.trim() || !user) return;
    setIsJoining(true);
    setError('');

    try {
      // Oda var mı kontrol et
      const roomsRef = collection(db, 'rooms');
      const q = query(roomsRef, where('id', '==', finalRoomId.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Oda bulunamadı');
      }

      const roomDoc = querySnapshot.docs[0];
      const room = roomDoc.data();

      if (room.status !== 'waiting') {
        throw new Error('Bu oda şu anda aktif değil');
      }

      if (room.hasPassword && room.password !== password) {
        throw new Error('Yanlış şifre');
      }

      // Odaya katıl
      const playersRef = collection(db, 'roomPlayers');
      await addDoc(playersRef, {
        roomId: finalRoomId.toUpperCase(),
        userId: user.uid,
        username: user.displayName || user.email?.split('@')[0] || 'Anonim',
        score: 0,
        joinedAt: serverTimestamp()
      });

      toast({
        title: "Odaya Katıldınız",
        description: "Odaya başarıyla katıldınız!",
      });
      
      // Oda sayfasına yönlendir
      setLocation(`/room/${finalRoomId}`);
    } catch (error: any) {
      console.error('Odaya katılma hatası:', error);
      setError(error.message || 'Odaya katılırken bir hata oluştu.');
      toast({
        title: "Hata",
        description: error.message || 'Odaya katılırken bir hata oluştu.',
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Odaya Katıl</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomId">Oda Kodu</Label>
                <Input
                  id="roomId"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Oda kodunu girin"
                  maxLength={6}
                  disabled={showPasswordInput}
                />
              </div>

              {showPasswordInput && (
                <div className="space-y-2">
                  <Label htmlFor="password">Oda Şifresi</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Şifre girin"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}

              <Button
                onClick={() => showPasswordInput ? handleJoinRoom() : checkRoom(roomId)}
                disabled={isJoining || !roomId.trim() || !user || (showPasswordInput && !password)}
                className="w-full"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Katılınıyor...
                  </>
                ) : showPasswordInput ? (
                  'Odaya Katıl'
                ) : (
                  'Devam Et'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JoinRoom; 