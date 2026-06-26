import crypto from 'crypto';
import { Request, Response, Router } from 'express';
import Razorpay from 'razorpay';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import prisma from '../prisma/client';
import {
  assertAssistlyDmRazorpayPlan,
  assertAssistlyDmRazorpaySubscription,
  assertWebhookSubscriptionIsAssistlyDm,
  BillingIsolationError,
} from './razorpayGuards';
import { BILLING_PLANS, BillablePlan, isBillablePlan, normalizeStoredPlan } from './plans';
import {
  ASSISTLYDM_PRODUCT_SLUG,
  buildAssistlyDmSubscriptionNotes,
} from './product';

function envTrim(key: string): string {
  const raw = process.env[key];
  if (!raw) return '';
  return raw.replace(/^["']+|["']+$/g, '').trim();
}

function getRazorpay(): Razorpay | null {
  const keyId = envTrim('RAZORPAY_KEY_ID');
  const keySecret = envTrim('RAZORPAY_KEY_SECRET');
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

async function verifyFirebaseUser(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: sign in to manage billing.' });
    return null;
  }

  try {
    const decoded = await getAuth().verifyIdToken(authHeader.substring(7));
    return {
      uid: decoded.uid,
      email: decoded.email || '',
      name: decoded.name || decoded.email || 'AssistlyDM user',
    };
  } catch {
    res.status(401).json({ error: 'Unauthorized: invalid or expired session.' });
    return null;
  }
}

async function ensureDbUser(firebaseUser: { uid: string; email: string }) {
  const email = firebaseUser.email || `${firebaseUser.uid}@users.assistlydm.local`;
  return prisma.user.upsert({
    where: { googleUid: firebaseUser.uid },
    create: {
      googleUid: firebaseUser.uid,
      email,
    },
    update: { email },
  });
}

async function resolveRazorpayPlanId(razorpay: Razorpay, plan: BillablePlan): Promise<string> {
  const config = BILLING_PLANS[plan];
  const existing = envTrim(config.envPlanKey);
  if (existing) {
    await assertAssistlyDmRazorpayPlan(razorpay, existing, plan);
    return existing;
  }

  const created = await razorpay.plans.create({
    period: config.period,
    interval: config.interval,
    item: {
      name: config.name,
      amount: config.amountPaise,
      currency: 'INR',
      description: config.description,
    },
    notes: {
      product: ASSISTLYDM_PRODUCT_SLUG,
      plan,
    },
  });

  console.log(
    `[Billing] Created AssistlyDM Razorpay plan for ${plan}: ${created.id}. Add to .env as ${config.envPlanKey}=${created.id}`
  );
  return created.id;
}

async function getActivePlanForUser(userId: string): Promise<'Free' | BillablePlan> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      product: ASSISTLYDM_PRODUCT_SLUG,
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!subscription) return 'Free';
  return normalizeStoredPlan(subscription.plan);
}

async function persistAssistlyDmSubscription(input: {
  userId: string;
  googleUid: string;
  plan: BillablePlan;
  razorpaySubscriptionId: string;
}) {
  const existing = await prisma.subscription.findUnique({
    where: { razorpaySubscriptionId: input.razorpaySubscriptionId },
  });

  if (existing) {
    if (existing.product !== ASSISTLYDM_PRODUCT_SLUG) {
      throw new BillingIsolationError('Subscription ID is already linked to another product.');
    }
    return existing;
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId: input.userId,
      product: ASSISTLYDM_PRODUCT_SLUG,
      plan: input.plan,
      razorpaySubscriptionId: input.razorpaySubscriptionId,
    },
  });

  const db = getFirestore();
  await db.collection('users').doc(input.googleUid).set(
    {
      plan: input.plan,
      billingProduct: ASSISTLYDM_PRODUCT_SLUG,
    },
    { merge: true }
  );

  return subscription;
}

function billingErrorResponse(res: Response, error: unknown) {
  if (error instanceof BillingIsolationError) {
    return res.status(409).json({ error: error.message });
  }
  console.error('[Billing] unexpected error:', error);
  return res.status(500).json({ error: 'Billing request failed.' });
}

