'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlanCard } from '@/components/subscription';
import { Button } from '@/components/ui';
import { PLANS, type PlanKey } from '@/lib/stripe';

export default function SubscriptionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);

  const handleSelectPlan = async (plan: PlanKey) => {
    if (!session) {
      router.push('/login?redirect=/subscription');
      return;
    }

    if (plan === 'FREE') {
      return;
    }

    setIsLoading(true);
    setSelectedPlan(plan);

    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong');
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Start free and upgrade as you need. Cancel anytime.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {(Object.keys(PLANS) as PlanKey[]).map((planKey) => (
          <PlanCard
            key={planKey}
            planKey={planKey}
            currentPlan={undefined}
            onSelect={handleSelectPlan}
            isLoading={isLoading && selectedPlan === planKey}
          />
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-500 mb-4">
          All plans include access to products from Lazada and Shopee
        </p>
        <div className="flex justify-center gap-8 text-sm text-gray-500">
          <span>Secure payment with Stripe</span>
          <span>Cancel anytime</span>
          <span>Thai Baht pricing</span>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              How does virtual try-on work?
            </h3>
            <p className="text-gray-600">
              Upload a photo of yourself and select any product. Our AI will
              generate an image showing how the clothing would look on you.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Is my photo data safe?
            </h3>
            <p className="text-gray-600">
              Yes! Your photos are encrypted and stored securely. You can delete
              them anytime. We never share your photos with third parties.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Can I cancel my subscription?
            </h3>
            <p className="text-gray-600">
              Absolutely. You can cancel anytime from your profile settings.
              You&apos;ll continue to have access until the end of your billing
              period.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              What happens when I click &quot;Buy&quot;?
            </h3>
            <p className="text-gray-600">
              You&apos;ll be redirected to the official Lazada or Shopee product
              page to complete your purchase. We earn a small commission at no
              extra cost to you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
