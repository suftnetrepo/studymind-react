import React, { useMemo, useState, useSyncExternalStore } from 'react'
import { StudyMindProvider, useStudyMind } from './context'
import { TutorTab }      from './tabs/TutorTab'
import { QuizTab }       from './tabs/QuizTab'
import { FlashcardsTab } from './tabs/FlashcardsTab'
import { SummaryTab }    from './tabs/SummaryTab'
import { s, tokens, themeVars } from './styles'
import type { StudyMindConfig, StudyMindPanelProps, TabId } from './types'

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'tutor',      label: 'AI Tutor',   emoji: '💬' },
  { id: 'quiz',       label: 'Quiz',       emoji: '📝' },
  { id: 'flashcards', label: 'Flashcards', emoji: '🃏' },
  { id: 'summary',    label: 'Summary',    emoji: '📋' },
]

declare const process: { env: Record<string, string | undefined> }

// Each read is a literal `process.env.X` so Next.js can inline it at build time;
// the try/catch covers bundlers where `process` is not defined (e.g. Vite).
function envConfig(): StudyMindConfig {
  let apiKey = ''
  let apiUrl: string | undefined
  try { apiKey = process.env.NEXT_PUBLIC_STUDYMIND_API_KEY || '' } catch { /* no process */ }
  try { apiUrl = process.env.NEXT_PUBLIC_STUDYMIND_API_URL || undefined } catch { /* no process */ }
  return { apiKey, apiUrl }
}

const DARK_QUERY = '(prefers-color-scheme: dark)'

function subscribeColorScheme(cb: () => void) {
  const mq = window.matchMedia(DARK_QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

function useResolvedTheme(theme: 'light' | 'dark' | 'auto'): 'light' | 'dark' {
  const prefersDark = useSyncExternalStore(
    subscribeColorScheme,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,  // server render: light
  )
  if (theme === 'auto') return prefersDark ? 'dark' : 'light'
  return theme
}

function PanelInner() {
  const [activeTab, setActiveTab] = useState<TabId>('tutor')
  const { isReady, isLoading, error } = useStudyMind()

  return (
    <>
      <div style={s.header}>
        <span style={{ fontSize: '18px' }} aria-hidden>📚</span>
        <h2 style={s.headerTitle}>StudyMind AI</h2>
        <span style={s.headerBadge}>
          {isLoading ? 'Indexing…' : isReady ? 'Ready' : 'Error'}
        </span>
      </div>

      <div style={s.tabs} role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            style={s.tab(activeTab === tab.id)}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={{ fontSize: '16px' }} aria-hidden>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div style={s.content} role="tabpanel">
        {isLoading ? (
          <div style={{ ...s.scrollArea, textAlign: 'center', paddingTop: '48px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
            <p style={{ color: tokens.colors.textSecondary, fontSize: '14px' }}>
              Indexing course content…
            </p>
            <p style={{ color: tokens.colors.textMuted, fontSize: '12px' }}>
              This only happens once
            </p>
          </div>
        ) : error ? (
          <div style={{ ...s.scrollArea, textAlign: 'center', paddingTop: '48px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <p role="alert" style={{ color: tokens.colors.error, fontSize: '14px' }}>{error}</p>
          </div>
        ) : (
          <>
            {activeTab === 'tutor'      && <TutorTab />}
            {activeTab === 'quiz'       && <QuizTab />}
            {activeTab === 'flashcards' && <FlashcardsTab />}
            {activeTab === 'summary'    && <SummaryTab />}
          </>
        )}
      </div>
    </>
  )
}

export function StudyMindPanel({
  courseId, userId, userRole = 'student',
  courseData, config, theme = 'light', className, onReady, onError,
}: StudyMindPanelProps) {
  const resolvedConfig = useMemo(
    () => config ?? envConfig(),
    [config?.apiKey, config?.apiUrl],  // eslint-disable-line react-hooks/exhaustive-deps
  )
  const mode = useResolvedTheme(theme)

  return (
    <div className={className} style={{ ...themeVars(mode), ...s.panel }} data-theme={mode}>
      <StudyMindProvider
        courseId={courseId}
        userId={userId}
        userRole={userRole}
        courseData={courseData}
        config={resolvedConfig}
        onReady={onReady}
        onError={onError}
      >
        <PanelInner />
      </StudyMindProvider>
    </div>
  )
}
