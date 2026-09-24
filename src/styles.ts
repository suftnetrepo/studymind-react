// Design tokens — no Tailwind dependency, pure inline styles.
// Colours are CSS custom properties so the panel can switch light/dark
// by setting the variables on its root element (see themeVars).
import type { CSSProperties } from 'react'

type Palette = Record<
  | 'primary' | 'primaryBg' | 'navy' | 'white' | 'onPrimary' | 'bgCard' | 'bgMuted' | 'border'
  | 'textPrimary' | 'textSecondary' | 'textMuted'
  | 'success' | 'successBg' | 'error' | 'errorBg' | 'warning'
  | 'codeBg' | 'codeText' | 'codeBlockBg',
  string
>

export const palettes: Record<'light' | 'dark', Palette> = {
  light: {
    primary:       '#5B7FFF',
    primaryBg:     '#EEF2FF',
    navy:          '#0F1629',
    white:         '#FFFFFF',
    onPrimary:     '#FFFFFF',
    bgCard:        '#FFFFFF',
    bgMuted:       '#F8FAFC',
    border:        '#E2E8F0',
    textPrimary:   '#0F172A',
    textSecondary: '#64748B',
    textMuted:     '#94A3B8',
    success:       '#10B981',
    successBg:     '#ECFDF5',
    error:         '#EF4444',
    errorBg:       '#FEF2F2',
    warning:       '#F59E0B',
    codeBg:        '#F1F5F9',
    codeText:      '#E11D48',
    codeBlockBg:   '#1E293B',
  },
  dark: {
    primary:       '#7B97FF',
    primaryBg:     '#1E2748',
    navy:          '#0B1020',
    white:         '#161D30',  // "surface" in dark mode
    onPrimary:     '#FFFFFF',
    bgCard:        '#111827',
    bgMuted:       '#1A2236',
    border:        '#2A3450',
    textPrimary:   '#E5E9F5',
    textSecondary: '#A0AAC4',
    textMuted:     '#6B7694',
    success:       '#34D399',
    successBg:     '#0F2E25',
    error:         '#F87171',
    errorBg:       '#3A1A1D',
    warning:       '#FBBF24',
    codeBg:        '#0B1020',
    codeText:      '#FB7185',
    codeBlockBg:   '#0B1020',
  },
}

const cssVar = (name: string) => `--sm-${name.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}`

export function themeVars(mode: 'light' | 'dark'): CSSProperties {
  const p = palettes[mode]
  return Object.fromEntries(
    Object.entries(p).map(([k, v]) => [cssVar(k), v]),
  ) as CSSProperties
}

export const tokens = {
  colors: Object.fromEntries(
    Object.keys(palettes.light).map(k => [k, `var(${cssVar(k)})`]),
  ) as Palette,
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
  },
  shadow: {
    sm: '0 1px 3px rgba(0,0,0,0.08)',
    md: '0 4px 16px rgba(0,0,0,0.10)',
  },
  font: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
}

const c = tokens.colors

export const s = {
  panel: {
    fontFamily:    tokens.font.sans,
    background:    c.bgCard,
    color:         c.textPrimary,
    border:        `1px solid ${c.border}`,
    borderRadius:  tokens.radius.xl,
    boxShadow:     tokens.shadow.md,
    display:       'flex',
    flexDirection: 'column',
    overflow:      'hidden',
    height:        '600px',
    minWidth:      '320px',
    maxWidth:      '480px',
    width:         '100%',
    boxSizing:     'border-box',
  },
  header: {
    background: c.navy,
    padding:    '16px 20px',
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
    flexShrink: 0,
  },
  headerTitle: {
    color:      '#FFFFFF',
    fontSize:   '15px',
    fontWeight: 700,
    margin:     0,
  },
  tabs: {
    display:      'flex',
    borderBottom: `1px solid ${c.border}`,
    background:   c.bgMuted,
    flexShrink:   0,
  },
  tab: (active: boolean): CSSProperties => ({
    flex:          1,
    padding:       '10px 4px',
    fontSize:      '11px',
    fontWeight:    active ? 700 : 500,
    fontFamily:    tokens.font.sans,
    color:         active ? c.primary : c.textSecondary,
    background:    active ? c.white : 'transparent',
    border:        'none',
    borderBottom:  active ? `2px solid ${c.primary}` : '2px solid transparent',
    cursor:        'pointer',
    transition:    'all 0.15s',
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    gap:           '2px',
  }),
  content: {
    flex:          1,
    minHeight:     0,
    overflow:      'hidden',
    display:       'flex',
    flexDirection: 'column',
  },
  scrollArea: {
    flex:      1,
    overflowY: 'auto',
    padding:   '16px',
  },
  inputRow: {
    padding:    '12px 16px',
    borderTop:  `1px solid ${c.border}`,
    display:    'flex',
    gap:        '8px',
    background: c.white,
    flexShrink: 0,
  },
  input: {
    flex:         1,
    border:       `1px solid ${c.border}`,
    borderRadius: tokens.radius.md,
    padding:      '10px 14px',
    fontSize:     '14px',
    outline:      'none',
    fontFamily:   tokens.font.sans,
    resize:       'none',
    background:   c.bgMuted,
    color:        c.textPrimary,
  },
  sendBtn: {
    background:   c.primary,
    color:        c.onPrimary,
    border:       'none',
    borderRadius: tokens.radius.md,
    padding:      '10px 14px',
    cursor:       'pointer',
    fontSize:     '14px',
    fontWeight:   600,
    flexShrink:   0,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  userMsg: {
    background:   c.primary,
    color:        c.onPrimary,
    borderRadius: '14px 14px 4px 14px',
    padding:      '10px 14px',
    fontSize:     '14px',
    marginBottom: '12px',
    marginLeft:   'auto',
    maxWidth:     '80%',
    width:        'fit-content',
    wordBreak:    'break-word',
  },
  aiMsg: {
    background:   c.bgMuted,
    color:        c.textPrimary,
    borderRadius: '14px 14px 14px 4px',
    padding:      '10px 14px',
    fontSize:     '14px',
    marginBottom: '12px',
    maxWidth:     '90%',
    width:        'fit-content',
    lineHeight:   1.5,
    wordBreak:    'break-word',
    minWidth:     0,
  },
  card: {
    background:   c.bgMuted,
    borderRadius: tokens.radius.md,
    padding:      '14px',
    marginBottom: '10px',
    border:       `1px solid ${c.border}`,
  },
  btn: (variant: 'primary' | 'outline' = 'primary'): CSSProperties => ({
    background:   variant === 'primary' ? c.primary : 'transparent',
    color:        variant === 'primary' ? c.onPrimary : c.primary,
    border:       `1px solid ${c.primary}`,
    borderRadius: tokens.radius.md,
    padding:      '10px 20px',
    cursor:       'pointer',
    fontSize:     '14px',
    fontWeight:   600,
    fontFamily:   tokens.font.sans,
    transition:   'opacity 0.15s',
    width:        '100%',
    marginTop:    '8px',
  }),
  label: {
    fontSize:      '11px',
    fontWeight:    700,
    color:         c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom:  '8px',
    display:       'block',
  },
} satisfies Record<string, CSSProperties | ((...args: never[]) => CSSProperties)>
