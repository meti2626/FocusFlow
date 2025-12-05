import React, { useState } from 'react';
import { Video, Note } from '../types';
import { ArrowLeft, Save, FileText, X } from 'lucide-react';

interface VideoPlayerProps {
  video: Video;
  onBack: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onBack }) => {
  const [notes, setNotes] = useState<string>('');
  const [showNotes, setShowNotes] = useState(false);
  
  // Use embedUrl if available, otherwise construct from video ID
  const videoSrc = video.id === 'blocked' 
    ? '' 
    : video.embedUrl || (video.id.length === 11 
      ? `https://www.youtube.com/embed/${video.id}` 
      : `https://www.youtube.com/embed/jfKfPfyJRdk`); // Default lofi stream as fallback for demo

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 mb-4 transition-colors w-fit"
      >
        <ArrowLeft size={20} />
        Back to Explore
      </button>

      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0 relative">
        {/* Backdrop overlay for mobile when notes are open */}
        {showNotes && (
          <div 
            className="fixed inset-0 bg-black/50 z-10 lg:hidden"
            onClick={() => setShowNotes(false)}
          />
        )}
        
        {/* Video Section - Made larger */}
        <div className="flex-grow flex flex-col gap-4 min-w-0">
          <div className="relative">
            <div className="bg-black rounded-2xl overflow-hidden shadow-lg border border-zinc-800" style={{ aspectRatio: '16/9', maxHeight: 'calc(100vh - 200px)' }}>
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
            
            {/* Notes Toggle Icon Button - Positioned beside video */}
            {!showNotes && (
              <button
                onClick={() => setShowNotes(true)}
                className="absolute top-4 right-4 p-3 bg-white dark:bg-zinc-800 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 text-brand-600 dark:text-brand-400 border border-zinc-200 dark:border-zinc-700 z-10"
                title="Open Notes"
              >
                <FileText size={24} />
              </button>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{video.title}</h1>
            <h2 className="text-base font-medium text-brand-600 dark:text-brand-400">{video.channel}</h2>
          </div>
        </div>

        {/* Notes Section - Slides in from right */}
        <div className={`absolute lg:relative top-0 right-0 h-full w-full lg:w-96 flex-shrink-0 flex flex-col bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-xl overflow-hidden transition-transform duration-300 ease-in-out z-20 ${
          showNotes ? 'translate-x-0' : 'translate-x-full lg:translate-x-full'
        }`}>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <FileText className="text-brand-500" size={18} />
                <h3 className="font-semibold text-zinc-700 dark:text-zinc-200">Study Notes</h3>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-zinc-400 hover:text-brand-500 transition-colors" title="Save Notes">
                  <Save size={18} />
              </button>
              <button 
                onClick={() => setShowNotes(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors ml-2"
                title="Close Notes"
              >
                  <X size={18} />
              </button>
            </div>
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