import type { Automation } from '../types';
import { postJson, type AuthHeaders } from './apiClient';

export async function saveAutomation(
  headers: AuthHeaders,
  automation: Automation
): Promise<Response> {
  return postJson('/api/automations/save', headers, automation);
}

export async function deleteAutomation(
  headers: AuthHeaders,
  id: string
): Promise<Response> {
  return postJson('/api/automations/delete', headers, { id });
}

export interface AutomationStats {
  total: number;
  active: number;
  comment: number;
  dm: number;
}

export async function fetchAutomationStats(
  headers: AuthHeaders
): Promise<AutomationStats | null> {
  const res = await fetch('/api/automations?stats=true', { headers });
  if (!res.ok) return null;
  const data = await res.json();
  if (typeof data?.total !== 'number') return null;
  return data as AutomationStats;
}
