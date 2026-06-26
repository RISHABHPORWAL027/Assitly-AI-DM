import type { LeadCaptureType } from '../types';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /\+?\d{1,4}?[-.\s]?\(?\d{3,4}?\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/;

export function isValidLeadEmail(messageText: string): boolean {
  return EMAIL_REGEX.test(messageText);
}

export function isValidLeadPhone(messageText: string): boolean {
  const digits = messageText.replace(/[^0-9]/g, '');
  return PHONE_REGEX.test(messageText) || digits.length >= 10;
}

export function extractLeadEmail(messageText: string): string | undefined {
  const match = messageText.match(EMAIL_REGEX);
  return match ? match[0].trim() : undefined;
}

export function extractLeadPhone(messageText: string): string | undefined {
  if (!isValidLeadPhone(messageText)) return undefined;
  const match = messageText.match(PHONE_REGEX);
  if (match) return match[0].trim();
  const digits = messageText.replace(/[^0-9]/g, '');
  if (digits.length >= 10) return messageText.trim();
  return undefined;
}

export function validateLeadCapture(
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

export const LEAD_CAPTURE_OPTIONS: Array<{
  value: LeadCaptureType;
  label: string;
  description: string;
}> = [
  { value: 'phone', label: 'Phone number', description: 'Validates a 10+ digit phone number' },
  { value: 'email', label: 'Email address', description: 'Validates a proper email format' },
  { value: 'either', label: 'Phone or email', description: 'Accept either phone or email' },
  { value: 'both', label: 'Phone and email', description: 'Both must be in the same reply' },
];

export function getDefaultLeadPrompt(captureType: LeadCaptureType): string {
  switch (captureType) {
    case 'phone':
      return 'Please reply with your phone number 📞';
    case 'email':
      return 'Please reply with your email address 📧';
    case 'both':
      return 'Please reply with your phone number and email address 📞📧';
    case 'either':
    default:
      return 'Please reply with your phone number or email address';
  }
}

export function getDefaultLeadInvalidMessage(captureType: LeadCaptureType): string {
  switch (captureType) {
    case 'phone':
      return 'Please provide a valid 10-digit phone number so we can reach you! 📞';
    case 'email':
      return 'Please provide a valid email address so we can reach you! 📧';
    case 'both':
      return 'Please provide both a valid phone number and email address in your reply.';
    case 'either':
    default:
      return 'Please provide a valid phone number or email address so we can reach you! 📞';
  }
}
