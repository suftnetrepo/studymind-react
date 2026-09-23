import React, { useState } from 'react'
import { useStudyMind } from '../context'
import { s, tokens } from '../styles'
import { EmptyState } from './EmptyState'
import type { Flashcard } from '../types'

export function FlashcardsTab() {
  const { client, courseId, userId } = useStudyMind()
  const [cards,   setCards]   = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(false)
  const [index,   setIndex]   = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await client.generateFlashcards(courseId, userId, 20)
      setCards(res.cards)
      setIndex(0)
      setFlipped(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate flashcards')
    } finally {
      setLoading(false)
    }
  }

  const card = cards[index]
  if (!card) {
    return (
      <div style={s.scrollArea}>
        <EmptyState
          emoji="🃏" text="Generate flashcards to memorise key concepts"
          error={error} buttonLabel="Generate Flashcards" loading={loading} onClick={generate}
        />
      </div>
    )
  }

  const go = (delta: number) => {
    setIndex(i => Math.min(cards.length - 1, Math.max(0, i + delta)))
    setFlipped(false)
  }

  return (
    <div style={s.scrollArea}>
      <p style={{ textAlign: 'center', fontSize: '12px',
        color: tokens.colors.textMuted, marginBottom: '16px' }}>
        {index + 1} / {cards.length}
      </p>
      <button
        onClick={() => setFlipped(f => !f)}
        aria-label={flipped ? 'Show question' : 'Reveal answer'}
        style={{
          ...s.card,
          width: '100%', minHeight: '180px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', textAlign: 'center',
          fontFamily: tokens.font.sans,
          background:  flipped ? tokens.colors.primaryBg : tokens.colors.bgMuted,
          borderColor: flipped ? tokens.colors.primary : tokens.colors.border,
          transition: 'all 0.2s',
        }}
      >
        <div>
          <p style={{ fontSize: '11px', color: tokens.colors.textMuted,
            marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {flipped ? 'Answer' : 'Question'}
          </p>
          <p style={{ fontSize: '16px', fontWeight: 600,
            color: tokens.colors.textPrimary, margin: 0, lineHeight: 1.4 }}>
            {flipped ? card.back : card.front}
          </p>
          <p style={{ fontSize: '11px', color: tokens.colors.textMuted,
            marginTop: '12px', marginBottom: 0 }}>
            Tap to {flipped ? 'see question' : 'reveal answer'}
          </p>
        </div>
      </button>
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          style={{ ...s.btn('outline'), marginTop: 0, opacity: index === 0 ? 0.5 : 1 }}
          onClick={() => go(-1)}
          disabled={index === 0}
        >← Prev</button>
        <button
          style={{ ...s.btn(), marginTop: 0, opacity: index === cards.length - 1 ? 0.5 : 1 }}
          onClick={() => go(1)}
          disabled={index === cards.length - 1}
        >Next →</button>
      </div>
      {error && <p role="alert" style={{ color: tokens.colors.error, fontSize: '13px' }}>{error}</p>}
      <button style={s.btn('outline')} onClick={generate} disabled={loading}>
        {loading ? 'Generating…' : 'Generate New Set'}
      </button>
    </div>
  )
}
