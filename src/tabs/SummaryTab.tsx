import React, { useState } from 'react'
import { useStudyMind } from '../context'
import { s, tokens } from '../styles'
import { EmptyState } from './EmptyState'
import { IconFileText } from '../icons'
import { MarkdownRenderer } from '../MarkdownRenderer'
import { TopicSelector, ScopeNote } from '../components/TopicSelector'
import { ComplexitySelector } from '../components/ComplexitySelector'
import { CopyButton } from '../components/CopyButton'
import { IconShare } from '../icons'

export function SummaryTab() {
  const {
    client, courseId, userId, topic, setTopic, courseData, complexity, setComplexity,
    summary, setSummary,   // lives in context: survives tab switches, restored after reload/login
  } = useStudyMind()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      setSummary(await client.summarise(courseId, userId, topic || undefined, complexity))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  const selector = (
    <>
      <TopicSelector sections={courseData.sections ?? []} value={topic} onChange={setTopic}
        label="Summarise" disabled={loading} />
      <ComplexitySelector value={complexity} onChange={setComplexity} disabled={loading} />
    </>
  )

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  async function share() {
    try {
      await navigator.share({
        title: summary?.topic ? `Summary: ${summary.topic}` : 'Course summary',
        text:  summary?.content ?? '',
      })
    } catch { /* user cancelled or share failed */ }
  }

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
      <ScopeNote topic={summary.topic} complexity={summary.complexity} prefix="Summary of" />
      <div style={s.card}>
        <MarkdownRenderer content={summary.content} />
      </div>
      {error && <p role="alert" style={{ color: tokens.colors.error, fontSize: '13px' }}>{error}</p>}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
        <CopyButton text={summary.content} label="Copy" title="Copy summary" />
        {canShare && (
          <button
            onClick={share}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '3px 4px', fontSize: '11px', fontWeight: 600, fontFamily: tokens.font.sans,
              border: 'none', background: 'none', color: tokens.colors.textMuted, cursor: 'pointer',
            }}
          >
            <IconShare size={14} color={tokens.colors.textMuted} /> Share
          </button>
        )}
        <button
          style={{ ...s.btn('outline'), width: 'auto', marginTop: 0, marginLeft: 'auto', padding: '6px 14px', fontSize: '12px' }}
          onClick={() => setSummary(null)}
          disabled={loading}
        >
          Regenerate
        </button>
      </div>
    </div>
    </>
  )
}
