'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui';
import type { TryOnResult } from '@/types';

interface ResultViewerProps {
  results: TryOnResult[];
  onDelete?: (id: string) => void;
}

export default function ResultViewer({ results, onDelete }: ResultViewerProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No try-on history yet</p>
        <p className="text-gray-400 text-sm mt-1">
          Start by selecting a product to try on
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {results.map((result) => (
        <Card key={result.id} className="overflow-hidden">
          <div className="relative aspect-[3/4] bg-gray-100">
            {result.status === 'COMPLETED' && result.resultUrl ? (
              <Image
                src={result.resultUrl}
                alt="Try-on result"
                fill
                className="object-cover"
              />
            ) : result.status === 'PROCESSING' ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Processing...</div>
              </div>
            ) : result.status === 'FAILED' ? (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                <p className="text-red-500 text-sm">Failed</p>
              </div>
            ) : null}

            {result.status === 'COMPLETED' && (
              <div className="absolute top-2 right-2 flex gap-1">
                <Link
                  href={`/products/${result.product.id}`}
                  className="bg-white/90 p-1.5 rounded-full shadow hover:bg-white"
                >
                  <ExternalLink className="w-3 h-3 text-gray-600" />
                </Link>
                {onDelete && (
                  <button
                    onClick={() => onDelete(result.id)}
                    className="bg-white/90 p-1.5 rounded-full shadow hover:bg-white"
                  >
                    <Trash2 className="w-3 h-3 text-gray-600" />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="text-sm font-medium text-gray-900 line-clamp-1">
              {result.product.title}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
