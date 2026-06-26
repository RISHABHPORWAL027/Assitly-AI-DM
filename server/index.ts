import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import {
  createBillingRouter,
  handleRazorpayWebhookEvent,
  verifyRazorpayWebhook,
} from './billing/routes';

dotenv.config();

// Initialize Firebase Admin
let db: Firestore | null = null;
let bucket: any = null;
try {
  const serviceAccountKeyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const storageBucketName = process.env.VITE_FIREBASE_STORAGE_BUCKET || 'assistlyai-dm.firebasestorage.app';

  if (serviceAccountKeyPath) {
    const resolvedPath = path.resolve(process.cwd(), serviceAccountKeyPath);
    if (fs.existsSync(resolvedPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
      if (getApps().length === 0) {
        initializeApp({
          credential: cert(serviceAccount),
          storageBucket: storageBucketName
        });
      }
      console.log('Firebase Admin initialized successfully using service account key at:', resolvedPath);
    } else {
      console.warn(`Firebase Service Account JSON file not found at: ${resolvedPath}. Falling back to default project configuration.`);
      if (getApps().length === 0) {
        initializeApp({
          projectId: process.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: storageBucketName
        });
      }
    }
  } else {
    if (getApps().length === 0) {
      initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: storageBucketName
      });
    }
  }
  db = getFirestore();
  try {
    bucket = getStorage().bucket();
  } catch (storageInitErr: any) {
    console.warn('Firebase Storage bucket initialization failed:', storageInitErr.message || storageInitErr);
    bucket = null;
  }
} catch (error) {
  console.error('Firebase Admin initialization failed:', error);
}

// Helper to upload buffer to Firebase Storage and return public URL
async function uploadBufferToFirebaseStorage(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  if (!bucket) {
    throw new Error('Firebase Storage is not initialized.');
  }
  const file = bucket.file(`uploads/${filename}`);
  await file.save(buffer, {
    metadata: {
      contentType: mimeType
    },
    public: true
  });
  
  const bucketName = process.env.VITE_FIREBASE_STORAGE_BUCKET || 'assistlyai-dm.firebasestorage.app';
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent('uploads/' + filename)}?alt=media`;
}

const IG_PROFILE_FIELDS = 'name,username,profile_picture_url,biography,website,followers_count,follows_count,media_count';

function envTrim(key: string): string {
  const raw = process.env[key];
  if (!raw) return '';
  return raw.replace(/^["']+|["']+$/g, '').trim();
}

function getTestIgAccountId(): string {
  return envTrim('TEST_IG_ACCOUNT_ID');
}

function getTestIgAccessToken(): string {
  return envTrim('TEST_IG_ACCESS_TOKEN');
}

async function fetchInstagramBusinessProfile(igAccountId: string, pageAccessToken: string) {
  try {
    const url = `https://graph.facebook.com/v21.0/${igAccountId}?fields=${IG_PROFILE_FIELDS}&access_token=${pageAccessToken}`;
    const profileResponse = await fetch(url);
    const profileData = await profileResponse.json();
    if (profileData?.error) {
      console.warn('[IG Profile] Graph API error for', igAccountId, ':', profileData.error);
      return { error: profileData.error };
    }
    return {
      name: profileData.name,
      username: profileData.username,
      profile_picture_url: profileData.profile_picture_url,
      biography: profileData.biography,
      website: profileData.website,
      followers_count: profileData.followers_count,
      follows_count: profileData.follows_count,
      media_count: profileData.media_count,
    };
  } catch (e) {
    console.error('[IG Profile] Fetch failed:', e);
    return { error: e };
  }
}

async function getPageAccessTokenForIgAccount(igAccountId: string): Promise<string> {
  const testId = getTestIgAccountId();
  const testToken = getTestIgAccessToken();
  const isTestAccount = testId && igAccountId === testId;

  // Firestore page token first — required for messaging; .env token may be a user token
  let pageAccessToken = '';
  if (db) {
    try {
      const configDoc = await db.collection('instagram_configs').doc(igAccountId).get();
      if (configDoc.exists) {
        pageAccessToken = (configDoc.data()?.pageAccessToken || '').trim();
      }
    } catch (e) {
      console.error(`[IG Config] Error fetching token for ${igAccountId}:`, e);
    }
  }
  if (!pageAccessToken && isTestAccount && testToken) {
    pageAccessToken = testToken;
  }
  return pageAccessToken;
}

function isValidFacebookPageId(pageId?: string): boolean {
  if (!pageId) return false;
  return /^\d+$/.test(pageId.trim());
}

function sanitizeFacebookPageId(pageId?: string): string | undefined {
  if (!isValidFacebookPageId(pageId)) return undefined;
  return pageId!.trim();
}

/** Resolve Facebook Page ID + Page Access Token (required for IG messaging). User tokens must go through /me/accounts. */
async function resolveMessagingCredentialsFromToken(
  token: string,
  targetIgAccountId?: string
): Promise<{ pageId: string; accessToken: string } | null> {
  if (!token?.trim()) return null;

  try {
    const accountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(token)}`
    );
    const accountsData = await accountsRes.json();
    if (accountsData?.data?.length) {
      const pages = accountsData.data;
      if (targetIgAccountId) {
        const matched = pages.find((p: any) => p.instagram_business_account?.id === targetIgAccountId);
        if (matched?.access_token && isValidFacebookPageId(matched.id)) {
          return { pageId: String(matched.id), accessToken: matched.access_token };
        }
      }
      const first = pages[0];
      if (first?.access_token && isValidFacebookPageId(first.id)) {
        return { pageId: String(first.id), accessToken: first.access_token };
      }
    }
    if (accountsData?.error) {
      console.warn('[IG Messaging] me/accounts failed:', accountsData.error.message || accountsData.error);
    }
  } catch (e) {
    console.warn('[IG Messaging] me/accounts lookup failed:', e);
  }

  // Token may already be a page access token — verify it is tied to a linked IG account
  try {
    const meRes = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id&access_token=${encodeURIComponent(token)}`
    );
    const meData = await meRes.json();
    if (meData?.id && isValidFacebookPageId(String(meData.id))) {
      const pageRes = await fetch(
        `https://graph.facebook.com/v21.0/${meData.id}?fields=instagram_business_account&access_token=${encodeURIComponent(token)}`
      );
      const pageData = await pageRes.json();
      if (pageData?.instagram_business_account?.id) {
        if (targetIgAccountId && pageData.instagram_business_account.id !== targetIgAccountId) {
          return null;
        }
        return { pageId: String(meData.id), accessToken: token };
      }
    }
  } catch (e) {
    console.warn('[IG Messaging] page token verification failed:', e);
  }

  return null;
}

async function healMessagingCredentialsInFirestore(
  igAccountId: string,
  pageId: string,
  accessToken: string
): Promise<void> {
  if (!db) return;
  try {
    await db.collection('instagram_configs').doc(igAccountId).set({
      pageId,
      pageAccessToken: accessToken,
    }, { merge: true });
    console.log(`[IG Messaging] Updated messaging credentials for ${igAccountId} (page ${pageId})`);
  } catch (e) {
    console.warn('[IG Messaging] Failed to save messaging credentials:', e);
  }
}

async function getMessagingCredentialsForIgAccount(igAccountId: string): Promise<{ pageId: string; accessToken: string } | null> {
  const testId = getTestIgAccountId();
  const testToken = getTestIgAccessToken();
  const isTestAccount = testId && igAccountId === testId;

  let storedToken: string | undefined;
  let storedPageId: string | undefined;

  if (db) {
    try {
      const configDoc = await db.collection('instagram_configs').doc(igAccountId).get();
      if (configDoc.exists) {
        const data = configDoc.data() || {};
        storedToken = (data.pageAccessToken || '').trim();
        storedPageId = sanitizeFacebookPageId(data.pageId);
        if (data.pageId && !storedPageId) {
          console.warn(`[IG Messaging] Ignoring invalid pageId "${data.pageId}" for ${igAccountId}`);
        }
      }
    } catch (e) {
      console.error(`[IG Messaging] Error loading credentials for ${igAccountId}:`, e);
    }
  }

  const tokenToResolve = storedToken || (isTestAccount ? testToken : undefined);
  if (!tokenToResolve) return null;

  const resolved = await resolveMessagingCredentialsFromToken(tokenToResolve, igAccountId);
  if (resolved) {
    const needsHeal =
      !storedPageId ||
      storedPageId !== resolved.pageId ||
      storedToken !== resolved.accessToken;
    if (needsHeal) {
      await healMessagingCredentialsInFirestore(igAccountId, resolved.pageId, resolved.accessToken);
    }
    return resolved;
  }

  if (storedToken && storedPageId) {
    return { pageId: storedPageId, accessToken: storedToken };
  }

  console.warn(`[IG Messaging] Could not resolve page credentials for ${igAccountId}. Reconnect via Meta OAuth in Settings.`);
  return null;
}

function getInstagramMessagesUrl(pageId?: string): string | null {
  const validPageId = sanitizeFacebookPageId(pageId);
  if (!validPageId) {
    return null;
  }
  return `https://graph.facebook.com/v21.0/${validPageId}/messages`;
}

/** Webhook recipient IDs are often Facebook Page IDs, not IG account IDs. */
async function getInstagramConfigByRecipientId(recipientId: string): Promise<{ config: Record<string, any>; igAccountId: string } | null> {
  if (!db) return null;
  try {
    const directDoc = await db.collection('instagram_configs').doc(recipientId).get();
    if (directDoc.exists) {
      const data = directDoc.data() || {};
      return { config: data, igAccountId: data.instagramAccountId || recipientId };
    }
    const snapshot = await db.collection('instagram_configs').where('pageId', '==', recipientId).limit(1).get();
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      return { config: data, igAccountId: data.instagramAccountId || recipientId };
    }
  } catch (e) {
    console.error('[IG Config] Lookup failed for recipient', recipientId, e);
  }
  return null;
}

type ParsedCommentWebhook = {
  commentId: string;
  commentText: string;
  senderId: string;
  senderUsername: string;
  mediaId: string | undefined;
};

/** IG media IDs in feed webhooks are often `{ig-user-id}_{media-id}`. */
function normalizeIgMediaId(id: string | undefined): string | undefined {
  if (!id || typeof id !== 'string') return undefined;
  const trimmed = id.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes('_')) {
    const parts = trimmed.split('_');
    return parts[parts.length - 1];
  }
  return trimmed;
}

function mediaIdMatchesAutomation(autoMediaId: string | undefined, webhookMediaId: string | undefined): boolean {
  if (!autoMediaId || autoMediaId === 'all') return true;
  if (!webhookMediaId) return true;
  const normAuto = normalizeIgMediaId(autoMediaId);
  const normWebhook = normalizeIgMediaId(webhookMediaId);
  return (
    autoMediaId === webhookMediaId ||
    (normAuto && normAuto === normWebhook) ||
    autoMediaId === normWebhook ||
    normAuto === webhookMediaId
  );
}

