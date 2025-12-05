// Progress tracking service with localStorage persistence

export interface StudySession {
  id: string;
  date: string; // ISO date string
  duration: number; // minutes
  type: 'pomodoro' | 'video' | 'file' | 'other';
  subject?: string;
  description?: string;
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  sessions: number;
  subjects: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number;
  target: number;
}

const STORAGE_KEYS = {
  SESSIONS: 'focusFlow_sessions',
  GOALS: 'focusFlow_goals',
  ACHIEVEMENTS: 'focusFlow_achievements',
  STREAK: 'focusFlow_streak',
};

// Get all study sessions
export const getSessions = (): StudySession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Add a new study session
export const addSession = (session: Omit<StudySession, 'id'>): void => {
  try {
    const sessions = getSessions();
    const newSession: StudySession = {
      ...session,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    sessions.push(newSession);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    updateStreak();
    checkAchievements();
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

// Get daily progress for the last N days
export const getDailyProgress = (days: number = 365): DailyProgress[] => {
  const sessions = getSessions();
  const dailyMap = new Map<string, DailyProgress>();

  // Initialize all days
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyMap.set(dateStr, {
      date: dateStr,
      totalMinutes: 0,
      sessions: 0,
      subjects: [],
    });
  }

  // Fill with actual data
  sessions.forEach((session) => {
    const dateStr = session.date.split('T')[0];
    const daily = dailyMap.get(dateStr);
    if (daily) {
      daily.totalMinutes += session.duration;
      daily.sessions += 1;
      if (session.subject && !daily.subjects.includes(session.subject)) {
        daily.subjects.push(session.subject);
      }
    }
  });

  return Array.from(dailyMap.values()).reverse();
};

// Get total study time
export const getTotalStudyTime = (): number => {
  const sessions = getSessions();
  return sessions.reduce((total, session) => total + session.duration, 0);
};

// Get current streak
export const getStreak = (): number => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.STREAK);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
};

// Update streak
export const updateStreak = (): void => {
  const sessions = getSessions();
  if (sessions.length === 0) {
    localStorage.setItem(STORAGE_KEYS.STREAK, '0');
    return;
  }

  // Sort sessions by date
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Check consecutive days
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    const hasSession = sortedSessions.some(s => 
      s.date.split('T')[0] === dateStr && s.duration > 0
    );

    if (hasSession) {
      streak++;
    } else if (i > 0) {
      // Allow one day gap for current streak
      break;
    }
  }

  localStorage.setItem(STORAGE_KEYS.STREAK, streak.toString());
};

// Get weekly stats
export const getWeeklyStats = () => {
  const daily = getDailyProgress(7);
  const totalMinutes = daily.reduce((sum, day) => sum + day.totalMinutes, 0);
  const totalSessions = daily.reduce((sum, day) => sum + day.sessions, 0);
  const activeDays = daily.filter(day => day.totalMinutes > 0).length;

  return {
    totalMinutes,
    totalHours: (totalMinutes / 60).toFixed(1),
    totalSessions,
    activeDays,
    averagePerDay: activeDays > 0 ? (totalMinutes / activeDays).toFixed(1) : '0',
  };
};

// Get monthly stats
export const getMonthlyStats = () => {
  const daily = getDailyProgress(30);
  const totalMinutes = daily.reduce((sum, day) => sum + day.totalMinutes, 0);
  const totalSessions = daily.reduce((sum, day) => sum + day.sessions, 0);
  const activeDays = daily.filter(day => day.totalMinutes > 0).length;

  return {
    totalMinutes,
    totalHours: (totalMinutes / 60).toFixed(1),
    totalSessions,
    activeDays,
    averagePerDay: activeDays > 0 ? (totalMinutes / activeDays).toFixed(1) : '0',
  };
};

// Get subject breakdown
export const getSubjectBreakdown = () => {
  const sessions = getSessions();
  const subjectMap = new Map<string, number>();

  sessions.forEach((session) => {
    const subject = session.subject || 'General';
    const current = subjectMap.get(subject) || 0;
    subjectMap.set(subject, current + session.duration);
  });

  return Array.from(subjectMap.entries())
    .map(([subject, minutes]) => ({
      subject,
      minutes,
      hours: (minutes / 60).toFixed(1),
      percentage: (minutes / getTotalStudyTime() * 100).toFixed(1),
    }))
    .sort((a, b) => b.minutes - a.minutes);
};

