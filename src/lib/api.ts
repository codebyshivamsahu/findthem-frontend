// src/lib/api.ts
// Backend API client — connects Find Them India frontend to the Express + PostgreSQL API

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn('NEXT_PUBLIC_API_URL is not set — falling back to http://localhost:5000');
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fti_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: any,
  auth = true
): Promise<{ success: boolean; data?: T; message?: string; pagination?: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok && !data.success) {
    // 401 Unauthorized — throw so restoreSession/login can catch and clear token
    // All other errors also throw with the server's message
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    login: (email: string, password: string) =>
      request('POST', '/api/auth/login', { email, password }, false),

    register: (data: { name: string; email: string; password: string; phone?: string; district?: string; state?: string }) =>
      request('POST', '/api/auth/register', data, false),

    me: () => request('GET', '/api/auth/me'),

    forgotPassword: (email: string) =>
      request('POST', '/api/auth/forgot-password', { email }, false),

    resetPassword: (token: string, password: string) =>
      request('POST', '/api/auth/reset-password', { token, password }, false),
  },

  // ─── Cases ─────────────────────────────────────────────────────────────────
  cases: {
    list: (params: Record<string, any> = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null && v !== ''))
      ).toString();
      return request('GET', `/api/cases${qs ? '?' + qs : ''}`, undefined, false);
    },

    get: (id: string) => request('GET', `/api/cases/${id}`, undefined, false),

    // Full record including contact details (the list omits them for anonymous
    // callers, so a cached list item has no phone or address).
    getById: (id: string) => request('GET', `/api/cases/${id}`),

    create: (data: any) => request('POST', '/api/cases', data),

    update: (id: string, data: any) => request('PUT', `/api/cases/${id}`, data),

    updateStatus: (id: string, status: string, note?: string) =>
      request('PATCH', `/api/cases/${id}/status`, { status, note }),

    delete: (id: string) => request('DELETE', `/api/cases/${id}`),

    getUpdates: (id: string) => request('GET', `/api/cases/${id}/updates`),

    addUpdate: (id: string, message: string, type = 'note') =>
      request('POST', `/api/cases/${id}/updates`, { message, type }),
  },

  // ─── Sightings ──────────────────────────────────────────────────────────────
  sightings: {
    // Sightings name their reporter and pinpoint a location — signed-in only.
    list: (caseId?: string) =>
      request('GET', `/api/sightings${caseId ? '?caseId=' + caseId : ''}`),

    create: (data: { caseId: string; latitude?: number; longitude?: number; address: string; description: string; photoUrl?: string }) =>
      request('POST', '/api/sightings', data),

    updateStatus: (id: string, status: 'verified' | 'dismissed' | 'pending') =>
      request('PATCH', `/api/sightings/${id}/status`, { status }),
  },

  // ─── Statistics ─────────────────────────────────────────────────────────────
  statistics: {
    get: () => request('GET', '/api/statistics', undefined, false),
    alerts: () => request('GET', '/api/statistics/alerts', undefined, false),
    createAlert: (data: any) => request('POST', '/api/statistics/alerts', data),
    dismissAlert: (id: string) => request('DELETE', `/api/statistics/alerts/${id}`),
  },
};

// ─── Token helpers ───────────────────────────────────────────────────────────
export function saveToken(token: string) {
  if (typeof window !== 'undefined') localStorage.setItem('fti_token', token);
}

export function clearToken() {
  if (typeof window !== 'undefined') localStorage.removeItem('fti_token');
}

export function hasToken(): boolean {
  return !!getToken();
}