/** Normalize Instagram `comments` and Page `feed` (item=comment) webhook payloads. */
function parseCommentWebhookChange(change: { field?: string; value?: any }): ParsedCommentWebhook | null {
  const field = change.field;
  const value = change.value;
  if (!value || !field) return null;

  if (field === 'comments' || field === 'live_comments') {
    const commentId = value.id || value.comment_id;
    const commentText = (value.text || value.message || '').trim();
    const senderId = value.from?.id;
    const senderUsername =
      value.from?.username || value.from?.name || (senderId ? `ig_user_${senderId}` : 'unknown');
    const mediaId = value.media?.id || value.media_id || value.post_id;
    if (!commentId || !commentText || !senderId) return null;
    return { commentId, commentText, senderId, senderUsername, mediaId };
  }

  if (field === 'feed') {
    if (value.item !== 'comment') return null;
    if (value.verb && value.verb !== 'add') return null;
    const commentId = value.comment_id;
    const commentText = (value.message || '').trim();
    const senderId = value.from?.id;
    const senderUsername =
      value.from?.name || value.from?.username || (senderId ? `ig_user_${senderId}` : 'unknown');
    const mediaId = value.post_id || value.parent_id;
    if (!commentId || !commentText || !senderId) return null;
    return { commentId, commentText, senderId, senderUsername, mediaId };
  }

  return null;
}

/** Meta rejects `messaging_type` on private replies that use `comment_id` as recipient. */
function buildInstagramMessageBody(recipient: any, message: any, messagingType = 'RESPONSE'): Record<string, unknown> {
  const body: Record<string, unknown> = { recipient, message };
  if (!recipient?.comment_id) {
    body.messaging_type = messagingType;
  }
  return body;
}

/** Page `feed` is subscribed via API — it often does not appear in the Meta dashboard for Instagram-only apps. */
async function subscribeMetaWebhookFields(
  pageId: string,
  igAccountId: string,
  pageAccessToken: string
): Promise<{ pageSubResult: any; igSubResult: any }> {
  const pageSubUrl = `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?subscribed_fields=feed,messages,messaging_postbacks&access_token=${pageAccessToken}`;
  const pageSubResponse = await fetch(pageSubUrl, { method: 'POST' });
  const pageSubResult = await pageSubResponse.json();

  const igSubUrl = `https://graph.facebook.com/v21.0/${igAccountId}/subscribed_apps?subscribed_fields=comments,messages&access_token=${pageAccessToken}`;
  const igSubResponse = await fetch(igSubUrl, { method: 'POST' });
  const igSubResult = await igSubResponse.json();

  return { pageSubResult, igSubResult };
}

async function getMetaWebhookSubscriptionStatus(
  pageId: string,
  igAccountId: string,
  pageAccessToken: string
): Promise<{ pageStatus: any; igStatus: any }> {
  const pageStatusUrl = `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?access_token=${pageAccessToken}`;
  const pageStatusRes = await fetch(pageStatusUrl);
  const pageStatus = await pageStatusRes.json();

  const igStatusUrl = `https://graph.facebook.com/v21.0/${igAccountId}/subscribed_apps?access_token=${pageAccessToken}`;
  const igStatusRes = await fetch(igStatusUrl);
  const igStatus = await igStatusRes.json();

  return { pageStatus, igStatus };
}

function extractSubscribedFields(statusPayload: any): string[] {
  const entry = statusPayload?.data?.[0];
  if (!entry) return [];
  if (Array.isArray(entry.subscribed_fields)) return entry.subscribed_fields;
  return [];
}

/** Register app-level webhook subscriptions (required alongside dashboard field toggles). */
async function subscribeAppLevelWebhooks(callbackUrl: string): Promise<Record<string, unknown>> {
  const appId = envTrim('VITE_META_APP_ID');
  const appSecret = envTrim('META_APP_SECRET');
  const verifyToken = envTrim('INSTAGRAM_VERIFY_TOKEN');
  if (!appId || !appSecret || !verifyToken) {
    return { error: 'Missing VITE_META_APP_ID, META_APP_SECRET, or INSTAGRAM_VERIFY_TOKEN' };
  }

  const appAccessToken = `${appId}|${appSecret}`;
  const base = `https://graph.facebook.com/v21.0/${appId}/subscriptions`;

  const postSub = async (object: string, fields: string[]) => {
    const params = new URLSearchParams({
      object,
      callback_url: callbackUrl,
      verify_token: verifyToken,
      fields: fields.join(','),
      access_token: appAccessToken,
    });
    const res = await fetch(base, { method: 'POST', body: params });
    return await res.json();
  };

  const page = await postSub('page', ['feed', 'messages', 'messaging_postbacks']);
  const instagram = await postSub('instagram', ['comments', 'messages', 'messaging_postbacks']);
  return { page, instagram, callbackUrl };
}

const DEFAULT_LEAD_SUCCESS_MESSAGE = 'Thank you! Our team will reach out to you shortly. ✅';
const DEFAULT_LEAD_INVALID_MESSAGE = 'Please provide a valid phone number or email address so we can reach you! 📞';

type LeadCaptureType = 'phone' | 'email' | 'both' | 'either';

const LEAD_EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const LEAD_PHONE_REGEX = /\+?\d{1,4}?[-.\s]?\(?\d{3,4}?\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/;

function normalizeLeadCaptureType(value?: string): LeadCaptureType {
  if (value === 'phone' || value === 'email' || value === 'both' || value === 'either') return value;
  return 'either';
}

function isValidLeadPhone(messageText: string): boolean {
  const digits = messageText.replace(/[^0-9]/g, '');
  return LEAD_PHONE_REGEX.test(messageText) || digits.length >= 10;
}

function extractLeadEmail(messageText: string): string | undefined {
  const match = messageText.match(LEAD_EMAIL_REGEX);
  return match ? match[0].trim() : undefined;
}

function extractLeadPhone(messageText: string): string | undefined {
  if (!isValidLeadPhone(messageText)) return undefined;
  const match = messageText.match(LEAD_PHONE_REGEX);
  if (match) return match[0].trim();
  const digits = messageText.replace(/[^0-9]/g, '');
  if (digits.length >= 10) return messageText.trim();
  return undefined;
}

function validateLeadCapture(
  messageText: string,
  captureType: LeadCaptureType = 'either'
): { valid: boolean; email?: string; phone?: string } {
  const email = extractLeadEmail(messageText);
  const phone = extractLeadPhone(messageText);
  const hasEmail = !!email;
  const hasPhone = !!phone;

  switch (captureType) {
    case 'phone':
      return { valid: hasPhone, phone };
    case 'email':
      return { valid: hasEmail, email };
    case 'both':
      return { valid: hasEmail && hasPhone, email, phone };
    case 'either':
    default:
      return { valid: hasEmail || hasPhone, email, phone };
  }
}

function getDefaultLeadInvalidMessage(captureType: LeadCaptureType): string {
  switch (captureType) {
    case 'phone':
      return 'Please provide a valid 10-digit phone number so we can reach you! 📞';
    case 'email':
      return 'Please provide a valid email address so we can reach you! 📧';
    case 'both':
      return 'Please provide both a valid phone number and email address in your reply.';
    case 'either':
    default:
      return DEFAULT_LEAD_INVALID_MESSAGE;
  }
}

function getDefaultLeadPrompt(captureType: LeadCaptureType): string {
  switch (captureType) {
    case 'phone':
      return 'Please reply with your phone number 📞';
    case 'email':
      return 'Please reply with your email address 📧';
    case 'both':
      return 'Please reply with your phone number and email address 📞📧';
    case 'either':
    default:
      return 'Please reply with your phone number or email address.';
  }
}

async function getLeadFormBlockMessages(
  igAccountId: string,
  automationId: string,
  responseBlockId: string
): Promise<{ success: string; invalid: string; leadPrompt: string; leadCaptureType: LeadCaptureType }> {
  const defaults = {
    success: DEFAULT_LEAD_SUCCESS_MESSAGE,
    invalid: DEFAULT_LEAD_INVALID_MESSAGE,
    leadPrompt: 'Please reply with your phone number or email address.',
    leadCaptureType: 'either' as LeadCaptureType,
  };
  if (!db) return defaults;
  try {
    const autoDoc = await db.collection('instagram_automations').doc(igAccountId).get();
    if (!autoDoc.exists) return defaults;
    const automations = autoDoc.data()?.automations || [];
    const automation = automations.find((a: any) => a.id === automationId);
    const block = automation?.responses?.find((r: any) => r.id === responseBlockId);
    if (!block) return defaults;
    const leadCaptureType = normalizeLeadCaptureType(block.leadCaptureType);
    return {
      success: (block.leadSuccessMessage || '').trim() || DEFAULT_LEAD_SUCCESS_MESSAGE,
      invalid: (block.leadInvalidMessage || '').trim() || getDefaultLeadInvalidMessage(leadCaptureType),
      leadPrompt: (block.leadPrompt || '').trim() || getDefaultLeadPrompt(leadCaptureType),
      leadCaptureType,
    };
  } catch (e) {
    console.error('[Lead Form] Failed to load custom messages:', e);
    return defaults;
  }
}

async function sendInstagramDirectMessage(
  accessToken: string,
  recipientId: string,
  text: string,
  context = 'DM',
  pageId?: string
): Promise<boolean> {
  if (!accessToken || !text?.trim()) {
    console.error(`[${context}] Missing access token or message text`);
    return false;
  }
  try {
    const url = getInstagramMessagesUrl(pageId);
    if (!url) {
      console.error(`[${context}] Missing valid Facebook Page ID — cannot send IG message`);
      return false;
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: 'RESPONSE',
        message: { text },
      }),
    });
    const data = await res.json();
    if (data?.error) {
      console.error(`[${context}] Meta API error:`, data.error);
      return false;
    }
    console.log(`[${context}] Message sent to ${recipientId}`);
    return true;
  } catch (e) {
    console.error(`[${context}] Send failed:`, e);
    return false;
  }
}

function findMatchingDmAutomation(automations: any[], messageText: string) {
  const cleanMessageText = messageText.trim().toLowerCase();
  for (const auto of automations) {
    if (auto.status !== 'active' || auto.triggerType !== 'dm') continue;
    if (!Array.isArray(auto.keywords)) continue;
    const keywordMatches =
      auto.keywords.includes('*') ||
      auto.keywords.some((k: string) => {
        const cleanKey = k.trim().toLowerCase();
        if (auto.matchType === 'exact') return cleanMessageText === cleanKey;
        return cleanMessageText.includes(cleanKey);
      });
    if (keywordMatches) return auto;
  }
  return null;
}

async function clearLeadGateForUser(igAccountId: string, senderId: string) {
  if (!db) return;
  try {
    await db.collection('instagram_lead_gates').doc(igAccountId).update({
      [`pendingUsers.${senderId}`]: FieldValue.delete(),
    });
  } catch (e) {
    console.warn('[Lead Gate] Failed to clear pending state for', senderId, e);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigin = process.env.VITE_FRONTEND_URL || "*";
app.use(cors({ origin: allowedOrigin, credentials: true }));

app.post(
  '/api/billing/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const signature = req.headers['x-razorpay-signature'] as string | undefined;
      const rawBody = req.body as Buffer;
      if (!verifyRazorpayWebhook(rawBody, signature)) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
      const payload = JSON.parse(rawBody.toString('utf8'));
      await handleRazorpayWebhookEvent(payload);
      return res.json({ received: true });
    } catch (error) {
      console.error('[Billing] webhook error:', error);
      return res.status(500).json({ error: 'Webhook handling failed' });
    }
  }
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'public', 'uploads')));

