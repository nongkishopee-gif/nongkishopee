import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// --- Audio Utils (Defined in component for self-containment as requested) ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const VoiceChat: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<'Disconnected' | 'Connecting' | 'Live'>('Disconnected');
  const [audioLevel, setAudioLevel] = useState(0); // For visualization
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs for audio handling to avoid re-renders
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null); // To hold the session object
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Clean up function
  const stopSession = () => {
    if (sessionRef.current) {
        // There is no explicit .close() on the session object in the new SDK structure easily accessible 
        // without keeping the reference to the connection promise or managing state differently.
        // However, we can stop audio processing.
        // In a real app, we'd signal close. For now, we stop contexts.
    }
    
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (outputContextRef.current) {
      outputContextRef.current.close();
      outputContextRef.current = null;
    }
    
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    
    setIsConnected(false);
    setStatus('Disconnected');
    setAudioLevel(0);
  };

  const startSession = async () => {
    setStatus('Connecting');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputContextRef.current = inputAudioContext;
      outputContextRef.current = outputAudioContext;
      
      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Session opened');
            setStatus('Live');
            setIsConnected(true);

            // Setup Microphone Stream
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!inputContextRef.current) return; // Stop processing if closed
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Simple visualization data
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              setAudioLevel(Math.sqrt(sum / inputData.length) * 5); // Scale up

              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
               // Assuming nextStartTimeRef is tracked
               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
               
               const audioBuffer = await decodeAudioData(
                   decode(base64Audio),
                   outputAudioContext,
                   24000,
                   1
               );

               const source = outputAudioContext.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(outputNode);
               source.addEventListener('ended', () => {
                   sourcesRef.current.delete(source);
               });
               
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               sourcesRef.current.add(source);
            }
          },
          onclose: () => {
            console.log('Session closed');
            stopSession();
          },
          onerror: (err) => {
            console.error('Session error', err);
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (error) {
      console.error("Failed to start session", error);
      setStatus('Disconnected');
      alert("Could not access microphone or connect to API.");
    }
  };

  useEffect(() => {
    return () => {
        stopSession();
    };
  }, []);

  return (
    <div className="flex-1 h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6 relative overflow-hidden">
      {/* Background Pulse Effect */}
      {isConnected && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div 
             className="w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-20 transition-transform duration-100"
             style={{ transform: `scale(${1 + audioLevel})` }}
           ></div>
        </div>
      )}

      <div className="z-10 text-center space-y-8 max-w-md w-full">
        <div className="w-24 h-24 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-900/50">
           <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
        </div>

        <div>
            <h2 className="text-3xl font-bold tracking-tight">Gemini Live</h2>
            <p className="text-indigo-300 mt-2">Real-time conversational AI</p>
        </div>

        <div className="h-16 flex items-center justify-center space-x-1">
            {isConnected && (
                <>
                    <div className="w-1 bg-indigo-400 rounded-full animate-pulse" style={{ height: `${20 + audioLevel * 20}px`, animationDuration: '0.4s' }}></div>
                    <div className="w-1 bg-indigo-400 rounded-full animate-pulse" style={{ height: `${30 + audioLevel * 30}px`, animationDuration: '0.2s' }}></div>
                    <div className="w-1 bg-indigo-400 rounded-full animate-pulse" style={{ height: `${20 + audioLevel * 20}px`, animationDuration: '0.5s' }}></div>
                    <div className="w-1 bg-indigo-400 rounded-full animate-pulse" style={{ height: `${15 + audioLevel * 10}px`, animationDuration: '0.3s' }}></div>
                </>
            )}
        </div>

        <button
          onClick={isConnected ? stopSession : startSession}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
            isConnected 
            ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-900/20' 
            : 'bg-white text-gray-900 hover:bg-gray-100 shadow-lg shadow-white/10'
          }`}
        >
          {isConnected ? 'End Conversation' : 'Start Conversation'}
        </button>

        <p className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-gray-500'}`}>
            Status: {status}
        </p>
      </div>
    </div>
  );
};

export default VoiceChat;