import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Download, Maximize2, X, Clock, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryItem {
  id: string;
  created_at: string;
  prompt: string;
  image_url: string;
  original_image_url?: string;
  mode: string;
}

export function HistoryGallery() {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<HistoryItem | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('generated_images')
          .select('id, created_at, prompt, image_url, mode')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setItems(data || []);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin mb-4" />
        <p className="text-white/50 font-light tracking-wide">Loading your history...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="bg-white/5 border border-white/10 p-6 rounded-full mb-6">
          <ImageIcon className="w-12 h-12 text-white/20" />
        </div>
        <h3 className="text-2xl font-serif font-light text-white/90 mb-3">No history yet</h3>
        <p className="text-white/50 font-light max-w-md">
          Images you generate will automatically appear here. Head back to the studio to create your first masterpiece.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto mt-8">
      <div className="flex items-center space-x-3 mb-8">
        <Clock className="w-5 h-5 text-white/60" />
        <h2 className="text-2xl font-serif font-light text-white/90">Your Generation History</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative aspect-square rounded-3xl overflow-hidden glass-panel glass-panel-hover shadow-2xl group cursor-pointer"
            onClick={() => setSelectedImage(item)}
          >
            <img
              src={item.image_url}
              alt={`Generated on ${new Date(item.created_at).toLocaleDateString()}`}
              className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
            />
            
            {/* Always visible download button */}
            <div className="absolute bottom-4 inset-x-4 z-20">
              <a
                href={item.image_url}
                download={`generation-${item.id}.png`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/20 text-white text-[10px] font-medium tracking-[0.2em] uppercase rounded-full transition-all duration-300 shadow-lg"
              >
                <Download className="w-3.5 h-3.5 mr-2" />
                Download
              </a>
            </div>

            {/* Hover overlay for maximize */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-between p-5 pointer-events-none">
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-medium tracking-wider uppercase text-white/80 border border-white/10">
                  {item.mode?.replace('_', ' ') || 'generation'}
                </span>
                <div className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white/80 transition-colors border border-white/10">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
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
              className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative flex justify-center items-center w-full">
                <img
                  src={selectedImage.image_url}
                  alt="Enlarged generation"
                  className="w-auto max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                />
                <a
                  href={selectedImage.image_url}
                  download={`generation-${selectedImage.id}.png`}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center justify-center px-8 py-4 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/20 text-white text-[10px] font-medium tracking-[0.2em] uppercase rounded-full transition-all duration-300 shadow-2xl"
                >
                  <Download className="w-4 h-4 mr-3" />
                  Download Image
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
