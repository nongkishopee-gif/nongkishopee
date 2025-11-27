import React, { useState } from 'react';
import { InputState } from '../types';

interface InputPanelProps {
  inputState: InputState;
  setInputState: React.Dispatch<React.SetStateAction<InputState>>;
  onGenerate: () => void;
  isGenerating: boolean;
}

const InputPanel: React.FC<InputPanelProps> = ({ inputState, setInputState, onGenerate, isGenerating }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof InputState) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputState(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = (field: keyof InputState) => {
    setInputState(prev => ({ ...prev, [field]: null }));
  };

  return (
    <div className="w-full lg:w-1/3 bg-white border-r border-gray-200 h-full overflow-y-auto p-6 flex flex-col">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-xl font-bold text-gray-900">Fashion B-Roll</h2>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-1 rounded">Langkah 1</span>
        </div>
        <p className="text-sm text-gray-500">Pose variatif untuk outfit.</p>
      </div>

      <div className="space-y-6 flex-1">
        {/* Main Product Upload */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">GAMBAR PRODUK UTAMA (WAJIB, 1)</label>
          {inputState.productImage ? (
            <div className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-[4/3]">
              <img src={inputState.productImage} alt="Product" className="w-full h-full object-cover" />
              <button 
                onClick={() => clearImage('productImage')}
                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          ) : (
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const file = e.dataTransfer.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setInputState(prev => ({ ...prev, productImage: reader.result as string }));
                    reader.readAsDataURL(file);
                }
              }}
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <p className="text-sm text-gray-500">Drag & drop atau</p>
                <label className="cursor-pointer text-indigo-600 font-medium hover:text-indigo-500 text-sm">
                  <span>klik untuk upload</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'productImage')} />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Optional Model Photo */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">FOTO MODEL (OPSIONAL)</label>
          {inputState.modelImage ? (
            <div className="relative group rounded-xl overflow-hidden border border-gray-200 h-24 w-full">
              <img src={inputState.modelImage} alt="Model" className="w-full h-full object-cover" />
              <button 
                onClick={() => clearImage('modelImage')}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          ) : (
             <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center">
                <label className="cursor-pointer flex flex-col items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  <span className="text-xs text-indigo-600 font-medium">Upload Model</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'modelImage')} />
                </label>
             </div>
          )}
        </div>

         {/* Configuration */}
         <div className="grid grid-cols-1 gap-4">
             <div>
                <label className="block text-xs text-gray-500 mb-1">Orientasi</label>
                <select 
                    value={inputState.orientation}
                    onChange={(e) => setInputState(prev => ({...prev, orientation: e.target.value as any}))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                >
                    <option value="Portrait (9:16)">Portrait (9:16)</option>
                    <option value="Landscape (16:9)">Landscape (16:9)</option>
                    <option value="Square (1:1)">Square (1:1)</option>
                </select>
             </div>
             <div>
                <label className="block text-xs text-gray-500 mb-1">Bahasa</label>
                <select 
                    value={inputState.language}
                    onChange={(e) => setInputState(prev => ({...prev, language: e.target.value as any}))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                >
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Bahasa Malaysia">Bahasa Malaysia</option>
                    <option value="English">English</option>
                </select>
             </div>
         </div>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-100">
        <button 
            onClick={onGenerate}
            disabled={!inputState.productImage || isGenerating}
            className={`w-full py-3.5 rounded-xl text-white font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center space-x-2 ${
                !inputState.productImage || isGenerating
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-300 transform hover:-translate-y-0.5'
            }`}
        >
            {isGenerating ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generates Magic...</span>
                </>
            ) : (
                <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    <span>Generate Magic</span>
                </>
            )}
        </button>
        {!inputState.productImage && (
            <p className="text-center text-xs text-red-400 mt-2">Please upload a main product image first.</p>
        )}
      </div>
    </div>
  );
};

export default InputPanel;