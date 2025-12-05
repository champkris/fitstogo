'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Camera, CreditCard, History, Settings } from 'lucide-react';
import { Button, Card, CardContent, CardHeader } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import type { UserPhoto, UserSubscription, TryOnResult } from '@/types';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [stats, setStats] = useState({ tryOns: 0, thisMonth: 0 });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (session?.user) {
      fetchData();
    }
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      const [photosRes, subRes] = await Promise.all([
        fetch('/api/photos'),
        fetch('/api/subscription'),
      ]);

      if (photosRes.ok) {
        setPhotos(await photosRes.json());
      }
      if (subRes.ok) {
        setSubscription(await subRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch('/api/subscription/portal', { method: 'POST' });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Portal error:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-48 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

      <div className="space-y-6">
        {/* User Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-primary-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {session.user.name || 'User'}
                </h2>
                <p className="text-gray-500">{session.user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription
              </h3>
              {subscription && subscription.planType !== 'FREE' && (
                <Button variant="outline" size="sm" onClick={handleManageBilling}>
                  Manage Billing
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {subscription?.planType || 'FREE'} Plan
                </p>
                {subscription?.currentPeriodEnd && (
                  <p className="text-sm text-gray-500">
                    {subscription.cancelAtPeriodEnd
                      ? 'Expires'
                      : 'Renews'}{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              {(!subscription || subscription.planType === 'FREE') && (
                <Link href="/subscription">
                  <Button>Upgrade</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                My Photos
              </h3>
              <Link href="/profile/photos">
                <Button variant="outline" size="sm">
                  Manage Photos
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {photos.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {photos.slice(0, 4).map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img
                      src={photo.photoUrl}
                      alt="User photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">No photos uploaded yet</p>
                <Link href="/profile/photos">
                  <Button>Upload Photos</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/tryon">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <History className="w-8 h-8 text-primary-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Try-On History</h3>
                <p className="text-sm text-gray-500 mt-1">
                  View your past try-ons
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/products">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Settings className="w-8 h-8 text-primary-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Browse Products</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Find something new
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
