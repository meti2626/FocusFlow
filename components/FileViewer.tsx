
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StudyFile } from '../types';
import { 
  ArrowLeft, 
  Save, 
  FileText, 
  File as FileIcon,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertCircle,
  RefreshCw,
  PanelRightOpen,
  PanelRightClose,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs`;

interface FileViewerProps {
  file: StudyFile;
  onBack: () => void;
  onUpdateFile: (id: string, newUrl: string) => void;
}

// --- Sub-component for individual PDF Pages ---
interface PDFPageProps {
  pdfDoc: any;
  pageNum: number;
  scale: number;
  onDimensionsLoad: (pageNum: number, height: number) => void;
  registerVisibility: (pageNum: number, ratio: number) => void;
}

const PDFPage: React.FC<PDFPageProps> = React.memo(({ pdfDoc, pageNum, scale, onDimensionsLoad, registerVisibility }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [pageHeight, setPageHeight] = useState<number | null>(null);

  // Intersection Observer to detect visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
          registerVisibility(pageNum, entry.intersectionRatio);
        });
      },
      { 
        root: null, // viewport
        rootMargin: '200px', // Pre-load 200px before appearing
        threshold: [0, 0.1, 0.5, 1.0] 
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [pageNum, registerVisibility]);

  // Render Page Content
  useEffect(() => {
    if (!isVisible || !pdfDoc || !canvasRef.current) return;

    const render = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        // Report height to parent for scroll calculations if needed
        if (!pageHeight) {
          setPageHeight(viewport.height);
          onDimensionsLoad(pageNum, viewport.height);
        }

        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d');
        if (!context) return;

        // High DPI support
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        // Cancel previous render
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const renderContext: any = {
          canvasContext: context,
          viewport: viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
        setIsRendered(true);

      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error(`Error rendering page ${pageNum}:`, err);
        }
      }
    };

    render();

    return () => {
      if (renderTaskRef.current) {
        // We generally don't cancel on unmount for scrolling lists to avoid flashing
      }
    };
  }, [isVisible, pdfDoc, pageNum, scale]);

  return (
    <div 
      ref={containerRef} 
      className="relative mb-6 shadow-md bg-white transition-all duration-200"
      style={{ 
        minHeight: pageHeight ? `${pageHeight}px` : '800px', // Placeholder height
        width: 'fit-content',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}
    >
      {!isRendered && (
        <div className="absolute inset-0 flex items-center justify-center bg-white text-zinc-300">
           <Loader2 className="animate-spin" size={24} />
        </div>
      )}
      <canvas ref={canvasRef} className="block" />
    </div>
  );
});

// --- Main FileViewer Component ---

export const FileViewer: React.FC<FileViewerProps> = ({ file, onBack, onUpdateFile }) => {
  const [notes, setNotes] = useState<string>('');
  const [showNotes, setShowNotes] = useState(false);
  
  // PDF State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Scroll & Page Tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageVisibilityRef = useRef<Map<number, number>>(new Map());
  
  // Toolbar Visibility State
  const [showToolbar, setShowToolbar] = useState(true);
  const toolbarTimeoutRef = useRef<any>(null);

  // Load PDF
  useEffect(() => {
    if (file.type.toLowerCase() === 'pdf' && file.url) {
      const loadPdf = async () => {
        try {
          setLoading(true);
          setError(null);
          const loadingTask = pdfjsLib.getDocument(file.url);
          const doc = await loadingTask.promise;
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          
          // Initial Scale Logic
          const page = await doc.getPage(1);
          const viewport = page.getViewport({ scale: 1.0 });
          const availableWidth = window.innerWidth - (showNotes ? 384 : 0) - 48; 
          
          const fitWidthScale = availableWidth / viewport.width;
          setScale(Math.min(fitWidthScale, 1.0));

        } catch (err: any) {
          console.error("Error loading PDF:", err);
          setError("Could not load PDF. It might be corrupted or incompatible.");
        } finally {
          setLoading(false);
        }
      };
      loadPdf();
    }
  }, [file.url, file.type]);

  // Handle re-scaling when sidebar toggles
  useEffect(() => {
    if (pdfDoc) {
      const adjustScale = async () => {
        try {
          const page = await pdfDoc.getPage(1);
          const viewport = page.getViewport({ scale: 1.0 });
          const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
          
          const fitScale = (containerWidth - 64) / viewport.width;
          setScale(Math.min(fitScale, 1.0));
          
        } catch (e) { /* ignore */ }
      };
      setTimeout(adjustScale, 300);
    }
  }, [showNotes]);

  // Handle auto-hiding toolbar logic (only triggered by specific interactions now)
  const resetToolbarTimer = () => {
    if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current);
    
    // Hide after 3 seconds of inactivity if mouse is not over toolbar
    toolbarTimeoutRef.current = setTimeout(() => {
      setShowToolbar(false);
    }, 3000);
  };

  useEffect(() => {
    resetToolbarTimer();
    return () => clearTimeout(toolbarTimeoutRef.current);
  }, []);

  const handleUpdateCurrentPage = useCallback((pageNum: number, ratio: number) => {
    pageVisibilityRef.current.set(pageNum, ratio);
    
    let maxRatio = 0;
    let mostVisiblePage = currentPage;
    
    pageVisibilityRef.current.forEach((vis, page) => {
      if (vis > maxRatio) {
        maxRatio = vis;
        mostVisiblePage = page;
      }
    });

    if (mostVisiblePage !== currentPage) {
      setCurrentPage(mostVisiblePage);
    }
  }, [currentPage]);

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFile = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onUpdateFile(file.id, result);
        setError(null);
      };
      reader.readAsDataURL(newFile);
    }
  };

  const changeZoom = (delta: number) => {
    setScale(prev => Math.max(0.2, Math.min(5.0, prev + delta)));
    resetToolbarTimer();
  };

  const renderContent = () => {
    if (!file.url) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-6 text-center">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full mb-4">
             <RefreshCw size={32} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-200 mb-1">Restore File Content</h3>
          <p className="text-sm opacity-70 max-w-xs mb-6">
            The content of <strong>{file.name}</strong> was too large to save in browser storage. Please select it again from your computer.
          </p>
          <label className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer transition-colors shadow-sm font-medium">
            Select File
            <input type="file" className="hidden" onChange={handleRestoreFile} />
          </label>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400">
          <Loader2 size={40} className="animate-spin mb-4 text-brand-500" />
          <p>Loading PDF...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 p-8 text-center">
          <AlertCircle size={48} className="mb-4 text-red-400" />
          <p className="font-medium text-lg mb-2">Oops!</p>
          <p className="text-sm mb-4">{error}</p>
        </div>
      );
    }

    if (file.type.toLowerCase() === 'pdf' && pdfDoc) {
      return (
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden bg-zinc-200/50 dark:bg-zinc-900/50 p-4 md:p-8 relative scroll-smooth h-full"
        >
          {/* Continuous Scroll List */}
          <div className="flex flex-col items-center min-h-full pb-20 pt-16">
             {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <PDFPage 
                  key={pageNum}
                  pageNum={pageNum}
                  pdfDoc={pdfDoc}
                  scale={scale}
                  onDimensionsLoad={() => {}}
                  registerVisibility={handleUpdateCurrentPage}
                />
             ))}
          </div>
        </div>
      );
    }

    // Image support
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.type.toLowerCase())) {
      return (
        <div 
          className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 overflow-auto p-4"
        >
          <img src={file.url} alt={file.name} className="max-w-full max-h-full object-contain shadow-lg rounded" />
        </div>
      );
    }

    // Fallback
    return (
      <iframe
        src={file.url}
        className="w-full h-full bg-white p-4 font-mono text-sm"
        title={file.name}
      />
    );
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 relative bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
      
      {/* Manual Toolbar Toggle (Visible when hidden) */}
      <div className={`absolute top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-500 ${showToolbar ? 'opacity-0 -translate-y-10' : 'opacity-100 translate-y-0'}`}>
          <button
              onClick={() => {
                setShowToolbar(true);
                resetToolbarTimer();
              }}
              className="pointer-events-auto mt-0 rounded-b-xl px-4 py-1.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm border-b border-x border-zinc-200/50 dark:border-zinc-700/50 text-zinc-400 hover:text-brand-500 hover:bg-white dark:hover:bg-zinc-800 transition-all active:scale-95 group"
              title="Show Controls"
          >
              <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
          </button>
      </div>

      {/* Unified Floating Toolbar */}
      <div 
        className={`absolute top-0 left-0 right-0 z-50 flex justify-center p-4 transition-transform duration-300 ease-in-out ${showToolbar ? 'translate-y-0' : '-translate-y-24'}`}
        onMouseEnter={() => {
            if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current);
            setShowToolbar(true);
        }}
        onMouseLeave={resetToolbarTimer}
      >
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-xl border border-zinc-200/50 dark:border-zinc-700/50 rounded-full px-4 py-2 flex items-center gap-4 md:gap-6 min-w-fit max-w-3xl">
              
              {/* Back Button */}
              <button 
                onClick={onBack}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                title="Back to Files"
              >
                  <ArrowLeft size={20} />
              </button>

              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700"></div>

              {/* File Info */}
              <div className="hidden md:flex items-center gap-2 max-w-[12rem] lg:max-w-xs">
                  <FileIcon size={16} className="text-brand-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate" title={file.name}>{file.name}</span>
              </div>

              {/* PDF Controls (Only if PDF) */}
              {file.type.toLowerCase() === 'pdf' && (
                <>
                  <div className="hidden md:block h-6 w-px bg-zinc-200 dark:bg-zinc-700"></div>
                  
                  <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-full px-2 py-1">
                     <button onClick={() => changeZoom(-0.1)} className="p-1 rounded-full hover:bg-white dark:hover:bg-zinc-700 text-zinc-500 transition-colors"><ZoomOut size={16} /></button>
                     <span className="text-xs font-mono w-10 text-center text-zinc-700 dark:text-zinc-300">{Math.round(scale * 100)}%</span>
                     <button onClick={() => changeZoom(0.1)} className="p-1 rounded-full hover:bg-white dark:hover:bg-zinc-700 text-zinc-500 transition-colors"><ZoomIn size={16} /></button>
                  </div>

                  <span className="text-xs font-medium text-zinc-400 whitespace-nowrap hidden sm:inline">
                     Page {currentPage} / {numPages}
                  </span>
                </>
              )}

              <div className="flex-1"></div>

              {/* Notes Toggle */}
              <button
                onClick={() => {
                    setShowNotes(!showNotes);
                    resetToolbarTimer();
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${showNotes ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'}`}
                title="Toggle Notes"
              >
                {showNotes ? <PanelRightOpen size={20} /> : <PanelRightClose size={20} />}
              </button>

              {/* Hide Toolbar Button */}
              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700 mx-1 hidden sm:block"></div>
              <button 
                onClick={() => setShowToolbar(false)}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
                title="Hide Controls"
              >
                <ChevronUp size={18} />
              </button>
          </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-row gap-0 h-full min-h-0 relative">
        {/* Trigger Zone for Toolbar (invisible top strip) */}
        <div 
          className="absolute top-0 left-0 right-0 h-4 z-40"
          onMouseEnter={() => {
             setShowToolbar(true);
             resetToolbarTimer();
          }}
        ></div>

        {/* Document Viewer Section */}
        <div className="flex-grow flex flex-col relative min-w-0">
           {renderContent()}
        </div>

        {/* Notes Section - Slide in / Sidebar */}
        <div 
          className={`flex-shrink-0 flex flex-col h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-xl z-20 transition-all duration-300 ease-in-out ${showNotes ? 'w-96 translate-x-0' : 'w-0 translate-x-full opacity-0 overflow-hidden'}`}
        >
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center whitespace-nowrap">
              <div className="flex items-center gap-2">
                  <FileText className="text-brand-500" size={18} />
                  <h3 className="font-semibold text-zinc-700 dark:text-zinc-200">Session Notes</h3>
              </div>
              <button className="text-zinc-400 hover:text-brand-500 transition-colors">
                  <Save size={18} />
              </button>
            </div>
            <textarea
              className="flex-grow p-4 resize-none focus:outline-none bg-transparent text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans min-w-[24rem]"
              placeholder="Type your study notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-center text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 whitespace-nowrap">
              Markdown supported
            </div>
        </div>
      </div>
    </div>
  );
};
