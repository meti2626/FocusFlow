import React, { useState, useEffect, useRef } from 'react';
import { StudyFile } from '../types';
import { 
  ArrowLeft, 
  Save, 
  FileText, 
  File as FileIcon,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertCircle
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs`;

interface FileViewerProps {
  file: StudyFile;
  onBack: () => void;
}

export const FileViewer: React.FC<FileViewerProps> = ({ file, onBack }) => {
  const [notes, setNotes] = useState<string>('');
  
  // PDF State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Load PDF Document
  useEffect(() => {
    if (file.type.toLowerCase() === 'pdf' && file.url) {
      const loadPdf = async () => {
        try {
          setLoading(true);
          setError(null);
          // Load the document
          const loadingTask = pdfjsLib.getDocument(file.url);
          const doc = await loadingTask.promise;
          
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
        } catch (err: any) {
          console.error("Error loading PDF:", err);
          setError("Could not load PDF. It might be corrupted or password protected.");
        } finally {
          setLoading(false);
        }
      };
      
      loadPdf();
    }
  }, [file.url, file.type]);

  // Render Page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        // Fetch the page
        const page = await pdfDoc.getPage(currentPage);
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;

        // Calculate viewport
        // We might want to fit width if needed, but simple scaling is fine for now
        const viewport = page.getViewport({ scale });

        // Set dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Cancel previous render if any
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        // Render
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        
        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
            console.error("Render error:", err);
        }
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale]);

  const changePage = (delta: number) => {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
    }
  };

  const changeZoom = (delta: number) => {
    setScale(prev => Math.max(0.5, Math.min(3.0, prev + delta)));
  };

  const renderPdfContent = () => {
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
          <a href={file.url} download={file.name} className="text-brand-600 hover:underline">Download file instead</a>
        </div>
      );
    }

    if (!pdfDoc) return null;

    return (
      <div className="flex flex-col h-full bg-zinc-100 dark:bg-zinc-900/50">
        {/* PDF Toolbar */}
        <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => changePage(-1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium tabular-nums text-zinc-600 dark:text-zinc-300">
              Page {currentPage} of {numPages}
            </span>
            <button 
              onClick={() => changePage(1)}
              disabled={currentPage >= numPages}
              className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => changeZoom(-0.2)}
              className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-xs font-medium w-12 text-center text-zinc-500 dark:text-zinc-400">
              {Math.round(scale * 100)}%
            </span>
            <button 
              onClick={() => changeZoom(0.2)}
              className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto flex justify-center p-4 md:p-8">
           <canvas 
             ref={canvasRef} 
             className="shadow-xl bg-white max-w-none transition-transform duration-200 ease-out"
           />
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!file.url) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50">
          <FileIcon size={64} className="mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-zinc-500">Preview not available</h3>
          <p className="text-sm opacity-70">The file content isn't loaded in this session.</p>
        </div>
      );
    }

    const type = file.type.toLowerCase();

    // Use Custom PDF Reader
    if (type === 'pdf') {
      return renderPdfContent();
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type)) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 overflow-auto p-4">
          <img src={file.url} alt={file.name} className="max-w-full max-h-full object-contain shadow-lg rounded" />
        </div>
      );
    }

    if (['txt', 'md', 'json', 'js', 'ts', 'tsx', 'html', 'css'].includes(type)) {
      return (
        <iframe
          src={file.url}
          className="w-full h-full bg-white p-4 font-mono text-sm"
          title={file.name}
        />
      );
    }

    // Default fallback
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50">
         <FileIcon size={64} className="mb-4 text-brand-200" />
         <p className="font-medium">Cannot preview .{type} files</p>
         <a href={file.url} download={file.name} className="mt-4 text-brand-600 hover:underline text-sm">Download to view</a>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <button 
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
            <ArrowLeft size={20} />
            Back to Files
        </button>
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
             <span>{file.name}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
        {/* Document Viewer Section */}
        <div className="flex-grow flex flex-col bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-700 relative">
           {renderContent()}
        </div>

        {/* Notes Section */}
        <div className="w-full lg:w-96 flex-shrink-0 flex flex-col h-full bg-white dark:bg-zinc-850 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <FileText className="text-brand-500" size={18} />
                <h3 className="font-semibold text-zinc-700 dark:text-zinc-200">Session Notes</h3>
            </div>
            <button className="text-zinc-400 hover:text-brand-500 transition-colors">
                <Save size={18} />
            </button>
          </div>
          <textarea
            className="flex-grow p-4 resize-none focus:outline-none bg-transparent text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans"
            placeholder="Type your study notes here..."
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
