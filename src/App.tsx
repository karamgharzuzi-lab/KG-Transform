import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { GeneratedGallery, GeneratedImage } from './components/GeneratedGallery';
import { ProductColorChangePanel, ColorChangeConfig } from './components/ProductColorChangePanel';
import { generateProductImage } from './lib/gemini';
import { Sparkles, RefreshCw, AlertCircle, Image as ImageIcon, Sparkle, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AppState = 'idle' | 'selecting_mode' | 'configuring_color_change' | 'generating' | 'complete' | 'error';

const STAGING_BASE = `Task: Generate a professional, campaign-ready lifestyle photograph for a home decor product.Context: The setting is a minimalist, "bright and airy" environment featuring a "warm and cozy" color story centered on creams, tans, and soft neutrals. Depending on the product's scale, place it either on a clean, neutral studio pedestal or integrated into a sunlit lounge area. The atmosphere should feel premium and serene, lit by diffused, warm natural sunlight.Constraints: * Product Integrity: The home decor item must be the undisputed focal point. Maintain 100% accuracy regarding its original shape, texture (e.g., ceramic, wood, fabric), and colors. Any text, branding, or logos must be rendered exactly as they appear in the source with zero distortion or modification.

Composition & Props: Keep the scene minimalist. Use a single organic accent, such as a delicate flower in a simple vase, to add life without cluttering the frame.

Technical Quality: Professional editorial photography style with a shallow depth of field to emphasize the product. 8k resolution, ultra-sharp details, and organic-looking highlights and shadows. No AI artifacts or "cut-and-paste" appearance.`;

const BEAUTIFIER_PROMPTS = [
  `Task: High-End Photorealistic Commercial Rendering for Instagram (1:1 Aspect Ratio).Perspective: Hero Angle (authoritative, slight top-down view).Environment Construction (Photorealistic Detail):

Subject: The original product, unaltered, with exact fidelity to colors, textures, text, and materials. Rendered with ultra-high-resolution detail, capturing micro-textures of the packaging and perfect label legibility. Enlarged significantly to fill the frame and perfectly centered.

Surface (Floor): Polished, high-gloss 3D Calacatta marble slab. The marble pattern must be minimal and sparse (predominantly white with very few, subtle grey/gold veins). Render with realistic subsurface scattering for the marble material.

Backsplash (Wall): A seamless matching Calacatta marble wall meeting the floor at a precise, sharp 90-degree corner. The veining on the wall must also be minimal.

Spatial Depth & Lens Properties: Utilize a shallow depth of field; the marble floor directly beneath the product is in sharp focus, while the receding backsplash wall has a natural, pleasing bokeh (softly out of focus). Simulate a high-quality prime lens (e.g., 50mm f/2.8) with very subtle, natural lens grain and minimal chromatic aberration at the edges for authenticity.Lighting & Reflections:

Lighting Style: Soft, luxurious, creamy neutral-white glow, providing even, diffused illumination like a professional softbox setup.

Surface Effects: The highly polished floor must show a clearly visible but softly diffused and blurred reflection of the product, incorporating realistic fresnel effects based on the viewing angle.

Shadows: A realistic, natural soft drop shadow cast directly beneath the product to ground it in the 3D space, featuring complex light interaction (bounce light) between the marble surface and the product.Strict Constraint: No color grading, saturation changes, or post-processing enhancements are to be applied to the subject itself.`,
  `Role: Expert 3D Product Photographer and Material Artist.
Task: Create a high-end commercial render while maintaining 100% subject fidelity.
Subject Constraints: Render the product with ultra-high-resolution detail, ensuring label legibility and exact material accuracy. Positioned in a Hero Angle, centered, and enlarged to fill the frame.

Environmental Variations:
The Obsidian Minimalist: A polished Black Obsidian floor and matching backsplash. High-gloss surface with sharp 90-degree corners, featuring subtle, dark-grey atmospheric reflections and a shallow DOF.

Lighting & Optics: Simulate a 50mm prime lens at f/2.8. Use a professional softbox setup to create creamy neutral-white light with a natural soft drop shadow and realistic Fresnel reflections on the floor surface.

Strict Constraint: No color grading or saturation modifications allowed on the subject.`,
  `Role: Expert 3D Product Photographer and Material Artist.
Task: Create a high-end commercial render while maintaining 100% subject fidelity.
Subject Constraints: Render the product with ultra-high-resolution detail, ensuring label legibility and exact material accuracy. Positioned in a Hero Angle, centered, and enlarged to fill the frame.

Environmental Variations:
The Raw Industrial: A smooth, light-grey Polished Concrete floor and wall. The texture should include micro-pores and subtle tonal shifts, providing a neutral, architectural contrast to the product.

Lighting & Optics: Simulate a 50mm prime lens at f/2.8. Use a professional softbox setup to create creamy neutral-white light with a natural soft drop shadow and realistic Fresnel reflections on the floor surface.

Strict Constraint: No color grading or saturation modifications allowed on the subject.`,
  `Role: Expert 3D Product Photographer and Material Artist.
Task: Create a high-end commercial render while maintaining 100% subject fidelity.
Subject Constraints: Render the product with ultra-high-resolution detail, ensuring label legibility and exact material accuracy. Positioned in a Hero Angle, centered, and enlarged to fill the frame.

Environmental Variations:
The Nordic Wood: A light-toned, matte-finished White Oak wood slat surface for the floor and wall. Ensure realistic grain direction and soft, organic bounce light between the wood and the product base.

Lighting & Optics: Simulate a 50mm prime lens at f/2.8. Use a professional softbox setup to create creamy neutral-white light with a natural soft drop shadow and realistic Fresnel reflections on the floor surface.

Strict Constraint: No color grading or saturation modifications allowed on the subject.`
];

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [originalImage, setOriginalImage] = useState<{ file: File; base64: string } | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = useCallback((file: File, base64: string) => {
    setOriginalImage({ file, base64 });
    setAppState('selecting_mode');
    setError(null);
    setGeneratedImages([]);
  }, []);

  const handleModeSelect = useCallback(async (mode: 'staging' | 'beautifier' | 'color_change') => {
    if (!originalImage) return;
    
    if (mode === 'color_change') {
      setAppState('configuring_color_change');
      return;
    }
    
    setAppState('generating');
    setError(null);

    let progressInterval: NodeJS.Timeout | undefined;

    try {
      const mimeType = originalImage.file.type;
      const base64Data = originalImage.base64.split(',')[1];

      const initialImages: GeneratedImage[] = Array.from({ length: 4 }).map((_, index) => {
        const prompt = mode === 'staging' 
          ? `${STAGING_BASE}\n\nVariation ${index + 1}`
          : BEAUTIFIER_PROMPTS[index];
          
        return {
          id: `img-${index}`,
          prompt,
          url: null,
          status: 'generating',
          progress: 0
        };
      });
      
      setGeneratedImages(initialImages);

      const startTime = Date.now();
      const expectedDuration = 8000; // gemini-2.5-flash-image is much faster

      progressInterval = setInterval(() => {
        setGeneratedImages(current =>
          current.map(img => {
            if (img.status !== 'generating') return img;
            const elapsed = Date.now() - startTime;
            const simulatedProgress = Math.min(95, Math.floor((elapsed / expectedDuration) * 90));
            return { ...img, progress: Math.max(img.progress || 0, simulatedProgress) };
          })
        );
      }, 500);

      // Process in batches of 2 to respect API concurrency limits and prevent 503 errors
      const CONCURRENCY_LIMIT = 2;
      for (let i = 0; i < initialImages.length; i += CONCURRENCY_LIMIT) {
        const batch = initialImages.slice(i, i + CONCURRENCY_LIMIT);
        
        await Promise.all(batch.map(async (img, batchIndex) => {
          try {
            // Slight stagger within the batch to avoid exact simultaneous hits
            if (batchIndex > 0) await new Promise(resolve => setTimeout(resolve, 1000));
            
            const imageUrl = await generateProductImage(base64Data, mimeType, img.prompt);
            setGeneratedImages(current => 
              current.map(currentImg => 
                currentImg.id === img.id 
                  ? { ...currentImg, url: imageUrl, status: 'complete', progress: 100 } 
                  : currentImg
              )
            );
          } catch (err: any) {
            console.error(`Failed to generate image ${img.id}:`, err);
            setGeneratedImages(current => 
              current.map(currentImg => 
                currentImg.id === img.id 
                  ? { ...currentImg, status: 'error', error: err.message || "Generation failed", progress: 0 } 
                  : currentImg
              )
            );
          }
        }));
      }

      clearInterval(progressInterval);
      setAppState('complete');
    } catch (err: any) {
      if (progressInterval) clearInterval(progressInterval);
      console.error("Pipeline error:", err);
      setError(err.message || "An error occurred during generation.");
      setAppState('error');
    }
  }, [originalImage]);

  const handleColorChangeSubmit = useCallback(async (config: ColorChangeConfig) => {
    if (!originalImage) return;

    setAppState('generating');
    setError(null);

    let progressInterval: NodeJS.Timeout | undefined;

    try {
      const mimeType = originalImage.file.type;
      const base64Data = originalImage.base64.split(',')[1];

      const prompt = `Task: High-precision masked recolor of a specific object in the image.
Role: Expert Photo Retoucher and Material Artist.

Target Object: ${config.targetObject}
${config.currentColor ? `Current Color: ${config.currentColor}` : ''}
New Color: ${config.newColor}
Material/Finish: ${config.finish}

Constraints:
- Perform a flawless, pixel-perfect recolor of ONLY the "${config.targetObject}".
- Preserve all original textures, shadows, highlights, reflections, and branding/logos.
- Do NOT alter the background, lighting, or any neighboring objects.
- The new color must look completely natural and photorealistic.
- If a metallic or brushed finish is requested, render realistic surface behavior (e.g., anisotropic highlights for brushed metal, high specularity for chrome/gloss), not just a flat color overlay.
- Maintain 100% fidelity to the original image's composition and non-target elements.`;

      const initialImages: GeneratedImage[] = Array.from({ length: 4 }).map((_, index) => {
        return {
          id: `img-color-${index}`,
          prompt: `${prompt}\n\nVariation ${index + 1}`,
          url: null,
          status: 'generating',
          progress: 0
        };
      });
      
      setGeneratedImages(initialImages);

      const startTime = Date.now();
      const expectedDuration = 8000;

      progressInterval = setInterval(() => {
        setGeneratedImages(current =>
          current.map(img => {
            if (img.status !== 'generating') return img;
            const elapsed = Date.now() - startTime;
            const simulatedProgress = Math.min(95, Math.floor((elapsed / expectedDuration) * 90));
            return { ...img, progress: Math.max(img.progress || 0, simulatedProgress) };
          })
        );
      }, 500);

      const CONCURRENCY_LIMIT = 2;
      for (let i = 0; i < initialImages.length; i += CONCURRENCY_LIMIT) {
        const batch = initialImages.slice(i, i + CONCURRENCY_LIMIT);
        
        await Promise.all(batch.map(async (img, batchIndex) => {
          try {
            if (batchIndex > 0) await new Promise(resolve => setTimeout(resolve, 1000));
            
            const imageUrl = await generateProductImage(base64Data, mimeType, img.prompt);
            setGeneratedImages(current => 
              current.map(currentImg => 
                currentImg.id === img.id 
                  ? { ...currentImg, url: imageUrl, status: 'complete', progress: 100 } 
                  : currentImg
              )
            );
          } catch (err: any) {
            console.error(`Failed to generate image ${img.id}:`, err);
            setGeneratedImages(current => 
              current.map(currentImg => 
                currentImg.id === img.id 
                  ? { ...currentImg, status: 'error', error: err.message || "Generation failed", progress: 0 } 
                  : currentImg
              )
            );
          }
        }));
      }

      clearInterval(progressInterval);
      setAppState('complete');
    } catch (err: any) {
      if (progressInterval) clearInterval(progressInterval);
      console.error("Pipeline error:", err);
      setError(err.message || "An error occurred during generation.");
      setAppState('error');
    }
  }, [originalImage]);

  const handleReset = () => {
    setAppState('idle');
    setOriginalImage(null);
    setGeneratedImages([]);
    setError(null);
  };

  const handleRetry = useCallback(async (id: string) => {
    if (!originalImage) return;

    let promptToRetry = '';
    setGeneratedImages(current => {
      const img = current.find(i => i.id === id);
      if (img) {
        promptToRetry = img.prompt;
      }
      return current.map(img =>
        img.id === id ? { ...img, status: 'generating', progress: 0, error: undefined } : img
      );
    });

    if (!promptToRetry) return;

    const mimeType = originalImage.file.type;
    const base64Data = originalImage.base64.split(',')[1];
    
    const startTime = Date.now();
    const expectedDuration = 8000;

    const progressInterval = setInterval(() => {
      setGeneratedImages(current =>
        current.map(img => {
          if (img.id !== id || img.status !== 'generating') return img;
          const elapsed = Date.now() - startTime;
          const simulatedProgress = Math.min(95, Math.floor((elapsed / expectedDuration) * 90));
          return { ...img, progress: Math.max(img.progress || 0, simulatedProgress) };
        })
      );
    }, 500);

    try {
      const imageUrl = await generateProductImage(base64Data, mimeType, promptToRetry);
      setGeneratedImages(current =>
        current.map(img =>
          img.id === id ? { ...img, url: imageUrl, status: 'complete', progress: 100 } : img
        )
      );
    } catch (err: any) {
      console.error(`Failed to retry image ${id}:`, err);
      setGeneratedImages(current =>
        current.map(img =>
          img.id === id ? { ...img, status: 'error', error: err.message || "Generation failed", progress: 0 } : img
        )
      );
    } finally {
      clearInterval(progressInterval);
    }
  }, [originalImage]);

  return (
    <div className="min-h-screen atmosphere-bg text-white font-sans selection:bg-white/20">
      <header className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full border border-[#39ff14]/30 flex items-center justify-center bg-[#39ff14]/10 shadow-[0_0_10px_rgba(57,255,20,0.2)]">
              <Sparkles className="w-4 h-4 neon-green-icon" />
            </div>
            <h1 className="text-sm font-medium tracking-[0.2em] uppercase neon-green-text">
              KG Transform
            </h1>
          </div>
          
          {appState !== 'idle' && (
            <button
              onClick={handleReset}
              className="inline-flex items-center px-4 py-2 text-xs font-medium text-white/80 glass-panel glass-panel-hover rounded-full transition-all duration-300"
            >
              <RefreshCw className="w-3 h-3 mr-2 opacity-70" />
              Start Over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        <AnimatePresence mode="wait">
          {appState === 'idle' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center text-center max-w-3xl mx-auto"
            >
              <h2 className="text-5xl md:text-7xl font-serif font-light tracking-tight text-white mb-6 leading-tight">
                Transform your product.
              </h2>
              <p className="text-lg text-white/50 mb-12 max-w-2xl font-light leading-relaxed tracking-wide">
                Upload your product for an instant professional makeover
              </p>
              
              <ImageUploader onImageSelect={handleImageSelect} />
            </motion.div>
          )}

          {appState === 'selecting_mode' && originalImage && (
            <motion.div
              key="selecting_mode"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center max-w-4xl mx-auto"
            >
              <h2 className="text-4xl md:text-5xl font-serif font-light tracking-tight text-white mb-4">
                Choose a Style
              </h2>
              <p className="text-white/50 mb-12 font-light tracking-wide">
                Select how you want to transform your product image.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                <button
                  onClick={() => handleModeSelect('staging')}
                  className="group relative flex flex-col items-start p-8 glass-panel glass-panel-hover rounded-3xl transition-all duration-500 text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-500">
                    <ImageIcon className="w-6 h-6 text-white/80" />
                  </div>
                  <h3 className="text-xl font-medium text-white/90 mb-3 tracking-wide">Product Staging</h3>
                  <p className="text-white/50 font-light leading-relaxed text-sm">
                    Campaign-ready lifestyle photograph in a bright, airy, and minimalist environment with warm and cozy neutrals.
                  </p>
                </button>

                <button
                  onClick={() => handleModeSelect('beautifier')}
                  className="group relative flex flex-col items-start p-8 glass-panel glass-panel-hover rounded-3xl transition-all duration-500 text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Sparkle className="w-6 h-6 text-white/80" />
                  </div>
                  <h3 className="text-xl font-medium text-white/90 mb-3 tracking-wide">Product Beautifier</h3>
                  <p className="text-white/50 font-light leading-relaxed text-sm">
                    High-end photorealistic commercial rendering on polished Calacatta marble with luxurious studio lighting.
                  </p>
                </button>

                <button
                  onClick={() => handleModeSelect('color_change')}
                  className="group relative flex flex-col items-start p-8 glass-panel glass-panel-hover rounded-3xl transition-all duration-500 text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Palette className="w-6 h-6 text-white/80" />
                  </div>
                  <h3 className="text-xl font-medium text-white/90 mb-3 tracking-wide">Product Color Change</h3>
                  <p className="text-white/50 font-light leading-relaxed text-sm">
                    High-precision masked recolor of specific objects, preserving textures, reflections, and realism.
                  </p>
                </button>
              </div>
            </motion.div>
          )}

          {appState === 'configuring_color_change' && originalImage && (
            <ProductColorChangePanel 
              originalImage={originalImage}
              onGenerate={handleColorChangeSubmit} 
              onCancel={() => setAppState('selecting_mode')} 
            />
          )}

          {(appState === 'generating' || appState === 'complete') && originalImage && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              <GeneratedGallery originalImage={originalImage.base64} images={generatedImages} onRetry={handleRetry} />
            </motion.div>
          )}

          {appState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-full mb-6">
                <AlertCircle className="w-8 h-8 text-red-400/80" />
              </div>
              <h3 className="text-xl font-medium text-white/90 mb-2 tracking-wide">Something went wrong</h3>
              <p className="text-white/50 mb-8 max-w-md font-light">{error}</p>
              <button
                onClick={handleReset}
                className="inline-flex items-center px-6 py-3 border border-white/10 text-xs font-medium tracking-[0.2em] uppercase rounded-full text-white/80 glass-panel glass-panel-hover transition-all duration-300"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

