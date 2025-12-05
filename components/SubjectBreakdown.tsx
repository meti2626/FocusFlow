import React from 'react';
import { BookOpen } from 'lucide-react';

interface SubjectData {
  subject: string;
  minutes: number;
  hours: string;
  percentage: string;
}

interface SubjectBreakdownProps {
  subjects: SubjectData[];
}

export const SubjectBreakdown: React.FC<SubjectBreakdownProps> = ({ subjects }) => {
  if (subjects.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400">
        <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
        <p>No subject data yet. Start studying to see your breakdown!</p>
      </div>
    );
  }

  const totalMinutes = subjects.reduce((sum, s) => sum + s.minutes, 0);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-zinc-800 dark:text-white mb-4">Subject Breakdown</h3>
      <div className="space-y-3">
        {subjects.map((subject, index) => {
          const width = (subject.minutes / totalMinutes) * 100;

          return (
            <div key={index} className="p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-500" />
                  <span className="font-medium text-zinc-800 dark:text-white">{subject.subject}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-zinc-800 dark:text-white">{subject.hours}h</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">{subject.percentage}%</span>
                </div>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};



