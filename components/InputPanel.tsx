
import React, { useState } from 'react';
import { InputState } from '../types';
import { analyzeProductImage } from '../services/geminiService';

interface InputPanelProps {
  inputState: InputState;
  setInputState: React.Dispatch<React.SetStateAction<InputState>>;
  onGenerate: () => void;
  isGenerating: boolean;
}

const COLORS = [
    { name: 'TURQOISE', hex: '#40E0D0' },
    { name: 'MAROON', hex: '#800000' },
    { name: 'MAGENTA', hex: '#FF00FF' },
    { name: 'CREAMY', hex: '#FFFDD0', border: true },
    { name: 'MINT GREEN', hex: '#98FF98', border: true },
    { name: 'DARK GREY', hex: '#A9A9A9' },
    { name: 'NUDE', hex: '#E3BC9A' },
    { name: 'DARK CHOCOLATE', hex: '#3D1C02' },
    { name: 'BLACK', hex: '#000000' },
    { name: 'LIGHT GREY', hex: '#D3D3D3', border: true },
    { name: 'APPLE GREEN', hex: '#8DB600' },
    { name: 'WHITE', hex: '#FFFFFF', border: true },
    { name: 'PLUM', hex: '#8E4585' },
    { name: 'LIGHT PINK', hex: '#FFB6C1', border: true },
    { name: 'PURPLE SWEET', hex: '#A45EE5' },
    { name: 'DARK BLUE', hex: '#00008B' },
    { name: 'PINK BELACAN', hex: '#B56576' },
    { name: 'EMERALD GREEN', hex: '#50C878' },
    { name: 'LIGHT BLUE', hex: '#ADD8E6', border: true },
    { name: 'ROYALE BLUE', hex: '#4169E1' },
];

