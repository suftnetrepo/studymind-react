import React, { useMemo, useState, useSyncExternalStore } from 'react'
import { StudyMindProvider, useStudyMind } from './context'
import { TutorTab }      from './tabs/TutorTab'
import { QuizTab }       from './tabs/QuizTab'
import { FlashcardsTab } from './tabs/FlashcardsTab'
import { SummaryTab }    from './tabs/SummaryTab'
import { MaterialsTab }  from './tabs/MaterialsTab'
import { s, tokens, themeVars } from './styles'
import {
  IconMessageCircle, IconClipboardList, IconLayers, IconFileText, IconFolder,
  IconBook, IconAlertCircle, Spinner, StatusDot, type IconProps,
} from './icons'
import type { StudyMindConfig, StudyMindPanelProps, TabId } from './types'

type Tab = { id: TabId; label: string; Icon: (props: IconProps) => React.ReactElement }

const TABS: Tab[] = [
  { id: 'tutor',      label: 'AI Tutor',   Icon: IconMessageCircle },
  { id: 'quiz',       label: 'Quiz',       Icon: IconClipboardList },
  { id: 'flashcards', label: 'Flashcards', Icon: IconLayers        },
  { id: 'summary',    label: 'Summary',    Icon: IconFileText      },
]
const MATERIALS_TAB: Tab = { id: 'materials', label: 'Materials', Icon: IconFolder }

// Header is navy in both themes, so the status colours are fixed
const STATUS_COLOR = { loading: '#F59E0B', ready: '#10B981', error: '#EF4444' }

// UI gating only — the API also rejects uploads from student session tokens
const canManageMaterials = (role: string) => role === 'tutor' || role === 'admin'

declare const process: { env: Record<string, string | undefined> }

// Env vars: NEXT_PUBLIC_STUDYMIND_API_URL (all modes) and NEXT_PUBLIC_STUDYMIND_API_KEY (dev only).
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
  const { isReady, isLoading, error, userRole } = useStudyMind()
  const tabs = canManageMaterials(userRole) ? [...TABS, MATERIALS_TAB] : TABS

  return (
    <>
      <div style={s.header}>
        <IconBook size={20} color="#A3BFFF" />
        <h2 style={s.headerTitle}>StudyMind AI</h2>
        <span style={{ marginLeft: 'auto' }} role="status">
          <StatusDot
            color={isLoading ? STATUS_COLOR.loading : isReady ? STATUS_COLOR.ready : STATUS_COLOR.error}
            label={isLoading ? 'Indexing' : isReady ? 'Ready' : 'Error'}
            background="rgba(255,255,255,0.1)"
          />
        </span>
      </div>

      <div style={s.tabs} role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            style={s.tab(activeTab === tab.id)}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.Icon
              size={17}
              color={activeTab === tab.id ? tokens.colors.primary : tokens.colors.textMuted}
            />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div style={s.content} role="tabpanel">
        {isLoading ? (
          <div style={{ ...s.scrollArea, textAlign: 'center', paddingTop: '48px' }}>
            <Spinner size={32} color={tokens.colors.primary} />
            <p style={{ color: tokens.colors.textSecondary, fontSize: '14px' }}>
              Indexing course content…
            </p>
            <p style={{ color: tokens.colors.textMuted, fontSize: '12px' }}>
              This only happens once
            </p>
          </div>
        ) : error ? (
          <div style={{ ...s.scrollArea, textAlign: 'center', paddingTop: '48px' }}>
            <IconAlertCircle size={32} color={tokens.colors.error} style={{ margin: '0 auto 12px', display: 'block' }} />
            <p role="alert" style={{ color: tokens.colors.error, fontSize: '14px' }}>{error}</p>
          </div>
        ) : (
          <>
            {activeTab === 'tutor'      && <TutorTab />}
            {activeTab === 'quiz'       && <QuizTab />}
            {activeTab === 'flashcards' && <FlashcardsTab />}
            {activeTab === 'summary'    && <SummaryTab />}
            {activeTab === 'materials'  && canManageMaterials(userRole) && <MaterialsTab />}
          </>
        )}
      </div>
    </>
  )
}

export function StudyMindPanel({
  courseId, userId, userRole = 'student',
  courseData, sessionToken, config, apiUrl, theme = 'light', className, onReady, onError,
}: StudyMindPanelProps) {
  // Env vars are a dev fallback only, used when neither sessionToken nor config is given
  const resolvedConfig = useMemo(
    () => config ?? (sessionToken ? undefined : envConfig()),
    [config?.apiKey, config?.apiUrl, sessionToken],  // eslint-disable-line react-hooks/exhaustive-deps
  )
  const resolvedApiUrl = apiUrl ?? resolvedConfig?.apiUrl ?? envConfig().apiUrl
  const mode = useResolvedTheme(theme)

  return (
    <div className={className} style={{ ...themeVars(mode), ...s.panel }} data-theme={mode}>
      <StudyMindProvider
        courseId={courseId}
        userId={userId}
        userRole={userRole}
        courseData={courseData}
        sessionToken={sessionToken}
        config={resolvedConfig}
        apiUrl={resolvedApiUrl}
        onReady={onReady}
        onError={onError}
      >
        <PanelInner />
      </StudyMindProvider>
    </div>
  )
}
