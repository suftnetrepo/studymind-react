# @studymind/react

Embed StudyMind AI study tools into any React or Next.js app.

## Installation

```bash
npm install @studymind/react
```

## Setup

Add to your `.env`:

```
NEXT_PUBLIC_STUDYMIND_API_KEY=sm_live_your_key_here
NEXT_PUBLIC_STUDYMIND_API_URL=https://api.aismartlearner.com
```

Get your API key at https://aismartlearner.com/dashboard

> **Security:** anything prefixed `NEXT_PUBLIC_` is shipped to the browser, so every visitor
> can read the key and call the StudyMind API with any `userId`. Use a key dedicated to this
> embed and revoke it if it leaks. A server-side proxy / short-lived token flow is planned.

## Usage

```tsx
import { StudyMindPanel } from '@studymind/react'

export default function CoursePage({ course, student }) {
  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <CourseContent course={course} />
      </div>
      <div className="w-96">
        <StudyMindPanel
          courseId={course.id}
          userId={student.id}
          userRole={student.role}
          courseData={{
            title:       course.title,
            description: course.description,
            sections:    course.sections.map(s => ({
              title:    s.title,
              lectures: s.lectures.map(l => ({
                title:       l.title,
                description: l.description,
              })),
            })),
          }}
        />
      </div>
    </div>
  )
}
```

The bundle is marked `"use client"`, so it can be imported directly from a Next.js App Router
server component.

On first mount the panel checks the course's status, ingests it if needed, and polls until
indexing is finished (usually a few seconds). Later visits skip straight to "Ready".

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| courseId | string | ✅ | Your platform's course ID |
| userId | string | ✅ | Your platform's user ID |
| userRole | string | — | `student` \| `tutor` \| `admin` (default `student`) |
| courseData | CourseData | ✅ | Course title, description, sections |
| config | StudyMindConfig | — | `{ apiKey, apiUrl? }` (defaults to the env vars above) |
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

const client = new StudyMindClient(apiKey)
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
