'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button, Card, Modal } from '@/components/ui';
import {
  PhotoUploader,
  PhotoSelector,
  TryOnCanvas,
  ResultViewer,
  GarmentSelector,
  type MaskRegion,
} from '@/components/tryon';
import type { UserPhoto, TryOnResult, ProductDetail } from '@/types';

function TryOnContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const productId = searchParams.get('product');

  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [history, setHistory] = useState<TryOnResult[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGarmentImage, setSelectedGarmentImage] = useState<string | null>(null);
  const [garmentMaskRegion, setGarmentMaskRegion] = useState<MaskRegion | undefined>(undefined);

  useEffect(() => {
    if (session?.user) {
      fetchPhotos();
      fetchHistory();
    }
    if (productId) {
      fetchProduct(productId);
    }
  }, [session, productId]);

  const fetchPhotos = async () => {
    try {
      const res = await fetch('/api/photos');
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
        const defaultPhoto = data.find((p: UserPhoto) => p.isDefault);
        if (defaultPhoto) {
          setSelectedPhotoId(defaultPhoto.id);
        } else if (data.length > 0) {
          setSelectedPhotoId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    }
  };

  const fetchProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/tryon?history=true');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const newPhoto = await res.json();
        setPhotos((prev) => [...prev, newPhoto]);
        setSelectedPhotoId(newPhoto.id);
        setShowUploadModal(false);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleGarmentSelect = (imageUrl: string, maskRegion?: MaskRegion) => {
    setSelectedGarmentImage(imageUrl);
    setGarmentMaskRegion(maskRegion);
  };

  const handleTryOn = async () => {
    if (!selectedPhotoId || !product) return;

    setIsProcessing(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          userPhotoId: selectedPhotoId,
          garmentImageUrl: selectedGarmentImage || product.imageUrl,
          maskRegion: garmentMaskRegion,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Poll for result
        pollForResult(data.id);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to generate try-on');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Try-on failed:', error);
      setError('Something went wrong. Please try again.');
      setIsProcessing(false);
    }
  };

  const pollForResult = async (sessionId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/tryon/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'COMPLETED') {
            setResult(data);
            setIsProcessing(false);
            fetchHistory();
          } else if (data.status === 'FAILED') {
            setIsProcessing(false);
            alert('Try-on failed. Please try again.');
          } else {
            setTimeout(poll, 2000);
          }
        }
      } catch (error) {
        console.error('Polling failed:', error);
        setIsProcessing(false);
      }
    };

    poll();
  };

  const selectedPhoto = photos.find((p) => p.id === selectedPhotoId);

  if (status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="aspect-[3/4] bg-gray-200 rounded-xl" />
            <div className="space-y-4">
              <div className="h-40 bg-gray-200 rounded-xl" />
              <div className="h-20 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Sparkles className="w-16 h-16 text-primary-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Virtual Try-On
        </h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Sign in to use our AI-powered virtual try-on feature and see how
          clothes look on you.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/login">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Virtual Try-On</h1>
          <p className="text-gray-600 mt-1">
            See how clothes look on you before buying
          </p>
        </div>
        {product && (
          <Link href={`/products/${product.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Product
            </Button>
          </Link>
        )}
      </div>

      {/* Error Notification */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">{error}</p>
            {error.includes('limit') && (
              <p className="text-red-600 text-sm mt-1">
                <Link href="/pricing" className="underline hover:no-underline">
                  Upgrade your plan
                </Link>{' '}
                for more try-ons per month.
              </p>
            )}
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            &times;
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Try-On Canvas */}
        <div>
          <TryOnCanvas
            userPhotoUrl={selectedPhoto?.photoUrl}
            productImageUrl={product?.imageUrl}
            resultUrl={result?.resultUrl || undefined}
            isProcessing={isProcessing}
            onRetry={handleTryOn}
          />

          {selectedPhoto && product && !isProcessing && !result && (
            <div className="mt-4">
              <Button className="w-full" size="lg" onClick={handleTryOn}>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Try-On
              </Button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-6">
          {/* Photo Selection */}
          <Card>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Your Photos</h3>
              {photos.length > 0 ? (
                <PhotoSelector
                  photos={photos}
                  selectedId={selectedPhotoId}
                  onSelect={setSelectedPhotoId}
                  onAddNew={() => setShowUploadModal(true)}
                />
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">No photos uploaded yet</p>
                  <Button onClick={() => setShowUploadModal(true)}>
                    Upload Photo
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Product / Garment Selection */}
          {product ? (
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">
                    Select Garment Image
                  </h3>
                  <Link href="/products">
                    <Button variant="ghost" size="sm">
                      Change Product
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                  {product.title}
                </p>
                <GarmentSelector
                  images={[product.imageUrl, ...(product.images || [])]}
                  title={product.title}
                  selectedImageUrl={selectedGarmentImage || product.imageUrl}
                  onSelect={handleGarmentSelect}
                />
              </div>
            </Card>
          ) : (
            <Card>
              <div className="p-4 text-center">
                <p className="text-gray-500 mb-4">No product selected</p>
                <Link href="/products">
                  <Button>Browse Products</Button>
                </Link>
              </div>
            </Card>
          )}

          {/* History */}
          {history.length > 0 && (
            <Card>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Recent Try-Ons
                </h3>
                <ResultViewer results={history.slice(0, 6)} />
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Photo"
        size="md"
      >
        <PhotoUploader onUpload={handleUpload} />
        <p className="text-sm text-gray-500 mt-4">
          For best results, upload a full-body photo with good lighting and a
          plain background.
        </p>
      </Modal>
    </div>
  );
}

export default function TryOnPage() {
  return (
    <Suspense fallback={<div className="animate-pulse p-8">Loading...</div>}>
      <TryOnContent />
    </Suspense>
  );
}
