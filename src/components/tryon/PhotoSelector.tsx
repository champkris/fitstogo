'use client';

import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserPhoto } from '@/types';

interface PhotoSelectorProps {
  photos: UserPhoto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

export default function PhotoSelector({
  photos,
  selectedId,
  onSelect,
  onAddNew,
}: PhotoSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {photos.map((photo) => (
        <button
          key={photo.id}
          onClick={() => onSelect(photo.id)}
          className={cn(
            'relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all',
            selectedId === photo.id
              ? 'border-primary-500 ring-2 ring-primary-200'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <img
            src={photo.photoUrl}
            alt="User photo"
            className="w-full h-full object-cover"
          />
          {selectedId === photo.id && (
            <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
              <div className="bg-primary-500 text-white p-1 rounded-full">
                <Check className="w-4 h-4" />
              </div>
            </div>
          )}
          {photo.isDefault && (
            <div className="absolute top-1 left-1 bg-white/90 text-xs px-1.5 py-0.5 rounded">
              Default
            </div>
          )}
        </button>
      ))}
      <button
        onClick={onAddNew}
        className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Plus className="w-6 h-6 mb-1" />
        <span className="text-xs">Add New</span>
      </button>
    </div>
  );
}
