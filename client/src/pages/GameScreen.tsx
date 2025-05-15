import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, Heart, Share2, Play, Clock, Calendar, User, MessageSquare, Loader2,
  ThumbsUp, Check, X, Trophy
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatTime, checkAnswer, calculateScore, playSoundEffect } from '@/lib/gameHelpers';
import ScoreDisplay from '@/components/game/ScoreDisplay';
import ImageReveal from '@/components/game/ImageReveal';
import ContentCard from '@/components/game/ContentCard';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/lib/LanguageContext';
import { doc, getDoc, collection, addDoc, query, where, orderBy, getDocs, updateDoc, increment, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

export default function GameScreen() {
  const [, setLocation] = useLocation();
  const { testId } = useParams<{ testId: string }>();
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'finished'>('playing');
  const [revealPercent, setRevealPercent] = useState(30);
  const [guessHistory, setGuessHistory] = useState<Array<{
    guess: string;
    isCorrect: boolean;
    isClose?: boolean;
  }>>([]);
  const [hasLiked, setHasLiked] = useState(false);
  
  const correctAnswersRef = useRef<string[]>([]);
  const imageRevealRef = useRef<any>(null);

  // All the query hooks and effects remain exactly the same as in the original file

  const saveGameScore = async (earnedScore: number, completed: boolean) => {
    try {
      if (!testId) return;
      
      const scoreData = {
        testId: testId,
        userId: user?.uid || null,
        score: earnedScore,
        completionTime: timeElapsed,
        attemptsCount: guessHistory.length,
        completed: completed,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'gameScores'), scoreData);
      
      if (user) {
        await addDoc(collection(db, 'userActivities'), {
          userId: user.uid,
          userName: user.displayName || user.email?.split('@')[0],
          activityType: 'play_test',
          details: `Test oynandı: ${test?.title}, Skor: ${earnedScore}`,
          entityId: testId,
          entityType: 'test',
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error saving game score:", error);
    }
  };

  // All remaining functions and JSX remain exactly the same as in the original file
  // Including handleGuess, handleSkip, handleLikeTest, handleAddComment, and all the rendering logic

  // The rest of the component implementation remains unchanged...
}