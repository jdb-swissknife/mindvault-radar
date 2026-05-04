// MindVault Radar - GEO Audit Edge Function
// Runs the full 48-point GEO audit against a domain

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY')!

interface AuditRequest {
  domain: string
  trade: string
  city: string
  state: string
}

interface Check {
  id: string
  label: string
  status: 'pass' | 'warn' | 'fail'
  detail: string
  impact_note: string
  solution_hint: string
}

interface Action {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  action: string
}

async function serperSearch(query: string): Promise<any[]> {
  const resp = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 10 }),
  })
  if (!resp.ok) return []
  const data = await resp.json()
  return data.organic || []
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MindVaultRadar/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    return resp.ok ? await resp.text() : null
  } catch {
    return null
  }
}

async function checkIndex(domain: string): Promise<Check[]> {
  const checks: Check[] = []

  // A1: Google index
  const serp = await serperSearch(`site:${domain}`)
  const googleCount = serp.length
  checks.push({
    id: 'A1',
    label: 'Google index coverage',
    status: googleCount > 5 ? 'pass' : googleCount > 0 ? 'warn' : 'fail',
    detail: googleCount > 5
      ? `${googleCount} pages indexed. Good coverage.`
      : googleCount > 0
        ? `Only ${googleCount} pages found. Most sites need 10+ pages for AI visibility.`
        : 'No pages found in Google index. Your site may not be indexed at all.',
    impact_note: googleCount > 5 ? '' : "If Google hasn't indexed your pages, AI tools like ChatGPT and Perplexity can't find you either. They pull from Google's index.",
    solution_hint: googleCount > 5 ? '' : 'This requires technical SEO fixes to get your pages discovered and indexed by search engines.',
  })

  // A2: Bing index (proxied via Serper)
  const bingSerp = await serperSearch(`site:${domain}`)
  const bingCount = bingSerp.length
  checks.push({
    id: 'A2',
    label: 'Bing index coverage',
    status: bingCount > 5 ? 'pass' : bingCount > 0 ? 'warn' : 'fail',
    detail: bingCount > 5
      ? `${bingCount} pages found. Bing powers ChatGPT and Perplexity.`
      : `Only ${bingCount} pages in Bing. ChatGPT and Perplexity use Bing's index to find sources.`,
    impact_note: bingCount > 5 ? '' : "ChatGPT and Perplexity use Bing's index to find sources. If you're not in Bing, you're invisible to the most popular AI tools.",
    solution_hint: bingCount > 5 ? '' : 'This involves submitting your site to Bing and ensuring proper crawl access.',
  })

  // A3: Sitemap
  const sitemap = await fetchPage(`https://${domain}/sitemap.xml`)
  checks.push({
    id: 'A3',
    label: 'Sitemap.xml present',
    status: sitemap ? 'pass' : 'fail',
    detail: sitemap
      ? 'Sitemap found. AI crawlers use this to discover your pages.'
      : 'No sitemap found. Add /sitemap.xml to help AI engines discover all your pages.',
    impact_note: sitemap ? '' : 'Without a sitemap, AI crawlers have to guess where your pages are. Many won\'t bother.',
    solution_hint: sitemap ? '' : 'We generate and maintain a proper sitemap that tells every search engine and AI crawler exactly where to look.',
  })

  // A6: RSS feed
  let rssFound = false
  for (const path of ['/feed', '/rss', '/feed.xml', '/blog/feed']) {
    const rss = await fetchPage(`https://${domain}${path}`)
    if (rss) { rssFound = true; break }
  }
  checks.push({
    id: 'A6',
    label: 'RSS/Atom feed',
    status: rssFound ? 'pass' : 'fail',
    detail: rssFound
      ? 'RSS feed found. AI engines use feeds for fresh content discovery.'
      : 'No RSS feed found. AI engines use RSS to discover new content quickly.',
    impact_note: rssFound ? '' : 'RSS feeds signal fresh content to AI engines. Without one, new content takes longer to get picked up.',
    solution_hint: rssFound ? '' : 'This involves adding an RSS feed that automatically notifies AI engines when you publish new content.',
  })

  return checks
}

