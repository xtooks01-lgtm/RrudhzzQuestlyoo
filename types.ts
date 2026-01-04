
export type TaskCategory = 'Study' | 'Health' | 'Coding' | 'Creative' | 'Other';
export type TaskDifficulty = 'Easy' | 'Hard' | 'Extremely Hard';
export type ThemeColor = 'violet' | 'emerald' | 'blue' | 'rose' | 'amber';
export type ChatModel = 'fast' | 'genius';

export type RankName = 'Iron' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Mythic';
export type RankTier = 'IV' | 'III' | 'II' | 'I';

export interface ThemeSettings {
  color: ThemeColor;
  isHighContrast: boolean;
  notificationsEnabled: boolean;
  rudhhPersonality: string;
  modelPreference: ChatModel;
  isRankedMode: boolean;
}

export interface Task {
  id: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  isCompleted: boolean;
  isStarted?: boolean; // New: Manual activation flag
  isLate: boolean;
  isDeducted?: boolean; // Track if XP was already deducted for failure
  xpValue: number;
  date: string;      // YYYY-MM-DD
  createdAt: string;
  completedAt?: string;
}

export interface UserProfile {
  name: string;
  xp: number;
  level: number;
  streak: number;
  totalCompleted: number;
  badges: Badge[];
  settings: ThemeSettings;
  profilePicture?: string;
  onboardingComplete: boolean;
  tutorialComplete: boolean;
  rankXP: number;
  currentRank: RankName;
  currentTier: RankTier;
  highestRank: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: string;
  rewardXP: number;
}

export interface DailyProgress {
  date: string;
  count: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  thinkingProcess?: string;
  modelUsed?: string;
  groundingChunks?: any[];
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    mimeType: string;
    data?: string; 
  };
}

export interface PracticeQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface MasteryChallenge {
  questions: PracticeQuestion[];
  nextQuest: {
    title: string;
    description: string;
    category: string;
  };
}

export interface SuggestedTask {
  title: string;
  description: string;
  category: string;
}
