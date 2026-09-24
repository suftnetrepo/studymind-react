import React from 'react'

// Inline SVG icons (Lucide/Feather outlines) — keeps the package dependency-free.
// Decorative by default: pair them with visible text or an aria-label on the control.

export interface IconProps {
  size?:  number
  color?: string
  style?: React.CSSProperties
}

function Svg({ size = 18, color, style, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false"
      // Colour via CSS `color` (not the stroke attribute) so theme tokens like var(--sm-…) work
      style={{ flexShrink: 0, color, ...style }}
    >
      {children}
    </svg>
  )
}

export function IconMessageCircle(props: IconProps) {
  return <Svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg>
}

export function IconClipboardList(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
    </Svg>
  )
}

export function IconLayers(props: IconProps) {
  return (
    <Svg {...props}>
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </Svg>
  )
}

export function IconFileText(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </Svg>
  )
}

export function IconFolder(props: IconProps) {
  return <Svg {...props}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></Svg>
}

export function IconUpload(props: IconProps) {
  return (
    <Svg {...props}>
      <polyline points="16 16 12 12 8 16"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </Svg>
  )
}

export function IconTrash({ size = 16, ...props }: IconProps) {
  return (
    <Svg size={size} {...props}>
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </Svg>
  )
}

export function IconRefreshCw({ size = 16, ...props }: IconProps) {
  return (
    <Svg size={size} {...props}>
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </Svg>
  )
}

export function IconSend(props: IconProps) {
  return (
    <Svg {...props}>
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </Svg>
  )
}

export function IconAlertCircle({ size = 16, ...props }: IconProps) {
  return (
    <Svg size={size} {...props}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </Svg>
  )
}

export function IconBook({ size = 20, ...props }: IconProps) {
  return (
    <Svg size={size} {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </Svg>
  )
}

export function IconX({ size = 14, ...props }: IconProps) {
  return (
    <Svg size={size} {...props}>
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </Svg>
  )
}

/** CSS spinner. Inline styles can't declare keyframes, so it ships its own (namespaced). */
export function Spinner({ size = 32, color, trackColor = 'rgba(91,127,255,0.2)' }: {
  size?: number; color: string; trackColor?: string
}) {
  const border = Math.max(2, Math.round(size / 10))
  return (
    <>
      <style>{'@keyframes studymind-spin{to{transform:rotate(360deg)}}'}</style>
      <div
        role="status"
        aria-label="Loading"
        style={{
          width: size, height: size, boxSizing: 'border-box',
          border: `${border}px solid ${trackColor}`, borderTopColor: color,
          borderRadius: '50%', animation: 'studymind-spin 1s linear infinite',
          margin: '0 auto 12px',
        }}
      />
    </>
  )
}

/** Small coloured status dot + label, e.g. "Ready", "Indexing". */
export function StatusDot({ color, label, background }: { color: string; label: string; background?: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '10px', fontWeight: 700, color, whiteSpace: 'nowrap',
      background, padding: background ? '3px 10px' : 0, borderRadius: '20px',
    }}>
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </span>
  )
}