// Log every webhook hit — if you comment and see nothing here, Meta is not reaching this server
app.use('/api/webhooks', (req, _res, next) => {
  console.log(
    `[Webhook ${new Date().toISOString()}] ${req.method} ${req.originalUrl} (ua: ${req.headers['user-agent'] || 'n/a'})`
  );
  next();
});

// --- API ROUTES ---

app.use('/api/billing', createBillingRouter());

// Security helper to extract and validate igAccountId
const checkAuthAndGetIgId = async (req: Request, res: Response): Promise<string | null> => {
  if (!db) {
    res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
    return null;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: missing authorization token' });
    return null;
  }
  const token = authHeader.substring(7);
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: invalid token' });
    return null;
  }

  // Extract requested Instagram Account ID from headers
  let igAccountId = (req.headers['x-instagram-account-id'] as string) || '';

  // Fallback: If X-Instagram-Account-Id is missing, check if the bearer token is a raw Instagram Account ID
  if (!igAccountId) {
    if (token.startsWith('1784') || token.startsWith('ig_') || token.startsWith('media_')) {
      igAccountId = token;
    }
  }

  if (!igAccountId) {
    res.status(400).json({ error: 'Bad Request: Missing target Instagram Account ID' });
    return null;
  }

  // 1. DEVELOPMENT BYPASS (Sandbox Mode)
  // Allows testing local sandbox data using the test ID in development
  const isDev = process.env.NODE_ENV !== 'production';
  const testId = getTestIgAccountId();
  if (isDev && testId && igAccountId === testId) {
    return igAccountId;
  }

  // 2. PRODUCTION FIREBASE TOKEN VERIFICATION
  try {
    let firebaseUid = '';
    let isFirebaseToken = false;
    
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      firebaseUid = decodedToken.uid;
      isFirebaseToken = true;
    } catch (e) {
      // Token is not a valid Firebase JWT
    }

    if (isFirebaseToken) {
      let configData: any = null;
      let configFound = false;

      // Try reading from Firestore only
      try {
        const configDoc = await db.collection('instagram_configs').doc(igAccountId).get();
        if (configDoc.exists) {
          configData = configDoc.data();
          configFound = true;
        }
      } catch (fsErr) {
        console.error(`Firestore read failed for igAccountId ${igAccountId}:`, fsErr);
      }

      if (!configFound || !configData) {
        res.status(401).json({ error: 'Unauthorized: account config not connected' });
        return null;
      }

      // Verify ownership
      if (configData?.userId !== firebaseUid) {
        if (isDev) {
          console.warn(`[Dev Warning] Firebase uid mismatch (config: ${configData?.userId} vs token: ${firebaseUid}) bypassed in development.`);
        } else {
          res.status(403).json({ error: 'Forbidden: You do not own this Instagram account connection' });
          return null;
        }
      }

      return igAccountId;
    }

    // If Firebase validation fails, fall back to checking if it is a sandbox ID (only in development)
    if (isDev && testId && igAccountId === testId && token === testId) {
      return igAccountId;
    }
    
    // In dev mode, we can also fallback to config existence checks
    if (isDev && (token.startsWith('1784') || token.startsWith('ig_') || token === igAccountId)) {
      try {
        const configDoc = await db.collection('instagram_configs').doc(igAccountId).get();
        if (configDoc.exists) return igAccountId;
      } catch (e) {}
    }

    res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
    return null;
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
    return null;
  }
};

// Business Profile sync
app.get('/api/business/profile', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;
  
  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  try {
    const profileDoc = await db.collection('business_profiles').doc(igAccountId).get();
    if (profileDoc.exists) {
      return res.status(200).json(profileDoc.data());
    }
  } catch (e) {
    console.error('Error fetching profile from Firestore:', e);
  }
  
  // Fallback default
  return res.status(200).json({});
});

app.post('/api/business/profile', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;

  const profileData = req.body;
  if (!profileData || typeof profileData !== 'object') {
    return res.status(400).json({ error: 'Expected business profile object' });
  }

  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  try {
    await db.collection('business_profiles').doc(igAccountId).set(profileData, { merge: true });
    res.status(200).json({ success: true, profile: profileData });
  } catch (e) {
    console.error('Error saving profile to Firestore:', e);
    res.status(500).json({ error: 'Failed to save business profile' });
  }
});

// Alias — same single-object save
app.post('/api/business/profile/save', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;

  const profileData = req.body;
  if (!profileData || typeof profileData !== 'object') {
    return res.status(400).json({ error: 'Expected business profile object' });
  }

  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  try {
    await db.collection('business_profiles').doc(igAccountId).set(profileData, { merge: true });
    return res.status(200).json({ success: true, profile: profileData });
  } catch (e) {
    console.error('Error saving profile to Firestore:', e);
    return res.status(500).json({ error: 'Failed to save business profile' });
  }
});

async function loadFaqsFromFirestore(igAccountId: string): Promise<any[]> {
  if (!db) return [];
  try {
    const faqsDoc = await db.collection('instagram_faqs').doc(igAccountId).get();
    if (faqsDoc.exists) {
      return faqsDoc.data()?.faqs || [];
    }
  } catch (e) {
    console.error('Error loading FAQs from Firestore:', e);
  }
  return [];
}

async function persistFaqsToFirestore(igAccountId: string, faqsList: any[]): Promise<void> {
  if (!db) throw new Error('Firebase Database is not initialized on the server.');
  await db.collection('instagram_faqs').doc(igAccountId).set({
    faqs: faqsList,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function upsertFaqInFirestore(igAccountId: string, faq: any): Promise<any> {
  const list = await loadFaqsFromFirestore(igAccountId);
  const index = list.findIndex((f: any) => f.id === faq.id);
  if (index >= 0) {
    list[index] = faq;
  } else {
    list.push(faq);
  }
  await persistFaqsToFirestore(igAccountId, list);
  return faq;
}

// FAQs sync
app.get('/api/faqs', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;
  
  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  try {
    const faqsDoc = await db.collection('instagram_faqs').doc(igAccountId).get();
    if (faqsDoc.exists) {
      return res.status(200).json(faqsDoc.data()?.faqs || []);
    }
  } catch (e) {
    console.error('Error fetching FAQs from Firestore:', e);
  }
  return res.status(200).json([]);
});

app.post('/api/faqs/save', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;

  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  const faq = req.body;
  if (!faq || typeof faq !== 'object' || !faq.id) {
    return res.status(400).json({ error: 'Expected FAQ object with id' });
  }

  try {
    const saved = await upsertFaqInFirestore(igAccountId, faq);
    return res.status(200).json({ success: true, faq: saved });
  } catch (e) {
    console.error('Error saving FAQ:', e);
    return res.status(500).json({ error: 'Failed to save FAQ' });
  }
});

app.post('/api/faqs/delete', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;

  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  const { id } = req.body || {};
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing FAQ id' });
  }

  try {
    const list = await loadFaqsFromFirestore(igAccountId);
    const filtered = list.filter((f: any) => f.id !== id);
    if (filtered.length === list.length) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    await persistFaqsToFirestore(igAccountId, filtered);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('Error deleting FAQ:', e);
    return res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

app.post('/api/faqs', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;

  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  const body = req.body;

  if (body && typeof body === 'object' && !Array.isArray(body) && body.id) {
    try {
      const saved = await upsertFaqInFirestore(igAccountId, body);
      return res.status(200).json({ success: true, faq: saved });
    } catch (e) {
      console.error('Error saving FAQ:', e);
      return res.status(500).json({ error: 'Failed to save FAQ' });
    }
  }

  const faqsList = body;
  if (!Array.isArray(faqsList)) {
    return res.status(400).json({ error: 'Expected FAQ object or array of FAQs' });
  }

  console.warn('[API] Bulk POST /api/faqs is deprecated — use POST /api/faqs/save per item');

  try {
    await persistFaqsToFirestore(igAccountId, faqsList);
    res.status(200).json({ success: true });
  } catch (e) {
    console.error('Error saving FAQs to Firestore:', e);
    res.status(500).json({ error: 'Failed to save FAQs' });
  }
});

async function loadContactsFromFirestore(igAccountId: string): Promise<any[]> {
  if (!db) return [];
  try {
    const doc = await db.collection('instagram_contacts').doc(igAccountId).get();
    if (doc.exists) {
      return doc.data()?.contacts || [];
    }
  } catch (e) {
    console.error('Error loading contacts from Firestore:', e);
  }
  return [];
}

async function persistContactsToFirestore(igAccountId: string, contactsList: any[]): Promise<void> {
  if (!db) throw new Error('Firebase Database is not initialized on the server.');
  await db.collection('instagram_contacts').doc(igAccountId).set({
    contacts: contactsList,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function upsertContactInFirestore(igAccountId: string, contact: any): Promise<any> {
  const list = await loadContactsFromFirestore(igAccountId);
  const index = list.findIndex((c: any) => c.id === contact.id);
  if (index >= 0) {
    list[index] = contact;
  } else {
    list.unshift(contact);
  }
  await persistContactsToFirestore(igAccountId, list);
  return contact;
}

// Contacts sync
app.get('/api/contacts', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;
  
  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  let contactsList: any[] = [];

  try {
    contactsList = await loadContactsFromFirestore(igAccountId);
  } catch (e) {
    console.error('Error fetching contacts from Firestore:', e);
  }

  if (req.query.stats === 'true') {
    const converted = contactsList.filter((c: any) => c.status === 'paid').length;
    const revenue = contactsList.reduce(
      (sum: number, c: any) => sum + (c.status === 'paid' ? (c.revenue || 0) : 0),
      0
    );
    return res.status(200).json({
      total: contactsList.length,
      converted,
      revenue,
    });
  }

  const search = (req.query.search as string || '').toLowerCase().trim();
  const source = req.query.source as string || 'all';

  let filtered = contactsList.filter((c: any) => {
    const matchesSource = source === 'all' || c.source === source;
    if (!search) return matchesSource;
    const haystack = [
      c.username,
      c.phone,
      c.email,
      c.source,
      c.status,
    ].filter(Boolean).join(' ').toLowerCase();
    return matchesSource && haystack.includes(search);
  });

  if (req.query.page || req.query.limit) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);
    return res.status(200).json({
      contacts: paginated,
      total: filtered.length,
      page,
      limit,
    });
  }

  return res.status(200).json(filtered);
});

app.post('/api/contacts/save', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;

  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  const contact = req.body;
  if (!contact || typeof contact !== 'object' || !contact.id) {
    return res.status(400).json({ error: 'Expected contact object with id' });
  }

  try {
    const saved = await upsertContactInFirestore(igAccountId, contact);
    return res.status(200).json({ success: true, contact: saved });
  } catch (e) {
    console.error('Error saving contact:', e);
    return res.status(500).json({ error: 'Failed to save contact' });
  }
});

app.post('/api/contacts/delete', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;

  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  const { id } = req.body || {};
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing contact id' });
  }

  try {
    const list = await loadContactsFromFirestore(igAccountId);
    const filtered = list.filter((c: any) => c.id !== id);
    if (filtered.length === list.length) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    await persistContactsToFirestore(igAccountId, filtered);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('Error deleting contact:', e);
    return res.status(500).json({ error: 'Failed to delete contact' });
  }
});

