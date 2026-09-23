# @studymind/react

Embed StudyMind AI study tools into any React or Next.js app.

## Installation

```bash
npm install @studymind/react
```

## Secure Usage (Production)

Never send your API key to the browser. On your server, exchange it for a short-lived
**session token** scoped to one course and one user, and pass only that token to the panel.

Server env (no `NEXT_PUBLIC_` prefix, so it never reaches the browser):

```
STUDYMIND_API_KEY=sm_live_your_key_here
STUDYMIND_API_URL=https://api.aismartlearner.com
```

Get your API key at https://aismartlearner.com/dashboard

```tsx
// app/courses/[id]/page.tsx (server component)
import { StudyMindPanel } from '@studymind/react'

async function getStudyMindToken(courseId: string, userId: string, userRole: string) {
  const res = await fetch(`${process.env.STUDYMIND_API_URL}/api/v1/auth/session`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STUDYMIND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ course_id: courseId, user_id: userId, user_role: userRole }),
    cache: 'no-store',  // tokens are per-user — never cache them
  })
  if (!res.ok) throw new Error(`StudyMind session failed: ${res.status}`)
  const data = await res.json()
  return data.session_token as string
}

export default async function CoursePage({ params }: { params: { id: string } }) {
  const user   = await getCurrentUser()        // your auth
  const course = await getCourse(params.id)    // your data

  // Exchange the API key for a session token SERVER-SIDE
  const sessionToken = await getStudyMindToken(course.id, user.id, user.role)

  return (
    <StudyMindPanel
      courseId={course.id}
      userId={user.id}
      userRole={user.role}
      apiUrl={process.env.STUDYMIND_API_URL}
      courseData={{
        title:       course.title,
        description: course.description,
        sections:    course.sections.map(s => ({
          title:    s.title,
          lectures: s.lectures.map(l => ({ title: l.title, description: l.description })),
        })),
      }}
      sessionToken={sessionToken}  // short-lived, browser-safe
    />
  )
}
```

The API key (`STUDYMIND_API_KEY`) never leaves your server. The session token:

- works only for the `course_id` + `user_id` it was minted for,
- expires after `expires_in` seconds (default 3600, min 300, max 86400),
- stops working immediately if the API key is revoked,
- cannot mint new tokens or reach admin endpoints.

On first mount the panel checks the course's status, ingests `courseData` if the course
isn't indexed yet, and polls until it's ready (usually a few seconds). Later visits skip
straight to "Ready". When a token expires, requests fail with a 401 — re-render the page (or
the panel) with a fresh token.

The bundle is marked `"use client"`, so it can be rendered from a server component as above.

## Local development (API key in the browser)

For quick local testing only, you can skip the token exchange:

```
NEXT_PUBLIC_STUDYMIND_API_KEY=sm_live_your_dev_key
NEXT_PUBLIC_STUDYMIND_API_URL=http://localhost:8000
```

```tsx
<StudyMindPanel courseId="c1" userId="u1" courseData={{ title: 'Test course' }} />
```

The panel logs a console warning in this mode. Anything prefixed `NEXT_PUBLIC_` is shipped
to every visitor, so never do this in production.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| courseId | string | ✅ | Your platform's course ID |
| userId | string | ✅ | Your platform's user ID |
| userRole | string | — | `student` \| `tutor` \| `admin` (default `student`) |
| courseData | CourseData | ✅ | Course title, description, sections |
| sessionToken | string | ✅ in production | `st_` token from `POST /api/v1/auth/session` |
| apiUrl | string | — | API base URL (default `https://api.aismartlearner.com`) |
| config | StudyMindConfig | — | `{ apiKey, apiUrl? }` — local development only |
| theme | string | — | `light` \| `dark` \| `auto` (default `light`; `auto` follows the OS) |
| className | string | — | Class for the panel's root element |
| onReady | function | — | Called when the course is indexed and AI is ready |
| onError | function | — | Called if connecting or indexing fails |

## Features

- 💬 AI Tutor — answers questions from course content, with sources
- 📝 Quiz — auto-generated multiple choice questions
- 🃏 Flashcards — key concepts as flip cards
- 📋 Summary — AI-generated course summary

## Advanced

Build your own UI with the lower-level pieces:

```tsx
import { StudyMindClient, StudyMindProvider, useStudyMind } from '@studymind/react'

const client = new StudyMindClient('', apiUrl)
client.setSessionToken(sessionToken)
const { answer, sources } = await client.chat(courseId, userId, 'What is a variable?')
```

`useStudyMind()` returns `{ client, courseId, userId, isReady, isLoading, error }` inside a
`StudyMindProvider`.

## Development

```bash
npm install
npm run lint    # tsc --noEmit
npm run build   # dist/index.js (cjs), dist/index.esm.js (esm), dist/index.d.ts
```
