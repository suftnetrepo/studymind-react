import React from 'react'
import { tokens } from '../styles'
import type { SectionData, Complexity } from '../types'
import { complexityLabel } from './ComplexitySelector'

interface Props {
  sections: SectionData[]
  value:    string   // '' = all content
  onChange: (topic: string) => void
  label?:   string
  disabled?: boolean
}

// <option> ignores most styling and collapses leading spaces, so indent with non-breaking spaces
const INDENT = '    '

/** Section/lecture picker that scopes Quiz, Flashcards and Summary to part of the course. */
export function TopicSelector({ sections, value, onChange, label, disabled }: Props) {
  if (!sections || sections.length === 0) return null

  const options: { value: string; label: string }[] = [{ value: '', label: 'All content' }]
  sections.forEach((section, si) => {
    options.push({ value: section.title, label: `${si + 1}. ${section.title}` })
    section.lectures.forEach((lecture, li) => {
      options.push({ value: lecture.title, label: `${INDENT}${si + 1}.${li + 1} ${lecture.title}` })
    })
  })

  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          '8px',
      padding:      '10px 14px',
      borderBottom: `1px solid ${tokens.colors.border}`,
      background:   tokens.colors.bgMuted,
      flexShrink:   0,
    }}>
      {label && (
        <label
          htmlFor="studymind-topic"
          style={{
            fontSize:      '10px',
            fontWeight:    700,
            color:         tokens.colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            whiteSpace:    'nowrap',
          }}
        >
          {label}
        </label>
      )}
      <select
        id="studymind-topic"
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        style={{
          flex:         1,
          minWidth:     0,
          padding:      '7px 10px',
          fontSize:     '12px',
          fontFamily:   tokens.font.sans,
          border:       `1px solid ${tokens.colors.border}`,
          borderRadius: tokens.radius.md,
          background:   tokens.colors.white,
          color:        tokens.colors.textPrimary,
          cursor:       disabled ? 'default' : 'pointer',
          outline:      'none',
        }}
      >
        {options.map((opt, i) => (
          <option key={i} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

/**
 * Note above generated results saying what they were generated for, e.g.
 * "Scoped to: Control Flow · Expert". Renders nothing for all content at normal complexity.
 */
export function ScopeNote({ topic, complexity, prefix = 'Scoped to' }: {
  topic:       string
  complexity?: Complexity
  prefix?:     string
}) {
  const level = complexity && complexity !== 'normal' ? complexityLabel(complexity) : ''
  if (!topic && !level) return null
  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          '6px',
      fontSize:     '11px',
      color:        tokens.colors.textSecondary,
      marginBottom: '12px',
      padding:      '6px 10px',
      background:   tokens.colors.bgMuted,
      borderRadius: tokens.radius.sm,
    }}>
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, color: tokens.colors.primary }}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      <span>
        {topic && <>{prefix}: <strong style={{ color: tokens.colors.textPrimary }}>{topic}</strong></>}
        {topic && level && ' · '}
        {level && <strong style={{ color: tokens.colors.textPrimary }}>{level}</strong>}
      </span>
    </div>
  )
}
