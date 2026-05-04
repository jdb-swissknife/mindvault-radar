import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radar, CheckCircle2, AlertTriangle, XCircle, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
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
  pass: <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0" />,
  warn: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
  fail: <XCircle className="w-5 h-5 text-red-400 shrink-0" />,
}

export default function Results() {
  const navigate = useNavigate()
  const [result, setResult] = useState<AuditResult | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', business_name: '' })
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

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !result) return
    try {
      const { supabase } = await import('../lib/supabase')
      await supabase.from('geo_leads').insert({
        domain: result.domain,
        trade: result.trade,
        city: result.city,
        state: result.state,
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        business_name: formData.business_name,
        score: result.score,
        result_json: result,
      })
    } catch { /* still unlock even if save fails */ }
    setUnlocked(true)
  }

  if (!result) return null

  const { domain, trade, city, state, score, sections } = result

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-2">
          <img src="/logo.png" alt="MindVault" className="h-8 w-8" />
          <Radar className="w-7 h-7 text-[#c2703e]" />
          <span className="font-bold text-lg">Mind<span className="text-[#c2703e]">Vault</span> Radar</span>
          <button
            onClick={() => { sessionStorage.clear(); navigate('/') }}
            className="ml-auto text-sm text-white/40 hover:text-white"
          >
            New Scan
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Score Hero - ALWAYS visible */}
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
          <h1 className="text-2xl font-bold mb-1 font-serif">
            Your Radar Score: {scoreLabel(score)}
          </h1>
          <p className="text-white/50 max-w-lg mx-auto">
            {scoreSummary(score, trade.replace('-', ' '))} for <span className="text-white">{domain}</span> in {city}, {state}.
          </p>
        </div>

        {/* Two columns: checks + actions - BLURRED when locked */}
        <div className={unlocked ? '' : 'relative'}>
          <div className={unlocked ? '' : 'filter blur-md pointer-events-none select-none'}>
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
                        <span className="text-sm font-bold text-[#c2703e]">{key}</span>
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
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium">{check.label}</span>
                              <p className="text-xs text-white/50 mt-0.5">{check.detail}</p>
                              {(check.status === 'warn' || check.status === 'fail') && check.impact_note && (
                                <div className="border-l-2 border-[#c2703e] pl-3 mt-2">
                                  <p className="text-xs text-white/60">{check.impact_note}</p>
                                  {check.solution_hint && (
                                    <p className="text-xs text-white/40 italic mt-1">
                                      How we'd fix it: {check.solution_hint}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* What's Hurting You Most sidebar */}
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <h2 className="font-bold mb-4 font-serif">What's Hurting You Most</h2>
                  <div className="space-y-3">
                    {Object.values(sections)
                      .flat()
                      .filter(c => (c.status === 'warn' || c.status === 'fail') && c.impact_note)
                      .sort((a, b) => (a.status === 'fail' ? -1 : 1) - (b.status === 'fail' ? -1 : 1))
                      .slice(0, 6)
                      .map(check => (
                        <div key={check.id} className="flex items-start gap-2.5">
                          <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${check.status === 'fail' ? 'bg-red-400' : 'bg-amber-400'}`} />
                          <div>
                            <p className="text-sm font-medium">{check.label}</p>
                            <p className="text-xs text-white/60 mt-0.5">
                              {check.impact_note.length > 80 ? check.impact_note.slice(0, 80).trim() + '...' : check.impact_note}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* CTA - sales closer */}
                <div className="bg-[#c2703e]/20 border border-[#c2703e]/30 rounded-xl p-5 text-center">
                  <h3 className="font-bold mb-2 font-serif">Every fix above, handled for you.</h3>
                  <p className="text-sm text-white/60 mb-4">
                    Mind<span className="text-[#c2703e]">Vault</span> builds AI-ready presence for service businesses. Schema, content, citations, monitoring. All done in 2 weeks.
                  </p>
                  <a
                    href="https://mindvaultstudio.net"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#c2703e] hover:bg-[#a85a2a] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
                  >
                    Book Your Free Strategy Call
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <p className="text-xs text-white/40 mt-3">
                    Free consultation. No commitment. Results in 14 days or your money back.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lead capture overlay - shown when NOT unlocked */}
          {!unlocked && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold font-serif mb-2">Unlock Your Full GEO Audit</h2>
                  <p className="text-sm text-white/60">
                    {domain} scored <span style={{ color: scoreColor(score) }} className="font-bold">{score}/100</span>.
                    See exactly what's holding your AI visibility back.
                  </p>
                </div>
                <form onSubmit={handleUnlock} className="space-y-3">
                  <input type="text" placeholder="Your Name" value={formData.name}
                    onChange={e => setFormData(p => ({...p, name: e.target.value}))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#c2703e]"
                    required />
                  <input type="email" placeholder="Work Email" value={formData.email}
                    onChange={e => setFormData(p => ({...p, email: e.target.value}))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#c2703e]"
                    required />
                  <input type="tel" placeholder="Phone Number" value={formData.phone}
                    onChange={e => setFormData(p => ({...p, phone: e.target.value}))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#c2703e]"
                    required />
                  <input type="text" placeholder="Business Name" value={formData.business_name}
                    onChange={e => setFormData(p => ({...p, business_name: e.target.value}))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#c2703e]"
                    required />
                  <button type="submit"
                    className="w-full bg-[#c2703e] hover:bg-[#a85a2a] text-white font-bold py-3 rounded-lg transition-colors text-lg">
                    Get My Free Report
                  </button>
                  <p className="text-xs text-white/30 text-center">No spam. We'll send your detailed report and follow up within 24 hours.</p>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e7ddd3] bg-[#f7f3ee] py-6 px-4 text-center">
        <p className="text-sm italic text-[#c2703e]">Your AI Workforce, Managed.</p>
        <p className="text-xs text-stone-500 mt-2">&copy; {new Date().getFullYear()} Mind<span className="text-[#c2703e]">Vault</span> Studio. All rights reserved.</p>
      </footer>
    </div>
  )
}
