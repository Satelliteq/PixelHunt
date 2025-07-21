import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, where, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Search, Copy, Check, Eye, EyeOff, Users, Clock, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const CreateRoom: React.FC = () => {
  const [, setLocation] = useLocation();
  const testId = new URLSearchParams(window.location.search).get('testId');
  const { user } = useAuth();
  const { toast } = useToast();
  const [roomName, setRoomName] = useState(user?.displayName ? `${user.displayName}'s room` : 'My room');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState('');
  const [showRoomCreatedDialog, setShowRoomCreatedDialog] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [roomId, setRoomId] = useState('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [roomSettings, setRoomSettings] = useState({
    minPlayers: 2,
    maxPlayers: 10,
    questionTime: 60,
    allowChat: true,
    showLeaderboard: true,
    hasPassword: false,
    password: ''
  });

  useEffect(() => {
    fetchTests();
    fetchActiveRooms();

    // Eğer URL'de test ID'si varsa, o testi seç
    if (testId) {
      const selectedTest = tests.find(test => test.id === testId);
      if (selectedTest) {
        setSelectedTest(selectedTest);
        setShowCreateDialog(true);
      }
    }
  }, [testId]);

  // Boş odaları kontrol et ve sil
  useEffect(() => {
    const checkEmptyRooms = async () => {
      try {
        const roomsRef = collection(db, 'rooms');
        const q = query(
          roomsRef,
          where('status', '==', 'waiting'),
          where('createdAt', '!=', null)
        );
        const querySnapshot = await getDocs(q);
        
        for (const doc of querySnapshot.docs) {
          const roomData = doc.data();
          const roomId = roomData.id;

          if (!roomId) {
            console.error('Geçersiz oda ID:', doc.id);
            continue;
          }

          // Oyuncuları kontrol et
          const playersRef = collection(db, 'roomPlayers');
          const playersQuery = query(playersRef, where('roomId', '==', roomId));
          const playersSnapshot = await getDocs(playersQuery);

          if (playersSnapshot.empty) {
            // Oyuncu yoksa odayı sil
            await deleteDoc(doc.ref);
            console.log('Boş oda silindi:', roomId);
          }
        }
      } catch (error) {
        console.error('Boş odaları kontrol etme hatası:', error);
      }
    };

    // Her 30 saniyede bir kontrol et
    const interval = setInterval(checkEmptyRooms, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTests = async () => {
    try {
      const testsRef = collection(db, 'tests');
      const q = query(testsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const testsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTests(testsList);
    } catch (error) {
      console.error('Testleri getirme hatası:', error);
      toast({
        title: "Hata",
        description: "Testler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTests(false);
    }
  };

  const fetchActiveRooms = async () => {
    try {
      const roomsRef = collection(db, 'rooms');
      const q = query(roomsRef, where('status', '==', 'waiting'));
      const querySnapshot = await getDocs(q);
      
      const roomsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRooms(roomsList);
    } catch (error) {
      console.error('Odaları getirme hatası:', error);
      toast({
        title: "Hata",
        description: "Odalar yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!user || !roomName || !selectedTest) return;
    setIsCreating(true);

    try {
      const roomId = crypto.randomUUID();
      const roomData = {
        id: roomId,
        name: roomName,
        hostId: user.uid,
        status: 'waiting',
        settings: roomSettings,
        testId: selectedTest.id,
        createdAt: serverTimestamp(),
        hasPassword: roomSettings.hasPassword,
        password: roomSettings.hasPassword ? roomSettings.password : null
      };

      const roomsRef = collection(db, 'rooms');
      await addDoc(roomsRef, roomData);

      // Host'u oyuncu olarak ekle
      const playersRef = collection(db, 'roomPlayers');
      await addDoc(playersRef, {
        roomId,
        userId: user.uid,
        username: user.displayName || user.email?.split('@')[0] || 'Anonim',
        photoURL: user.photoURL || null,
        score: 0,
        isHost: true,
        joinedAt: serverTimestamp()
      });

      setCreatedRoomId(roomId);
      setShowCreateDialog(false);
      setShowRoomCreatedDialog(true);

      toast({
        title: "Oda Oluşturuldu",
        description: "Oda başarıyla oluşturuldu!",
      });

      setLocation(`/room/${roomId}`);
    } catch (error) {
      console.error('Oda oluşturma hatası:', error);
      toast({
        title: "Hata",
        description: "Oda oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(createdRoomId);
      toast({
        title: "Başarılı",
        description: "Oda ID'si kopyalandı!",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Oda ID'si kopyalanırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const filteredTests = tests.filter(test => 
    test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinRoom = async () => {
    if (!joinRoomId.trim() || !user) return;
    setIsJoining(true);

    try {
      const roomsRef = collection(db, 'rooms');
      const roomQuery = query(roomsRef, where('id', '==', joinRoomId));
      const roomSnapshot = await getDocs(roomQuery);

      if (!roomSnapshot.empty) {
        const roomData = roomSnapshot.docs[0].data();
        
        // Şifre kontrolü
        if (roomData.password && roomData.password !== joinPassword) {
          toast({
            title: "Hata",
            description: "Oda şifresi yanlış.",
            variant: "destructive",
          });
          return;
        }

        // Odaya katıl
        const playersRef = collection(db, 'roomPlayers');
        const existingPlayerQuery = query(
          playersRef,
          where('roomId', '==', joinRoomId),
          where('userId', '==', user.uid)
        );
        const existingPlayerSnapshot = await getDocs(existingPlayerQuery);

        if (existingPlayerSnapshot.empty) {
          await addDoc(playersRef, {
            roomId: joinRoomId,
            userId: user.uid,
            username: user.displayName || user.email?.split('@')[0] || 'Anonim',
            photoURL: user.photoURL,
            score: 0,
            joinedAt: serverTimestamp()
          });

          setLocation(`/room/${joinRoomId}`);
        } else {
          toast({
            title: "Hata",
            description: "Zaten bu odadasınız.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Hata",
          description: "Oda bulunamadı.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Odaya katılma hatası:', error);
      toast({
        title: "Hata",
        description: "Odaya katılırken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
      setShowJoinDialog(false);
      setJoinRoomId('');
      setJoinPassword('');
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Çok Oyunculu Oyun</h1>
        <div className="flex gap-4">
          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Odaya Katıl
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Odaya Katıl</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomId">Oda ID</Label>
                  <Input
                    id="roomId"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    placeholder="Oda ID'sini girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Şifre (Varsa)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    placeholder="Oda şifresini girin"
                  />
                </div>
                <Button
                  onClick={handleJoinRoom}
                  disabled={isJoining || !joinRoomId.trim()}
                  className="w-full"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Katılınıyor...
                    </>
                  ) : (
                    'Odaya Katıl'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Oda Oluştur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Oda Oluştur</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="roomName">Oda Adı</Label>
                  <Input
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Oda adını girin"
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Maksimum Oyuncu Sayısı</Label>
                    <Slider
                      value={[roomSettings.maxPlayers]}
                      onValueChange={([value]) => {
                        const newValue = Math.max(2, Math.min(20, value));
                        setRoomSettings(prev => ({ ...prev, maxPlayers: newValue }));
                      }}
                      min={2}
                      max={20}
                      step={1}
                    />
                    <div className="text-sm text-muted-foreground">
                      {roomSettings.maxPlayers} oyuncu
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Soru Süresi (saniye)</Label>
                    <Slider
                      value={[roomSettings.questionTime]}
                      onValueChange={([value]) => {
                        const newValue = Math.max(10, Math.min(120, value));
                        setRoomSettings(prev => ({ ...prev, questionTime: newValue }));
                      }}
                      min={10}
                      max={120}
                      step={5}
                    />
                    <div className="text-sm text-muted-foreground">
                      {roomSettings.questionTime} saniye
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowChat"
                      checked={roomSettings.allowChat}
                      onCheckedChange={(checked) => setRoomSettings(prev => ({ ...prev, allowChat: checked }))}
                    />
                    <Label htmlFor="allowChat">Sohbete İzin Ver</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showLeaderboard"
                      checked={roomSettings.showLeaderboard}
                      onCheckedChange={(checked) => setRoomSettings(prev => ({ ...prev, showLeaderboard: checked }))}
                    />
                    <Label htmlFor="showLeaderboard">Lider Tablosunu Göster</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasPassword"
                      checked={roomSettings.hasPassword}
                      onCheckedChange={(checked) => setRoomSettings(prev => ({ ...prev, hasPassword: checked }))}
                    />
                    <Label htmlFor="hasPassword">Şifre Korumalı</Label>
                  </div>

                  {roomSettings.hasPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="roomPassword">Oda Şifresi</Label>
                      <div className="relative">
                        <Input
                          id="roomPassword"
                          type={showPassword ? "text" : "password"}
                          value={roomSettings.password}
                          onChange={(e) => setRoomSettings(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Oda şifresini girin"
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
                </div>

                <div className="space-y-2">
                  <Label>Test Seç</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Test ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                  {isLoadingTests ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : filteredTests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Test bulunamadı
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredTests.map((test) => (
                        <Card
                          key={test.id}
                          className={`cursor-pointer transition-colors ${
                            selectedTest?.id === test.id
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedTest(test)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <h3 className="font-medium">{test.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {test.description}
                                </p>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {test.questions?.length || 0} Soru
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleCreateRoom}
                    disabled={isCreating || !roomName || !selectedTest}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Oluşturuluyor...
                      </>
                    ) : (
                      'Oda Oluştur'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Aktif Odalar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Aktif Odalar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRooms ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aktif oda bulunmuyor
            </div>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => (
                <Card key={room.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-lg">{room.name}</h3>
                          {room.hasPassword && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Şifreli
                            </Badge>
                          )}
                        </div>
                        <Button
                          onClick={() => {
                            setJoinRoomId(room.id);
                            setShowJoinDialog(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Odaya Katıl
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {room.players?.length || 0} Oyuncu
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDistanceToNow(room.createdAt?.toDate() || new Date(), { 
                            addSuffix: true,
                            locale: tr 
                          })}
                        </div>
                      </div>

                      {room.test && (
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="bg-primary/10">
                            {room.test.title}
                          </Badge>
                          <span className="text-muted-foreground">
                            {room.test.questions?.length || 0} Soru
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Oda Oluşturuldu Dialog */}
      <Dialog open={showRoomCreatedDialog} onOpenChange={setShowRoomCreatedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Oda Oluşturuldu!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Oda başarıyla oluşturuldu. Aşağıdaki oda ID'sini arkadaşlarınızla paylaşın:
            </p>
            <div className="flex gap-2">
              <Input
                value={createdRoomId}
                readOnly
                className="flex-1 font-mono text-lg text-center"
              />
              <Button
                onClick={copyRoomId}
                variant="outline"
                size="icon"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRoomCreatedDialog(false)}
              >
                Kapat
              </Button>
              <Button
                onClick={() => {
                  setShowRoomCreatedDialog(false);
                  setLocation(`/room/${createdRoomId}`);
                }}
              >
                Odaya Git
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateRoom; 