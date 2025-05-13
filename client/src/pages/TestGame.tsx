import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Category } from "@shared/schema";
import { Check, X } from "lucide-react";

import ImageReveal from "@/components/game/ImageReveal";
import GameControls from "@/components/game/GameControls";
import ScoreDisplay from "@/components/game/ScoreDisplay";
import CategorySelector from "@/components/game/CategorySelector";
import { calculateScore } from "@/lib/gameHelpers";

const QUESTIONS_PER_TEST = 10;

export default function TestGame() {
  const { toast } = useToast();
  const [_location, navigate] = useLocation();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [currentImageId, setCurrentImageId] = useState<number | undefined>(undefined);
  const [testImages, setTestImages] = useState<Image[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [revealPercent, setRevealPercent] = useState(30);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [currentImageCorrect, setCurrentImageCorrect] = useState<boolean | null>(null);
  const [categoryName, setCategoryName] = useState<string>("");

  // Fetch all categories to display the selected category name
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch the current image
  const { data: currentImage, isLoading: isImageLoading } = useQuery<Image>({
    queryKey: currentImageId ? [`/api/images/${currentImageId}`] : null,
    enabled: !!currentImageId,
  });

  // Fetch images for test by category
  const fetchTestImages = async (categoryId?: number): Promise<Image[]> => {
    // In a real app, this would fetch a limited set of images for the test
    // For now, we'll fetch all images or images by category, then take 10 random ones
    const endpoint = categoryId 
      ? `/api/images/category/${categoryId}`
      : "/api/images";
    
    const response = await fetch(endpoint);
    let images = await response.json();
    
    // Shuffle and take first 10 images or all if less than 10
    images = shuffleArray(images);
    return images.slice(0, QUESTIONS_PER_TEST);
  };

  // Shuffle function for randomizing images
  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Check answer mutation
  const checkAnswerMutation = useMutation({
    mutationFn: async (guess: string) => {
      const response = await fetch('/api/game/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: currentImageId, answer: guess }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.isCorrect) {
        // Calculate score based on reveal percentage
        const roundScore = calculateScore(revealPercent);
        setScore(prev => prev + roundScore);
        setCurrentImageCorrect(true);
        
        toast({
          title: "Doğru!",
          description: `+${roundScore} puan kazandınız.`,
          variant: "success",
        });
        
        // Save game score in the background
        saveGameScore({
          userId: undefined, // Guest user
          imageId: currentImageId!,
          gameMode: "test",
          attemptsCount: attempts + 1,
          timeSpent: 0,
          score: roundScore,
          completed: true
        });
        
        // Wait a bit to show the correct status, then move to next
        setTimeout(() => {
          moveToNextImage();
        }, 1500);
      } else {
        // Increase reveal percentage on wrong guess
        increaseRevealPercent();
        setAttempts(prev => prev + 1);
        setCurrentImageCorrect(false);
        
        toast({
          title: "Yanlış!",
          description: "Tekrar deneyin.",
          variant: "destructive",
        });
        
        // Reset the wrong answer indication after a delay
        setTimeout(() => {
          setCurrentImageCorrect(null);
        }, 1500);
      }
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Tahmin kontrol edilirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  // Save game score mutation
  const saveGameScoreMutation = useMutation({
    mutationFn: async (scoreData: any) => {
      const response = await fetch('/api/game/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/images/popular'] });
      queryClient.invalidateQueries({ queryKey: ['/api/images/favorites'] });
    },
  });

  // Function to save game score
  const saveGameScore = (scoreData: any) => {
    saveGameScoreMutation.mutate(scoreData);
  };

  // Update category name when selection changes
  useEffect(() => {
    if (selectedCategoryId && categories) {
      const category = categories.find(c => c.id === selectedCategoryId);
      if (category) {
        setCategoryName(category.name);
      }
    } else {
      setCategoryName("Genel");
    }
  }, [selectedCategoryId, categories]);

  // Function to increase reveal percentage
  const increaseRevealPercent = () => {
    setRevealPercent(prev => {
      const newPercent = Math.min(prev + 15, 100);
      return newPercent;
    });
  };

  // Start test with selected category
  const startTest = async () => {
    try {
      const images = await fetchTestImages(selectedCategoryId);
      if (images.length === 0) {
        toast({
          title: "Uyarı",
          description: "Bu kategori için yeterli görsel yok. Lütfen farklı bir kategori seçin.",
          variant: "warning",
        });
        return;
      }
      
      setTestImages(images);
      setCurrentImageIndex(0);
      setCurrentImageId(images[0].id);
      setRevealPercent(30);
      setScore(0);
      setAttempts(0);
      setTestStarted(true);
      setTestCompleted(false);
      setCurrentImageCorrect(null);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Test başlatılırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Move to the next image in the test
  const moveToNextImage = () => {
    const nextIndex = currentImageIndex + 1;
    
    if (nextIndex < testImages.length) {
      setCurrentImageIndex(nextIndex);
      setCurrentImageId(testImages[nextIndex].id);
      setRevealPercent(30);
      setAttempts(0);
      setCurrentImageCorrect(null);
    } else {
      // Test completed
      setTestCompleted(true);
      toast({
        title: "Test Tamamlandı!",
        description: `Toplam puanınız: ${score}`,
        variant: "success",
      });
    }
  };

  // Handle guess submission
  const handleGuess = (guess: string) => {
    if (!testStarted || testCompleted) return;
    checkAnswerMutation.mutate(guess);
  };

  // Handle skipping current image
  const handleSkip = () => {
    if (!testStarted || testCompleted) return;
    
    // Save a score of 0 if skipping
    if (currentImageId) {
      saveGameScore({
        userId: undefined,
        imageId: currentImageId,
        gameMode: "test",
        attemptsCount: attempts,
        timeSpent: 0,
        score: 0,
        completed: false
      });
    }
    
    const answers = currentImage?.answers as string[] || [];
    toast({
      title: "Görsel Atlandı",
      description: `Doğru cevap: ${answers[0]}`,
      variant: "warning",
    });
    
    moveToNextImage();
  };

  // Handle category change
  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
  };

  // Handle restart test
  const handleRestartTest = () => {
    startTest();
  };

  // Handle go to home
  const handleGoHome = () => {
    navigate('/');
  };

  // Calculate progress percentage
  const progressPercent = testStarted 
    ? Math.round(((currentImageIndex) / testImages.length) * 100) 
    : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Test Modu</h1>
        <p className="text-zinc-400">
          {testStarted 
            ? `${categoryName} kategorisinde test yapıyorsunuz. ${testImages.length} sorudan ${currentImageIndex + 1}. sorudasınız.`
            : "Kategori seçerek bilginizi test edin. Belirli sayıda görsel üzerinde tahmin yeteneklerinizi ölçer."}
        </p>
      </div>
      
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {testStarted 
                    ? `Soru ${currentImageIndex + 1}/${testImages.length}`
                    : "Test Başlat"}
                </CardTitle>
                {!testStarted && (
                  <CategorySelector
                    onCategoryChange={handleCategoryChange}
                    selectedCategoryId={selectedCategoryId}
                  />
                )}
              </div>
              {testStarted && !testCompleted && (
                <div className="w-full bg-zinc-800 h-2 rounded-full mt-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!testStarted ? (
                <div className="flex flex-col items-center justify-center h-96 gap-6">
                  <h3 className="text-xl font-bold text-center">
                    {selectedCategoryId 
                      ? `${categoryName} kategorisinde test hazır!`
                      : "Genel kategoride test hazır!"}
                  </h3>
                  <p className="text-center text-zinc-400 max-w-md">
                    {QUESTIONS_PER_TEST} adet sorudan oluşan bu testte, görselleri tahmin ederek puan kazanacaksınız.
                  </p>
                  <Button 
                    size="lg" 
                    className="bg-red-500 hover:bg-red-600"
                    onClick={startTest}
                  >
                    Testi Başlat
                  </Button>
                </div>
              ) : testCompleted ? (
                <div className="flex flex-col items-center justify-center h-96 gap-6">
                  <h3 className="text-2xl font-bold text-center">
                    Test Tamamlandı! 🎉
                  </h3>
                  <div className="text-center">
                    <p className="text-zinc-400 mb-2">
                      Toplam {testImages.length} sorudan {score / calculateScore(revealPercent)} tanesini doğru cevapladınız.
                    </p>
                    <p className="text-3xl font-bold">
                      {score} Puan
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <Button 
                      size="lg" 
                      className="bg-green-500 hover:bg-green-600"
                      onClick={handleRestartTest}
                    >
                      Yeniden Başlat
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={handleGoHome}
                    >
                      Ana Sayfaya Dön
                    </Button>
                  </div>
                </div>
              ) : isImageLoading ? (
                <div className="animate-pulse bg-zinc-800 h-96 rounded-lg flex items-center justify-center">
                  <p className="text-zinc-500">Görsel yükleniyor...</p>
                </div>
              ) : currentImage ? (
                <div className="space-y-6">
                  <div className="relative">
                    <ImageReveal
                      imageUrl={currentImage.imageUrl}
                      revealPercent={revealPercent}
                      className="w-full h-96"
                    />
                    
                    {currentImageCorrect !== null && (
                      <div className={`absolute inset-0 flex items-center justify-center rounded-lg ${
                        currentImageCorrect ? "bg-green-500/20" : "bg-red-500/20"
                      }`}>
                        {currentImageCorrect ? (
                          <Check className="h-24 w-24 text-green-500" />
                        ) : (
                          <X className="h-24 w-24 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <GameControls
                    onGuess={handleGuess}
                    onSkip={handleSkip}
                    isDisabled={checkAnswerMutation.isPending || currentImageCorrect !== null}
                  />
                </div>
              ) : (
                <div className="bg-zinc-800 h-96 rounded-lg flex items-center justify-center">
                  <p className="text-zinc-500">Görsel bulunamadı.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-12 md:col-span-4">
          <ScoreDisplay
            score={score}
            mode="test"
            extraInfo={{ attempts }}
          />
          
          <Card className="bg-zinc-900 border-zinc-800 mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Test Hakkında</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>1. Test için bir kategori seçebilirsiniz.</p>
              <p>2. Test toplam {QUESTIONS_PER_TEST} sorudan oluşur.</p>
              <p>3. Her soru için sınırsız sayıda tahmin hakkınız var.</p>
              <p>4. Yanlış tahminde bulundukça, resmin daha fazla bölümü açılır.</p>
              <p>5. Ne kadar az açıkken doğru tahmin ederseniz, o kadar çok puan alırsınız.</p>
              <p className="font-semibold mt-4">İpucu: İyi gözlemcilik yetenekleri gerektirir!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
