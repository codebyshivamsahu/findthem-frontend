// src/store/index.ts
import { create } from 'zustand';
import { MissingPerson, User, SearchFilters, CaseStatus } from '@/types';
import { api, saveToken, clearToken } from '@/lib/api';

interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  restoreSession: () => Promise<void>;

  cases: MissingPerson[];
  filteredCases: MissingPerson[];
  selectedCase: MissingPerson | null;
  filters: SearchFilters;
  isLoading: boolean;
  pagination: { total: number; page: number; perPage: number; pages: number } | null;

  fetchCases: (filters?: SearchFilters) => Promise<void>;
  setFilters: (f: SearchFilters) => void;
  applyFilters: () => void;
  selectCase: (c: MissingPerson | null) => void;
  addCase: (c: Omit<MissingPerson, 'id' | 'caseId' | 'reportedAt' | 'updatedAt' | 'status'>) => Promise<MissingPerson>;
  updateStatus: (id: string, status: CaseStatus, note?: string) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  refreshCase: (id: string) => Promise<void>;

  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeView: string;
  setActiveView: (v: string) => void;
  apiConnected: boolean;
  setApiConnected: (v: boolean) => void;
}

function mapApiCase(c: any): MissingPerson {
  return {
    id: c.id,
    caseId: c.caseId || c.case_id,
    firNumber: c.firNumber || c.fir_number,
    name: c.name,
    age: c.age,
    gender: c.gender,
    lastSeenDate: c.lastSeenDate || c.last_seen_date,
    lastSeenLocation: c.lastSeenLocation || c.last_seen_location,
    lastSeenAddress: c.lastSeenAddress || c.last_seen_address,
    latitude: c.latitude,
    longitude: c.longitude,
    description: c.description,
    distinguishingMarks: c.distinguishingMarks || c.distinguishing_marks,
    photos: typeof c.photos === 'string' ? JSON.parse(c.photos) : (c.photos || []),
    status: c.status,
    reportedBy: c.reportedBy || c.reported_by,
    reportedAt: c.reportedAt || c.reported_at,
    updatedAt: c.updatedAt || c.updated_at,
    assignedOfficer: c.assignedOfficer || c.assigned_officer,
    district: c.district,
    state: c.state,
    contactName: c.contactName || c.contact_name,
    contactPhone: c.contactPhone || c.contact_phone,
    contactEmail: c.contactEmail || c.contact_email,
    matchConfidence: c.matchConfidence || c.match_confidence,
    ageProgressed: c.ageProgressed || c.age_progressed,
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  authLoading: true,
  cases: [],
  filteredCases: [],
  selectedCase: null,
  filters: {},
  isLoading: false,
  pagination: null,
  sidebarOpen: true,
  activeView: 'dashboard',
  apiConnected: false,

  setUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),

  restoreSession: async () => {
    try {
      const res = await api.auth.me() as any;
      if (res.success && res.data) {
        set({ currentUser: res.data, isAuthenticated: true, apiConnected: true });
        await get().fetchCases();
      } else {
        // Server returned ok but no data — clear stale token
        clearToken();
      }
    } catch (err: any) {
      // Token expired / invalid / network down — clear token silently, no crash
      clearToken();
      set({ currentUser: null, isAuthenticated: false });
    } finally {
      set({ authLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      const res = await api.auth.login(email, password) as any;
      if (res.success && res.data) {
        saveToken(res.data.token);
        set({ currentUser: res.data.user, isAuthenticated: true, apiConnected: true });
        await get().fetchCases();
        return true;
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
    return false;
  },

  logout: () => {
    clearToken();
    set({ currentUser: null, isAuthenticated: false, activeView: 'dashboard', cases: [], filteredCases: [] });
  },

  fetchCases: async (filters = {}) => {
    set({ isLoading: true });
    try {
      const res = await api.cases.list(filters) as any;
      if (res.success) {
        const mapped = res.data.map(mapApiCase);
        set({ cases: mapped, filteredCases: mapped, pagination: res.pagination, apiConnected: true });
      }
    } catch (err) {
      console.error('fetchCases error:', err);
      set({ apiConnected: false });
    } finally {
      set({ isLoading: false });
    }
  },

  setFilters: (filters) => {
    set({ filters });
    get().fetchCases(filters);
  },

  applyFilters: () => {
    get().fetchCases(get().filters);
  },

  selectCase: (c) => set({ selectedCase: c }),

  addCase: async (data) => {
    const res = await api.cases.create({
      name: data.name, age: data.age, gender: data.gender,
      description: data.description, distinguishingMarks: data.distinguishingMarks,
      lastSeenDate: data.lastSeenDate, lastSeenLocation: data.lastSeenLocation,
      lastSeenAddress: data.lastSeenAddress, latitude: data.latitude, longitude: data.longitude,
      district: data.district, state: data.state, contactName: data.contactName,
      contactPhone: data.contactPhone, contactEmail: data.contactEmail,
      firNumber: data.firNumber, photos: data.photos,
    }) as any;
    if (res.success && res.data) {
      const newCase = mapApiCase(res.data);
      set(s => ({ cases: [newCase, ...s.cases], filteredCases: [newCase, ...s.filteredCases] }));
      return newCase;
    }
    throw new Error(res.message || 'Failed to create case');
  },

  updateStatus: async (id, status, note) => {
    const res = await api.cases.updateStatus(id, status, note) as any;
    if (res.success && res.data) {
      const updated = mapApiCase(res.data);
      set(s => ({
        cases: s.cases.map(c => c.id === id ? updated : c),
        filteredCases: s.filteredCases.map(c => c.id === id ? updated : c),
        selectedCase: s.selectedCase?.id === id ? updated : s.selectedCase,
      }));
    }
  },

  refreshCase: async (id) => {
    const res = await api.cases.get(id) as any;
    if (res.success && res.data) {
      const updated = mapApiCase(res.data);
      set(s => ({
        cases: s.cases.map(c => c.id === id ? updated : c),
        filteredCases: s.filteredCases.map(c => c.id === id ? updated : c),
        selectedCase: s.selectedCase?.id === id ? updated : s.selectedCase,
      }));
    }
  },

  setApiConnected: (v) => set({ apiConnected: v }),
  deleteCase: async (id) => {
    await api.cases.delete(id);
    set(s => ({
      cases: s.cases.filter(c => c.id !== id),
      filteredCases: s.filteredCases.filter(c => c.id !== id),
      selectedCase: s.selectedCase?.id === id ? null : s.selectedCase,
    }));
  },
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveView: (v) => set({ activeView: v }),
}));