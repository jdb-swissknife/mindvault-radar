import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radar, ArrowRight, Shield, Bot, Zap } from 'lucide-react'
import { type AuditRequest, TRADES, US_STATES } from '../types'

export default function Landing() {
  const navigate = useNavigate()
  const [form, setForm] = useState<AuditRequest>({
    domain: '',
    trade: '',
    city: '',
    state: '',
  })
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.domain.trim()) {
      setError('Enter your website URL')
      return
    }
    if (!form.trade) {
      setError('Select your trade')
      return
    }
    if (!form.city.trim()) {
      setError('Enter your city')
      return
    }
    if (!form.state) {
      setError('Select your state')
      return
    }

    // Store in sessionStorage for the scanning page to pick up
    sessionStorage.setItem('radar_request', JSON.stringify(form))
    navigate('/scanning')
  }

  return (
    <div className="min-h-screen bg-[#0a1230] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radar className="w-7 h-7 text-[#4f6ef7]" />
            <span className="font-bold text-lg">MindVault Radar</span>
          </div>
          <span className="text-xs text-white/40 ml-auto">by MindVault Studio</span>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-3xl mx-auto px-4 pt-16 pb-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#4f6ef7]/20 text-[#4f6ef7] text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-4 h-4" />
            Free AI Visibility Scan
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight">
            Ensure your website is on AI's radar.
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto">
            When someone asks ChatGPT "best roofer in Minneapolis", does your name come up? 
            Find out free in 30 seconds.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Website URL</label>
            <input
              type="text"
              placeholder="yourcompany.com"
              value={form.domain}
              onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4f6ef7] focus:ring-1 focus:ring-[#4f6ef7] text-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Trade</label>
              <select
                value={form.trade}
                onChange={e => setForm(f => ({ ...f, trade: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4f6ef7] appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#0a1230]">Select trade...</option>
                {TRADES.map(t => (
                  <option key={t.value} value={t.value} className="bg-[#0a1230]">{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">City</label>
              <input
                type="text"
                placeholder="Minneapolis"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4f6ef7]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">State</label>
              <select
                value={form.state}
                onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4f6ef7] appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#0a1230]">State...</option>
                {US_STATES.map(s => (
                  <option key={s} value={s} className="bg-[#0a1230]">{s}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#4f6ef7] hover:bg-[#3054d4] text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 text-lg transition-colors"
          >
            Run Radar Scan
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-white/30 text-xs">No signup required. Results in ~30 seconds.</p>
        </form>

        {/* Trust signals */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <Bot className="w-8 h-8 text-[#4f6ef7] mx-auto mb-3" />
            <h3 className="font-semibold mb-1">AI Search Check</h3>
            <p className="text-sm text-white/50">See if ChatGPT, Perplexity, and Gemini can find your business</p>
          </div>
          <div className="text-center">
            <Shield className="w-8 h-8 text-[#4f6ef7] mx-auto mb-3" />
            <h3 className="font-semibold mb-1">48-Point Audit</h3>
            <p className="text-sm text-white/50">Comprehensive scan across indexing, schema, content, and more</p>
          </div>
          <div className="text-center">
            <Zap className="w-8 h-8 text-[#4f6ef7] mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Actionable Fixes</h3>
            <p className="text-sm text-white/50">Get a prioritized list of exactly what to fix</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-white/30 text-sm">
        MindVault Radar by MindVault Studio
      </footer>
    </div>
  )
}
