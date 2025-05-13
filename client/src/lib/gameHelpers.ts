/**
 * Calculates score based on reveal percentage and optionally time factors
 * 
 * @param revealPercent - Percentage of image that has been revealed (10-100)
 * @param timeElapsedOrRemaining - Optional time factor (elapsed time for speed mode, remaining time for timed mode)
 * @param isTimeRemaining - Whether timeElapsedOrRemaining represents remaining time (true) or elapsed time (false)
 * @returns The calculated score
 */
export function calculateScore(
  revealPercent: number,
  timeElapsedOrRemaining?: number,
  isTimeRemaining = false
): number {
  // Base score calculation - more points for less revealed image
  // Scale is approximately 1000 points for minimal reveal (10%) to 100 points for fully revealed (100%)
  const baseScore = Math.round(1100 - (revealPercent * 10));
  
  // If no time factor, return base score
  if (timeElapsedOrRemaining === undefined) {
    return baseScore;
  }
  
  // Apply time factor
  if (isTimeRemaining) {
    // For time-based modes where remaining time is a bonus
    // More remaining time = higher score multiplier
    const timeBonus = Math.round(timeElapsedOrRemaining * 5); // 5 points per second remaining
    return baseScore + timeBonus;
  } else {
    // For speed-based modes where elapsed time reduces score
    // Less time taken = higher score multiplier
    const timeFactor = Math.max(0.5, 1 - (timeElapsedOrRemaining / 120)); // Degrades over 120 seconds to 50%
    return Math.round(baseScore * timeFactor);
  }
}

/**
 * Determines if an answer is correct by comparing with accepted answers
 * And also checks if the answer is close enough (similar)
 * 
 * @param userAnswer - The user's guess
 * @param correctAnswers - Array of acceptable answers
 * @returns Object with isCorrect and isClose flags
 */
export function checkAnswer(userAnswer: string, correctAnswers: string[]): 
{ isCorrect: boolean; isClose: boolean; closestAnswer?: string } {
  const normalizedUserAnswer = userAnswer.trim().toLowerCase();
  
  // Check for exact match
  const isCorrect = correctAnswers.some(answer => 
    answer.toLowerCase() === normalizedUserAnswer
  );
  
  if (isCorrect) {
    return { isCorrect: true, isClose: false };
  }
  
  // If not exact match, check for similarity (75% match)
  let isClose = false;
  let closestMatch = '';
  let highestSimilarity = 0;
  
  correctAnswers.forEach(answer => {
    const similarity = calculateStringSimilarity(normalizedUserAnswer, answer.toLowerCase());
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      closestMatch = answer;
    }
  });
  
  isClose = highestSimilarity >= 0.75; // 75% veya üstü benzerlik varsa yakın tahmin
  
  return { 
    isCorrect: false, 
    isClose, 
    closestAnswer: isClose ? closestMatch : undefined 
  };
}

/**
 * Calculates string similarity using Levenshtein distance
 * 
 * @param a - First string
 * @param b - Second string
 * @returns Similarity value between 0-1
 */
export function calculateStringSimilarity(a: string, b: string): number {
  if (a.length === 0) return b.length === 0 ? 1 : 0;
  if (b.length === 0) return 0;
  
  // Calculate Levenshtein distance
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // Deletion
        matrix[i][j - 1] + 1,      // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }
  
  const distance = matrix[b.length][a.length];
  const maxLength = Math.max(a.length, b.length);
  
  // Return similarity as value between 0-1
  return 1 - distance / maxLength;
}

/**
 * Gets difficulty text based on difficulty level
 * 
 * @param difficulty - Difficulty level (1-5)
 * @returns String description of difficulty
 */
export function getDifficultyText(difficulty: number): string {
  switch (difficulty) {
    case 1:
      return "Kolay";
    case 2:
      return "Orta";
    case 3:
      return "Zor";
    case 4:
      return "Çok Zor";
    case 5:
      return "Uzman";
    default:
      return "Bilinmiyor";
  }
}

/**
 * Generate a grid of cells for image reveal
 * 
 * @param gridSize - Size of the grid (e.g., 5 for 5x5)
 * @param revealPercent - Percentage of cells to reveal
 * @returns Array of cell indices to be revealed
 */
export function generateRevealGrid(gridSize: number, revealPercent: number): number[] {
  const totalCells = gridSize * gridSize;
  const cellsToReveal = Math.floor(totalCells * (revealPercent / 100));
  
  // Create array of all cell indices
  const allCells = Array.from({ length: totalCells }, (_, i) => i);
  
  // Shuffle array
  for (let i = allCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
  }
  
  // Return only the cells to reveal
  return allCells.slice(0, cellsToReveal);
}

/**
 * Format time in seconds to MM:SS format
 * 
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Ses efektleri için URL'ler - Düzeltildi: Ses dosyaları yerine boş fonksiyon kullanılıyor
const SOUND_EFFECTS = {
  correct: '/sounds/correct.mp3',
  incorrect: '/sounds/incorrect.mp3',
  close: '/sounds/close.mp3',
  reveal: '/sounds/reveal.mp3',
  complete: '/sounds/complete.mp3',
};

/**
 * Belirtilen ses efektini çal
 * 
 * @param effectName - Efekt adı
 * @param volume - Ses seviyesi (0-1)
 */
export function playSoundEffect(
  effectName: keyof typeof SOUND_EFFECTS,
  volume = 0.5
): void {
  // Ses dosyaları mevcut olmadığı için sessiz bir şekilde devam et
  // Hata mesajını konsola yazdırmayı da kaldırıyoruz
  try {
    // Ses dosyaları mevcut olmadığı için hiçbir şey yapma
    // Sadece sessizce devam et
  } catch (err) {
    // Hata mesajını gösterme
  }
}

/**
 * Cevaba göre artan bir şekilde parça açma algoritması
 * Her yanlış tahminde açılan parça miktarı artar
 * 
 * @param currentRevealPercent - Mevcut açılan yüzde
 * @param wrongAttempts - Yanlış tahmin sayısı
 * @param maxReveal - Maksimum açılabilecek yüzde
 * @returns Yeni açılma yüzdesi
 */
export function calculateNewRevealPercent(
  currentRevealPercent: number,
  wrongAttempts: number,
  maxReveal = 100
): number {
  // Yanlış tahmin sayısı arttıkça daha fazla parça açılır
  const increaseAmount = Math.min(5 + (wrongAttempts * 2), 15);
  return Math.min(currentRevealPercent + increaseAmount, maxReveal);
}