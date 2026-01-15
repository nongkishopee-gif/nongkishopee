
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

  /**
   * Transforms the internal prompt structure to the official Google Veo 3.1 JSON format
   * Removed aspectRatio as requested.
   */
  const formatVeoPrompt = (shot: GeneratedShot) => {
    return {
      model: "veo-3.1-generate-preview",
      prompt: shot.video_generation_prompt.prompt,
      config: {
        numberOfVideos: 1,
        resolution: "1080p",
        camera_movement: shot.video_generation_prompt.camera_movement,
        negative_prompt: shot.video_generation_prompt.negative_prompt
      }
    };
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
                    onClick={() => setSelectedPrompt(formatVeoPrompt(shot))}
                    className="w-full text-left bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg p-3 group transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Google Veo 3.1</span>
                           <span className="text-xs font-bold text-white">Gen-Video Prompt (JSON)</span>
                        </div>
                        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
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

      {/* JSON Viewer Modal - Updated for Google Veo 3.1 Context */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">Google Veo 3.1 Prompt</h3>
                            <p className="text-xs text-slate-400">Video Generation Configuration</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedPrompt(null)} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div className="bg-slate-50 p-4 border-b border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                        <svg className="w-3 h-3 mr-1 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"></path></svg>
                        How to use
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1">Copy this JSON and paste it into the Gemini API endpoint or use the prompt text directly in the Video Generator tool.</p>
                </div>

                <div className="p-6 overflow-y-auto bg-slate-900 text-indigo-300 font-mono text-xs leading-relaxed">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(selectedPrompt, null, 2)}</pre>
                </div>

                <div className="p-4 border-t border-gray-100 bg-white flex justify-end space-x-3">
                    <button 
                        onClick={() => setSelectedPrompt(null)}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        Close
                    </button>
                    <button 
                        onClick={() => {
                            copyToClipboard(JSON.stringify(selectedPrompt, null, 2));
                            alert("Copied to clipboard!");
                        }}
                        className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform active:scale-95 flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
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
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border-4 border-white/10"
                  onClick={(e) => e.stopPropagation()} 
                />
                <button 
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-0 right-0 m-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2 transition-colors border border-white/20"
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
