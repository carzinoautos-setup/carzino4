import { NextRequest, NextResponse } from 'next/server'
import env from '../../../../lib/env'

export async function GET(_request: NextRequest) {
  try {
    const siteBase = env.WP_BASE_URL.replace(/\/$/, '')

    // Attempt both cache clear mechanisms
    const urls = [
      `${siteBase}/?via_build_filters=1`,
      `${siteBase}/wp-json/custom/v1/rebuild-filters`,
    ]

    const results: any[] = []
    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: 'no-store' })
        const contentType = res.headers.get('content-type') || ''
        let body: any
        if (contentType.includes('application/json')) {
          body = await res.json()
        } else {
          body = await res.text()
        }
        results.push({ url, status: res.status, ok: res.ok, body })
      } catch (e: any) {
        results.push({ url, error: e?.message || String(e) })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Cache rebuild proxy failed', message: err?.message || String(err) }, { status: 500 })
  }
}