const InputPanel: React.FC<InputPanelProps> = ({ inputState, setInputState, onGenerate, isGenerating }) => {
  const [dragActive, setDragActive] = useState(false);
  const [dragFaceActive, setDragFaceActive] = useState(false);
  const [dragBgActive, setDragBgActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent, field: keyof InputState) => {
    let file: File | undefined;
    
    if ('files' in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    }

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
    if (field === 'productImage') {
        setInputState(prev => ({ ...prev, productDescription: '' }));
    }
  };

  const handleAnalyze = async () => {
    if (!inputState.productImage) return;
    setIsAnalyzing(true);
    try {
        const description = await analyzeProductImage(inputState.productImage, inputState.language, inputState.selectedColor);
        setInputState(prev => ({ ...prev, productDescription: description }));
    } catch (err) {
        console.error("Analysis failed", err);
        alert("Gagal menganalisa gambar. Pastikan gambar sudah terupload dengan benar.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const selectColor = (colorName: string) => {
    setInputState(prev => ({
        ...prev,
        selectedColor: prev.selectedColor === colorName ? null : colorName
    }));
  };

  return (
    <div className="w-full lg:w-1/3 bg-white border-r border-gray-200 h-full overflow-y-auto p-6 flex flex-col">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-xl font-bold text-gray-900">Fashion Storyboard</h2>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-1 rounded">Langkah 1</span>
        </div>
        <p className="text-sm text-gray-500">Buat visualisasi pose & ganti wajah otomatis.</p>
      </div>

      <div className="space-y-6 flex-1">
        {/* Main Product Upload */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">1. GAMBAR PRODUK UTAMA (WAJIB)</label>
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
                handleFileChange(e, 'productImage');
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

        <div className="grid grid-cols-2 gap-4">
            {/* Face Image */}
            <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">FOTO WAJAH (OPSIONAL)</label>
                {inputState.faceImage ? (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-200 h-24 w-full">
                    <img src={inputState.faceImage} alt="Face" className="w-full h-full object-cover" />
                    <button 
                        onClick={() => clearImage('faceImage')}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    </div>
                ) : (
                    <div 
                        className={`border-2 border-dashed rounded-xl p-3 text-center transition-colors h-24 flex items-center justify-center ${dragFaceActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'}`}
                        onDragOver={(e) => { e.preventDefault(); setDragFaceActive(true); }}
                        onDragLeave={() => setDragFaceActive(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragFaceActive(false);
                          handleFileChange(e, 'faceImage');
                        }}
                    >
                        <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
                        <svg className="w-5 h-5 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        <span className="text-[10px] text-indigo-600 font-medium leading-tight">Ganti Wajah</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'faceImage')} />
                        </label>
                    </div>
                )}
            </div>

            {/* Background Image */}
            <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">LATAR (OPSIONAL)</label>
                {inputState.backgroundImage ? (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-200 h-24 w-full">
                    <img src={inputState.backgroundImage} alt="Background" className="w-full h-full object-cover" />
                    <button 
                        onClick={() => clearImage('backgroundImage')}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    </div>
                ) : (
                    <div 
                        className={`border-2 border-dashed rounded-xl p-3 text-center transition-colors h-24 flex items-center justify-center ${dragBgActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'}`}
                        onDragOver={(e) => { e.preventDefault(); setDragBgActive(true); }}
                        onDragLeave={() => setDragBgActive(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragBgActive(false);
                          handleFileChange(e, 'backgroundImage');
                        }}
                    >
                        <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
                        <svg className="w-5 h-5 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span className="text-[10px] text-indigo-600 font-medium leading-tight">Upload Latar</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'backgroundImage')} />
                        </label>
                    </div>
                )}
            </div>
        </div>

        {/* Bahasa Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">PILIH BAHASA</label>
          <select 
              value={inputState.language}
              onChange={(e) => setInputState(prev => ({...prev, language: e.target.value as any}))}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
          >
              <option value="Bahasa Indonesia">Bahasa Indonesia</option>
              <option value="Bahasa Malaysia">Bahasa Malaysia</option>
              <option value="English">English</option>
          </select>
        </div>

        {/* --- SECTION: WARNA PAKAIAN (OPTIONAL) --- */}
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">PILIH WARNA PAKAIAN (OPSIONAL)</label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-y-4 gap-x-2">
                {COLORS.map((color) => (
                    <button
                        key={color.name}
                        onClick={() => selectColor(color.name)}
                        className={`group flex flex-col items-center space-y-1 transition-all ${
                            inputState.selectedColor === color.name ? 'scale-105' : 'opacity-70 hover:opacity-100'
                        }`}
                    >
                        <div 
                            className={`w-9 h-9 rounded-full shadow-sm relative transition-all ${
                                inputState.selectedColor === color.name ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                            } ${color.border ? 'border border-gray-200' : ''}`}
                            style={{ backgroundColor: color.hex }}
                        >
                            {inputState.selectedColor === color.name && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className={`w-4 h-4 ${['WHITE', 'CREAMY', 'MINT GREEN', 'LIGHT GREY', 'LIGHT PINK', 'LIGHT BLUE', 'NUDE'].includes(color.name) ? 'text-gray-800' : 'text-white'}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <span className={`text-[8px] font-bold text-center leading-tight uppercase ${inputState.selectedColor === color.name ? 'text-indigo-600' : 'text-gray-500'}`}>{color.name}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* --- SECTION: 2. KONFIGURASI OTOMATIS --- */}
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <label className="text-xs font-bold text-gray-900 uppercase">2. KONFIGURASI OTOMATIS</label>
                </div>
            </div>

            <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-600 font-medium">Deskripsi Produk (Auto)</span>
                <button 
                    onClick={handleAnalyze}
                    disabled={!inputState.productImage || isAnalyzing}
                    className={`flex items-center space-x-1.5 text-[10px] font-bold py-1 px-2.5 rounded-lg transition-all ${
                        !inputState.productImage || isAnalyzing
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                >
                    {isAnalyzing ? (
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z"></path></svg>
                    )}
                    <span>{isAnalyzing ? 'Menganalisa...' : 'Analisa Produk Otomatis'}</span>
                </button>
            </div>

            <textarea 
                value={inputState.productDescription}
                onChange={(e) => setInputState(prev => ({ ...prev, productDescription: e.target.value }))}
                placeholder="AI akan mengisi ini otomatis setelah foto diunggah."
                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs text-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none shadow-inner"
            />
        </div>

         {/* Configuration */}
         <div className="grid grid-cols-1 gap-4">
             <div>
                <label className="block text-xs text-gray-500 mb-1">Orientasi</label>
                <select 
                    value={inputState.orientation}
                    onChange={(e) => setInputState(prev => ({...prev, orientation: e.target.value as any}))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                    <option value="Portrait (9:16)">Portrait (9:16)</option>
                    <option value="Landscape (16:9)">Landscape (16:9)</option>
                    <option value="Square (1:1)">Square (1:1)</option>
                </select>
             </div>
             <div>
                <label className="block text-xs text-gray-500 mb-1">Prompt Tambahan (Opsional)</label>
                <textarea 
                    value={inputState.additionalPrompt || ''}
                    onChange={(e) => setInputState(prev => ({...prev, additionalPrompt: e.target.value}))}
                    placeholder="Contoh: Suasana sinematik..."
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white h-20 resize-none"
                />
             </div>
         </div>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-100">
        <button 
            onClick={onGenerate}
            disabled={!inputState.productImage || isGenerating}
            className={`w-full py-3.5 rounded-xl text-white font-semibold shadow-lg transition-all flex items-center justify-center space-x-2 ${
                !inputState.productImage || isGenerating
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 transform hover:-translate-y-0.5'
            }`}
        >
            {isGenerating ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating Storyboard...</span>
                </>
            ) : (
                <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    <span>Generate Storyboard</span>
                </>
            )}
        </button>
      </div>
    </div>
  );
};

export default InputPanel;
