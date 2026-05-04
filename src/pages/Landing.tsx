import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radar, ArrowRight, Shield, Bot, Zap, Search } from 'lucide-react'
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
    <div className="min-h-screen bg-[#111111] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="MindVault" className="h-8 w-8" />
            <Radar className="w-7 h-7 text-[#c2703e]" />
            <span className="font-bold text-lg">Mind<span className="text-[#c2703e]">Vault</span> Radar</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <a href="https://scan.mindvaultstudio.net" className="flex items-center gap-1.5 text-sm text-white/50 hover:text-[#c2703e] transition-colors">
              <Search className="w-4 h-4" />
              SEO Scan
            </a>
            <span className="text-xs text-white/40">by Mind<span className="text-[#c2703e]">Vault</span> Studio</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-3xl mx-auto px-4 pt-16 pb-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#c2703e]/20 text-[#c2703e] text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-4 h-4" />
            Free AI Visibility Scan
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight font-serif">
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
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#c2703e] focus:ring-1 focus:ring-[#c2703e] text-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Trade</label>
              <select
                value={form.trade}
                onChange={e => setForm(f => ({ ...f, trade: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c2703e] appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#111111]">Select trade...</option>
                {TRADES.map(t => (
                  <option key={t.value} value={t.value} className="bg-[#111111]">{t.label}</option>
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
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#c2703e]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">State</label>
              <select
                value={form.state}
                onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c2703e] appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#111111]">State...</option>
                {US_STATES.map(s => (
                  <option key={s} value={s} className="bg-[#111111]">{s}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#c2703e] hover:bg-[#a85a2a] text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 text-lg transition-colors"
          >
            Run Radar Scan
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-white/30 text-xs">No signup required. Results in ~30 seconds.</p>
        </form>

        {/* Cross-promo: Try SEO Scan */}
        <a href="https://scan.mindvaultstudio.net" className="mt-10 flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-6 py-5 hover:border-[#c2703e]/40 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#c2703e]/20 flex items-center justify-center">
              <Search className="w-6 h-6 text-[#c2703e]" />
            </div>
            <div>
              <p className="font-semibold text-sm">Also check your traditional SEO</p>
              <p className="text-xs text-white/50">Google rankings, page speed, local SEO, backlinks. Free 30-second scan.</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-[#c2703e] transition-colors" />
        </a>

        {/* Trust signals */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <Bot className="w-8 h-8 text-[#c2703e] mx-auto mb-3" />
            <h3 className="font-semibold mb-1 font-serif">AI Search Check</h3>
            <p className="text-sm text-white/50">See if ChatGPT, Perplexity, and Gemini can find your business</p>
          </div>
          <div className="text-center">
            <Shield className="w-8 h-8 text-[#c2703e] mx-auto mb-3" />
            <h3 className="font-semibold mb-1 font-serif">48-Point Audit</h3>
            <p className="text-sm text-white/50">Comprehensive scan across indexing, schema, content, and more</p>
          </div>
          <div className="text-center">
            <Zap className="w-8 h-8 text-[#c2703e] mx-auto mb-3" />
            <h3 className="font-semibold mb-1 font-serif">Actionable Fixes</h3>
            <p className="text-sm text-white/50">Get a prioritized list of exactly what to fix</p>
          </div>
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
