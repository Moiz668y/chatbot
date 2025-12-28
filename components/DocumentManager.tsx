
import React, { useState, useRef } from 'react';
import { Upload, FileText, Trash2, CheckCircle2, AlertCircle, Loader2, Plus, ArrowUpRight, Globe, Eye, X, Info } from 'lucide-react';
import { DocumentSource } from '../types';

interface DocumentManagerProps {
  documents: DocumentSource[];
  onDocumentsChange: (docs: DocumentSource[]) => void;
  isUploading: boolean;
  onUploadRequested: (files: FileList | null) => void;
  onUrlRequested: (url: string) => void;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ 
  documents, 
  onDocumentsChange,
  isUploading,
  onUploadRequested,
  onUrlRequested
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [previewDoc, setPreviewDoc] = useState<DocumentSource | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || isUploading) return;
    onUrlRequested(urlInput);
    setUrlInput('');
  };

  const deleteDocument = (id: string) => {
    // Note: VectorStore clean up happens inside the service usually
    // In this app we should also call vectorStore.removeDocument(id)
    // but DocumentManager doesn't have direct access to it in this updated pattern
    // The vectorStore is a singleton so it's fine to import it if needed.
    onDocumentsChange(documents.filter(doc => doc.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Knowledge Base</h1>
          <p className="text-slate-500 mt-1 text-sm">Upload files or provide URLs to build your assistant's knowledge.</p>
        </div>
        <div className="flex items-center gap-3">
          <form onSubmit={handleUrlSubmit} className="hidden sm:flex items-center gap-2">
            <div className="relative group">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/data.txt"
                className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all w-48 lg:w-64"
              />
            </div>
            <button 
              type="submit"
              disabled={isUploading || !urlInput}
              className="bg-slate-800 text-white px-5 py-2.5 rounded-xl hover:bg-slate-900 transition-all text-sm font-bold disabled:opacity-50"
            >
              Fetch
            </button>
          </form>
          <div className="h-8 w-px bg-slate-200 hidden sm:block" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-100 font-bold active:scale-95 disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {isUploading ? 'Indexing...' : 'Upload File'}
          </button>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e) => onUploadRequested(e.target.files)} 
          multiple 
          accept=".txt,.md,.csv,.json,.pdf"
          className="hidden" 
        />
      </div>

      <div className="mb-10 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-700 leading-relaxed">
          <strong>Tip:</strong> Direct URL fetching may fail for most websites due to browser security restrictions (CORS). For best results, download the document and upload it as a file.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50/30 transition-all duration-300 flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                {doc.type.includes('pdf') ? <FileText className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setPreviewDoc(doc)}
                  className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteDocument(doc.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors mb-2" title={doc.name}>
              {doc.name}
            </h3>
            
            <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{doc.type.split('/')[1] || 'DOC'} &bull; {formatSize(doc.size)}</span>
                <span className="text-[10px] text-slate-400">{doc.uploadDate.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3 h-3" />
                Ready
              </div>
            </div>
          </div>
        ))}

        {documents.length === 0 && !isUploading && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="col-span-full border-2 border-dashed border-slate-200 rounded-3xl p-20 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
          >
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-500">
              <Upload className="w-10 h-10 text-slate-300 group-hover:text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">Your Knowledge Base is Empty</h3>
            <p className="text-slate-500 text-center max-w-sm mb-8 text-sm leading-relaxed">
              Upload documents (PDF, TXT, CSV) or provide URLs. We'll index them for instant retrieval during chat.
            </p>
            <span className="flex items-center gap-2 text-indigo-600 font-bold bg-white border border-indigo-100 px-8 py-3.5 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-lg shadow-indigo-100">
              Add first document <Plus className="w-4 h-4" />
            </span>
          </div>
        )}

        {isUploading && (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center animate-pulse min-h-[200px]">
            <Loader2 className="w-10 h-10 text-indigo-300 animate-spin mb-4" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
              Processing in background...<br/>
              <span className="font-medium normal-case">You can start chatting while we index.</span>
            </p>
          </div>
        )}
      </div>

      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden scale-in duration-300 border border-white/20">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">{previewDoc.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">Indexed Content</span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase">{previewDoc.type} &bull; {formatSize(previewDoc.size)}</span>
                </div>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="p-2 hover:bg-white rounded-full transition-all shadow-sm border border-slate-200 hover:scale-110"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white">
              <div className="prose prose-slate max-w-none text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-medium">
                {previewDoc.content}
              </div>
            </div>
            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setPreviewDoc(null)}
                className="bg-slate-800 text-white px-10 py-3 rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;
