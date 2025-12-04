
import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  BookOpen, 
  BarChart2, 
  FolderOpen, 
  Search, 
  Plus,
  FileText,
  Loader2,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { Tab, Video, StudyFile } from './types';
import { Pomodoro } from './components/Pomodoro';
import { Heatmap } from './components/Heatmap';
import { VideoPlayer } from './components/VideoPlayer';
import { FileViewer } from './components/FileViewer';
import { searchEducationalVideos } from './services/geminiService';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.FILES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [currentFile, setCurrentFile] = useState<StudyFile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Initialize files from localStorage or use defaults
  const [files, setFiles] = useState<StudyFile[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('focusFlowFiles');
        if (saved) {
          // Note: Object URLs cannot be persisted in localStorage, 
          // so 'url' will be undefined for reloaded files unless we reconstruct it or use mock data.
          return JSON.parse(saved).map((f: any) => ({
            ...f,
            lastOpened: new Date(f.lastOpened)
          }));
        }
      } catch (e) {
        console.error("Failed to load files", e);
      }
    }
    // Default mock initial data with dummy URLs for demo purposes
    return [
      { 
        id: '1', 
        name: 'Advanced_React_Patterns.pdf', 
        type: 'pdf', 
        lastOpened: new Date(), 
        size: '2.4 MB',
        // Mock PDF URL (using a sample PDF for demo)
        url: 'https://pdfobject.com/pdf/sample.pdf' 
      },
      { 
        id: '2', 
        name: 'Project_Goals.txt', 
        type: 'txt', 
        lastOpened: new Date(Date.now() - 86400000), 
        size: '1 KB',
        url: 'data:text/plain;base64,VGhpcyBpcyBhIHNhbXBsZSB0ZXh0IGZpbGUgZm9yIHRoZSBGb2N1c0Zsb3cgZGVtby4=' 
      },
    ];
  });

  // Persist files to localStorage whenever they change
  useEffect(() => {
    // We filter out the 'url' property when saving to avoid cluttering localStorage with potentially invalid blob refs
    const filesToSave = files.map(({ url, ...rest }) => rest);
    localStorage.setItem('focusFlowFiles', JSON.stringify(filesToSave));
  }, [files]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setActiveTab(Tab.EXPLORE);
    setCurrentVideo(null); 
    setCurrentFile(null);

    try {
      const results = await searchEducationalVideos(searchQuery);
      setVideos(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      
      const newFile: StudyFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.name.split('.').pop() || 'file',
        lastOpened: new Date(),
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        url: objectUrl
      };
      setFiles(prev => [newFile, ...prev]);
    }
  };

  const handleDeleteFile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFiles(prev => prev.filter(f => f.id !== id));
    setActiveMenuId(null);
    if (currentFile?.id === id) {
      setCurrentFile(null);
    }
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const openFile = (file: StudyFile) => {
    // Update last opened date
    const updatedFiles = files.map(f => 
      f.id === file.id ? { ...f, lastOpened: new Date() } : f
    );
    setFiles(updatedFiles);
    setCurrentFile(file);
  };

  // --- Views ---

  const renderFiles = () => {
    if (currentFile) {
      return (
        <FileViewer 
          file={currentFile} 
          onBack={() => setCurrentFile(null)} 
        />
      );
    }

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[500px]">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-zinc-800 dark:text-white">Workspace</h2>
          <label className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer transition-colors shadow-sm active:scale-95">
            <Plus size={18} />
            Add File
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
          {files.length === 0 ? (
             <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50">
               <FolderOpen size={48} className="mb-4 opacity-50" />
               <p className="font-medium text-lg mb-1">No files yet</p>
               <p className="text-sm opacity-75">Upload materials from your PC to start studying.</p>
             </div>
          ) : (
            files.map(file => (
              <div 
                key={file.id} 
                onClick={() => openFile(file)}
                className="group relative p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-brand-500 dark:hover:border-brand-500 transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform duration-300">
                    <FileText size={24} />
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={(e) => toggleMenu(e, file.id)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    {activeMenuId === file.id && (
                      <>
                        {/* Invisible backdrop to close menu on outside click */}
                        <div className="fixed inset-0 z-10 cursor-default" onClick={(e) => {e.stopPropagation(); setActiveMenuId(null);}} />
                        
                        {/* Menu Dropdown */}
                        <div className="absolute right-0 top-8 z-20 w-32 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-100 dark:border-zinc-700 py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                          <button 
                            onClick={(e) => handleDeleteFile(e, file.id)}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="pr-2">
                   <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 truncate mb-1" title={file.name}>{file.name}</h3>
                   <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                      <span>{file.type} • {file.size}</span>
                      <span className="opacity-70 normal-case">{file.lastOpened.toLocaleDateString()}</span>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderExplore = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="mb-6">
         <h2 className="text-3xl font-bold text-zinc-800 dark:text-white mb-2">Explore Knowledge</h2>
         <p className="text-zinc-500 dark:text-zinc-400">AI-Filtered educational content. Distractions are automatically blocked.</p>
       </div>

       {isLoading ? (
         <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
           <Loader2 size={40} className="animate-spin mb-4 text-brand-500" />
           <p>Curating educational content...</p>
         </div>
       ) : videos.length > 0 ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map(video => (
              <div 
                key={video.id} 
                onClick={() => {
                   setCurrentVideo(video);
                   setActiveTab(Tab.WATCH);
                }}
                className={`group flex flex-col bg-white dark:bg-zinc-800 rounded-xl overflow-hidden border ${video.isEducational ? 'border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-brand-500' : 'border-red-200 dark:border-red-900/50 opacity-75'} shadow-sm hover:shadow-md transition-all h-full`}
              >
                <div className="relative aspect-video overflow-hidden">
                  <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {!video.isEducational && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">BLOCKED</span>
                    </div>
                  )}
                  {video.isEducational && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                         <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                            <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-brand-600 border-b-8 border-b-transparent ml-1"></div>
                         </div>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-zinc-800 dark:text-zinc-100 line-clamp-2 mb-1">{video.title}</h3>
                  <p className="text-sm text-brand-600 dark:text-brand-400 font-medium mb-2">{video.channel}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 flex-grow">{video.description}</p>
                </div>
              </div>
            ))}
         </div>
       ) : (
         <div className="flex flex-col items-center justify-center h-64 text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-800/30">
            <Search size={48} className="mb-4 opacity-20" />
            <p>Search for a topic above to start learning.</p>
         </div>
       )}
    </div>
  );

  const renderProgress = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-bold text-zinc-800 dark:text-white mb-8">Your Progress</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-brand-500 to-brand-600 text-white p-6 rounded-2xl shadow-lg">
           <h3 className="text-brand-100 text-sm font-medium mb-1">Total Study Time</h3>
           <div className="text-4xl font-bold mb-2">124.5 <span className="text-lg opacity-80">hrs</span></div>
           <div className="text-xs bg-white/20 w-fit px-2 py-1 rounded">+2.4 hrs today</div>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
           <h3 className="text-zinc-500 text-sm font-medium mb-1">Current Streak</h3>
           <div className="text-4xl font-bold text-zinc-800 dark:text-white mb-2">12 <span className="text-lg text-zinc-400 font-normal">days</span></div>
           <div className="text-xs text-green-500 font-medium">Personal best!</div>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
           <h3 className="text-zinc-500 text-sm font-medium mb-1">Files Reviewed</h3>
           <div className="text-4xl font-bold text-zinc-800 dark:text-white mb-2">48</div>
           <div className="text-xs text-zinc-400">Across 8 subjects</div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Heatmap />
      </div>
    </div>
  );

  // --- Main Layout ---

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden selection:bg-brand-500/30">
      
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-all duration-300 ease-in-out relative z-20`}>
        <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <Layout className="text-white w-5 h-5" />
            </div>
            {isSidebarOpen && <span className="font-bold text-xl tracking-tight">FocusFlow</span>}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <button 
            onClick={() => setActiveTab(Tab.FILES)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === Tab.FILES ? 'bg-white dark:bg-zinc-800 shadow-sm text-brand-600 dark:text-brand-400 font-medium' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          >
            <FolderOpen size={20} />
            {isSidebarOpen && <span>Files</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab(Tab.EXPLORE)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === Tab.EXPLORE || activeTab === Tab.WATCH ? 'bg-white dark:bg-zinc-800 shadow-sm text-brand-600 dark:text-brand-400 font-medium' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          >
            <BookOpen size={20} />
            {isSidebarOpen && <span>Explore</span>}
          </button>

          <button 
            onClick={() => setActiveTab(Tab.PROGRESS)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === Tab.PROGRESS ? 'bg-white dark:bg-zinc-800 shadow-sm text-brand-600 dark:text-brand-400 font-medium' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          >
            <BarChart2 size={20} />
            {isSidebarOpen && <span>Progress</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
           {isSidebarOpen ? (
               <div className="p-4 bg-brand-50 dark:bg-zinc-800 rounded-xl">
                   <h4 className="font-medium text-sm mb-1">Pro Tip</h4>
                   <p className="text-xs text-zinc-500">Enable the Pomodoro timer to stay focused.</p>
               </div>
           ) : (
               <div className="w-2 h-2 rounded-full bg-brand-500 mx-auto"></div>
           )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-zinc-50/50 dark:bg-zinc-900">
        
        {/* Top Header / Search */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 flex items-center px-6 justify-between">
           <div className="flex-1 max-w-xl">
               <form onSubmit={handleSearch} className="relative group">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                   <input 
                     type="text" 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search for educational videos..." 
                     className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all border border-transparent focus:border-brand-500"
                   />
               </form>
           </div>
           
           <div className="flex items-center gap-4 ml-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-400 to-purple-500 shadow-lg shadow-purple-500/20"></div>
           </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto h-full">
            {activeTab === Tab.FILES && renderFiles()}
            {activeTab === Tab.EXPLORE && renderExplore()}
            {activeTab === Tab.PROGRESS && renderProgress()}
            {activeTab === Tab.WATCH && currentVideo && (
              <VideoPlayer 
                video={currentVideo} 
                onBack={() => setActiveTab(Tab.EXPLORE)} 
              />
            )}
          </div>
        </div>
        
        {/* Persistent Elements */}
        <Pomodoro />
      </main>

    </div>
  );
}
