import React, { useState, useRef, useEffect } from 'react'
import { useStudyMind } from '../context'
import { s, tokens } from '../styles'
import { MarkdownRenderer } from '../MarkdownRenderer'
import type { Message } from '../types'

let nextId = 0
const newId = () => `m${++nextId}`

export function TutorTab() {
  const { client, courseId, userId } = useStudyMind()
  const [messages,  setMessages]  = useState<Message[]>([])
  const [input,     setInput]     = useState('')
  const [sending,   setSending]   = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
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
      const res = await client.chat(courseId, userId, text, sessionId)
      if (res.session_id) setSessionId(res.session_id)
      setMessages(prev => [...prev, {
        id: newId(), role: 'assistant',
        content: res.answer, sources: res.sources,
        timestamp: new Date(),
      }])
    } catch (e: unknown) {
      setMessages(prev => [...prev, {
        id: newId(), role: 'assistant',
        content: '⚠️ ' + (e instanceof Error ? e.message : 'Failed to get response'),
        timestamp: new Date(),
      }])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div ref={scrollRef} style={s.scrollArea} aria-live="polite">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
            <p style={{ color: tokens.colors.textSecondary, fontSize: '14px', margin: 0 }}>
              Ask anything about this course
            </p>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={m.role === 'user' ? { ...s.userMsg, whiteSpace: 'pre-wrap' } : s.aiMsg}>
            {m.role === 'user' ? m.content : <MarkdownRenderer content={m.content} />}
            {m.role === 'assistant' && m.sources && m.sources.length > 0 && (
              <div style={{ marginTop: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {m.sources.map((src, j) => (
                  <span key={j} style={{
                    fontSize: '10px', color: tokens.colors.primary,
                    background: tokens.colors.primaryBg,
                    padding: '2px 7px', borderRadius: '10px',
                    fontWeight: 600,
                  }}>
                    📄 {src}
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
          ↑
        </button>
      </div>
    </>
  )
}
