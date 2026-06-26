import type { BusinessProfile } from '../types';
import { postJson, type AuthHeaders } from './apiClient';

export async function saveBusinessProfile(
  headers: AuthHeaders,
  profile: BusinessProfile
): Promise<Response> {
  return postJson('/api/business/profile/save', headers, profile);
}
