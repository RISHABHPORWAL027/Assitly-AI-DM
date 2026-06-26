import { postJson } from './apiClient';
import type { BillablePlan, UserPlan } from './plans';

export type { BillablePlan, UserPlan };

export interface BillingStatusResponse {
  plan: UserPlan;
  product: string;
  subscriptionId: string | null;
}

export interface SubscribeResponse {
  keyId: string;
  subscriptionId: string;
  product: string;
  plan: BillablePlan;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: {
    email?: string;
    name?: string;
  };
}

export async function fetchBillingStatus(
  authHeaders: Record<string, string>
): Promise<BillingStatusResponse> {
  const res = await fetch('/api/billing/status', { headers: authHeaders });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to load billing status');
  }
  return res.json();
}

export async function createSubscriptionCheckout(
  authHeaders: Record<string, string>,
  plan: BillablePlan
): Promise<SubscribeResponse> {
  const res = await postJson('/api/billing/subscribe', authHeaders, { plan });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to start checkout');
  }
  return res.json();
}

export async function verifySubscriptionPayment(
  authHeaders: Record<string, string>,
  payload: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
    plan: BillablePlan;
  }
): Promise<{ success: boolean; plan: BillablePlan }> {
  const res = await postJson('/api/billing/verify', authHeaders, payload);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Payment verification failed');
  }
  return res.json();
}
