import React, { useState, useEffect } from 'react';
import { GeneratedShot, StoryboardCampaign } from '../types';

interface OutputPanelProps {
  campaign: StoryboardCampaign | null;
  shots: GeneratedShot[];
  hasGenerated: boolean;
}

const OutputPanel: React.FC<OutputPanelProps> = ({ campaign, shots, hasGenerated }) => {
  const [selectedPrompt, setSelectedPrompt] = useState<any | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Script State
  const [scriptText, setScriptText] = useState('');

  // Initialize script text when campaign loads
  useEffect(() => {
    if (campaign) {
      const fullScript = campaign.shots.map(s => s.voiceover_text).join('\n\n');
      setScriptText(fullScript);
    }
  }, [campaign]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!hasGenerated && shots.length === 0) {
    return (
        <div className="flex-1 bg-gray-50 p-10 flex flex-col items-center justify-center text-gray-400">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <h3 className="text-lg font-medium text-gray-600">VISUAL STORYBOARD</h3>
            <p className="text-sm mt-1">Ready to create magic? Upload a product to start.</p>
        </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 p-6 md:p-10 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">VISUAL STORYBOARD</h2>
        {shots.length > 0 && (
            <button className="flex items-center space-x-2 bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-green-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12"></path></svg>
                <span>Download All</span>
            </button>
        )}
      </div>

      {/* Grid of Shots */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
        {shots.map((shot) => (
          <div key={shot.shot_number} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <span className="bg-gray-800 text-white text-xs font-medium px-2.5 py-1 rounded">Shot {shot.shot_number}</span>
              <span className="text-xs text-gray-500 font-medium truncate ml-2">{shot.title}</span>
            </div>
            
            {/* Visual Representation */}
            <div className="aspect-[9/16] w-full bg-gray-100 rounded-xl overflow-hidden mb-4 relative group cursor-pointer">
              {shot.isLoadingImage ? (
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                 </div>
              ) : (
                shot.imageUrl ? (
                    <>
                      <img 
                        src={shot.imageUrl} 
                        alt={shot.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        onClick={() => setPreviewImage(shot.imageUrl!)}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                        <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                      </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-xs text-gray-400">Image generation failed</div>
                )
              )}
            </div>

            <div className="mt-auto">
                <button 
                    onClick={() => setSelectedPrompt(shot.video_generation_prompt)}
                    className="w-full text-left bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 rounded-lg p-3 group transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-700">View Video Prompt (JSON)</span>
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                    </div>
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid: Script (Left) vs Instructions/SEO (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Left Column: Script Controls */}
        <div className="space-y-8">
            
            {/* 1. Script Section (Orange) */}
            <div>
                <h3 className="text-lg font-bold text-orange-500 mb-4">Script Copywriting</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-orange-500 uppercase">Script</label>
                        <button onClick={() => copyToClipboard(scriptText)} className="text-gray-400 hover:text-orange-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        </button>
                    </div>
                    <textarea 
                        value={scriptText}
                        onChange={(e) => setScriptText(e.target.value)}
                        className="w-full h-40 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-orange-200 focus:border-orange-300 outline-none resize-none"
                        placeholder="Generated script will appear here..."
                    />
                    <button 
                        onClick={() => copyToClipboard(scriptText)}
                        className="w-full mt-3 py-2.5 rounded-lg text-white font-medium bg-orange-500 hover:bg-orange-600 transition-colors shadow-sm"
                    >
                        Salin Script
                    </button>
                </div>
            </div>

        </div>

        {/* Right Column: Instructions & SEO */}
        <div className="space-y-8">
             
             {/* 3. TTS Instructions (Emerald) */}
             <div>
                <h3 className="text-lg font-bold text-emerald-600 mb-4">TTS Style Instructions</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-emerald-600 uppercase">Instruksi Gaya Bicara</label>
                        <button onClick={() => copyToClipboard(campaign?.tts_instructions || '')} className="text-gray-400 hover:text-emerald-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        </button>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-700 min-h-[100px] mb-4">
                        {campaign?.tts_instructions || "Instructions will appear here..."}
                    </div>
                    <button 
                        onClick={() => copyToClipboard(campaign?.tts_instructions || '')}
                        className="w-full py-2.5 rounded-lg text-white font-medium bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm mt-auto"
                    >
                        Salin Instruksi
                    </button>
                </div>
            </div>

            {/* 4. SEO Section (Blue) */}
            <div>
                <h3 className="text-lg font-bold text-blue-600 mb-4">Deskripsi & Hashtag (SEO)</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-5">
                    
                    {/* Description */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-blue-600 uppercase">Deskripsi Video</label>
                            <button onClick={() => copyToClipboard(campaign?.seo.description || '')} className="text-gray-400 hover:text-blue-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                            </button>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm text-gray-700 min-h-[80px]">
                            {campaign?.seo.description || "Description will appear here..."}
                        </div>
                        <button 
                            onClick={() => copyToClipboard(campaign?.seo.description || '')}
                            className="w-full mt-3 py-2.5 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            Salin Deskripsi
                        </button>
                    </div>

                    {/* Hashtags */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-blue-600 uppercase">Hashtag</label>
                            <button onClick={() => copyToClipboard(campaign?.seo.hashtags || '')} className="text-gray-400 hover:text-blue-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                            </button>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm text-gray-700 min-h-[60px]">
                            {campaign?.seo.hashtags || "#hashtags #will #appear #here"}
                        </div>
                        <button 
                            onClick={() => copyToClipboard(campaign?.seo.hashtags || '')}
                            className="w-full mt-3 py-2.5 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            Salin Hashtag
                        </button>
                    </div>

                </div>
            </div>

        </div>
      </div>

      {/* JSON Viewer Modal */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col animate-fade-in-up">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Video Generation Prompt</h3>
                    <button onClick={() => setSelectedPrompt(null)} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto bg-slate-900 text-slate-300 font-mono text-sm">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(selectedPrompt, null, 2)}</pre>
                </div>
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button 
                        onClick={() => {
                            copyToClipboard(JSON.stringify(selectedPrompt, null, 2));
                            setSelectedPrompt(null);
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                        Copy JSON
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity"
          onClick={() => setPreviewImage(null)}
        >
            <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  onClick={(e) => e.stopPropagation()} 
                />
                <button 
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-0 right-0 m-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default OutputPanel;