import React, { useState, useRef, useEffect } from 'react'
import { useStudyMind } from '../context'
import { s, tokens } from '../styles'
import { MarkdownRenderer } from '../MarkdownRenderer'
import { IconMessageCircle, IconSend, IconAlertCircle, IconFileText, IconPencilPlus } from '../icons'
import { ComplexitySelector } from '../components/ComplexitySelector'
import { CopyButton } from '../components/CopyButton'

let nextId = 0
const newId = () => `m${++nextId}`

export function TutorTab() {
  const {
    client, courseId, userId,
    messages, setMessages, sessionId, setSessionId,
    sending, setSending, complexity, setComplexity,
  } = useStudyMind()
  const [input, setInput] = useState('')
  const [startingNew, setStartingNew] = useState(false)

  async function handleNewChat() {
    if (messages.length === 0 || sending || startingNew) return
    if (!window.confirm("Start a new conversation? You won't be able to return to this one.")) return
    setStartingNew(true)
    try {
      await client.newChat(courseId, userId)
    } catch {
      // Still clear locally; the server will pick the session back up on the next message
    } finally {
      setMessages([])
      setSessionId(undefined)
      setStartingNew(false)
    }
  }

  const conversationText = messages
    .map(m => `${m.role === 'user' ? 'You' : 'AI Tutor'}: ${m.content}`)
    .join('\n\n')
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
      <ComplexitySelector
        value={complexity}
        onChange={setComplexity}
        actions={messages.length > 0 && (
          <>
            <button
              onClick={handleNewChat}
              disabled={sending || startingNew}
              title="Start a new conversation"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '6px 10px', fontSize: '11px', fontWeight: 600, fontFamily: tokens.font.sans,
                border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
                background: tokens.colors.white, color: tokens.colors.textSecondary,
                cursor: sending || startingNew ? 'default' : 'pointer', opacity: sending ? 0.6 : 1,
                flexShrink: 0, whiteSpace: 'nowrap',
              }}
            >
              <IconPencilPlus size={13} color={tokens.colors.textSecondary} />
              {startingNew ? '…' : 'New'}
            </button>
            <CopyButton text={conversationText} size={14} title="Copy the whole conversation" />
          </>
        )}
      />

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
        {messages.map(m => m.role === 'user' ? (
          <div key={m.id} style={{ ...s.userMsg, whiteSpace: 'pre-wrap' }}>{m.content}</div>
        ) : m.isError ? (
          <div key={m.id} style={s.aiMsg}>
            <div role="alert" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start',
              color: tokens.colors.error, fontSize: '13px' }}>
              <IconAlertCircle size={16} color={tokens.colors.error} style={{ marginTop: '2px' }} />
              <span>{m.content}</span>
            </div>
          </div>
        ) : (
          <div key={m.id} style={{ marginBottom: '12px' }}>
            <div style={{ ...s.aiMsg, marginBottom: '4px' }}>
              <MarkdownRenderer content={m.content} />
            </div>
            {/* Sources + copy */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '90%', paddingLeft: '4px' }}>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
                {m.sources?.map((src, j) => (
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
              <CopyButton text={m.content} size={13} title="Copy answer" />
            </div>
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
