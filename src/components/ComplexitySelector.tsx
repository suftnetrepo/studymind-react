import React from 'react'
import { tokens } from '../styles'
import type { Complexity } from '../types'

const LEVELS: { value: Complexity; label: string; color: string; bg: string }[] = [
  { value: 'simple', label: 'Simple', color: tokens.colors.success, bg: tokens.colors.successBg },
  { value: 'normal', label: 'Normal', color: tokens.colors.primary, bg: tokens.colors.primaryBg },
  { value: 'expert', label: 'Expert', color: tokens.colors.error,   bg: tokens.colors.errorBg   },
]

export const complexityLabel = (c: Complexity) => LEVELS.find(l => l.value === c)?.label ?? c

/** Simple / Normal / Expert pills — shared by AI Tutor, Quiz, Flashcards and Summary. */
export function ComplexitySelector({ value, onChange, disabled }: {
  value:     Complexity
  onChange:  (value: Complexity) => void
  disabled?: boolean
}) {
  return (
    <div role="radiogroup" aria-label="Complexity" style={{
      display:      'flex',
      gap:          '6px',
      padding:      '10px 14px',
      borderBottom: `1px solid ${tokens.colors.border}`,
      background:   tokens.colors.bgMuted,
      flexShrink:   0,
    }}>
      {LEVELS.map(level => {
        const active = value === level.value
        return (
          <button
            key={level.value}
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(level.value)}
            style={{
              flex:           1,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '5px',
              padding:        '6px 4px',
              fontSize:       '11px',
              fontWeight:     active ? 700 : 500,
              fontFamily:     tokens.font.sans,
              borderRadius:   tokens.radius.md,
              border:         `1px solid ${active ? level.color : tokens.colors.border}`,
              background:     active ? level.bg : tokens.colors.white,
              color:          active ? level.color : tokens.colors.textSecondary,
              cursor:         disabled ? 'default' : 'pointer',
              transition:     'all 0.15s',
            }}
          >
            <span aria-hidden style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: active ? level.color : tokens.colors.border,
            }} />
            {level.label}
          </button>
        )
      })}
    </div>
  )
}
