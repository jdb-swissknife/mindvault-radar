import { type AuditRequest, type AuditResult } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function runAudit(request: AuditRequest): Promise<AuditResult> {
  // Clean domain - remove protocol, trailing slashes
  let domain = request.domain
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '')
    .toLowerCase()

  const response = await fetch(`${SUPABASE_URL}/functions/v1/geo-audit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      domain,
      trade: request.trade,
      city: request.city,
      state: request.state,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(err || 'Audit failed')
  }

  return response.json()
}

export function scoreColor(score: number): string {
  if (score >= 70) return '#10b981'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Needs Work'
  if (score >= 20) return 'Poor'
  return 'Critical'
}

export function scoreSummary(score: number, trade: string): string {
  if (score >= 70) {
    return `Your business has a solid AI presence. A few tweaks could push you to the top.`
  }
  if (score >= 40) {
    return `Your business has some web presence but is mostly invisible to AI search engines like ChatGPT and Perplexity.`
  }
  return `Your business is essentially invisible to AI search engines. When someone asks ChatGPT for "${trade} near me", they won't find you.`
}

export const AUDIT_STEPS = [
  { id: 'index', label: 'Scanning Google & Bing Index', icon: 'search' },
  { id: 'schema', label: 'Analyzing Schema & Structured Data', icon: 'code' },
  { id: 'ai', label: 'Testing AI Visibility (ChatGPT, Perplexity, Gemini)', icon: 'bot' },
  { id: 'content', label: 'Checking Content Quality', icon: 'file-text' },
  { id: 'ecosystem', label: 'Scanning Off-Site Presence', icon: 'globe' },
  { id: 'crawlers', label: 'Analyzing AI Crawler Access', icon: 'shield' },
  { id: 'report', label: 'Generating Radar Report', icon: 'file-bar-chart' },
] as const
