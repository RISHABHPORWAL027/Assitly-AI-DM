import type { FAQ } from '../types';
import { postJson, type AuthHeaders } from './apiClient';

export async function saveFAQ(headers: AuthHeaders, faq: FAQ): Promise<Response> {
  return postJson('/api/faqs/save', headers, faq);
}

export async function deleteFAQ(headers: AuthHeaders, id: string): Promise<Response> {
  return postJson('/api/faqs/delete', headers, { id });
}
