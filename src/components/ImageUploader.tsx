import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface ImageUploaderProps {
  onImageSelect: (file: File, base64: string) => void;
  disabled?: boolean;
}

export function ImageUploader({ onImageSelect, disabled }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [disabled]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (disabled) return;

      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [disabled]
  );

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageSelect(file, result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto h-72 rounded-3xl transition-all duration-500 ease-out overflow-hidden group ${
        isDragging
          ? 'bg-white/10 scale-[1.02] border border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.1)]'
          : 'glass-panel glass-panel-hover'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-50"
        onChange={handleChange}
        accept="image/*"
        disabled={disabled}
      />
      
      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-white/50 z-10 relative pointer-events-none">
        <div className="p-4 mb-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl group-hover:scale-110 transition-transform duration-500">
          <Upload className="w-6 h-6 text-white/80" />
        </div>
        <p className="mb-2 text-sm font-light tracking-wide text-white/60">
          <span className="text-white/90 font-medium">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-white/40 font-light tracking-wider uppercase">SVG, PNG, JPG or WEBP</p>
      </div>
      
      {/* Silver background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  );
}
