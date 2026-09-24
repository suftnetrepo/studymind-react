import React, { useEffect, useRef, useState } from 'react'
import { IconCopy, IconCheck } from '../icons'
import { tokens } from '../styles'

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Clipboard API needs a secure context/permission — fall back to a hidden textarea
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.opacity  = '0'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    if (!ok) throw new Error('Copy failed')
  }
}

/** Icon button (optionally labelled) that copies `text` and shows a check for 2s. */
export function CopyButton({ text, size = 14, label, title = 'Copy to clipboard' }: {
  text:   string
  size?:  number
  label?: string
  title?: string
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => clearTimeout(timer.current), [])

  async function handleCopy() {
    try {
      await copyText(text)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch { /* nothing sensible to do — leave the button as is */ }
  }

  const color = copied ? tokens.colors.success : tokens.colors.textMuted
  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : title}
      aria-label={copied ? 'Copied' : title}
      style={{
        background:   'none',
        border:       'none',
        cursor:       'pointer',
        padding:      '3px 4px',
        borderRadius: '4px',
        color,
        fontSize:     '11px',
        fontWeight:   600,
        fontFamily:   tokens.font.sans,
        transition:   'color 0.15s',
        display:      'inline-flex',
        alignItems:   'center',
        gap:          '4px',
      }}
    >
      {copied ? <IconCheck size={size} color={color} /> : <IconCopy size={size} color={color} />}
      {label && <span aria-live="polite">{copied ? 'Copied' : label}</span>}
    </button>
  )
}
