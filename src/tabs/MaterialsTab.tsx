import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useStudyMind } from '../context'
import { s, tokens } from '../styles'
import type { CourseDocument, DocumentStatus } from '../api'

const ACCEPT        = '.pdf,.docx,.txt,.md'
const ALLOWED_EXT   = ['pdf', 'docx', 'txt', 'md']
const MAX_BYTES     = 20 * 1024 * 1024
const POLL_INTERVAL = 3000

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Client-side check so users get instant feedback; the server enforces the same rules. */
function validate(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXT.includes(ext)) return `"${file.name}": unsupported type (PDF, DOCX, TXT, MD only)`
  if (file.size > MAX_BYTES)      return `"${file.name}": larger than 20MB`
  if (file.size === 0)            return `"${file.name}": file is empty`
  return null
}

const STATUS: Record<DocumentStatus, { color: string; label: string }> = {
  ready:    { color: tokens.colors.success, label: '✅ Indexed' },
  indexing: { color: tokens.colors.warning, label: '⏳ Indexing…' },
  pending:  { color: tokens.colors.warning, label: '⏳ Queued…' },
  failed:   { color: tokens.colors.error,   label: '❌ Failed' },
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const cfg = STATUS[status] ?? STATUS.pending
  return (
    <span style={{ fontSize: '10px', fontWeight: 700, color: cfg.color, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  )
}

const smallBtn: React.CSSProperties = {
  padding: '6px', fontSize: '11px', fontWeight: 600, fontFamily: tokens.font.sans,
  borderRadius: tokens.radius.sm, cursor: 'pointer',
}

export function MaterialsTab() {
  const { client, courseId, userId } = useStudyMind()
  const [docs,      setDocs]      = useState<CourseDocument[]>([])
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState<{ name: string; pct: number } | null>(null)
  const [dragOver,  setDragOver]  = useState(false)
  const [errors,    setErrors]    = useState<string[]>([])
  const [busyId,    setBusyId]    = useState<string | null>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const replaceRef    = useRef<HTMLInputElement>(null)
  const replaceTarget = useRef<string | null>(null)

  const addError = (msg: string) => setErrors(e => [...e, msg])

  const loadDocs = useCallback(async () => {
    try {
      setDocs(await client.listDocuments(courseId))
    } catch (e: unknown) {
      addError(e instanceof Error ? e.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [client, courseId])

  useEffect(() => { loadDocs() }, [loadDocs])

  // Poll while anything is still being indexed
  const hasPending = docs.some(d => d.status === 'indexing' || d.status === 'pending')
  useEffect(() => {
    if (!hasPending) return
    const timer = setInterval(loadDocs, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [hasPending, loadDocs])

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || uploading) return
    setErrors([])

    for (const file of Array.from(files)) {
      const invalid = validate(file)
      if (invalid) { addError(invalid); continue }

      setUploading({ name: file.name, pct: 0 })
      try {
        const doc = await client.uploadDocument(courseId, userId, file, pct =>
          setUploading({ name: file.name, pct }))
        setDocs(d => [doc, ...d.filter(x => x.id !== doc.id)])
      } catch (e: unknown) {
        addError(`"${file.name}": ${e instanceof Error ? e.message : 'upload failed'}`)
      }
    }

    setUploading(null)
    await loadDocs()
  }

  async function handleDelete(doc: CourseDocument) {
    if (!window.confirm(`Delete "${doc.filename}"? It will be removed from the AI's knowledge.`)) return
    setBusyId(doc.id)
    try {
      await client.deleteDocument(courseId, doc.id)
      setDocs(d => d.filter(x => x.id !== doc.id))
    } catch (e: unknown) {
      addError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReplace(docId: string, file: File) {
    const invalid = validate(file)
    if (invalid) { addError(invalid); return }
    setErrors([])
    setBusyId(docId)
    try {
      const doc = await client.replaceDocument(courseId, docId, file)
      setDocs(d => d.map(x => (x.id === docId ? doc : x)))
    } catch (e: unknown) {
      addError(e instanceof Error ? e.message : 'Replace failed')
    } finally {
      setBusyId(null)
    }
  }

  const openPicker = () => { if (!uploading) fileInputRef.current?.click() }

  return (
    <div style={s.scrollArea}>

      {/* Upload dropzone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload course materials"
        aria-disabled={!!uploading}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files) }}
        onClick={openPicker}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker() } }}
        style={{
          border:       `2px dashed ${dragOver ? tokens.colors.primary : tokens.colors.border}`,
          borderRadius: tokens.radius.lg,
          padding:      '24px 16px',
          textAlign:    'center',
          cursor:       uploading ? 'progress' : 'pointer',
          background:   dragOver ? tokens.colors.primaryBg : tokens.colors.bgMuted,
          transition:   'all 0.2s',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>{uploading ? '⏳' : '📄'}</div>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: tokens.colors.textPrimary }}>
          {uploading
            ? `Uploading ${uploading.name}… ${uploading.pct}%`
            : 'Drop files here or click to upload'}
        </p>
        {uploading ? (
          <div style={{ height: '4px', background: tokens.colors.border, borderRadius: '2px', marginTop: '10px' }}>
            <div style={{ height: '100%', width: `${uploading.pct}%`, background: tokens.colors.primary,
              borderRadius: '2px', transition: 'width 0.2s' }} />
          </div>
        ) : (
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: tokens.colors.textMuted }}>
            PDF, DOCX, TXT, MD · Max 20MB each
          </p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT}
          style={{ display: 'none' }}
          onChange={e => { handleUpload(e.target.files); e.target.value = '' }}
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div role="alert" style={{ background: tokens.colors.errorBg, border: `1px solid ${tokens.colors.error}`,
          borderRadius: tokens.radius.md, padding: '10px 12px', marginBottom: '12px',
          fontSize: '12px', color: tokens.colors.error, display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            {errors.map((err, i) => <div key={i}>⚠️ {err}</div>)}
          </div>
          <button onClick={() => setErrors([])} aria-label="Dismiss"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.colors.error,
              fontSize: '12px', alignSelf: 'flex-start' }}>
            ✕
          </button>
        </div>
      )}

      {/* Document list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: tokens.colors.textMuted, fontSize: '13px' }}>
          Loading…
        </div>
      ) : docs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <p style={{ color: tokens.colors.textSecondary, fontSize: '13px', margin: 0 }}>
            No documents uploaded yet.
          </p>
          <p style={{ color: tokens.colors.textMuted, fontSize: '12px', marginTop: '4px' }}>
            Upload course notes so students can chat with AI.
          </p>
        </div>
      ) : (
        <div>
          <p style={s.label}>Uploaded ({docs.length})</p>
          {docs.map(doc => {
            const busy = busyId === doc.id
            return (
              <div key={doc.id} style={{ ...s.card, display: 'flex', flexDirection: 'column', gap: '8px',
                opacity: busy ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ fontSize: '20px', flexShrink: 0 }} aria-hidden>
                    {doc.format === 'pdf' ? '📕' : doc.format === 'docx' ? '📘' : '📄'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" title={doc.filename}
                      style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: tokens.colors.textPrimary,
                        textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.filename}
                    </a>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: tokens.colors.textMuted }}>
                      {formatBytes(doc.size)}
                      {doc.status === 'ready' && ` · ${doc.chunk_count} chunks`}
                    </p>
                  </div>
                  <StatusBadge status={doc.status} />
                </div>

                {doc.status === 'failed' && doc.error && (
                  <p style={{ margin: 0, fontSize: '11px', color: tokens.colors.error }}>{doc.error}</p>
                )}

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => { replaceTarget.current = doc.id; replaceRef.current?.click() }}
                    disabled={busy}
                    style={{ ...smallBtn, flex: 1, border: `1px solid ${tokens.colors.border}`,
                      background: tokens.colors.white, color: tokens.colors.textSecondary }}
                  >
                    {busy ? 'Working…' : '↻ Replace'}
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={busy}
                    aria-label={`Delete ${doc.filename}`}
                    style={{ ...smallBtn, padding: '6px 10px', border: `1px solid ${tokens.colors.error}`,
                      background: tokens.colors.errorBg, color: tokens.colors.error }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Hidden replace file input */}
      <input
        ref={replaceRef}
        type="file"
        accept={ACCEPT}
        style={{ display: 'none' }}
        onChange={e => {
          const file  = e.target.files?.[0]
          const docId = replaceTarget.current
          if (file && docId) handleReplace(docId, file)
          e.target.value = ''
          replaceTarget.current = null
        }}
      />
    </div>
  )
}
