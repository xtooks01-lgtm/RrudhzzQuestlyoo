
import { Task, UserProfile, DailyProgress, ChatMessage } from '../types';

const STORAGE_KEY = 'questly_data_v9';

interface StorageData {
  tasks: Task[];
  user: UserProfile;
  history: DailyProgress[];
  chatHistory: ChatMessage[];
}

const emptyData: StorageData = {
  tasks: [],
  user: {
    name: '',
    xp: 0,
    level: 1,
    streak: 0,
    totalCompleted: 0,
    badges: [],
    onboardingComplete: false,
    tutorialComplete: false,
    rankXP: 0,
    currentRank: 'Iron',
    currentTier: 'IV',
    highestRank: 'Iron IV',
    settings: {
      color: 'violet',
      isHighContrast: false,
      notificationsEnabled: true,
      rudhhPersonality: 'Brilliant, supportive, and slightly eccentric academic mentor.',
      modelPreference: 'fast',
      isRankedMode: true
    }
  },
  history: [
    { date: 'Sun', count: 0 }, { date: 'Mon', count: 0 }, { date: 'Tue', count: 0 }, { date: 'Wed', count: 0 },
    { date: 'Thu', count: 0 }, { date: 'Fri', count: 0 }, { date: 'Sat', count: 0 },
  ],
  chatHistory: [],
};

export const api = {
  getData: (): StorageData => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyData));
        return emptyData;
      }
      const parsed = JSON.parse(saved);
      if (!parsed.user || !parsed.user.settings) parsed.user = emptyData.user;
      if (!parsed.chatHistory) parsed.chatHistory = [];
      if (!parsed.history) parsed.history = emptyData.history;
      if (!parsed.tasks) parsed.tasks = [];
      return parsed;
    } catch (e) {
      console.error("Storage corruption detected. Resetting to defaults.", e);
      return emptyData;
    }
  },
  saveData: (data: StorageData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  updateTasks: (tasks: Task[]) => {
    const current = api.getData();
    api.saveData({ ...current, tasks });
  },
  updateUser: (user: UserProfile) => {
    const current = api.getData();
    api.saveData({ ...current, user });
  },
  updateChatHistory: (chatHistory: ChatMessage[]) => {
    const current = api.getData();
    api.saveData({ ...current, chatHistory });
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
