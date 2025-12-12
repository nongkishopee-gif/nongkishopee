import React, { useState, useRef, useEffect } from 'react';
import { generateSpeech } from '../services/geminiService';

// --- WAV Header Helpers ---
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const addWavHeader = (samples: Uint8Array, sampleRate: number, numChannels: number, bitDepth: number) => {
  const buffer = new ArrayBuffer(44 + samples.length);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + samples.length, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 is PCM)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, samples.length, true);

  // Write audio data
  const dataView = new Uint8Array(buffer, 44);
  dataView.set(samples);

  return buffer;
};
// --------------------------

interface Voice {
    name: string;
    gender: string;
    description: string;
}

const TextToSpeech: React.FC = () => {
  const [text, setText] = useState('');
  const [styleInstruction, setStyleInstruction] = useState('');
  const [temperature, setTemperature] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Full voice list from requirement
  const voices: Voice[] = [
    { name: 'Zephyr', gender: 'Female', description: 'Bright, Higher pitch' },
    { name: 'Puck', gender: 'Male', description: 'Upbeat, Middle pitch' },
    { name: 'Charon', gender: 'Male', description: 'Informative, Lower pitch' },
    { name: 'Kore', gender: 'Female', description: 'Firm, Middle pitch' },
    { name: 'Fenrir', gender: 'Male', description: 'Excitable, Lower mid' },
    { name: 'Leda', gender: 'Female', description: 'Youthful, Higher pitch' },
    { name: 'Orus', gender: 'Male', description: 'Firm, Lower middle pitch' },
    { name: 'Aoede', gender: 'Female', description: 'Breezy, Middle pitch' },
    { name: 'Callirrhoe', gender: 'Female', description: 'Easy-going, Middle pitch' },
    { name: 'Autonoe', gender: 'Female', description: 'Bright, Middle pitch' },
    { name: 'Enceladus', gender: 'Male', description: 'Breathy, Lower pitch' },
    { name: 'Iapetus', gender: 'Male', description: 'Clear, Lower middle pitch' },
    { name: 'Umbriel', gender: 'Male', description: 'Easy-going, Lower middle pitch' },
    { name: 'Algieba', gender: 'Male', description: 'Smooth, Lower pitch' },
    { name: 'Despina', gender: 'Female', description: 'Smooth, Middle pitch' },
    { name: 'Erinome', gender: 'Female', description: 'Clear, Middle pitch' },
    { name: 'Algenib', gender: 'Male', description: 'Gravelly, Lower pitch' },
    { name: 'Rasalgethi', gender: 'Female', description: 'Informative, Middle pitch' },
    { name: 'Laomedeia', gender: 'Female', description: 'Upbeat, Higher pitch' },
    { name: 'Achernar', gender: 'Male', description: 'Soft, Higher pitch' },
    { name: 'Alnilam', gender: 'Male', description: 'Firm, Lower middle pitch' },
    { name: 'Schedar', gender: 'Male', description: 'Even, Lower middle pitch' },
    { name: 'Gacrux', gender: 'Female', description: 'Mature, Middle pitch' },
    { name: 'Pulcherrima', gender: 'Female', description: 'Forward, Middle pitch' },
    { name: 'Achrid', gender: 'Male', description: 'Bold, Middle pitch' },
    { name: 'Zubenelgenubi', gender: 'Male', description: 'Deep, Resonant' },
    { name: 'Vindemiatrix', gender: 'Female', description: 'Soft, Calming' },
    { name: 'Sadachibia', gender: 'Female', description: 'Neutral, Clear' },
    { name: 'Sadaltager', gender: 'Female', description: 'Bright, Cheerful' },
    { name: 'Sulafat', gender: 'Female', description: 'Warm, Motherly' },
  ];

  const filteredVoices = voices.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedVoiceDetails = voices.find(v => v.name === selectedVoice) || voices[0];

  const processAudio = (base64Audio: string) => {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert raw PCM to WAV
      // Gemini 2.5 Flash TTS typically returns 24kHz, 1 channel, 16-bit PCM
      const wavBuffer = addWavHeader(bytes, 24000, 1, 16);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
  };

  const handleGenerate = async () => {
    if (!text) return;

    setIsGenerating(true);
    setAudioUrl(null);
    try {
      const base64Audio = await generateSpeech(text, selectedVoice, styleInstruction, temperature);
      const url = processAudio(base64Audio);
      setAudioUrl(url);
    } catch (error) {
      console.error("Speech generation failed", error);
      alert("Failed to generate speech. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async (voiceName: string, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent dropdown selection
      if (previewingVoice) return; // Prevent multiple previews

      setPreviewingVoice(voiceName);
      try {
          // Keep preview short and simple to reduce latency
          const base64Audio = await generateSpeech(
              `Hello.`, 
              voiceName, 
              "", 
              1.0
          );
          const url = processAudio(base64Audio);
          const audio = new Audio(url);
          audio.onended = () => setPreviewingVoice(null);
          audio.play();
      } catch (error) {
          console.error("Preview failed", error);
          setPreviewingVoice(null);
      }
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#F0F4F9] p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Text to Speech</h2>
            <p className="text-gray-500 mt-1">Convert text into lifelike speech using Gemini 2.5 Pro Preview.</p>
          </div>
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-xs font-medium text-gray-700">Gemini 2.5 Pro Preview TTS</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Panel: Configuration */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Voice Selection Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                    <label className="block text-sm font-bold text-gray-800 mb-3">Voice</label>
                    
                    {/* Custom Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-3 flex items-center justify-between transition-colors focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                    {selectedVoice.substring(0,2)}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">{selectedVoiceDetails.name}</div>
                                    <div className="text-xs text-gray-500">{selectedVoiceDetails.gender} • {selectedVoiceDetails.description}</div>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[400px] overflow-hidden flex flex-col">
                                {/* Search */}
                                <div className="p-3 border-b border-gray-100">
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="Search voices..." 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-indigo-500"
                                        />
                                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                    </div>
                                </div>

                                {/* List */}
                                <div className="overflow-y-auto flex-1 p-1">
                                    {filteredVoices.map((voice) => (
                                        <div 
                                            key={voice.name}
                                            onClick={() => { setSelectedVoice(voice.name); setIsDropdownOpen(false); }}
                                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${selectedVoice === voice.name ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${selectedVoice === voice.name ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                    {voice.name.substring(0,2)}
                                                </div>
                                                <div>
                                                    <div className={`text-sm ${selectedVoice === voice.name ? 'font-bold text-indigo-900' : 'font-medium text-gray-700'}`}>{voice.name}</div>
                                                    <div className="text-xs text-gray-400">{voice.gender} • {voice.description}</div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => handlePreview(voice.name, e)}
                                                className={`p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors ${previewingVoice === voice.name ? 'text-indigo-600 bg-indigo-50' : ''}`}
                                            >
                                                {previewingVoice === voice.name ? (
                                                    <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Settings Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-5">
                    
                    {/* Style Instructions */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Style Instructions</label>
                        <input 
                            type="text"
                            value={styleInstruction}
                            onChange={(e) => setStyleInstruction(e.target.value)}
                            placeholder='e.g., "Whisper suspiciously"'
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                        />
                    </div>

                    {/* Temperature */}
                    <div>
                         <div className="flex justify-between items-center mb-2">
                             <label className="block text-sm font-bold text-gray-800">Temperature</label>
                             <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{temperature.toFixed(1)}</span>
                         </div>
                         <input 
                             type="range"
                             min="0"
                             max="2"
                             step="0.1"
                             value={temperature}
                             onChange={(e) => setTemperature(parseFloat(e.target.value))}
                             className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                         />
                         <div className="flex justify-between text-[10px] text-gray-400 mt-1 uppercase font-semibold tracking-wide">
                             <span>Consistent</span>
                             <span>Dynamic</span>
                         </div>
                    </div>
                </div>

                <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
                    <h3 className="text-indigo-900 font-bold text-sm mb-2">Pro Tip</h3>
                    <p className="text-indigo-700 text-xs leading-relaxed">
                        For dialogues, mention the emotion in the style instruction, like "Laughing while speaking" or "Solemn and serious".
                    </p>
                </div>

            </div>

            {/* Right Panel: Input & Output */}
            <div className="lg:col-span-8 flex flex-col space-y-6">
                
                {/* Text Input */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col flex-1 min-h-[400px]">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <label className="text-sm font-bold text-gray-800">Text Prompt</label>
                        <span className="text-xs text-gray-400">{text.length} chars</span>
                    </div>
                    <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter the text you want to convert to speech..."
                        className="w-full flex-1 p-5 text-base text-gray-700 bg-gray-50 focus:outline-none resize-none"
                    />
                    <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl flex justify-end">
                        <button 
                            onClick={handleGenerate}
                            disabled={!text || isGenerating}
                            className={`px-8 py-3 rounded-xl text-white font-bold shadow-lg transition-all flex items-center space-x-2 ${
                                !text || isGenerating
                                ? 'bg-indigo-300 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-300 transform hover:-translate-y-0.5'
                            }`}
                        >
                            {isGenerating ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <span>Generate Speech</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Output Player */}
                {audioUrl && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 animate-fade-in-up">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-gray-900">Generated Audio</h3>
                                <p className="text-xs text-gray-500">Voice: {selectedVoice} • Rate: 24kHz</p>
                            </div>
                            <a 
                                href={audioUrl} 
                                download="generated-speech.wav"
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12"></path></svg>
                                <span>Download</span>
                            </a>
                        </div>
                        <div className="mt-4">
                            <audio controls src={audioUrl} className="w-full" />
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;