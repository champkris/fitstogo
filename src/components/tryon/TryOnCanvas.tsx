'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Loader2, Download, Share2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface TryOnCanvasProps {
  userPhotoUrl?: string;
  productImageUrl?: string;
  resultUrl?: string;
  isProcessing?: boolean;
  onRetry?: () => void;
}

export default function TryOnCanvas({
  userPhotoUrl,
  productImageUrl,
  resultUrl,
  isProcessing = false,
  onRetry,
}: TryOnCanvasProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  const handleDownload = async () => {
    if (!resultUrl) return;

    try {
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitstogo-tryon-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleShare = async () => {
    if (!resultUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Virtual Try-On',
          text: 'Check out my virtual try-on from FitsToGo!',
          url: window.location.href,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="w-full">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
        {isProcessing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80">
            <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
            <p className="text-white font-medium">Processing your try-on...</p>
            <p className="text-gray-300 text-sm mt-1">This may take a few seconds</p>
          </div>
        ) : resultUrl ? (
          <>
            <Image
              src={showOriginal && userPhotoUrl ? userPhotoUrl : resultUrl}
              alt="Try-on result"
              fill
              className="object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="text-white text-sm hover:underline"
                >
                  {showOriginal ? 'Show Result' : 'Show Original'}
                </button>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : userPhotoUrl && productImageUrl ? (
          <div className="absolute inset-0 grid grid-cols-2">
            <div className="relative border-r border-white/20">
              <Image
                src={userPhotoUrl}
                alt="Your photo"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                Your Photo
              </div>
            </div>
            <div className="relative">
              <Image
                src={productImageUrl}
                alt="Product"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                Product
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400 text-center px-4">
              Select a photo and product to see your virtual try-on
            </p>
          </div>
        )}
      </div>

      {resultUrl && onRetry && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
