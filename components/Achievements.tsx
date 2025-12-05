import React from 'react';
import { Achievement } from '../services/progressService';
import { Trophy, Lock } from 'lucide-react';

interface AchievementsProps {
  achievements: Achievement[];
}

export const Achievements: React.FC<AchievementsProps> = ({ achievements }) => {
  const unlocked = achievements.filter(a => a.unlockedAt);
  const locked = achievements.filter(a => !a.unlockedAt);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-white">Achievements</h3>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {unlocked.length} / {achievements.length} unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {achievements.map((achievement) => {
          const isUnlocked = !!achievement.unlockedAt;
          const progress = Math.min(100, (achievement.progress / achievement.target) * 100);

          return (
            <div
              key={achievement.id}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                isUnlocked
                  ? 'bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 border-brand-400 dark:border-brand-500 shadow-md'
                  : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 opacity-60'
              }`}
            >
              {isUnlocked ? (
                <Trophy className="absolute top-2 right-2 text-brand-500" size={16} />
              ) : (
                <Lock className="absolute top-2 right-2 text-zinc-400" size={16} />
              )}

              <div className="text-3xl mb-2">{achievement.icon}</div>
              <h4 className={`font-bold text-sm mb-1 ${isUnlocked ? 'text-zinc-800 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                {achievement.name}
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                {achievement.description}
              </p>

              {!isUnlocked && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{Math.round(achievement.progress)}</span>
                    <span>{achievement.target}</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                    <div
                      className="bg-brand-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {isUnlocked && achievement.unlockedAt && (
                <div className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                  Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};



