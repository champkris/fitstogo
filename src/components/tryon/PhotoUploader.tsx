'use client';

import { useState, useRef } from 'react';
import { Upload, Camera, X, User } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface PhotoUploaderProps {
  onUpload: (file: File) => Promise<void>;
  currentPhotoUrl?: string;
  isLoading?: boolean;
}

export default function PhotoUploader({
  onUpload,
  currentPhotoUrl,
  isLoading = false,
}: PhotoUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    await onUpload(file);
  };

  const clearPreview = () => {
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative">
          <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-md hover:bg-white"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      ) : (
        <div
          className={cn(
            'relative aspect-[3/4] rounded-xl border-2 border-dashed transition-colors',
            dragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-2">
              Upload your photo
            </p>
            <p className="text-gray-400 text-sm mb-4">
              Drag and drop or click to browse
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Photo
            </Button>
            <p className="text-xs text-gray-400 mt-4">
              JPEG, PNG, WebP up to 10MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
