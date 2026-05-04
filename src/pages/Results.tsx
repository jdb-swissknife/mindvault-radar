import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radar, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Mail, ChevronDown, ChevronUp } from 'lucide-react'
import { type AuditResult, type AuditCheck } from '../types'
import { scoreColor, scoreLabel, scoreSummary } from '../lib/audit'

const SECTION_LABELS: Record<string, string> = {
  A: 'Index & Discovery',
  B: 'Schema & Structured Data',
  C: 'AI Visibility',
  D: 'Content Quality',
  E: 'Off-Site Presence',
  F: 'AI Crawler Access',
}

const STATUS_ICON = {
  pass: <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0" />,
  warn: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
  fail: <XCircle className="w-5 h-5 text-red-400 shrink-0" />,
}

const PRIORITY_BG = {
  CRITICAL: 'bg-red-500/20 text-red-300',
  HIGH: 'bg-amber-500/20 text-amber-300',
  MEDIUM: 'bg-white/10 text-white/70',
}

export default function Results() {
  const navigate = useNavigate()
  const [result, setResult] = useState<AuditResult | null>(null)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['A', 'C']))

  useEffect(() => {
    const stored = sessionStorage.getItem('radar_result')
    if (!stored) {
      navigate('/')
      return
    }
    const r: AuditResult = JSON.parse(stored)
    setResult(r)
  }, [navigate])

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !result) return
    // TODO: save to Supabase geo_leads table + trigger email
    setEmailSent(true)
  }

  if (!result) return null

  const { domain, trade, city, state, score, sections, actions } = result

  return (
    <div className="min-h-screen bg-[#0a1230] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-2">
          <Radar className="w-7 h-7 text-[#4f6ef7]" />
          <span className="font-bold text-lg">MindVault Radar</span>
          <button
            onClick={() => { sessionStorage.clear(); navigate('/') }}
            className="ml-auto text-sm text-white/40 hover:text-white"
          >
            New Scan
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Score Hero */}
        <div className="text-center mb-10">
          <div className="relative w-40 h-40 mx-auto mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={scoreColor(score)}
                strokeWidth="8"
                strokeDasharray={`${(score / 100) * 327} 327`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold" style={{ color: scoreColor(score) }}>{score}</span>
              <span className="text-xs text-white/40">/ 100</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-1">
            Your Radar Score: {scoreLabel(score)}
          </h1>
          <p className="text-white/50 max-w-lg mx-auto">
            {scoreSummary(score, trade.replace('-', ' '))} for <span className="text-white">{domain}</span> in {city}, {state}.
          </p>
        </div>

        {/* Two columns: checks + actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Checks - 2 cols wide */}
          <div className="lg:col-span-2 space-y-3">
            {(Object.entries(sections) as [string, AuditCheck[]][]).map(([key, checks]) => (
              <div key={key} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#4f6ef7]">{key}</span>
                    <span className="font-medium">{SECTION_LABELS[key]}</span>
                    <span className="text-xs text-white/40">
                      {checks.filter(c => c.status === 'pass').length}/{checks.length} passed
                    </span>
                  </div>
                  {expandedSections.has(key) ? (
                    <ChevronUp className="w-5 h-5 text-white/40" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/40" />
                  )}
                </button>
                {expandedSections.has(key) && (
                  <div className="border-t border-white/10 px-5 py-3 space-y-2">
                    {checks.map(check => (
                      <div key={check.id} className="flex items-start gap-3 py-2">
                        {STATUS_ICON[check.status]}
                        <div>
                          <span className="text-sm font-medium">{check.label}</span>
                          <p className="text-xs text-white/50 mt-0.5">{check.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions sidebar */}
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="font-bold mb-4">Priority Actions</h2>
              <div className="space-y-3">
                {actions.slice(0, 5).map((action, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${PRIORITY_BG[action.priority]}`}>
                      {action.priority}
                    </span>
                    <p className="text-sm text-white/70">{action.action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-[#4f6ef7]/20 border border-[#4f6ef7]/30 rounded-xl p-5 text-center">
              <h3 className="font-bold mb-2">Want us to fix this?</h3>
              <p className="text-sm text-white/60 mb-4">
                MindVault handles your entire AI presence. From schema to content to monitoring.
              </p>
              <a
                href="https://mindvaultstudio.net"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#4f6ef7] hover:bg-[#3054d4] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                Book a Free Call
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Email gate */}
            {!emailSent ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="font-bold mb-2 text-sm">Get this report in your inbox</h3>
                <form onSubmit={handleEmail} className="space-y-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#4f6ef7]"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Send Report
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-[#10b981]/20 border border-[#10b981]/30 rounded-xl p-5 text-center">
                <CheckCircle2 className="w-8 h-8 text-[#10b981] mx-auto mb-2" />
                <p className="text-sm font-medium">Report sent to {email}</p>
                <p className="text-xs text-white/50 mt-1">Check your inbox in a few minutes</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
