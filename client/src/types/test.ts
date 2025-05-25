export interface Test {
  id: string;
  uuid: string;
  title: string;
  description: string;
  creatorId?: string;
  categoryId?: string;
  questions: Question[];
  thumbnailUrl?: string;
  playCount: number;
  likeCount: number;
  isPublic: boolean;
  isAnonymous: boolean;
  approved: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Question {
  id?: string;
  question: string;
  imageUrl?: string;
  options: string[];
  correctAnswer: number;
} 