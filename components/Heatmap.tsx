import React from 'react';

export const Heatmap: React.FC = () => {
  // Generate mock data for the last ~100 days
  const generateData = () => {
    return Array.from({ length: 98 }).map(() => Math.floor(Math.random() * 5));
  };

  const data = generateData();

  const getColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-zinc-100 dark:bg-zinc-800';
      case 1: return 'bg-brand-100 dark:bg-brand-900/40';
      case 2: return 'bg-brand-300 dark:bg-brand-700';
      case 3: return 'bg-brand-500 dark:bg-brand-500';
      case 4: return 'bg-brand-700 dark:bg-brand-400';
      default: return 'bg-zinc-100 dark:bg-zinc-800';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-end mb-2">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Study Streak</h3>
        <span className="text-xs text-zinc-400">Last 3 months</span>
      </div>
      <div className="grid grid-rows-7 grid-flow-col gap-1 w-full overflow-hidden">
        {data.map((level, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm ${getColor(level)} transition-all hover:scale-125`}
            title={`${level * 2} hours studied`}
          />
        ))}
      </div>
      <div className="flex justify-end items-center gap-2 mt-2 text-xs text-zinc-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-zinc-100 dark:bg-zinc-800"></div>
          <div className="w-3 h-3 rounded-sm bg-brand-100 dark:bg-brand-900/40"></div>
          <div className="w-3 h-3 rounded-sm bg-brand-300 dark:bg-brand-700"></div>
          <div className="w-3 h-3 rounded-sm bg-brand-500 dark:bg-brand-500"></div>
          <div className="w-3 h-3 rounded-sm bg-brand-700 dark:bg-brand-400"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
};