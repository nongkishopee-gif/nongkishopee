import React, { useState, useEffect } from 'react';
import { generateVeoVideo } from '../services/geminiService';

// Define a local interface to safely access the extended window property
// without conflicting with existing global declarations (e.g. from SDKs).
interface AIStudioWindow {
  aistudio?: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  };
}

const VideoGenerator: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKeyVerified, setApiKeyVerified] = useState(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
        const win = window as unknown as AIStudioWindow;
        if (win.aistudio && await win.aistudio.hasSelectedApiKey()) {
            setApiKeyVerified(true);
        }
    } catch (e) {
        console.error("Error checking API key", e);
    }
  };

  const handleSelectKey = async () => {
    const win = window as unknown as AIStudioWindow;
    if (win.aistudio) {
        await win.aistudio.openSelectKey();
        // Assume success after dialog interaction to avoid race conditions
        setApiKeyVerified(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setVideoUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!image) return;
    if (!apiKeyVerified) {
        await handleSelectKey();
    }

    setIsGenerating(true);
    setVideoUrl(null);

    try {
      const url = await generateVeoVideo(image, prompt, aspectRatio);
      setVideoUrl(url);
    } catch (error) {
      console.error("Video generation failed", error);
      alert("Failed to generate video. Ensure you have selected a valid paid project API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!apiKeyVerified) {
      return (
        <div className="flex-1 h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
            <div className="max-w-md text-center">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Veo Video Generator</h2>
                <p className="text-gray-600 mb-6">To use the Veo model, you must select a paid API key from your Google Cloud project.</p>
                <button 
                    onClick={handleSelectKey}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                    Select API Key
                </button>
                <p className="text-xs text-gray-400 mt-4">
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-gray-600">Learn about billing</a>
                </p>
            </div>
        </div>
      );
  }

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-gray-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Veo Video Animator</h2>
            <p className="text-gray-500 mt-1">Bring your images to life with Veo 3.1.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Start Image</label>
                    {image ? (
                        <div className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                            <img src={image} alt="Start" className="w-full h-full object-contain" />
                            <button 
                                onClick={() => { setImage(null); setVideoUrl(null); }}
                                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50">
                            <label className="cursor-pointer flex flex-col items-center justify-center">
                                <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <span className="text-indigo-600 font-medium text-sm">Upload Image</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Prompt (Optional)</label>
                        <input 
                            type="text" 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the motion..."
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Aspect Ratio</label>
                        <div className="flex space-x-4">
                            <label className={`flex-1 border rounded-lg p-3 cursor-pointer flex items-center justify-center space-x-2 ${aspectRatio === '16:9' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 hover:border-gray-400'}`}>
                                <input type="radio" name="ar" className="hidden" checked={aspectRatio === '16:9'} onChange={() => setAspectRatio('16:9')} />
                                <span className="font-medium">Landscape (16:9)</span>
                            </label>
                            <label className={`flex-1 border rounded-lg p-3 cursor-pointer flex items-center justify-center space-x-2 ${aspectRatio === '9:16' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 hover:border-gray-400'}`}>
                                <input type="radio" name="ar" className="hidden" checked={aspectRatio === '9:16'} onChange={() => setAspectRatio('9:16')} />
                                <span className="font-medium">Portrait (9:16)</span>
                            </label>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={!image || isGenerating}
                    className={`w-full py-4 rounded-xl text-white font-bold shadow-lg transition-all flex items-center justify-center space-x-2 ${
                        !image || isGenerating
                        ? 'bg-indigo-300 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-300'
                    }`}
                >
                    {isGenerating ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Generating Video...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span>Generate Video</span>
                        </>
                    )}
                </button>
            </div>

            {/* Output */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Generated Video</label>
                <div className="w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center shadow-lg">
                    {isGenerating ? (
                        <div className="text-center text-gray-400">
                             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                             <p>Processing with Veo...</p>
                             <p className="text-xs mt-2 text-gray-500">This may take a minute.</p>
                        </div>
                    ) : videoUrl ? (
                        <video controls autoPlay loop className="w-full h-full object-contain">
                            <source src={videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                        <div className="text-gray-500 text-center">
                            <p>Video output will appear here.</p>
                        </div>
                    )}
                </div>
                {videoUrl && (
                    <a href={videoUrl} download="generated-video.mp4" className="mt-4 block w-full py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg text-center hover:bg-gray-50 transition-colors">
                        Download MP4
                    </a>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;