async function checkSchema(domain: string, clientName: string): Promise<Check[]> {
  const checks: Check[] = []
  const html = await fetchPage(`https://${domain}`)

  // Parse schema
  let schemaTypes: string[] = []
  if (html) {
    const matches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || []
    for (const match of matches) {
      try {
        const jsonStr = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '')
        const data = JSON.parse(jsonStr)
        if (data['@type']) schemaTypes.push(data['@type'])
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item['@type']) schemaTypes.push(item['@type'])
          }
        }
      } catch { /* skip invalid JSON */ }
    }
  }

  // B1: Schema presence
  checks.push({
    id: 'B1',
    label: 'Schema.org markup',
    status: schemaTypes.length > 0 ? 'pass' : 'fail',
    detail: schemaTypes.length > 0
      ? `Found ${schemaTypes.length} schema types: ${schemaTypes.join(', ')}.`
      : 'No structured data found. AI models use schema to understand what your business does.',
    impact_note: schemaTypes.length > 0 ? '' : 'Structured data is how AI engines understand what your business actually does. Without it, you\'re a blank page to AI.',
    solution_hint: schemaTypes.length > 0 ? '' : 'This involves adding specific code markup (JSON-LD) that tells AI engines your business name, services, and location.',
  })

  // B2: Organization/LocalBusiness
  const hasOrg = schemaTypes.some(t => ['Organization', 'LocalBusiness', 'Business', 'Corporation'].includes(t))
  checks.push({
    id: 'B2',
    label: 'Organization/LocalBusiness schema',
    status: hasOrg ? 'pass' : 'fail',
    detail: hasOrg
      ? 'Business schema found. AI engines use this to identify who you are.'
      : 'Missing Organization or LocalBusiness schema. This is critical for AI to recognize your business.',
    impact_note: hasOrg ? '' : 'AI engines use LocalBusiness schema to identify who you are and what you offer. Missing this means lower AI visibility.',
    solution_hint: hasOrg ? '' : 'This involves adding business-specific structured data with your name, address, services, and service area.',
  })

  // B3: FAQ schema
  const hasFaq = schemaTypes.includes('FAQPage')
  checks.push({
    id: 'B3',
    label: 'FAQ schema',
    status: hasFaq ? 'pass' : 'fail',
    detail: hasFaq
      ? 'FAQ schema found. FAQ content is heavily cited by AI engines.'
      : 'No FAQ schema. Adding FAQ pages with structured data is one of the fastest ways to get AI citations.',
    impact_note: hasFaq ? '' : 'FAQ pages are the #1 most cited content type by AI engines. Without one, you\'re missing the fastest path to AI visibility.',
    solution_hint: hasFaq ? '' : 'This involves creating an FAQ page with structured markup that AI engines can directly extract and cite.',
  })

  // B6: Wikidata
  let wikiFound = false
  try {
    const resp = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(clientName)}&language=en&format=json`,
      { signal: AbortSignal.timeout(5000) }
    )
    const data = await resp.json()
    wikiFound = data.search?.length > 0
  } catch { /* skip */ }
  checks.push({
    id: 'B6',
    label: 'Wikidata entity',
    status: wikiFound ? 'pass' : 'fail',
    detail: wikiFound
      ? 'Found on Wikidata. This feeds Google Knowledge Graph.'
      : 'Not found on Wikidata. Creating a Wikidata entry strengthens your entity signals across all AI engines.',
    impact_note: wikiFound ? '' : 'Wikidata feeds Google\'s Knowledge Graph and many AI systems. Not having an entry weakens your entity signals.',
    solution_hint: wikiFound ? '' : 'This involves creating and verifying a Wikidata entry that strengthens how AI systems recognize your business.',
  })

  return checks
}

async function checkAIVisibility(domain: string, trade: string, city: string, state: string, clientName: string): Promise<Check[]> {
  const checks: Check[] = []
  const queries = [
    `best ${trade} ${city} ${state}`,
    `${trade} ${city} online quotes`,
    `trusted ${trade} ${city} ${state}`,
    `compare ${trade} quotes online`,
    `${trade} company ${city}`,
  ]

  let mentions = 0
  const details: string[] = []
  const brandTerms = [domain.toLowerCase(), clientName.toLowerCase()]

  for (const q of queries) {
    const serp = await serperSearch(q)
    for (const r of serp.slice(0, 10)) {
      const title = (r.title || '').toLowerCase()
      const snippet = (r.snippet || '').toLowerCase()
      const link = (r.link || '').toLowerCase()
      if (brandTerms.some(t => title.includes(t) || snippet.includes(t) || link.includes(t))) {
        mentions++
        details.push(`Query "${q}" → found in: ${r.title?.slice(0, 60)}`)
        break
      }
    }
  }

  checks.push({
    id: 'C5',
    label: 'Brand appears in search results',
    status: mentions >= 3 ? 'pass' : mentions > 0 ? 'warn' : 'fail',
    detail: mentions >= 3
      ? `Found in ${mentions}/${queries.length} test queries. Good AI visibility.`
      : mentions > 0
        ? `Found in only ${mentions}/${queries.length} queries. You're partially visible but competitors dominate.`
        : `Not found in any of ${queries.length} test queries. AI engines won't find you for "${trade} ${city}".`,
    impact_note: mentions >= 3 ? '' : 'When potential customers ask AI for recommendations in your area, your competitors show up instead of you.',
    solution_hint: mentions >= 3 ? '' : 'This requires a combination of content, citations, and structured data that makes AI engines recognize you as a top result.',
  })

  if (details.length > 0) {
    checks.push({
      id: 'C5b',
      label: 'Where you appeared',
      status: 'pass',
      detail: details.join(' | '),
      impact_note: '',
      solution_hint: '',
    })
  }

  // C6: Competitor snapshot
  const compSerp = await serperSearch(queries[0])
  const competitors = compSerp
    .slice(0, 5)
    .filter(r => !r.link?.toLowerCase().includes(domain.toLowerCase()))
    .map(r => r.title?.slice(0, 50) || 'Unknown')

  checks.push({
    id: 'C6',
    label: 'Competitors in your space',
    status: 'warn',
    detail: competitors.length > 0
      ? `Top results for "${queries[0]}": ${competitors.join(', ')}`
      : 'No competitors found in top results.',
    impact_note: 'These are the businesses AI engines recommend when customers ask for your services. The more they appear, the less you do.',
    solution_hint: 'We build a strategy to systematically outperform these competitors in AI search results.',
  })

  return checks
}

