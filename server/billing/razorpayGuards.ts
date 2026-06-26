import Razorpay from 'razorpay';
import { BILLING_PLANS, BillablePlan } from './plans';
import { ASSISTLYDM_PRODUCT_SLUG, isAssistlyDmProduct, parseAssistlyDmNotes } from './product';

type RazorpayPlanEntity = {
  id?: string;
  item?: {
    name?: string;
    amount?: number;
    currency?: string;
  };
  period?: string;
  interval?: number;
  notes?: Record<string, unknown>;
};

type RazorpaySubscriptionEntity = {
  id?: string;
  plan_id?: string;
  notes?: Record<string, unknown>;
  status?: string;
};

export class BillingIsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BillingIsolationError';
  }
}

function planNameMatchesAssistlyDm(name: string): boolean {
  return name.toLowerCase().includes('assistlydm');
}

export async function assertAssistlyDmRazorpayPlan(
  razorpay: Razorpay,
  planId: string,
  expectedPlan: BillablePlan
): Promise<void> {
  const config = BILLING_PLANS[expectedPlan];
  let remotePlan: RazorpayPlanEntity;

  try {
    remotePlan = (await razorpay.plans.fetch(planId)) as RazorpayPlanEntity;
  } catch {
    throw new BillingIsolationError(
      `Razorpay plan "${planId}" could not be loaded. Use AssistlyDM-only plan IDs in .env (${config.envPlanKey}).`
    );
  }

  const item = remotePlan.item;
  if (!item) {
    throw new BillingIsolationError(`Razorpay plan "${planId}" is missing item details.`);
  }

  if (item.currency && item.currency !== 'INR') {
    throw new BillingIsolationError(
      `Razorpay plan "${planId}" uses ${item.currency}. AssistlyDM plans must be INR.`
    );
  }

  if (item.amount !== config.amountPaise) {
    throw new BillingIsolationError(
      `Razorpay plan "${planId}" is ₹${(item.amount || 0) / 100}, but AssistlyDM ${expectedPlan} must be ₹${config.amountPaise / 100}. This plan belongs to another product — create dedicated AssistlyDM plans in Razorpay.`
    );
  }

  const planName = item.name || '';
  if (!planNameMatchesAssistlyDm(planName)) {
    throw new BillingIsolationError(
      `Razorpay plan "${planId}" is named "${planName}" and is not an AssistlyDM plan. Plan names must include "AssistlyDM".`
    );
  }

  if (remotePlan.period !== config.period || remotePlan.interval !== config.interval) {
    throw new BillingIsolationError(
      `Razorpay plan "${planId}" billing cycle does not match AssistlyDM ${expectedPlan} (${config.period}).`
    );
  }
}

export async function assertAssistlyDmRazorpaySubscription(
  razorpay: Razorpay,
  subscriptionId: string,
  expectedPlan: BillablePlan
): Promise<RazorpaySubscriptionEntity> {
  let subscription: RazorpaySubscriptionEntity;

  try {
    subscription = (await razorpay.subscriptions.fetch(subscriptionId)) as RazorpaySubscriptionEntity;
  } catch {
    throw new BillingIsolationError('Subscription could not be verified with Razorpay.');
  }

  const notes = parseAssistlyDmNotes(subscription.notes);
  if (!notes) {
    throw new BillingIsolationError(
      'This subscription is not tagged for AssistlyDM and cannot be activated here.'
    );
  }

  if (notes.plan !== expectedPlan) {
    throw new BillingIsolationError('Subscription plan does not match the selected AssistlyDM plan.');
  }

  if (!subscription.plan_id) {
    throw new BillingIsolationError('Subscription is missing a linked Razorpay plan.');
  }

  await assertAssistlyDmRazorpayPlan(razorpay, subscription.plan_id, expectedPlan);
  return subscription;
}

export function assertWebhookSubscriptionIsAssistlyDm(entity: RazorpaySubscriptionEntity): ReturnType<
  typeof parseAssistlyDmNotes
> {
  if (!isAssistlyDmProduct(entity.notes)) {
    console.info(
      `[Billing] Ignoring webhook for subscription ${entity.id} — product is not ${ASSISTLYDM_PRODUCT_SLUG}.`
    );
    return null;
  }

  const notes = parseAssistlyDmNotes(entity.notes);
  if (!notes) {
    console.warn(
      `[Billing] Ignoring webhook for subscription ${entity.id} — AssistlyDM notes are incomplete.`
    );
  }
  return notes;
}

export { ASSISTLYDM_PRODUCT_SLUG };
