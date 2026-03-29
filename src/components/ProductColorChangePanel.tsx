import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Palette, Check, Loader2, Sparkles, MousePointerClick } from 'lucide-react';
import { analyzeImageForRecoloring, ImagePart } from '../lib/gemini';

export interface ColorChangeConfig {
  targetObject: string;
  currentColor: string;
  newColor: string;
  finish: string;
}

interface ProductColorChangePanelProps {
  originalImage: { file: File; base64: string };
  onGenerate: (config: ColorChangeConfig) => void;
  onCancel: () => void;
}

const COLOR_GROUPS = [
  {
    name: 'Standard & Luxury Neutrals',
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Ivory', hex: '#FFFFF0' },
      { name: 'Cream', hex: '#FFFDD0' },
      { name: 'Beige', hex: '#F5F5DC' },
      { name: 'Taupe', hex: '#483C32' },
      { name: 'Gray', hex: '#808080' },
      { name: 'Charcoal', hex: '#36454F' },
      { name: 'Brown', hex: '#964B00' },
      { name: 'Tan', hex: '#D2B48C' },
      { name: 'Red', hex: '#FF0000' },
      { name: 'Burgundy', hex: '#800020' },
      { name: 'Orange', hex: '#FFA500' },
      { name: 'Yellow', hex: '#FFFF00' },
      { name: 'Olive', hex: '#808000' },
      { name: 'Green', hex: '#008000' },
      { name: 'Emerald', hex: '#50C878' },
      { name: 'Teal', hex: '#008080' },
      { name: 'Blue', hex: '#0000FF' },
      { name: 'Navy', hex: '#000080' },
      { name: 'Purple', hex: '#800080' },
      { name: 'Lavender', hex: '#E6E6FA' },
      { name: 'Pink', hex: '#FFC0CB' },
      { name: 'Blush', hex: '#DE5D83' },
    ]
  },
  {
    name: 'Metallic Finishes',
    colors: [
      { name: 'Gold', hex: '#FFD700', isMetallic: true },
      { name: 'Silver', hex: '#C0C0C0', isMetallic: true },
      { name: 'Copper', hex: '#B87333', isMetallic: true },
      { name: 'Bronze', hex: '#CD7F32', isMetallic: true },
      { name: 'Rose Gold', hex: '#B76E79', isMetallic: true },
      { name: 'Platinum', hex: '#E5E4E2', isMetallic: true },
      { name: 'Brass', hex: '#B5A642', isMetallic: true },
      { name: 'Chrome', hex: '#D8D8D8', isMetallic: true },
      { name: 'Gunmetal', hex: '#2A3439', isMetallic: true },
      { name: 'Titanium', hex: '#878681', isMetallic: true },
      { name: 'Black Metal', hex: '#111111', isMetallic: true },
      { name: 'Steel', hex: '#434B4D', isMetallic: true },
    ]
  },
];

const FINISHES = [
  'Default',
  'Glossy',
  'Metallic',
  'Brushed Metal'
];