// Achievement system
export const getAchievements = (): Achievement[] => {
  const sessions = getSessions();
  const totalMinutes = getTotalStudyTime();
  const streak = getStreak();
  const totalSessions = sessions.length;

  const achievements: Achievement[] = [
    {
      id: 'first_session',
      name: 'Getting Started',
      description: 'Complete your first study session',
      icon: '🎯',
      progress: totalSessions > 0 ? 1 : 0,
      target: 1,
      unlockedAt: totalSessions > 0 ? sessions[0]?.date : undefined,
    },
    {
      id: 'streak_7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day study streak',
      icon: '🔥',
      progress: streak,
      target: 7,
      unlockedAt: streak >= 7 ? new Date().toISOString() : undefined,
    },
    {
      id: 'streak_30',
      name: 'Monthly Master',
      description: 'Maintain a 30-day study streak',
      icon: '💪',
      progress: streak,
      target: 30,
      unlockedAt: streak >= 30 ? new Date().toISOString() : undefined,
    },
    {
      id: 'hours_10',
      name: 'Dedicated Learner',
      description: 'Study for 10 hours total',
      icon: '📚',
      progress: totalMinutes / 60,
      target: 10,
      unlockedAt: totalMinutes >= 600 ? new Date().toISOString() : undefined,
    },
    {
      id: 'hours_50',
      name: 'Knowledge Seeker',
      description: 'Study for 50 hours total',
      icon: '🌟',
      progress: totalMinutes / 60,
      target: 50,
      unlockedAt: totalMinutes >= 3000 ? new Date().toISOString() : undefined,
    },
    {
      id: 'hours_100',
      name: 'Study Champion',
      description: 'Study for 100 hours total',
      icon: '🏆',
      progress: totalMinutes / 60,
      target: 100,
      unlockedAt: totalMinutes >= 6000 ? new Date().toISOString() : undefined,
    },
    {
      id: 'sessions_100',
      name: 'Centurion',
      description: 'Complete 100 study sessions',
      icon: '💯',
      progress: totalSessions,
      target: 100,
      unlockedAt: totalSessions >= 100 ? new Date().toISOString() : undefined,
    },
  ];

  return achievements;
};

// Check and unlock achievements
export const checkAchievements = (): void => {
  // This is called automatically when sessions are added
  // Achievements are calculated on-the-fly
};

// Get study goals
export const getGoals = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.GOALS);
    return stored ? JSON.parse(stored) : {
      dailyMinutes: 60,
      weeklyMinutes: 420,
      monthlyMinutes: 1800,
    };
  } catch {
    return {
      dailyMinutes: 60,
      weeklyMinutes: 420,
      monthlyMinutes: 1800,
    };
  }
};

// Set study goals
export const setGoals = (goals: { dailyMinutes?: number; weeklyMinutes?: number; monthlyMinutes?: number }): void => {
  try {
    const current = getGoals();
    const updated = { ...current, ...goals };
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving goals:', error);
  }
};

// Get goal progress
export const getGoalProgress = () => {
  const goals = getGoals();
  const weekly = getWeeklyStats();
  const monthly = getMonthlyStats();
  const today = getDailyProgress(1)[0];

  return {
    daily: {
      current: today?.totalMinutes || 0,
      target: goals.dailyMinutes,
      percentage: Math.min(100, ((today?.totalMinutes || 0) / goals.dailyMinutes) * 100),
    },
    weekly: {
      current: weekly.totalMinutes,
      target: goals.weeklyMinutes,
      percentage: Math.min(100, (weekly.totalMinutes / goals.weeklyMinutes) * 100),
    },
    monthly: {
      current: monthly.totalMinutes,
      target: goals.monthlyMinutes,
      percentage: Math.min(100, (monthly.totalMinutes / goals.monthlyMinutes) * 100),
    },
  };
};



