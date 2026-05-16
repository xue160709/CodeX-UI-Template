import type { RefObject } from 'react'
import { IconInline } from '../../icon-inline'
import { useI18n } from '../../i18n/i18n'
import type { TranscriptItem } from '../types'
import { Transcript } from './Transcript'

type ChatConversationProps = {
  items: TranscriptItem[]
  scrollRegionRef: RefObject<HTMLDivElement | null>
  showScrollButton: boolean
  onScrollToBottom: (behavior: ScrollBehavior) => void
}

export function ChatConversation({
  items,
  scrollRegionRef,
  showScrollButton,
  onScrollToBottom,
}: ChatConversationProps) {
  const { t } = useI18n()

  return (
    <>
      <div className="chat-scroll-region" id="chat-scroll-region" ref={scrollRegionRef}>
        <div className="chat-transcript" id="chat-transcript" aria-live="polite">
          <Transcript items={items} />
        </div>
      </div>
      <button
        type="button"
        className="btn btn-scroll-bottom"
        id="btn-scroll-bottom"
        title={t('chat.scrollBottomTitle')}
        aria-label={t('chat.scrollBottomAria')}
        aria-hidden={!showScrollButton}
        tabIndex={showScrollButton ? 0 : -1}
        data-visible={showScrollButton || undefined}
        onClick={() => onScrollToBottom('smooth')}
      >
        <IconInline name="arrowDown" />
      </button>
    </>
  )
}
