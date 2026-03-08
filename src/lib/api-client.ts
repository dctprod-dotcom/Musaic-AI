/**
 * API CLIENT — Sends Firebase ID tokens with every request
 * 
 * Replaces raw fetch() calls throughout the app.
 * Automatically attaches the current user's Firebase ID token.
 */

import { auth } from '../firebase';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return { 'Content-Type': 'application/json' };

  try {
    const token = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
}

export async function apiGet<T = any>(url: string): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw { status: res.status, ...err };
  }
  return res.json();
}

export async function apiPost<T = any>(url: string, body?: any): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw { status: res.status, ...err };
  }
  return res.json();
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(url, { method: 'DELETE', headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw { status: res.status, ...err };
  }
  return res.json();
}
