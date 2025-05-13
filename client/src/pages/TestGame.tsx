import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Category } from "@shared/schema";
import { Check, X, BookOpen, Filter, Search, Loader2, Trophy, Clock, Zap, Grid3X3 } from "lucide-react";

import ImageReveal from "@/components/game/ImageReveal";
import GameControls from "@/components/game/GameControls";
import ScoreDisplay from "@/components/game/ScoreDisplay";
import CategorySelector from "@/components/game/CategorySelector";
import { calculateScore, checkAnswer, playSoundEffect } from "@/lib/gameHelpers";
import { getAllCategories, getAllTests, getTest } from "@/lib/firebaseHelpers";
import ContentCard from "@/components/game/ContentCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function TestGame() {
  const { toast } = useToast();
  const [_location, navigate] = useLocation();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [selectedTestId, setSelectedTestId] = useState<string | undefined>(undefined);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [revealPercent, setRevealPercent] = useState(30);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [currentImageCorrect, setCurrentImageCorrect] = useState<boolean | null>(null);
  const [guessHistory, setGuessHistory] = useState<Array<{
    guess: string;
    isCorrect: boolean;
    isClose?: boolean;
  }>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const imageRevealRef = useRef<any>(null);

  // Fetch all categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => getAllCategories()
  });

  // Fetch all tests
  const { data: allTests = [], isLoading: isTestsLoading } = useQuery({
    queryKey: ['/api/tests'],
    queryFn: () => getAllTests(),
    enabled: !testStarted
  });

  // Fetch popular tests
  const { data: popularTests = [], isLoading: isPopularTestsLoading } = useQuery({
    queryKey: ['/api/tests/popular'],
    queryFn: () => getAllTests().then(tests => 
      [...tests].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 10)
    ),
    enabled: !testStarted && activeTab === "popular"
  });

  // Fetch newest tests
  const { data: newestTests = [], isLoading: isNewestTestsLoading } = useQuery({
    queryKey: ['/api/tests/newest'],
    queryFn: () => getAllTests().then(tests => 
      [...tests].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 10)
    ),
    enabled: !testStarted && activeTab === "newest"
  });

  // Fetch selected test
  const { data: selectedTest, isLoading: isSelectedTestLoading } = useQuery({
    queryKey: [`test-${selectedTestId}`],
    queryFn: () => getTest(selectedTestId!),
    enabled: !!selectedTestId && testStarted
  });

  // Filter tests based on search query and category
  const filteredTests = React.useMemo(() => {
    let tests = allTests;
    
    if (activeTab === "popular") {
      tests = popularTests;
    } else if (activeTab === "newest") {
      tests = newestTests;
    }
    
    return tests.filter(test => {
      const matchesSearch = searchQuery 
        ? test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (test.description && test.description.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
        
      const matchesCategory = selectedCategoryId
        ? test.categoryId === selectedCategoryId
        : true;
        
      return matchesSearch && matchesCategory;
    });
  }, [allTests, popularTests, newestTests, searchQuery, selectedCategoryId, activeTab]);

  // Start test with selected test
  const startTest = async (testId: string) => {
    try {
      setSelectedTestId(testId);
      setCurrentImageIndex(0);
      setRevealPercent(30);
      setScore(0);
      setAttempts(0);
      setTestStarted(true);
      setTestCompleted(false);
      setCurrentImageCorrect(null);
      setGuessHistory([]);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Test başlatılırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Function to increase reveal percentage
  const increaseRevealPercent = () => {
    setRevealPercent(prev => {
      const newPercent = Math.min(prev + 15, 100);
      return newPercent;
    });
  };

  // Move to the next image in the test
  const moveToNextImage = () => {
    if (!selectedTest) return;
    
    const nextIndex = currentImageIndex + 1;
    
    if (nextIndex < selectedTest.questions.length) {
      setCurrentImageIndex(nextIndex);
      setRevealPercent(30);
      setAttempts(0);
      setCurrentImageCorrect(null);
      setGuessHistory([]);
    } else {
      // Test completed
      setTestCompleted(true);
      playSoundEffect('complete', 0.7);
      toast({
        title: "Test Tamamlandı!",
        description: `Toplam puanınız: ${score}`,
        variant: "success",
      });
    }
  };

  // Handle guess submission
  const handleGuess = async (guess: string) => {
    if (!testStarted || testCompleted || !selectedTest) return;
    
    const currentQuestion = selectedTest.questions[currentImageIndex];
    
    // Check if answer is correct
    const result = checkAnswer(guess, currentQuestion.answers);
    const isCorrect = result.isCorrect;
    const isClose = result.isClose;
    
    // Add to guess history
    setGuessHistory(prev => [
      { 
        guess, 
        isCorrect, 
        isClose: !isCorrect && isClose
      },
      ...prev
    ]);
    
    if (isCorrect) {
      // Calculate score based on reveal percentage
      const roundScore = calculateScore(revealPercent);
      setScore(prev => prev + roundScore);
      setCurrentImageCorrect(true);
      
      // Play sound for correct answer
      playSoundEffect('correct', 0.5);
      
      // Show correct guess effect
      if (imageRevealRef.current) {
        imageRevealRef.current.showCorrectGuessEffect();
      }
      
      toast({
        title: "Doğru!",
        description: `+${roundScore} puan kazandınız.`,
        variant: "success",
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
      
      // Play sound for incorrect answer
      if (isClose) {
        playSoundEffect('close', 0.5);
        toast({
          title: "Yaklaştınız!",
          description: "Çok yaklaştınız, tekrar deneyin.",
          variant: "default",
        });
      } else {
        playSoundEffect('incorrect', 0.5);
        toast({
          title: "Yanlış!",
          description: "Tekrar deneyin.",
          variant: "destructive",
        });
      }
      
      // Reset the wrong answer indication after a delay
      setTimeout(() => {
        setCurrentImageCorrect(null);
      }, 1500);
    }
  };

  // Handle skipping current image
  const handleSkip = () => {
    if (!testStarted || testCompleted || !selectedTest) return;
    
    const currentQuestion = selectedTest.questions[currentImageIndex];
    
    toast({
      title: "Görsel Atlandı",
      description: `Doğru cevap: ${currentQuestion.answers[0]}`,
      variant: "warning",
    });
    
    moveToNextImage();
  };

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  // Handle restart test
  const handleRestartTest = () => {
    if (selectedTestId) {
      startTest(selectedTestId);
    }
  };

  // Handle go to home
  const handleGoHome = () => {
    navigate('/');
  };

  // Calculate progress percentage
  const progressPercent = testStarted && selectedTest
    ? Math.round(((currentImageIndex) / selectedTest.questions.length) * 100) 
    : 0;

  // Get current question
  const currentQuestion = selectedTest?.questions && selectedTest.questions.length > currentImageIndex 
    ? selectedTest.questions[currentImageIndex] 
    : null;

  return (
    <div className="max-w-4xl mx-auto">
      {!testStarted ? (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-4">Test Modu</h1>
            <p className="text-zinc-400">
              Kullanıcılar tarafından oluşturulan testleri çözün ve puanınızı diğer kullanıcılarla karşılaştırın.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Testler</CardTitle>
                    <CardDescription>Oynamak istediğiniz testi seçin</CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Test ara..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <CategorySelector
                      onCategoryChange={handleCategoryChange}
                      selectedCategoryId={selectedCategoryId}
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
                  <TabsList className="mb-6 custom-tab-bg">
                    <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Grid3X3 className="w-4 h-4 mr-2" />
                      Tüm Testler
                    </TabsTrigger>
                    <TabsTrigger value="popular" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Trophy className="w-4 h-4 mr-2" />
                      Popüler
                    </TabsTrigger>
                    <TabsTrigger value="newest" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      Yeni Eklenenler
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="mt-0">
                    {isTestsLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="animate-pulse bg-muted rounded-lg h-48"></div>
                        ))}
                      </div>
                    ) : filteredTests.length === 0 ? (
                      <div className="text-center p-12 bg-muted/30 rounded-lg">
                        <h3 className="text-xl font-medium mb-2">Arama kriterinizle eşleşen test bulunamadı</h3>
                        <p className="text-muted-foreground mb-4">Lütfen farklı filtreler veya anahtar kelimelerle tekrar deneyin</p>
                        <Button 
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategoryId(undefined);
                          }}
                        >
                          Filtreleri Temizle
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredTests.map((test) => (
                          <ContentCard
                            key={test.id}
                            title={test.title}
                            imageUrl={test.thumbnailUrl || 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500'}
                            playCount={test.playCount || 0}
                            likeCount={test.likeCount || 0}
                            duration={`${test.questions?.length || 0} soru`}
                            onClick={() => startTest(test.id)}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="popular" className="mt-0">
                    {isPopularTestsLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="animate-pulse bg-muted rounded-lg h-48"></div>
                        ))}
                      </div>
                    ) : filteredTests.length === 0 ? (
                      <div className="text-center p-12 bg-muted/30 rounded-lg">
                        <h3 className="text-xl font-medium mb-2">Arama kriterinizle eşleşen test bulunamadı</h3>
                        <p className="text-muted-foreground mb-4">Lütfen farklı filtreler veya anahtar kelimelerle tekrar deneyin</p>
                        <Button 
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategoryId(undefined);
                          }}
                        >
                          Filtreleri Temizle
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredTests.map((test) => (
                          <ContentCard
                            key={test.id}
                            title={test.title}
                            imageUrl={test.thumbnailUrl || 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500'}
                            playCount={test.playCount || 0}
                            likeCount={test.likeCount || 0}
                            duration={`${test.questions?.length || 0} soru`}
                            onClick={() => startTest(test.id)}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="newest" className="mt-0">
                    {isNewestTestsLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="animate-pulse bg-muted rounded-lg h-48"></div>
                        ))}
                      </div>
                    ) : filteredTests.length === 0 ? (
                      <div className="text-center p-12 bg-muted/30 rounded-lg">
                        <h3 className="text-xl font-medium mb-2">Arama kriterinizle eşleşen test bulunamadı</h3>
                        <p className="text-muted-foreground mb-4">Lütfen farklı filtreler veya anahtar kelimelerle tekrar deneyin</p>
                        <Button 
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategoryId(undefined);
                          }}
                        >
                          Filtreleri Temizle
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredTests.map((test) => (
                          <ContentCard
                            key={test.id}
                            title={test.title}
                            imageUrl={test.thumbnailUrl || 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500'}
                            playCount={test.playCount || 0}
                            likeCount={test.likeCount || 0}
                            duration={`${test.questions?.length || 0} soru`}
                            onClick={() => startTest(test.id)}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-8">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {isSelectedTestLoading ? (
                      <div className="animate-pulse bg-zinc-800 h-6 w-48 rounded"></div>
                    ) : selectedTest ? (
                      <div className="flex items-center">
                        <BookOpen className="w-5 h-5 mr-2 text-primary" />
                        {selectedTest.title}
                      </div>
                    ) : (
                      "Test Yükleniyor..."
                    )}
                  </CardTitle>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setTestStarted(false);
                      setSelectedTestId(undefined);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Testi Bitir
                  </Button>
                </div>
                {testStarted && !testCompleted && selectedTest && (
                  <div className="w-full bg-zinc-800 h-2 rounded-full mt-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isSelectedTestLoading ? (
                  <div className="animate-pulse bg-zinc-800 h-80 rounded-lg flex items-center justify-center">
                    <p className="text-zinc-500">Test yükleniyor...</p>
                  </div>
                ) : !selectedTest ? (
                  <div className="bg-zinc-800 h-80 rounded-lg flex items-center justify-center">
                    <p className="text-zinc-500">Test bulunamadı.</p>
                  </div>
                ) : testCompleted ? (
                  <div className="flex flex-col items-center justify-center h-80 gap-6 bg-zinc-800 rounded-lg p-8">
                    <h3 className="text-2xl font-bold text-center">
                      Test Tamamlandı! 🎉
                    </h3>
                    <div className="text-center">
                      <p className="text-zinc-400 mb-2">
                        Toplam {selectedTest.questions.length} sorudan {selectedTest.questions.length} tanesini doğru cevapladınız.
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
                        onClick={() => setTestStarted(false)}
                      >
                        Testlere Dön
                      </Button>
                    </div>
                  </div>
                ) : currentQuestion ? (
                  <div className="space-y-6">
                    <div className="relative">
                      <ImageReveal
                        ref={imageRevealRef}
                        imageUrl={currentQuestion.imageUrl}
                        revealPercent={revealPercent}
                        className="w-full h-80 object-contain"
                        gridSize={5}
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
                      isDisabled={currentImageCorrect !== null}
                      guessHistory={guessHistory}
                    />
                  </div>
                ) : (
                  <div className="bg-zinc-800 h-80 rounded-lg flex items-center justify-center">
                    <p className="text-zinc-500">Soru bulunamadı.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="col-span-12 md:col-span-4">
            <ScoreDisplay
              score={score}
              mode="test"
              extraInfo={{ 
                attempts,
                correctAnswers: currentImageIndex,
                totalQuestions: selectedTest?.questions?.length || 0,
                revealPercent
              }}
            />
            
            <Card className="bg-zinc-900 border-zinc-800 mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-green-500" />
                  Test Hakkında
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {isSelectedTestLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                    <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
                    <div className="h-4 bg-zinc-800 rounded w-5/6"></div>
                  </div>
                ) : selectedTest ? (
                  <>
                    <p>{selectedTest.description || "Bu test hakkında açıklama bulunmuyor."}</p>
                    <div className="pt-2">
                      <div className="flex justify-between py-1 border-b border-zinc-800">
                        <span className="text-zinc-400">Toplam Soru:</span>
                        <span>{selectedTest.questions.length}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-800">
                        <span className="text-zinc-400">Mevcut Soru:</span>
                        <span>{currentImageIndex + 1}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-800">
                        <span className="text-zinc-400">Kategori:</span>
                        <span>{categories.find(c => c.id === selectedTest.categoryId)?.name || "Genel"}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-400">Oluşturan:</span>
                        <span>{selectedTest.isAnonymous ? "Anonim" : "Kullanıcı"}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p>Test bilgisi yüklenemedi.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}