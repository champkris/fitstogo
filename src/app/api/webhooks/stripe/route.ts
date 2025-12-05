import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (userId && plan && session.subscription) {
          await prisma.subscription.update({
            where: { userId },
            data: {
              stripeSubId: session.subscription as string,
              planType: plan as 'BASIC' | 'PREMIUM',
              status: 'ACTIVE',
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription & {
          current_period_end: number;
          cancel_at_period_end: boolean;
        };

        await prisma.subscription.updateMany({
          where: { stripeSubId: subscription.id },
          data: {
            status: subscription.status === 'active' ? 'ACTIVE' :
                   subscription.status === 'past_due' ? 'PAST_DUE' :
                   subscription.status === 'canceled' ? 'CANCELED' : 'ACTIVE',
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.subscription.updateMany({
          where: { stripeSubId: subscription.id },
          data: {
            planType: 'FREE',
            status: 'CANCELED',
            stripeSubId: null,
          },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };

        if (invoice.subscription) {
          await prisma.subscription.updateMany({
            where: { stripeSubId: invoice.subscription },
            data: { status: 'PAST_DUE' },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
