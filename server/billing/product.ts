/** Isolates AssistlyDM billing from other products on a shared Razorpay merchant account. */
export const ASSISTLYDM_PRODUCT_SLUG = 'assistly-dm';

export type AssistlyDmSubscriptionNotes = {
  product: string;
  userId: string;
  googleUid: string;
  plan: string;
};

export function buildAssistlyDmSubscriptionNotes(input: {
  userId: string;
  googleUid: string;
  plan: string;
}): AssistlyDmSubscriptionNotes {
  return {
    product: ASSISTLYDM_PRODUCT_SLUG,
    userId: input.userId,
    googleUid: input.googleUid,
    plan: input.plan,
  };
}

export function isAssistlyDmProduct(notes: Record<string, unknown> | null | undefined): boolean {
  return notes?.product === ASSISTLYDM_PRODUCT_SLUG;
}

export function parseAssistlyDmNotes(
  notes: Record<string, unknown> | null | undefined
): AssistlyDmSubscriptionNotes | null {
  if (!isAssistlyDmProduct(notes)) return null;
  const userId = typeof notes?.userId === 'string' ? notes.userId : '';
  const googleUid = typeof notes?.googleUid === 'string' ? notes.googleUid : '';
  const plan = typeof notes?.plan === 'string' ? notes.plan : '';
  if (!userId || !googleUid || !plan) return null;
  return {
    product: ASSISTLYDM_PRODUCT_SLUG,
    userId,
    googleUid,
    plan,
  };
}
