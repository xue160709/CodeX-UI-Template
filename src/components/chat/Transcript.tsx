/**
 * 会话条目渲染（助手 Markdown、工具卡、思考、活动）。
 * Timeline renderer for messages, tool chips, thinking, and agent activity rows.
 */

import { memo, useEffect, useMemo, useState } from 'react'
import { IconInline } from '../../icon-inline'
import { useI18n } from '../../i18n/i18n'
import type {
  ActivityStatus,
  ChatActivityItem,
  ChatFileDiffItem,
  ChatMessageAttachment,
  ChatMessageItem,
  ChatThinkingItem,
  ChatToolItem,
  ToolStatus,
  TranscriptItem,
} from '../types'
import { AttachmentThumb } from './AttachmentThumb'
import { formatBytes } from './format'
import { escapeHtml, renderMarkdown } from './markdown'

/** Memoized transcript map / Memoized transcript list renderer */
export const Transcript = memo(function Transcript({
  items,
  onReviewFileChanges,
  onRewindFileChanges,
}: {
  items: TranscriptItem[]
  onReviewFileChanges?: (changeSetId: string) => void
  onRewindFileChanges?: (item: ChatFileDiffItem) => void
}) {
  return (
    <>
      {items.map((item) => {
        if (item.type === 'tool') return <ToolRow key={item.id} item={item} />
        if (item.type === 'thinking') return <ThinkingRow key={item.id} item={item} />
        if (item.type === 'activity') return <ActivityRow key={item.id} item={item} />
        if (item.type === 'file_diff') {
          return (
            <FileDiffRow
              key={item.id}
              item={item}
              onReviewFileChanges={onReviewFileChanges}
              onRewindFileChanges={onRewindFileChanges}
            />
          )
        }
        return <ChatMessage key={item.id} item={item} />
      })}
    </>
  )
})

const ChatMessage = memo(function ChatMessage({ item }: { item: ChatMessageItem }) {
  const bodyHtml = useMemo(() => {
    if (item.role === 'assistant') {
      return renderMarkdown(item.content || (item.status === 'streaming' ? '' : ' '))
    }
    return `<p>${escapeHtml(item.content).replace(/\n/g, '<br>')}</p>`
  }, [item.content, item.role, item.status])

  if (item.role === 'assistant' && !item.content.trim() && item.status === 'streaming') return null

  const suffix = item.role === 'assistant' && item.status === 'streaming' ? '<span class="typing-dot"></span>' : ''
  const hasBody = item.content.trim().length > 0 || item.role === 'assistant'
  const attachments = item.attachments ?? []

  return (
    <article className={`chat-message chat-message--${item.role} chat-message--${item.status}`}>
      <div className="chat-message__bubble markdown-body">
        {attachments.length > 0 ? <ChatAttachmentList attachments={attachments} /> : null}
        {hasBody ? <div dangerouslySetInnerHTML={{ __html: bodyHtml + suffix }} /> : null}
      </div>
    </article>
  )
})

const ToolRow = memo(function ToolRow({ item }: { item: ChatToolItem }) {
  const { t } = useI18n()
  const statusLabel: Record<ToolStatus, string> = {
    denied: t('chat.toolDenied'),
    done: t('chat.toolDone'),
    error: t('chat.toolError'),
    running: t('chat.toolRunning'),
  }
  const hasDetails = Boolean(item.detail || item.inputPreview)
  const [isOpen, setIsOpen] = useState(item.status === 'running')

  useEffect(() => {
    setIsOpen(item.status === 'running')
  }, [item.status])

  return (
    <details
      className={`tool-row tool-row--${item.status}`}
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="status-row__summary">
        <span className="status-row__chevron" aria-hidden="true" />
        <span className="tool-row__dot" />
        <span className="tool-row__name">{item.name}</span>
        <span className="tool-row__status">{statusLabel[item.status]}</span>
        {item.detail ? <span className="tool-row__detail">{item.detail}</span> : null}
      </summary>
      {hasDetails ? (
        <div className="status-row__body">
          {item.inputPreview ? <code>{item.inputPreview}</code> : null}
        </div>
      ) : null}
    </details>
  )
})

const ThinkingRow = memo(function ThinkingRow({ item }: { item: ChatThinkingItem }) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(item.status === 'running')

  useEffect(() => {
    setIsOpen(item.status === 'running')
  }, [item.status])

  return (
    <details
      className={`thinking-row thinking-row--${item.status}`}
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="thinking-row__header">
        <span className="status-row__chevron" aria-hidden="true" />
        <span className="thinking-row__dot" />
        <span className="thinking-row__title">{item.title}</span>
        <span className="thinking-row__status">{item.status === 'running' ? t('chat.thinkingRunning') : t('chat.thinkingDone')}</span>
      </summary>
      {item.content ? <pre>{item.content}</pre> : null}
    </details>
  )
})

