import { NextRequest, NextResponse } from 'next/server'

/**
 * Exchanges the server-only STUDYMIND_API_KEY for a short-lived session token that is
 * safe to hand to the browser. The API key never leaves the server.
 *
 * ⚠️ Demo only: userId comes from the request body. In a real app, take the user from
 * YOUR auth session (and check they can access courseId) — otherwise any visitor could
 * mint a token for any user.
 */
export async function POST(req: NextRequest) {
  try {
    const { courseId, userId, userRole } = await req.json()

    if (!courseId || !userId) {
      return NextResponse.json({ error: 'courseId and userId are required' }, { status: 400 })
    }

    const apiKey = process.env.STUDYMIND_API_KEY
    const apiUrl = process.env.STUDYMIND_API_URL || 'https://api.aismartlearner.com'

    if (!apiKey) {
      return NextResponse.json({ error: 'STUDYMIND_API_KEY not configured' }, { status: 500 })
    }

    const res = await fetch(`${apiUrl}/api/v1/auth/session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        course_id:  courseId,
        user_id:    userId,
        user_role:  userRole || 'student',
        expires_in: 3600,
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const detail = typeof err.detail === 'string' ? err.detail : 'Failed to create session'
      return NextResponse.json({ error: detail }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({ sessionToken: data.session_token, apiUrl })
  } catch (e) {
    console.error('studymind-session failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
