import React from 'react';
import { DailyProgress } from '../services/progressService';

interface ProgressChartProps {
  data: DailyProgress[];
  days: number;
  title: string;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ data, days, title }) => {
  const maxMinutes = Math.max(...data.map(d => d.totalMinutes), 1);
  const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Group by weeks if showing more than 7 days
  const renderBars = () => {
    if (days <= 7) {
      // Show daily bars
      return data.map((day, index) => {
        const height = (day.totalMinutes / maxMinutes) * 100;
        const date = new Date(day.date);
        const dayName = weekLabels[date.getDay()];
        
        return (
          <div key={index} className="flex flex-col items-center gap-1 flex-1">
            <div className="relative w-full h-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-brand-500 to-brand-400 rounded-lg transition-all duration-500"
                style={{ height: `${height}%` }}
                title={`${day.totalMinutes} min on ${day.date}`}
              />
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{dayName}</span>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {day.totalMinutes > 0 ? `${Math.round(day.totalMinutes)}m` : ''}
            </span>
          </div>
        );
      });
    } else {
      // Show weekly averages
      const weeks: DailyProgress[][] = [];
      for (let i = 0; i < data.length; i += 7) {
        weeks.push(data.slice(i, i + 7));
      }

      return weeks.map((week, weekIndex) => {
        const weekTotal = week.reduce((sum, day) => sum + day.totalMinutes, 0);
        const weekAvg = weekTotal / week.length;
        const height = (weekAvg / maxMinutes) * 100;

        return (
          <div key={weekIndex} className="flex flex-col items-center gap-1 flex-1">
            <div className="relative w-full h-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-brand-500 to-brand-400 rounded-lg transition-all duration-500"
                style={{ height: `${height}%` }}
                title={`${weekAvg.toFixed(0)} min avg - Week ${weekIndex + 1}`}
              />
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">W{weekIndex + 1}</span>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {weekAvg > 0 ? `${Math.round(weekAvg)}m` : ''}
            </span>
          </div>
        );
      });
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">{title}</h3>
      <div className="flex items-end gap-2 h-40">
        {renderBars()}
      </div>
    </div>
  );
};