app.post('/api/contacts', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;

  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  const body = req.body;

  if (body && typeof body === 'object' && !Array.isArray(body) && body.id) {
    try {
      const saved = await upsertContactInFirestore(igAccountId, body);
      return res.status(200).json({ success: true, contact: saved });
    } catch (e) {
      console.error('Error saving contact:', e);
      return res.status(500).json({ error: 'Failed to save contact' });
    }
  }

  const contactsList = body;
  if (!Array.isArray(contactsList)) {
    return res.status(400).json({ error: 'Expected contact object or array of contacts' });
  }

  console.warn('[API] Bulk POST /api/contacts is deprecated — use POST /api/contacts/save per item');

  try {
    await persistContactsToFirestore(igAccountId, contactsList);
    res.status(200).json({ success: true });
  } catch (e) {
    console.error('Error saving contacts to Firestore:', e);
    res.status(500).json({ error: 'Failed to save contacts' });
  }
});

// Activities sync
app.get('/api/activities', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;
  
  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  try {
    const doc = await db.collection('instagram_activities').doc(igAccountId).get();
    if (doc.exists) {
      return res.status(200).json(doc.data()?.activities || []);
    }
  } catch (e) {
    console.error('Error fetching activities from Firestore:', e);
  }
  return res.status(200).json([]);
});

// Unified Automations
app.get('/api/automations', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;

  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  let automationsList: any[] = [];

  try {
    const doc = await db.collection('instagram_automations').doc(igAccountId).get();
    if (doc.exists) {
      automationsList = doc.data()?.automations || [];
    }
  } catch (e) {
    console.error('Error fetching automations from Firestore:', e);
  }

  // Helper to extract timestamp for sorting
  const getTimestamp = (auto: any) => {
    if (auto.id && auto.id.startsWith('auto_')) {
      const ts = parseInt(auto.id.replace('auto_', ''));
      if (!isNaN(ts)) return ts;
    }
    if (auto.createdAt) {
      const parts = auto.createdAt.split('/');
      if (parts.length === 3) {
        const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        return date.getTime();
      }
    }
    return 0;
  };

  // Sort newest first
  automationsList.sort((a: any, b: any) => getTimestamp(b) - getTimestamp(a));

  // Lightweight stats for dashboard cards (no full payload)
  if (req.query.stats === 'true') {
    return res.status(200).json({
      total: automationsList.length,
      active: automationsList.filter((a: any) => a.status === 'active').length,
      comment: automationsList.filter((a: any) => a.triggerType === 'comment').length,
      dm: automationsList.filter((a: any) => a.triggerType === 'dm').length,
    });
  }

  // Extract query filters
  const search = (req.query.search as string || '').toLowerCase();
  const type = req.query.type as string || 'all';
  const status = req.query.status as string || 'all';

  // Apply filters
  let filtered = automationsList.filter((auto: any) => {
    const matchesSearch = !search || 
      (auto.name && auto.name.toLowerCase().includes(search)) || 
      (auto.keywords && auto.keywords.some((k: string) => k.toLowerCase().includes(search))) ||
      (auto.caption && auto.caption.toLowerCase().includes(search)) ||
      (auto.replyText && auto.replyText.toLowerCase().includes(search));

    const matchesType = type === 'all' || auto.triggerType === type;
    const matchesStatus = status === 'all' || auto.status === status;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Check if pagination is requested
  if (req.query.page || req.query.limit) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 3;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedList = filtered.slice(startIndex, endIndex);

    return res.status(200).json({
      automations: paginatedList,
      total: filtered.length,
      page,
      limit
    });
  }

  return res.status(200).json(filtered);
});

// Helper function to process automations and upload base64 images to Firebase Storage
async function processAutomationsImagesAsync(automationsList: any[]): Promise<any[]> {
  const processedAutomations = [];
  const uploadsDir = path.join(process.cwd(), 'server', 'public', 'uploads');

  for (const automation of automationsList) {
    if (!automation.responses || !Array.isArray(automation.responses)) {
      processedAutomations.push(automation);
      continue;
    }

    const processedResponses = [];
    for (const response of automation.responses) {
      let updatedResponse = { ...response };

      // Handle Card response image
      if (response.type === 'card' && response.cardImage && response.cardImage.startsWith('data:image/')) {
        try {
          const matches = response.cardImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const ext = matches[1].split('/')[1] || 'png';
            const mimeType = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
            
            let imageUrl = '';
            try {
              console.log(`Uploading base64 card image ${filename} to Firebase Storage...`);
              imageUrl = await uploadBufferToFirebaseStorage(buffer, filename, mimeType);
              console.log(`Uploaded card image. Public URL: ${imageUrl}`);
            } catch (storageErr: any) {
              console.warn('Firebase Storage upload failed, falling back to local filesystem:', storageErr.message || storageErr);
              // Local filesystem fallback
              if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
              }
              const filepath = path.join(uploadsDir, filename);
              fs.writeFileSync(filepath, buffer);
              imageUrl = `/uploads/${filename}`;
            }
            
            updatedResponse.cardImage = imageUrl;
          }
        } catch (err) {
          console.error('Error processing base64 card image:', err);
        }
      }

      // Handle standard Image response image
      if (response.type === 'image' && response.imageUrl && response.imageUrl.startsWith('data:image/')) {
        try {
          const matches = response.imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const ext = matches[1].split('/')[1] || 'png';
            const mimeType = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
            
            let imageUrl = '';
            try {
              console.log(`Uploading base64 standard image ${filename} to Firebase Storage...`);
              imageUrl = await uploadBufferToFirebaseStorage(buffer, filename, mimeType);
              console.log(`Uploaded standard image. Public URL: ${imageUrl}`);
            } catch (storageErr: any) {
              console.warn('Firebase Storage upload failed, falling back to local filesystem:', storageErr.message || storageErr);
              // Local filesystem fallback
              if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
              }
              const filepath = path.join(uploadsDir, filename);
              fs.writeFileSync(filepath, buffer);
              imageUrl = `/uploads/${filename}`;
            }
            
            updatedResponse.imageUrl = imageUrl;
          }
        } catch (err) {
          console.error('Error processing base64 image response:', err);
        }
      }

      processedResponses.push(updatedResponse);
    }

    processedAutomations.push({
      ...automation,
      responses: processedResponses
    });
  }
  return processedAutomations;
}

async function loadAutomationsFromFirestore(igAccountId: string): Promise<any[]> {
  if (!db) return [];
  try {
    const doc = await db.collection('instagram_automations').doc(igAccountId).get();
    if (doc.exists) {
      return doc.data()?.automations || [];
    }
  } catch (e) {
    console.error('Error loading automations from Firestore:', e);
  }
  return [];
}

async function persistAutomationsToFirestore(igAccountId: string, automationsList: any[]): Promise<void> {
  if (!db) throw new Error('Firebase Database is not initialized on the server.');
  await db.collection('instagram_automations').doc(igAccountId).set({
    automations: automationsList,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function upsertAutomationInFirestore(igAccountId: string, automation: any): Promise<any> {
  const processedList = await processAutomationsImagesAsync([automation]);
  const saved = processedList[0];
  const list = await loadAutomationsFromFirestore(igAccountId);
  const index = list.findIndex((a: any) => a.id === saved.id);
  if (index >= 0) {
    list[index] = saved;
  } else {
    list.push(saved);
  }
  await persistAutomationsToFirestore(igAccountId, list);
  return saved;
}

// Save or update a single automation (preferred — small payload)
app.post('/api/automations/save', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;

  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  const automation = req.body;
  if (!automation || typeof automation !== 'object' || !automation.id) {
    return res.status(400).json({ error: 'Expected automation object with id' });
  }

  try {
    const saved = await upsertAutomationInFirestore(igAccountId, automation);
    return res.status(200).json({ success: true, automation: saved });
  } catch (e) {
    console.error('Error saving automation:', e);
    return res.status(500).json({ error: 'Failed to save automation' });
  }
});

// Delete a single automation by id
app.post('/api/automations/delete', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;

  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  const { id } = req.body || {};
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing automation id' });
  }

  try {
    const list = await loadAutomationsFromFirestore(igAccountId);
    const filtered = list.filter((a: any) => a.id !== id);
    if (filtered.length === list.length) {
      return res.status(404).json({ error: 'Automation not found' });
    }
    await persistAutomationsToFirestore(igAccountId, filtered);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('Error deleting automation:', e);
    return res.status(500).json({ error: 'Failed to delete automation' });
  }
});

app.post('/api/automations', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;

  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  const body = req.body;

  // Single-object upsert (same as /save)
  if (body && typeof body === 'object' && !Array.isArray(body) && body.id) {
    try {
      const saved = await upsertAutomationInFirestore(igAccountId, body);
      return res.status(200).json({ success: true, automation: saved });
    } catch (e) {
      console.error('Error saving automation:', e);
      return res.status(500).json({ error: 'Failed to save automation' });
    }
  }

  let automationsList = body;
  if (!Array.isArray(automationsList)) {
    return res.status(400).json({ error: 'Expected an automation object or array of automations' });
  }

  console.warn('[API] Bulk POST /api/automations is deprecated — use POST /api/automations/save per item');

  try {
    automationsList = await processAutomationsImagesAsync(automationsList);
  } catch (err) {
    console.error('Failed to process automations images:', err);
  }

  try {
    await persistAutomationsToFirestore(igAccountId, automationsList);
  } catch (e) {
    console.error('Error saving automations to Firestore:', e);
    return res.status(500).json({ error: 'Failed to save automations' });
  }

  res.status(200).json({ success: true });
});

app.get('/api/instagram/media', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;

  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  const pageAccessToken = await getPageAccessTokenForIgAccount(igAccountId);

  if (pageAccessToken) {
    try {
      const url = `https://graph.facebook.com/v21.0/${igAccountId}/media?fields=id,media_type,media_url,thumbnail_url,caption,permalink&limit=15&access_token=${pageAccessToken}`;
      const mediaResponse = await fetch(url);
      const mediaData = await mediaResponse.json();
      
      if (mediaData.data && Array.isArray(mediaData.data)) {
        return res.status(200).json(mediaData.data);
      } else {
        console.warn(`[IG Media] API returned error or no data for ${igAccountId}:`, mediaData);
        console.warn('[IG Media] Unexpected response data for', igAccountId, ':', mediaData);
        if (db) {
          try {
            await db.collection('instagram_errors').add({
              route: '/api/instagram/media',
              igAccountId,
              error: 'Invalid media data returned',
              response: JSON.stringify(mediaData),
              timestamp: FieldValue.serverTimestamp()
            });
          } catch (logErr) {
            console.error('[IG Media] Failed to log error to Firestore:', logErr);
          }
        }
        return res.status(500).json({ error: 'Failed to fetch Instagram media' });
      }
    } catch (e) {
      console.error('[IG Media] Error fetching real media: ', e);
      if (db) {
        try {
          await db.collection('instagram_errors').add({
            route: '/api/instagram/media',
            igAccountId,
            error: e?.message || String(e),
            timestamp: FieldValue.serverTimestamp()
          });
        } catch (logErr) {
          console.error('[IG Media] Failed to log error to Firestore:', logErr);
        }
      }
      return res.status(500).json({ error: 'Error fetching Instagram media' });
    }
  }
});

