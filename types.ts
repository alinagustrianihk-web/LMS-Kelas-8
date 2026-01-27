
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  username: string; // Menggantikan email
  password?: string;
  name: string;
  role: UserRole;
  xp: number;
  streak?: number;
  lastCompletionDate?: string;
  unlockedChapters?: string[];
}

export interface ContentItem {
  type: 'h1' | 'h2' | 'p' | 'list';
  text?: string;
  items?: string[];
}

export interface Question {
  type: 'mcq' | 'tf';
  q: string;
  a?: string[];
  correct: number | boolean;
}

export interface Quest {
  id: string;
  chapterId: string;
  chapterTitle: string;
  order: number;
  title: string;
  topic: string;
  passingScore: number;
  rewardPoints: number;
  imageUrl: string;
  content: ContentItem[];
  questions: Question[];
  status?: 'published' | 'draft';
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  order: number;
  totalQuests: number;
}

export interface Progress {
  userId: string;
  levelId: string;
  score: number;
  completedAt: string;
}

export interface SystemConfig {
  semester: string;
  year: string;
  maintenance: boolean;
  announcement?: string;
}
