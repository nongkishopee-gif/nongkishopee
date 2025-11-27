import React from 'react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const navItemClass = (view: ViewState) => 
    `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
      currentView === view 
      ? 'bg-slate-800 text-indigo-400' 
      : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`;

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-10 hidden md:flex border-r border-slate-800">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">EngagePro</h1>
          <span className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">v2.4</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        <div onClick={() => setCurrentView('storyboard')} className={navItemClass('storyboard')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          <span className="font-medium">Storyboard</span>
        </div>
        
        <div onClick={() => setCurrentView('image-editor')} className={navItemClass('image-editor')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          <span className="font-medium">Image Editor</span>
        </div>

        <div onClick={() => setCurrentView('text-to-speech')} className={navItemClass('text-to-speech')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
          <span className="font-medium">Text to Speech</span>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">C</div>
          <div>
            <p className="text-sm font-medium text-white">Creator</p>
            <p className="text-xs text-slate-500">Pro Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;