app.get('/api/instagram/profile', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;

  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  const pageAccessToken = await getPageAccessTokenForIgAccount(igAccountId);
  console.log('[IG Profile] Using page access token:', pageAccessToken ? `${pageAccessToken.slice(0, 10)}...` : 'none');

  if (!pageAccessToken) {
    console.error('[IG Profile] No page access token for account', igAccountId);
    if (db) {
      try {
        await db.collection('instagram_errors').add({
          route: '/api/instagram/profile',
          igAccountId,
          error: 'Missing page access token',
          timestamp: FieldValue.serverTimestamp()
        });
      } catch (logErr) {
        console.error('[IG Profile] Failed to log error to Firestore:', logErr);
      }
    }
    return res.status(500).json({ error: 'Instagram profile access token missing. Connect via Meta OAuth first.' });
  }

  const profile = await fetchInstagramBusinessProfile(igAccountId, pageAccessToken);
  if (profile.error) {
    const metaError = (profile.error as any)?.message || 'Failed to fetch Instagram profile from Meta';
    const testToken = getTestIgAccessToken();
    const testId = getTestIgAccountId();
    // Retry with .env token if Firestore token was stale (production / non-sandbox accounts)
    if (
      testToken &&
      testToken !== pageAccessToken &&
      testId === igAccountId &&
      (metaError.includes('access token') || metaError.includes('OAuth'))
    ) {
      console.warn('[IG Profile] Retrying credential resolution from TEST_IG_ACCESS_TOKEN');
      const resolved = await resolveMessagingCredentialsFromToken(testToken, igAccountId);
      const retryToken = resolved?.accessToken || testToken;
      const retryProfile = await fetchInstagramBusinessProfile(igAccountId, retryToken);
      if (!retryProfile.error) {
        if (db && resolved) {
          try {
            await db.collection('instagram_configs').doc(igAccountId).set({
              pageId: resolved.pageId,
              pageAccessToken: resolved.accessToken,
              profileUpdatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
          } catch (e) {
            console.warn('[IG Profile] Failed to refresh token on config doc:', e);
          }
        }
        return res.status(200).json(retryProfile);
      }
    }
    console.warn('[IG Profile] API error for', igAccountId, ':', profile.error);
    if (db) {
      try {
        await db.collection('instagram_errors').add({
          route: '/api/instagram/profile',
          igAccountId,
          error: metaError,
          response: JSON.stringify(profile.error),
          timestamp: FieldValue.serverTimestamp()
        });
      } catch (logErr) {
        console.error('[IG Profile] Failed to log error to Firestore:', logErr);
      }
    }
    return res.status(500).json({ error: metaError });
  }

  // Persist latest profile on the connection config for quick reads
  if (db) {
    try {
      await db.collection('instagram_configs').doc(igAccountId).set({
        instagramUsername: profile.username,
        instagramName: profile.name,
        profilePictureUrl: profile.profile_picture_url,
        biography: profile.biography,
        website: profile.website,
        followersCount: profile.followers_count,
        followsCount: profile.follows_count,
        mediaCount: profile.media_count,
        profileUpdatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('[IG Profile] Failed to cache profile on config doc:', e);
    }
  }

  return res.status(200).json(profile);
});

// GET Sandbox config — fetches real IG profile from Meta when test credentials exist
app.get('/api/auth/sandbox-config', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(200).json({ enabled: false });
  }
  const testId = getTestIgAccountId();
  const testToken = getTestIgAccessToken();
  if (!testId) {
    return res.status(200).json({ enabled: false });
  }

  let igAccountName = '';
  let username = '';
  let profilePictureUrl = '';

  if (testToken) {
    const profile = await fetchInstagramBusinessProfile(testId, testToken);
    if (!profile.error) {
      igAccountName = profile.name || '';
      username = profile.username || '';
      profilePictureUrl = profile.profile_picture_url || '';
    } else {
      console.warn('[Sandbox] Could not load real IG profile — check TEST_IG_ACCESS_TOKEN expiry:', profile.error);
    }
  }

  return res.status(200).json({
    enabled: true,
    igAccountId: testId,
    igAccountName,
    username,
    profilePictureUrl,
  });
});

// Meta Authentication
app.post('/api/auth/meta', async (req: Request, res: Response) => {
  const { accessToken, userId } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: 'Missing short-lived access token' });
  }

  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  let authenticatedUserId = userId || null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      authenticatedUserId = decodedToken.uid;
      console.log(`[MetaAuth] Verified Firebase uid: ${authenticatedUserId}`);
    } catch (e) {
      console.warn('[MetaAuth] Provided authorization token was invalid, falling back to body userId:', e);
    }
  }

  try {
    const appId = process.env.VITE_META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    // 1. Exchange short-lived token for long-lived user token
    const exchangeUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${accessToken}`;
    
    const exchangeResponse = await fetch(exchangeUrl);
    const exchangeData = await exchangeResponse.json();

    if (exchangeData.error) {
      console.error('Meta Token Exchange Error:', exchangeData.error);
      return res.status(400).json({ error: 'Failed to exchange token' });
    }

    const longLivedUserToken = exchangeData.access_token;
    
    // 2. Fetch all Pages this user has access to
    const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedUserToken}`;
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      console.error('Error fetching pages:', pagesData.error);
      return res.status(400).json({ error: 'Failed to fetch pages' });
    }

    const discoveredConfigs: any[] = [];

    if (pagesData.data && pagesData.data.length > 0) {
      for (const page of pagesData.data) {
        const pageId = page.id;
        const pageName = page.name;
        const pageAccessToken = page.access_token;

        // 3. For each page, query for linked Instagram Business Account ID
        const igUrl = `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`;
        const igResponse = await fetch(igUrl);
        const igData = await igResponse.json();

        if (igData.instagram_business_account && igData.instagram_business_account.id) {
          const igAccountId = igData.instagram_business_account.id;

          const igProfile = await fetchInstagramBusinessProfile(igAccountId, pageAccessToken);

          // 4. Save this page connection info to Firestore
          const configContent = {
            pageId,
            pageName,
            pageAccessToken,
            instagramAccountId: igAccountId,
            instagramUsername: igProfile.error ? undefined : igProfile.username,
            instagramName: igProfile.error ? undefined : igProfile.name,
            profilePictureUrl: igProfile.error ? undefined : igProfile.profile_picture_url,
            biography: igProfile.error ? undefined : igProfile.biography,
            website: igProfile.error ? undefined : igProfile.website,
            followersCount: igProfile.error ? undefined : igProfile.followers_count,
            followsCount: igProfile.error ? undefined : igProfile.follows_count,
            mediaCount: igProfile.error ? undefined : igProfile.media_count,
            userId: authenticatedUserId,
            updatedAt: FieldValue.serverTimestamp()
          };

          if (igProfile.error) {
            console.warn(`[MetaAuth] Could not fetch IG profile for ${igAccountId}:`, igProfile.error);
          }

          try {
            await db.collection('instagram_configs').doc(igAccountId).set(configContent, { merge: true });
            console.log(`Saved dynamic page config to Firestore for Instagram account ${igAccountId} (${pageName})`);
          } catch (fsErr) {
            console.error(`Error saving config to Firestore for Instagram account ${igAccountId}:`, fsErr);
          }

          // 5. Subscribe Page (feed comments) and IG account (comments field) to webhooks
          const { pageSubResult, igSubResult } = await subscribeMetaWebhookFields(
            pageId,
            igAccountId,
            pageAccessToken
          );
          console.log(`Auto-subscribed Page ${pageName} (${pageId}) Result:`, pageSubResult);
          console.log(`Auto-subscribed IG account ${igAccountId} Result:`, igSubResult);

          discoveredConfigs.push(configContent);
        }
      }
    }

    // Save one default fallback TEST_IG_ACCESS_TOKEN and TEST_IG_ACCOUNT_ID for compatibility only in development environment
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev && discoveredConfigs.length > 0) {
      const defaultIgAccount = discoveredConfigs[0].instagramAccountId;
      const defaultToken = discoveredConfigs[0].pageAccessToken;

      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        try {
          let envContent = fs.readFileSync(envPath, 'utf8');
          if (envContent.includes('TEST_IG_ACCESS_TOKEN=')) {
            envContent = envContent.replace(/TEST_IG_ACCESS_TOKEN=".+"/, `TEST_IG_ACCESS_TOKEN="${defaultToken}"`);
          }
          if (envContent.includes('TEST_IG_ACCOUNT_ID=')) {
            envContent = envContent.replace(/TEST_IG_ACCOUNT_ID=".+"/, `TEST_IG_ACCOUNT_ID="${defaultIgAccount}"`);
          }
          fs.writeFileSync(envPath, envContent);
        } catch (e) {
          console.warn('Failed to write default test credentials to .env:', e);
        }
      }
    }

    console.log(`✅ Successfully completed Meta connection workflow! Discovered ${discoveredConfigs.length} pages.`);
    res.status(200).json({ success: true, message: 'Onboarding complete', configs: discoveredConfigs });

  } catch (error) {
    console.error('Auth endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify / re-apply Page + IG webhook subscriptions (Page `feed` is API-only for many Instagram apps)
app.post('/api/meta/sync-webhooks', async (req: Request, res: Response) => {
  const igAccountId = await checkAuthAndGetIgId(req, res);
  if (!igAccountId) return;

  if (!db) {
    return res.status(500).json({ error: 'Firebase Database is not initialized on the server.' });
  }

  try {
    const configDoc = await db.collection('instagram_configs').doc(igAccountId).get();
    if (!configDoc.exists) {
      return res.status(404).json({ error: 'Instagram account config not found. Reconnect Instagram first.' });
    }

    const config = configDoc.data() || {};
    const pageId = sanitizeFacebookPageId(config.pageId);
    const pageAccessToken = config.pageAccessToken;

    if (!pageId || !pageAccessToken) {
      return res.status(400).json({ error: 'Missing page credentials. Reconnect Instagram.' });
    }

    const { pageSubResult, igSubResult } = await subscribeMetaWebhookFields(
      pageId,
      igAccountId,
      pageAccessToken
    );
    const { pageStatus, igStatus } = await getMetaWebhookSubscriptionStatus(
      pageId,
      igAccountId,
      pageAccessToken
    );

    const pageFields = extractSubscribedFields(pageStatus);
    const igFields = extractSubscribedFields(igStatus);

    const callbackUrl =
      (typeof req.body?.callbackUrl === 'string' && req.body.callbackUrl.trim()) ||
      envTrim('WEBHOOK_CALLBACK_URL');
    let appSubscriptions: Record<string, unknown> | null = null;
    if (callbackUrl) {
      appSubscriptions = await subscribeAppLevelWebhooks(callbackUrl);
      console.log('[Meta] App-level webhook subscription result:', appSubscriptions);
    }

    return res.status(200).json({
      success: true,
      pageId,
      igAccountId,
      pageFields,
      igFields,
      pageHasFeed: pageFields.includes('feed'),
      igHasComments: igFields.includes('comments'),
      subscribeResults: { page: pageSubResult, ig: igSubResult },
      appSubscriptions,
      callbackUrl: callbackUrl || null,
      note:
        'Page feed webhooks are registered via API — they may not appear as a "Page" row in Meta App Dashboard for Instagram Business apps.',
    });
  } catch (e) {
    console.error('[Meta] sync-webhooks failed:', e);
    return res.status(500).json({ error: 'Failed to sync webhook subscriptions' });
  }
});

async function handleIncomingCommentWebhook(
  parsed: ParsedCommentWebhook,
  recipientId: string,
  baseUrl: string
): Promise<void> {
  const { commentId, commentText, senderId, senderUsername, mediaId } = parsed;

  if (senderId === recipientId) return;

  console.log(
    `Received comment webhook! Comment: "${commentText}" on Media: ${mediaId} from ${senderUsername} (recipient: ${recipientId})`
  );

  let accessToken = '';
  let igAccountId = '';
  let pageIdForMessaging = '';
  let automations: any[] = [];
  let configFound = false;

  if (db) {
    try {
      const resolved = await getInstagramConfigByRecipientId(recipientId);
      if (resolved) {
        const configData = resolved.config;
        accessToken = configData?.pageAccessToken || '';
        pageIdForMessaging = sanitizeFacebookPageId(configData?.pageId) || '';
        igAccountId = resolved.igAccountId;
        configFound = true;

        const autoDoc = await db.collection('instagram_automations').doc(igAccountId).get();
        if (autoDoc.exists) {
          automations = autoDoc.data()?.automations || [];
        }
      }
    } catch (e) {
      console.error('Error loading config for comment:', e);
    }
  }

  if (!configFound && process.env.TEST_IG_ACCOUNT_ID) {
    const testResolved = await getInstagramConfigByRecipientId(process.env.TEST_IG_ACCOUNT_ID);
    const testPageId = testResolved?.config?.pageId;
    if (
      recipientId === process.env.TEST_IG_ACCOUNT_ID ||
      (testPageId && recipientId === testPageId)
    ) {
      accessToken = testResolved?.config?.pageAccessToken || getTestIgAccessToken();
      pageIdForMessaging =
        sanitizeFacebookPageId(testResolved?.config?.pageId) || sanitizeFacebookPageId(envTrim('TEST_PAGE_ID')) || '';
      igAccountId = process.env.TEST_IG_ACCOUNT_ID;
      configFound = true;

      if (db) {
        try {
          const autoDoc = await db.collection('instagram_automations').doc(igAccountId).get();
          if (autoDoc.exists) {
            automations = autoDoc.data()?.automations || [];
          }
        } catch (e) {
          /* ignore */
        }
      }
    }
  }

  if (!configFound || !accessToken) {
    console.warn(`[Comment] No config found for recipient ${recipientId}`);
    return;
  }

  const matchedAuto = automations.find((auto: any) => {
    if (auto.status !== 'active' || auto.triggerType !== 'comment') return false;
    const mediaMatches = mediaIdMatchesAutomation(auto.mediaId, mediaId);

    const cleanCommentText = commentText.trim().toLowerCase();
    const keywordMatches =
      Array.isArray(auto.keywords) &&
      (auto.keywords.includes('*') ||
        auto.keywords.some((k: string) => {
          const cleanKey = k.trim().toLowerCase();
          if (auto.matchType === 'exact') {
            return cleanCommentText === cleanKey;
          }
          return cleanCommentText.includes(cleanKey);
        }));

    return mediaMatches && keywordMatches;
  });

  if (!matchedAuto) {
    const activeCommentAutos = automations.filter(
      (a) => a.triggerType === 'comment' && a.status === 'active'
    );
    for (const auto of activeCommentAutos) {
      const mediaOk = mediaIdMatchesAutomation(auto.mediaId, mediaId);
      const cleanCommentText = commentText.trim().toLowerCase();
      const keywordOk =
        Array.isArray(auto.keywords) &&
        (auto.keywords.includes('*') ||
          auto.keywords.some((k: string) => {
            const cleanKey = k.trim().toLowerCase();
            if (auto.matchType === 'exact') return cleanCommentText === cleanKey;
            return cleanCommentText.includes(cleanKey);
          }));
      console.log(
        `[Comment] Automation "${auto.name}" — media: ${mediaOk ? 'ok' : `no (automation media: ${auto.mediaId || 'all'}, webhook media: ${mediaId})`}, keywords: ${keywordOk ? 'ok' : `no (need ${auto.keywords?.includes('*') ? 'any comment' : auto.keywords?.join('|')}, got "${commentText}")`}`
      );
    }
    console.log(
      `[Comment] No matching automation for "${commentText}" (media: ${mediaId}, active comment automations: ${activeCommentAutos.length})`
    );
    return;
  }

  console.log(`Matched comment automation: "${matchedAuto.name}"!`);

  try {
    let follows = true;
    const hasFollowBlock =
      Array.isArray(matchedAuto.responses) && matchedAuto.responses.some((r: any) => r.type === 'follow');
    const followGateEnabled = matchedAuto.enableFollowGate || hasFollowBlock;

    if (followGateEnabled) {
      if (senderId && senderId.includes('mock_nonfollower')) {
        follows = false;
      } else if (senderId && senderId.includes('mock_follower')) {
        follows = true;
      } else {
        try {
          const followRes = await fetch(
            `https://graph.facebook.com/v21.0/${senderId}?fields=is_user_follow_business&access_token=${accessToken}`
          );
          const followData = await followRes.json();
          if (followData.is_user_follow_business !== undefined) {
            follows = followData.is_user_follow_business;
          }
        } catch (err) {
          console.error('Error checking follow status from Meta:', err);
        }
      }
    }

    try {
      let replyMessage = 'Got it, check your DM! 📩';
      if (Array.isArray(matchedAuto.commentReplies) && matchedAuto.commentReplies.length > 0) {
        const validReplies = matchedAuto.commentReplies.filter((r: any) => typeof r === 'string' && r.trim() !== '');
        if (validReplies.length > 0) {
          const randomIndex = Math.floor(Math.random() * validReplies.length);
          replyMessage = validReplies[randomIndex];
        }
      }

      const publicReplyUrl = `https://graph.facebook.com/v21.0/${commentId}/replies`;
      const publicReplyRes = await fetch(publicReplyUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: replyMessage }),
      });
      const publicReplyData = await publicReplyRes.json();
      if (publicReplyData?.error) {
        console.error(`[Comment] Public reply API error on ${commentId}:`, publicReplyData.error);
      } else {
        console.log(`Sent public comment reply on ${commentId}. Result:`, publicReplyData);
      }
    } catch (publicErr) {
      console.error('Error posting public comment reply:', publicErr);
    }

    await sendAutomationResponses(
      { comment_id: commentId },
      senderId,
      accessToken,
      matchedAuto,
      follows,
      igAccountId,
      commentId,
      baseUrl,
      pageIdForMessaging
    );

    if (db) {
      try {
        let activities: any[] = [];
        const actsDoc = await db.collection('instagram_activities').doc(igAccountId).get();
        if (actsDoc.exists) {
          activities = actsDoc.data()?.activities || [];
        }

        const newActivity = {
          id: 'act_' + Date.now(),
          username: senderUsername,
          timestamp: 'Just now',
          action:
            matchedAuto.enableFollowGate && !follows
              ? `Commented "${commentText}" on Reel (Follow Gate Prompt Sent)`
              : `Commented "${commentText}" on Reel (DM Delivered)`,
          type: 'chat_bubble' as const,
        };

        activities.unshift(newActivity);
        if (activities.length > 50) activities = activities.slice(0, 50);

        await db.collection('instagram_activities').doc(igAccountId).set(
          {
            activities: activities,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } catch (e) {
        console.error('Error saving activities to Firestore:', e);
      }
    }
  } catch (err) {
    console.error('Error handling comment-to-dm reply: ', err);
  }
}

// Instagram Webhooks
app.get('/api/webhooks/ping', (_req: Request, res: Response) => {
  console.log('[Webhook] ping OK — server is reachable');
  res.status(200).json({
    ok: true,
    message: 'Webhook endpoint is live. Meta callback should POST to /api/webhooks/instagram',
    verifyTokenConfigured: !!envTrim('INSTAGRAM_VERIFY_TOKEN'),
    webhookCallbackUrl: envTrim('WEBHOOK_CALLBACK_URL') || null,
  });
});

app.get('/api/webhooks/instagram', (req: Request, res: Response) => {
  // Webhook verification
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});
app.post('/api/webhooks/instagram', async (req: Request, res: Response) => {
  const body = req.body;
  const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const baseUrl = `${protocol}://${host}`;

  console.log('\n--- RAW WEBHOOK PAYLOAD RECEIVED ---');
  console.log(JSON.stringify(body, null, 2));
  console.log('------------------------------------\n');

  // Ack Meta immediately so they keep delivering events
  res.status(200).send('EVENT_RECEIVED');

  if (!body || typeof body !== 'object') {
    console.warn('[Webhook] Empty or invalid body');
    return;
  }

  if (body.object !== 'instagram' && body.object !== 'page') {
    console.warn('[Webhook] Unhandled object type:', body.object);
    return;
  }

  if (!Array.isArray(body.entry)) {
    console.warn('[Webhook] Missing entry array on object', body.object);
    return;
  }

  // Iterate over each entry - there may be multiple if batched
  for (const entry of body.entry) {
    // --- HANDLE INCOMING COMMENTS (Comment-to-DM) ---
    if (entry.changes) {
      for (const change of entry.changes) {
        const parsed = parseCommentWebhookChange(change);
        if (!parsed) {
          console.log(
            `[Comment] Skipped change field="${change.field}" item="${change.value?.item || ''}" verb="${change.value?.verb || ''}"`
          );
          continue;
        }
        const recipientId = entry.id;
        if (!recipientId) continue;
        await handleIncomingCommentWebhook(parsed, recipientId, baseUrl);
      }
    }

    // --- HANDLE INCOMING DIRECT MESSAGES (DM Automation & Follow Gate Verification) ---
    if (entry.messaging) {
        for (const webhookEvent of entry.messaging) {
          const senderId = webhookEvent.sender?.id;
          const recipientId = webhookEvent.recipient?.id;
 
          // Skip if the message was sent by our own bot account or is missing recipient
          if (!recipientId || !senderId) continue;
          if (senderId === recipientId) {
            continue;
          }

          const postbackPayload = webhookEvent.postback?.payload;
          const incomingText = webhookEvent.message?.text || '';

          // Intercept SEND_MESSAGE button actions
          if (postbackPayload && postbackPayload.startsWith('SEND_MESSAGE:')) {
            const msgToReply = postbackPayload.substring('SEND_MESSAGE:'.length);
            console.log(`Intercepted SEND_MESSAGE button click from ${senderId}. Text: "${msgToReply}"`);
            
            try {
              let accessToken = '';
              let pageIdForMessaging = '';
              const resolved = await getInstagramConfigByRecipientId(recipientId);
              if (resolved) {
                accessToken = resolved.config?.pageAccessToken || '';
                pageIdForMessaging = sanitizeFacebookPageId(resolved.config?.pageId) || '';
              }
              if (!accessToken && getTestIgAccountId()) {
                const testId = getTestIgAccountId();
                const testResolved = await getInstagramConfigByRecipientId(testId);
                const testPageId = testResolved?.config?.pageId;
                if (recipientId === testId || (testPageId && recipientId === testPageId)) {
                  accessToken = testResolved?.config?.pageAccessToken || getTestIgAccessToken();
                  pageIdForMessaging = sanitizeFacebookPageId(testResolved?.config?.pageId) || sanitizeFacebookPageId(envTrim('TEST_PAGE_ID')) || '';
                }
              }

              if (accessToken) {
                await sendInstagramDirectMessage(
                  accessToken,
                  senderId,
                  msgToReply,
                  'SEND_MESSAGE postback',
                  pageIdForMessaging
                );
              }
            } catch (err) {
              console.error('Error handling SEND_MESSAGE postback:', err);
            }
            continue;
          }

          // Fallback message text is either message body or general postback payload
          const messageText = incomingText || postbackPayload;
 
          // If it's a valid text/postback message
          if (messageText) {
            let accessToken = '';
            let igAccountId = '';
            let pageIdForMessaging = '';
            let automations: any[] = [];
            let configFound = false;

            if (db) {
              try {
                const resolved = await getInstagramConfigByRecipientId(recipientId);
                if (resolved) {
                  const configData = resolved.config;
                  accessToken = configData?.pageAccessToken || '';
                  pageIdForMessaging = sanitizeFacebookPageId(configData?.pageId) || '';
                  igAccountId = resolved.igAccountId;
                  configFound = true;

                  const autoDoc = await db.collection('instagram_automations').doc(igAccountId).get();
                  if (autoDoc.exists) {
                    automations = autoDoc.data()?.automations || [];
                  }
                }
              } catch (e) {
                console.error('Error fetching config/automations from Firestore in webhook:', e);
              }
            }

            // Fallback to Test Config in .env (recipient may be Page ID or IG account ID)
            if (!configFound && getTestIgAccountId()) {
              const testId = getTestIgAccountId();
              const testResolved = await getInstagramConfigByRecipientId(testId);
              const testPageId = testResolved?.config?.pageId;
              if (recipientId === testId || (testPageId && recipientId === testPageId)) {
                accessToken = testResolved?.config?.pageAccessToken || getTestIgAccessToken();
                  pageIdForMessaging = sanitizeFacebookPageId(testResolved?.config?.pageId) || sanitizeFacebookPageId(envTrim('TEST_PAGE_ID')) || '';
                igAccountId = testId;
                configFound = true;

                if (db) {
                  try {
                    const autoDoc = await db.collection('instagram_automations').doc(igAccountId).get();
                    if (autoDoc.exists) {
                      automations = autoDoc.data()?.automations || [];
                    }
                  } catch (e) {}
                }
              }
            }

            // Use Firestore page credentials for messaging (never override with .env user token)
            if (igAccountId) {
              const messagingCreds = await getMessagingCredentialsForIgAccount(igAccountId);
              if (messagingCreds) {
                accessToken = messagingCreds.accessToken;
                if (messagingCreds.pageId) {
                  pageIdForMessaging = messagingCreds.pageId;
                } else {
                  pageIdForMessaging = '';
                }
              }
            }

            if (configFound && accessToken) {
              try {
                // Fetch profile username
                let username = `ig_user_${senderId}`;
                try {
                  const profileRes = await fetch(`https://graph.facebook.com/v21.0/${senderId}?fields=username&access_token=${accessToken}`);
                  const profileData = await profileRes.json();
                  if (profileData.username) {
                    username = profileData.username;
                  }
                } catch (err) {}

                // check if user has a pending follow gate
                let pendingGate: any = null;
                if (db) {
                  try {
                    const gatesDoc = await db.collection('instagram_follow_gates').doc(igAccountId).get();
                    if (gatesDoc.exists) {
                      const pendingUsers = gatesDoc.data()?.pendingUsers || {};
                      pendingGate = pendingUsers[senderId];
                    }
                  } catch (e) {}
                }

                // check if user has a pending lead gate
                let pendingLeadGate: any = null;
                if (db) {
                  try {
                    const leadGatesDoc = await db.collection('instagram_lead_gates').doc(igAccountId).get();
                    if (leadGatesDoc.exists) {
                      const pendingUsers = leadGatesDoc.data()?.pendingUsers || {};
                      pendingLeadGate = pendingUsers[senderId];
                    }
                  } catch (e) {}
                }

                const lowerText = messageText.toLowerCase();
                const isQuickReplyDone = webhookEvent.message?.quick_reply?.payload === 'done';
                const isConfirmText = lowerText.includes('done') || lowerText.includes('follow') || lowerText.includes('yes');

                if (pendingGate && (isQuickReplyDone || isConfirmText)) {
                  console.log(`Pending follow-gate user ${senderId} requested follow check.`);
                  
                  let follows = false;
                  if (senderId && (senderId.includes('mock_follower') || senderId.includes('becomes_follower'))) {
                    follows = true;
                  } else {
                    try {
                      const followRes = await fetch(`https://graph.facebook.com/v21.0/${senderId}?fields=is_user_follow_business&access_token=${accessToken}`);
                      const followData = await followRes.json();
                      if (followData.is_user_follow_business !== undefined) {
                        follows = followData.is_user_follow_business;
                      }
                    } catch (err) {}
                  }

                  let automationsList: any[] = [];
                  if (db) {
                    try {
                      const autoDoc = await db.collection('instagram_automations').doc(igAccountId).get();
                      if (autoDoc.exists) {
                        automationsList = autoDoc.data()?.automations || [];
                      }
                    } catch (e) {}
                  }

                  const matchedAuto = automationsList.find((a: any) => a.id === pendingGate.automationId);
                  if (matchedAuto) {
                    if (follows) {
                      // remove from pending gates
                      if (db) {
                        try {
                          await db.collection('instagram_follow_gates').doc(igAccountId).update({
                            [`pendingUsers.${senderId}`]: FieldValue.delete()
                          });
                        } catch (e) {}
                      }

                      // Log activity
                      if (db) {
                        try {
                          let activities: any[] = [];
                          const actsDoc = await db.collection('instagram_activities').doc(igAccountId).get();
                          if (actsDoc.exists) {
                            activities = actsDoc.data()?.activities || [];
                          }

                          const newActivity = {
                            id: 'act_' + Date.now(),
                            username: username,
                            timestamp: 'Just now',
                            action: `Follow Verified successfully (DM Delivered)`,
                            type: 'person' as const
                          };
                          activities.unshift(newActivity);
                          if (activities.length > 50) activities = activities.slice(0, 50);

                          await db.collection('instagram_activities').doc(igAccountId).set({
                            activities: activities,
                            updatedAt: FieldValue.serverTimestamp()
                          }, { merge: true });
                        } catch (e) {}
                      }
                    }

                    // Dispatch sequence responses (handling follow gate check automatically)
                    await sendAutomationResponses(
                      { id: senderId },
                      senderId,
                      accessToken,
                      matchedAuto,
                      follows,
                      igAccountId,
                      pendingGate.commentId || undefined,
                      baseUrl,
                      pageIdForMessaging
                    );

                    continue; // skip other rules
                  }
                }

                if (pendingLeadGate) {
                  console.log(`Pending lead gate user ${senderId} sent input: "${messageText}"`);

                  const leadMessages = await getLeadFormBlockMessages(
                    igAccountId,
                    pendingLeadGate.automationId,
                    pendingLeadGate.responseBlockId
                  );
                  const validation = validateLeadCapture(messageText, leadMessages.leadCaptureType);

                  // If user sends a keyword instead of lead info, run that automation
                  if (!validation.valid) {
                    const keywordAuto = findMatchingDmAutomation(automations, messageText);
                    if (keywordAuto) {
                      console.log(`[Lead Gate] Keyword "${messageText}" matched automation "${keywordAuto.name}" — exiting lead capture`);
                      await clearLeadGateForUser(igAccountId, senderId);
                      let follows = true;
                      const hasFollowBlock = Array.isArray(keywordAuto.responses) && keywordAuto.responses.some((r: any) => r.type === 'follow');
                      const followGateEnabled = keywordAuto.enableFollowGate || hasFollowBlock;
                      if (followGateEnabled) {
                        try {
                          const followRes = await fetch(`https://graph.facebook.com/v21.0/${senderId}?fields=is_user_follow_business&access_token=${accessToken}`);
                          const followData = await followRes.json();
                          if (followData.is_user_follow_business !== undefined) {
                            follows = followData.is_user_follow_business;
                          }
                        } catch (err) {}
                      }
                      await sendAutomationResponses(
                        { id: senderId },
                        senderId,
                        accessToken,
                        keywordAuto,
                        follows,
                        igAccountId,
                        undefined,
                        baseUrl,
                        pageIdForMessaging
                      );
                      continue;
                    }
                  }

                  if (validation.valid) {
                    await clearLeadGateForUser(igAccountId, senderId);

                    // 2. Load contacts
                    let contactsList: any[] = [];
                    if (db) {
                      try {
                        const contactsDoc = await db.collection('instagram_contacts').doc(igAccountId).get();
                        if (contactsDoc.exists) {
                          contactsList = contactsDoc.data()?.contacts || [];
                        }
                      } catch (e) {}
                    }

                    // 3. Save contact
                    const emailVal = validation.email || '';
                    const phoneVal = validation.phone || '';
                    let contact = contactsList.find((c: any) => c.username === username);
                    if (contact) {
                      if (emailVal) contact.email = emailVal;
                      if (phoneVal) contact.phone = phoneVal;
                    } else {
                      contact = {
                        id: 'lead_' + Date.now(),
                        username: username,
                        phone: phoneVal,
                        email: emailVal,
                        dateAdded: 'Today',
                        source: 'Automation',
                        status: 'pending',
                        revenue: 0
                      };
                      contactsList.push(contact);
                    }

                    if (db) {
                      try {
                        await db.collection('instagram_contacts').doc(igAccountId).set({
                          contacts: contactsList,
                          updatedAt: FieldValue.serverTimestamp()
                        }, { merge: true });
                      } catch (e) {}
                    }

                    // Log activity
                    if (db) {
                      try {
                        let activities: any[] = [];
                        const actsDoc = await db.collection('instagram_activities').doc(igAccountId).get();
                        if (actsDoc.exists) {
                          activities = actsDoc.data()?.activities || [];
                        }

                        const newActivity = {
                          id: 'act_' + Date.now(),
                          username: username,
                          timestamp: 'Just now',
                          action: `Lead Captured successfully (CRM Updated)`,
                          type: 'person' as const
                        };
                        activities.unshift(newActivity);
                        if (activities.length > 50) activities = activities.slice(0, 50);

                        await db.collection('instagram_activities').doc(igAccountId).set({
                          activities: activities,
                          updatedAt: FieldValue.serverTimestamp()
                        }, { merge: true });
                      } catch (e) {}
                    }

                    await sendInstagramDirectMessage(
                      accessToken,
                      senderId,
                      leadMessages.success,
                      'Lead Gate Success',
                      pageIdForMessaging
                    );

                    continue; // Skip standard message matching
                  } else {
                    const retryText = leadMessages.invalid || getDefaultLeadInvalidMessage(leadMessages.leadCaptureType);
                    const sent = await sendInstagramDirectMessage(
                      accessToken,
                      senderId,
                      retryText,
                      'Lead Gate Invalid',
                      pageIdForMessaging
                    );
                    if (!sent) {
                      const messagingCreds = await getMessagingCredentialsForIgAccount(igAccountId);
                      if (messagingCreds && messagingCreds.accessToken !== accessToken) {
                        await sendInstagramDirectMessage(
                          messagingCreds.accessToken,
                          senderId,
                          retryText,
                          'Lead Gate Invalid (retry creds)',
                          messagingCreds.pageId
                        );
                      }
                    }
                    continue; // Skip standard message matching
                  }
                }

                // Determine auto-reply based on user's message
                let replyText = "Thanks for your message! Our team will get back to you soon. 🤖";

                // Check for matches
                let matchFound = false;
                let matchedRule: any = null;
                for (const auto of automations) {
                  if (auto.status === 'active' && auto.triggerType === 'dm') {
                    const cleanMessageText = messageText.trim().toLowerCase();
                    if (Array.isArray(auto.keywords) && (
                      auto.keywords.includes('*') || 
                      auto.keywords.some((k: string) => {
                        const cleanKey = k.trim().toLowerCase();
                        if (auto.matchType === 'exact') {
                          return cleanMessageText === cleanKey;
                        } else {
                          return cleanMessageText.includes(cleanKey);
                        }
                      })
                    )) {
                      matchedRule = auto;
                      matchFound = true;
                      break;
                    }
                  }
                }

                if (!matchFound) {
                  if (lowerText.includes('hey') || lowerText.includes('hello') || lowerText.includes('hi')) {
                    replyText = "hey hello! Welcome to AssistlyDM. How can I help you automate your business today? 🚀";
                  }
                }

                // 2. Lead Capture Check (email / phone number extraction from free-form messages)
                const ambientLead = validateLeadCapture(messageText, 'either');
                let leadCaptured = false;
                let activityAction = '';
                let activityType = 'chat_bubble';

                if (ambientLead.valid) {
                  leadCaptured = true;
                  const emailVal = ambientLead.email || '';
                  const phoneVal = ambientLead.phone || '';
                  const detailStr = [
                    emailVal ? `email (${emailVal})` : '',
                    phoneVal ? `phone (${phoneVal})` : ''
                  ].filter(Boolean).join(' and ');
                  
                  activityAction = `Left ${detailStr} via lead capture prompt`;
                  activityType = phoneVal ? 'call' : 'person';

                  // Load and update contacts
                  if (db) {
                    try {
                      let contacts: any[] = [];
                      const contactsDoc = await db.collection('instagram_contacts').doc(igAccountId).get();
                      if (contactsDoc.exists) {
                        contacts = contactsDoc.data()?.contacts || [];
                      }

                      let contact = contacts.find((c: any) => c.username === username);
                      if (contact) {
                        if (emailVal) contact.email = emailVal;
                        if (phoneVal) contact.phone = phoneVal;
                      } else {
                        contact = {
                          id: 'lead_' + Date.now(),
                          username: username,
                          phone: phoneVal,
                          email: emailVal,
                          dateAdded: 'Today',
                          source: 'Automation',
                          status: 'pending',
                          revenue: 0
                        };
                        contacts.push(contact);
                      }

                      await db.collection('instagram_contacts').doc(igAccountId).set({
                        contacts: contacts,
                        updatedAt: FieldValue.serverTimestamp()
                      }, { merge: true });
                    } catch (e) {
                      console.error('Failed to read contacts from Firestore:', e);
                    }
                  }
                } else {
                  if (matchFound) {
                    activityAction = `Triggered automated response for keywords: "${matchedRule.keywords.join(', ')}"`;
                    activityType = 'chat_bubble';
                  } else {
                    activityAction = `Sent message: "${messageText.length > 50 ? messageText.substring(0, 47) + '...' : messageText}"`;
                    activityType = 'flag';
                  }
                }

                // 3. Log Activity
                if (db) {
                  try {
                    let activities: any[] = [];
                    const actsDoc = await db.collection('instagram_activities').doc(igAccountId).get();
                    if (actsDoc.exists) {
                      activities = actsDoc.data()?.activities || [];
                    }

                    const newActivity = {
                      id: 'act_' + Date.now(),
                      username: username,
                      timestamp: 'Just now',
                      action: activityAction,
                      type: activityType
                    };

                    activities.unshift(newActivity);
                    if (activities.length > 50) activities = activities.slice(0, 50);

                    await db.collection('instagram_activities').doc(igAccountId).set({
                      activities: activities,
                      updatedAt: FieldValue.serverTimestamp()
                    }, { merge: true });
                  } catch (e) {}
                }

                // 4. Send the auto-reply back
                if (matchFound) {
                  let follows = true;
                  const hasFollowBlock = Array.isArray(matchedRule.responses) && matchedRule.responses.some((r: any) => r.type === 'follow');
                  const followGateEnabled = matchedRule.enableFollowGate || hasFollowBlock;

                  if (followGateEnabled) {
                    if (senderId && senderId.includes('mock_nonfollower')) {
                      follows = false;
                    } else if (senderId && senderId.includes('mock_follower')) {
                      follows = true;
                    } else {
                      try {
                        const followRes = await fetch(`https://graph.facebook.com/v21.0/${senderId}?fields=is_user_follow_business&access_token=${accessToken}`);
                        const followData = await followRes.json();
                        if (followData.is_user_follow_business !== undefined) {
                          follows = followData.is_user_follow_business;
                        }
                      } catch (err) {}
                    }
                  }

                  await sendAutomationResponses(
                    { id: senderId },
                    senderId,
                    accessToken,
                    matchedRule,
                    follows,
                    igAccountId,
                    undefined,
                    baseUrl,
                    pageIdForMessaging
                  );
                } else {
                  await sendInstagramDirectMessage(
                    accessToken,
                    senderId,
                    replyText,
                    'Default DM reply',
                    pageIdForMessaging
                  );
                }
              } catch (error) {
                console.error('Error handling reply:', error);
              }
            } else {
              console.warn(`No configuration found for recipient account ID ${recipientId}. Skipping reply.`);
            }
          }
        }
      }
    }
});

async function sendResponseBlock(recipient: any, accessToken: string, response: any, baseUrl?: string, pageId?: string) {
  const url = getInstagramMessagesUrl(pageId);
  if (!url) {
    console.error(`[Response Block ${response.type}] Missing valid Facebook Page ID — cannot send`);
    return;
  }
  let messagePayload: any = {};

  if (response.type === 'text') {
    if (response.buttonText && response.buttonValue) {
      messagePayload = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: response.text || '',
            buttons: [
              {
                type: response.buttonType === 'link' ? 'web_url' : 'postback',
                url: response.buttonType === 'link' ? response.buttonValue : undefined,
                payload: response.buttonType === 'postback' ? `SEND_MESSAGE:${response.buttonValue}` : undefined,
                title: response.buttonText
              }
            ]
          }
        }
      };
    } else {
      messagePayload = { text: response.text || '' };
    }
  } else if (response.type === 'image') {
    let imageUrl = response.imageUrl || '';
    if (imageUrl.startsWith('/uploads/') && baseUrl) {
      imageUrl = `${baseUrl}${imageUrl}`;
    }
    messagePayload = {
      attachment: {
        type: 'image',
        payload: {
          url: imageUrl
        }
      }
    };
  } else if (response.type === 'card') {
    const button: any = {};
    if (response.cardButtonText && response.cardButtonValue) {
      button.type = response.cardButtonType === 'link' ? 'web_url' : 'postback';
      button.title = response.cardButtonText;
      if (response.cardButtonType === 'link') {
        button.url = response.cardButtonValue;
      } else {
        button.payload = `SEND_MESSAGE:${response.cardButtonValue}`;
      }
    }

    let cardImage = response.cardImage || undefined;
    if (cardImage && cardImage.startsWith('/uploads/') && baseUrl) {
      cardImage = `${baseUrl}${cardImage}`;
    }

    messagePayload = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [
            {
              title: response.cardHeader || '',
              subtitle: response.cardDescription || '',
              image_url: cardImage,
              buttons: button.title ? [button] : undefined
            }
          ]
        }
      }
    };
  } else if (response.type === 'follow') {
    messagePayload = {
      text: response.followGateText || "Please follow our account first! 📲",
      quick_replies: [
        {
          content_type: 'text',
          title: response.followGateButtonText || "Started following",
          payload: 'done'
        }
      ]
    };
  } else if (response.type === 'lead_form') {
    messagePayload = { text: response.leadPrompt || '' };
  }

  const payload = JSON.stringify(buildInstagramMessageBody(recipient, messagePayload));

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: payload,
    });
    const data = await res.json();
    if (data?.error) {
      console.error(`[Response Block ${response.type}] Meta API error:`, data.error);
    } else {
      console.log('Sent response block', response.type, 'to', recipient, 'result:', data);
    }
  } catch (err) {
    console.error('Error sending response block:', err);
  }
}

