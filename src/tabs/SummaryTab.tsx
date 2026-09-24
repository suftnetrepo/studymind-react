import React, { useState } from 'react'
import { useStudyMind } from '../context'
import { s, tokens } from '../styles'
import { EmptyState } from './EmptyState'
import { MarkdownRenderer } from '../MarkdownRenderer'

export function SummaryTab() {
  const { client, courseId, userId } = useStudyMind()
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await client.summarise(courseId, userId)
      setSummary(res.summary)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  if (!summary) {
    return (
      <div style={s.scrollArea}>
        <EmptyState
          emoji="📋" text="Generate an AI summary of this course"
          error={error} buttonLabel="Generate Summary" loading={loading} onClick={generate}
        />
      </div>
    )
  }

  return (
    <div style={s.scrollArea}>
      <div style={s.card}>
        <MarkdownRenderer content={summary} />
      </div>
      {error && <p role="alert" style={{ color: tokens.colors.error, fontSize: '13px' }}>{error}</p>}
      <button style={s.btn('outline')} onClick={generate} disabled={loading}>
        {loading ? 'Generating…' : 'Regenerate'}
      </button>
    </div>
  )
}