export function ProductColorChangePanel({ originalImage, onGenerate, onCancel }: ProductColorChangePanelProps) {
  const [targetObject, setTargetObject] = useState('');
  const [currentColor, setCurrentColor] = useState('');
  const [newColor, setNewColor] = useState('');
  const [finish, setFinish] = useState('Default');
  const [activeColorGroup, setActiveColorGroup] = useState(COLOR_GROUPS[0].name);
  
  const [suggestedObjects, setSuggestedObjects] = useState<ImagePart[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const analyzeImage = async () => {
      setIsAnalyzing(true);
      try {
        const mimeType = originalImage.file.type;
        const base64Data = originalImage.base64.split(',')[1];
        const suggestions = await analyzeImageForRecoloring(base64Data, mimeType);
        if (isMounted && suggestions.length > 0) {
          setSuggestedObjects(suggestions);
        }
      } catch (error) {
        console.error("Analysis failed", error);
      } finally {
        if (isMounted) setIsAnalyzing(false);
      }
    };
    
    analyzeImage();
    
    return () => {
      isMounted = false;
    };
  }, [originalImage]);

  const isValid = targetObject.trim().length > 0 && newColor.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onGenerate({ targetObject, currentColor, newColor, finish });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-4xl mx-auto glass-panel rounded-3xl p-6 sm:p-10"
    >
      <div className="flex items-center space-x-4 mb-8">
        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
          <Palette className="w-6 h-6 text-white/80" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-light text-white">Product Color Change</h2>
          <p className="text-white/50 text-sm font-light">Configure high-precision recoloring</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Interactive Image Section */}
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[200px]">
          {isAnalyzing ? (
            <div className="flex flex-col items-center text-white/50">
              <Loader2 className="w-8 h-8 mb-4 animate-spin text-[#39ff14]" />
              <p className="text-sm tracking-wide">Analyzing image for recolorable objects...</p>
            </div>
          ) : (
            <>
              <div className="w-full flex justify-between items-center mb-4">
                <span className="text-xs font-medium tracking-[0.1em] uppercase text-white/60 flex items-center">
                  <MousePointerClick className="w-4 h-4 mr-2" />
                  Select an object on the image
                </span>
              </div>
              <div className="relative inline-block max-w-full rounded-lg overflow-hidden border border-white/10 shadow-2xl">
                <img 
                  src={originalImage.base64} 
                  alt="Product to recolor" 
                  className="max-h-[40vh] w-auto object-contain block"
                />
                {suggestedObjects.map((part, idx) => {
                  const scale = part.box.some(v => v > 1) ? 1000 : 1;
                  const [ymin, xmin, ymax, xmax] = part.box;
                  const y1 = Math.min(ymin, ymax);
                  const y2 = Math.max(ymin, ymax);
                  const x1 = Math.min(xmin, xmax);
                  const x2 = Math.max(xmin, xmax);

                  const top = `${(y1 / scale) * 100}%`;
                  const left = `${(x1 / scale) * 100}%`;
                  const height = `${((y2 - y1) / scale) * 100}%`;
                  const width = `${((x2 - x1) / scale) * 100}%`;
                  const isSelected = targetObject === part.name;

                  return (
                    <div
                      key={idx}
                      onClick={() => setTargetObject(part.name)}
                      className={`absolute cursor-pointer group z-10 ${isSelected ? 'z-20' : ''}`}
                      style={{ top, left, width, height }}
                      title={part.name}
                    >
                      {/* Soft, professional spotlight glow instead of a beginner box */}
                      <div 
                        className={`absolute inset-[-30%] transition-all duration-700 pointer-events-none rounded-[100%] ${
                          isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-100'
                        }`}
                        style={{
                          background: isSelected 
                            ? 'radial-gradient(ellipse at center, rgba(57,255,20,0.5) 0%, rgba(57,255,20,0) 70%)'
                            : 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
                          filter: 'blur(12px)',
                          mixBlendMode: isSelected ? 'screen' : 'normal'
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 flex flex-col justify-center">
            <label className="text-xs font-medium tracking-[0.1em] uppercase text-white/60">
              Select Target Object <span className="text-red-400">*</span>
            </label>
            {suggestedObjects.length === 0 && !isAnalyzing ? (
              <input
                type="text"
                value={targetObject}
                onChange={(e) => setTargetObject(e.target.value)}
                placeholder="e.g., The vase, The leaves"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                required
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {suggestedObjects.map((obj) => (
                  <button
                    key={obj.name}
                    type="button"
                    onClick={() => setTargetObject(obj.name)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                      targetObject === obj.name
                        ? 'bg-[#39ff14]/20 border-[#39ff14] text-[#39ff14] shadow-[0_0_10px_rgba(57,255,20,0.2)]'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/30'
                    }`}
                  >
                    {obj.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-3">
            <label className="text-xs font-medium tracking-[0.1em] uppercase text-white/60">
              Current Color (Optional)
            </label>
            <input
              type="text"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              placeholder="e.g., Silver, Red"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all mt-auto"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-medium tracking-[0.1em] uppercase text-white/60">
              Material Finish <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {FINISHES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFinish(f)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 border ${
                    finish === f
                      ? 'bg-white text-black border-white'
                      : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {/* Color Group Tabs */}
            <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar">
              {COLOR_GROUPS.map((group) => (
                <button
                  key={group.name}
                  type="button"
                  onClick={() => setActiveColorGroup(group.name)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 border ${
                    activeColorGroup === group.name
                      ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                      : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {group.name}
                </button>
              ))}
            </div>

            {/* Active Group Colors Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 pt-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
              {/* Custom Color Picker */}
              <div 
                className={`group relative flex flex-col items-center p-2 rounded-xl border transition-all duration-300 ${
                  newColor.startsWith('#') 
                    ? 'bg-white/10 border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-10 h-10 rounded-full mb-2 shadow-inner relative overflow-hidden ring-1 ring-white/20">
                  <input
                    type="color"
                    value={newColor.startsWith('#') ? newColor : '#ffffff'}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer opacity-0 z-10"
                    title="Choose custom color"
                  />
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundColor: newColor.startsWith('#') ? newColor : 'transparent' }}
                  >
                    {!newColor.startsWith('#') && (
                      <div className="w-full h-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500 opacity-50" />
                    )}
                  </div>
                  {newColor.startsWith('#') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                      <Check className="w-5 h-5 text-white drop-shadow-md" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-center text-white/70 group-hover:text-white/90 leading-tight">
                  Custom
                </span>
              </div>

              {COLOR_GROUPS.find(g => g.name === activeColorGroup)?.colors.map((color) => {
                const isSelected = newColor === color.name;
                
                // Determine visual style based on selected finish, overriding intrinsic color properties
                const isVisuallyMetallic = finish === 'Metallic' || (finish === 'Default' && color.isMetallic && !color.isBrushed);
                const isVisuallyBrushed = finish === 'Brushed Metal' || (finish === 'Default' && color.isBrushed);
                const isVisuallyGlossy = finish === 'Glossy';

                let backgroundStyle = 'none';
                if (isVisuallyBrushed) {
                  backgroundStyle = 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent), linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)';
                } else if (isVisuallyMetallic) {
                  backgroundStyle = 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 45%, rgba(0,0,0,0.3) 100%)';
                } else if (isVisuallyGlossy) {
                  backgroundStyle = 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 30%, transparent 100%)';
                }

              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setNewColor(color.name)}
                  className={`group relative flex flex-col items-center p-2 rounded-xl border transition-all duration-300 ${
                    isSelected 
                      ? 'bg-white/10 border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div 
                    className={`w-10 h-10 rounded-full mb-2 shadow-inner relative overflow-hidden ${
                      isVisuallyMetallic || isVisuallyBrushed ? 'ring-1 ring-white/20' : ''
                    }`}
                    style={{ 
                      backgroundColor: color.hex,
                      backgroundImage: backgroundStyle,
                      backgroundSize: isVisuallyBrushed ? '4px 4px, auto' : 'auto'
                    }}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Check className="w-5 h-5 text-white drop-shadow-md" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-center text-white/70 group-hover:text-white/90 leading-tight">
                    {color.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid}
            className="px-8 py-3 rounded-full text-sm font-medium bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Generate Colors
          </button>
        </div>
      </form>
    </motion.div>
  );
}
