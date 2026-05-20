// src/types/index.ts

export type CaseStatus = 'open' | 'investigating' | 'sighting_reported' | 'found' | 'closed';
export type Gender     = 'male' | 'female' | 'other';
export type UserRole   = 'family' | 'volunteer' | 'police' | 'ngo' | 'admin';

export interface MissingPerson {
  id:                 string;
  caseId:             string;
  firNumber?:         string;
  name:               string;
  age:                number;
  gender:             Gender;
  lastSeenDate:       string;
  lastSeenLocation:   string;
  lastSeenAddress:    string;
  latitude?:          number;
  longitude?:         number;
  description:        string;
  distinguishingMarks?: string;
  photos:             string[];
  status:             CaseStatus;
  reportedBy:         string;
  reportedAt:         string;
  updatedAt:          string;
  assignedOfficer?:   string;
  district:           string;
  state:              string;
  contactName:        string;
  contactPhone:       string;
  contactEmail?:      string;
  matchConfidence?:   number;
  ageProgressed?:     string;
}

export interface Sighting {
  id:          string;
  caseId:      string;
  reportedBy:  string;
  latitude:    number;
  longitude:   number;
  address:     string;
  description: string;
  photoUrl?:   string;
  verifiedByAI: boolean;
  confidence?:  number;
  reportedAt:  string;
  status:      'pending' | 'verified' | 'dismissed';
}

export interface CaseUpdate {
  id:        string;
  caseId:    string;
  author:    string;
  role:      UserRole;
  message:   string;
  createdAt: string;
  type:      'status_change' | 'note' | 'sighting' | 'document';
}

export interface User {
  id:       string;
  name:     string;
  email:    string;
  phone:    string;
  role:     UserRole;
  district: string;
  state:    string;
  verified: boolean;
  avatar?:  string;
}

export interface Statistics {
  totalCases:       number;
  openCases:        number;
  resolvedCases:    number;
  avgResolutionDays: number;
  sightingsToday:   number;
  stateData:        { state: string; cases: number; resolved: number }[];
  monthlyData:      { month: string; filed: number; resolved: number }[];
}

export interface SearchFilters {
  query?:     string;
  status?:    CaseStatus;
  gender?:    Gender;
  ageMin?:    number;
  ageMax?:    number;
  state?:     string;
  district?:  string;
  dateFrom?:  string;
  dateTo?:    string;
  sortBy?:    'recent' | 'oldest' | 'name';
}

export interface ApiResponse<T> {
  data:    T;
  success: boolean;
  message?: string;
  pagination?: {
    total:    number;
    page:     number;
    perPage:  number;
    pages:    number;
  };
}
