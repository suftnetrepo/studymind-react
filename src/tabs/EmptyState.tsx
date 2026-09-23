import React from 'react'
import { s, tokens } from '../styles'

interface Props {
  emoji:       string
  text:        string
  error:       string | null
  buttonLabel: string
  loading:     boolean
  onClick:     () => void
}

export function EmptyState({ emoji, text, error, buttonLabel, loading, onClick }: Props) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{emoji}</div>
      <p style={{ color: tokens.colors.textSecondary, fontSize: '14px' }}>{text}</p>
      {error && (
        <p role="alert" style={{ color: tokens.colors.error, fontSize: '13px' }}>{error}</p>
      )}
      <button
        style={{ ...s.btn(), opacity: loading ? 0.6 : 1 }}
        onClick={onClick}
        disabled={loading}
      >
        {loading ? 'Generating…' : buttonLabel}
      </button>
    </div>
  )
}
