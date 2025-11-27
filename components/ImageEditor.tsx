import React, { useState } from 'react';
import { editImage } from '../services/geminiService';

const ImageEditor: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [supportingImage, setSupportingImage] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
        if (setter === setImage) {
           setEditedImage(null); // Reset edited image on new main image upload
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!image || !prompt) return;

    setIsGenerating(true);
    try {
      const result = await editImage(image, prompt, aspectRatio, supportingImage, backgroundImage);
      setEditedImage(result);
    } catch (error) {
      console.error("Editing failed", error);
      alert("Failed to edit image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-gray-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">AI Image Editor</h2>
          <p className="text-gray-500 mt-1">Use text prompts to edit your images with Gemini 2.5 Flash Image.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              
              {/* Main Image */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">1. Upload Image (Required)</label>
                {image ? (
                  <div className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square bg-gray-100">
                    <img src={image} alt="Original" className="w-full h-full object-contain" />
                    <button 
                      onClick={() => { setImage(null); setEditedImage(null); }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:bg-gray-50 transition-colors">
                    <label className="cursor-pointer flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      <span className="text-indigo-600 font-medium">Click to upload an image</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setImage)} />
                    </label>
                  </div>
                )}
              </div>

              {/* Secondary Images (Grid) */}
              <div className="grid grid-cols-2 gap-4">
                  
                  {/* Supporting Image */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Supporting Photo (Optional)</label>
                    {supportingImage ? (
                      <div className="relative group rounded-lg overflow-hidden border border-gray-200 h-24 bg-gray-100">
                        <img src={supportingImage} alt="Supporting" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setSupportingImage(null)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-300 rounded-lg h-24 flex items-center justify-center hover:bg-gray-50">
                         <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                           <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                           <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setSupportingImage)} />
                         </label>
                      </div>
                    )}
                  </div>

                  {/* Background Image */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Background Photo (Optional)</label>
                    {backgroundImage ? (
                      <div className="relative group rounded-lg overflow-hidden border border-gray-200 h-24 bg-gray-100">
                        <img src={backgroundImage} alt="Background" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setBackgroundImage(null)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-300 rounded-lg h-24 flex items-center justify-center hover:bg-gray-50">
                         <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                           <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                           <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setBackgroundImage)} />
                         </label>
                      </div>
                    )}
                  </div>

              </div>

              {/* Aspect Ratio Selector */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">2. Output Aspect Ratio</label>
                <div className="grid grid-cols-5 gap-2">
                    {['1:1', '3:4', '4:3', '9:16', '16:9'].map((ratio) => (
                        <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio)}
                            className={`py-2 px-1 text-xs font-medium rounded-lg border transition-all ${
                                aspectRatio === ratio
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                        >
                            {ratio}
                        </button>
                    ))}
                </div>
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">3. Edit Prompt</label>
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder='e.g., "Add a retro filter", "Remove the background", "Use the supporting photo as an overlay"'
                    className="w-full border border-gray-300 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-32 resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleEdit}
                disabled={!image || !prompt || isGenerating}
                className={`w-full py-4 rounded-xl text-white font-bold shadow-lg transition-all flex items-center justify-center space-x-2 ${
                  !image || !prompt || isGenerating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-300'
                }`}
              >
                {isGenerating ? (
                   <>
                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   <span>Editing...</span>
               </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    <span>Edit Image</span>
                  </>
                )}
              </button>
            </div>

            {/* Output Section */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Result</label>
              <div className="w-full aspect-square bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
                {isGenerating ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                    <p className="text-gray-500 text-sm">Magic is happening...</p>
                  </div>
                ) : editedImage ? (
                  <img src={editedImage} alt="Edited" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-gray-400 text-center p-8">
                    <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <p>Edited image will appear here</p>
                  </div>
                )}
              </div>
              {editedImage && (
                <a href={editedImage} download="edited-image.png" className="mt-4 block w-full py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg text-center hover:bg-gray-50 transition-colors">
                  Download Image
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;