
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import ImageEditor from './components/ImageEditor';
import TextToSpeech from './components/TextToSpeech';
import { InputState, GeneratedShot, ViewState, StoryboardCampaign } from './types';
import { generateStoryboardPlan, generateShotImage } from './services/geminiService';

const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewState>('storyboard');

  // Storyboard State
  const [inputState, setInputState] = useState<InputState>({
    productImage: null,
    faceImage: null,
    backgroundImage: null,
    productDescription: '',
    selectedColor: null, // Initialize new field
    orientation: 'Portrait (9:16)',
    language: 'Bahasa Indonesia',
    additionalPrompt: ''
  });

  const [shots, setShots] = useState<GeneratedShot[]>([]);
  const [campaign, setCampaign] = useState<StoryboardCampaign | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!inputState.productImage) return;

    setIsGenerating(true);
    setHasGenerated(true);
    setShots([]); 
    setCampaign(null);

    try {
      // 1. Generate the textual plan using analyzed description and selected color
      const campaignData = await generateStoryboardPlan(
        inputState.productImage, 
        inputState.language,
        inputState.productDescription,
        inputState.selectedColor, // Pass color
        inputState.additionalPrompt
      );
      setCampaign(campaignData);
      
      const initialShots: GeneratedShot[] = campaignData.shots.map(shot => ({
        ...shot,
        isLoadingImage: true
      }));
      setShots(initialShots);

      let aspectRatio = "1:1";
      if (inputState.orientation.includes('9:16')) aspectRatio = "9:16";
      else if (inputState.orientation.includes('16:9')) aspectRatio = "16:9";

      // 2. Trigger Image Generation for each shot in parallel with grounding
      campaignData.shots.forEach(async (shot) => {
        try {
          const imageUrl = await generateShotImage(
            shot.visual_description, 
            inputState.productImage!, 
            aspectRatio,
            inputState.faceImage,
            inputState.backgroundImage
          );
          
          setShots(prev => prev.map(s => 
            s.shot_number === shot.shot_number 
              ? { ...s, imageUrl, isLoadingImage: false } 
              : s
          ));
        } catch (err) {
             setShots(prev => prev.map(s => 
                s.shot_number === shot.shot_number 
                ? { ...s, isLoadingImage: false } 
                : s
            ));
        }
      });

    } catch (error) {
      console.error("Generation failed", error);
      alert("Gagal membuat storyboard. Mohon coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'storyboard':
        return (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <InputPanel 
              inputState={inputState} 
              setInputState={setInputState} 
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
            <OutputPanel campaign={campaign} shots={shots} hasGenerated={hasGenerated} />
          </div>
        );
      case 'image-editor':
        return <ImageEditor />;
      case 'text-to-speech':
        return <TextToSpeech />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col md:pl-64 h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between">
            <span className="font-bold">EngagePro</span>
            <button className="text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            </button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default App;
