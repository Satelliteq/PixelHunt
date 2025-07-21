import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, serverTimestamp, getDocs, deleteDoc, limit } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Users, MessageSquare, Share2, Copy, Check, Play, Users2, Settings, Crown, Search, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ImageReveal from '@/components/game/ImageReveal';

interface Player {
  id: string;
  username: string;
  score: number;
  photoURL?: string;
  isHost: boolean;
  joinedAt: Date;
}

interface Message {
  id: string;
  username: string;
  content: string;
  photoURL?: string;
  createdAt: any;
}

interface Guess {
  id: string;
  userId: string;
  username: string;
  content: string;
  photoURL?: string;
  isCorrect: boolean;
  isClose: boolean;
  createdAt: any;
}

interface RoomSettings {
  questionTime: number;
  minPlayers: number;
  maxPlayers: number;
  allowChat: boolean;
  showLeaderboard: boolean;
}

interface Room {
  id: string;
  name: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished' | 'countdown' | 'question_transition';
  settings: RoomSettings;
  testId: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  waitingTime: number;
  countdown: number;
  currentQuestion?: {
    question: string;
    imageUrl: string;
    answers: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const MultiplayerRoom: React.FC = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [guess, setGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showWaitingDialog, setShowWaitingDialog] = useState(false);
  const [roomSettings, setRoomSettings] = useState<RoomSettings>({
    questionTime: 60,
    minPlayers: 2,
    maxPlayers: 10,
    allowChat: true,
    showLeaderboard: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [revealedParts, setRevealedParts] = useState<number>(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isWaitingForHost, setIsWaitingForHost] = useState(false);
  const [roomStatus, setRoomStatus] = useState('waiting');
  const [questionTransition, setQuestionTransition] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [finalScores, setFinalScores] = useState<Player[]>([]);
  const [waitingForNextQuestion, setWaitingForNextQuestion] = useState(false);
  const [waitingTime, setWaitingTime] = useState(5);
  const [isKicked, setIsKicked] = useState(false);
  const [showKickedAlert, setShowKickedAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Ses efektleri için state'ler
  const [sounds, setSounds] = useState<{
    correct: HTMLAudioElement;
    wrong: HTMLAudioElement;
    close: HTMLAudioElement;
    gameStart: HTMLAudioElement;
    gameEnd: HTMLAudioElement;
    countdown: HTMLAudioElement;
  } | null>(null);

  // URL'den oda ID'sini al
  const roomId = window.location.pathname.split('/').pop();

  // Oda ID kontrolü
  useEffect(() => {
    if (!roomId) {
      console.error('Oda ID bulunamadı');
      setLocation('/rooms');
      return;
    }

    console.log('Oda ID:', roomId); // Debug log
  }, [roomId]);

  // Host durumunu kontrol et
  const checkHostStatus = async (userId: string): Promise<boolean> => {
    if (!room) return false;
    return room.hostId === userId;
  };

  // Host durumunu güncelle
  const updateHostStatus = async (userId: string, isHost: boolean) => {
    if (!roomId) return;

    try {
      // Önce oyuncu durumunu güncelle
      const playersRef = collection(db, 'roomPlayers');
      const playerQuery = query(
        playersRef,
        where('roomId', '==', roomId),
        where('userId', '==', userId)
      );
      const playerSnapshot = await getDocs(playerQuery);

      if (!playerSnapshot.empty) {
        const playerDoc = playerSnapshot.docs[0];
        await updateDoc(doc(db, 'roomPlayers', playerDoc.id), {
          isHost: isHost
        });
      }

      // Sonra oda durumunu güncelle
    const roomsRef = collection(db, 'rooms');
    const roomQuery = query(roomsRef, where('id', '==', roomId));
      const roomSnapshot = await getDocs(roomQuery);
      
      if (!roomSnapshot.empty) {
        const roomDoc = roomSnapshot.docs[0];
        await updateDoc(doc(db, 'rooms', roomDoc.id), {
          hostId: isHost ? userId : null
        });
      }

      // State'i güncelle
      if (userId === user?.uid) {
        setIsHost(isHost);
      }
    } catch (error) {
      console.error('Host durumu güncelleme hatası:', error);
      throw error;
    }
  };

  // Oyuncuyu at
  const kickPlayer = async (playerId: string) => {
    if (!isHost || !roomId || !user || !room) return;

    try {
      const playersRef = collection(db, 'roomPlayers');
      const playerQuery = query(
        playersRef,
        where('roomId', '==', roomId),
        where('userId', '==', playerId)
      );
      const playerSnapshot = await getDocs(playerQuery);

      if (!playerSnapshot.empty) {
        const playerDoc = playerSnapshot.docs[0];
        await deleteDoc(doc(db, 'roomPlayers', playerDoc.id));

        toast({
          title: "Başarılı",
          description: "Oyuncu odadan atıldı.",
          });
        }
    } catch (error) {
      console.error('Oyuncu atma hatası:', error);
        toast({
          title: "Hata",
        description: "Oyuncu atılırken bir hata oluştu.",
          variant: "destructive",
        });
      }
  };

  // Oda ayarlarını güncelle
  const updateRoomSettings = async (newSettings: Partial<RoomSettings>) => {
    if (!isHost || !roomId || !room) return;

    try {
      // Maksimum oyuncu sayısı kontrolü
      if (newSettings.maxPlayers && newSettings.maxPlayers < 2) {
        toast({
          title: "Hata",
          description: "Maksimum oyuncu sayısı en az 2 olmalıdır.",
          variant: "destructive",
        });
        return;
      }

        const roomsRef = collection(db, 'rooms');
        const roomQuery = query(roomsRef, where('id', '==', roomId));
        const roomSnapshot = await getDocs(roomQuery);
        
        if (!roomSnapshot.empty) {
          const roomDoc = roomSnapshot.docs[0];
        const updatedSettings = { 
          ...roomSettings, 
          ...newSettings,
          minPlayers: 2 // Minimum oyuncu sayısını sabit tut
        };
        await updateDoc(doc(db, 'rooms', roomDoc.id), {
          settings: updatedSettings
        });

        setRoomSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Ayar güncelleme hatası:', error);
      toast({
        title: "Hata",
        description: "Oda ayarları güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Ses efektlerini yükle
  useEffect(() => {
    const loadSounds = () => {
      const newSounds = {
        correct: new Audio('/sounds/correct.mp3'),
        wrong: new Audio('/sounds/wrong.mp3'),
        close: new Audio('/sounds/close.mp3'),
        gameStart: new Audio('/sounds/game-start.mp3'),
        gameEnd: new Audio('/sounds/game-end.mp3'),
        countdown: new Audio('/sounds/countdown.mp3')
      };

      // Ses seviyelerini ayarla
      Object.values(newSounds).forEach(sound => {
        sound.volume = 0.5;
      });

      setSounds(newSounds);
    };

    loadSounds();
  }, []);

  // Ses çalma fonksiyonu
  const playSound = (soundName: 'correct' | 'wrong' | 'close' | 'gameStart' | 'gameEnd' | 'countdown') => {
    if (sounds && sounds[soundName]) {
      sounds[soundName].currentTime = 0;
      sounds[soundName].play().catch((error: Error) => {
        console.error('Ses çalma hatası:', error);
      });
    }
  };

  // Oyun başlatma fonksiyonunu güncelle
  const startGame = async () => {
    if (!isHost || !roomId || !room) return;

    try {
      // Oyuncu sayısını kontrol et
      const playersRef = collection(db, 'roomPlayers');
      const playersQuery = query(playersRef, where('roomId', '==', roomId));
      const playersSnapshot = await getDocs(playersQuery);

      if (playersSnapshot.size < 2) {
        setShowWaitingDialog(true);
        return;
          }

          // Test bilgilerini al
      const testRef = doc(db, 'tests', room.testId);
            const testDoc = await getDoc(testRef);
      
            if (testDoc.exists()) {
              const testData = testDoc.data();
        const totalQuestions = testData.questions.length;
        const firstQuestion = testData.questions[0];

        console.log('İlk soru yükleniyor:', firstQuestion);

        // Önce state'leri güncelle
        setTotalQuestions(totalQuestions);
        setCurrentQuestion(firstQuestion);
        setCurrentQuestionIndex(0);
        setRevealedParts(0);
        setTimeLeft(roomSettings.questionTime);
        
        // Sonra oda durumunu güncelle
        const roomsRef = collection(db, 'rooms');
        const roomQuery = query(roomsRef, where('id', '==', roomId));
        const roomSnapshot = await getDocs(roomQuery);
        
        if (!roomSnapshot.empty) {
          const roomDoc = roomSnapshot.docs[0];
          await updateDoc(doc(db, 'rooms', roomDoc.id), {
            countdown: 3,
            status: 'countdown',
            currentQuestionIndex: 0,
            totalQuestions: totalQuestions,
            currentQuestion: firstQuestion
          });

          // Oyun başlama sesi
          playSound('gameStart');
        }
        }
      } catch (error) {
      console.error('Oyun başlatma hatası:', error);
        toast({
          title: "Hata",
        description: "Oyun başlatılırken bir hata oluştu.",
          variant: "destructive",
        });
      }
    };

  // Geri sayım ve oyun başlatma
  useEffect(() => {
    if (!room) return;

    let timer: NodeJS.Timeout;
    if (room.status === 'countdown' && room.countdown > 0) {
      // Geri sayım sesi
      playSound('countdown');
      
      timer = setTimeout(() => {
        const roomsRef = collection(db, 'rooms');
        const roomQuery = query(roomsRef, where('id', '==', roomId));
        getDocs(roomQuery).then(snapshot => {
          if (!snapshot.empty) {
            const roomDoc = snapshot.docs[0];
            updateDoc(doc(db, 'rooms', roomDoc.id), {
              countdown: room.countdown - 1
            });
          }
        });
      }, 1000);
    } else if (room.status === 'countdown' && room.countdown === 0) {
      // Geri sayım bittiğinde oyunu devam ettir
      const roomsRef = collection(db, 'rooms');
      const roomQuery = query(roomsRef, where('id', '==', roomId));
      getDocs(roomQuery).then(snapshot => {
        if (!snapshot.empty) {
          const roomDoc = snapshot.docs[0];
          updateDoc(doc(db, 'rooms', roomDoc.id), {
            status: 'playing'
          });
        }
      });
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [room?.status, room?.countdown]);

  // Görsel parçalarını güncelle
  useEffect(() => {
    if (isGameStarted && currentQuestion?.imageUrl && !waitingForNextQuestion) {
      const totalParts = 25; // 5x5 grid
      const initialRevealedParts = Math.floor(totalParts * 0.2); // Başlangıçta %20'si açık
      const remainingParts = totalParts - initialRevealedParts;
      const interval = roomSettings.questionTime * 1000 / remainingParts;
      
      // Başlangıçta rastgele parçaları aç
      const initialParts = Array.from({ length: totalParts }, (_, i) => i)
        .sort(() => Math.random() - 0.5)
        .slice(0, initialRevealedParts);
      setRevealedParts(initialRevealedParts);
      
      // Kalan parçaları rastgele sırayla aç
      const remainingIndices = Array.from({ length: totalParts }, (_, i) => i)
        .filter(i => !initialParts.includes(i))
        .sort(() => Math.random() - 0.5);
      
      let currentIndex = 0;
      const timer = setInterval(() => {
        if (currentIndex < remainingIndices.length && !waitingForNextQuestion) {
          setRevealedParts(prev => prev + 1);
          currentIndex++;
        } else {
          clearInterval(timer);
          // Tüm parçalar açıldığında direkt yeni soruya geç
          if (currentIndex >= remainingIndices.length) {
            loadNextQuestion();
          }
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [isGameStarted, currentQuestion, roomSettings.questionTime, waitingForNextQuestion]);

  // Soru süresi kontrolü
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGameStarted && timeLeft > 0 && !waitingForNextQuestion) {
      timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isGameStarted && timeLeft === 0 && !waitingForNextQuestion) {
      // Süre bittiğinde direkt yeni soruya geç
      loadNextQuestion();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isGameStarted, timeLeft, waitingForNextQuestion]);

  // Yeni soru yükleme
  const loadNextQuestion = async () => {
    if (!room?.testId) return;

    try {
      const testRef = doc(db, 'tests', room.testId);
      const testDoc = await getDoc(testRef);
      if (testDoc.exists()) {
        const testData = testDoc.data();
        const nextIndex = currentQuestionIndex + 1;
        
        if (nextIndex < testData.questions.length) {
          // Yeni soruyu yükle ve tüm oyunculara bildir
          const roomsRef = collection(db, 'rooms');
          const roomQuery = query(roomsRef, where('id', '==', roomId));
          const roomSnapshot = await getDocs(roomQuery);
          
          if (!roomSnapshot.empty) {
            const roomDoc = roomSnapshot.docs[0];
            await updateDoc(doc(db, 'rooms', roomDoc.id), {
              currentQuestionIndex: nextIndex,
              status: 'countdown',
              countdown: 3,
              currentQuestion: testData.questions[nextIndex]
            });
          }

          setCurrentQuestion(testData.questions[nextIndex]);
          setCurrentQuestionIndex(nextIndex);
          setRevealedParts(0);
          setTimeLeft(roomSettings.questionTime);
          setWaitingForNextQuestion(false);
          setQuestionTransition(false);
        } else {
          // Oyun bitti
          endGame();
        }
      }
    } catch (error) {
      console.error('Soru yükleme hatası:', error);
    }
  };

  // Oyunu bitir
  const endGame = async () => {
    // Oyun bitiş sesi
    playSound('gameEnd');

    setIsGameStarted(false);
    setGameEnded(true);
    setQuestionTransition(false);
    setWaitingForNextQuestion(false);

    try {
      const roomsRef = collection(db, 'rooms');
      const roomQuery = query(roomsRef, where('id', '==', roomId));
      const roomSnapshot = await getDocs(roomQuery);
      
      if (!roomSnapshot.empty) {
        const roomDoc = roomSnapshot.docs[0];
        await updateDoc(doc(db, 'rooms', roomDoc.id), {
          status: 'finished',
          finishedAt: serverTimestamp()
        });
      }

      // Final skorlarını al
        const playersRef = collection(db, 'roomPlayers');
        const playersQuery = query(playersRef, where('roomId', '==', roomId));
        const playersSnapshot = await getDocs(playersQuery);
        
      const finalPlayers = playersSnapshot.docs.map(doc => ({
        id: doc.data().userId,
        username: doc.data().username,
        score: doc.data().score || 0,
        photoURL: doc.data().photoURL,
        isHost: doc.data().isHost,
        joinedAt: doc.data().joinedAt?.toDate() || new Date()
      }));

      setFinalScores(finalPlayers.sort((a, b) => b.score - a.score));

      toast({
        title: "Oyun Bitti!",
        description: "Tüm sorular tamamlandı.",
      });
    } catch (error) {
      console.error('Oyun bitirme hatası:', error);
    }
  };

  // Tahmin kontrolünü güncelle
  const handleGuess = async () => {
    console.log('Tahmin yapılıyor...', {
      guess,
      currentQuestion,
      isGameStarted,
      roomStatus: room?.status,
      roomId
    });

    if (!guess.trim() || !user || !roomId) {
      console.log('Tahmin yapılamadı:', { guess, user, roomId }); // Debug log
        toast({
        title: "Hata",
        description: "Lütfen bir tahmin girin.",
        variant: "destructive",
      });
      return;
    }

    // Soru kontrolü
    if (!currentQuestion) {
      console.log('Soru yüklenmemiş:', {
        currentQuestion,
        isGameStarted,
        roomStatus: room?.status,
        currentQuestionIndex
      });
      toast({
        title: "Hata",
        description: "Soru yükleniyor, lütfen bekleyin.",
        variant: "destructive",
      });
      return;
    }

    // Cevap kontrolü
    if (!currentQuestion.answers || !Array.isArray(currentQuestion.answers) || currentQuestion.answers.length === 0) {
      console.log('Cevap yüklenmemiş:', {
        question: currentQuestion,
        hasAnswers: !!currentQuestion.answers,
        answersLength: currentQuestion.answers?.length
      });
      toast({
        title: "Hata",
        description: "Soru cevabı yükleniyor, lütfen bekleyin.",
        variant: "destructive",
      });
      return;
    }

    try {
      const userGuess = guess.toLowerCase().trim();
      const correctAnswers = currentQuestion.answers.map((answer: string) => answer.toLowerCase().trim());
      
      console.log('Tahmin kontrol ediliyor:', {
        userGuess,
        correctAnswers,
        isCorrect: correctAnswers.includes(userGuess)
      });

      const isCorrect = correctAnswers.includes(userGuess);
      const isClose = !isCorrect && correctAnswers.some((answer: string) => answer.includes(userGuess));

      // Tahmini kaydet
      const messageRef = collection(db, 'roomGuesses');
      const guessData = {
        roomId,
        userId: user.uid,
        username: user.displayName || user.email?.split('@')[0] || 'Anonim',
        photoURL: user.photoURL,
        content: guess.trim(),
        isCorrect,
        isClose,
        createdAt: serverTimestamp()
      };

      console.log('Tahmin kaydediliyor:', guessData); // Debug log
      const docRef = await addDoc(messageRef, guessData);
      console.log('Tahmin kaydedildi, docId:', docRef.id); // Debug log

      if (isCorrect) {
        // Doğru tahmin sesi
        playSound('correct');

        // Doğru tahmin yapan oyuncuya puan ekle
        const playersRef = collection(db, 'roomPlayers');
        const playerQuery = query(
          playersRef,
          where('roomId', '==', roomId),
          where('userId', '==', user.uid)
        );
        const playerSnapshot = await getDocs(playerQuery);
      
        if (!playerSnapshot.empty) {
          const playerDoc = playerSnapshot.docs[0];
          const currentScore = playerDoc.data().score || 0;
          const questionScore = calculateScore((revealedParts / 25) * 100);
          
          await updateDoc(doc(db, 'roomPlayers', playerDoc.id), {
            score: currentScore + questionScore
          });

          // Doğru tahmin bildirimi - sadece tahmin yapan kullanıcıya
          toast({
            title: "Tebrikler!",
            description: `Doğru tahmin! +${questionScore} puan kazandınız.`,
          });
        }
      } else if (isClose) {
        // Yakın tahmin sesi
        playSound('close');

        toast({
          title: "Yaklaştın!",
          description: "Cevaba yaklaştınız, biraz daha düşünün.",
        });
      } else {
        // Yanlış tahmin sesi
        playSound('wrong');

        toast({
          title: "Yanlış",
          description: "Tekrar deneyin.",
          variant: "destructive",
        });
      }

      setGuess('');
    } catch (error) {
      console.error('Tahmin kontrolü hatası:', error);
      toast({
        title: "Hata",
        description: "Tahmin kontrol edilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Tahminleri dinle
  useEffect(() => {
    if (!roomId || !user) {
      console.log('Tahminler dinlenemiyor:', { roomId, user }); // Debug log
      return;
    }

    console.log('Tahminler dinleniyor, roomId:', roomId);

    const guessesRef = collection(db, 'roomGuesses');
    const guessesQuery = query(
      guessesRef,
      where('roomId', '==', roomId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribeGuesses = onSnapshot(guessesQuery, (snapshot) => {
      console.log('Tahminler güncellendi, snapshot size:', snapshot.size);
      
      const guessesList: Guess[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Tahmin verisi:', data);
        
        guessesList.push({
          id: doc.id,
          userId: data.userId,
          username: data.username,
          content: data.content,
          photoURL: data.photoURL,
          isCorrect: data.isCorrect,
          isClose: data.isClose,
          createdAt: data.createdAt
        });
      });
      
      console.log('İşlenmiş tahminler:', guessesList);
      setGuesses(guessesList);
    }, (error) => {
      console.error('Tahmin dinleme hatası:', error);
    });

    return () => unsubscribeGuesses();
  }, [roomId, user]);

  // Odadan çık
  const handleLeaveRoom = async () => {
    if (!user || !roomId || !room) return;
    setIsLeaving(true);

    try {
      const playersRef = collection(db, 'roomPlayers');
      const playerQuery = query(
        playersRef,
        where('roomId', '==', roomId),
        where('userId', '==', user.uid)
      );
      const playerSnapshot = await getDocs(playerQuery);

      if (!playerSnapshot.empty) {
        const playerDoc = playerSnapshot.docs[0];
        const playerData = playerDoc.data();

        // Eğer host çıkıyorsa, yeni host seç
        if (playerData.isHost) {
          const remainingPlayersQuery = query(
            playersRef,
            where('roomId', '==', roomId),
            where('userId', '!=', user.uid)
          );
          const remainingPlayersSnapshot = await getDocs(remainingPlayersQuery);
          
          if (!remainingPlayersSnapshot.empty) {
            // En uzun süredir odada olan oyuncuyu host yap
            const sortedPlayers = remainingPlayersSnapshot.docs.sort((a, b) => {
              const aTime = a.data().joinedAt?.toDate() || new Date(0);
              const bTime = b.data().joinedAt?.toDate() || new Date(0);
              return aTime.getTime() - bTime.getTime();
            });
            
            const newHost = sortedPlayers[0];
            await updateHostStatus(newHost.data().userId, true);

            toast({
              title: "Host Değişti",
              description: "En uzun süredir odada olan oyuncu yeni host oldu.",
            });
          } else {
            // Son oyuncu da çıkıyorsa odayı sil
            const roomsRef = collection(db, 'rooms');
            const roomQuery = query(roomsRef, where('id', '==', roomId));
            const roomSnapshot = await getDocs(roomQuery);
            
            if (!roomSnapshot.empty) {
              const roomDoc = roomSnapshot.docs[0];
              await deleteDoc(doc(db, 'rooms', roomDoc.id));
            }
          }
        }

        // Oyuncuyu odadan çıkar
        await deleteDoc(doc(db, 'roomPlayers', playerDoc.id));
      setLocation('/rooms');
      }
    } catch (error) {
      console.error('Odadan çıkma hatası:', error);
      toast({
        title: "Hata",
        description: "Odadan çıkarken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLeaving(false);
    }
  };

  // Oyuncuları dinle
  useEffect(() => {
    if (!roomId) return;

    console.log('Oyuncular dinleniyor, roomId:', roomId); // Debug log

    const playersRef = collection(db, 'roomPlayers');
    const playersQuery = query(
      playersRef,
      where('roomId', '==', roomId),
      orderBy('joinedAt', 'asc')
    );

    const unsubscribePlayers = onSnapshot(playersQuery, (snapshot) => {
      console.log('Oyuncular güncellendi, snapshot size:', snapshot.size); // Debug log
      
      const playersList: Player[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Oyuncu verisi:', data); // Debug log
        
        playersList.push({
          id: data.userId,
          username: data.username,
          score: data.score || 0,
          photoURL: data.photoURL,
          isHost: data.isHost,
          joinedAt: data.joinedAt?.toDate() || new Date()
        });
      });
      
      console.log('İşlenmiş oyuncular:', playersList); // Debug log
      setPlayers(playersList);
    }, (error) => {
      console.error('Oyuncu dinleme hatası:', error);
    });

    return () => unsubscribePlayers();
  }, [roomId]);

  // Oda verilerini dinle
  useEffect(() => {
    if (!roomId) return;

    console.log('Oda dinleniyor, roomId:', roomId); // Debug log

    const roomsRef = collection(db, 'rooms');
    const roomQuery = query(roomsRef, where('id', '==', roomId));
    const unsubscribe = onSnapshot(roomQuery, async (snapshot) => {
      console.log('Oda verisi güncellendi, snapshot size:', snapshot.size); // Debug log

      if (snapshot.empty) {
        console.log('Oda bulunamadı'); // Debug log
        toast({
          title: "Hata",
          description: "Oda bulunamadı.",
          variant: "destructive",
        });
        setLocation('/rooms');
        return;
      }

      const roomData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Room;
      console.log('Oda verisi:', roomData); // Debug log

      setRoom(roomData);
      setIsHost(roomData.hostId === user?.uid);
      setIsGameStarted(roomData.status === 'playing');
      setIsWaitingForHost(roomData.status === 'waiting' && roomData.hostId !== user?.uid);
      setIsLoading(false);

      // Oda ayarlarını güncelle
      if (roomData.settings) {
        setRoomSettings(roomData.settings);
      }

      // Oyun durumunu kontrol et
      if (roomData.status === 'playing') {
        console.log('Oyun başladı, soru yükleniyor...'); // Debug log
        
        // Mevcut soruyu yükle
        const testRef = doc(db, 'tests', roomData.testId);
        const testDoc = await getDoc(testRef);
        if (testDoc.exists()) {
          const testData = testDoc.data();
          if (testData.questions && testData.questions[roomData.currentQuestionIndex]) {
            const question = testData.questions[roomData.currentQuestionIndex];
            console.log('Soru yüklendi:', question); // Debug log
            
            setCurrentQuestion(question);
            setCurrentQuestionIndex(roomData.currentQuestionIndex);
            setRevealedParts(0);
            setTimeLeft(roomData.settings?.questionTime || 60);
            setWaitingForNextQuestion(false);
            setQuestionTransition(false);
          }
        }
      } else if (roomData.status === 'question_transition') {
        setWaitingForNextQuestion(true);
        setWaitingTime(roomData.waitingTime || 5);
        setQuestionTransition(true);
      } else if (roomData.status === 'finished') {
        setGameEnded(true);
        setWaitingForNextQuestion(false);
        setQuestionTransition(false);
      }
    });

    return () => unsubscribe();
  }, [roomId, user]);

  const handleInvite = () => {
    const inviteUrl = `${window.location.origin}/room/join?roomId=${roomId}`;
    setInviteLink(inviteUrl);
    setShowInviteModal(true);
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: "Başarılı",
        description: "Davet linki kopyalandı!",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Link kopyalanırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const deleteRoom = async () => {
    try {
      const roomsRef = collection(db, 'rooms');
      const roomQuery = query(roomsRef, where('id', '==', roomId));
      const roomSnapshot = await getDocs(roomQuery);
      
      if (!roomSnapshot.empty) {
        const roomDoc = roomSnapshot.docs[0];
        await deleteDoc(doc(db, 'rooms', roomDoc.id));
      }
    } catch (error) {
      console.error('Oda silme hatası:', error);
    }
  };

  const handleChatMessage = async () => {
    if (!chatMessage.trim() || !user || !roomId) return;

    try {
      const messageRef = collection(db, 'roomChat');
      await addDoc(messageRef, {
        roomId,
        userId: user.uid,
        username: user.displayName || user.email?.split('@')[0] || 'Anonim',
        photoURL: user.photoURL,
        content: chatMessage.trim(),
        createdAt: serverTimestamp()
      });

      setChatMessage('');
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      toast({
        title: "Hata",
        description: "Mesaj gönderilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Sohbet mesajlarını dinle
  useEffect(() => {
    if (!roomId) return;

    const chatRef = collection(db, 'roomChat');
    const chatQuery = query(
      chatRef,
      where('roomId', '==', roomId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          username: data.username,
          content: data.content,
          photoURL: data.photoURL,
          createdAt: data.createdAt
        });
      });
      setChatMessages(messages);
    });

    return () => unsubscribeChat();
  }, [roomId]);

  // Puan hesaplama fonksiyonu
  const calculateScore = (revealPercent: number) => {
    const baseScore = 100;
    const maxScore = 1000;
    const minScore = 100;
    
    // Görsel ne kadar az açıksa o kadar çok puan
    const score = Math.round(baseScore * (100 - revealPercent) / 10);
    
    return Math.min(Math.max(score, minScore), maxScore);
  };

  // Sayfadan ayrılma uyarısı
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGameStarted) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isGameStarted]);

  // Sayfa değişikliği uyarısı
  useEffect(() => {
    const handleLocationChange = async () => {
      if (isGameStarted) {
        const confirmed = window.confirm('Odadan çıkmak istediğinizden emin misiniz? Oyun sırasındaysanız puanınız kaydedilmeyecek.');
        if (!confirmed) {
          window.history.pushState(null, '', window.location.href);
          return;
        }
      }
      await handleLeaveRoom();
    };

    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [isGameStarted]);

  // Component unmount olduğunda odadan çık
  useEffect(() => {
    return () => {
      if (user && roomId) {
        handleLeaveRoom();
      }
    };
  }, [user, roomId]);

  // Admin transfer et
  const transferAdmin = async (newAdminId: string) => {
    if (!isHost || !roomId || !user || !room) return;

    try {
      // Yeni admin adayının oyuncu listesinde olduğunu kontrol et
      const playersRef = collection(db, 'roomPlayers');
      const newAdminQuery = query(
        playersRef,
        where('roomId', '==', roomId),
        where('userId', '==', newAdminId)
      );
      const newAdminSnapshot = await getDocs(newAdminQuery);

      if (newAdminSnapshot.empty) {
        toast({
          title: "Hata",
          description: "Seçilen kullanıcı odada bulunmuyor.",
          variant: "destructive",
        });
        return;
      }

      // Oyun başlamışsa admin değişikliğine izin verme
      if (room.status === 'playing') {
        toast({
          title: "Hata",
          description: "Oyun devam ederken admin değiştirilemez.",
          variant: "destructive",
        });
        return;
      }

      // Eski adminin yetkisini kaldır
      await updateHostStatus(user.uid, false);
      
      // Yeni adminin yetkisini ver
      await updateHostStatus(newAdminId, true);

      toast({
        title: "Başarılı",
        description: "Admin yetkisi transfer edildi.",
      });
    } catch (error) {
      console.error('Admin transfer hatası:', error);
      toast({
        title: "Hata",
        description: "Admin yetkisi transfer edilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Odaya katıl
  const joinRoom = async () => {
    if (!user || !roomId) {
      console.error('Odaya katılamıyor:', { user, roomId }); // Debug log
      return;
    }

    try {
      console.log('Odaya katılma başladı'); // Debug log

      // Kullanıcının zaten odada olup olmadığını kontrol et
      const playersRef = collection(db, 'roomPlayers');
      const existingPlayerQuery = query(
        playersRef,
        where('roomId', '==', roomId),
        where('userId', '==', user.uid)
      );
      const existingPlayerSnapshot = await getDocs(existingPlayerQuery);

      if (!existingPlayerSnapshot.empty) {
        console.log('Kullanıcı zaten odada'); // Debug log
        return;
      }

      // Oda bilgilerini al
      const roomsRef = collection(db, 'rooms');
      const roomQuery = query(roomsRef, where('id', '==', roomId));
      const roomSnapshot = await getDocs(roomQuery);
      
      if (!roomSnapshot.empty) {
        const roomDoc = roomSnapshot.docs[0];
        const roomData = roomDoc.data() as Room;
        console.log('Oda verisi alındı:', roomData); // Debug log

        // Oyun başlamışsa katılmaya izin verme
        if (roomData.status === 'playing') {
          toast({
            title: "Hata",
            description: "Oyun başlamış, katılamazsınız.",
            variant: "destructive",
          });
          setLocation('/rooms');
          return;
        }

        // Maksimum oyuncu sayısını kontrol et
        const allPlayersQuery = query(playersRef, where('roomId', '==', roomId));
        const allPlayersSnapshot = await getDocs(allPlayersQuery);
        
        if (allPlayersSnapshot.size >= roomData.settings.maxPlayers) {
          toast({
            title: "Hata",
            description: "Oda dolu.",
            variant: "destructive",
          });
          setLocation('/rooms');
          return;
        }

        // İlk oyuncu veya odayı kuran kişi host olur
        const isFirstPlayer = allPlayersSnapshot.empty;
        const isCreator = roomData.hostId === user.uid;
        const isHost = isFirstPlayer || isCreator;
        
        // Oyuncuyu ekle
        const playerData = {
          roomId,
          userId: user.uid,
          username: user.displayName || user.email?.split('@')[0] || 'Anonim',
          photoURL: user.photoURL || null,
          score: 0,
          isHost: isHost,
          joinedAt: serverTimestamp()
        };

        console.log('Oyuncu ekleniyor:', playerData); // Debug log
        await addDoc(playersRef, playerData);

        // Eğer host ise, oda ayarlarını güncelle
        if (isHost) {
          await updateHostStatus(user.uid, true);
        }

        console.log('Odaya katılma başarılı'); // Debug log
      }
    } catch (error) {
      console.error('Odaya katılma hatası:', error);
      toast({
        title: "Hata",
        description: "Odaya katılırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Component mount olduğunda odaya katıl
  useEffect(() => {
    if (user && roomId) {
      joinRoom();
    }
  }, [user, roomId]);

  // Oyunu sıfırla
  const resetGame = async () => {
    if (!roomId || !room) return;

    try {
      // Oda durumunu sıfırla
      const roomsRef = collection(db, 'rooms');
      const roomQuery = query(roomsRef, where('id', '==', roomId));
      const roomSnapshot = await getDocs(roomQuery);
      
      if (!roomSnapshot.empty) {
        const roomDoc = roomSnapshot.docs[0];
        await updateDoc(doc(db, 'rooms', roomDoc.id), {
          status: 'waiting',
          currentQuestionIndex: 0,
          countdown: null,
          startedAt: null,
          finishedAt: null
        });
      }

      // Oyuncuların skorlarını sıfırla
      const playersRef = collection(db, 'roomPlayers');
      const playersQuery = query(playersRef, where('roomId', '==', roomId));
      const playersSnapshot = await getDocs(playersQuery);
      
      const updatePromises = playersSnapshot.docs.map(doc => 
        updateDoc(doc.ref, { score: 0 })
      );
      await Promise.all(updatePromises);

      // Tahminleri temizle
      const guessesRef = collection(db, 'roomGuesses');
      const guessesQuery = query(guessesRef, where('roomId', '==', roomId));
      const guessesSnapshot = await getDocs(guessesQuery);
      
      const deletePromises = guessesSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      // State'leri sıfırla
      setGameEnded(false);
      setFinalScores([]);
      setCurrentQuestion(null);
      setCurrentQuestionIndex(0);
      setRevealedParts(0);
      setTimeLeft(roomSettings.questionTime);
      setWaitingForNextQuestion(false);
      setQuestionTransition(false);
      setIsGameStarted(false);
      setGuesses([]);

      toast({
        title: "Oyun Sıfırlandı",
        description: "Yeni oyun için hazır!",
      });
    } catch (error) {
      console.error('Oyun sıfırlama hatası:', error);
      toast({
        title: "Hata",
        description: "Oyun sıfırlanırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {isLoading ? (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="container max-w-7xl mx-auto py-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sol Panel - Oyun Alanı */}
            <div className="lg:col-span-8 space-y-6">
              {/* Oda Başlığı ve Kontroller */}
              <div className="flex items-center justify-between bg-card rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold">{room?.name}</h1>
                {isHost && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Crown className="w-4 h-4" />
                    Admin
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4">
                  {isGameStarted && !waitingForNextQuestion && (
                    <div className="w-32">
                      <Progress value={(timeLeft / roomSettings.questionTime) * 100} className="h-2" />
                    </div>
                  )}
                  {waitingForNextQuestion && (
                  <Badge variant="outline" className="text-lg">
                      Sonraki soru: {waitingTime}s
                  </Badge>
                )}
                  <div className="flex items-center gap-2">
                {isHost && (
                  <Button onClick={() => setShowSettings(true)} variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Ayarlar
                  </Button>
                )}
                <Button onClick={handleInvite} variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Davet Et
                </Button>
                <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <LogOut className="w-4 h-4 mr-2" />
                      Odadan Çık
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Odadan Çıkmak İstiyor musunuz?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Odadan çıkarsanız, oyun sırasındaysanız puanınız kaydedilmeyecek ve tekrar katılmak için oda ID'sine ihtiyacınız olacak.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>İptal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleLeaveRoom}
                        disabled={isLeaving}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isLeaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Çıkılıyor...
                          </>
                        ) : (
                          'Evet, Çık'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
                </div>
              </div>

              {/* Oyun Alanı */}
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-[4/3] bg-muted/50 flex items-center justify-center relative">
                {isWaitingForHost ? (
                      <div className="text-center p-8">
                        <div className="text-3xl font-bold mb-4">Oyun Başlamayı Bekliyor</div>
                        <div className="text-muted-foreground text-lg">Admin oyunu başlatacak...</div>
                  </div>
                    ) : room?.status === 'countdown' ? (
                      <div className="text-8xl font-bold animate-bounce text-primary">
                        {room.countdown > 0 ? room.countdown : 'Başlıyor!'}
                  </div>
                    ) : gameEnded ? (
                      <div className="w-full h-full p-8 bg-card">
                        <div className="max-w-2xl mx-auto">
                          <div className="text-3xl font-bold mb-6 text-center">Oyun Bitti!</div>
                          <div className="space-y-6">
                            <div className="text-xl font-semibold text-center">Final Skorları</div>
                            <div className="space-y-3">
                              {finalScores.map((player, index) => (
                      <div
                                  key={player.id}
                                  className={`flex items-center justify-between p-4 rounded-lg ${
                                    index === 0
                                      ? 'bg-yellow-500/10 border border-yellow-500/20'
                                      : 'bg-muted'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-lg">{index + 1}.</span>
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={player.photoURL} />
                                      <AvatarFallback>
                                        {player.username.slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-lg">{player.username}</span>
                                    {player.isHost && (
                                      <Crown className="w-5 h-5 text-yellow-500" />
                                    )}
                                  </div>
                                  <Badge variant="secondary" className="text-lg px-4 py-2">
                                    {player.score}
                                  </Badge>
                                </div>
                    ))}
                  </div>
                            <div className="flex justify-center gap-4 mt-8">
                              <Button variant="outline" size="lg" onClick={() => setLocation('/rooms')}>
                                Odalara Dön
                              </Button>
                              {isHost ? (
                                <Button size="lg" onClick={resetGame}>
                                  Tekrar Oyna
                                </Button>
                ) : (
                                <div className="text-center text-muted-foreground">
                                  Admin yeni oyunu başlatacak...
                  </div>
                )}
              </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <div className="relative w-full h-full bg-background rounded-lg shadow-lg overflow-hidden">
                          {currentQuestion?.imageUrl ? (
                            <ImageReveal
                              imageUrl={currentQuestion.imageUrl}
                              revealPercent={(revealedParts / 25) * 100}
                              className="w-full h-full object-cover"
                              staticReveal={false}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Loader2 className="w-8 h-8 animate-spin" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tahmin Kutusu */}
              {!gameEnded && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                <Input
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Tahmininizi yazın..."
                        disabled={!isGameStarted || waitingForNextQuestion}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGuess();
                    }
                  }}
                        className="h-12 text-lg"
                />
                <Button
                  onClick={handleGuess}
                        disabled={!isGameStarted || waitingForNextQuestion || !guess.trim()}
                        size="lg"
                        className="h-12 px-8"
                >
                  Tahmin Et
                </Button>
              </div>
                  </CardContent>
                </Card>
              )}

              {/* Oyun Başlat Butonu */}
              {isHost && !isGameStarted && !gameEnded && (
                <Button
                  onClick={startGame}
                  size="lg"
                  className="w-full h-14 text-lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Oyunu Başlat
                </Button>
              )}

          {/* Tahmin Geçmişi */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="w-5 h-5" />
                Son Tahminler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {guesses.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      Henüz tahmin yapılmadı
                    </div>
                  ) : (
                    guesses.map((guess) => {
                      // Tahmin yapan kullanıcı için özel gösterim
                      if (guess.userId === user?.uid) {
                        return (
                    <div
                      key={guess.id}
                            className={`p-3 rounded-lg ${
                        guess.isCorrect
                                ? 'bg-green-500/10 border border-green-500/20'
                          : guess.isClose
                                ? 'bg-yellow-500/10 border border-yellow-500/20'
                          : 'bg-muted'
                      }`}
                    >
                            <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={guess.photoURL} />
                          <AvatarFallback>
                            {guess.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                              <span className="font-medium">{guess.username}:</span>
                              <span className="text-sm text-muted-foreground">{guess.content}</span>
                        {guess.isCorrect && (
                                <Badge variant="success" className="ml-auto">Doğru!</Badge>
                        )}
                        {guess.isClose && (
                                <Badge variant="secondary" className="ml-auto">Yakın!</Badge>
                        )}
                      </div>
                    </div>
                        );
                      }
                      
                      // Diğer kullanıcılar için gösterim
                      if (guess.isCorrect) {
                        return (
                          <div key={guess.id} className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={guess.photoURL} />
                                <AvatarFallback>
                                  {guess.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{guess.username}</span>
                              <span className="text-sm text-muted-foreground">doğru bildi!</span>
                            </div>
                          </div>
                        );
                      }

                      // Yanlış tahminler herkese gösterilir
                      if (!guess.isClose) {
                        return (
                          <div key={guess.id} className="p-3 rounded-lg bg-muted">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={guess.photoURL} />
                                <AvatarFallback>
                                  {guess.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{guess.username}:</span>
                              <span className="text-sm text-muted-foreground">{guess.content}</span>
                            </div>
                          </div>
                        );
                      }

                      // Yakın tahminler diğer kullanıcılara gösterilmez
                      return null;
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sağ Panel - Sohbet ve Oyuncu Listesi */}
            <div className="lg:col-span-4 space-y-6">
          {/* Oyuncu Listesi */}
          <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                Oyuncular ({players.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
                  <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {players.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                          <AvatarImage src={player.photoURL} />
                          <AvatarFallback>
                            {player.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {player.username}
                        {player.isHost && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                              <div className="text-sm text-muted-foreground">
                                {player.score} puan
                              </div>
                            </div>
                          </div>
                        {isHost && player.id !== user?.uid && !player.isHost && (
                            <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => transferAdmin(player.id)}
                          >
                            Admin Yap
                          </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => kickPlayer(player.id)}
                              >
                                At
                              </Button>
                            </div>
                          )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Sohbet */}
              {roomSettings.allowChat && (
                <Card className="flex-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5" />
                Sohbet
              </CardTitle>
            </CardHeader>
            <CardContent>
                    <ScrollArea className="h-[400px] pr-4 mb-4">
                      <div className="space-y-3">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                            <Avatar className="h-8 w-8">
                        <AvatarImage src={message.photoURL} />
                        <AvatarFallback>
                          {message.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{message.username}</span>
                          <span className="text-xs text-muted-foreground">
                            {message.createdAt?.toDate().toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChatMessage();
                    }
                  }}
                        className="h-10"
                />
                      <Button onClick={handleChatMessage} size="sm">
                  Gönder
                </Button>
              </div>
            </CardContent>
          </Card>
              )}
        </div>
      </div>

          {/* Modaller */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Oda Ayarları</DialogTitle>
            <DialogDescription>
              Oyun ayarlarını buradan düzenleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Soru Süresi (saniye)</Label>
              <Slider
                    value={[roomSettings?.questionTime || 60]}
                    onValueChange={([value]) => {
                      const newValue = Math.max(10, Math.min(120, value));
                      updateRoomSettings({ questionTime: newValue });
                    }}
                min={10}
                max={120}
                step={5}
              />
              <div className="text-sm text-muted-foreground">
                    {roomSettings?.questionTime || 60} saniye
              </div>
            </div>

            <div className="space-y-2">
              <Label>Maksimum Oyuncu Sayısı</Label>
              <Slider
                    value={[roomSettings?.maxPlayers || 10]}
                    onValueChange={([value]) => {
                      const newValue = Math.max(2, Math.min(20, value));
                      updateRoomSettings({ maxPlayers: newValue });
                    }}
                    min={2}
                max={20}
                step={1}
              />
              <div className="text-sm text-muted-foreground">
                    {roomSettings?.maxPlayers || 10} oyuncu
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="allowChat"
                    checked={roomSettings?.allowChat ?? true}
                onCheckedChange={(checked) => updateRoomSettings({ allowChat: checked })}
              />
              <Label htmlFor="allowChat">Sohbete İzin Ver</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="showLeaderboard"
                    checked={roomSettings?.showLeaderboard ?? true}
                onCheckedChange={(checked) => updateRoomSettings({ showLeaderboard: checked })}
              />
              <Label htmlFor="showLeaderboard">Lider Tablosunu Göster</Label>
            </div>
          </div>
        </DialogContent>
      </Dialog>

          {/* Oyuncu Atıldı Alert */}
          <AlertDialog open={showKickedAlert} onOpenChange={setShowKickedAlert}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Odadan Atıldınız</AlertDialogTitle>
                <AlertDialogDescription>
                  Admin sizi odadan attı. Ana sayfaya yönlendiriliyorsunuz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => setLocation('/rooms')}>
                  Tamam
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

      {/* Davet Modalı */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arkadaşlarını Davet Et</DialogTitle>
            <DialogDescription>
              Aşağıdaki linki arkadaşlarınla paylaşarak onları odaya davet edebilirsin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Aşağıdaki linki arkadaşlarınla paylaş:
            </p>
            <div className="flex gap-2">
              <Input
                value={inviteLink}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={copyInviteLink}
                variant="outline"
                size="icon"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Oyuncu Bekleme Modalı */}
      <Dialog open={showWaitingDialog} onOpenChange={setShowWaitingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Oyuncular Bekleniyor</DialogTitle>
            <DialogDescription>
              Oyunu başlatmak için yeterli sayıda oyuncu bekleniyor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Users2 className="w-8 h-8 text-muted-foreground" />
              <div className="text-2xl font-bold">
                    {players.length}/{roomSettings.minPlayers}
              </div>
            </div>
                <Progress value={(players.length / roomSettings.minPlayers) * 100} />
            <p className="text-sm text-muted-foreground text-center">
                  Oyunu başlatmak için en az {roomSettings.minPlayers} oyuncu gerekiyor.
              Şu anda {players.length} oyuncu var.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowWaitingDialog(false)}
              >
                Kapat
              </Button>
              <Button
                onClick={() => {
                  setShowWaitingDialog(false);
                  startGame();
                }}
                    disabled={players.length < roomSettings.minPlayers}
              >
                Oyunu Başlat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      )}
    </div>
  );
};

export default MultiplayerRoom; 