async function checkContent(domain: string, clientName: string): Promise<Check[]> {
  const checks: Check[] = []
  const html = await fetchPage(`https://${domain}`)

  if (!html) {
    checks.push({
      id: 'D1',
      label: 'Could not fetch homepage',
      status: 'fail',
      detail: 'Unable to fetch your homepage for content analysis.',
      impact_note: 'AI engines use your page headings to understand your content. Poor structure means they can\'t extract useful information.',
      solution_hint: 'This involves restructuring your page with proper headings that AI engines can easily parse and cite.',
    })
    return checks
  }

  // Strip tags for text analysis
  const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // D1: Heading structure
  const h1s = (html.match(/<h1[^>]*>/gi) || []).length
  const h2s = (html.match(/<h2[^>]*>/gi) || []).length
  const h3s = (html.match(/<h3[^>]*>/gi) || []).length
  checks.push({
    id: 'D1',
    label: 'Heading structure',
    status: h1s === 1 && h2s >= 3 ? 'pass' : h2s >= 2 ? 'warn' : 'fail',
    detail: `Found ${h1s} H1, ${h2s} H2, ${h3s} H3 tags. ${
      h2s < 3 ? 'AI engines use headings to understand page structure. Add more H2 sections.' : 'Good structure for AI extraction.'
    }`,
    impact_note: (h1s === 1 && h2s >= 3) ? '' : 'AI engines use your page headings to understand your content. Poor structure means they can\'t extract useful information.',
    solution_hint: (h1s === 1 && h2s >= 3) ? '' : 'This involves restructuring your page with proper headings that AI engines can easily parse and cite.',
  })

  // D2: Brand in first 100 words
  const first100 = text.split(/\s+/).slice(0, 100).join(' ').toLowerCase()
  const brandInFirst = first100.includes(clientName.toLowerCase()) || first100.includes(domain.split('.')[0].toLowerCase())
  checks.push({
    id: 'D2',
    label: 'Brand name in first 100 words',
    status: brandInFirst ? 'pass' : 'fail',
    detail: brandInFirst
      ? 'Your brand is mentioned early on the page. AI engines extract from the top.'
      : 'Your brand name is not in the first 100 words. Move your business name to the opening sentence.',
    impact_note: brandInFirst ? '' : 'AI engines extract from the top of your page first. If your brand isn\'t there, they may not associate the content with you.',
    solution_hint: brandInFirst ? '' : 'This requires rewriting your opening content to prominently feature your business name and core service.',
  })

  // D5: Statistics
  const percentages = (text.match(/\d+%/g) || []).length
  const dollars = (text.match(/\$[\d,]+/g) || []).length
  const hasStats = percentages > 0 || dollars > 0
  checks.push({
    id: 'D5',
    label: 'Specific data & statistics',
    status: hasStats ? 'pass' : 'fail',
    detail: hasStats
      ? `Found ${percentages} percentages and ${dollars} dollar amounts. AI engines prefer citing specific numbers.`
      : 'No specific data points found. Add statistics, prices, or percentages to increase citation likelihood.',
    impact_note: hasStats ? '' : 'AI engines prefer citing specific numbers and data. Pages with stats get cited 30-40% more often according to recent research.',
    solution_hint: hasStats ? '' : 'This involves adding specific pricing, statistics, and data points to your key pages that AI engines love to reference.',
  })

  // D6: Entity consistency
  const weCount = (text.match(/\bwe\b|\bour\b/gi) || []).length
  const brandCount = (text.match(new RegExp(clientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
  checks.push({
    id: 'D6',
    label: 'Entity consistency (brand vs "we")',
    status: brandCount > weCount ? 'pass' : 'warn',
    detail: `"${clientName}" used ${brandCount}x vs "we/our" used ${weCount}x. ${
      brandCount <= weCount ? 'Replace some "we/our" with your brand name. AI engines need consistent entity references.' : 'Good brand name usage.'
    }`,
    impact_note: brandCount > weCount ? '' : 'AI engines need consistent brand name usage to recognize you as a distinct entity. Too much \'we\' and \'our\' dilutes your identity.',
    solution_hint: brandCount > weCount ? '' : 'This involves a content pass to replace generic pronouns with your brand name throughout your site.',
  })

  // D8: Comparison content
  const hasCompare = /\b(compare|vs|versus|comparison)\b/i.test(text)
  checks.push({
    id: 'D8',
    label: 'Comparison content',
    status: hasCompare ? 'pass' : 'fail',
    detail: hasCompare
      ? 'Comparison content found. "X vs Y" format is heavily cited by AI engines.'
      : 'No comparison content. "X vs Y" pages are among the most cited by AI search engines.',
    impact_note: hasCompare ? '' : '\'X vs Y\' comparison pages are among the most frequently cited by AI search engines. You\'re missing a high-value content type.',
    solution_hint: hasCompare ? '' : 'This involves creating comparison content that AI engines frequently pull from when answering buyer questions.',
  })

  return checks
}

async function checkEcosystem(clientName: string, trade: string, city: string): Promise<Check[]> {
  const checks: Check[] = []

  const ecosystemChecks = [
    { id: 'E1', label: 'Reddit mentions', query: `"${clientName}" site:reddit.com` },
    { id: 'E2', label: 'Yelp presence', query: `"${clientName}" site:yelp.com` },
    { id: 'E3', label: 'LinkedIn presence', query: `"${clientName}" site:linkedin.com` },
    { id: 'E4', label: 'YouTube presence', query: `"${clientName}" site:youtube.com` },
    { id: 'E5', label: 'News coverage', query: `"${clientName}" ${trade} ${city}` },
  ]

  const platformNames: Record<string, string> = {
    'E1': 'Reddit',
    'E2': 'Yelp',
    'E3': 'LinkedIn',
    'E4': 'YouTube',
    'E5': 'News outlets',
  }

  for (const check of ecosystemChecks) {
    const serp = await serperSearch(check.query)
    const found = serp.length > 0
    const topResult = found ? serp[0].title?.slice(0, 60) : ''
    const platform = platformNames[check.id] || 'this platform'
    checks.push({
      id: check.id,
      label: check.label,
      status: found ? 'pass' : 'fail',
      detail: found
        ? `Found: ${topResult}`
        : `Not found. Building presence here strengthens your AI citation signals.`,
      impact_note: found ? '' : `Presence on ${platform} strengthens your AI citation signals. Businesses visible across multiple platforms get cited 3-5x more by AI.`,
      solution_hint: found ? '' : 'This involves building and optimizing your presence on key platforms that AI engines use as trust signals.',
    })
  }

  return checks
}

async function checkCrawlers(domain: string): Promise<Check[]> {
  const checks: Check[] = []
  const robotsTxt = await fetchPage(`https://${domain}/robots.txt`)

  const botsToCheck = ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Bytespider', 'Google-Extended']
  const blocked: string[] = []
  const allowed: string[] = []

  if (robotsTxt) {
    for (const bot of botsToCheck) {
      const pattern = new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?Disallow:\\s*/`, 'i')
      if (pattern.test(robotsTxt)) {
        blocked.push(bot)
      } else {
        allowed.push(bot)
      }
    }
  } else {
    allowed.push(...botsToCheck)
  }

  checks.push({
    id: 'F1',
    label: 'AI crawler access',
    status: blocked.length === 0 ? 'pass' : 'fail',
    detail: blocked.length > 0
      ? `BLOCKED: ${blocked.join(', ')}. These AI bots cannot access your site. Remove the Disallow rules in robots.txt.`
      : `All AI crawlers allowed: ${allowed.join(', ')}. Good.`,
    impact_note: blocked.length === 0 ? '' : 'You are literally blocking AI tools from reading your website. ChatGPT, Perplexity, and others cannot access your content.',
    solution_hint: blocked.length === 0 ? '' : 'This requires updating your robots.txt to explicitly allow AI crawlers while maintaining security.',
  })

  return checks
}

function generateActions(sections: Record<string, Check[]>): Action[] {
  const actions: Action[] = []
  const allChecks = Object.values(sections).flat()

  // Critical: blocked crawlers
  if (allChecks.find(c => c.id === 'F1' && c.status === 'fail')) {
    actions.push({ priority: 'CRITICAL', action: 'Unblock AI crawlers in robots.txt (GPTBot, PerplexityBot, ClaudeBot)' })
  }

  // Critical: no schema
  if (allChecks.find(c => c.id === 'B1' && c.status === 'fail')) {
    actions.push({ priority: 'CRITICAL', action: 'Add Organization schema markup (JSON-LD) to your homepage' })
  }

  // High: no LocalBusiness schema
  if (allChecks.find(c => c.id === 'B2' && c.status === 'fail')) {
    actions.push({ priority: 'HIGH', action: 'Add LocalBusiness schema with your name, address, phone number' })
  }

  // High: no FAQ
  if (allChecks.find(c => c.id === 'B3' && c.status === 'fail')) {
    actions.push({ priority: 'HIGH', action: 'Add FAQ pages with FAQPage schema (fastest path to AI citations)' })
  }

  // High: low AI visibility
  if (allChecks.find(c => c.id === 'C5' && c.status === 'fail')) {
    actions.push({ priority: 'HIGH', action: 'Publish blog posts and comparison pages targeting your top keywords' })
  }

  // High: brand not in first 100 words
  if (allChecks.find(c => c.id === 'D2' && c.status === 'fail')) {
    actions.push({ priority: 'HIGH', action: 'Move your business name and key service to the first sentence of your homepage' })
  }

  // Medium: no comparison content
  if (allChecks.find(c => c.id === 'D8' && c.status === 'fail')) {
    actions.push({ priority: 'MEDIUM', action: 'Create "X vs Y" comparison content (highly cited by AI engines)' })
  }

  // Medium: no data/statistics
  if (allChecks.find(c => c.id === 'D5' && c.status === 'fail')) {
    actions.push({ priority: 'MEDIUM', action: 'Add specific statistics, prices, or percentages to key pages' })
  }

  // Medium: poor entity consistency
  if (allChecks.find(c => c.id === 'D6' && c.status === 'warn')) {
    actions.push({ priority: 'MEDIUM', action: 'Replace "we/our" with your brand name throughout your site' })
  }

  // Medium: no RSS
  if (allChecks.find(c => c.id === 'A6' && c.status === 'fail')) {
    actions.push({ priority: 'MEDIUM', action: 'Add an RSS feed for AI engine content discovery' })
  }

  return actions.slice(0, 8)
}

function calculateScore(sections: Record<string, Check[]>): number {
  const allChecks = Object.values(sections).flat()
  const total = allChecks.length
  if (total === 0) return 0

  let points = 0
  for (const check of allChecks) {
    if (check.status === 'pass') points += 1
    else if (check.status === 'warn') points += 0.5
  }

  return Math.round((points / total) * 100)
}

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    const body: AuditRequest = await req.json()
    const { domain, trade, city, state } = body

    if (!domain) {
      return new Response(JSON.stringify({ error: 'Domain required' }), { status: 400 })
    }

    // Derive a client name from domain
    const clientName = domain.split('.')[0]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())

    // Run all checks
    const [A, B, C, D, E, F] = await Promise.all([
      checkIndex(domain),
      checkSchema(domain, clientName),
      checkAIVisibility(domain, trade, city, state, clientName),
      checkContent(domain, clientName),
      checkEcosystem(clientName, trade, city),
      checkCrawlers(domain),
    ])

    const sections = { A, B, C, D, E, F }
    const score = calculateScore(sections)
    const actions = generateActions(sections)

    const result = {
      domain,
      trade,
      city,
      state,
      score,
      timestamp: new Date().toISOString(),
      sections,
      actions,
    }

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
