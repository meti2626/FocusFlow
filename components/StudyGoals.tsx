import React, { useState } from 'react';
import { getGoals, setGoals, getGoalProgress } from '../services/progressService';
import { Target, Edit2, Check } from 'lucide-react';

export const StudyGoals: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const goals = getGoals();
  const progress = getGoalProgress();
  const [editGoals, setEditGoals] = useState(goals);

  const handleSave = () => {
    setGoals(editGoals);
    setIsEditing(false);
  };

  const GoalCard = ({ 
    label, 
    current, 
    target, 
    percentage 
  }: { 
    label: string; 
    current: number; 
    target: number; 
    percentage: number;
  }) => (
    <div className="p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {Math.round(current)} / {target} min
        </span>
      </div>
      <div className="w-full bg-zinc-100 dark:bg-zinc-700 rounded-full h-3 mb-2 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${
            percentage >= 100
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : 'bg-gradient-to-r from-brand-500 to-brand-400'
          }`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {percentage >= 100 ? '🎉 Goal achieved!' : `${Math.round(percentage)}% complete`}
        </span>
        {percentage >= 100 && (
          <span className="text-xs font-bold text-green-600 dark:text-green-400">+{Math.round(percentage - 100)}%</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="text-brand-500" size={20} />
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-white">Study Goals</h3>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-zinc-500 hover:text-brand-500 transition-colors"
            title="Edit Goals"
          >
            <Edit2 size={16} />
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="p-1.5 text-brand-500 hover:text-brand-600 transition-colors"
            title="Save Goals"
          >
            <Check size={16} />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Daily Goal (minutes)
            </label>
            <input
              type="number"
              value={editGoals.dailyMinutes}
              onChange={(e) => setEditGoals({ ...editGoals, dailyMinutes: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Weekly Goal (minutes)
            </label>
            <input
              type="number"
              value={editGoals.weeklyMinutes}
              onChange={(e) => setEditGoals({ ...editGoals, weeklyMinutes: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Monthly Goal (minutes)
            </label>
            <input
              type="number"
              value={editGoals.monthlyMinutes}
              onChange={(e) => setEditGoals({ ...editGoals, monthlyMinutes: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <GoalCard
            label="Today"
            current={progress.daily.current}
            target={progress.daily.target}
            percentage={progress.daily.percentage}
          />
          <GoalCard
            label="This Week"
            current={progress.weekly.current}
            target={progress.weekly.target}
            percentage={progress.weekly.percentage}
          />
          <GoalCard
            label="This Month"
            current={progress.monthly.current}
            target={progress.monthly.target}
            percentage={progress.monthly.percentage}
          />
        </div>
      )}
    </div>
  );
};



