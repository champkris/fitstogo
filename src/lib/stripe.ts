import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    tryOnsPerMonth: 5,
    maxPhotos: 1,
    historyDays: 7,
    features: ['5 try-ons per month', '1 photo storage', '7-day history'],
  },
  BASIC: {
    name: 'Basic',
    price: 99,
    priceId: process.env.STRIPE_PRICE_BASIC,
    tryOnsPerMonth: 50,
    maxPhotos: 5,
    historyDays: 30,
    features: ['50 try-ons per month', '5 photo storage', '30-day history'],
  },
  PREMIUM: {
    name: 'Premium',
    price: 299,
    priceId: process.env.STRIPE_PRICE_PREMIUM,
    tryOnsPerMonth: -1, // unlimited
    maxPhotos: 20,
    historyDays: -1, // forever
    features: [
      'Unlimited try-ons',
      '20 photo storage',
      'Forever history',
      'Priority processing',
      'API access',
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
