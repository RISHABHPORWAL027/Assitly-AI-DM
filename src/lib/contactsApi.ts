import type { Contact } from '../types';
import { postJson, type AuthHeaders } from './apiClient';

export interface ContactStats {
  total: number;
  converted: number;
  revenue: number;
}

export async function saveContact(headers: AuthHeaders, contact: Contact): Promise<Response> {
  return postJson('/api/contacts/save', headers, contact);
}

export async function deleteContact(headers: AuthHeaders, id: string): Promise<Response> {
  return postJson('/api/contacts/delete', headers, { id });
}

export async function fetchContactStats(headers: AuthHeaders): Promise<ContactStats | null> {
  const res = await fetch('/api/contacts?stats=true', { headers });
  if (!res.ok) return null;
  const data = await res.json();
  if (typeof data?.total !== 'number') return null;
  return data as ContactStats;
}
