
import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import DocumentManager from './components/DocumentManager';
import { AppView, DocumentSource, ChatMessage } from './types';
import { Settings as SettingsIcon, Shield, Zap, Info, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { processFile, chunkText } from './services/documentProcessor';
import { vectorStore } from './services/vectorStore';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [documents, setDocuments] = useState<DocumentSource[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Global background processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{current: number, total: number} | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);

  const handleGlobalUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsProcessing(true);
    setUploadError(null);
    setLastSuccess(null);

    try {
      const newDocs: DocumentSource[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          setUploadError(`File ${file.name} exceeds 10MB limit.`);
          continue;
        }
        
        const doc = await processFile(file, (current, total) => {
          setProcessingProgress({ current, total });
        });
        
        newDocs.push(doc);
        setProcessingProgress(null);
      }
      setDocuments(prev => [...prev, ...newDocs]);
      if (newDocs.length > 0) {
        setLastSuccess(`Successfully indexed ${newDocs.length} document(s).`);
        setTimeout(() => setLastSuccess(null), 5000);
      }
    } catch (err: any) {
      console.error("Global upload error:", err);
      setUploadError(err.message || "Failed to process documents. This might be due to API rate limits.");
    } finally {
      setIsProcessing(false);
      setProcessingProgress(null);
    }
  }, []);

  const handleUrlFetch = useCallback(async (url: string) => {
    if (!url.trim()) return;

    setIsProcessing(true);
    setUploadError(null);
    setProcessingProgress(null);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      
      const docId = crypto.randomUUID();
      const fileName = new URL(url).hostname + new URL(url).pathname;
      
      const doc: DocumentSource = {
        id: docId,
        name: fileName.length > 30 ? fileName.slice(0, 30) + '...' : fileName,
        type: 'text/html',
        size: text.length,
        uploadDate: new Date(),
        content: text
      };

      const chunks = chunkText(text, 1000, 100).map(t => ({
        documentId: docId,
        documentName: doc.name,
        text: t
      }));

      await vectorStore.addChunks(chunks, (current, total) => {
        setProcessingProgress({ current, total });
      });
      
      setDocuments(prev => [...prev, doc]);
      setLastSuccess(`Successfully indexed content from ${url}`);
      setTimeout(() => setLastSuccess(null), 5000);
    } catch (err: any) {
      setUploadError(`URL fetch failed: ${err.message}. Most websites block direct browser access (CORS). Try downloading the file and uploading it manually.`);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(null);
    }
  }, []);

  const renderGlobalStatus = () => {
    if (!isProcessing && !uploadError && !lastSuccess) return null;

    return (
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in slide-in-from-top-4 duration-300">
        {isProcessing && (
          <div className="bg-white border border-indigo-100 rounded-2xl shadow-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-end mb-1">
                <p className="text-sm font-bold text-slate-800">Background Indexing...</p>
                <p className="text-[10px] font-black text-indigo-600 uppercase">
                  {processingProgress ? `${Math.round((processingProgress.current / processingProgress.total) * 100)}%` : 'Reading'}
                </p>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: processingProgress ? `${(processingProgress.current / processingProgress.total) * 100}%` : '10%' }}
                />
              </div>
            </div>
          </div>
        )}

        {uploadError && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl shadow-xl p-4 flex items-center gap-3 text-rose-700">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <p className="text-xs font-medium flex-1">{uploadError}</p>
            <button onClick={() => setUploadError(null)} className="p-1 hover:bg-rose-100 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {lastSuccess && !isProcessing && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl shadow-xl p-4 flex items-center gap-3 text-emerald-700">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <p className="text-xs font-bold flex-1">{lastSuccess}</p>
            <button onClick={() => setLastSuccess(null)} className="p-1 hover:bg-emerald-100 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.CHAT:
        return (
          <ChatInterface 
            messages={messages} 
            setMessages={setMessages}
            isBackgroundIndexing={isProcessing}
            onUploadRequested={handleGlobalUpload}
          />
        );
      case AppView.DOCUMENTS:
        return (
          <DocumentManager 
            documents={documents} 
            onDocumentsChange={setDocuments} 
            isUploading={isProcessing}
            onUploadRequested={handleGlobalUpload}
            onUrlRequested={handleUrlFetch}
          />
        );
      case AppView.SETTINGS:
        return (
          <div className="p-12 max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">System Settings</h1>
              <p className="text-slate-500">Configure your RAG pipeline and AI preferences.</p>
            </div>

            <section className="space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
                <Zap className="w-5 h-5 text-amber-500" /> AI Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-indigo-200 transition-colors">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Generation Model</p>
                  <p className="font-semibold text-slate-800">Gemini 3 Flash</p>
                  <p className="text-xs text-slate-500 mt-2">Optimized for speed and research efficiency.</p>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-indigo-200 transition-colors">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Embedding Engine</p>
                  <p className="font-semibold text-slate-800">text-embedding-004</p>
                  <p className="text-xs text-slate-500 mt-2">State-of-the-art semantic representation.</p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
                <Shield className="w-5 h-5 text-indigo-500" /> Privacy & Security
              </h2>
              <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Info className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                  </div>
                  <div>
                    <h3 className="font-bold text-indigo-900 mb-1">On-Device Processing</h3>
                    <p className="text-sm text-indigo-700 leading-relaxed">
                      Your document index is stored temporarily in your browser's memory. No document data is stored on our servers permanently. All processing happens via direct API calls to Google's secured endpoints.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
              Gemini RAG App v1.1.0 &bull; Built with Google GenAI SDK
            </div>
          </div>
        );
      default:
        return <ChatInterface messages={messages} setMessages={setMessages} onUploadRequested={handleGlobalUpload} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {renderGlobalStatus()}
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        documentCount={documents.length}
        isProcessing={isProcessing}
        processingProgress={processingProgress}
      />
      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="h-full">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
