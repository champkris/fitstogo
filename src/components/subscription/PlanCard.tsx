'use client';

import { Check } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { formatPrice, cn } from '@/lib/utils';
import { PLANS, type PlanKey } from '@/lib/stripe';

interface PlanCardProps {
  planKey: PlanKey;
  currentPlan?: PlanKey;
  onSelect: (plan: PlanKey) => void;
  isLoading?: boolean;
}

export default function PlanCard({
  planKey,
  currentPlan,
  onSelect,
  isLoading = false,
}: PlanCardProps) {
  const plan = PLANS[planKey];
  const isCurrentPlan = currentPlan === planKey;
  const isPremium = planKey === 'PREMIUM';

  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        isPremium && 'border-primary-500 ring-2 ring-primary-200'
      )}
    >
      {isPremium && (
        <div className="absolute top-0 right-0 bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
          POPULAR
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        <div className="mt-4">
          <span className="text-4xl font-bold text-gray-900">
            {plan.price === 0 ? 'Free' : formatPrice(plan.price)}
          </span>
          {plan.price > 0 && (
            <span className="text-gray-500 ml-1">/month</span>
          )}
        </div>
        <ul className="mt-6 space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Button
            className="w-full"
            variant={isCurrentPlan ? 'secondary' : isPremium ? 'primary' : 'outline'}
            onClick={() => onSelect(planKey)}
            disabled={isCurrentPlan || isLoading}
            isLoading={isLoading}
          >
            {isCurrentPlan
              ? 'Current Plan'
              : planKey === 'FREE'
              ? 'Get Started'
              : 'Upgrade'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
