export type BillablePlan = 'Monthly' | 'Yearly';

export const BILLING_PLANS: Record<
  BillablePlan,
  {
    name: string;
    amountPaise: number;
    description: string;
    envPlanKey: string;
    period: 'monthly' | 'yearly';
    interval: number;
    subscriptionTotalCount: number;
  }
> = {
  Monthly: {
    name: 'AssistlyDM Monthly',
    amountPaise: 9900,
    description: 'Full access billed monthly at ₹99/month.',
    envPlanKey: 'RAZORPAY_PLAN_MONTHLY',
    period: 'monthly',
    interval: 1,
    subscriptionTotalCount: 120,
  },
  Yearly: {
    name: 'AssistlyDM Yearly',
    amountPaise: 99900,
    description: 'Full access billed yearly at ₹999/year.',
    envPlanKey: 'RAZORPAY_PLAN_YEARLY',
    period: 'yearly',
    interval: 1,
    subscriptionTotalCount: 10,
  },
};

const LEGACY_PLAN_MAP: Record<string, BillablePlan> = {
  Starter: 'Monthly',
  Growth: 'Yearly',
};

export function isBillablePlan(plan: string): plan is BillablePlan {
  return plan === 'Monthly' || plan === 'Yearly';
}

export function normalizeStoredPlan(plan: string): 'Free' | BillablePlan {
  if (plan === 'Monthly' || plan === 'Yearly') return plan;
  if (plan === 'Free') return 'Free';
  return LEGACY_PLAN_MAP[plan] || 'Free';
}

export function formatPlanPrice(plan: 'Free' | BillablePlan): string {
  if (plan === 'Free') return 'Free';
  if (plan === 'Monthly') return '₹99 / mo';
  return '₹999 / yr';
}
