import React, { useState } from 'react';
import { editImage } from '../services/geminiService';

interface EditedResult {
    imageUrl: string;
    videoPrompt: any;
}

const ImageEditor: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  
  // Drag states
  const [dragMain, setDragMain] = useState(false);
  const [dragFace, setDragFace] = useState(false);
  const [dragBg, setDragBg] = useState(false);
  
  // Store objects with image and video prompt
  const [editedImages, setEditedImages] = useState<EditedResult[]>([]);
  
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedJson, setSelectedJson] = useState<any | null>(null);

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
           setEditedImages([]); // Reset edited images on new main image upload
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and Drop Handlers
  const handleDragEnter = (e: React.DragEvent, setDrag: (val: boolean) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(true);
  };

  const handleDragLeave = (e: React.DragEvent, setDrag: (val: boolean) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
  };

  const handleDrop = (
    e: React.DragEvent, 
    setter: React.Dispatch<React.SetStateAction<string | null>>, 
    setDrag: (val: boolean) => void
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setter(reader.result as string);
            if (setter === setImage) {
                setEditedImages([]);
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!image || !prompt) return;

    setIsGenerating(true);
    setEditedImages([]); // Clear previous results
    try {
      // Expect array of objects back
      const results = await editImage(image, prompt, aspectRatio, faceImage, backgroundImage);
      setEditedImages(results);
    } catch (error) {
      console.error("Editing failed", error);
      alert("Failed to edit image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-gray-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">AI Image Editor & Face Swap</h2>
          <p className="text-gray-500 mt-1">Generate 8 variations of your image with different poses and angles using Gemini 2.5.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Input Section (Left 4 cols) */}
            <div className="md:col-span-4 space-y-6">
              
              {/* Main Image */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">1. Main Image (Body/Scene)</label>
                {image ? (
                  <div className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square bg-gray-100">
                    <img src={image} alt="Original" className="w-full h-full object-contain" />
                    <button 
                      onClick={() => { setImage(null); setEditedImages([]); }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                ) : (
                  <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragMain ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'}`}
                    onDragOver={(e) => handleDragEnter(e, setDragMain)}
                    onDragLeave={(e) => handleDragLeave(e, setDragMain)}
                    onDrop={(e) => handleDrop(e, setImage, setDragMain)}
                  >
                    <label className="cursor-pointer flex flex-col items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      <span className="text-sm font-medium text-indigo-600">Upload Main Image</span>
                      <p className="text-xs text-gray-400 mt-1">or Drag & Drop</p>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setImage)} />
                    </label>
                  </div>
                )}
              </div>

              {/* Face Reference */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">2. Foto Wajah (Reference Face)</label>
                <p className="text-xs text-gray-500 mb-2">If uploaded, the face in the main image will be replaced by this face.</p>
                {faceImage ? (
                  <div className="relative group rounded-xl overflow-hidden border border-gray-200 h-24 w-full bg-gray-100">
                    <img src={faceImage} alt="Face" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setFaceImage(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                ) : (
                  <div 
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${dragFace ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'}`}
                    onDragOver={(e) => handleDragEnter(e, setDragFace)}
                    onDragLeave={(e) => handleDragLeave(e, setDragFace)}
                    onDrop={(e) => handleDrop(e, setFaceImage, setDragFace)}
                  >
                    <label className="cursor-pointer flex flex-col items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <span className="text-xs text-indigo-600 font-medium">Upload Face (Optional)</span>
                      <p className="text-[10px] text-gray-400 mt-0.5">or Drag & Drop</p>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setFaceImage)} />
                    </label>
                  </div>
                )}
              </div>

              {/* Background Reference */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">3. Background (Optional)</label>
                {backgroundImage ? (
                  <div className="relative group rounded-xl overflow-hidden border border-gray-200 h-24 w-full bg-gray-100">
                    <img src={backgroundImage} alt="Background" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setBackgroundImage(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                ) : (
                  <div 
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${dragBg ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'}`}
                    onDragOver={(e) => handleDragEnter(e, setDragBg)}
                    onDragLeave={(e) => handleDragLeave(e, setDragBg)}
                    onDrop={(e) => handleDrop(e, setBackgroundImage, setDragBg)}
                  >
                    <label className="cursor-pointer flex flex-col items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      <span className="text-xs text-indigo-600 font-medium">Upload Background (Optional)</span>
                      <p className="text-[10px] text-gray-400 mt-0.5">or Drag & Drop</p>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setBackgroundImage)} />
                    </label>
                  </div>
                )}
              </div>

              {/* Configuration */}
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Edit Instruction</label>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. Change the dress to red, add a retro filter..."
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                    />
                 </div>
                 
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Output Aspect Ratio</label>
                    <select 
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                        <option value="1:1">Square (1:1)</option>
                        <option value="3:4">Portrait (3:4)</option>
                        <option value="4:3">Landscape (4:3)</option>
                        <option value="9:16">Story (9:16)</option>
                        <option value="16:9">Cinema (16:9)</option>
                    </select>
                 </div>

                 <button
                    onClick={handleEdit}
                    disabled={!image || !prompt || isGenerating}
                    className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg transition-all flex items-center justify-center space-x-2 ${
                        !image || !prompt || isGenerating
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
                            <span>Generating 8 unique poses...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            <span>Generate Edit</span>
                        </>
                    )}
                 </button>
              </div>

            </div>

            {/* Output Section (Right 8 cols) */}
            <div className="md:col-span-8">
                <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-gray-700">Results (8 Poses)</label>
                    {editedImages.length > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Generation Complete</span>
                    )}
                </div>
                
                <div className="bg-gray-100 rounded-2xl p-4 min-h-[500px]">
                    {editedImages.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {editedImages.map((result, idx) => (
                                <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group relative">
                                    <div className="aspect-[3/4] overflow-hidden cursor-zoom-in relative" onClick={() => setPreviewImage(result.imageUrl)}>
                                        <img src={result.imageUrl} alt={`Variation ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                             <svg className="w-6 h-6 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                                        </div>
                                    </div>
                                    <div className="p-2 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">Pose {idx + 1}</span>
                                        <button 
                                            onClick={() => setSelectedJson(result.videoPrompt)}
                                            className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 p-1 rounded transition-colors text-xs font-mono px-2"
                                            title="View Video Prompt"
                                        >
                                            {"{...}"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                             {image ? (
                                <div className="text-center">
                                    <div className="w-48 h-48 mx-auto mb-4 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 relative group cursor-zoom-in" onClick={() => setPreviewImage(image)}>
                                        <img src={image} alt="Original Preview" className="w-full h-full object-cover opacity-50" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="bg-white/80 px-3 py-1 rounded-full text-xs font-bold text-gray-600 shadow-sm">Original Preview</span>
                                        </div>
                                    </div>
                                    <p>Ready to generate variations.</p>
                                </div>
                             ) : (
                                <>
                                    <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    <p>Upload a main image to start.</p>
                                </>
                             )}
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>

       {/* Lightbox Preview */}
       {previewImage && (
        <div 
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
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
                  className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        </div>
      )}

      {/* JSON Viewer Modal */}
      {selectedJson && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col animate-fade-in-up">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Video Generation Prompt</h3>
                    <button onClick={() => setSelectedJson(null)} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto bg-slate-900 text-slate-300 font-mono text-sm">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(selectedJson, null, 2)}</pre>
                </div>
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(selectedJson, null, 2));
                            setSelectedJson(null);
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                        Copy JSON
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ImageEditor;