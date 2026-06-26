/** Must match server/billing/product.ts — tags AssistlyDM on shared Razorpay accounts. */
export const ASSISTLYDM_BILLING_PRODUCT = 'assistly-dm';

export type BillablePlan = 'Monthly' | 'Yearly';
export type UserPlan = 'Free' | BillablePlan;

export const PLAN_CATALOG: Record<
  BillablePlan,
  {
    label: string;
    priceLabel: string;
    cycleLabel: string;
    description: string;
    badge?: string;
    highlighted?: boolean;
  }
> = {
  Monthly: {
    label: 'Monthly',
    priceLabel: '₹99',
    cycleLabel: '/month',
    description: 'Try free for 14 days, then ₹99/month. Cancel anytime.',
    badge: '14-Day Free Trial',
    highlighted: true,
  },
  Yearly: {
    label: 'Yearly',
    priceLabel: '₹999',
    cycleLabel: '/year',
    description: 'One payment for the full year — less than ₹83/month.',
    badge: 'Best Value · Save ₹189',
    highlighted: false,
  },
};

export function formatPlanPrice(plan: UserPlan): string {
  if (plan === 'Free') return 'Free';
  if (plan === 'Monthly') return '₹99 / mo';
  return '₹999 / yr';
}

export function formatPlanDescription(plan: UserPlan): string {
  if (plan === 'Free') return 'Explore automations and test your workflows before subscribing.';
  return PLAN_CATALOG[plan].description;
}

export function normalizeStoredPlan(plan: string | null | undefined): UserPlan {
  if (plan === 'Monthly' || plan === 'Yearly' || plan === 'Free') return plan;
  if (plan === 'Starter') return 'Monthly';
  if (plan === 'Growth') return 'Yearly';
  return 'Free';
}