async function sendAutomationResponses(
  recipient: { id?: string; comment_id?: string },
  senderId: string,
  accessToken: string,
  matchedAuto: any,
  follows: boolean,
  igAccountId: string,
  commentId?: string,
  baseUrl?: string,
  pageId?: string
) {
  const followGateEnabled = matchedAuto.enableFollowGate || (Array.isArray(matchedAuto.responses) && matchedAuto.responses.some((r: any) => r.type === 'follow'));
  
  if (followGateEnabled && !follows) {
    const followBlock = Array.isArray(matchedAuto.responses) ? matchedAuto.responses.find((r: any) => r.type === 'follow') : null;
    const promptText = followBlock?.followGateText || matchedAuto.notFollowingMessage || "Thanks! I noticed you aren't following yet. Follow us and reply 'done' here to get the link! 📲";
    const buttonText = followBlock?.followGateButtonText || "Started following";

    if (db) {
      try {
        await db.collection('instagram_follow_gates').doc(igAccountId).set({
          pendingUsers: {
            [senderId]: {
              automationId: matchedAuto.id,
              commentId: commentId || null,
              createdAt: new Date().toISOString()
            }
          }
        }, { merge: true });
      } catch (e) {
        console.error('Error saving follow gate state to Firestore:', e);
      }
    }

    const messagePayload: any = {
      text: promptText
    };

    // Instagram API does not support quick replies when replying privately to a comment (using comment_id as recipient)
    if (!recipient.comment_id) {
      messagePayload.quick_replies = [
        {
          content_type: 'text',
          title: buttonText,
          payload: 'done'
        }
      ];
    }

    const url = getInstagramMessagesUrl(pageId);
    if (!url) {
      console.error('[Follow Gate] Missing valid Facebook Page ID — cannot send');
      return;
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(buildInstagramMessageBody(recipient, messagePayload)),
      });
      const data = await res.json();
      if (data?.error) {
        console.error('[Follow Gate] Meta API error:', data.error);
      } else {
        console.log('Sent follow-gate message, result:', data);
      }
    } catch (err) {
      console.error('Error sending follow-gate message:', err);
    }
    return;
  }

  let blocksToSend = [];
  if (Array.isArray(matchedAuto.responses) && matchedAuto.responses.length > 0) {
    blocksToSend = matchedAuto.responses.filter((r: any) => r.type !== 'follow');
  } else {
    blocksToSend = [{ type: 'text', text: matchedAuto.replyText }];
  }

  for (let i = 0; i < blocksToSend.length; i++) {
    const block = blocksToSend[i];
    const currentRecipient = (i === 0) ? recipient : { id: senderId };
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    await sendResponseBlock(currentRecipient, accessToken, block, baseUrl, pageId);

    // If the block is a lead form, set a pending lead gate state in Firestore and break to wait for response
    if (block.type === 'lead_form') {
      if (db) {
        try {
          await db.collection('instagram_lead_gates').doc(igAccountId).set({
            pendingUsers: {
              [senderId]: {
                automationId: matchedAuto.id,
                responseBlockId: block.id,
                createdAt: new Date().toISOString()
              }
            }
          }, { merge: true });
        } catch (e) {
          console.error('Error saving lead gate state to Firestore:', e);
        }
      }

      console.log(`Lead form block sent. Established pending lead gate for ${senderId}. Pausing sequence.`);
      break;
    }
  }
}

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
