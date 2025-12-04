import React, { useState } from 'react';
import { Video, Note } from '../types';
import { ArrowLeft, Save, FileText } from 'lucide-react';

interface VideoPlayerProps {
  video: Video;
  onBack: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onBack }) => {
  const [notes, setNotes] = useState<string>('');
  
  // Since we don't have real IDs for the generated content usually, we use a generic educational placeholder
  // unless the ID looks real (length 11).
  const videoSrc = video.id === 'blocked' 
    ? '' 
    : video.id.length === 11 
      ? `https://www.youtube.com/embed/${video.id}` 
      : `https://www.youtube.com/embed/jfKfPfyJRdk`; // Default lofi stream as fallback for demo

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 mb-4 transition-colors w-fit"
      >
        <ArrowLeft size={20} />
        Back to Explore
      </button>

      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
        {/* Video Section */}
        <div className="flex-grow flex flex-col gap-4">
          <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-zinc-800">
             {video.id === 'blocked' ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 text-white">
                    <h2 className="text-2xl font-bold text-red-400 mb-2">Distraction Blocked</h2>
                    <p>{video.description}</p>
                </div>
             ) : (
                <iframe
                width="100%"
                height="100%"
                src={videoSrc}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                ></iframe>
             )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{video.title}</h1>
            <h2 className="text-lg font-medium text-brand-600 dark:text-brand-400">{video.channel}</h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400 leading-relaxed">{video.description}</p>
          </div>
        </div>

        {/* Notes Section */}
        <div className="w-full lg:w-96 flex-shrink-0 flex flex-col h-full bg-white dark:bg-zinc-850 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <FileText className="text-brand-500" size={18} />
                <h3 className="font-semibold text-zinc-700 dark:text-zinc-200">Study Notes</h3>
            </div>
            <button className="text-zinc-400 hover:text-brand-500 transition-colors">
                <Save size={18} />
            </button>
          </div>
          <textarea
            className="flex-grow p-4 resize-none focus:outline-none bg-transparent text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans"
            placeholder="Take notes here while watching..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="p-2 bg-zinc-50 dark:bg-zinc-800 text-xs text-center text-zinc-400">
            Markdown supported
          </div>
        </div>
      </div>
    </div>
  );
};