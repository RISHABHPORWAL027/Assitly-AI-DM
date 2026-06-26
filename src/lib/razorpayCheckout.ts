import { BillablePlan, SubscribeResponse, verifySubscriptionPayment } from './billingApi';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

const RAZORPAY_SCRIPT_ID = 'razorpay-checkout-js';

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();

  const existing = document.getElementById(RAZORPAY_SCRIPT_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = RAZORPAY_SCRIPT_ID;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
    document.body.appendChild(script);
  });
}

export async function openRazorpaySubscriptionCheckout(
  checkout: SubscribeResponse,
  authHeaders: Record<string, string>,
  plan: BillablePlan
): Promise<BillablePlan> {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error('Razorpay checkout is unavailable.');
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: checkout.keyId,
      subscription_id: checkout.subscriptionId,
      name: checkout.name,
      description: checkout.description,
      prefill: checkout.prefill,
      theme: { color: '#6750A4' },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_subscription_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const verified = await verifySubscriptionPayment(authHeaders, {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_signature: response.razorpay_signature,
            plan,
          });
          resolve(verified.plan);
        } catch (error) {
          reject(error);
        }
      },
      modal: {
        ondismiss: () => reject(new Error('Checkout closed')),
      },
    });

    rzp.open();
  });
}