export function createBillingRouter(): Router {
  const router = Router();

  router.get('/status', async (req, res) => {
    const firebaseUser = await verifyFirebaseUser(req, res);
    if (!firebaseUser) return;

    try {
      const dbUser = await ensureDbUser(firebaseUser);
      const plan = await getActivePlanForUser(dbUser.id);
      const latest = await prisma.subscription.findFirst({
        where: {
          userId: dbUser.id,
          product: ASSISTLYDM_PRODUCT_SLUG,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({
        plan,
        product: ASSISTLYDM_PRODUCT_SLUG,
        subscriptionId: latest?.razorpaySubscriptionId || null,
      });
    } catch (error) {
      console.error('[Billing] status failed:', error);
      return res.status(500).json({ error: 'Failed to load billing status.' });
    }
  });

  router.get('/trial/status', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.json({ active: false });
    }

    let firebaseUser: { uid: string; email: string; name: string };
    try {
      const decoded = await getAuth().verifyIdToken(authHeader.substring(7));
      firebaseUser = {
        uid: decoded.uid,
        email: decoded.email || '',
        name: decoded.name || decoded.email || 'AssistlyDM user',
      };
    } catch {
      return res.json({ active: false });
    }

    try {
      const dbUser = await ensureDbUser(firebaseUser);
      const now = new Date();
      const trial = await prisma.trial.findFirst({
        where: {
          userId: dbUser.id,
          endsAt: { gt: now },
        },
        orderBy: { endsAt: 'desc' },
      });

      if (!trial) {
        return res.json({ active: false });
      }

      const daysRemaining = Math.max(
        0,
        Math.ceil((trial.endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );

      return res.json({
        active: true,
        daysRemaining,
        expiresAt: trial.endsAt.toISOString(),
      });
    } catch (error) {
      console.error('[Billing] trial status failed:', error);
      return res.json({ active: false });
    }
  });

  router.post('/subscribe', async (req, res) => {
    const firebaseUser = await verifyFirebaseUser(req, res);
    if (!firebaseUser) return;

    const plan = req.body?.plan as BillablePlan;
    if (!isBillablePlan(plan)) {
      return res.status(400).json({ error: 'Invalid plan. Choose Monthly or Yearly.' });
    }

    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(503).json({
        error: 'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.',
      });
    }

    try {
      const dbUser = await ensureDbUser(firebaseUser);
      const planConfig = BILLING_PLANS[plan];
      const planId = await resolveRazorpayPlanId(razorpay, plan);
      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        total_count: planConfig.subscriptionTotalCount,
        quantity: 1,
        customer_notify: 1,
        notes: buildAssistlyDmSubscriptionNotes({
          userId: dbUser.id,
          googleUid: firebaseUser.uid,
          plan,
        }),
      });

      return res.json({
        keyId: envTrim('RAZORPAY_KEY_ID'),
        subscriptionId: subscription.id,
        product: ASSISTLYDM_PRODUCT_SLUG,
        plan,
        amount: BILLING_PLANS[plan].amountPaise,
        currency: 'INR',
        name: 'AssistlyDM',
        description: BILLING_PLANS[plan].name,
        prefill: {
          email: firebaseUser.email,
          name: firebaseUser.name,
        },
      });
    } catch (error) {
      if (error instanceof BillingIsolationError) {
        return res.status(409).json({ error: error.message });
      }
      console.error('[Billing] subscribe failed:', error);
      return res.status(500).json({ error: 'Could not start checkout. Try again in a moment.' });
    }
  });

  router.post('/verify', async (req, res) => {
    const firebaseUser = await verifyFirebaseUser(req, res);
    if (!firebaseUser) return;

    const {
      razorpay_payment_id: paymentId,
      razorpay_subscription_id: subscriptionId,
      razorpay_signature: signature,
      plan,
    } = req.body || {};

    if (!paymentId || !subscriptionId || !signature || !isBillablePlan(plan)) {
      return res.status(400).json({ error: 'Missing payment verification fields.' });
    }

    const keySecret = envTrim('RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      return res.status(503).json({ error: 'Razorpay is not configured on the server.' });
    }

    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${paymentId}|${subscriptionId}`)
      .digest('hex');

    if (expected !== signature) {
      return res.status(400).json({ error: 'Payment verification failed.' });
    }

    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(503).json({ error: 'Razorpay is not configured on the server.' });
    }

    try {
      const dbUser = await ensureDbUser(firebaseUser);
      const remoteSubscription = await assertAssistlyDmRazorpaySubscription(
        razorpay,
        subscriptionId,
        plan
      );

      const notes = remoteSubscription.notes || {};
      if (notes.googleUid !== firebaseUser.uid) {
        return res.status(403).json({ error: 'This subscription belongs to a different account.' });
      }

      await persistAssistlyDmSubscription({
        userId: dbUser.id,
        googleUid: firebaseUser.uid,
        plan,
        razorpaySubscriptionId: subscriptionId,
      });

      return res.json({ success: true, plan, product: ASSISTLYDM_PRODUCT_SLUG });
    } catch (error) {
      return billingErrorResponse(res, error);
    }
  });

  return router;
}

export function verifyRazorpayWebhook(rawBody: Buffer, signature: string | undefined): boolean {
  const webhookSecret = envTrim('RAZORPAY_WEBHOOK_SECRET');
  if (!webhookSecret || !signature) return false;

  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  return expected === signature;
}

export async function handleRazorpayWebhookEvent(payload: any) {
  const event = payload?.event;
  const entity = payload?.payload?.subscription?.entity;
  if (!entity?.id) return;

  const notes = assertWebhookSubscriptionIsAssistlyDm(entity);
  if (!notes || !isBillablePlan(notes.plan)) return;

  const dbUser = await prisma.user.findUnique({ where: { googleUid: notes.googleUid } });
  if (!dbUser) {
    console.warn(`[Billing] AssistlyDM webhook ignored — user not found for ${notes.googleUid}`);
    return;
  }

  if (notes.userId !== dbUser.id) {
    console.warn(`[Billing] AssistlyDM webhook ignored — userId mismatch for ${entity.id}`);
    return;
  }

  const razorpay = getRazorpay();
  if (!razorpay) return;

  try {
    await assertAssistlyDmRazorpaySubscription(razorpay, entity.id, notes.plan);
  } catch (error) {
    console.warn(`[Billing] AssistlyDM webhook rejected for ${entity.id}:`, error);
    return;
  }

  if (event === 'subscription.activated' || event === 'subscription.charged') {
    await persistAssistlyDmSubscription({
      userId: dbUser.id,
      googleUid: notes.googleUid,
      plan: notes.plan,
      razorpaySubscriptionId: entity.id,
    });
  }
}