const ActivityRow = memo(function ActivityRow({ item }: { item: ChatActivityItem }) {
  const { t } = useI18n()
  const statusLabel: Record<ActivityStatus, string> = {
    done: t('chat.activityDone'),
    error: t('chat.activityError'),
    info: t('chat.activityInfo'),
    running: t('chat.activityRunning'),
  }
  const [isOpen, setIsOpen] = useState(item.status === 'running')

  useEffect(() => {
    setIsOpen(item.status === 'running')
  }, [item.status])

  return (
    <details
      className={`activity-row activity-row--${item.status}`}
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="activity-row__main">
        <span className="status-row__chevron" aria-hidden="true" />
        <span className="activity-row__dot" />
        <span className="activity-row__title">{item.title}</span>
        <span className="activity-row__status">{statusLabel[item.status]}</span>
        {item.detail ? <span className="activity-row__detail">{item.detail}</span> : null}
      </summary>
      {item.preview ? <pre>{item.preview}</pre> : null}
    </details>
  )
})

const FileDiffRow = memo(function FileDiffRow({
  item,
  onReviewFileChanges,
  onRewindFileChanges,
}: {
  item: ChatFileDiffItem
  onReviewFileChanges?: (changeSetId: string) => void
  onRewindFileChanges?: (item: ChatFileDiffItem) => void
}) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(item.status === 'captured')
  const additions = item.files.reduce((sum, file) => sum + file.additions, 0)
  const deletions = item.files.reduce((sum, file) => sum + file.deletions, 0)
  const canRewind = Boolean(item.checkpointId && item.status !== 'reverted')
  const canReview = item.status !== 'reviewed' && item.status !== 'reverted'

  useEffect(() => {
    if (item.status === 'captured') setIsOpen(true)
  }, [item.status])

  return (
    <section className={`file-diff-row file-diff-row--${item.status}`} aria-label={t('chat.fileDiffAria')}>
      <div className="file-diff-row__header">
        <span className="file-diff-row__icon" aria-hidden="true">
          <IconInline name="files" />
        </span>
        <div className="file-diff-row__copy">
          <strong>{t('chat.fileDiffTitle', { count: item.files.length })}</strong>
          <button type="button" className="file-diff-row__link" onClick={() => setIsOpen((value) => !value)}>
            {isOpen ? t('chat.fileDiffHide') : t('chat.fileDiffView')}
          </button>
          {item.detail ? <span className="file-diff-row__detail">{item.detail}</span> : null}
        </div>
        <div className="file-diff-row__stats" aria-label={t('chat.fileDiffStats')}>
          <span className="file-diff-row__stat file-diff-row__stat--add">+{additions}</span>
          <span className="file-diff-row__stat file-diff-row__stat--delete">-{deletions}</span>
        </div>
        <div className="file-diff-row__actions">
          <button
            type="button"
            className="btn btn-ghost btn-compact"
            disabled={!canRewind}
            title={canRewind ? t('chat.fileDiffRevert') : t('chat.fileDiffUnavailable')}
            onClick={() => onRewindFileChanges?.(item)}
          >
            <IconInline name="undo" />
            <span>{item.status === 'reverted' ? t('chat.fileDiffReverted') : t('chat.fileDiffRevert')}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-compact"
            disabled={!canReview}
            onClick={() => onReviewFileChanges?.(item.changeSetId)}
          >
            <IconInline name="check" />
            <span>{item.status === 'reviewed' ? t('chat.fileDiffReviewed') : t('chat.fileDiffReview')}</span>
          </button>
        </div>
      </div>
      {isOpen ? (
        <div className="file-diff-row__body">
          {item.files.length > 0 ? (
            item.files.map((file, index) => (
              <details className="file-diff-file" key={`${file.path}-${index}`} open={index === 0}>
                <summary className="file-diff-file__summary">
                  <span>{file.relativePath || file.path}</span>
                  <span className="file-diff-file__stats">
                    <span className="file-diff-row__stat file-diff-row__stat--add">+{file.additions}</span>
                    <span className="file-diff-row__stat file-diff-row__stat--delete">-{file.deletions}</span>
                  </span>
                </summary>
                {file.hunks.length > 0 ? (
                  <div className="file-diff-file__hunks">
                    {file.hunks.map((hunk, hunkIndex) => (
                      <div className="file-diff-hunk" key={`${file.path}-hunk-${hunkIndex}`}>
                        <div className="file-diff-hunk__meta">
                          @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                        </div>
                        {hunk.lines.map((line, lineIndex) => (
                          <div className={`file-diff-line file-diff-line--${line.kind}`} key={`${hunkIndex}-${lineIndex}`}>
                            <span className="file-diff-line__number">{line.oldLineNumber ?? ''}</span>
                            <span className="file-diff-line__number">{line.newLineNumber ?? ''}</span>
                            <code>
                              {line.kind === 'add' ? '+' : line.kind === 'delete' ? '-' : ' '}
                              {line.content}
                            </code>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="file-diff-file__empty">{t('chat.fileDiffEmpty')}</p>
                )}
              </details>
            ))
          ) : (
            <p className="file-diff-file__empty">{t('chat.fileDiffEmpty')}</p>
          )}
        </div>
      ) : null}
    </section>
  )
})

function ChatAttachmentList({ attachments }: { attachments: ChatMessageAttachment[] }) {
  return (
    <div className="chat-message-attachments">
      {attachments.map((attachment) => (
        <div key={attachment.id} className={`chat-message-attachment chat-message-attachment--${attachment.kind}`}>
          <AttachmentThumb attachment={attachment} />
          <span className="chat-message-attachment__copy">
            <span>{attachment.name}</span>
            <span>{attachment.preview || formatBytes(attachment.size)}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
