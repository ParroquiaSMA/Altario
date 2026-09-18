/**
 * vercel-analytics.ts
 * Wrapper de la API de Vercel Web Analytics para datos reales de tráfico.
 * Endpoint: https://api.vercel.com/v1/query/web-analytics/visits/{count|aggregate}
 */

const TOKEN = import.meta.env.PUBLIC_VERCEL_TOKEN as string | undefined
const TEAM_ID = import.meta.env.PUBLIC_VERCEL_TEAM_ID as string | undefined
const PROJECT_ID = import.meta.env.PUBLIC_VERCEL_WEB_PROJECT_ID as string | undefined

const BASE = "https://api.vercel.com/v1/query/web-analytics/visits"

export interface VercelTrafficTotals {
  visitors: number
  pageviews: number
}

export interface VercelDayPoint {
  timestamp: string
  visitors: number
  pageviews: number
}

export interface VercelPathEntry {
  requestPath: string
  visitors: number
  pageviews: number
}

export interface VercelDeviceEntry {
  deviceType: string
  visitors: number
  pageviews: number
}

export interface VercelReferrerEntry {
  referrerHostname: string
  visitors: number
  pageviews: number
}

export interface VercelAnalyticsData {
  totals: VercelTrafficTotals
  timeseries: VercelDayPoint[]
  topPages: VercelPathEntry[]
  devices: VercelDeviceEntry[]
  referrers: VercelReferrerEntry[]
}

function getSinceUntil(days: number): { since: string; until: string } {
  const until = new Date()
  until.setHours(23, 59, 59, 999)
  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)
  return {
    since: since.toISOString(),
    until: until.toISOString(),
  }
}

async function vercelFetch(path: string, params: Record<string, string>): Promise<any> {
  if (!TOKEN || !TEAM_ID || !PROJECT_ID) return null
  const url = new URL(`${BASE}/${path}`)
  url.searchParams.set("teamId", TEAM_ID)
  url.searchParams.set("projectId", PROJECT_ID)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
    if (!res.ok) {
      console.warn(`[Vercel Analytics] HTTP ${res.status} on ${path}:`, await res.text())
      return null
    }
    const json = await res.json()
    if (json.error) {
      console.warn(`[Vercel Analytics] API error on ${path}:`, json.error)
      return null
    }
    return json.data
  } catch (err) {
    console.warn(`[Vercel Analytics] Fetch failed on ${path}:`, err)
    return null
  }
}

export async function fetchVercelAnalytics(days: number): Promise<VercelAnalyticsData | null> {
  if (!TOKEN || !TEAM_ID || !PROJECT_ID) return null

  // Vercel Web Analytics en plan Hobby limita las consultas a los últimos 31 días
  const safeDays = Math.min(Math.max(days, 1), 30)
  const { since, until } = getSinceUntil(safeDays)
  const baseParams = { since, until }

  const [totalsRaw, timeseriesRaw, pagesRaw, devicesRaw, referrersRaw] = await Promise.all([
    vercelFetch("count", baseParams),
    vercelFetch("aggregate", { ...baseParams, by: "day", limit: String(safeDays) }),
    vercelFetch("aggregate", { ...baseParams, by: "requestPath", limit: "10" }),
    vercelFetch("aggregate", { ...baseParams, by: "deviceType" }),
    vercelFetch("aggregate", { ...baseParams, by: "referrerHostname", limit: "8" }),
  ])

  if (!totalsRaw) return null

  return {
    totals: {
      visitors: totalsRaw.visitors ?? 0,
      pageviews: totalsRaw.pageviews ?? 0,
    },
    timeseries: Array.isArray(timeseriesRaw) ? timeseriesRaw : [],
    topPages: Array.isArray(pagesRaw) ? pagesRaw : [],
    devices: Array.isArray(devicesRaw) ? devicesRaw : [],
    referrers: Array.isArray(referrersRaw)
      ? referrersRaw.filter((r: any) => r.referrerHostname !== "")
      : [],
  }
}
