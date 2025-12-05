'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Check, Crop, RotateCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui';

interface GarmentSelectorProps {
  images: string[];
  title: string;
  selectedImageUrl: string;
  onSelect: (imageUrl: string, maskRegion?: MaskRegion) => void;
}

export interface MaskRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function GarmentSelector({
  images,
  title,
  selectedImageUrl,
  onSelect,
}: GarmentSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const idx = images.indexOf(selectedImageUrl);
    return idx >= 0 ? idx : 0;
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [region, setRegion] = useState<MaskRegion | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const currentImage = images[selectedIndex];

  // Update parent when selection changes
  useEffect(() => {
    onSelect(currentImage, region || undefined);
  }, [currentImage, region]);

  const handleImageSelect = (index: number) => {
    setSelectedIndex(index);
    setRegion(null); // Reset region when changing image
  };

  const getRelativePosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const rect = canvasRef.current.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawMode) return;
    e.preventDefault();
    const pos = getRelativePosition(e);
    setStartPos(pos);
    setIsDrawing(true);
    setRegion(null);
  }, [drawMode, getRelativePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startPos) return;
    e.preventDefault();
    const pos = getRelativePosition(e);

    setRegion({
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      width: Math.abs(pos.x - startPos.x),
      height: Math.abs(pos.y - startPos.y),
    });
  }, [isDrawing, startPos, getRelativePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    setStartPos(null);
    if (region && region.width > 5 && region.height > 5) {
      setDrawMode(false);
    } else {
      setRegion(null);
    }
  }, [region]);

  const clearRegion = () => {
    setRegion(null);
  };

  return (
    <div className="space-y-4">
      {/* Info text */}
      <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p>
          Select the product image that best shows the clothing.
          Optionally, draw a box around the garment area for better results.
        </p>
      </div>

      {/* Main image with region drawing */}
      <div
        ref={canvasRef}
        className={`relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 ${
          drawMode ? 'cursor-crosshair' : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <img
          src={currentImage}
          alt={title}
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
        />

        {/* Selection region overlay */}
        {region && (
          <div
            className="absolute border-2 border-dashed border-primary-500 bg-primary-500/20"
            style={{
              left: `${region.x}%`,
              top: `${region.y}%`,
              width: `${region.width}%`,
              height: `${region.height}%`,
            }}
          >
            <div className="absolute -top-6 left-0 bg-primary-500 text-white text-xs px-2 py-0.5 rounded">
              Garment Area
            </div>
          </div>
        )}

        {/* Draw mode overlay */}
        {drawMode && !region && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 px-4 py-2 rounded-lg text-sm font-medium">
              Draw a box around the clothing
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {!region ? (
          <Button
            variant={drawMode ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setDrawMode(!drawMode)}
            className="flex-1"
          >
            <Crop className="w-4 h-4 mr-2" />
            {drawMode ? 'Drawing...' : 'Select Garment Area'}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={clearRegion}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear Selection
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setDrawMode(true)}
              className="flex-1"
            >
              <Crop className="w-4 h-4 mr-2" />
              Redraw
            </Button>
          </>
        )}
      </div>

      {/* Thumbnail grid */}
      {images.length > 1 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Product Images ({images.length})
          </p>
          <div className="grid grid-cols-5 gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => handleImageSelect(i)}
                className={`relative aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 transition-all ${
                  i === selectedIndex
                    ? 'border-primary-500 ring-2 ring-primary-200'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={img}
                  alt={`${title} - ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                {i === selectedIndex && (
                  <div className="absolute top-1 right-1 bg-primary-500 text-white rounded-full p-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
