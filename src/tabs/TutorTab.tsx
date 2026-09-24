import React, { useState, useRef, useEffect } from 'react'
import { useStudyMind } from '../context'
import { s, tokens } from '../styles'
import { MarkdownRenderer } from '../MarkdownRenderer'
import { IconMessageCircle, IconSend, IconAlertCircle, IconFileText } from '../icons'
import type { Complexity } from '../types'

let nextId = 0
const newId = () => `m${++nextId}`

const COMPLEXITY: { level: Complexity; label: string; color: string }[] = [
  { level: 'simple', label: 'Simple', color: '#10B981' },
  { level: 'normal', label: 'Normal', color: '#5B7FFF' },
  { level: 'expert', label: 'Expert', color: '#EF4444' },
]

export function TutorTab() {
  const {
    client, courseId, userId,
    messages, setMessages, sessionId, setSessionId,
    sending, setSending, complexity, setComplexity,
  } = useStudyMind()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll only the message list — scrollIntoView would also scroll the host page
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, sending])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    setMessages(prev => [...prev, { id: newId(), role: 'user', content: text, timestamp: new Date() }])

    try {
      const res = await client.chat(courseId, userId, text, sessionId, complexity)
      if (res.session_id) setSessionId(res.session_id)
      setMessages(prev => [...prev, {
        id: newId(), role: 'assistant',
        content: res.answer, sources: res.sources,
        timestamp: new Date(),
      }])
    } catch (e: unknown) {
      setMessages(prev => [...prev, {
        id: newId(), role: 'assistant',
        content: e instanceof Error ? e.message : 'Failed to get response',
        isError: true,
        timestamp: new Date(),
      }])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Answer complexity */}
      <div role="radiogroup" aria-label="Answer complexity" style={{
        display:         'flex',
        gap:             '6px',
        padding:         '10px 14px',
        borderBottom:    `1px solid ${tokens.colors.border}`,
        backgroundColor: tokens.colors.bgMuted,
        flexShrink:      0,
      }}>
        {COMPLEXITY.map(({ level, label, color }) => {
          const active = complexity === level
          return (
            <button
              key={level}
              role="radio"
              aria-checked={active}
              onClick={() => setComplexity(level)}
              style={{
                flex:           1,
                display:        'inline-flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '6px',
                padding:        '6px 4px',
                fontSize:       '11px',
                fontWeight:     active ? 700 : 500,
                fontFamily:     tokens.font.sans,
                borderRadius:   tokens.radius.md,
                border:         `1px solid ${active ? tokens.colors.primary : tokens.colors.border}`,
                background:     active ? tokens.colors.primaryBg : tokens.colors.white,
                color:          active ? tokens.colors.primary : tokens.colors.textSecondary,
                cursor:         'pointer',
                transition:     'all 0.15s',
              }}
            >
              <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
              {label}
            </button>
          )
        })}
      </div>

      <div ref={scrollRef} style={s.scrollArea} aria-live="polite">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <IconMessageCircle size={32} color={tokens.colors.textMuted} />
            </div>
            <p style={{ color: tokens.colors.textSecondary, fontSize: '14px', margin: 0 }}>
              Ask anything about this course
            </p>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={m.role === 'user' ? { ...s.userMsg, whiteSpace: 'pre-wrap' } : s.aiMsg}>
            {m.role === 'user' ? m.content : m.isError ? (
              <div role="alert" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start',
                color: tokens.colors.error, fontSize: '13px' }}>
                <IconAlertCircle size={16} color={tokens.colors.error} style={{ marginTop: '2px' }} />
                <span>{m.content}</span>
              </div>
            ) : <MarkdownRenderer content={m.content} />}
            {m.role === 'assistant' && m.sources && m.sources.length > 0 && (
              <div style={{ marginTop: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {m.sources.map((src, j) => (
                  <span key={j} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '10px', color: tokens.colors.primary,
                    background: tokens.colors.primaryBg,
                    padding: '2px 7px', borderRadius: '10px',
                    fontWeight: 600,
                  }}>
                    <IconFileText size={11} color={tokens.colors.primary} />
                    {src}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div style={{ ...s.aiMsg, color: tokens.colors.textMuted }}>Thinking…</div>
        )}
      </div>
      <div style={s.inputRow}>
        <textarea
          style={s.input}
          rows={1}
          value={input}
          aria-label="Ask a question"
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Ask a question…"
        />
        <button
          style={{ ...s.sendBtn, opacity: sending || !input.trim() ? 0.6 : 1 }}
          onClick={send}
          disabled={sending || !input.trim()}
          aria-label="Send"
        >
          <IconSend size={16} />
        </button>
      </div>
    </>
  )
}
