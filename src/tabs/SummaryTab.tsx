import React, { useState } from 'react'
import { useStudyMind } from '../context'
import { s, tokens } from '../styles'
import { EmptyState } from './EmptyState'
import { IconFileText } from '../icons'
import { MarkdownRenderer } from '../MarkdownRenderer'
import { TopicSelector, ScopeNote } from '../components/TopicSelector'

export function SummaryTab() {
  const { client, courseId, userId, topic, setTopic, courseData } = useStudyMind()
  const [summaryTopic, setSummaryTopic] = useState('')  // topic this summary was generated for
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await client.summarise(courseId, userId, topic || undefined)
      setSummary(res.summary)
      setSummaryTopic(topic)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  const selector = (
    <TopicSelector sections={courseData.sections ?? []} value={topic} onChange={setTopic}
      label="Summarise" disabled={loading} />
  )

  if (!summary) {
    return (
      <>
      {selector}
      <div style={s.scrollArea}>
        <EmptyState
          icon={<IconFileText size={32} color={tokens.colors.textMuted} />} text="Generate an AI summary of this course"
          error={error} buttonLabel="Generate Summary" loading={loading} onClick={generate}
        />
      </div>
      </>
    )
  }

  return (
    <>
    {selector}
    <div style={s.scrollArea}>
      {summaryTopic && <ScopeNote topic={summaryTopic} prefix="Summary of" />}
      <div style={s.card}>
        <MarkdownRenderer content={summary} />
      </div>
      {error && <p role="alert" style={{ color: tokens.colors.error, fontSize: '13px' }}>{error}</p>}
      <button style={s.btn('outline')} onClick={generate} disabled={loading}>
        {loading ? 'Generating…' : 'Regenerate'}
      </button>
    </div>
    </>
  )
}
