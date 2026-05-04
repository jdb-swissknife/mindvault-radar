export interface AuditCheck {
  id: string
  label: string
  status: 'pass' | 'warn' | 'fail'
  detail: string
}

export interface AuditAction {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  action: string
}

export interface AuditResult {
  domain: string
  trade: string
  city: string
  state: string
  score: number
  timestamp: string
  sections: {
    A: AuditCheck[] // Index & Discovery
    B: AuditCheck[] // Structured Data
    C: AuditCheck[] // AI Visibility
    D: AuditCheck[] // Content Quality
    E: AuditCheck[] // Off-Site Presence
    F: AuditCheck[] // AI Crawler Access
  }
  actions: AuditAction[]
}

export interface AuditRequest {
  domain: string
  trade: string
  city: string
  state: string
  competitors?: string[]
}

export const TRADES = [
  { value: 'roofing', label: 'Roofing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'tree-service', label: 'Tree Service' },
  { value: 'solar', label: 'Solar' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'general-contractor', label: 'General Contractor' },
  { value: 'painting', label: 'Painting' },
  { value: 'garage-door', label: 'Garage Door' },
  { value: 'pest-control', label: 'Pest Control' },
  { value: 'other', label: 'Other' },
] as const

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
] as const
