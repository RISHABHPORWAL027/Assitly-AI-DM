import type { Automation } from '../types';
import { getJson, postJson, type AuthHeaders } from './apiClient';
import { uploadAutomationImage } from './imageUpload';

async function prepareAutomationForSave(
  automation: Automation,
  headers: AuthHeaders
): Promise<Automation> {
  if (!automation.responses?.length) return automation;

  const responses = await Promise.all(
    automation.responses.map(async (resp) => {
      if (resp.type === 'image' && resp.imageUrl?.startsWith('data:image/')) {
        const imageUrl = await uploadAutomationImage(headers, resp.imageUrl);
        return { ...resp, imageUrl };
      }
      if (resp.type === 'card' && resp.cardImage?.startsWith('data:image/')) {
        const cardImage = await uploadAutomationImage(headers, resp.cardImage);
        return { ...resp, cardImage };
      }
      return resp;
    })
  );

  return { ...automation, responses };
}

export async function saveAutomation(
  headers: AuthHeaders,
  automation: Automation
): Promise<Response> {
  const prepared = await prepareAutomationForSave(automation, headers);
  return postJson('/api/automations/save', headers, prepared);
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
  const res = await getJson('/api/automations?stats=true', headers);
  if (!res.ok) return null;
  const data = await res.json();
  if (typeof data?.total !== 'number') return null;
  return data as AutomationStats;
}
