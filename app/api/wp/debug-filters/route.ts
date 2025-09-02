import { NextRequest, NextResponse } from 'next/server'
import env from '../../../../lib/env'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wpUrl = new URL('/wp-json/custom/v1/debug-filters', env.WP_BASE_URL)

    // Forward all query params
    searchParams.forEach((value, key) => {
      wpUrl.searchParams.set(key, value)
    })

    const res = await fetch(wpUrl.toString(), { next: { revalidate: 0 } })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ success: false, error: `WP debug error ${res.status}`, details: text }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Debug proxy fetch failed', message: err?.message || String(err) }, { status: 500 })
  }
}
