'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Star, Upload } from 'lucide-react';
import Link from 'next/link';
import { Button, Card, Modal } from '@/components/ui';
import { PhotoUploader } from '@/components/tryon';
import type { UserPhoto } from '@/types';

export default function PhotosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (session?.user) {
      fetchPhotos();
    }
  }, [session, status, router]);

  const fetchPhotos = async () => {
    try {
      const res = await fetch('/api/photos');
      if (res.ok) {
        setPhotos(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setIsLoading(false);
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
        setShowUploadModal(false);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleteId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/photos/${id}/default`, { method: 'PATCH' });
      if (res.ok) {
        setPhotos((prev) =>
          prev.map((p) => ({
            ...p,
            isDefault: p.id === id,
          }))
        );
      }
    } catch (error) {
      console.error('Set default failed:', error);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">My Photos</h1>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Photo
        </Button>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden group">
              <div className="relative aspect-[3/4]">
                <img
                  src={photo.photoUrl}
                  alt="User photo"
                  className="w-full h-full object-cover"
                />
                {photo.isDefault && (
                  <div className="absolute top-2 left-2 bg-primary-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Default
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!photo.isDefault && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSetDefault(photo.id)}
                    >
                      <Star className="w-4 h-4 mr-1" />
                      Set Default
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setDeleteId(photo.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm text-gray-500">
                  {photo.photoType.replace('_', ' ')}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(photo.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="p-12 text-center">
            <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No photos yet
            </h2>
            <p className="text-gray-500 mb-6">
              Upload a photo to start using virtual try-on
            </p>
            <Button onClick={() => setShowUploadModal(true)}>
              Upload Your First Photo
            </Button>
          </div>
        </Card>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Photo"
        size="md"
      >
        <PhotoUploader onUpload={handleUpload} />
        <div className="mt-4 space-y-2 text-sm text-gray-500">
          <p>Tips for best results:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use a full-body photo</li>
            <li>Wear fitted clothing</li>
            <li>Stand against a plain background</li>
            <li>Ensure good lighting</li>
          </ul>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Photo"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this photo? This action cannot be
          undone.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setDeleteId(null)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => deleteId && handleDelete(deleteId)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
