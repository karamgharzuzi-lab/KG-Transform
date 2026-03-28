import React, { useState } from 'react';
import { Loader2, Download, AlertCircle, X, Maximize2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface GeneratedImage {
  id: string;
  prompt: string;
  url: string | null;
  status: 'pending' | 'generating' | 'complete' | 'error';
  error?: string;
  progress?: number;
  resolution?: '1K' | '2K' | '4K';
}

interface GeneratedGalleryProps {
  originalImage: string;
  images: GeneratedImage[];
  onRetry?: (id: string) => void;
}

export function GeneratedGallery({ originalImage, images, onRetry }: GeneratedGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  const getErrorMessage = (errorStr?: string) => {
    if (!errorStr) return 'Unknown error';
    try {
      const parsed = JSON.parse(errorStr);
      if (parsed.error && parsed.error.message) {
        return parsed.error.message;
      }
    } catch (e) {
      // Not JSON, return as is
    }
    return errorStr;
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-12">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Original Image */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-white/40 flex items-center">
            Original Product
          </h3>
          <div className="relative aspect-square rounded-3xl overflow-hidden glass-panel shadow-2xl bg-white/5">
            <img
              src={originalImage}
              alt="Original product"
              className="object-cover w-full h-full"
            />
          </div>
        </div>

        {/* Generated Images */}
        <div className="lg:col-span-3">
          <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-white/40 mb-4 flex items-center">
            Generated Environments
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {images.map((img, index) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative aspect-square rounded-3xl overflow-hidden glass-panel glass-panel-hover shadow-2xl group cursor-pointer"
                onClick={() => img.url && setSelectedImage(img)}
              >
                {img.status === 'pending' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 bg-black/40 backdrop-blur-md">
                    <Loader2 className="w-6 h-6 mb-3 opacity-30" />
                    <span className="text-[10px] font-medium tracking-[0.2em] uppercase">Waiting</span>
                  </div>
                )}
                
                {img.status === 'generating' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/60 backdrop-blur-md z-10 p-6">
                    <Loader2 className="w-6 h-6 mb-4 animate-spin opacity-80" />
                    <span className="text-[10px] font-medium tracking-[0.2em] uppercase mb-4">Generating</span>
                    <div className="w-full max-w-[120px] h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white/80"
                        initial={{ width: 0 }}
                        animate={{ width: `${img.progress || 0}%` }}
                        transition={{ ease: "linear", duration: 0.2 }}
                      />
                    </div>
                    <span className="text-[10px] mt-2 text-white/40 font-mono">{img.progress || 0}%</span>
                  </div>
                )}

                {img.status === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 bg-red-950/30 p-6 text-center backdrop-blur-md">
                    <AlertCircle className="w-8 h-8 mb-3 opacity-80" />
                    <span className="text-sm font-medium mb-2">Generation Failed</span>
                    <span className="text-xs text-red-400/70 line-clamp-3 font-light mb-4" title={getErrorMessage(img.error)}>{getErrorMessage(img.error)}</span>
                    {onRetry && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetry(img.id);
                        }}
                        className="inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-red-500/10 border border-red-500/20 rounded-full hover:bg-red-500/20 focus:outline-none transition-all duration-300 backdrop-blur-md"
                      >
                        <RefreshCw className="w-3 h-3 mr-2" />
                        Retry
                      </button>
                    )}
                  </div>
                )}

                {img.url && (
                  <>
                    <img
                      src={img.url}
                      alt={`Generated environment ${index + 1}`}
                      className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    
                    {/* Always visible download button */}
                    <div className="absolute bottom-4 inset-x-4 z-20">
                      <a
                        href={img.url}
                        download={`product-env-${index + 1}.png`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/20 text-white text-[10px] font-medium tracking-[0.2em] uppercase rounded-full transition-all duration-300 shadow-lg"
                      >
                        <Download className="w-3.5 h-3.5 mr-2" />
                        Download
                      </a>
                    </div>

                    {/* Hover overlay for prompt and maximize */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-between p-5 pointer-events-none">
                      <div className="flex justify-end">
                        <div className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white/80 transition-colors border border-white/10">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mb-10">
                        <p className="text-white/90 text-xs line-clamp-3 font-light leading-relaxed drop-shadow-md">
                          {img.prompt}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && selectedImage.url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 sm:p-8"
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/80 hover:text-white transition-colors backdrop-blur-md z-50"
            >
              <X className="w-5 h-5" />
            </button>
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.url}
                alt="Enlarged environment"
                className="w-auto max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
              <div className="mt-8 text-center w-full max-w-2xl">
                <p className="text-white/60 text-sm font-light leading-relaxed mb-8">
                  {selectedImage.prompt}
                </p>
                <a
                  href={selectedImage.url}
                  download="product-env-enlarged.png"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-black text-[10px] font-medium tracking-[0.2em] uppercase rounded-full hover:bg-white/90 transition-colors"
                >
                  <Download className="w-4 h-4 mr-3" />
                  Download High-Res
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
