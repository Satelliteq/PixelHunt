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
 * 
 * @param userAnswer - The user's guess
 * @param correctAnswers - Array of acceptable answers
 * @returns Boolean indicating if the answer is correct
 */
export function checkAnswer(userAnswer: string, correctAnswers: string[]): boolean {
  const normalizedUserAnswer = userAnswer.trim().toLowerCase();
  
  // Check if any of the correct answers match
  return correctAnswers.some(answer => 
    answer.toLowerCase() === normalizedUserAnswer
  );
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
