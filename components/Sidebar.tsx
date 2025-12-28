
import React from 'react';
import { AppView } from '../types';
import { MessageSquare, Files, Settings, Database, Github, Loader2 } from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  documentCount: number;
  isProcessing?: boolean;
  processingProgress?: { current: number, total: number } | null;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  documentCount,
  isProcessing,
  processingProgress
}) => {
  const menuItems = [
    { id: AppView.CHAT, label: 'Chat', icon: MessageSquare },
    { id: AppView.DOCUMENTS, label: 'Knowledge Base', icon: Files, count: documentCount },
    { id: AppView.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Database className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">GeminiRAG</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
              <span className="font-medium text-sm">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-800 space-y-4">
        {isProcessing && (
          <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Indexing</span>
              <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: processingProgress ? `${(processingProgress.current / processingProgress.total) * 100}%` : '10%' }}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              {processingProgress 
                ? `Analyzing segment ${processingProgress.current}/${processingProgress.total}`
                : 'Processing document...'}
            </p>
          </div>
        )}

        <div className="bg-slate-800/50 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Engine</p>
          <p className="text-xs font-semibold text-slate-300">Gemini 3 Flash</p>
        </div>
        <div className="flex items-center gap-2 px-2 text-slate-500 hover:text-slate-300 cursor-pointer transition-colors group">
          <Github className="w-4 h-4 group-hover:text-indigo-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Docs</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
